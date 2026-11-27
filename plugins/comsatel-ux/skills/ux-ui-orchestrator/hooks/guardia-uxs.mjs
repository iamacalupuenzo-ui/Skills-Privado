#!/usr/bin/env node
// Guardia de la UXS (hook PreToolUse de Claude Code): una rama de diseño `ux/*` no se sube si toca un paquete DSP-NNN
// con pantallas especificadas y ninguna UXS lo indexa. La comprobación es `scripts/audit_ux.py --exigir-uxs --desde-rama`;
// este archivo solo decide cuándo ejecutarla y traduce su resultado a una decisión del hook.
//
// Lee el evento por stdin y responde con un JSON `permissionDecision` ("deny" o "ask") por stdout y salida 0. No usa el
// código de salida 2: en Windows los hooks pasan por PowerShell, que convierte cualquier fallo en código 1, y el 1 no bloquea.
//
// Modo (variable de entorno COMSATEL_UX_GUARDIA, la fija la persona, no el agente):
//   bloquea (por defecto) → deny      aviso → ask (pide confirmar)      off → no hace nada
// Documentación: ../references/controles-de-cierre.md
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const AUDITORIA = join(AQUI, '..', 'scripts', 'audit_ux.py');
const BASES = ['origin/develop', 'origin/main'];

// Divide el comando en sentencias simples (; & | y saltos de línea).
const sentencias = (cmd) => cmd.split(/;|&&|\|\||\||\r?\n|&(?!&)/).map((s) => s.trim()).filter(Boolean);
const tokens = (s) => (s.match(/"[^"]*"|'[^']*'|\S+/g) || []).map((t) => t.replace(/^["']|["']$/g, ''));

// Quita el texto libre que no es un comando: cuerpos de heredoc y mensajes de commit.
function sinTextoLibre(cmd) {
  return cmd
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\b/g, '<<$2')
    .replace(/(\s(?:-m|--message)(?:=|\s+))("(?:[^"\\]|\\.)*"|'[^']*')/g, '$1""');
}

// Una sentencia `git ... push ...` o el envoltorio `node git-auth.mjs <repo> push ...` que usa el equipo para no escribir el token.
// Devuelve { opciones, args, dirC } o null.
function analizarPush(sentencia) {
  const t = tokens(sentencia);
  if (!t.length) return null;
  const primero = t[0].replace(/^.*[\\/]/, '').toLowerCase();
  let i = 1;
  let dirC = '';
  if (/^git(\.exe)?$/.test(primero)) {
    while (i < t.length) {
      if (t[i] === '-c' || t[i] === '--config') { i += 2; continue; }
      if (t[i] === '-C') { dirC = t[i + 1] || ''; i += 2; continue; }
      if (t[i].startsWith('-')) { i += 1; continue; }
      break;
    }
  } else if (/^(node|node\.exe)$/.test(primero) && /git-auth/i.test(t[1] || '')) {
    dirC = t[2] || '';
    i = 3;
  } else {
    return null;
  }
  if (t[i] !== 'push') return null;
  const resto = t.slice(i + 1);
  return { opciones: resto.filter((x) => x.startsWith('-')), args: resto.filter((x) => !x.startsWith('-')), dirC };
}

const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 }).trim();

// Qué se sube: { origen, destino } del refspec (`HEAD:ux/x`, `local:ux/x`, `ux/x`), o la rama actual si no se indica.
function refspecDe(args, actual) {
  const refspec = args.length >= 2 ? args[1].replace(/^\+/, '') : '';
  if (!refspec) return { origen: actual, destino: actual };
  const [src, dst] = refspec.includes(':') ? refspec.split(':') : [refspec, refspec];
  const limpia = (r) => r.replace(/^refs\/heads\//, '');
  return { origen: limpia(src), destino: limpia(dst) };
}

function interprete() {
  for (const [bin, ...pre] of [['py', '-3'], ['python3'], ['python']]) {
    const r = spawnSync(bin, [...pre, '--version'], { encoding: 'utf8', timeout: 8000 });
    if (r.status === 0) return [bin, ...pre];
  }
  return null;
}

// Devuelve null (pasa) o { tipo: 'deny'|'ask', razon }.
function evaluar(cmd, cwdEvento) {
  const modo = (process.env.COMSATEL_UX_GUARDIA || 'bloquea').toLowerCase();
  if (modo === 'off') return null;
  let dirBase = cwdEvento;
  for (const s of sentencias(sinTextoLibre(cmd))) {
    const cd = s.match(/^(?:cd|set-location|pushd)\s+(?:\/d\s+)?("[^"]+"|'[^']+'|\S+)/i);
    if (cd) { dirBase = resolve(dirBase, cd[1].replace(/^["']|["']$/g, '')); continue; }
    const push = analizarPush(s);
    if (!push) continue;
    if (push.opciones.some((o) => /^(-n|--dry-run|-d|--delete|--tags|--follow-tags|--mirror)$/.test(o))) continue;
    const dir = push.dirC ? resolve(dirBase, push.dirC) : dirBase;
    let raiz;
    try { raiz = git(dir, 'rev-parse', '--show-toplevel'); } catch { continue; }
    // Solo repositorios de diseño (knowledge-base): tienen design/ux-requirements y design/specs.
    if (!existsSync(join(raiz, 'design', 'ux-requirements')) || !existsSync(join(raiz, 'design', 'specs'))) continue;
    let actual = '';
    try { actual = git(raiz, 'branch', '--show-current'); } catch { /* HEAD suelto */ }
    const { origen, destino } = refspecDe(push.args, actual);
    if (!destino.startsWith('ux/')) continue;
    // Solo se puede analizar lo que está en HEAD: si el origen es otra rama distinta de la actual, no se opina.
    if (origen !== 'HEAD' && origen !== actual) continue;
    return comprobar(raiz, destino, modo);
  }
  return null;
}

function comprobar(raiz, rama, modo) {
  const py = interprete();
  const noPude = (porque) => ({ tipo: 'ask', razon: `No pude comprobar que los paquetes de ${rama} tengan UXS (${porque}). Confirma solo si ya los consolidaste o lo vas a hacer antes de pedir el merge.` });
  if (!py) return noPude('no encontré Python (py, python3 o python)');
  if (!existsSync(AUDITORIA)) return noPude('falta scripts/audit_ux.py');
  const base = BASES.find((b) => { try { git(raiz, 'rev-parse', '--verify', '--quiet', b); return true; } catch { return false; } });
  if (!base) return noPude('no encuentro origin/develop para ver qué paquetes toca la rama; haz git fetch origin');
  const r = spawnSync(py[0], [...py.slice(1), AUDITORIA, raiz, '--exigir-uxs', '--desde-rama', base, '--json'], { encoding: 'utf8', timeout: 60000, maxBuffer: 32 * 1024 * 1024 });
  let reporte;
  try { reporte = JSON.parse(r.stdout); } catch { return noPude('la auditoría no devolvió un resultado legible'); }
  const codigosBloqueantes = new Set(['PAQUETE_SIN_UXS', 'SCR_SIN_INV_DEC', 'VALIDADO_SIN_PRUEBA',
    'VALIDADO_SIN_A11Y_IMPLEMENTADA', 'ITERACION_SIN_PROPUESTA_CAPTURA', 'ITERACION_SIN_APROBACION', 'ITERACION_INVALIDA', 'EXPLORACION_SIN_CAPTURA']);
  const faltan = (reporte.controles || []).filter((c) => c.nivel === 'error' && codigosBloqueantes.has(c.codigo));
  if (!faltan.length) return null;
  const lista = faltan.map((c) => `  - ${c.mensaje}`).join('\n');
  const razon = [
    `BLOQUEADO: subir ${rama} con controles de UX pendientes (${[...new Set(faltan.map((c) => c.codigo))].join(', ')})`,
    'Motivo: un paquete con pantallas especificadas se consolida en una UXS (con el veredicto por consumidor) antes de subir su diseño. Es el paquete que leen Claude Design, QA y Desarrollo, y sin ella se pierde la trazabilidad.',
    lista,
    'Qué hacer: completa la UXS, INV/DEC, propuesta de iteración, prueba con Enzo, captura y ARP implementado según los errores indicados; ejecuta audit_ux.py --compuerta <G> antes de avanzar.',
    'Si es una excepción real, la persona (no el agente) puede fijar COMSATEL_UX_GUARDIA=aviso en su entorno.',
  ].join('\n');
  return { tipo: modo === 'aviso' ? 'ask' : 'deny', razon };
}

let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (entrada += c));
process.stdin.on('end', () => {
  let evento;
  try { evento = JSON.parse(entrada); } catch { process.exit(0); }
  if (!/^(Bash|PowerShell)$/i.test(evento.tool_name || '')) process.exit(0);
  const cmd = evento.tool_input?.command || '';
  if (!cmd) process.exit(0);
  let r = null;
  try { r = evaluar(cmd, evento.cwd || process.cwd()); } catch { r = null; }
  if (!r) process.exit(0);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: r.tipo, permissionDecisionReason: r.razon },
  }));
  process.exit(0);
});
