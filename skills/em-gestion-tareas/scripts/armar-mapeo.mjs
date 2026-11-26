#!/usr/bin/env node
// Valida un mapeo de tareas y genera, desde un solo contenido, las tres versiones de cada tarea:
// Notion (con la capa de lectura), GitLab y ClickUp (formato de la empresa). Si una regla falla,
// no genera nada y termina con código 1: el mapeo no se escribe en ningún sistema.
//
// Uso: node armar-mapeo.mjs <mapeo.json> --kb <ruta del clon de la KB> [--ref origin/develop]
//        [--ids ids.json] [--salida paginas.json]
//   --kb    resuelve cada código de artefacto (UXR-010, FLW-004…) a su archivo en la KB, sin tocar el clon.
//   --ids   { "IDV-UX · 01": { "notion": "<url>", "issue": 275, "clickup": "<url>" } }: enlaces ya publicados.
// Estructura: ../references/estructura-de-la-tarea.md · Trazabilidad: ../references/trazabilidad.md
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const rutaMapeo = process.argv[2];
if (!rutaMapeo || rutaMapeo.startsWith('--')) {
  console.error('Uso: node armar-mapeo.mjs <mapeo.json> --kb <clon KB> [--ref origin/develop] [--ids ids.json] [--salida paginas.json]');
  process.exit(2);
}
const DIR = path.dirname(fileURLToPath(import.meta.url));
const SIS = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'config', 'sistemas.json'), 'utf8'));
const mapeo = JSON.parse(fs.readFileSync(rutaMapeo, 'utf8'));
const ids = arg('--ids') && fs.existsSync(arg('--ids')) ? JSON.parse(fs.readFileSync(arg('--ids'), 'utf8')) : {};
const KB = arg('--kb');
const REF = arg('--ref') || 'origin/develop';
const errores = [];
const exigir = (cond, msg) => cond || errores.push(msg);
const fecha = /^\d{4}-\d{2}-\d{2}$/;

// ---------- reglas ----------
const TIPOS_SUB = ['ux', 'ubicacion', 'ds', 'revision', 'acompanamiento', 'entrega', 'construccion'];
// Casillas de «Criterios de aceptación» que un tipo de subtarea siempre lleva.
const CRITERIOS_FIJOS = {
  revision: ['Lo construido coincide con sus pantallas y estados', 'Brechas y desvíos registrados con su dueño'],
  acompanamiento: ['Preguntas de Desarrollo respondidas', 'Retroalimentación y ajustes aplicados o registrados'],
  entrega: [
    'Informe de accesibilidad (ARP) de cada pantalla construida, contra WCAG 2.2 AA',
    'Paquete de entrega en Recursos',
    'Documento de pase (traspaso vivo) con el estado de cada MR verificado en GitLab',
    'Enviado a Desarrollo (fecha y canal anotados)',
  ],
};
// Casillas de «Condición de cierre»: cuándo se puede cerrar, por tipo. Se suman a las propias.
const CIERRE_FIJO = {
  madre: ['Las {n} subtareas están cerradas', 'Las preguntas abiertas o los cambios de alcance se elevaron como solicitud de cambio; no se resolvieron por suposición'],
  ux: ['Lo producido está en `develop` de la base de conocimiento por un MR revisado', 'La trazabilidad enlaza cada artefacto producido'],
  ubicacion: ['La tabla quedó en la tarea, con el enlace de cada rama e issue'],
  ds: ['Cada brecha nueva está registrada en GAPS.md por MR, o descartada con su motivo'],
  revision: ['Los hallazgos están comentados en el issue de la historia, con su captura', 'Lo que cambia el alcance se elevó como solicitud de cambio'],
  acompanamiento: ['Cada ajuste acordado tiene su comentario o su issue en GitLab'],
  entrega: ['Desarrollo confirmó la recepción en el issue de la historia'],
  construccion: ['Integrado en `develop` con el pipeline en verde', 'Listo para que Calidad lo reciba'],
};
const CON_CAPTURAS = ['revision', 'ds', 'entrega', 'construccion'];

const p = mapeo.paquete || {};
exigir(/^DSP-\d{3}$/.test(p.id), 'paquete.id debe ser DSP-NNN');
for (const k of ['nombre', 'ruta']) exigir(p[k], `paquete.${k} es obligatorio`);
exigir(Number.isInteger(p.issue), 'paquete.issue (número del issue del paquete en GitLab) es obligatorio');
exigir(mapeo.responsable?.nombre && mapeo.responsable?.usuario, 'responsable lleva nombre y usuario de GitLab');
const HIST = mapeo.historias || {};
for (const [h, v] of Object.entries(HIST)) exigir(Number.isInteger(v.issue) && v.ruta, `historias.${h}: lleva issue y ruta en la KB`);

const relatoOk = (r) => r?.problema && r?.queSeHace && r?.queEntrega && r?.dondeEncaja;
const codigos = new Set();
for (const m of mapeo.madres || []) codigos.add(m.codigo), (m.subtareas || []).forEach((s) => codigos.add(`${m.codigo} · ${s.n}`));

const revisarComun = (t, ref) => {
  for (const k of ['antesDeLeer', 'en30', 'criterio', 'comprueba']) exigir(t[k], `${ref}: falta ${k}`);
  exigir(relatoOk(t.relato), `${ref}: el relato lleva problema, qué se hace, qué entrega y dónde encaja`);
  exigir((t.alcance?.incluye || []).length >= 1, `${ref}: «Alcance» dice al menos qué incluye`);
  exigir((t.criterios || []).length >= 1, `${ref}: «Criterios de aceptación» lleva al menos una casilla`);
  for (const b of t.bloqueadaPor || []) exigir(codigos.has(b) || /^#\d+$/.test(b), `${ref}: «bloqueada por» ${b} no existe en el mapeo`);
  for (const h of t.historias || []) exigir(HIST[h], `${ref}: la historia ${h} no está en «historias»`);
  for (const c of t.cubre || []) exigir(HIST[c.historia] && c.ac, `${ref}: «cubre» nombra una historia del paquete y sus AC`);
};
for (const m of mapeo.madres || []) {
  const ref = m.codigo || '(sin código)';
  exigir(/^[A-Z]{3}-(UX|FRONT)$/.test(m.codigo), `${ref}: el código sigue el patrón XXX-UX o XXX-FRONT`);
  exigir(m.titulo?.includes(`(${p.id})`), `${ref}: el título nombra el paquete (${p.id})`);
  revisarComun(m, ref);
  exigir((m.subtareas || []).length >= 2, `${ref}: una tarea madre tiene al menos dos subtareas`);
  const nums = new Set();
  for (const s of m.subtareas || []) {
    const sref = `${m.codigo} · ${s.n}`;
    exigir(/^\d{2}$/.test(s.n) && !nums.has(s.n), `${sref}: número de dos dígitos y único`);
    nums.add(s.n);
    exigir(TIPOS_SUB.includes(s.tipo), `${sref}: tipo «${s.tipo}» no es uno de ${TIPOS_SUB.join(', ')}`);
    exigir(s.titulo?.trim(), `${sref}: falta el título`);
    exigir((s.historias || []).length >= 1, `${sref}: nombra al menos una historia`);
    exigir(s.titulo?.includes(s.historias?.length > 1 ? `${s.historias[0]} y` : s.historias?.[0] ?? '¿?'), `${sref}: el título nombra sus historias`);
    exigir(typeof s.horas === 'number' && s.horas > 0, `${sref}: horas estimadas mayores que cero`);
    exigir(fecha.test(s.inicio) && fecha.test(s.limite) && s.inicio <= s.limite, `${sref}: inicio y fecha límite válidos`);
    revisarComun(s, sref);
    for (const f of CRITERIOS_FIJOS[s.tipo] || []) exigir(s.criterios?.includes(f), `${sref}: falta la casilla fija «${f}»`);
    if (s.tipo === 'revision') exigir(s.construyo?.usuario && s.construyo?.issue, `${sref}: una revisión dice quién construyó (usuario) y en qué issue`);
  }
}
if (errores.length) {
  console.error(`El mapeo no pasa (${errores.length}):\n- ${errores.join('\n- ')}`);
  process.exit(1);
}

// ---------- artefactos de la KB ----------
let archivosKb = [];
if (KB) {
  try {
    archivosKb = execFileSync('git', ['-C', KB, 'ls-tree', '-r', '--name-only', REF], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n');
  } catch {
    console.error(`No se pudo leer ${REF} en ${KB}.`);
    process.exit(1);
  }
}
const kbUrl = (ruta) => `${SIS.gitlab.web}/${SIS.gitlab.rutaKb}/-/blob/${SIS.gitlab.ramaKb}/${ruta}`;
const artefacto = (cod, ref) => {
  const r = archivosKb.filter((f) => path.posix.basename(f).startsWith(cod + '-') && !f.startsWith('avisos/'));
  if (!KB) return { cod, ruta: null };
  if (r.length !== 1) errores.push(`${ref}: el artefacto ${cod} no tiene un único archivo en la KB (${r.length})`);
  return { cod, ruta: r[0] };
};

// ---------- utilidades de texto ----------
const h = (n) => String(n).replace('.', ',');
const dia = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const diaLargo = (iso) => `${dia(iso)}/${iso.slice(0, 4)}`;
const issueUrl = (n) => `${SIS.gitlab.web}/${SIS.gitlab.rutaProyecto}/-/issues/${n}`;
// Una referencia a otra tarea del mapeo: ⟦CLAVE⟧ en GitLab y ClickUp (la resuelve publicar.mjs);
// en Notion, el enlace al issue si ya existe, o el nombre.
const nombreDe = {};
const refTarea = (clave, destino) => {
  const n = ids[clave]?.issue;
  if (destino === 'gitlab') return n ? `#${n}` : `⟦${clave}⟧`;
  if (destino === 'clickup') return n ? `[${clave} (#${n})](${issueUrl(n)})` : `⟦${clave}⟧`;
  return n ? `[${clave} (#${n})](${issueUrl(n)})` : `${clave} *(issue pendiente de publicar)*`;
};
const refIssue = (n, destino, texto = '') => (destino === 'gitlab' ? `#${n}${texto ? ' ' + texto : ''}` : `[${texto ? texto + ' ' : ''}#${n}](${issueUrl(n)})`);
const refBloqueo = (b, destino) => (/^#\d+$/.test(b) ? refIssue(b.slice(1), destino) : refTarea(b, destino));
const casillas = (xs) => xs.map((x) => `- [ ] ${x}`).join('\n');
const usuario = (u, destino) => (destino === 'gitlab' ? `@${u}` : u);

const alcance = (t) => {
  const a = t.alcance;
  return [`${t.relato.queSeHace}`, `**Incluye:**\n${a.incluye.map((x) => `- ${x}`).join('\n')}`, a.noIncluye?.length ? `**No incluye:**\n${a.noIncluye.map((x) => `- ${x}`).join('\n')}` : null, `**Entrega:** ${t.relato.queEntrega}`]
    .filter(Boolean)
    .join('\n\n');
};
const criterios = (t, destino) => {
  const cubre = (t.cubre || []).map((c) => `${c.ac} de ${c.historia} (${refIssue(HIST[c.historia].issue, destino)})`);
  const intro = cubre.length ? `Cubre ${cubre.join('; ')}. Los criterios de la historia no se copian: viven en su issue y en su archivo de la KB.\n\n` : '';
  return intro + casillas(t.criterios);
};
const cierre = (t, tipo, n) => casillas([...(t.cierre || []), ...(CIERRE_FIJO[tipo] || [])].map((x) => x.replace('{n}', n)));

const trazabilidad = (t, ref, destino, esMadre, madre) => {
  const L = [];
  L.push(`- **Paquete:** [${p.id} — ${p.nombre}](${kbUrl(p.ruta)}) · ${refIssue(p.issue, destino)}`);
  for (const hh of t.historias || []) {
    const v = HIST[hh];
    const dev = (v.desarrollo || []).map((n) => refIssue(n, destino)).join(', ');
    const qa = (v.calidad || []).map((n) => refIssue(n, destino)).join(', ');
    L.push(`- **${hh}:** ${refIssue(v.issue, destino)} · [historia en la KB](${kbUrl(v.ruta)})${dev ? ` · Desarrollo ${dev}` : ''}${qa ? ` · Calidad ${qa}` : ''}`);
  }
  if (!esMadre) L.push(`- **Tarea madre:** ${refTarea(madre, destino)}`);
  if (t.bloqueadaPor?.length) L.push(`- **Bloqueada por:** ${t.bloqueadaPor.map((b) => refBloqueo(b, destino)).join(', ')}`);
  const usa = (t.artefactos || []).map((c) => artefacto(c, ref));
  if (usa.length) L.push(`- **Artefactos que usa:** ${usa.map((a) => (a.ruta ? `[${a.cod}](${kbUrl(a.ruta)})` : a.cod)).join(', ')}`);
  for (const r of [...(mapeo.referencias || []).filter((x) => (x.en || []).includes(ref) || (x.en || []).includes(madre) || (esMadre && (x.en || []).includes('*'))), ...(t.referencias || [])])
    L.push(`- **${r.texto}:** ${r.ruta ? `[${path.posix.basename(r.ruta, '.md')}](${kbUrl(r.ruta)})` : `[enlace](${r.url})`}`);
  // Cambios de la KB (AVANCE con nota): viven en el mapeo (`cambiosKb`) para que una regeneración no los borre.
  // Una nota va en la tarea si cita una de sus historias, o en todas si su `historias` está vacío.
  const notas = (mapeo.cambiosKb || []).filter((c) => !(c.historias || []).length || (c.historias || []).some((x) => (t.historias || []).includes(x)) || (esMadre && (c.historias || []).length));
  if (notas.length) L.push(`- **Cambios de la KB:**\n${notas.map((c) => `  - ${c.fecha} · ${c.ruta ? `[${c.documento}](${kbUrl(c.ruta)})` : c.documento}: ${c.texto}`).join('\n')}`);
  L.push('- **Artefactos que produce:** *se agregan al cerrar, con su enlace a `develop`.*');
  L.push('- **MR:** *se agregan cuando se abren.*');
  return L.join('\n');
};

// ---------- tres versiones ----------
const paginas = [];
const generar = (t, { clave, madre, esMadre, tipo, subtareas }) => {
  const total = esMadre ? subtareas.reduce((a, s) => a + s.horas, 0) : t.horas;
  const inicio = esMadre ? subtareas.map((s) => s.inicio).sort()[0] : t.inicio;
  const limite = esMadre ? subtareas.map((s) => s.limite).sort().at(-1) : t.limite;
  const nombre = esMadre ? `${t.codigo} — ${t.titulo}` : `${madre} · ${t.n} — ${t.titulo}`;
  const n = subtareas?.length || 0;
  const conCapturas = CON_CAPTURAS.includes(tipo);
  const plan = (destino) => subtareas.map((s) => `- [ ] ${refTarea(`${t.codigo} · ${s.n}`, destino)} — ${s.titulo}: ${h(s.horas)} h, ${dia(s.inicio)}${s.limite !== s.inicio ? ` a ${dia(s.limite)}` : ''}`).join('\n');
  const criterioProp = t.criterio.replace('{horas}', h(total)).replace('{n}', n);

  // Cabecera de GitLab y ClickUp.
  const cab = (destino) =>
    [
      `**Origen:** ${esMadre ? `${refIssue(p.issue, destino)} (${p.id})` : `${refTarea(madre, destino)} (subtarea)`}`,
      `**Responsable:** ${usuario(mapeo.responsable.usuario, destino)}`,
      t.construyo ? `**Construyó:** ${usuario(t.construyo.usuario, destino)} (${refIssue(t.construyo.issue, destino)})` : null,
      t.bloqueadaPor?.length ? `**Bloqueada por:** ${t.bloqueadaPor.map((b) => refBloqueo(b, destino)).join(', ')}` : null,
      `**Plazo:** ${diaLargo(inicio)} → ${diaLargo(limite)} · ${h(total)} h`,
    ]
      .filter(Boolean)
      .join('  \n');
  const cuerpo = (destino) =>
    [
      `## Alcance\n\n${alcance(t)}`,
      `## Criterios de aceptación\n\n${criterios(t, destino)}`,
      esMadre ? `## Plan\n\n*Cada casilla se marca cuando su subtarea se cierra.*\n\n${plan(destino)}` : null,
      `## Condición de cierre\n\n${cierre(t, esMadre ? 'madre' : tipo, n)}`,
      `## Trazabilidad\n\n${trazabilidad(t, clave, destino, esMadre, madre)}`,
    ]
      .filter(Boolean)
      .join('\n\n');

  const gitlab = `${cab('gitlab')}\n\n[[_TOC_]]\n\n${cuerpo('gitlab')}`;
  const clickup = `**Nombre en GitLab:** ${nombre}  \n**Issue en GitLab:** ⟦${clave}⟧\n\n${cab('clickup')}\n\n${cuerpo('clickup')}`;
  const quien = `**Responsable:** ${mapeo.responsable.nombre}${t.construyo ? ` · **Construyó:** ${t.construyo.nombre} (${t.construyo.usuario}), ${refIssue(t.construyo.issue, 'notion')}` : ''}`;
  const r = t.relato;
  const relato = [`**El problema.** ${r.problema}`, `**Dónde encaja.** ${r.dondeEncaja}`, r.noDecidido ? `**Lo que todavía no está decidido.** ${r.noDecidido}` : null].filter(Boolean).join('\n\n');
  const notion = [
    `<callout icon="❓" color="blue_bg">\n**Antes de leer:** ${t.antesDeLeer}\n</callout>`,
    quien,
    `## En 30 segundos\n\n${t.en30}`,
    `## El relato\n\n${relato}`,
    cuerpo('notion'),
    `## Resultado\n\n*Lo completa el modo Cerrar: resumen corto y enlace. Al llenarlo, la propiedad Resultado pasa a Listo.*\n\n**Enlace:** *Pendiente.*\n\n**Entregado:** *fecha.*`,
    conCapturas ? `## Capturas\n\n*Las agrega el skill que ejecuta la tarea, mientras avanza.*` : null,
    `## Comprueba\n\n${t.comprueba}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  nombreDe[clave] = nombre;
  paginas.push({
    clave, madre: madre || null, tipo: esMadre ? 'madre' : tipo, nombre,
    nombreClickup: `${SIS.clickup.prefijo}: ${nombre}`,
    actividad: SIS.clickup.actividadPorTipo[esMadre ? (t.codigo.endsWith('-UX') ? 'ux' : 'revision') : tipo],
    horas: total, inicio, limite, prioridad: t.prioridad || 'Alta', criterio: criterioProp,
    historias: [...new Set(esMadre ? subtareas.flatMap((s) => s.historias) : t.historias)],
    bloqueadaPor: t.bloqueadaPor || [], notion, gitlab, clickup,
  });
};
for (const m of mapeo.madres) {
  generar({ ...m, historias: [...new Set(m.subtareas.flatMap((s) => s.historias))] }, { clave: m.codigo, esMadre: true, tipo: 'madre', subtareas: m.subtareas });
  for (const s of m.subtareas) generar(s, { clave: `${m.codigo} · ${s.n}`, madre: m.codigo, esMadre: false, tipo: s.tipo });
}

// ---------- controles de salida ----------
for (const pg of paginas) {
  for (const [k, t] of [['criterio', pg.criterio], ['Notion', pg.notion], ['GitLab', pg.gitlab], ['ClickUp', pg.clickup]])
    if (/\{[a-z]+\}/.test(t)) errores.push(`${pg.clave}: en ${k} quedó un marcador sin reemplazar`);
  if (pg.notion.includes('⟦')) errores.push(`${pg.clave}: Notion no puede llevar referencias ⟦⟧`);
  for (const t of [pg.gitlab, pg.clickup]) for (const [, c] of t.matchAll(/⟦([^⟧]+)⟧/g)) if (!codigos.has(c)) errores.push(`${pg.clave}: referencia ⟦${c}⟧ desconocida`);
  if (/notion\.(so|com)/.test(pg.gitlab + pg.clickup)) errores.push(`${pg.clave}: GitLab y ClickUp no enlazan a Notion`);
  for (const s of ['## Alcance', '## Criterios de aceptación', '## Condición de cierre', '## Trazabilidad'])
    for (const [k, t] of [['Notion', pg.notion], ['GitLab', pg.gitlab], ['ClickUp', pg.clickup]]) if (!t.includes(s)) errores.push(`${pg.clave}: a ${k} le falta ${s}`);
  for (const s of ['## En 30 segundos', '## Comprueba', 'Antes de leer']) if (pg.gitlab.includes(s) || pg.clickup.includes(s)) errores.push(`${pg.clave}: «${s}» es solo de Notion`);
}
if (errores.length) {
  console.error(`Las páginas no pasan (${errores.length}):\n- ${errores.join('\n- ')}`);
  process.exit(1);
}
const resumen = mapeo.madres.map((m) => `${m.codigo}: ${m.subtareas.length} subtareas, ${h(m.subtareas.reduce((a, s) => a + s.horas, 0))} h`).join(' · ');
if (arg('--salida')) fs.writeFileSync(arg('--salida'), JSON.stringify(paginas, null, 2));
console.log(`El mapeo pasa. ${resumen}. ${paginas.length} tareas con sus tres versiones (Notion, GitLab y ClickUp).`);
