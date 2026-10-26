#!/usr/bin/env node
// Genera la copia instalable de un plugin a partir de skills/ y packs/.
//   node scripts/construir-plugin.mjs desarrollo
// La fuente única de los skills sigue siendo skills/<nombre>/. Esta copia vive en
// plugins/comsatel-<pack>/skills/ para que un marketplace pueda servirla desde git, y
// `npm test` falla si difiere de la fuente. No toca plugin.json, hooks.json ni README.md:
// esos archivos se editan a mano.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pack = process.argv[2];
if (!pack) { console.error('Uso: node scripts/construir-plugin.mjs <pack>   (por ejemplo: desarrollo)'); process.exit(1); }

const packFile = join(root, 'packs', pack, 'pack.yaml');
if (!existsSync(packFile)) { console.error(`No existe ${packFile}`); process.exit(1); }

// Skills del pack: líneas «- name: x» dentro de la sección skills:.
const lines = readFileSync(packFile, 'utf8').replace(/\r\n/g, '\n').split('\n');
const skills = [];
let dentro = false;
for (const l of lines) {
  if (/^skills:\s*$/.test(l)) { dentro = true; continue; }
  if (dentro && /^\S/.test(l) && !l.startsWith('- ')) dentro = false;
  const m = dentro && l.match(/^- name:\s*(\S+)/);
  if (m) skills.push(m[1]);
}
if (!skills.length) { console.error('El pack no declara skills'); process.exit(1); }

const plugin = join(root, 'plugins', `comsatel-${pack}`);
if (!existsSync(join(plugin, '.claude-plugin', 'plugin.json'))) {
  console.error(`Falta ${join(plugin, '.claude-plugin', 'plugin.json')} (se escribe a mano)`);
  process.exit(1);
}

const destino = join(plugin, 'skills');
rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
for (const name of skills) {
  const origen = join(root, 'skills', name);
  if (!existsSync(join(origen, 'SKILL.md'))) { console.error(`skills/${name}/SKILL.md no existe`); process.exit(1); }
  // Los evals son material de desarrollo: no viajan en el plugin.
  cpSync(origen, join(destino, name), { recursive: true, filter: (src) => !/[\\/]evals([\\/]|$)/.test(src) });
}
cpSync(packFile, join(plugin, 'pack.yaml'));
console.log(`plugins/comsatel-${pack}: ${skills.length} skills copiados (${skills.join(', ')}) y pack.yaml`);
console.log(readdirSync(destino).length === skills.length ? 'OK' : 'REVISAR: el número de carpetas no coincide');
