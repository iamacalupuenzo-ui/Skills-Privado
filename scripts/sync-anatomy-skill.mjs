#!/usr/bin/env node
// Sincroniza el skill Anatomy (github.com/wheresryan22/anatomy, licencia MIT,
// Copyright (c) 2026 Ryan) dentro de este catálogo, SIN modificarlo.
//
// Uso:  node scripts/sync-anatomy-skill.mjs            (última versión de main)
//       node scripts/sync-anatomy-skill.mjs <commit>   (fija una revisión concreta)
//
// El repositorio de origen ES el skill (SKILL.md en la raíz), así que se copia completo
// a skills/anatomy/, salvo .git y .github (CI y capturas de la galería del README).
// Igual que con los skills de Angular, UPSTREAM.json guarda el commit y el hash de cada
// archivo y `npm test` falla si alguien edita la copia. Las adaptaciones propias no van
// aquí: van en un skill propio que lo use.

import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashFile, listFiles } from './sync-angular-skills.mjs';

const REPO_URL = 'https://github.com/wheresryan22/anatomy';
export const ANATOMY_SKILLS = ['anatomy'];
const EXCLUDED = new Set(['.git', '.github']);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const requestedCommit = process.argv[2];

const NOTICE = (commit, license) => `# Licencia del contenido vendorizado

Este directorio es una copia sin modificar del skill Anatomy, publicado en
${REPO_URL} (commit \`${commit}\`). Se excluyen \`.git\` y \`.github\`.

El archivo \`LICENSE\` de este directorio es el original del repositorio de origen y
se conserva tal cual, como exige la licencia MIT. Su texto:

---

${license}`;

function main() {
  const tmp = mkdtempSync(join(tmpdir(), 'anatomy-skill-'));
  try {
    execFileSync('git', ['clone', '--quiet', REPO_URL, tmp], { stdio: 'inherit' });
    if (requestedCommit) execFileSync('git', ['-C', tmp, 'checkout', '--quiet', requestedCommit], { stdio: 'inherit' });
    const commit = execFileSync('git', ['-C', tmp, 'rev-parse', 'HEAD']).toString().trim();
    const name = ANATOMY_SKILLS[0];

    const target = join(root, 'skills', name);
    rmSync(target, { recursive: true, force: true });
    mkdirSync(target, { recursive: true });
    cpSync(tmp, target, { recursive: true, filter: (src) => !EXCLUDED.has(basename(src)) });

    const files = {};
    for (const file of listFiles(target)) files[file] = hashFile(join(target, file));
    writeFileSync(join(target, 'LICENSE-UPSTREAM.md'), NOTICE(commit, readFileSync(join(target, 'LICENSE'), 'utf8')));
    writeFileSync(
      join(target, 'UPSTREAM.json'),
      JSON.stringify({ repository: REPO_URL, skill: name, commit, syncedAt: new Date().toISOString().slice(0, 10), license: 'MIT (Copyright (c) 2026 Ryan)', files }, null, 2) + '\n',
    );
    console.log(`OK  ${name}  ${Object.keys(files).length} archivos  @ ${commit.slice(0, 8)}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
