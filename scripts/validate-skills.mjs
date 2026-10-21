#!/usr/bin/env node
// Blindaje del catálogo: falla (código 1) si algo está roto, avisa (código 0) si algo
// merece revisión. Se ejecuta con `npm test`.
//
// Errores (rompen):
//   - una entrada del manifest sin carpeta o sin SKILL.md
//   - el `name` del encabezado no coincide con la carpeta
//   - falta `description` en el encabezado
//   - un skill propio cita `references/...` que no existe
//   - un skill propio conserva un nombre viejo (comsatel-angular-product-builder, comsatel-product-orchestrator)
//   - un skill vendorizado difiere de su UPSTREAM.json (alguien lo editó) o le falta la licencia
//   - un skill vendorizado no está en el manifest
//   - un skill de AUTONOMOS apunta a otro skill con ../ (debe ser instalable solo)
//   - una referencia compartida (SHARED_REFERENCES) difiere de su original
// Avisos (no rompen):
//   - el mismo enlace ../ en los demás skills propios
//   - carpetas en skills/ que no están en el manifest (nunca se instalan)

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashFile, listFiles, VENDORED_SKILLS } from './sync-angular-skills.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skillsDir = join(root, 'skills');
const manifest = JSON.parse(readFileSync(join(root, 'skills-manifest.json'), 'utf8'));
const errors = [];
const warnings = [];

// Copias que cada skill lleva consigo para ser instalable solo: la fuente es la primera.
const SHARED_REFERENCES = [
  ['orquestador-desarrollo/references/hooks-bloqueantes.md', 'flujo-ds/references/hooks-bloqueantes.md', 'flujo-producto/references/hooks-bloqueantes.md'],
  ['orquestador-desarrollo/references/mapa-de-repos.md', 'flujo-producto/references/mapa-de-repos.md'],
];

// Skills que ya son instalables solos: un `../otro-skill/` aquí rompe. En el resto, aviso.
// ux-ui-orchestrator queda fuera: su worktree-protocol.md remite a af-requirements-orchestrator y es un archivo del equipo (Ian).
const AUTONOMOS = ['orquestador-desarrollo', 'flujo-ds', 'flujo-producto', 'angular-product-builder'];
const ENLACE_A_OTRO_SKILL = /`[^`]*\.\.\/[a-z][a-z0-9-]*\//;

const OLD_NAMES = ['comsatel-angular-product-builder', 'comsatel-product-orchestrator'];

function frontmatter(text) {
  const match = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  const lines = match[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (value === '>' || value === '|' || value === '>-') {
      const parts = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) parts.push(lines[++i].trim());
      value = parts.join(' ');
    }
    fields[kv[1]] = value;
  }
  return fields;
}

const listed = new Set(manifest.skills);
for (const name of manifest.skills) {
  const dir = join(skillsDir, name);
  const skillFile = join(dir, 'SKILL.md');
  if (!existsSync(skillFile)) {
    errors.push(`${name}: está en el manifest pero no existe skills/${name}/SKILL.md`);
    continue;
  }
  const text = readFileSync(skillFile, 'utf8');
  const fm = frontmatter(text);
  if (!fm) { errors.push(`${name}: SKILL.md sin encabezado (---)`); continue; }
  if (fm.name !== name) errors.push(`${name}: el encabezado dice name: "${fm.name}", debe coincidir con la carpeta`);
  if (!fm.description) errors.push(`${name}: el encabezado no tiene description`);

  const vendored = VENDORED_SKILLS.includes(name);
  if (!vendored) {
    // Referencias citadas que deben existir.
    const cited = new Set([...text.matchAll(/`(references\/[A-Za-z0-9_\-./]+\.md)`/g)].map((m) => m[1]));
    for (const ref of cited) if (!existsSync(join(dir, ref))) errors.push(`${name}: cita ${ref} pero no existe`);
    for (const file of listFiles(dir)) {
      if (!file.endsWith('.md')) continue;
      const body = readFileSync(join(dir, file), 'utf8');
      if (ENLACE_A_OTRO_SKILL.test(body)) {
        const msg = `${name}/${file}: apunta a otro skill con ../ (copia el recurso dentro del skill)`;
        (AUTONOMOS.includes(name) ? errors : warnings).push(msg);
      }
      for (const old of OLD_NAMES) if (body.includes(old)) errors.push(`${name}/${file}: conserva el nombre viejo ${old}`);
    }
  }
}

for (const [source, ...copies] of SHARED_REFERENCES) {
  const original = readFileSync(join(skillsDir, source), 'utf8').replace(/\r\n/g, '\n');
  for (const copy of copies) {
    const body = readFileSync(join(skillsDir, copy), 'utf8').replace(/\r\n/g, '\n');
    if (body !== original) errors.push(`${copy}: difiere de ${source}; copia el original`);
  }
}

for (const name of VENDORED_SKILLS) {
  if (!listed.has(name)) errors.push(`${name}: skill vendorizado que falta en skills-manifest.json`);
  const dir = join(skillsDir, name);
  const upstreamFile = join(dir, 'UPSTREAM.json');
  if (!existsSync(upstreamFile)) { errors.push(`${name}: falta UPSTREAM.json (ejecuta scripts/sync-angular-skills.mjs)`); continue; }
  if (!existsSync(join(dir, 'LICENSE-UPSTREAM.md'))) errors.push(`${name}: falta LICENSE-UPSTREAM.md (la licencia MIT exige conservar el aviso)`);
  const upstream = JSON.parse(readFileSync(upstreamFile, 'utf8'));
  const current = listFiles(dir).filter((f) => f !== 'UPSTREAM.json' && f !== 'LICENSE-UPSTREAM.md');
  for (const file of current) {
    if (!(file in upstream.files)) errors.push(`${name}/${file}: archivo que no está en el origen fijado (${upstream.commit.slice(0, 8)})`);
    else if (hashFile(join(dir, file)) !== upstream.files[file]) errors.push(`${name}/${file}: modificado respecto del origen fijado (${upstream.commit.slice(0, 8)}); las reglas propias van en angular-product-builder, no aquí`);
  }
  for (const file of Object.keys(upstream.files)) if (!current.includes(file)) errors.push(`${name}/${file}: falta respecto del origen fijado`);
}

for (const entry of readdirSync(skillsDir)) {
  if (statSync(join(skillsDir, entry)).isDirectory() && !listed.has(entry)) {
    warnings.push(`skills/${entry} no está en el manifest: nunca se instala (¿herencia de un nombre viejo?)`);
  }
}

for (const w of warnings) console.warn(`AVISO  ${w}`);
for (const e of errors) console.error(`ERROR  ${e}`);
console.log(`${manifest.skills.length} skills revisados: ${errors.length} errores, ${warnings.length} avisos`);
process.exit(errors.length ? 1 : 0);
