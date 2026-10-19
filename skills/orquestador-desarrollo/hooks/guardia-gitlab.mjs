#!/usr/bin/env node
// Guardia de acciones críticas sobre GitLab de Comsatel (hook PreToolUse de Claude Code).
// Lee el evento por stdin. Si la acción es crítica, la bloquea (exit 2 + motivo por stderr)
// o pide confirmación (JSON "ask"). No toca nada más: lo demás pasa sin ruido.
// Documentación: ../references/hooks-bloqueantes.md
import { execFileSync } from 'node:child_process';

const PROTEGIDAS = ['develop', 'main', 'release'];

const AVISO_BLOQUEO = (titulo, motivo, que) =>
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

function evaluar(cmd, cwd) {
  const todo = sinTextoLibre(cmd);

  // 1. Token: nunca imprimirlo ni escribirlo en un comando (se revisa el texto completo).
  if (/glpat-[A-Za-z0-9_-]{10,}/.test(cmd)) {
    return ['deny', 'Token de GitLab escrito dentro del comando',
      'Un token pegado en un comando queda en el historial y en los registros de la sesión.',
      'Guárdalo como variable de usuario GITLAB_TOKEN (una sola vez) y usa la variable. Si ya se pegó en algún sitio, revócalo en GitLab y crea uno nuevo.'];
  }
  const imprime = /(\becho\b|write-host|write-output|\bprintenv\b|\bcat\b|\btype\b|out-file|set-content|add-content|\btee\b|\bprint\b|console\.log)[^|;\r\n]*GITLAB(_NPM)?_TOKEN/i;
  const volcado = /(get-childitem|gci|\bdir\b|\bls\b)\s+env:|\bprintenv\b\s*($|[|;&])|\benv\b\s*($|\|)/i;
  if (imprime.test(todo) || (volcado.test(todo) && /token|gitlab/i.test(todo))) {
    return ['deny', 'Mostrar el valor del token',
      'El token da acceso a tu cuenta de GitLab; si se imprime queda en el historial y en la conversación.',
      'Para comprobar que existe, pide su longitud o prueba una llamada a la API (`/api/v4/user`) sin mostrarlo.'];
  }

  // 2. Fusionar por API o glab.
  if (/merge_requests\/\d+\/merge\b/i.test(todo) || /\bglab\s+mr\s+(merge|accept)\b/i.test(todo)) {
    return ['deny', 'Fusionar un merge request',
      'El agente no fusiona. La fusión a develop la ejecuta César (arquitecto) después de revisar el MR.',
      'Deja el MR listo (pipeline en verde, sin conflictos ni discusiones abiertas) y asígnalo a César con un comentario. Enzo también puede fusionar, pero lo decide él en la interfaz de GitLab.'];
  }

  // 3. Etiquetas y publicación de paquetes.
  if (/repository\/tags/i.test(todo) && /(-X\s*POST|--request\s*POST|-Method\s+Post|--data|-d\s|-Body|fetch\()/i.test(todo)) {
    return ['deny', 'Crear una etiqueta por la API',
      'Las etiquetas (por ejemplo ds-vX.Y.Z del sistema de diseño) publican paquetes y son irreversibles en el registro. Las crea César.',
      'Pídele a César la etiqueta indicando la versión y el commit ya fusionado en release.'];
  }
  if (/\bnpm\s+publish\b/i.test(todo)) {
    return ['deny', 'npm publish',
      'Publicar un paquete es irreversible. El sistema de diseño se publica por etiqueta en GitLab, no desde esta máquina.',
      'Prepara la versión y el MR; la etiqueta y la publicación las ejecuta César.'];
  }

  for (const s of sentencias(todo)) {
    // 4. git tag que crea o borra etiquetas.
    const tag = analizarGit(s, 'tag');
    if (tag) {
      const soloListar = tag.opciones.every((o) => /^(-l|--list|-n\d*|--sort=.*|--contains|--points-at|-v|--verify)$/.test(o)) && !tag.opciones.some((o) => /^-[asfmd]$|--delete/.test(o));
      const crea = tag.args.length > 0 || tag.opciones.some((o) => /^-[asfmd]$|--delete/.test(o));
      if (crea && !(soloListar && tag.opciones.some((o) => /^(-l|--list)$/.test(o)))) {
        return ['deny', 'git tag (crear o borrar una etiqueta)',
          'Las etiquetas del sistema de diseño disparan la publicación del paquete. Las crea César, no el agente.',
          'Pídele a César la etiqueta indicando versión y commit. Para solo mirar las existentes usa `git tag --list`.'];
      }
    }

    // 5. git push.
    const push = analizarGit(s, 'push');
    if (!push) continue;
    const dry = push.opciones.some((o) => o === '-n' || o === '--dry-run');
    if (dry) continue;

    if (push.opciones.some((o) => /^(--tags|--follow-tags|--mirror)$/.test(o)) || push.args.some((a) => /refs\/tags\//.test(a))) {
      return ['deny', 'git push de etiquetas o espejo',
        'Subir etiquetas dispara la publicación del paquete del sistema de diseño. Es de César.',
        'Sube solo tu rama feature/*; la etiqueta la pone César tras fusionar.'];
    }
    if (push.opciones.some((o) => /^(-f|--force|--force-with-lease(=.*)?|--force-if-includes)$/.test(o)) || push.args.some((a) => a.startsWith('+'))) {
      return ['deny', 'git push forzado',
        'Reescribe la historia remota y puede borrar el trabajo de otras personas.',
        'Haz un commit nuevo o un rebase local y vuelve a subir sin forzar. Si de verdad hace falta forzar, que lo decida Enzo en su terminal.'];
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
        'develop, main y release están protegidas: nadie empuja directo, todo entra por merge request y lo fusiona César.',
        `Crea una rama feature/<tema> desde origin/develop, súbela y abre un MR a develop asignado a César.`];
    }

    // Push permitido en principio: pide confirmación (regla B1: nada se sube sin que lo confirmes).
    const enDS =/ui-components/i.test(remoto) || /ui-components/i.test(dirTrabajo);
    const rama = destinos[0] || ramaActual(cwd, push.dirC) || 'la rama actual';
    return ['ask',
      enDS ? `Subir ${rama} al sistema de diseño (ui-components)` : `Subir ${rama} a GitLab`,
      enDS
        ? 'Estás en el sistema de diseño: un cambio aquí afecta a todos los productos (Shell y micro UI). Debe estar confirmado y seguir flujo-ds.'
        : 'Regla B1: nada se sube sin tu confirmación. Esto solo sube una rama feature/*; no fusiona ni etiqueta.',
      'Si estás de acuerdo, confirma. Después se abre el MR a develop y se asigna a César (en pareja si es Shell + micro UI).'];
  }

  // 6. Crear un merge request por la API: confirmar y recordar asignación a César.
  if (/merge_requests\b/i.test(todo) && !/merge_requests\/\d+\/merge/i.test(todo) && /(-X\s*POST|--request\s*POST|-Method\s+Post|--data|-Body|--data-binary)/i.test(todo)) {
    return ['ask', 'Abrir un merge request',
      'Abrir un MR es una acción separada de subir la rama (B1). Debe ir a develop, asignado a César, enlazado a su pareja si es Shell + micro UI.',
      'Confirma si el título, el destino (develop) y el asignado (César) son correctos.'];
  }
  return null;
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
  const r = evaluar(cmd, evento.cwd || process.cwd());
  if (!r) process.exit(0);
  const [tipo, titulo, motivo, que] = r;
  if (tipo === 'deny') {
    process.stderr.write(AVISO_BLOQUEO(titulo, motivo, que) + '\n');
    process.exit(2);
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
