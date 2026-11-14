#!/usr/bin/env node
// Solo lectura remota: POST únicamente para consultar el data source; GET para leer.
// Solo escribe los informes locales solicitados. Nunca crea una huella ni aplica propuestas.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { opciones, configuracion, snapshot, normalizar, resumenRespuesta } = require('./kb-preguntas.js');
const { inspeccionarRepos, proponerDocumentos } = require('./evidencia-construccion.js');
const { cascada } = require('./cascada-estados.js');
const { TIPO_HU, historiasAfectadas } = require('./historias-afectadas.js');
const textoProp = p => normalizar((p?.rich_text || p?.title || []).map(x => x.plain_text ?? x.text?.content ?? '').join(''));
const cerrados = new Set(['Decidida', 'Descartada', 'Diferida']);
const estados = new Set(['Abierta', 'Propuesta UX', 'Propuesta', ...cerrados]);

function comparar(kb, paginas, huella = { preguntas: {} }) {
  const diferencias = [], avisos = [], mapa = new Map(), sinHuella = [];
  const add = (tipo, id, motivo, propuesta, extra = {}) => diferencias.push({ tipo, id, motivo, propuesta, ...extra });
  for (const p of paginas) {
    const props = p.properties || {}, id = textoProp(props.ID) || p.idPregunta;
    if (!id) { avisos.push('Página sin ID de pregunta: ' + p.id); continue; }
    if (mapa.has(id)) add('d', id, 'ID duplicado en Notion', 'Elegir la pregunta canónica sin borrar automáticamente páginas.');
    mapa.set(id, { page: p.id, estado: props.Estado?.select?.name || '', respuesta: textoProp(props.Respuesta),
      decididoPor: textoProp(props['Decidido por']), fecha: props['Fecha de decisión']?.date?.start || '',
      vigencia: props.Vigencia?.select?.name || '' });
  }
  const porId = new Map(kb.preguntas.map(q => [q.id, q]));
  for (const q of kb.preguntas) {
    const n = mapa.get(q.id), base = huella.preguntas?.[q.id];
    if (!n) { add('c', q.id, 'Solo existe en el KB', 'Proponer la carga a Notion desde la tabla Open questions.', { lado: 'KB', archivo: q.archivo }); continue; }
    const respuestaIgual = !n.respuesta || normalizar(q.respuesta) === n.respuesta || resumenRespuesta(q) === n.respuesta;
    if ((n.respuesta && (!q.respuesta || !respuestaIgual)) || (cerrados.has(n.estado) && !cerrados.has(q.estado))) {
      add('a', q.id, 'Notion tiene un cierre o una respuesta que el KB no refleja',
        'Proponer la respuesta y el estado en Open questions del UXR/FLW/SCR; añadir DEC si es decisión y esperar aprobación.',
        { archivo: q.archivo, linea: q.linea, kb: { estado: q.estado, respuesta: q.respuesta }, notion: n });
    }
    if (!base) sinHuella.push(q.id);
    else if (base.fingerprint !== q.fingerprint) {
      const cambiadas = [...new Set([...Object.keys(base.sourceHashes || {}), ...Object.keys(q.sourceHashes)])]
        .filter(f => base.sourceHashes?.[f] !== q.sourceHashes[f]);
      add('b', q.id, 'La fuente del KB cambió desde la última carga verificada',
        'Proponer actualizar Notion desde el KB y marcar Vigencia = «Revisar por cambio de fuente»; conservar Estado hasta la decisión humana.',
        { fuentesCambiadas: cambiadas, estadoEsperado: q.estado, respuestaEsperada: resumenRespuesta(q),
          vigenciaPropuesta: 'Revisar por cambio de fuente', fingerprint: q.fingerprint });
    } else if (base.notion && Object.entries(base.notion).some(([k, v]) => n[k] !== v)) {
      add('b', q.id, 'Notion difiere de la última carga verificada aunque el KB conserva su huella',
        'Revisar la diferencia antes de proponer la recarga; si hay decisión externa, incorporarla primero al KB.', { notion: n, ultimaCarga: base.notion });
    }
    if (!q.estado || (n.estado && (!estados.has(n.estado) || n.estado !== q.estado))) {
      add('d', q.id, 'Estados contradictorios o vocabulario sin mapear', 'Una persona debe resolver la contradicción en el KB antes de cargar.',
        { kb: q.estado || q.estadoTexto || 'Sin mapa', notion: n.estado || 'Sin estado' });
    }
  }
  for (const [id, n] of mapa) if (!porId.has(id)) {
    add('c', id, 'Solo existe en Notion', 'Localizar o proponer la pregunta canónica en Open questions; no crear ni descartar automáticamente.', { lado: 'Notion', notion: n });
    if (n.respuesta || cerrados.has(n.estado)) add('a', id, 'Notion tiene respuesta o cierre sin pregunta canónica en el KB',
      'Proponer la pregunta y su resolución en el KB, con DEC cuando corresponda.', { notion: n });
  }
  for (const i of kb.incidencias || []) add('d', i.id, i.motivo, 'Conciliar las tablas del KB antes de cargar.', { archivos: i.archivos });
  if (sinHuella.length) avisos.push(`${sinHuella.length} preguntas compartidas sin huella de última carga: no se puede atribuir un cambio de fuente; no se inventa una línea base.`);
  const conteos = Object.fromEntries(['a', 'b', 'c', 'd'].map(t => [t, diferencias.filter(d => d.tipo === t).length]));
  return { version: 1, generado: new Date().toISOString(), soloLectura: true, kb: { ref: kb.ref, commit: kb.commit },
    totales: { kb: kb.preguntas.length, notion: paginas.length }, conteos, abiertas: diferencias.length,
    completo: !sinHuella.length && !avisos.length, sinHuella, avisos, diferencias };
}

function informeMarkdown(r) {
  const labels = { a: 'Notion → KB', b: 'KB → Notion / huella', c: 'Pregunta en un solo lado', d: 'Estados contradictorios', [TIPO_HU]: TIPO_HU };
  const lineas = ['¿Qué diferencias debes resolver antes de cerrar el paquete?', '', '## En 30 segundos', '',
    `${r.abiertas} diferencias abiertas: a=${r.conteos.a}, b=${r.conteos.b}, c=${r.conteos.c}, d=${r.conteos.d}.`,
    'Este informe propone cambios; ninguna modificación se aplicó al KB ni a Notion.', '',
    `KB: rama \`${r.kb.ref}\`, commit \`${r.kb.commit}\`; ${r.totales.kb} preguntas. Notion: ${r.totales.notion} filas.`, '', '## Límites', '',
    ...r.avisos.map(x => '- ' + x), r.completo ? 'La comparación tiene huella para todas las preguntas compartidas.' : 'La cobertura es incompleta: no uses este informe para autorizar el cierre.', '', '## Diferencias', ''];
  for (const d of r.diferencias) lineas.push(`### ${d.id} · ${d.tipo}: ${labels[d.tipo]}`, '', d.motivo + '.', '', d.propuesta, '',
    d.archivo ? `Fuente: \`${d.archivo}:${d.linea || 1}\`.` : '',
    d.notion ? `Notion: ${d.notion.estado || 'Sin estado'}. Respuesta: ${d.notion.respuesta || 'Sin respuesta'}` : '',
    d.resolucionNotion ? 'Resolución leída en Notion:\n\n' + d.resolucionNotion : '',
    d.condicion || '',
    d.fuentesCambiadas?.length ? 'Fuentes modificadas: ' + d.fuentesCambiadas.map(f => '`' + f + '`').join(', ') : '', '');
  if (r.construccion) {
    lineas.push('## Construcción detectada', '', `${r.construccion.propuestas.length} propuestas de estado; ${r.construccion.advertencias.length} artefactos en Borrador con código detectado.`, '');
    for (const p of r.construccion.propuestas) lineas.push(`### ${p.id}: ${p.actual} → ${p.propuesto}`, '', p.motivo, '',
      ...p.evidencia.map(e => `- ${e.repo}, ${e.ref}, ${e.archivo}:${e.linea}`), '');
    lineas.push(...r.construccion.avisos.map(a => '- ' + a), '');
  }
  if (r.cascada) lineas.push(informeCascada(r.cascada));
  lineas.push('¿Qué debe quedar primero en el KB antes de aprobar una carga a Notion?', '');
  return lineas.filter(x => x !== undefined).join('\n');
}
function informeCascada(c) {
  const lineas = ['¿Qué estados dependientes debes revisar antes de aprobar la actualización?', '', '## Propuesta de cascada', '',
    `${c.propuestas.length} cambios propuestos; ninguno se aplicó. Las decisiones y estados se guardan primero en el KB después de la aprobación.`, ''];
  for (const p of c.propuestas) lineas.push(`### ${p.id} · ${p.propiedad}`, '', `${p.actual || 'Sin valor'} → **${p.propuesto}**. ${p.motivo}`, '', p.condicion || 'Requiere aprobación humana antes de aplicar.', '');
  if (c.comentariosHU?.length) {
    lineas.push('## Comentarios propuestos al analista del DSP', '', `${c.comentariosHU.length} propuestas; ninguna HU se modificó y ningún comentario se envió.`, '');
    for (const p of c.comentariosHU) lineas.push(`### ${p.id} → ${p.historia}`, '', p.propuesta, '', p.condicion, '');
  }
  if (c.retenidos?.length) lineas.push('## Paquetes que no retroceden', '', 'El alcance lo decide el gestor de proyectos; estos paquetes conservan su estado.', '', ...c.retenidos.map(a => '- ' + a), '');
  lineas.push(...c.avisos.map(a => '- ' + a), '', '¿Qué evidencia falta para que una propuesta de Aprobado sea una aprobación real de Enzo?', '');
  return lineas.join('\n');
}

function clienteLectura(ds) {
  const token = fs.readFileSync(path.join(os.homedir(), '.notion', 'token.txt'), 'utf8').split(/\r?\n/)[0].trim().replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('El archivo ~/.notion/token.txt está vacío.');
  let ultima = 0;
  return async (method, ruta, body) => {
    if (!(method === 'GET' || (method === 'POST' && /^\/data_sources\/[a-zA-Z0-9-]+\/query$/.test(ruta)))) throw new Error('Operación de escritura rechazada.');
    for (let intento = 0; intento < 4; intento++) {
      const demora = Math.max(0, 350 - (Date.now() - ultima));
      if (demora) await new Promise(r => setTimeout(r, demora));
      ultima = Date.now();
      const res = await fetch('https://api.notion.com/v1' + ruta, { method,
        headers: { Authorization: 'Bearer ' + token, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
      if (res.status === 429 || res.status >= 500) {
        const espera = Math.min(30, Number(res.headers.get('retry-after')) || 2 ** intento);
        if (intento < 3) { await new Promise(r => setTimeout(r, espera * 1000)); continue; }
      }
      if (!res.ok) throw new Error('Notion respondió HTTP ' + res.status + '; la conciliación no se completó.');
      return res.json();
    }
  };
}
async function listar(api, ruta, body) {
  const items = []; let cursor;
  do {
    const r = body ? await api('POST', ruta, { ...body, ...(cursor ? { start_cursor: cursor } : {}) })
      : await api('GET', ruta + (ruta.includes('?') ? '&' : '?') + 'page_size=100' + (cursor ? '&start_cursor=' + encodeURIComponent(cursor) : ''));
    items.push(...r.results); cursor = r.has_more ? r.next_cursor : null;
    if (r.has_more && !cursor) throw new Error('Notion devolvió paginación incompleta.');
  } while (cursor);
  return items;
}
async function main() {
  const args = opciones();
  if (args.help) { console.log('node conciliar-kb-notion.js --kb <repo> [--ref develop] --informe <salida.md> [--json <salida.json>] [--huella <ultima-carga.json>] [--notion-json <fixture.json>] [--dry-run]'); return; }
  if (!args.informe || args.informe === true) throw new Error('Indica --informe <archivo.md>; los informes no se guardan en el KB.');
  const cfg = configuracion(args), kb = snapshot(cfg);
  const huella = fs.existsSync(cfg.huella) ? JSON.parse(fs.readFileSync(cfg.huella, 'utf8')) : { preguntas: {} };
  const ds = cfg.bases.Preguntas.data_source;
  const api = args['notion-json'] ? null : clienteLectura(ds);
  const paginas = args['notion-json'] ? JSON.parse(fs.readFileSync(args['notion-json'], 'utf8'))
    : await listar(api, '/data_sources/' + ds + '/query', { page_size: 100 });
  const r = comparar(kb, paginas, huella);
  const huAfectadas = historiasAfectadas(kb, r.diferencias, huella);
  r.diferencias.push(...huAfectadas); r.conteos.hu = huAfectadas.length; r.abiertas = r.diferencias.length;
  const rutas = args['repos-producto'] ? String(args['repos-producto']).split(';') : cfg.repos_producto || [];
  const repos = rutas.filter(Boolean).map(p => path.resolve(cfg.worktree, p));
  const construccion = inspeccionarRepos(repos), documentosNotion = [];
  if (api) for (const base of ['Requerimientos UX', 'Flujos', 'Pantallas', 'Exploraciones', 'Especificaciones UX', 'Paquetes de alcance']) documentosNotion.push(...await listar(api, '/data_sources/' + cfg.bases[base].data_source + '/query', { page_size: 100 }));
  const docs = proponerDocumentos(kb.documentos, documentosNotion, construccion.evidencias, cfg.worktree);
  r.construccion = { ...docs, avisos: construccion.avisos, repositorios: repos.map(p => path.basename(p)), evidencia: construccion.evidencias };
  r.cascada = cascada({ documentos: kb.documentos, preguntas: kb.preguntas, paginas: documentosNotion, huella, construccion: docs.propuestas });
  r.cascada.comentariosHU = huAfectadas;
  if (api) {
    // El resumen de la propiedad no basta para proponer al KB una respuesta completa.
    for (const d of r.diferencias.filter(d => d.tipo === 'a')) {
      const bloques = await listar(api, '/blocks/' + d.notion.page + '/children');
      const texto = bloques.map(b => (b[b.type]?.rich_text || []).map(t => t.plain_text ?? t.text?.content ?? '').join(''));
      d.resolucionNotion = texto.join('\n');
      if (bloques.some(b => b.has_children)) r.avisos.push(d.id + ': hay bloques anidados; revisa la página antes de copiar su resolución.');
    }
  }
  const salida = path.resolve(args.informe), json = path.resolve(args.json || salida.replace(/\.md$/i, '') + '.json');
  const cascadaSalida = args['cascada-informe'] ? path.resolve(args['cascada-informe']) : null;
  for (const f of [salida, json, cascadaSalida].filter(Boolean)) {
    const rel = path.relative(cfg.worktree, f);
    if (!rel.startsWith('..') && !path.isAbsolute(rel)) throw new Error('Los informes deben quedar fuera del KB de solo lectura.');
    if (f === cfg.huella) throw new Error('El informe no puede reemplazar la huella de última carga.');
    fs.mkdirSync(path.dirname(f), { recursive: true });
  }
  r.completo = r.completo && !r.avisos.length;
  fs.writeFileSync(salida, informeMarkdown(r)); fs.writeFileSync(json, JSON.stringify(r, null, 2) + '\n');
  if (cascadaSalida) fs.writeFileSync(cascadaSalida, informeCascada(r.cascada));
  console.log(JSON.stringify({ soloLectura: true, totales: r.totales, conteos: r.conteos, abiertas: r.abiertas, sinHuella: r.sinHuella.length, completo: r.completo,
    propuestasEstado: docs.propuestas.length, borradorConConstruccion: docs.advertencias.length, propuestasCascada: r.cascada.propuestas.length }));
  process.exitCode = r.abiertas || !r.completo ? 1 : 0;
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 2; });
module.exports = { comparar, informeMarkdown, informeCascada, listar, clienteLectura };
