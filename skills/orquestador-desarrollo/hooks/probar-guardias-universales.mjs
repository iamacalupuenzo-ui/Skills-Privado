#!/usr/bin/env node
// Pruebas de las guardias que no dependen de un agente: hook pre-push de git, atajos de shell, instalador
// y protocolo de hook de Codex. Usa repositorios de git reales en una carpeta temporal; no toca tu configuración.
// Uso: node probar-guardias-universales.mjs   (sale con código 1 si algún caso falla)
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buscarReal } from './guardia-shim.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const aSlash = (p) => p.replace(/\\/g, '/');
const tmp = mkdtempSync(join(tmpdir(), 'guardias-univ-'));
let total = 0, fallos = 0;
const ok = (nombre, cond, detalle = '') => { total++; if (!cond) { fallos++; console.log(`FALLA  ${nombre}${detalle ? ` — ${detalle}` : ''}`); } };
const correr = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts, env: { ...process.env, ...(opts.env || {}) } });
const git = (cwd, ...a) => correr('git', ['-C', cwd, ...a]);
const gitConEnv = (cwd, env, ...a) => correr('git', ['-C', cwd, ...a], { env });

try {
  // ── Hook pre-push de git ───────────────────────────────────────────────────────────────
  ok('pre-push usa finales de línea LF', !readFileSync(join(aqui, 'githooks', 'pre-push'), 'utf8').includes('\r'));
  // El nombre de la carpeta lleva «comsatel»: así la guardia lo trata como el GitLab de Comsatel.
  const remoto = aSlash(join(tmp, 'comsatel-remoto.git'));
  const trabajo = join(tmp, 'trabajo');
  correr('git', ['init', '--bare', '-q', '-b', 'develop', remoto]);
  mkdirSync(trabajo);
  correr('git', ['init', '-q', '-b', 'develop', trabajo]);
  for (const [k, v] of [['user.name', 'prueba'], ['user.email', 'p@x'], ['commit.gpgsign', 'false']]) git(trabajo, 'config', k, v);
  git(trabajo, 'remote', 'add', 'origin', remoto);
  const confirmar = (msg) => { writeFileSync(join(trabajo, 'a.txt'), `${msg}\n`); git(trabajo, 'add', '-A'); git(trabajo, 'commit', '-q', '-m', msg); };
  confirmar('base');
  git(trabajo, 'push', '-q', '--no-verify', 'origin', 'develop'); // siembra el remoto sin pasar por la guardia
  git(trabajo, 'config', 'core.hooksPath', aSlash(join(aqui, 'githooks')));

  const empuja = (env, ...a) => gitConEnv(trabajo, env || {}, 'push', ...a);
  const bloquea = (nombre, r, texto) => ok(nombre, r.status !== 0 && /BLOQUEADO/.test(r.stderr) && (!texto || r.stderr.includes(texto)), `estado ${r.status}: ${r.stderr.slice(0, 160)}`);

  confirmar('en develop');
  bloquea('push directo a develop', empuja(null, 'origin', 'develop'), 'rama protegida');
  bloquea('push HEAD:main', empuja(null, 'origin', 'HEAD:main'), 'rama protegida');
  git(trabajo, 'checkout', '-q', '-b', 'feature/x');
  confirmar('feature x');
  const feature = empuja(null, 'origin', 'feature/x');
  ok('push de una rama feature pasa con aviso', feature.status === 0 && /AVISO de la guardia/.test(feature.stderr), `estado ${feature.status}: ${feature.stderr.slice(0, 160)}`);
  ok('la rama feature llegó al remoto', correr('git', ['--git-dir', remoto, 'rev-parse', '--verify', 'refs/heads/feature/x']).status === 0);
  git(trabajo, 'checkout', '-q', '-b', 'feature/y');
  confirmar('feature y');
  const estricto = empuja({ COMSATEL_GUARDIA_ASK: 'deny' }, 'origin', 'feature/y');
  ok('modo estricto bloquea un push que pediría confirmación', estricto.status !== 0 && /Modo estricto/.test(estricto.stderr), estricto.stderr.slice(0, 160));
  git(trabajo, 'checkout', '-q', 'feature/x');
  git(trabajo, 'commit', '-q', '--amend', '-m', 'feature x reescrita');
  bloquea('push forzado que reescribe historia', empuja(null, '--force', 'origin', 'feature/x'), 'forzado');
  // Sin --force git mismo lo rechaza (no es avance rápido) antes de llegar al hook: lo importante es que no sube.
  ok('push sin --force de una rama reescrita no sube', empuja(null, 'origin', 'feature/x').status !== 0);
  bloquea('borrar una rama remota', empuja(null, '--delete', 'origin', 'feature/x'), 'git push --delete');
  git(trabajo, 'tag', 'v1.0.0');
  bloquea('push de una etiqueta', empuja(null, 'origin', 'v1.0.0'), 'etiquetas');
  bloquea('push --tags', empuja(null, '--tags', 'origin'), 'etiquetas');
  // El hook propio del repositorio se encadena y su fallo se respeta.
  git(trabajo, 'checkout', '-q', 'feature/y');
  const propio = join(trabajo, '.git', 'hooks', 'pre-push');
  mkdirSync(dirname(propio), { recursive: true });
  writeFileSync(propio, '#!/bin/sh\necho "hook-propio-ejecutado" >&2\nexit 7\n');
  chmodSync(propio, 0o755);
  const encadenado = empuja(null, 'origin', 'feature/y');
  ok('se encadena el pre-push propio del repositorio', encadenado.status !== 0 && /hook-propio-ejecutado/.test(encadenado.stderr), encadenado.stderr.slice(0, 160));

  // ── Atajos de shell ────────────────────────────────────────────────────────────────────
  const shim = join(aqui, 'guardia-shim.mjs');
  const atajo = (...a) => correr('node', [shim, ...a], { cwd: tmp });
  for (const [nombre, a] of [
    ['glab mr merge', ['glab', 'mr', 'merge', '12']],
    ['npm publish', ['npm', 'publish']],
    ['curl contra la API de fusión', ['curl', '-X', 'PUT', 'https://project.comsatel.com.pe/api/v4/projects/9/merge_requests/12/merge']],
  ]) { const r = atajo(...a); ok(`atajo bloquea ${nombre}`, r.status === 1 && /BLOQUEADO/.test(r.stderr), `estado ${r.status}: ${r.stderr.slice(0, 120)}`); }
  const version = atajo('npm', '--version');
  ok('atajo deja pasar un comando inocuo y ejecuta la herramienta real', version.status === 0 && /^\d+\.\d+/.test(version.stdout.trim()), `estado ${version.status}: ${version.stderr.slice(0, 120)}`);
  const carpetaAtajos = join(tmp, 'atajos'), carpetaReal = join(tmp, 'real');
  mkdirSync(carpetaAtajos); mkdirSync(carpetaReal);
  writeFileSync(join(carpetaAtajos, 'herramienta-x'), ''); writeFileSync(join(carpetaReal, 'herramienta-x'), '');
  ok('buscarReal no vuelve a caer en el atajo', buscarReal('herramienta-x', carpetaAtajos, [carpetaAtajos, carpetaReal].join(delimiter)) === join(carpetaReal, 'herramienta-x'));
  ok('buscarReal devuelve vacío si solo existe el atajo', buscarReal('herramienta-x', carpetaAtajos, carpetaAtajos) === '');
  if (process.platform === 'win32') {
    const cmdNpm = correr('cmd', ['/c', join(aqui, 'shims', 'npm.cmd'), '--version'], { cwd: tmp });
    ok('npm.cmd (Windows) ejecuta la herramienta real', cmdNpm.status === 0 && /^\d+\.\d+/.test(cmdNpm.stdout.trim()), `estado ${cmdNpm.status}: ${cmdNpm.stderr.slice(0, 120)}`);
    const cmdGlab = correr('cmd', ['/c', join(aqui, 'shims', 'glab.cmd'), 'mr', 'merge', '5'], { cwd: tmp });
    ok('glab.cmd (Windows) bloquea la fusión', cmdGlab.status === 1 && /BLOQUEADO/.test(cmdGlab.stderr), `estado ${cmdGlab.status}: ${cmdGlab.stderr.slice(0, 120)}`);
  }

  // ── Protocolo de hook de Codex (mismo que Claude Code) ────────────────────────────────
  const guardia = join(aqui, 'guardia-gitlab.mjs');
  const evento = (tool, command, cwd) => correr('node', [guardia], { input: JSON.stringify({ session_id: 's', turn_id: 't', hook_event_name: 'PreToolUse', tool_name: tool, tool_use_id: 'u', tool_input: { command }, cwd, model: 'm', permission_mode: 'default' }) });
  const decision = (r) => { try { return JSON.parse(r.stdout).hookSpecificOutput.permissionDecision; } catch { return 'allow'; } };
  git(trabajo, 'checkout', '-q', 'develop');
  ok('evento de Codex (Bash): push a develop se deniega', decision(evento('Bash', 'git push origin develop', trabajo)) === 'deny');
  ok('evento de Codex (exec_command): glab mr merge se deniega', decision(evento('exec_command', 'glab mr merge 3', trabajo)) === 'deny');
  ok('evento de Codex: una herramienta que no es shell no se evalúa', decision(evento('apply_patch', 'git push origin develop', trabajo)) === 'allow');
  const estrictoCodex = correr('node', [guardia, '--estricto'], { input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git push origin feature/z' }, cwd: trabajo }) });
  ok('evento de Codex en modo estricto: un push que pediría confirmación se deniega', decision(estrictoCodex) === 'deny');
  ok('evento de Claude (sin modo estricto): ese mismo push sigue pidiendo confirmación', decision(evento('Bash', 'git push origin feature/z', trabajo)) === 'ask');
  ok('evento de Codex: un comando inocuo pasa', decision(evento('Bash', 'git status', trabajo)) === 'allow');

  // ── Instalador ─────────────────────────────────────────────────────────────────────────
  const instalador = join(aqui, 'instalar-guardias-universales.mjs');
  const casa = join(tmp, 'casa'), hooksCodex = join(tmp, 'codex', 'hooks.json'), repo2 = join(tmp, 'repo2');
  mkdirSync(repo2); correr('git', ['init', '-q', repo2]);
  mkdirSync(dirname(hooksCodex), { recursive: true });
  writeFileSync(hooksCodex, JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'otro-hook.sh' }] }] }, otra_clave: 1 }));
  const baseArgs = ['--home', casa, '--codex', hooksCodex, '--git-repo', repo2];
  const previa = correr('node', [instalador, ...baseArgs]);
  ok('vista previa no escribe nada', previa.status === 0 && !existsSync(casa) && /vista previa/.test(previa.stdout), previa.stderr.slice(0, 160));
  const aplica = () => correr('node', [instalador, '--apply', ...baseArgs]);
  const a1 = aplica();
  ok('instalar termina bien', a1.status === 0, a1.stderr.slice(0, 200));
  for (const f of ['guardia-gitlab.mjs', 'guardia-git.mjs', 'guardia-shim.mjs', 'githooks/pre-push', 'shims/npm.cmd', 'shims/glab', 'VERSION']) ok(`se copió ${f}`, existsSync(join(casa, 'actual', f)));
  ok('el pre-push instalado conserva LF', !readFileSync(join(casa, 'actual', 'githooks', 'pre-push'), 'utf8').includes('\r'));
  const leer = () => JSON.parse(readFileSync(hooksCodex, 'utf8'));
  const propios = () => leer().hooks.PreToolUse.flatMap((g) => g.hooks).filter((h) => /guardia-gitlab\.mjs/.test(h.command));
  ok('hooks de Codex: queda un hook propio con matcher Bash', propios().length === 1 && leer().hooks.PreToolUse.some((g) => g.matcher === 'Bash' && g.hooks.some((h) => /guardia-gitlab\.mjs/.test(h.command))));
  ok('hooks de Codex: el hook propio va en modo estricto (Codex no sabe pedir confirmación)', propios().every((h) => /--estricto/.test(h.command)));
  ok('hooks de Codex: se conserva el hook ajeno y las demás claves', leer().hooks.PreToolUse.flatMap((g) => g.hooks).some((h) => h.command === 'otro-hook.sh') && leer().otra_clave === 1);
  ok('git: core.hooksPath del repositorio apunta a las guardias copiadas', aSlash(git(repo2, 'config', '--local', '--get', 'core.hooksPath').stdout.trim()) === aSlash(join(casa, 'actual', 'githooks')));
  aplica();
  ok('instalar dos veces no duplica el hook', propios().length === 1);
  const desinstala = correr('node', [instalador, '--apply', '--quitar', ...baseArgs]);
  ok('quitar termina bien', desinstala.status === 0, desinstala.stderr.slice(0, 200));
  ok('quitar elimina solo el hook propio', propios().length === 0 && leer().hooks.PreToolUse.flatMap((g) => g.hooks).some((h) => h.command === 'otro-hook.sh'));
  ok('quitar desactiva git y borra la copia', git(repo2, 'config', '--local', '--get', 'core.hooksPath').stdout.trim() === '' && !existsSync(join(casa, 'actual')));
  ok('el instalador rechaza opciones desconocidas', correr('node', [instalador, '--cualquier-cosa']).status !== 0);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n${total} casos, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
