// Tablero diario de Enzo en GitLab y ClickUp, leído desde Notion (fuente principal).
// Uso: node tablero-dia.mjs <tablero|cierre> [--ejecutar] [AAAA-MM-DD]
//   tablero (mañana): vence hoy → In Compromise / in progress; vence el siguiente día hábil → In Progress / in progress;
//                     vence en 2 días hábiles o más → To Do / Open. Aunque esté terminada en Notion (regla de Enzo, 2026-11-16).
//   cierre (17:00–18:00, hora de Lima): cierra en GitLab y pasa a «finalizado» en ClickUp lo Completada en Notion que vence hoy.
//          Lo que vence hoy sin terminar no se cierra: se lista para proponer fecha nueva (B9).
// Nunca toca tareas en pausa ni cerradas. Sin --ejecutar es corrida en seco. Nunca imprime tokens.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const MODO = process.argv[2];
if (!['tablero', 'cierre'].includes(MODO)) { console.error('Uso: node tablero-dia.mjs <tablero|cierre> [--ejecutar] [AAAA-MM-DD]'); process.exit(2); }
const EJ = process.argv.includes('--ejecutar');
const HOY = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);
const FER = ['2026-12-08', '2026-12-25', '2027-01-01', '2027-01-01'];
const habil = (d) => { const x = new Date(d + 'T12:00:00Z'); return ![0, 6].includes(x.getUTCDay()) && !FER.includes(d); };
if (!habil(HOY)) { console.log(HOY, 'no es día hábil: no se hace nada.'); process.exit(0); }
const sig = (d) => { const x = new Date(d + 'T12:00:00Z'); do x.setUTCDate(x.getUTCDate() + 1); while (!habil(x.toISOString().slice(0, 10))); return x.toISOString().slice(0, 10); };
const MAN = sig(HOY);
const ct = fs.readFileSync(path.join(os.homedir(), '.clickup', 'token.txt'), 'utf8').trim();
const nt = fs.readFileSync(path.join(os.homedir(), '.notion', 'token.txt'), 'utf8').trim();
if (!process.env.GITLAB_TOKEN) { console.error('Falta la variable GITLAB_TOKEN.'); process.exit(1); }
const CH = { Authorization: ct, 'Content-Type': 'application/json' };
const NH = { Authorization: `Bearer ${nt}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
const GH = { 'PRIVATE-TOKEN': process.env.GITLAB_TOKEN, 'Content-Type': 'application/json' };
const DS = '87a1a7d0-6388-82a0-82c0-8709ea959111';
// Tareas con issue de GitLab, sin pausa, que vencen desde hoy
let cur, tareas = [];
do {
  const j = await (await fetch(`https://api.notion.com/v1/data_sources/${DS}/query`, { method: 'POST', headers: NH, body: JSON.stringify({ start_cursor: cur, filter: { and: [{ property: 'Issue', url: { is_not_empty: true } }, { property: 'En pausa', checkbox: { equals: false } }, { property: 'Fecha límite', date: { on_or_after: HOY } }] } }) })).json();
  if (j.object === 'error') { console.error('Notion:', j.message); process.exit(1); }
  tareas.push(...j.results); cur = j.has_more ? j.next_cursor : null;
} while (cur);
if (MODO === 'cierre') tareas = tareas.filter((p) => p.properties['Fecha límite'].date.start.slice(0, 10) === HOY);
console.log(`${MODO} · hoy ${HOY} · siguiente día hábil ${MAN} · ${tareas.length} tareas con issue${EJ ? '' : ' · corrida en seco'}`);
const pendientes = []; let n = 0;
for (const p of tareas.sort((a, b) => a.properties['Fecha límite'].date.start.localeCompare(b.properties['Fecha límite'].date.start))) {
  const P = p.properties, nombre = P.Nombre.title.map((x) => x.plain_text).join(''), estado = P.Estado.status?.name;
  const fin = P['Fecha límite'].date.start.slice(0, 10);
  const m = P.Issue.url.match(/project\.comsatel\.com\.pe\/(.+)\/-\/(?:issues|work_items)\/(\d+)/); if (!m) continue;
  const gurl = `https://project.comsatel.com.pe/api/v4/projects/${encodeURIComponent(m[1])}/issues/${m[2]}`;
  const gi = await (await fetch(gurl, { headers: GH })).json();
  if (!gi.iid || gi.state === 'closed') continue;
  const cid = P.ClickUp?.url?.split('/t/')[1];
  const cu = cid ? await (await fetch('https://api.clickup.com/api/v2/task/' + cid, { headers: CH })).json() : null;
  if (MODO === 'cierre') {
    if (estado !== 'Completada') { pendientes.push(`${nombre} (#${gi.iid}) — ${estado}`); continue; }
    n++; console.log(`CERRAR ${nombre} (#${gi.iid}) | ClickUp ${cu ? cu.status.status + ' → finalizado' : 'sin tarea'}`);
    if (!EJ) continue;
    const r = await fetch(gurl, { method: 'PUT', headers: GH, body: JSON.stringify({ state_event: 'close' }) }); if (!r.ok) console.log('  ERROR GitLab', r.status);
    if (cu) { const rc = await fetch('https://api.clickup.com/api/v2/task/' + cid, { method: 'PUT', headers: CH, body: JSON.stringify({ status: 'finalizado' }) }); if (!rc.ok) console.log('  ERROR ClickUp', rc.status); }
    continue;
  }
  const [lab, st] = fin <= HOY ? ['Task :: In Compromise', 'in progress'] : fin === MAN ? ['Task :: In Progress', 'in progress'] : ['Task :: To Do', 'Open'];
  const glCambia = !(gi.labels.includes(lab) && gi.labels.filter((l) => /^Task :: /.test(l)).length === 1);
  const cuCambia = cu && cu.status.status.toLowerCase() !== st.toLowerCase() && !['review', 'en pausa'].includes(cu.status.status.toLowerCase());
  if (!glCambia && !cuCambia) continue;
  n++; console.log(`${nombre.slice(0, 90)} (#${gi.iid}) vence ${fin} | GitLab ${glCambia ? '→ ' + lab : 'ok'} | ClickUp ${cuCambia ? cu.status.status + ' → ' + st : 'ok'}`);
  if (!EJ) continue;
  // Las etiquetas Task :: tienen ámbito: basta con add_labels (remove_labels del mismo ámbito quitaría también la nueva).
  if (glCambia) { const r = await fetch(gurl, { method: 'PUT', headers: GH, body: JSON.stringify({ add_labels: lab }) }); if (!r.ok) console.log('  ERROR GitLab', r.status); }
  if (cuCambia) { const r = await fetch('https://api.clickup.com/api/v2/task/' + cid, { method: 'PUT', headers: CH, body: JSON.stringify({ status: st }) }); if (!r.ok) console.log('  ERROR ClickUp', r.status); }
}
if (pendientes.length) { console.log(`\nVencen hoy sin terminar (NO se cierran; proponer fecha nueva a Enzo):`); pendientes.forEach((x) => console.log('  - ' + x)); }
console.log(`\n${n} cambios ${EJ ? 'aplicados' : 'por aplicar'}.`);
