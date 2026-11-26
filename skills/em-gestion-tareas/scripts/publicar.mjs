#!/usr/bin/env node
// Publica en GitLab y ClickUp las tareas que generó armar-mapeo.mjs y deja la columna del tablero
// según la fecha límite (comprometer el día). Corrida en seco por defecto: sin --ejecutar no escribe nada.
// Es idempotente: una tarea que ya tiene issue o tarea de ClickUp en ids.json no se vuelve a crear.
//
// Uso: node publicar.mjs <paginas.json> --ids <ids.json> --hito <id del hito> [--solo gitlab|clickup]
//        [--hoy AAAA-MM-DD] [--ejecutar]
// Requiere GITLAB_TOKEN (variable de entorno) y ~/.clickup/token.txt. Nunca imprime un token.
// Después de ejecutar: poner Issue y ClickUp en cada tarea de Notion (lo hace el agente con ids.json)
// y volver a correr armar-mapeo con --ids para que la trazabilidad de Notion enlace los issues.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const [rutaPaginas] = process.argv.slice(2);
const rutaIds = arg('--ids');
const HITO = Number(arg('--hito'));
const SOLO = arg('--solo');
const EJ = process.argv.includes('--ejecutar');
if (!rutaPaginas || !rutaIds || !HITO) {
  console.error('Uso: node publicar.mjs <paginas.json> --ids <ids.json> --hito <id> [--solo gitlab|clickup] [--hoy AAAA-MM-DD] [--ejecutar]');
  process.exit(2);
}
const DIR = path.dirname(fileURLToPath(import.meta.url));
const SIS = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'config', 'sistemas.json'), 'utf8'));
const paginas = JSON.parse(fs.readFileSync(rutaPaginas, 'utf8'));
const ids = fs.existsSync(rutaIds) ? JSON.parse(fs.readFileSync(rutaIds, 'utf8')) : {};
const guardar = () => fs.writeFileSync(rutaIds, JSON.stringify(ids, null, 2));
const conGitlab = SOLO !== 'clickup';
const conClickup = SOLO !== 'gitlab';

// ---------- columna del tablero según la fecha límite (tablero-y-compromiso.md) ----------
const HOY = arg('--hoy') || new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);
const FER = ['2026-12-08', '2026-12-25', '2027-01-01'];
const habil = (d) => { const x = new Date(d + 'T12:00:00Z'); return ![0, 6].includes(x.getUTCDay()) && !FER.includes(d); };
const siguiente = (d) => { const x = new Date(d + 'T12:00:00Z'); do x.setUTCDate(x.getUTCDate() + 1); while (!habil(x.toISOString().slice(0, 10))); return x.toISOString().slice(0, 10); };
const MANANA = siguiente(HOY);
const columna = (lim) => (lim <= HOY ? ['Task :: In Compromise', 'in progress'] : lim === MANANA ? ['Task :: In Progress', 'in progress'] : ['Task :: To Do', 'Open']);

// ---------- clientes ----------
const GT = process.env.GITLAB_TOKEN;
if (conGitlab && !GT) { console.error('Falta la variable GITLAB_TOKEN.'); process.exit(1); }
const ruta = path.join(os.homedir(), '.clickup', 'token.txt');
const CT = conClickup ? (fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8').trim() : null) : null;
if (conClickup && !CT) { console.error('Falta ~/.clickup/token.txt.'); process.exit(1); }
const G = SIS.gitlab;
const gl = async (metodo, url, cuerpo) => {
  const r = await fetch(`${G.api}/projects/${G.proyecto}${url}`, { method: metodo, headers: { 'PRIVATE-TOKEN': GT, 'Content-Type': 'application/json' }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`GitLab ${metodo} ${url}: ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
  return j;
};
const cu = async (metodo, url, cuerpo) => {
  await new Promise((r) => setTimeout(r, 1100)); // límite de 100 llamadas por minuto
  const r = await fetch(`https://api.clickup.com/api/v2${url}`, { method: metodo, headers: { Authorization: CT, 'Content-Type': 'application/json' }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`ClickUp ${metodo} ${url}: ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
  return j;
};
const issueUrl = (n) => `${G.web}/${G.rutaProyecto}/-/issues/${n}`;
const resolver = (t, destino) =>
  t.replace(/⟦([^⟧]+)⟧/g, (_, c) => {
    const n = ids[c]?.issue;
    if (!n) return `⟦${c}⟧`;
    return destino === 'gitlab' ? `#${n}` : `[${c} (#${n})](${issueUrl(n)})`;
  });
const pendiente = (t) => /⟦[^⟧]+⟧/.test(t);
const estimar = (h) => (Math.floor(h) ? Math.floor(h) + 'h' : '') + (h % 1 ? Math.round((h % 1) * 60) + 'm' : '');
const ms = (d, hora) => Date.parse(`${d}T${hora}:00-05:00`);

// Verificaciones previas: hito activo y usuario del responsable.
if (conGitlab) {
  const hitos = await gl('GET', '/milestones?state=active&per_page=100');
  const hito = hitos.find((x) => x.id === HITO);
  if (!hito) { console.error(`El hito ${HITO} no está activo en el proyecto ${G.proyecto}: confirmar cuál usar.`); process.exit(1); }
  console.log(`Hito: ${hito.title} (vence ${hito.due_date})`);
}
const usuarios = {};
const idUsuario = async (u) => {
  if (usuarios[u]) return usuarios[u];
  const r = await fetch(`${G.api}/users?username=${encodeURIComponent(u)}`, { headers: { 'PRIVATE-TOKEN': GT } });
  const [x] = await r.json();
  if (!x) throw new Error(`No existe el usuario ${u} en GitLab`);
  return (usuarios[u] = x.id);
};
const responsable = (pg) => (pg.gitlab.match(/\*\*Responsable:\*\* @(\S+)/) || [])[1];

console.log(`Hoy ${HOY} · siguiente día hábil ${MANANA} · ${paginas.length} tareas${EJ ? '' : ' · CORRIDA EN SECO'}\n`);

// ---------- 1. GitLab: crear (las madres van primero en paginas.json) ----------
if (conGitlab) {
  for (const pg of paginas) {
    const [lab] = columna(pg.limite);
    if (ids[pg.clave]?.issue) { console.log(`= GitLab #${ids[pg.clave].issue} ya existe · ${pg.nombre}`); continue; }
    console.log(`+ GitLab · ${pg.nombre} · ${lab} · vence ${pg.limite} · /estimate ${estimar(pg.horas)}`);
    if (!EJ) continue;
    const uid = await idUsuario(responsable(pg));
    const j = await gl('POST', '/issues', { title: pg.nombre, description: resolver(pg.gitlab, 'gitlab'), labels: `Task,${lab}`, milestone_id: HITO, assignee_ids: [uid], due_date: pg.limite });
    ids[pg.clave] = { ...(ids[pg.clave] || {}), issue: j.iid };
    guardar();
    await gl('POST', `/issues/${j.iid}/notes`, { body: `/estimate ${estimar(pg.horas)}` });
  }
  // 2. Segunda pasada: descripciones que citaban tareas aún sin issue, y enlaces relates_to.
  if (EJ) {
    for (const pg of paginas) {
      const n = ids[pg.clave].issue;
      if (pendiente(pg.gitlab)) {
        const d = resolver(pg.gitlab, 'gitlab');
        if (pendiente(d)) throw new Error(`${pg.clave}: quedan referencias sin issue`);
        await gl('PUT', `/issues/${n}`, { description: d });
      }
      const existentes = new Set((await gl('GET', `/issues/${n}/links`)).map((l) => l.iid));
      const historias = [...pg.gitlab.matchAll(/\*\*HU-[\d-]+:\*\* #(\d+)/g)].map((m) => +m[1]);
      const otros = [pg.madre, ...pg.bloqueadaPor].filter(Boolean).map((c) => (/^#\d+$/.test(c) ? +c.slice(1) : ids[c]?.issue));
      for (const destino of [...historias, ...otros].filter((x) => x && !existentes.has(x)))
        await gl('POST', `/issues/${n}/links?target_project_id=${G.proyecto}&target_issue_iid=${destino}&link_type=relates_to`);
      console.log(`  enlaces de #${n}: ${[...historias, ...otros].join(', ')}`);
    }
  }
}

// ---------- 3. ClickUp: padres primero, subtareas con parent ----------
if (conClickup) {
  for (const pg of paginas) {
    const [, st] = columna(pg.limite);
    if (ids[pg.clave]?.clickup) { console.log(`= ClickUp ya existe · ${pg.nombreClickup}`); continue; }
    console.log(`+ ClickUp · ${pg.nombreClickup} · ${st} · etiquetas ${SIS.clickup.etiquetaProducto}, ${pg.actividad}${pg.madre ? ` · subtarea de ${pg.madre}` : ''}`);
    if (!EJ) continue;
    const n = ids[pg.clave]?.issue;
    let d = resolver(pg.clickup, 'clickup').replace(`⟦${pg.clave}⟧`, n ? `[${pg.clave} (#${n})](${issueUrl(n)})` : 'sin issue');
    if (pendiente(d)) throw new Error(`${pg.clave}: ClickUp citaría tareas sin issue; publicar GitLab primero`);
    const parent = pg.madre ? ids[pg.madre]?.clickupId : undefined;
    if (pg.madre && !parent) throw new Error(`${pg.clave}: su madre ${pg.madre} no tiene tarea en ClickUp`);
    const j = await cu('POST', `/list/${SIS.clickup.lista}/task`, {
      name: pg.nombreClickup, markdown_description: d, assignees: [SIS.clickup.usuarioEnzo], status: st,
      priority: SIS.clickup.prioridad[pg.prioridad] || 3, tags: [SIS.clickup.etiquetaProducto, pg.actividad],
      start_date: ms(pg.inicio, '08:00'), start_date_time: false, due_date: ms(pg.limite, '17:00'), due_date_time: false,
      time_estimate: Math.round(pg.horas * 3600000), parent,
    });
    ids[pg.clave] = { ...(ids[pg.clave] || {}), clickup: j.url, clickupId: j.id };
    guardar();
  }
}
console.log(`\n${EJ ? 'Publicado. Enlaces en ' + rutaIds : 'Corrida en seco: no se escribió nada. Con la confirmación de Enzo, repetir con --ejecutar.'}`);
