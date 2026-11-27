// Formato de ClickUp acordado con Katherine Uribe (2026-11-16): «PRODUCTO: título», prioridad, etiqueta de producto y de actividad,
// y «finalizado» de agosto a octubre → «Closed». Corrida en seco por defecto; --ejecutar aplica. Solo ClickUp; GitLab no se toca.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const EJ = process.argv.includes('--ejecutar');
const ct = fs.readFileSync(path.join(os.homedir(), '.clickup', 'token.txt'), 'utf8').trim();
const CH = { Authorization: ct, 'Content-Type': 'application/json' };
const extra = fs.existsSync('cu-formato-manual.json') ? JSON.parse(fs.readFileSync('cu-formato-manual.json', 'utf8')) : {};
const cu = [];
for (let p = 0; p < 20; p++) { const j = await (await fetch(`https://api.clickup.com/api/v2/list/901714403439/task?include_closed=true&subtasks=true&assignees[]=101231538&page=${p}`, { headers: { Authorization: ct } })).json(); cu.push(...j.tasks); if (j.last_page || !j.tasks.length) break; }
const COD = { 'producto cl2': 'CL2', 'producto c-go': 'C-GO', 'producto svr': 'SVR', 'producto cl': 'CL', 'producto app técnico': 'APP TÉCNICO', 'producto kuyrapet': 'KUYRAPET', 'producto smart tracing': 'SMART TRACING' };
const producto = (t) => {
  const tag = t.tags.map((x) => x.name).find((x) => x.startsWith('producto ') && COD[x]); if (tag) return tag;
  const n = t.name;
  if (/^(C-Locator 2|CLocator2|CL2|C-Flotas|Distribuidores|Backoffice|Web Cliente|Monitoreo|US\d|UX14|Skills)\b/i.test(n)) return 'producto cl2';
  if (/C-GO|marcha blanca|parqueo seguro|^V\d:/i.test(n)) return 'producto c-go';
  if (/\bSVR\b/i.test(n)) return 'producto svr';
  return extra[t.id]?.producto || null;
};
const actividad = (t) => {
  const tags = t.tags.map((x) => x.name).filter((x) => x.startsWith('actividad ')); if (tags.length) return tags[0];
  const n = t.name.replace(/^[^:]{2,25}:\s*/, '');
  const R = [
    [/Reuni[oó]n|Comit[eé]|Intercambio|Coordinar|Consultar|Estructurar entregables|Estandarizaci|calendario de rituales/i, 'actividad de coordinación'],
    [/Revisi[oó]n|^Revisar|Validar|QA de|Auditor/i, 'actividad de revisión'],
    [/Capacit|Inducci|descargar e instalar/i, 'actividad de capacitación'],
    [/Presentaci|Promover|Proponer/i, 'actividad de presentación'],
    [/Prueba skill|Revisi[oó]n d/i, 'actividad de revisión'],
    [/Campañas/i, 'actividad de coordinación'],
    [/Evaluar|Investig|Diagn[oó]stico|comparativo|Seleccionar el requerimiento/i, 'actividad de investigación'],
    [/Document|Gu[ií]a|wiki|Redactar|Formalizar|Inventari|Registrar|Definir (pol[ií]tica|criterio|control|el est[aá]ndar|las m[eé]tricas|interfaz|estructura)|Consolidar|Clasificar|Cerrar el inventario|cl[aá]usula|expediente|plantilla|registro de/i, 'actividad de documentación'],
    [/UXR|Requisitos|Mapa de las|Especificaci|Lectura|An[aá]lisis de UX|flujo|Historias? sin|Contenido del detalle|Paquete de entrega|Exploraci[oó]n/i, 'actividad de diseño ux'],
    [/Dise[ñn]|prototipo|look|Wireframe|Ilustraci|figma|Pantallas|Componentes del Design System|Mapa y|mapa/i, 'actividad de diseño ui'],
    [/Constru|Implement|Integr|Migrar|Publicar|Corregir|Ajustar|Afinar|Añadir|Complet|Mejorar|Inicializar|Preparar|Restituir|Separar|Fijar|Actualizar|Recuperar|Generar|Biblioteca|Shell|DS \d|Modo m[oó]vil|Regresi|Skills|Paquete de tokens|Versiones|Componentes web|Fundamentos|Accesos|Capturas|Conectores|Alta de|Regla de marca|Identidad|Monitoreo|Web Flotas|Backoffice/i, 'actividad de implementación'],
  ];
  return (R.find(([re]) => re.test(n)) || R.find(([re]) => re.test(t.name)) || [])[1] || extra[t.id]?.actividad || null;
};
const titulo = (t, prod) => {
  const P = COD[prod]; if (!P) return t.name;
  if (t.name.startsWith(P + ': ')) return t.name;
  let r = t.name.replace(/^(C-Locator 2|CLocator2|CL2|C-GO|CL)\s*(:|—|-)\s*/i, '');
  r = r.replace(/^([^:·—]{2,25}):\s+/, '$1 — ');
  return `${P}: ${r}`;
};
const cerrar = (t) => t.status.status === 'finalizado' && ((t.due_date && new Date(+t.due_date - 5 * 3600000).toISOString().slice(0, 10) < '2026-11-01') || (!t.due_date && new Date(+t.date_created).toISOString().slice(0, 10) < '2026-11-01'));
const dudosas = [], cambios = { titulo: 0, prioridad: 0, producto: 0, actividad: 0, closed: 0 }; const muestras = [];
for (const t of cu) {
  const prod = producto(t), act = actividad(t);
  if (!prod || !act) { dudosas.push({ id: t.id, name: t.name, status: t.status.status, falta: [!prod && 'producto', !act && 'actividad'].filter(Boolean).join(' y ') }); }
  const body = {}, tagsAdd = [];
  const nt = titulo(t, prod); if (nt !== t.name) { body.name = nt; cambios.titulo++; if (muestras.length < 12) muestras.push(`${t.name.slice(0, 60)}  →  ${nt.slice(0, 70)}`); }
  if (!t.priority) { body.priority = 3; cambios.prioridad++; }
  if (prod && !t.tags.some((x) => x.name === prod)) { tagsAdd.push(prod); cambios.producto++; }
  if (act && !t.tags.some((x) => x.name.startsWith('actividad '))) { tagsAdd.push(act); cambios.actividad++; }
  if (cerrar(t)) { body.status = 'Closed'; cambios.closed++; }
  if (!EJ) continue;
  await new Promise((r) => setTimeout(r, 1300));
  if (Object.keys(body).length) { const r = await fetch('https://api.clickup.com/api/v2/task/' + t.id, { method: 'PUT', headers: CH, body: JSON.stringify(body) }); if (!r.ok) console.log('ERROR', t.id, r.status, (await r.text()).slice(0, 150)); }
  for (const tg of tagsAdd) { const r = await fetch(`https://api.clickup.com/api/v2/task/${t.id}/tag/${encodeURIComponent(tg)}`, { method: 'POST', headers: CH }); if (!r.ok) console.log('ERROR tag', t.id, tg, r.status); }
}
console.log(`Tareas: ${cu.length} · títulos ${cambios.titulo} · prioridad ${cambios.prioridad} · etiqueta producto ${cambios.producto} · etiqueta actividad ${cambios.actividad} · a Closed ${cambios.closed}${EJ ? ' — APLICADO' : ' — corrida en seco'}`);
console.log('\nEjemplos de títulos:'); muestras.forEach((m) => console.log('  ' + m));
console.log(`\nDudosas (${dudosas.length}):`); dudosas.forEach((d) => console.log(`  ${d.id} | ${d.status} | falta ${d.falta} | ${d.name.slice(0, 80)}`));
