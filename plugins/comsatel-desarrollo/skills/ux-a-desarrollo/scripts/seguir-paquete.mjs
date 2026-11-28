#!/usr/bin/env node
// Sigue los artefactos de diseño de un paquete (UXR, FLW, SCR y DEC con la etiqueta dsp-NNN) mientras se
// desarrolla, para enterarse de lo que otro cambió en la KB sin esperar al MR.
//
// Uso:
//   node seguir-paquete.mjs registrar --kb <ruta-kb> --paquete DSP-009   guarda la revisión actual de origin/develop
//   node seguir-paquete.mjs revisar [--fetch] [--json]                      lista lo que cambió desde la revisión guardada
//   node seguir-paquete.mjs visto [--paquete DSP-009]                       marca lo cambiado como revisado
//   node seguir-paquete.mjs quitar --paquete DSP-009                        deja de seguirlo
//   node seguir-paquete.mjs estado                                          muestra qué se sigue
//
// Estado en ~/.claude/ux-a-desarrollo/seguimiento.json (o UX_SEGUIMIENTO). Con --fetch usa GITLAB_NPM_TOKEN como
// autenticación básica inline, sin imprimirlo; si el fetch falla, compara con la copia local de origin/develop.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CARPETAS = ['design/ux-requirements', 'design/user-flows', 'design/screens', 'design/decisiones'];
const RAMA = 'origin/develop';
const archivoEstado = () => process.env.UX_SEGUIMIENTO || path.join(os.homedir(), '.claude', 'ux-a-desarrollo', 'seguimiento.json');

export function leerEstado() {
  const f = archivoEstado();
  if (!existsSync(f)) return { paquetes: [] };
  try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return { paquetes: [] }; }
}

function guardarEstado(estado) {
  const f = archivoEstado();
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(estado, null, 2) + '\n');
}

function git(kb, args, extra = {}) {
  const r = spawnSync('git', ['-C', kb, ...args], { encoding: 'utf8', timeout: 15000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }, ...extra });
  return { ok: r.status === 0, salida: (r.stdout || '').trim() };
}

export function traerDevelop(kb) {
  const args = ['-c', 'credential.helper='];
  const token = process.env.GITLAB_NPM_TOKEN;
  if (token) args.push('-c', `http.extraHeader=Authorization: Basic ${Buffer.from(`oauth2:${token}`).toString('base64')}`);
  return git(kb, [...args, 'fetch', '--quiet', 'origin', 'develop']).ok;
}

const etiqueta = (paquete) => paquete.toLowerCase();

export function cambios(kb, paquete, desde) {
  const diff = git(kb, ['diff', '--name-status', `${desde}..${RAMA}`, '--', ...CARPETAS]);
  if (!diff.ok) return { error: `no se pudo comparar ${desde} con ${RAMA}` };
  const re = new RegExp(`\\b${etiqueta(paquete)}\\b`, 'i');
  const lista = [];
  for (const linea of diff.salida.split('\n').filter(Boolean)) {
    const [tipo, ...rutas] = linea.split('\t');
    const ruta = rutas[rutas.length - 1];
    const borrado = tipo.startsWith('D');
    const contenido = borrado ? git(kb, ['show', `${desde}:${ruta}`]) : git(kb, ['show', `${RAMA}:${ruta}`]);
    if (contenido.ok && re.test(contenido.salida)) lista.push({ tipo: borrado ? 'borrado' : tipo.startsWith('A') ? 'nuevo' : 'cambiado', ruta });
  }
  const autor = git(kb, ['log', '-1', '--format=%an, %ad', '--date=short', RAMA, '--', ...CARPETAS]).salida;
  return { cambios: lista, ultimo: autor };
}

export function revisar({ fetch = false } = {}) {
  const estado = leerEstado();
  return estado.paquetes.map((p) => {
    const traido = fetch ? traerDevelop(p.kb) : null;
    return { ...p, traido, ...cambios(p.kb, p.paquete, p.revision) };
  });
}

function opcion(args, nombre) {
  const i = args.indexOf(nombre);
  return i >= 0 ? args[i + 1] : undefined;
}

export function main(args) {
  const [orden, ...resto] = args;
  const estado = leerEstado();
  if (orden === 'registrar') {
    const kb = opcion(resto, '--kb');
    const paquete = (opcion(resto, '--paquete') || '').toUpperCase();
    if (!kb || !/^DSP-\d{3}$/.test(paquete)) { console.error('Uso: registrar --kb <ruta> --paquete DSP-NNN'); return 2; }
    const rev = git(path.resolve(kb), ['rev-parse', RAMA]);
    if (!rev.ok) { console.error(`${kb}: no tiene ${RAMA}; haz fetch primero`); return 1; }
    estado.paquetes = estado.paquetes.filter((p) => p.paquete !== paquete);
    estado.paquetes.push({ paquete, kb: path.resolve(kb), revision: rev.salida, desde: new Date().toISOString().slice(0, 10) });
    guardarEstado(estado);
    console.log(`Siguiendo ${paquete} en ${kb} desde ${rev.salida.slice(0, 8)}`);
    return 0;
  }
  if (orden === 'revisar') {
    const res = revisar({ fetch: resto.includes('--fetch') });
    if (resto.includes('--json')) { console.log(JSON.stringify(res, null, 2)); return 0; }
    if (!res.length) { console.log('No se sigue ningún paquete.'); return 0; }
    for (const r of res) {
      if (r.error) { console.log(`${r.paquete}: ${r.error}`); continue; }
      if (!r.cambios.length) { console.log(`${r.paquete}: sin cambios desde ${r.desde}`); continue; }
      console.log(`${r.paquete}: ${r.cambios.length} artefactos cambiaron (último cambio: ${r.ultimo})`);
      for (const c of r.cambios) console.log(`  ${c.tipo.padEnd(9)} ${c.ruta}`);
    }
    return 0;
  }
  if (orden === 'visto') {
    const filtro = (opcion(resto, '--paquete') || '').toUpperCase();
    for (const p of estado.paquetes) {
      if (filtro && p.paquete !== filtro) continue;
      const rev = git(p.kb, ['rev-parse', RAMA]);
      if (rev.ok) { p.revision = rev.salida; p.desde = new Date().toISOString().slice(0, 10); }
    }
    guardarEstado(estado);
    console.log('Marcado como revisado.');
    return 0;
  }
  if (orden === 'quitar') {
    const paquete = (opcion(resto, '--paquete') || '').toUpperCase();
    estado.paquetes = estado.paquetes.filter((p) => p.paquete !== paquete);
    guardarEstado(estado);
    console.log(`${paquete} ya no se sigue.`);
    return 0;
  }
  if (orden === 'estado') {
    if (!estado.paquetes.length) console.log('No se sigue ningún paquete.');
    for (const p of estado.paquetes) console.log(`${p.paquete}  ${p.kb}  desde ${p.desde} (${p.revision.slice(0, 8)})`);
    return 0;
  }
  console.error('Órdenes: registrar, revisar, visto, quitar, estado');
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exit(main(process.argv.slice(2)));
}
