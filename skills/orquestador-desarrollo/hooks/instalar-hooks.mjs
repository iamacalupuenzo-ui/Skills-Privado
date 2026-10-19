#!/usr/bin/env node
// Instala el guardia de GitLab en Claude Code sin tocar los demás hooks.
//   node instalar-hooks.mjs            instala o actualiza
//   node instalar-hooks.mjs --quitar   lo retira de settings.json
// Copia el guardia a ~/.claude/hooks/ (ruta estable, no la borra `skils update`) y
// registra un hook PreToolUse para Bash y PowerShell. Hace copia de respaldo de settings.json.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const destinoDir = join(homedir(), '.claude', 'hooks');
const destino = join(destinoDir, 'comsatel-guardia-gitlab.mjs');
const settings = join(homedir(), '.claude', 'settings.json');
const MARCA = 'comsatel-guardia-gitlab';
const quitar = process.argv.includes('--quitar');

const cargar = () => (existsSync(settings) ? JSON.parse(readFileSync(settings, 'utf8').replace(/^﻿/, '')) : {});
const conf = cargar();
conf.hooks ??= {};
conf.hooks.PreToolUse ??= [];

// Quita cualquier registro previo del guardia (para actualizar sin duplicar).
for (const grupo of conf.hooks.PreToolUse) {
  grupo.hooks = (grupo.hooks || []).filter((h) => !String(h.command || '').includes(MARCA));
}
conf.hooks.PreToolUse = conf.hooks.PreToolUse.filter((g) => (g.hooks || []).length > 0);

if (!quitar) {
  mkdirSync(destinoDir, { recursive: true });
  copyFileSync(join(aqui, 'guardia-gitlab.mjs'), destino);
  conf.hooks.PreToolUse.push({
    matcher: 'Bash|PowerShell',
    hooks: [{ type: 'command', command: `node "${destino.replace(/\\/g, '/')}"`, timeout: 10 }],
  });
}

if (existsSync(settings)) {
  const sello = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  copyFileSync(settings, `${settings}.bak-${sello}`);
}
writeFileSync(settings, JSON.stringify(conf, null, 2) + '\n', 'utf8');
console.log(quitar ? 'Guardia retirado de settings.json.' : `Guardia instalado en ${destino} y registrado en ${settings}.`);
console.log('Abre una sesión nueva de Claude Code para que lo lea.');
