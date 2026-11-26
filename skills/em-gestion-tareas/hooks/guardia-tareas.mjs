#!/usr/bin/env node
// Guardia de tareas (hook PreToolUse). Hace cumplir el skill em-gestion-tareas:
// 1. Una tarea nueva en la base Tareas de Notion lleva todas las secciones de la estructura
//    (las genera scripts/armar-mapeo.mjs). Sin ellas, se bloquea.
// 2. Escribir en GitLab (issues) o en ClickUp desde la terminal pide confirmación: lo ve el equipo.
// Responde siempre con un JSON permissionDecision y salida 0 (en Windows el código 2 no es fiable).
// Documentación: ../skills/em-gestion-tareas/references/guardia-de-tareas.md
const TAREAS = '87a1a7d0-6388-82a0-82c0-8709ea959111';
const SECCIONES = ['Antes de leer', '## En 30 segundos', '## El relato', '## Alcance', '## Criterios de aceptación', '## Condición de cierre', '## Trazabilidad', '## Resultado', '## Comprueba'];
const NOMBRE = /^[A-Z]{3}-(UX|FRONT)( · \d{2})? — .+/;

const responder = (decision, motivo) => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: motivo } }));
  process.exit(0);
};

function revisarNotion(nombre, entrada) {
  if (/notion-create-pages$/.test(nombre)) {
    const padre = JSON.stringify(entrada.parent || '');
    if (!padre.includes(TAREAS)) return;
    const paginas = Array.isArray(entrada.pages) ? entrada.pages : [];
    const fallas = [];
    for (const pg of paginas) {
      const titulo = pg.properties?.Nombre || pg.properties?.title || '(sin nombre)';
      const texto = pg.content || '';
      // Las actividades cortas (reuniones, ayudas) no siguen el patrón de código: solo se revisa lo que lo sigue.
      if (!NOMBRE.test(titulo)) continue;
      const faltan = SECCIONES.filter((s) => !texto.includes(s));
      if (faltan.length) fallas.push(`«${titulo}»: faltan ${faltan.join(', ')}`);
      if (!pg.properties?.['date:Fecha límite:start']) fallas.push(`«${titulo}»: falta la fecha límite`);
      if (!pg.properties?.['Criterio de cierre']) fallas.push(`«${titulo}»: falta el criterio de cierre`);
    }
    if (fallas.length)
      responder('deny', `BLOQUEADO: tarea sin la estructura de em-gestion-tareas\n- ${fallas.join('\n- ')}\nQué hacer: genera el contenido con scripts/armar-mapeo.mjs y crea la página con ese texto.`);
    return;
  }
  if (/notion-update-page$/.test(nombre) && entrada.command === 'replace_content') {
    const texto = entrada.new_str || '';
    // Solo se revisa una página de tarea (la que trae la capa de lectura y el cierre).
    if (texto.includes('## En 30 segundos') && texto.includes('## Condición de cierre')) {
      const faltan = SECCIONES.filter((s) => !texto.includes(s));
      if (faltan.length) responder('deny', `BLOQUEADO: reemplazar una tarea dejaría fuera ${faltan.join(', ')}\nQué hacer: regenera la página con scripts/armar-mapeo.mjs.`);
    }
  }
}

function revisarTerminal(cmd) {
  const escribe = /(-X\s*(POST|PUT|DELETE)|--request\s+(POST|PUT|DELETE)|method:\s*['"](POST|PUT|DELETE)|--data|-d\s)/i;
  if (/publicar\.mjs/.test(cmd) && /--ejecutar/.test(cmd))
    responder('ask', 'Publicar tareas en GitLab y ClickUp\nMotivo: lo ve todo el equipo (B1).\nQué sigue: confirma solo si Enzo aprobó la corrida en seco de esta misma lista.');
  if (/tablero-dia\.mjs/.test(cmd) && /--ejecutar/.test(cmd))
    responder('ask', 'Mover o cerrar tareas en GitLab y ClickUp\nMotivo: lo ve todo el equipo (B1).\nQué sigue: confirma solo si Enzo aprobó la corrida en seco.');
  if (/api\.clickup\.com/.test(cmd) && escribe.test(cmd))
    responder('ask', 'Escribir en ClickUp\nMotivo: lo ve todo el equipo (B1).\nQué sigue: confirma solo con la aprobación de Enzo.');
  if (/\/api\/v4\/projects\/[^/\s]+\/issues/.test(cmd) && escribe.test(cmd))
    responder('ask', 'Escribir en un issue de GitLab\nMotivo: lo ve todo el equipo (B1).\nQué sigue: confirma solo con la aprobación de Enzo.');
}

let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (entrada += c));
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(entrada); } catch { process.exit(0); }
  const nombre = ev.tool_name || '';
  const input = ev.tool_input || {};
  if (/notion/i.test(nombre)) revisarNotion(nombre, input);
  else if (/^(Bash|PowerShell)$/.test(nombre)) revisarTerminal(input.command || '');
  process.exit(0);
});
