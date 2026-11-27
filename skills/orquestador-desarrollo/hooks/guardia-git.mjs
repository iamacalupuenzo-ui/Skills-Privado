#!/usr/bin/env node
// Adaptador de git: la guardia para cualquier agente (Codex, opencode, Qoder, Antigravity, Claude, una persona).
// Git llama a este archivo desde el hook pre-push de `githooks/`, así que no depende de qué LLM lanzó el
// comando ni de cómo lo escribió: se revisa lo que git va a subir de verdad (ramas, etiquetas, borrados, forzados).
//   node guardia-git.mjs pre-push <remoto> <url>   (las líneas "ref-local sha-local ref-remota sha-remota" llegan por stdin)
// Reutiliza las reglas de guardia-gitlab.mjs; no las duplica.
// Salida: 0 deja subir; 1 aborta el push. Un "ask" (confirmación) se avisa por stderr y deja pasar, salvo en modo
// estricto (COMSATEL_GUARDIA_ASK=deny o --estricto), pensado para agentes sin nadie al teclado.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AVISO_BLOQUEO, evaluar, modoEstricto } from './guardia-gitlab.mjs';

const CEROS = /^0+$/;

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

// ¿La rama remota deja de ser ancestro de lo que se sube? Entonces el push reescribe historia (es un forzado).
function reescribeHistoria(shaRemoto, shaLocal) {
  if (CEROS.test(shaRemoto)) return false;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', shaRemoto, shaLocal], { stdio: 'ignore' });
    return false;
  } catch (e) {
    return e.status === 1; // 128 = el objeto remoto no está en el clon: no se puede afirmar
  }
}

// Traduce cada ref que git va a subir al comando equivalente, para que decidan las mismas reglas de siempre.
export function comandosDePush(lineas, remoto) {
  const comandos = [];
  for (const linea of lineas) {
    const [refLocal, shaLocal, refRemota, shaRemoto] = linea.trim().split(/\s+/);
    if (!refRemota) continue;
    const destino = refRemota;
    if (CEROS.test(shaLocal)) {
      comandos.push(`git push --delete ${remoto} ${destino.replace(/^refs\/heads\//, '')}`);
    } else if (destino.startsWith('refs/tags/')) {
      comandos.push(`git push ${remoto} ${destino}`);
    } else if (reescribeHistoria(shaRemoto, shaLocal)) {
      comandos.push(`git push --force ${remoto} ${refLocal}:${destino}`);
    } else {
      comandos.push(`git push ${remoto} ${refLocal}:${destino}`);
    }
  }
  return comandos;
}

function principal() {
  const [, , gancho, remoto = 'origin'] = process.argv;
  if (gancho !== 'pre-push') process.exit(0);
  let entrada = '';
  try { entrada = readFileSync(0, 'utf8'); } catch { process.exit(0); }
  const lineas = entrada.split(/\r?\n/).filter(Boolean);
  const cwd = (() => { try { return git('rev-parse', '--show-toplevel'); } catch { return process.cwd(); } })();
  const avisos = [];
  for (const cmd of comandosDePush(lineas, remoto)) {
    const r = evaluar(cmd, cwd);
    if (!r) continue;
    const [tipo, titulo, motivo, que] = r;
    if (tipo === 'deny') {
      process.stderr.write(`${AVISO_BLOQUEO(titulo, motivo, que)}\n(Guardia de Comsatel en git; no depende del agente que lo ejecutó.)\n`);
      process.exit(1);
    }
    avisos.push([titulo, motivo, que]);
  }
  if (avisos.length && modoEstricto()) {
    const [titulo, motivo] = avisos[0];
    process.stderr.write(`${AVISO_BLOQUEO(titulo, `${motivo}\n(Modo estricto: aquí no hay nadie que confirme.)`, 'Pídele la confirmación a la persona responsable y que ella ejecute el push en su terminal.')}\n`);
    process.exit(1);
  }
  for (const [titulo, motivo] of avisos) process.stderr.write(`AVISO de la guardia: ${titulo}\n${motivo}\n`);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) principal();
