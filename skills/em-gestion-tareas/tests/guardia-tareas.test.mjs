// Pruebas del hook hooks/guardia-tareas.mjs. Correr desde la carpeta del skill: node --test tests/
// Le pasa por stdin el evento PreToolUse que mandaría Claude Code y lee su decisión.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOOK = path.join(RAIZ, 'hooks', 'guardia-tareas.mjs');
const SISTEMAS = fs.readFileSync(path.join(RAIZ, 'config', 'sistemas.json'), 'utf8');
const BASE_TAREAS = '87a1a7d0-6388-82a0-82c0-8709ea959111';
const CREAR = 'mcp__claude_ai_Notion__notion-create-pages';

// Archivo de delegación propio de las pruebas: no lee ni toca el real.
const DELEGACION = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'delegacion-')), 'delegacion.json');
const ENTORNO = { ...process.env, EM_GESTION_DELEGACION: DELEGACION };

function decidir(tool_name, tool_input) {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name, tool_input }), encoding: 'utf8', env: ENTORNO });
  assert.equal(r.status, 0, 'el hook siempre sale con 0');
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecision : 'pasa';
}

// Contenido real generado por armar-mapeo.mjs con el ejemplo del DSP-009.
function paginaGenerada() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guardia-'));
  const salida = path.join(dir, 'paginas.json');
  spawnSync(process.execPath, [path.join(RAIZ, 'scripts', 'armar-mapeo.mjs'), path.join(RAIZ, 'examples', 'mapeo-dsp-009.json'), '--salida', salida]);
  const pg = JSON.parse(fs.readFileSync(salida, 'utf8'))[1];
  fs.rmSync(dir, { recursive: true, force: true });
  return pg;
}
const tarea = (nombre, content, extra = {}) => ({
  parent: { data_source_id: BASE_TAREAS },
  pages: [{ properties: { Nombre: nombre, 'date:Fecha límite:start': '2026-11-26', 'Criterio de cierre': 'x', ...extra }, content }],
});

test('la configuración apunta a la misma base Tareas que el hook', () => {
  assert.ok(SISTEMAS.includes(BASE_TAREAS));
});

test('bloquea una tarea con código sin la estructura (B14)', () => {
  assert.equal(decidir(CREAR, tarea('IDV-UX · 01 — Mapa (HU-01-14)', '## Alcance\nalgo')), 'deny');
});

test('deja pasar la tarea generada por armar-mapeo.mjs', () => {
  const pg = paginaGenerada();
  assert.equal(decidir(CREAR, tarea(pg.nombre, pg.notion)), 'pasa');
});

test('bloquea la tarea generada si le falta la fecha límite', () => {
  const pg = paginaGenerada();
  assert.equal(decidir(CREAR, tarea(pg.nombre, pg.notion, { 'date:Fecha límite:start': undefined })), 'deny');
});

test('una actividad corta sin código pasa (B12)', () => {
  assert.equal(decidir(CREAR, tarea('Reunión con Desarrollo', 'Notas')), 'pasa');
});

test('una página en otra base pasa', () => {
  assert.equal(decidir(CREAR, { parent: { page_id: 'otra' }, pages: [{ properties: { Nombre: 'IDV-UX · 01 — X' }, content: '' }] }), 'pasa');
});

test('reemplazar una tarea dejando fuera una sección se bloquea', () => {
  const texto = '## En 30 segundos\nx\n## Condición de cierre\n- [ ] y';
  assert.equal(decidir('mcp__claude_ai_Notion__notion-update-page', { command: 'replace_content', new_str: texto }), 'deny');
});

test('publicar.mjs en seco pasa y con --ejecutar pide confirmación (B1)', () => {
  assert.equal(decidir('Bash', { command: 'node scripts/publicar.mjs mapeo.json' }), 'pasa');
  assert.equal(decidir('Bash', { command: 'node scripts/publicar.mjs mapeo.json --ejecutar' }), 'ask');
});

test('escribir en un issue de GitLab pide confirmación y leerlo pasa (B1)', () => {
  const url = 'https://project.comsatel.com.pe/api/v4/projects/622/issues';
  assert.equal(decidir('Bash', { command: `curl -X POST ${url}` }), 'ask');
  assert.equal(decidir('Bash', { command: `curl ${url}` }), 'pasa');
});

test('escribir en ClickUp desde PowerShell pide confirmación (B1)', () => {
  assert.equal(decidir('PowerShell', { command: 'Invoke-RestMethod https://api.clickup.com/api/v2/task/1 -Method PUT' }), 'ask');
  assert.equal(decidir('PowerShell', { command: 'Invoke-RestMethod https://api.clickup.com/api/v2/task/1' }), 'pasa');
});

test('con la subida delegada hoy, publicar --ejecutar pasa sin preguntar', () => {
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'scripts', 'delegar.mjs'), 'delegar'], { env: ENTORNO, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  try {
    assert.equal(decidir('Bash', { command: 'node scripts/publicar.mjs mapeo.json --ejecutar' }), 'pasa');
    assert.equal(decidir('Bash', { command: 'curl -X POST https://api.clickup.com/api/v2/list/1/task' }), 'pasa');
    // La estructura de la tarea se sigue exigiendo: no es una confirmación, es calidad.
    assert.equal(decidir(CREAR, tarea('IDV-UX · 01 — Mapa (HU-01-14)', '## Alcance\nalgo')), 'deny');
  } finally {
    spawnSync(process.execPath, [path.join(RAIZ, 'scripts', 'delegar.mjs'), 'intervenir'], { env: ENTORNO });
  }
});

test('una delegación de otro día ya no vale', () => {
  fs.writeFileSync(DELEGACION, JSON.stringify({ fecha: '2020-01-01', decision: 'delegar' }));
  try {
    assert.equal(decidir('Bash', { command: 'node scripts/publicar.mjs mapeo.json --ejecutar' }), 'ask');
  } finally { fs.rmSync(DELEGACION, { force: true }); }
});

test('intervenir vuelve a pedir confirmación', () => {
  spawnSync(process.execPath, [path.join(RAIZ, 'scripts', 'delegar.mjs'), 'delegar'], { env: ENTORNO });
  spawnSync(process.execPath, [path.join(RAIZ, 'scripts', 'delegar.mjs'), 'intervenir'], { env: ENTORNO });
  assert.equal(decidir('Bash', { command: 'node scripts/tablero-dia.mjs tablero --ejecutar' }), 'ask');

});
