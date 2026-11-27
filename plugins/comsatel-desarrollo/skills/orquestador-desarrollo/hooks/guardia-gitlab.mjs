#!/usr/bin/env node
// Guardia de acciones críticas sobre GitLab de Comsatel (hook PreToolUse de Claude Code).
// Lee el evento por stdin. Si la acción es crítica, la bloquea o pide confirmación, siempre con un
// JSON `permissionDecision` ("deny" o "ask") por stdout y salida 0. No se usa el código de salida 2:
// en Windows los hooks pasan por PowerShell, que convierte cualquier fallo de un comando nativo en
// código 1, y el código 1 no bloquea (el comando se ejecutaría). Lo demás pasa sin ruido.
// Documentación: ../references/hooks-bloqueantes.md
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// integration es la rama que despliega en DEV en CL2 (desde 2026-11-12): también entra solo por MR.
export const PROTEGIDAS = ['develop', 'integration', 'main', 'release'];

export const AVISO_BLOQUEO = (titulo, motivo, que) =>
  `BLOQUEADO: ${titulo}\nMotivo: ${motivo}\nQué hacer: ${que}`;

function ramaActual(cwd, dirOpt) {
  try {
    const args = [];
    if (dirOpt) args.push('-C', dirOpt);
    args.push('branch', '--show-current');
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function remotoDe(cwd) {
  try {
    return execFileSync('git', ['remote', 'get-url', 'origin'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

// Avisos de un push a un producto (no bloquean: se suman a la confirmación). Solo lecturas locales y
// rápidas, sin red: la versión del DS en package.json y `git merge-tree` contra origin/integration tal
// como está en el clon. La revisión completa la hacen revisar_ds.py y simular_fusion.py (flujo-producto).
function avisosDePush(dir) {
  const avisos = [];
  const git = (...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 4000 });
  let raiz = '';
  try { raiz = git('rev-parse', '--show-toplevel').trim(); } catch { return avisos; }
  try {
    const pkg = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'));
    const v = (pkg.dependencies || {})['@comsatel/ui-components'] || (pkg.devDependencies || {})['@comsatel/ui-components'];
    if (v && !/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(v)) avisos.push(`El DS no tiene versión exacta («${v}»).`);
    else if (v && v.includes('-')) avisos.push(`El DS fijado es una prerelease (${v}): corre revisar_ds.py; si ya hay una estable igual o mayor, fíjala antes del MR.`);
  } catch { /* sin package.json o sin DS: nada que avisar */ }
  try {
    git('rev-parse', '--verify', '--quiet', 'refs/remotes/origin/integration');
    try {
      git('merge-tree', '--write-tree', '--name-only', '--no-messages', 'origin/integration', 'HEAD');
    } catch (e) {
      if (e.status === 1) {
        const archivos = String(e.stdout || '').trim().split(/\r?\n/).slice(1).filter(Boolean);
        avisos.push(`HEAD choca con origin/integration en ${archivos.length} archivos (según el último fetch): corre simular_fusion.py e integra con git merge antes del MR.`);
      }
    }
  } catch { /* el repo no tiene integration */ }
  return avisos;
}

// Divide el comando en sentencias simples (; & | y saltos de línea).
function sentencias(cmd) {
  return cmd.split(/;|&&|\|\||\||\r?\n|&(?!&)/).map((s) => s.trim()).filter(Boolean);
}

function tokens(s) {
  return (s.match(/"[^"]*"|'[^']*'|\S+/g) || []).map((t) => t.replace(/^["']|["']$/g, ''));
}

// Devuelve { opciones, args, dirC } de una sentencia `git ... <sub> ...`, o null si no es esa subcomando.
function analizarGit(sentencia, sub) {
  const t = tokens(sentencia);
  if (!t.length || !/^git(\.exe)?$/i.test(t[0].replace(/^.*[\\/]/, ''))) return null;
  let i = 1;
  let dirC = '';
  while (i < t.length) {
    if (t[i] === '-c' || t[i] === '--config') { i += 2; continue; }
    if (t[i] === '-C') { dirC = t[i + 1] || ''; i += 2; continue; }
    if (t[i].startsWith('-')) { i += 1; continue; }
    break;
  }
  if (t[i] !== sub) return null;
  const resto = t.slice(i + 1);
  return { opciones: resto.filter((x) => x.startsWith('-')), args: resto.filter((x) => !x.startsWith('-')), dirC };
}

// Quita el texto libre que no es un comando: cuerpos de heredoc y mensajes de commit (-m / --message).
// Así "bloquea npm publish" escrito en un mensaje de commit no se confunde con ejecutar npm publish.
function sinTextoLibre(cmd) {
  return cmd
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\b/g, '<<$2')
    .replace(/(\s(?:-m|--message)(?:=|\s+))("(?:[^"\\]|\\.)*"|'[^']*')/g, '$1""');
}

export function evaluar(cmd, cwd) {
  const todo = sinTextoLibre(cmd);

  // 1. Token: nunca imprimirlo ni escribirlo en un comando (se revisa el texto completo).
  if (/glpat-[A-Za-z0-9_-]{10,}/.test(cmd)) {
    return ['deny', 'Token de GitLab escrito dentro del comando',
      'Un token pegado en un comando queda en el historial y en los registros de la sesión.',
      'Guárdalo como variable de usuario GITLAB_TOKEN (una sola vez) y usa la variable. Si ya se pegó en algún sitio, revócalo en GitLab y crea uno nuevo.'];
  }
  const imprime = /(\becho\b|write-host|write-output|\bprintenv\b|\bcat\b|\btype\b|out-file|set-content|add-content|\btee\b|\bprint\b|console\.log)[^|;\r\n]*GITLAB(_NPM)?_TOKEN/i;
  const volcado = /(get-childitem|gci|\bdir\b|\bls\b)\s+env:|\bprintenv\b\s*($|[|;&])|\benv\b\s*($|\|)/i;
  const volcadoDotNet = /\[(?:System\.)?Environment\]::GetEnvironmentVariables\s*\(/i;
  const tokenSuelto = sentencias(todo).some((s) => /^(?:\(\s*|")*\$env:GITLAB(?:_NPM)?_TOKEN(?:\.ToString\(\))?(?:"|\s*\))*$/i.test(s));
  const tokenDotNetSuelto = sentencias(todo).some((s) => /^\[(?:System\.)?Environment\]::GetEnvironmentVariable\s*\(\s*["']GITLAB(?:_NPM)?_TOKEN["'][^)]*\)\s*$/i.test(s));
  if (imprime.test(todo) || volcado.test(todo) || volcadoDotNet.test(todo) || tokenSuelto || tokenDotNetSuelto) {
    return ['deny', 'Mostrar secretos o volcar variables de entorno',
      'El token da acceso a tu cuenta de GitLab; si se imprime queda en el historial y en la conversación.',
      'Para comprobar que existe, pide su longitud o prueba una llamada a la API (`/api/v4/user`) sin mostrarlo.'];
  }

  // 2. Fusionar por API o glab.
  if (/merge_requests\/\d+\/merge\b/i.test(todo) || /\bglab\s+mr\s+(merge|accept)\b/i.test(todo)) {
    return ['deny', 'Fusionar un merge request',
      'El agente no fusiona. Fusiona quien revisa: Luis (lrodriguez) los MR de productos hacia integration; en el DS, Enzo los de develop y release y César el de main; César los del knowledge-base.',
      'Deja el MR listo (pipeline en verde, sin conflictos ni discusiones abiertas) y asígnalo a su revisor con un comentario. El responsable del repositorio también puede fusionar, pero lo decide él en la interfaz de GitLab.'];
  }

  // 3. Etiquetas y publicación de paquetes.
  if (/repository\/tags/i.test(todo) && /(-X\s*POST|--request\s*POST|-Method\s+Post|--data|-d\s|-Body|fetch\()/i.test(todo)) {
    return ['deny', 'Crear una etiqueta por la API',
      'La etiqueta ds-vX.Y.Z del sistema de diseño la crea el job `tag ds` al publicar la estable en main. Una creada a mano no publica nada y ocupa la del pipeline.',
      'Para la estable: César fusiona release → main y ejecuta el job manual `publish`. Las prereleases salen solas en cada rama.'];
  }
  if (/\bnpm\s+publish\b/i.test(todo)) {
    return ['deny', 'npm publish',
      'Publicar un paquete es irreversible. El sistema de diseño lo publica su pipeline: cada rama su prerelease y main la estable con el job manual `publish`.',
      'Prepara la versión y el MR. La estable la publica César desde el pipeline de main.'];
  }

  for (const s of sentencias(todo)) {
    // Sigue los `cd` del propio comando para saber en qué repo se ejecuta cada git.
    const cd = s.match(/^(?:cd|set-location|pushd)\s+(?:\/d\s+)?("[^"]+"|'[^']+'|\S+)/i);
    if (cd) {
      cwd = cd[1].replace(/^["']|["']$/g, '').replace(/^\/([a-z])\//i, '$1:/');
      continue;
    }
    // 4. git tag que crea o borra etiquetas.
    const tag = analizarGit(s, 'tag');
    if (tag) {
      const soloListar = tag.opciones.every((o) => /^(-l|--list|-n\d*|--sort=.*|--contains|--points-at|-v|--verify)$/.test(o)) && !tag.opciones.some((o) => /^-[asfmd]$|--delete/.test(o));
      const crea = tag.args.length > 0 || tag.opciones.some((o) => /^-[asfmd]$|--delete/.test(o));
      if (crea && !(soloListar && tag.opciones.some((o) => /^(-l|--list)$/.test(o)))) {
        return ['deny', 'git tag (crear o borrar una etiqueta)',
          'Las etiquetas ds-v* las crea el pipeline de main al publicar la estable. Una creada a mano no publica y ocupa la del pipeline.',
          'No crees etiquetas. Para solo mirar las existentes usa `git tag --list`.'];
      }
    }

    // 5. git push.
    const push = analizarGit(s, 'push');
    if (!push) continue;
    const dry = push.opciones.some((o) => o === '-n' || o === '--dry-run');
    if (dry) continue;

    if (push.opciones.some((o) => /^(--tags|--follow-tags|--mirror)$/.test(o)) || push.args.some((a) => /refs\/tags\//.test(a))) {
      return ['deny', 'git push de etiquetas o espejo',
        'Las etiquetas ds-v* las crea el pipeline de main al publicar la estable; no se suben a mano.',
        'Sube solo tu rama; la estable la publica César con el job `publish` de main.'];
    }
    if (push.opciones.some((o) => /^(-f|--force|--force-with-lease(=.*)?|--force-if-includes)$/.test(o)) || push.args.some((a) => a.startsWith('+'))) {
      return ['deny', 'git push forzado',
        'Reescribe la historia remota y puede borrar el trabajo de otras personas.',
        'Haz un commit nuevo o un rebase local y vuelve a subir sin forzar. Si de verdad hace falta forzar, que lo decida el responsable del repositorio en su terminal.'];
    }
    if (push.opciones.some((o) => /^(-d|--delete)$/.test(o))) {
      return ['deny', 'git push --delete (borrar una rama remota)',
        'Borrar ramas remotas es irreversible desde aquí; GitLab ya borra la rama fuente al fusionar el MR.',
        'Déjala: se elimina sola cuando César fusione el MR.'];
    }

    // Destinos explícitos (origin develop, HEAD:main, refs/heads/release...). El primer argumento es el remoto.
    const refspecs = push.args.slice(1);
    const destinos = refspecs.map((r) => {
      const d = r.includes(':') ? r.split(':').pop() : r;
      return d.replace(/^refs\/heads\//, '');
    });
    const dirTrabajo = push.dirC ? push.dirC : cwd;
    const remoto = remotoDe(dirTrabajo);
    // La protección de ramas es la de GitLab de Comsatel. Si el remoto se conoce y no es de Comsatel
    // (por ejemplo el repo de skills en GitHub), solo se pide confirmación.
    const esComsatel = !remoto || /comsatel/i.test(remoto);
    let aProtegida = esComsatel ? destinos.find((d) => PROTEGIDAS.includes(d)) : undefined;
    if (!aProtegida && esComsatel && (refspecs.length === 0 || refspecs.every((r) => r === 'HEAD'))) {
      const actual = ramaActual(cwd, push.dirC);
      if (PROTEGIDAS.includes(actual)) aProtegida = actual;
    }
    if (aProtegida) {
      return ['deny', `git push a la rama protegida ${aProtegida}`,
        'develop, integration, main y release están protegidas: nadie empuja directo, todo entra por merge request y lo fusiona quien revisa.',
        `Productos: crea CLF_Feature_<historia> desde origin/develop, súbela y abre un MR a integration (DEV) con Luis de revisor. DS: rama feature/<tema> y MR a develop con César.`];
    }

    // Push permitido en principio: pide confirmación (regla B1: nada se sube sin que lo confirmes).
    const enDS =/ui-components/i.test(remoto) || /ui-components/i.test(dirTrabajo);
    const rama = destinos[0] || ramaActual(cwd, push.dirC) || 'la rama actual';
    const avisos = esComsatel && !enDS ? avisosDePush(dirTrabajo) : [];
    return ['ask',
      enDS ? `Subir ${rama} al sistema de diseño (ui-components)` : `Subir ${rama} a GitLab`,
      (enDS
        ? 'Estás en el sistema de diseño: un cambio aquí afecta a todos los productos (Shell y micro UI). Debe estar confirmado y seguir flujo-ds.'
        : 'Regla B1: nada se sube sin tu confirmación. Esto solo sube una rama de trabajo; no fusiona ni etiqueta.')
        + (avisos.length ? `\nAvisos antes de subir:\n- ${avisos.join('\n- ')}` : ''),
      'Si estás de acuerdo, confirma. Después se abre el MR: productos a integration con Luis; DS y knowledge-base a develop con César (en pareja si es Shell + micro UI).'];
  }

  // 6a. integration nunca se mezcla hacia develop (regla de César, ci-cd README): cada rama llega a develop con su propio MR.
  if (/merge_requests\b/i.test(todo) && /source_branch["'=:\s]+integration\b/i.test(todo) && /target_branch["'=:\s]+develop\b/i.test(todo)) {
    return ['deny', 'MR de integration hacia develop',
      'integration junta el trabajo de todos para DEV; mezclarla en develop arrastraría ramas ajenas que nadie aprobó para QA.',
      'Cada rama llega a develop por su lado, con su propio MR, y eso lo decide el equipo de desarrollo.'];
  }

  // 6b. Crear un merge request por la API: confirmar destino y revisor.
  if (/merge_requests\b/i.test(todo) && !/merge_requests\/\d+\/merge/i.test(todo) && /(-X\s*POST|--request\s*POST|-Method\s+Post|--data|-Body|--data-binary)/i.test(todo)) {
    return ['ask', 'Abrir un merge request',
      'Abrir un MR es una acción separada de subir la rama (B1). Productos: destino integration (DEV), revisor Luis (lrodriguez). DS y knowledge-base: destino develop, revisor César. Enlazado a su pareja si es Shell + micro UI.',
      'Confirma si el título, el destino y el revisor son correctos.'];
  }
  return null;
}

// Modo estricto: pensado para agentes sin nadie al teclado (codex exec, workers de Orca). Un "ask" pasa a "deny".
export const modoEstricto = () => process.env.COMSATEL_GUARDIA_ASK === 'deny' || process.argv.includes('--estricto');

// Solo se ejecuta como hook cuando es el archivo invocado; los adaptadores de git y de shell lo importan.
const esPrincipal = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

function principal() {
  let entrada = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (c) => (entrada += c));
  process.stdin.on('end', () => {
    let evento;
    try { evento = JSON.parse(entrada); } catch { process.exit(0); }
    if (!/^(Bash|PowerShell|shell|local_shell|exec_command|container.exec)$/i.test(evento.tool_name || '')) process.exit(0);
    const cmd = evento.tool_input?.command || '';
    if (!cmd) process.exit(0);
    const r = evaluar(cmd, evento.cwd || process.cwd());
    if (!r) process.exit(0);
    const [tipo, titulo, motivo, que] = r;
    if (tipo === 'deny') {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: AVISO_BLOQUEO(titulo, motivo, que),
        },
      }));
      process.exit(0);
    }
    if (modoEstricto()) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: AVISO_BLOQUEO(titulo, `${motivo}
(Modo estricto: aquí no hay nadie que confirme.)`, 'Pídele la confirmación a la persona responsable y que ella ejecute la acción en su terminal.'),
        },
      }));
      process.exit(0);
    }
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: `${titulo}\nMotivo: ${motivo}\nQué sigue: ${que}`,
      },
    }));
    process.exit(0);
  });
}

if (esPrincipal) principal();
