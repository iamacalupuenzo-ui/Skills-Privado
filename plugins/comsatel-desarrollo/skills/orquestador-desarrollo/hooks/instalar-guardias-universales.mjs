#!/usr/bin/env node
// Instala las guardias que no dependen de un solo agente. Por defecto solo muestra qué haría (vista previa).
//   node instalar-guardias-universales.mjs [--apply] [--quitar]
//        [--home <carpeta>]        dónde se copian las guardias (por defecto ~/.comsatel-guardias)
//        [--codex <hooks.json>]    hooks de Codex (por defecto ~/.codex/hooks.json); --sin-codex lo omite
//        [--git-repo <ruta>]       activa el hook pre-push solo en ese repositorio
//        [--git-global]            lo activa en todos los repositorios (core.hooksPath global)
//        [--forzar]                permite reemplazar un core.hooksPath global que ya existe
// Capas: 1) hook PreToolUse de Codex (mismo protocolo que Claude Code), 2) hook pre-push de git,
// 3) atajos glab/npm/curl para el PATH (solo se copian: se imprime cómo anteponerlos, no se toca tu PATH).
// No lee ni imprime secretos. Conserva los hooks ajenos y guarda copia del hooks.json antes de escribirlo.
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const FLAGS = ['--apply', '--quitar', '--sin-codex', '--git-global', '--forzar'];
const CON_VALOR = ['--home', '--codex', '--git-repo'];
for (let i = 0; i < args.length; i++) {
  if (CON_VALOR.includes(args[i])) { if (!args[++i] || args[i].startsWith('--')) throw Error(`Falta el valor de ${args[i - 1]}`); }
  else if (!FLAGS.includes(args[i])) throw Error(`Opción desconocida: ${args[i]}`);
}
const valor = (f) => { const i = args.indexOf(f); return i < 0 ? '' : args[i + 1]; };
const tiene = (f) => args.includes(f);
const aplicar = tiene('--apply'), quitar = tiene('--quitar');
const home = resolve(valor('--home') || join(homedir(), '.comsatel-guardias'));
const destino = join(home, 'actual');
const codexHooks = tiene('--sin-codex') ? '' : resolve(valor('--codex') || join(homedir(), '.codex', 'hooks.json'));
const repoGit = valor('--git-repo') ? resolve(valor('--git-repo')) : '';
const MARCA = /guardia-gitlab.mjs/;
const aSlash = (p) => p.replace(/\\/g, '/');

const archivos = [
  ['guardia-gitlab.mjs', 'guardia-gitlab.mjs'], ['guardia-git.mjs', 'guardia-git.mjs'], ['guardia-shim.mjs', 'guardia-shim.mjs'],
  ['githooks/pre-push', 'githooks/pre-push'],
  ...['glab', 'npm', 'curl'].flatMap((t) => [[`shims/${t}`, `shims/${t}`], [`shims/${t}.cmd`, `shims/${t}.cmd`]]),
];
if (!quitar) for (const [o] of archivos) if (!existsSync(join(aqui, o))) throw Error(`Falta ${o} junto al instalador`);

const huella = quitar ? '' : createHash('sha256').update(Buffer.concat(archivos.map(([o]) => readFileSync(join(aqui, o))))).digest('hex').slice(0, 16);
const gitConfig = (...a) => { try { return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const hooksPathGlobal = gitConfig('config', '--global', '--get', 'core.hooksPath');
const nuestroHooksPath = aSlash(join(destino, 'githooks'));

const plan = {
  modo: aplicar ? 'aplicar' : 'vista previa',
  operacion: quitar ? 'quitar' : 'instalar',
  copia_en: quitar ? '(se borra)' : destino,
  huella: huella || undefined,
  codex: codexHooks || 'omitido',
  git: repoGit ? `repositorio ${repoGit}` : tiene('--git-global') ? 'global' : 'sin activar (usa --git-repo o --git-global)',
  git_hooks_path_global_actual: hooksPathGlobal || '(ninguno)',
  atajos_path: quitar ? '' : aSlash(join(destino, 'shims')),
  escribe_algo: aplicar,
};
if (!aplicar) { console.log(JSON.stringify(plan, null, 2)); process.exit(0); }

if (tiene('--git-global') && !quitar && hooksPathGlobal && aSlash(hooksPathGlobal) !== nuestroHooksPath && !tiene('--forzar')) {
  throw Error(`Ya existe un core.hooksPath global (${hooksPathGlobal}). Reemplazarlo desactivaría esos hooks; usa --forzar si es lo que quieres, o --git-repo por repositorio.`);
}

// 1) Copia de las guardias (los scripts sh se guardan con LF, aunque el repo use CRLF).
if (quitar) rmSync(destino, { recursive: true, force: true });
else {
  rmSync(destino, { recursive: true, force: true });
  for (const [o, d] of archivos) {
    const dst = join(destino, d);
    mkdirSync(dirname(dst), { recursive: true });
    if (/githooks[\\/]|shims[\\/][^.\\/]+$/.test(o)) writeFileSync(dst, readFileSync(join(aqui, o), 'utf8').replace(/\r\n/g, '\n'));
    else copyFileSync(join(aqui, o), dst);
  }
  writeFileSync(join(destino, 'VERSION'), huella + '\n');
}

// 2) Hooks de Codex: misma forma que los de Claude Code. Se conservan los ajenos.
let codex = null;
if (codexHooks) {
  const antes = existsSync(codexHooks) ? readFileSync(codexHooks, 'utf8') : null;
  const cfg = antes ? JSON.parse(antes.replace(/^﻿/, '')) : {};
  cfg.hooks ??= {}; cfg.hooks.PreToolUse ??= [];
  cfg.hooks.PreToolUse = cfg.hooks.PreToolUse
    .map((g) => ({ ...g, hooks: (g.hooks || []).filter((h) => !MARCA.test(String(h.command || ''))) }))
    .filter((g) => g.hooks.length);
  if (!quitar) {
    cfg.hooks.PreToolUse.push({
      matcher: 'Bash',
      hooks: [{ type: 'command', // --estricto: Codex no sabe pedir confirmación (un "ask" lo toma como fallo del hook y deja pasar el comando).
      command: `node "${aSlash(join(destino, 'guardia-gitlab.mjs'))}" --estricto`, timeout: 10, statusMessage: 'Guardia de Comsatel' }],
    });
  }
  if (!Object.keys(cfg.hooks.PreToolUse).length) delete cfg.hooks.PreToolUse;
  if (!Object.keys(cfg.hooks).length) delete cfg.hooks;
  const sufijo = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID();
  mkdirSync(dirname(codexHooks), { recursive: true });
  if (antes !== null) writeFileSync(`${codexHooks}.bak-${sufijo}`, antes, 'utf8');
  const pendiente = `${codexHooks}.pending-${sufijo}`;
  writeFileSync(pendiente, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  renameSync(pendiente, codexHooks);
  codex = { archivo: codexHooks, copia_de_seguridad: antes !== null, confiar_en_codex: quitar ? false : 'abre Codex y ejecuta /hooks para revisar y confiar en el hook (Codex lo omite hasta entonces)' };
}

// 3) git: core.hooksPath en un repositorio o global.
let git = 'sin activar';
if (repoGit) {
  if (quitar) { if (aSlash(gitConfig('-C', repoGit, 'config', '--local', '--get', 'core.hooksPath')) === nuestroHooksPath) execFileSync('git', ['-C', repoGit, 'config', '--local', '--unset', 'core.hooksPath']); git = `desactivado en ${repoGit}`; }
  else { execFileSync('git', ['-C', repoGit, 'config', '--local', 'core.hooksPath', nuestroHooksPath]); git = `activado en ${repoGit}`; }
} else if (tiene('--git-global')) {
  if (quitar) { if (aSlash(hooksPathGlobal) === nuestroHooksPath) execFileSync('git', ['config', '--global', '--unset', 'core.hooksPath']); git = 'desactivado en global'; }
  else { execFileSync('git', ['config', '--global', 'core.hooksPath', nuestroHooksPath]); git = 'activado en global'; }
}

console.log(JSON.stringify({
  ...plan, resultado: { codex, git },
  atajos: quitar ? undefined : {
    carpeta: aSlash(join(destino, 'shims')),
    como_activarlos: `Antepón esa carpeta al PATH de usuario y reinicia Orca y las terminales. PowerShell: [Environment]::SetEnvironmentVariable('Path', '${join(destino, 'shims')};' + [Environment]::GetEnvironmentVariable('Path','User'), 'User')`,
  },
  reiniciar_sesiones: true,
}, null, 2));
