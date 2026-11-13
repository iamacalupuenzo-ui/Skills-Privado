#!/usr/bin/env node
// Pruebas del guardia de la UXS: arma repositorios temporales de verdad (un remoto, develop y una rama ux/*) y envía eventos
// PreToolUse al hook para comprobar su decisión. Uso: node probar-guardia-uxs.mjs  (sale con código 1 si algún caso falla)
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const guardia = join(dirname(fileURLToPath(import.meta.url)), 'guardia-uxs.mjs');
const raizTemp = mkdtempSync(join(tmpdir(), 'guardia-uxs-'));
const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const escribir = (ruta, texto) => { mkdirSync(dirname(ruta), { recursive: true }); writeFileSync(ruta, texto); };

const SCR = (id, flow, paquete) => `---
okf_version: "0.2"
type: Screen
title: "${id} — prueba"
tags: [ux-ui, screen, ${paquete}]
status: draft
screens:
  - id: ${id}
    flow: ${flow}
    requirements: [UXR-901]
    required_states: [default]
    a11y_requirements: [WCAG-2.2-AA]
---
# ${id}
`;
const UXS = (paquete, ids) => `---
okf_version: "0.2"
id: UXS-901
type: UX Design Specification
title: "UXS-901 — prueba"
tags: [ux-design-specification, ${paquete}]
status: draft
sources:
  - id: ${paquete.toUpperCase()}
    resource: /requirements/scope-packs/x.md
---
# UXS-901
${ids.join(' ')}
`;

// Repositorio de diseño con remoto, develop y una rama ux/prueba que agrega una pantalla del paquete DSP-901.
function repo(nombre, { conUxs, rama = 'ux/prueba', etiqueta = 'dsp-901' }) {
  const remoto = join(raizTemp, nombre + '-remoto.git');
  const dir = join(raizTemp, nombre);
  mkdirSync(remoto);
  git(remoto, 'init', '--bare', '-b', 'develop');
  mkdirSync(dir);
  git(dir, 'init', '-b', 'develop');
  escribir(join(dir, 'design/ux-requirements/.gitkeep'), '');
  escribir(join(dir, 'design/specs/.gitkeep'), '');
  escribir(join(dir, 'design/screens/SCR-001-base.md'), SCR('SCR-001', 'FLW-001', 'dsp-900'));
  git(dir, 'add', '-A');
  git(dir, 'commit', '-m', 'base');
  git(dir, 'remote', 'add', 'origin', remoto);
  git(dir, 'push', '-u', 'origin', 'develop');
  git(dir, 'checkout', '-b', rama);
  escribir(join(dir, 'design/screens/SCR-901-prueba.md'), SCR('SCR-901', 'FLW-901', etiqueta));
  if (conUxs) escribir(join(dir, 'design/specs/UXS-901-prueba.md'), UXS(etiqueta, ['SCR-901']));
  git(dir, 'add', '-A');
  git(dir, 'commit', '-m', 'diseno');
  return dir;
}

const sinUxs = repo('sin-uxs', { conUxs: false });
const conUxs = repo('con-uxs', { conUxs: true });
const otraRama = repo('otra-rama', { conUxs: false, rama: 'feature/otra' });
const sinEtiqueta = repo('sin-etiqueta', { conUxs: false, etiqueta: 'captura-recupero' });
const noKb = mkdtempSync(join(raizTemp, 'no-kb-'));
git(noKb, 'init', '-b', 'main');

function decision(cmd, cwd, env = {}) {
  const r = spawnSync('node', [guardia], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: cmd }, cwd }),
    encoding: 'utf8',
    env: { ...process.env, COMSATEL_UX_GUARDIA: '', ...env },
    timeout: 90000,
  });
  if (r.status !== 0) return `error(${r.status}): ${r.stderr}`;
  if (!r.stdout.trim()) return 'allow';
  try { return JSON.parse(r.stdout).hookSpecificOutput.permissionDecision; } catch { return 'ilegible: ' + r.stdout.slice(0, 80); }
}

// [esperado, descripción, comando, cwd, env]
const casos = [
  // Se bloquean: rama ux/* que toca un paquete con pantallas y sin UXS
  ['deny', 'git push de ux/* sin UXS', 'git push origin ux/prueba', sinUxs],
  ['deny', 'con -u', 'git push -u origin ux/prueba', sinUxs],
  ['deny', 'sin argumentos (rama actual)', 'git push', sinUxs],
  ['deny', 'refspec HEAD:ux/*', 'git push origin HEAD:ux/prueba', sinUxs],
  ['deny', 'rama local con otro nombre', 'git push origin ux/prueba:ux/remota', sinUxs],
  ['deny', 'con git -C desde fuera del repo', `git -C "${sinUxs}" push origin ux/prueba`, noKb],
  ['deny', 'después de un cd', `cd "${sinUxs}" && git push origin ux/prueba`, noKb],
  ['deny', 'con el envoltorio git-auth', `node git-auth.mjs "${sinUxs}" push origin ux/prueba`, noKb],
  // Piden confirmar con el modo aviso
  ['ask', 'modo aviso', 'git push origin ux/prueba', sinUxs, { COMSATEL_UX_GUARDIA: 'aviso' }],
  // Pasan sin ruido
  ['allow', 'ux/* con la UXS del paquete', 'git push origin ux/prueba', conUxs],
  ['allow', 'rama que no es ux/*', 'git push origin feature/otra', otraRama],
  ['allow', 'artefactos sin etiqueta dsp-NNN (no los ve el control)', 'git push origin ux/prueba', sinEtiqueta],
  ['allow', 'dry-run', 'git push --dry-run origin ux/prueba', sinUxs],
  ['allow', 'borrar una rama remota', 'git push --delete origin ux/prueba', sinUxs],
  ['allow', 'fuera de un repositorio de diseño', 'git push origin ux/prueba', noKb],
  ['allow', 'modo off', 'git push origin ux/prueba', sinUxs, { COMSATEL_UX_GUARDIA: 'off' }],
  ['allow', 'otros comandos de git', 'git status', sinUxs],
  ['allow', 'texto de un mensaje de commit que dice git push', 'git commit -m "no hagas git push origin ux/prueba sin UXS"', sinUxs],
  ['allow', 'origen distinto de la rama actual', 'git push origin feature/otra:ux/otra', sinUxs],
];

let fallos = 0;
for (const [esperado, desc, cmd, cwd, env] of casos) {
  const obtenido = decision(cmd, cwd, env);
  const ok = obtenido === esperado;
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK ' : 'FALLA'} [${esperado}] ${desc}${ok ? '' : `  → obtuvo ${obtenido}`}`);
}
rmSync(raizTemp, { recursive: true, force: true });
console.log(fallos ? `\n${fallos} caso(s) fallaron` : `\n${casos.length} casos correctos`);
process.exit(fallos ? 1 : 0);
