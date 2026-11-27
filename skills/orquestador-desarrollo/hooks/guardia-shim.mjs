#!/usr/bin/env node
// Atajo de shell para cualquier agente: se antepone a glab, npm y curl en el PATH. Antes de ejecutar la
// herramienta real pasa el comando por las reglas de guardia-gitlab.mjs (fusionar un MR por glab, `npm publish`,
// fusiones o etiquetas por la API con curl). Funciona en cualquier terminal que herede el PATH: Orca, Codex,
// opencode, Qoder, Antigravity o una persona.
//   node guardia-shim.mjs <herramienta> [argumentos...]
// Límite honesto: no cubre `Invoke-RestMethod`, un `curl` con ruta absoluta ni un script que llame a la API.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AVISO_BLOQUEO, evaluar, modoEstricto } from './guardia-gitlab.mjs';

const EXTENSIONES = process.platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : [''];

const comoComando = (herramienta, args) =>
  [herramienta, ...args.map((a) => (/[\s"'&|;<>()]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a))].join(' ');

// Busca la herramienta real en el PATH sin volver a caer en el propio atajo.
export function buscarReal(herramienta, carpetaAtajos, path = process.env.PATH || '') {
  const evitar = carpetaAtajos ? resolve(carpetaAtajos).toLowerCase() : '';
  for (const dir of path.split(delimiter).filter(Boolean)) {
    if (evitar && resolve(dir).toLowerCase() === evitar) continue;
    for (const ext of EXTENSIONES) {
      const candidato = join(dir, herramienta + ext);
      if (existsSync(candidato)) return candidato;
    }
  }
  return '';
}

function principal() {
  const [, , herramienta, ...args] = process.argv;
  if (!herramienta) { process.stderr.write('Uso: guardia-shim.mjs <herramienta> [argumentos...]\n'); process.exit(2); }
  const r = evaluar(comoComando(herramienta, args), process.cwd());
  if (r) {
    const [tipo, titulo, motivo, que] = r;
    if (tipo === 'deny' || modoEstricto()) {
      process.stderr.write(`${AVISO_BLOQUEO(titulo, motivo, que)}\n(Guardia de Comsatel en el PATH; no depende del agente que lo ejecutó.)\n`);
      process.exit(1);
    }
    process.stderr.write(`AVISO de la guardia: ${titulo}\n${motivo}\n`);
  }
  const real = buscarReal(herramienta, process.env.COMSATEL_SHIM_DIR);
  if (!real) { process.stderr.write(`No se encontró «${herramienta}» en el PATH (fuera del atajo).\n`); process.exit(127); }
  const conShell = /\.(cmd|bat)$/i.test(real);
  const salida = spawnSync(conShell ? `"${real}"` : real, conShell ? args.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)) : args, { stdio: 'inherit', shell: conShell });
  process.exit(salida.status ?? 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) principal();
