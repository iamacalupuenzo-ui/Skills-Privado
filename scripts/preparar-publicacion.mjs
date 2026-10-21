#!/usr/bin/env node
// Prepara la copia publicable de uno o más skills: sin lo que pertenece a una persona
// (conexiones, IDs y scripts de su Notion) y sin las secciones de SKILL.md que lo citan.
// No toca el repo privado: escribe en --out.
//
// Uso: node scripts/preparar-publicacion.mjs --out <carpeta> <skill> [<skill>...]
//
// Falla (código 1) si en la copia queda alguna referencia a lo personal.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = join(root, 'skills');

// Carpetas que no se publican, por skill.
const PERSONAL = { 'ux-ui-orchestrator': ['notion'] };
// Secciones "## ..." de SKILL.md que se quitan enteras.
const SECCIONES_PERSONALES = [/^## Módulo Notion/];
// Lo que no puede quedar en ninguna copia publicada.
const RESIDUOS = [/`notion\//, /notion\/config\.json/, /~\/\.notion/];

const args = process.argv.slice(2);
const iOut = args.indexOf('--out');
if (iOut < 0 || !args[iOut + 1]) { console.error('Falta --out <carpeta>'); process.exit(1); }
const out = resolve(args[iOut + 1]);
const skills = args.filter((a, i) => i !== iOut && i !== iOut + 1);
if (!skills.length) { console.error('Indica al menos un skill'); process.exit(1); }

function quitarSecciones(texto) {
  const lineas = texto.split('\n');
  const res = [];
  let saltando = false;
  for (const l of lineas) {
    if (/^## /.test(l)) saltando = SECCIONES_PERSONALES.some((re) => re.test(l));
    if (!saltando) res.push(l);
  }
  // Líneas sueltas (p. ej. el índice de referencias) que remiten a lo personal.
  return res.filter((l) => !/`notion\//.test(l)).join('\n');
}

function archivos(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    return d.isDirectory() ? archivos(p) : [p];
  });
}

const problemas = [];
for (const nombre of skills) {
  const origen = join(skillsDir, nombre);
  if (!existsSync(join(origen, 'SKILL.md'))) { problemas.push(`${nombre}: no existe skills/${nombre}/SKILL.md`); continue; }
  const destino = join(out, nombre);
  rmSync(destino, { recursive: true, force: true });
  mkdirSync(destino, { recursive: true });
  const excluir = (PERSONAL[nombre] || []).map((c) => join(origen, c));
  cpSync(origen, destino, { recursive: true, filter: (src) => !excluir.some((e) => src === e || src.startsWith(e + '\\') || src.startsWith(e + '/')) });

  const skillMd = join(destino, 'SKILL.md');
  const crlf = readFileSync(skillMd, 'utf8').includes('\r\n');
  const limpio = quitarSecciones(readFileSync(skillMd, 'utf8').replace(/\r\n/g, '\n'));
  writeFileSync(skillMd, crlf ? limpio.replace(/\n/g, '\r\n') : limpio);

  for (const f of archivos(destino)) {
    if (!/\.(md|json|mjs|js|py|yaml|yml|txt)$/.test(f)) continue;
    const cuerpo = readFileSync(f, 'utf8');
    for (const re of RESIDUOS) if (re.test(cuerpo)) problemas.push(`${nombre}: ${f.slice(out.length + 1)} aún cita lo personal (${re})`);
  }
  console.log(`${nombre}: ${archivos(destino).length} archivos en ${destino}`);
}

if (problemas.length) { for (const p of problemas) console.error('ERROR  ' + p); process.exit(1); }
console.log('Sin residuos personales.');
