import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(AQUI, '..', 'scripts', 'seguir-paquete.mjs');
const HOOK = path.join(AQUI, '..', 'hooks', 'avisar-cambios-ux.mjs');

const g = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function escribir(raiz, rel, texto) {
  const p = path.join(raiz, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, texto);
}

// Una KB «remota» con develop y su clon, como en la computadora de Enzo.
function preparar() {
  const base = mkdtempSync(path.join(os.tmpdir(), 'seguir-'));
  const origen = path.join(base, 'origen');
  mkdirSync(origen);
  g(origen, 'init', '-q', '-b', 'develop');
  g(origen, 'config', 'user.email', 't@t');
  g(origen, 'config', 'user.name', 'Prueba');
  escribir(origen, 'design/ux-requirements/UXR-140-x.md', 'tags: [ux-ui, dsp-009]\nv1\n');
  escribir(origen, 'design/ux-requirements/UXR-050-y.md', 'tags: [ux-ui, dsp-005]\nv1\n');
  g(origen, 'add', '-A');
  g(origen, 'commit', '-qm', 'inicial');
  const kb = path.join(base, 'kb');
  g(base, 'clone', '-q', origen, kb);
  return { base, origen, kb, env: { ...process.env, UX_SEGUIMIENTO: path.join(base, 'estado.json'), GITLAB_NPM_TOKEN: '' } };
}

const correr = (env, ...a) => spawnSync('node', [SCRIPT, ...a], { env, encoding: 'utf8' });

function cambiarEnOrigen(origen, rel, texto) {
  escribir(origen, rel, texto);
  g(origen, 'add', '-A');
  g(origen, 'commit', '-qm', 'cambio');
}

test('registrar y revisar sin cambios', () => {
  const { kb, env } = preparar();
  assert.equal(correr(env, 'registrar', '--kb', kb, '--paquete', 'DSP-009').status, 0);
  assert.match(correr(env, 'revisar').stdout, /DSP-009: sin cambios/);
});

test('detecta un UXR del paquete cambiado por otro', () => {
  const { origen, kb, env } = preparar();
  correr(env, 'registrar', '--kb', kb, '--paquete', 'DSP-009');
  cambiarEnOrigen(origen, 'design/ux-requirements/UXR-140-x.md', 'tags: [ux-ui, dsp-009]\nv2\n');
  const r = correr(env, 'revisar', '--fetch');
  assert.match(r.stdout, /DSP-009: 1 artefactos cambiaron/);
  assert.match(r.stdout, /cambiado\s+design\/ux-requirements\/UXR-140-x\.md/);
});

test('ignora los cambios de otro paquete', () => {
  const { origen, kb, env } = preparar();
  correr(env, 'registrar', '--kb', kb, '--paquete', 'DSP-009');
  cambiarEnOrigen(origen, 'design/ux-requirements/UXR-050-y.md', 'tags: [ux-ui, dsp-005]\nv2\n');
  assert.match(correr(env, 'revisar', '--fetch').stdout, /DSP-009: sin cambios/);
});

test('detecta un artefacto nuevo del paquete', () => {
  const { origen, kb, env } = preparar();
  correr(env, 'registrar', '--kb', kb, '--paquete', 'DSP-009');
  cambiarEnOrigen(origen, 'design/screens/SCR-200-z.md', 'tags: [dsp-009]\n');
  assert.match(correr(env, 'revisar', '--fetch').stdout, /nuevo\s+design\/screens\/SCR-200-z\.md/);
});

test('visto deja de avisar lo ya revisado', () => {
  const { origen, kb, env } = preparar();
  correr(env, 'registrar', '--kb', kb, '--paquete', 'DSP-009');
  cambiarEnOrigen(origen, 'design/ux-requirements/UXR-140-x.md', 'tags: [ux-ui, dsp-009]\nv2\n');
  correr(env, 'revisar', '--fetch');
  correr(env, 'visto');
  assert.match(correr(env, 'revisar').stdout, /sin cambios/);
});

test('el hook entrega el aviso como contexto y sale con 0', () => {
  const { origen, kb, env } = preparar();
  correr(env, 'registrar', '--kb', kb, '--paquete', 'DSP-009');
  cambiarEnOrigen(origen, 'design/ux-requirements/UXR-140-x.md', 'tags: [ux-ui, dsp-009]\nv2\n');
  const r = spawnSync('node', [HOOK], { env, encoding: 'utf8' });
  assert.equal(r.status, 0);
  const salida = JSON.parse(r.stdout);
  assert.equal(salida.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(salida.hookSpecificOutput.additionalContext, /UXR-140-x\.md/);
});

test('el hook calla si no hay nada que seguir', () => {
  const { env } = preparar();
  const r = spawnSync('node', [HOOK], { env, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, '');
});

test('registrar rechaza un paquete mal escrito', () => {
  const { kb, env } = preparar();
  assert.equal(correr(env, 'registrar', '--kb', kb, '--paquete', '9').status, 2);
});
