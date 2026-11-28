// Pruebas de scripts/armar-mapeo.mjs. Correr desde la carpeta del skill: node --test tests/
// Cada caso copia el ejemplo del DSP-009 a una carpeta temporal, lo rompe de una forma y comprueba
// que el script sale con 1 y nombra la regla. No usa la KB ni la red.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(RAIZ, 'scripts', 'armar-mapeo.mjs');
const EJEMPLO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'examples', 'mapeo-dsp-009.json'), 'utf8'));

function correr(mapeo) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mapeo-'));
  const entrada = path.join(dir, 'mapeo.json');
  const salida = path.join(dir, 'paginas.json');
  fs.writeFileSync(entrada, JSON.stringify(mapeo));
  const r = spawnSync(process.execPath, [SCRIPT, entrada, '--salida', salida], { encoding: 'utf8' });
  const paginas = fs.existsSync(salida) ? JSON.parse(fs.readFileSync(salida, 'utf8')) : null;
  fs.rmSync(dir, { recursive: true, force: true });
  return { codigo: r.status, texto: r.stdout + r.stderr, paginas };
}
const copia = () => structuredClone(EJEMPLO);

test('el ejemplo del DSP-009 pasa y genera las tres versiones', () => {
  const r = correr(copia());
  assert.equal(r.codigo, 0, r.texto);
  assert.ok(r.paginas.length > 0);
  for (const pg of r.paginas) {
    for (const s of ['## Alcance', '## Criterios de aceptación', '## Condición de cierre', '## Trazabilidad']) {
      assert.ok(pg.notion.includes(s) && pg.gitlab.includes(s) && pg.clickup.includes(s), `${pg.clave}: falta ${s}`);
    }
  }
});

test('GitLab y ClickUp no llevan la capa de lectura ni enlaces a Notion (B15)', () => {
  for (const pg of correr(copia()).paginas) {
    for (const t of [pg.gitlab, pg.clickup]) {
      assert.ok(!t.includes('## En 30 segundos') && !t.includes('## Comprueba'), pg.clave);
      assert.ok(!/notion\.(so|com)/.test(t), pg.clave);
    }
    assert.ok(pg.notion.includes('## En 30 segundos') && pg.notion.includes('## Comprueba'), pg.clave);
  }
});

test('un paquete sin código DSP-NNN no pasa ni genera nada', () => {
  const m = copia();
  m.paquete.id = 'DSP-9';
  const r = correr(m);
  assert.equal(r.codigo, 1);
  assert.match(r.texto, /paquete\.id debe ser DSP-NNN/);
  assert.equal(r.paginas, null);
});

test('una madre con una sola subtarea no pasa', () => {
  const m = copia();
  m.madres[0].subtareas = m.madres[0].subtareas.slice(0, 1);
  const r = correr(m);
  assert.equal(r.codigo, 1);
  assert.match(r.texto, /al menos dos subtareas/);
});

test('una subtarea sin relato completo no pasa', () => {
  const m = copia();
  delete m.madres[0].subtareas[0].relato.dondeEncaja;
  const r = correr(m);
  assert.equal(r.codigo, 1);
  assert.match(r.texto, /el relato lleva problema/);
});

test('una revisión sin la casilla fija de su tipo no pasa', () => {
  const m = copia();
  const madre = m.madres.find((x) => x.subtareas.some((s) => s.tipo === 'revision'));
  assert.ok(madre, 'el ejemplo debe tener una subtarea de revisión');
  const rev = madre.subtareas.find((s) => s.tipo === 'revision');
  rev.criterios = rev.criterios.filter((c) => c !== 'Brechas y desvíos registrados con su dueño');
  const r = correr(m);
  assert.equal(r.codigo, 1);
  assert.match(r.texto, /falta la casilla fija/);
});

test('una historia que no está en el paquete no pasa', () => {
  const m = copia();
  m.madres[0].subtareas[0].historias = ['HU-99-99'];
  m.madres[0].subtareas[0].titulo += ' (HU-99-99)';
  const r = correr(m);
  assert.equal(r.codigo, 1);
  assert.match(r.texto, /HU-99-99 no está en «historias»/);
});

test('una fecha límite anterior al inicio no pasa', () => {
  const m = copia();
  m.madres[0].subtareas[0].limite = '2026-01-01';
  const r = correr(m);
  assert.equal(r.codigo, 1);
  assert.match(r.texto, /inicio y fecha límite válidos/);
});
