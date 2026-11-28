#!/usr/bin/env node
// Prepara un plan revisable; solo --aplicar-plan aplica exactamente ese plan aprobado.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { opciones, configuracion, snapshot, resumenRespuesta, resolucion, validarDelegacion, hash } = require('./kb-preguntas.js');
const { clienteLectura, listar } = require('./conciliar-kb-notion.js');
const { deduplicarPlan } = require('./validar-plan.js');
const rt = s => ({ rich_text: [{ type: 'text', text: { content: s } }] });
function propiedades(q) {
  validarDelegacion(q);
  if (!q.estado) throw new Error(q.id + ': estado sin mapa; completa el KB antes de cargar.');
  if (q.estado === 'Propuesta UX' && /PO\b|Product Owner|Negocio|Arquitectura|Seguridad|Analista/i.test(q.responsable)) throw new Error(q.id + ': una pregunta mixta conserva Propuesta; decide su responsable externo a UX.');
  if (q.estado === 'Decidida' && (!q.fecha || !q.decididoPor || (!q.decision && !q.decisiones.length))) throw new Error(q.id + ': una decisión exige fecha, autoría y DEC en el KB antes de cargar.');
  const p = { Respuesta: rt(resumenRespuesta(q)), Estado: { select: { name: q.estado } } };
  if (q.decididoPor) p['Decidido por'] = rt(q.decididoPor);
  if (q.fecha) p['Fecha de decisión'] = { date: { start: q.fecha } };
  return p;
}
function insertarResolucion(md, seccion) {
  // Conserva contexto, alternativas, comentarios y vistas fuera de la sección administrada.
  const limpio = md.replace(/^## Resolución\s*\n[\s\S]*?(?=^## (?!#)|$(?![\s\S]))/gm, '').trimEnd();
  return limpio + '\n\n' + seccion;
}
async function main() {
  const args = opciones(), cfg = configuracion(args), kb = snapshot(cfg);
  if (args['dry-run'] && args['aplicar-plan']) throw new Error('--dry-run no aplica planes; omite --aplicar-plan para preparar uno.');
  const out = path.resolve(args.plan || path.join(process.env.NOTION_TRABAJO || path.resolve(__dirname, '../trabajo'), 'preguntas/plan-respuestas.json'));
  const sync = path.resolve(__dirname, 'notion-sync.js');
  const run = a => JSON.parse(execFileSync(process.execPath, [sync, ...a], { encoding: 'utf8' }));
  if (!args['aplicar-plan']) {
    const only = String(args.only || '').split(',').filter(Boolean);
    const desconocidos = only.filter(id => !kb.preguntas.some(q => q.id === id));
    if (desconocidos.length) throw new Error('IDs solicitados ausentes del KB: ' + desconocidos.join(', '));
    const api = args['notion-json'] ? null : clienteLectura(cfg.bases.Preguntas.data_source);
    const paginas = args['notion-json'] ? JSON.parse(fs.readFileSync(args['notion-json'], 'utf8'))
      : await listar(api, '/data_sources/' + cfg.bases.Preguntas.data_source + '/query', { page_size: 100 });
    const preguntas = [], pendientes = [];
    for (const q of kb.preguntas.filter(q => (!only.length || only.includes(q.id)))) {
      const candidatas = paginas.filter(p => (p.properties?.ID?.rich_text || []).map(t => t.plain_text ?? t.text?.content ?? '').join('') === q.id);
      if (candidatas.length > 1) throw new Error(q.id + ': ID repetido en Notion; concilia antes de preparar la carga.');
      const p = candidatas[0];
      if (!p) { pendientes.push({ id: q.id, motivo: 'Sin página en Notion; prepara primero su creación con el cargador de preguntas.' }); continue; }
      const responsables = (p.properties?.Responsable?.multi_select || []).map(x => x.name).join(' ');
      if (q.estado === 'Propuesta UX' && /PO|Negocio|Arquitectura|Seguridad|Analista/i.test(responsables)) throw new Error(q.id + ': la propuesta de otro responsable no se remapea a Propuesta UX.');
      const anterior = api ? (await api('GET', '/pages/' + p.id + '/markdown')).markdown : p.markdown || '';
      if (anterior === undefined) throw new Error(q.id + ': no se pudo leer el cuerpo completo.');
      const cuerpo = insertarResolucion(anterior, resolucion(q, cfg));
      preguntas.push({ id: q.id, page: p.id, fingerprint: q.fingerprint, expectedEdited: p.last_edited_time,
        expectedBodyHash: hash(anterior), props: propiedades(q), cuerpo, sourceHashes: q.sourceHashes });
    }
    const plan = { version: 1, commit: kb.commit, ref: kb.ref, preguntas: deduplicarPlan(preguntas), cobertura: { completa: !pendientes.length, pendientes } };
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(plan, null, 2));
    console.log(JSON.stringify({ dryRun: true, preguntas: preguntas.length, pendientes: pendientes.length, completa: plan.cobertura.completa, plan: out })); return;
  }
  const plan = JSON.parse(fs.readFileSync(args['aplicar-plan'], 'utf8'));
  plan.preguntas = deduplicarPlan(plan.preguntas);
  if (plan.cobertura?.completa !== true || plan.cobertura.pendientes.length) throw new Error('El plan no cubre todos los registros solicitados; resuelve los pendientes antes de aplicar.');
  if (plan.commit !== kb.commit || plan.ref !== kb.ref) throw new Error('El KB cambió; genera y aprueba un plan nuevo.');
  const huella = fs.existsSync(cfg.huella) ? JSON.parse(fs.readFileSync(cfg.huella, 'utf8')) : { version: 1, preguntas: {} };
  const leer = clienteLectura(cfg.bases.Preguntas.data_source);
  let ok = 0;
  for (const p of plan.preguntas) {
    const q = kb.preguntas.find(q => q.id === p.id);
    if (!q || q.fingerprint !== p.fingerprint || JSON.stringify(p.props) !== JSON.stringify(propiedades(q))) throw new Error(p.id + ': el plan no coincide con el KB.');
    if (!p.cuerpo.endsWith(resolucion(q, cfg))) throw new Error(p.id + ': la resolución del plan no coincide con el KB.');
    if (!p.expectedEdited || !p.expectedBodyHash) throw new Error(p.id + ': plan sin precondiciones; vuelve a prepararlo leyendo Notion.');
    const base = path.join(path.dirname(out), p.id.replace(/[^\w.-]/g, '_'));
    fs.mkdirSync(path.dirname(base), { recursive: true });
    fs.writeFileSync(base + '.json', JSON.stringify({ ...p, title: p.id }));
    fs.writeFileSync(base + '.md', p.cuerpo);
    const carga = run(['upsert', '--ds', cfg.bases.Preguntas.data_source, '--meta', base + '.json', '--solo-props']);
    if (!carga.ok) throw new Error(p.id + ': no se cargaron las propiedades.');
    run(['push', '--page', p.page, '--body', base + '.md', '--source', q.archivo, '--expect-edited', carga.lastEdited]);
    const ver = run(['verify', '--page', p.page, '--body', base + '.md']);
    if (!ver.ok) throw new Error(p.id + ': carga no verificada; no se guarda la huella.');
    const pagina = await leer('GET', '/pages/' + p.page), props = pagina.properties;
    const texto = p => (p?.rich_text || []).map(t => t.plain_text ?? t.text?.content ?? '').join('');
    if (texto(props.Respuesta) !== resumenRespuesta(q) || props.Estado?.select?.name !== q.estado
        || (q.decididoPor && texto(props['Decidido por']) !== q.decididoPor) || (q.fecha && props['Fecha de decisión']?.date?.start !== q.fecha)) {
      throw new Error(p.id + ': las propiedades leídas no coinciden; no se guarda la huella.');
    }
    const contenido = await leer('GET', '/pages/' + p.page + '/markdown');
    if (contenido.truncated || !contenido.markdown?.includes(resolucion(q, cfg).trim())) throw new Error(p.id + ': la resolución completa no se verificó; no se guarda la huella.');
    huella.preguntas[p.id] = { fingerprint: q.fingerprint, sourceHashes: q.sourceHashes, commit: kb.commit, ref: kb.ref,
      cargado: new Date().toISOString(), notion: { estado: q.estado, respuesta: resumenRespuesta(q), decididoPor: texto(props['Decidido por']), fecha: props['Fecha de decisión']?.date?.start || '' } };
    fs.mkdirSync(path.dirname(cfg.huella), { recursive: true });
    fs.writeFileSync(cfg.huella + '.tmp', JSON.stringify(huella, null, 2)); fs.renameSync(cfg.huella + '.tmp', cfg.huella);
    ok++;
  }
  console.log(JSON.stringify({ ok, total: plan.preguntas.length }));
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 2; });
module.exports = { propiedades, insertarResolucion, main };
