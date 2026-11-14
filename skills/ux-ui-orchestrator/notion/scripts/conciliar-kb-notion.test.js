const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { comparar, listar } = require('./conciliar-kb-notion.js');
const { snapshot, extraer, estadoKB, resumenRespuesta, resolucion, validarDelegacion } = require('./kb-preguntas.js');
const { insertarResolucion, propiedades } = require('./subir-respuestas.js');
const { origenPregunta, propiedadesDocumento } = require('./contrato-documentos.js');
const { inspeccionarRepos, proponerDocumentos } = require('./evidencia-construccion.js');
const { cascada } = require('./cascada-estados.js');
const { historiasAfectadas, TIPO_HU } = require('./historias-afectadas.js');
const { deduplicarPlan } = require('./validar-plan.js');
const q = extra => ({ id: 'UXR-901-Q1', estado: 'Abierta', estadoTexto: 'Abierta', responsable: 'PO / UX', respuesta: '',
  archivo: 'design/ux-requirements/UXR-901.md', linea: 5, fingerprint: 'nueva', sourceHashes: { 'architecture/ARQ-901.md': 'nuevo' }, decisiones: [], ...extra });
const pagina = (id, estado, respuesta = '') => ({ id: 'pagina-' + id, properties: { ID: { rich_text: [{ plain_text: id }] },
  Estado: { select: { name: estado } }, Respuesta: { rich_text: [{ plain_text: respuesta }] } } });
const kb = preguntas => ({ ref: 'develop', commit: 'abc', preguntas, incidencias: [] });
test('a: propone al KB una respuesta y cierre de Notion', () => {
  const r = comparar(kb([q()]), [pagina('UXR-901-Q1', 'Decidida', 'Respuesta humana')]);
  assert.equal(r.conteos.a, 1); assert.equal(r.conteos.d, 1); assert.equal(r.diferencias[0].notion.respuesta, 'Respuesta humana');
});
test('b: un cambio de Arquitectura dispara la vigencia desde la huella verificada', () => {
  const r = comparar(kb([q()]), [pagina('UXR-901-Q1', 'Abierta')], { preguntas: { 'UXR-901-Q1': { fingerprint: 'anterior', sourceHashes: { 'architecture/ARQ-901.md': 'viejo' } } } });
  assert.equal(r.conteos.b, 1); assert.deepEqual(r.diferencias[0].fuentesCambiadas, ['architecture/ARQ-901.md']);
  assert.equal(r.diferencias[0].vigenciaPropuesta, 'Revisar por cambio de fuente');
});
test('c: detecta preguntas de ambos lados sin crear ni descartar', () => {
  const r = comparar(kb([q()]), [pagina('FLW-902-Q1', 'Decidida', 'Respuesta')]);
  assert.equal(r.conteos.c, 2); assert.equal(r.conteos.a, 1);
});
test('d: detecta duplicados y vocabulario desconocido', () => {
  const r = comparar(kb([q()]), [pagina('UXR-901-Q1', 'Aprobada'), pagina('UXR-901-Q1', 'Otro')]);
  assert.equal(r.conteos.d, 2);
});
test('sin huella no inventa cambios de fuente ni autoriza cierre', () => {
  const r = comparar(kb([q()]), [pagina('UXR-901-Q1', 'Abierta')]);
  assert.equal(r.conteos.b, 0); assert.equal(r.completo, false); assert.equal(r.sinHuella.length, 1);
});
test('una carga idéntica y con huella queda conciliada', () => {
  const r = comparar(kb([q()]), [pagina('UXR-901-Q1', 'Abierta')], { preguntas: { 'UXR-901-Q1': { fingerprint: 'nueva' } } });
  assert.equal(r.abiertas, 0); assert.equal(r.completo, true);
});
test('una Propuesta ajena no se remapea a Propuesta UX', () => {
  for (const rol of ['PO', 'Arquitectura', 'Seguridad', 'Analista', 'UX']) assert.equal(estadoKB('Propuesta', rol), 'Propuesta');
  assert.equal(estadoKB('Propuesta UX', 'UX'), 'Propuesta UX');
  assert.equal(estadoKB('Respondida por Enzo, pendiente del PO', 'PO / UX'), 'Propuesta');
});
test('Diferida y cierres se mapean sin deducirlos de una referencia', () => {
  assert.equal(estadoKB('Diferida hasta construir la función'), 'Diferida');
  assert.equal(estadoKB('Cerrada (2026-11-14): texto'), 'Decidida');
  assert.equal(estadoKB('Ver DEC-901'), null);
});
test('resumen incluye al responsable y respeta 200 caracteres con Unicode', () => {
  const s = resumenRespuesta(q({ respuesta: '😊'.repeat(300) }));
  assert.ok(s.startsWith('[Confirma: PO]')); assert.equal(Array.from(s).length, 200);
  assert.ok(resumenRespuesta(q({ estado: 'Propuesta UX' })).startsWith('[Confirma: Enzo]'));
});
test('resolución conserva las cuatro secciones, autoría y fecha del KB', () => {
  const md = resolucion(q({ respuesta: 'Respuesta', fuentes: 'NN/g', decididoPor: 'Enzo', fecha: '2026-11-14' }));
  assert.equal((md.match(/^### /gm) || []).length, 4); assert.ok(!/^# /m.test(md)); assert.ok(md.includes('Enzo')); assert.ok(md.includes('2026-11-14'));
});
test('la recarga de Resolución conserva contexto y vistas sin duplicar secciones', () => {
  const md = '## Contexto\nOriginal\n\n## Resolución\n### Respuesta\nVieja\n\n## Vista\nConservar';
  const r = insertarResolucion(md, '## Resolución\n### Respuesta\nNueva');
  assert.ok(r.includes('Original')); assert.ok(r.includes('Conservar')); assert.ok(!r.includes('Vieja')); assert.equal((r.match(/## Resolución/g) || []).length, 1);
});
test('la delegación exige un dominio UX, fecha, DEC y evidencia', () => {
  const buena = q({ estado: 'Decidida', decididoPor: 'IA (delegado por Enzo)', responsable: 'UX', dominio: 'textos', fecha: '2026-11-14', fuentes: 'NN/g: https://www.nngroup.com/', decisiones: ['design/decisiones/DEC-901.md'] });
  assert.doesNotThrow(() => validarDelegacion(buena));
  for (const cambio of [{ dominio: 'permisos' }, { responsable: 'PO / UX' }, { fuentes: '' }, { fecha: '' }, { decisiones: [] }]) assert.throws(() => propiedades({ ...buena, ...cambio }));
});
test('extrae UXR, FLW y SCR e informa contradicciones entre tablas', () => {
  const tabla = st => '# Open questions\n| ID | Pregunta | Responsable | Estado | Respuesta |\n|---|---|---|---|---|\n| FLW-901-Q1 | ¿Qué ve? | UX | ' + st + ' | Texto |\n';
  const r = extraer(new Map([['design/user-flows/FLW-901.md', tabla('Abierta')], ['design/screens/SCR-901.md', tabla('Diferida')]]));
  assert.equal(r.preguntas.size, 1); assert.equal(r.incidencias.length, 1); assert.equal(r.preguntas.get('FLW-901-Q1').ubicaciones.length, 2);
});
test('la paginación consulta todos los lotes y no invoca escrituras', async () => {
  const llamadas = [];
  const r = await listar(async (metodo, ruta, body) => { llamadas.push({ metodo, ruta, body }); return llamadas.length === 1 ? { results: [1], has_more: true, next_cursor: 'dos' } : { results: [2], has_more: false }; }, '/data_sources/prueba/query', { page_size: 100 });
  assert.deepEqual(r, [1, 2]); assert.ok(llamadas.every(x => x.metodo === 'POST' && x.ruta.endsWith('/query'))); assert.equal(llamadas[1].body.start_cursor, 'dos');
});
test('contrato documental carga estados y capturas sin crear esquema', () => {
  const r = propiedadesDocumento('status: in_construction', '![Prueba](https://example.org/captura.png)', 'flw');
  assert.equal(r['Estado del documento'].select.name, 'En construcción'); assert.equal(r.Capturas.files.length, 1);
  assert.ok(!propiedadesDocumento('status: draft', '![Local](captura.png)', 'ib').Capturas);
  assert.equal(origenPregunta({ id: 'Q-UXS-1' }), 'UXS'); assert.equal(origenPregunta({ id: 'FLW-901-Q1' }), 'Flujo');
});
test('código con HU detectada propone En construcción y advierte Borrador', () => {
  const d = { id: 'SCR-901', estado: 'draft', archivo: 'design/screens/SCR-901.md', referencias: ['HU-90-01'], texto: '' };
  const r = proponerDocumentos([d], [], [{ tipo: 'codigo', ids: ['HU-90-01'], repo: 'producto' }]);
  assert.equal(r.propuestas[0].propuesto, 'En construcción'); assert.equal(r.advertencias.length, 1);
});
test('una declaración de captura inexistente no propone Validado', () => {
  const d = { id: 'SCR-901', estado: 'draft', referencias: ['HU-90-01'], texto: 'validation:\n  by: Enzo\n  browser: navegador\n  date: 2026-11-14\n  screenshot: inexistente.png\n' };
  assert.equal(proponerDocumentos([d], [], [{ tipo: 'codigo', ids: ['HU-90-01'] }]).propuestas[0].propuesto, 'En construcción');
});
test('snapshot usa la rama configurada y detecta cambios upstream, sin checkout', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ux-conciliar-'));
  const git = (...args) => execFileSync('git', ['-C', dir, '-c', 'user.name=Prueba', '-c', 'user.email=prueba@example.invalid', ...args], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const escribir = (f, s) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), s); };
  try {
    git('init', '-b', 'develop');
    escribir('design/ux-requirements/UXR-901.md', '---\nsources:\n - id: ARQ-901\n   resource: /architecture/ARQ-901.md\n---\n# Open questions\n| ID | Pregunta | Estado |\n|---|---|---|\n| UXR-901-Q1 | ¿Qué? | Abierta |\n');
    escribir('architecture/ARQ-901.md', '# ARQ-901\nVersión inicial');
    git('add', '.'); git('commit', '-m', 'Base de prueba');
    const a = snapshot({ worktree: dir, ref: 'develop' });
    git('checkout', '-b', 'trabajo'); escribir('architecture/ARQ-901.md', '# ARQ-901\nCambio de Arquitectura'); git('add', '.'); git('commit', '-m', 'Cambio de prueba');
    const b = snapshot({ worktree: dir, ref: 'trabajo' }), c = snapshot({ worktree: dir, ref: 'develop' });
    assert.notEqual(a.preguntas[0].fingerprint, b.preguntas[0].fingerprint); assert.equal(a.preguntas[0].fingerprint, c.preguntas[0].fingerprint); assert.equal(git('branch', '--show-current').trim(), 'trabajo');
    const estadoAntes = git('status', '--porcelain');
    escribir('fixture.json', JSON.stringify([pagina('UXR-901-Q1', 'Decidida', 'Respuesta')]));
    escribir('config.json', JSON.stringify({ worktree: dir, design_ref: 'develop', repos_producto: [], bases: { Preguntas: { data_source: 'prueba' } } }));
    const salida = path.join(os.tmpdir(), path.basename(dir) + '-informe.md');
    const r = spawnSync(process.execPath, [path.join(__dirname, 'conciliar-kb-notion.js'), '--config', path.join(dir, 'config.json'), '--notion-json', path.join(dir, 'fixture.json'), '--huella', path.join(dir, 'no-existe.json'), '--informe', salida, '--dry-run'], { encoding: 'utf8' });
    assert.equal(r.status, 1, r.stderr); assert.equal(JSON.parse(fs.readFileSync(salida.replace(/\.md$/, '.json'))).conteos.a, 1);
    fs.unlinkSync(salida); fs.unlinkSync(salida.replace(/\.md$/, '.json'));
    escribir('sin-paginas.json', '[]');
    const plan = path.join(os.tmpdir(), path.basename(dir) + '-plan.json');
    const preparar = spawnSync(process.execPath, [path.join(__dirname, 'subir-respuestas.js'), '--config', path.join(dir, 'config.json'), '--notion-json', path.join(dir, 'sin-paginas.json'), '--plan', plan, '--dry-run'], { encoding: 'utf8' });
    assert.equal(preparar.status, 0, preparar.stderr);
    const contenidoPlan = JSON.parse(fs.readFileSync(plan));
    assert.equal(contenidoPlan.cobertura.completa, false); assert.equal(contenidoPlan.cobertura.pendientes.length, 1);
    fs.unlinkSync(plan);
    assert.equal(git('branch', '--show-current').trim(), 'trabajo'); assert.equal(estadoAntes, '');
    escribir('src/pantalla.ts', '// HU-90-01\nexport const pantalla = true;'); git('add', '.'); git('commit', '-m', 'Código de prueba');
    const evidencia = inspeccionarRepos([dir]); assert.ok(evidencia.evidencias.some(e => e.tipo === 'codigo' && e.ids.includes('HU-90-01')));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

const doc = (id, extra = {}) => ({ id, estado: 'draft', archivo: 'design/' + id + '.md', texto: '', screens: [], requirements: [], referencias: [], paquetes: [], sourceHashes: {}, fingerprint: id, ...extra });
function calcular(documentos, preguntas = [], extra = {}) {
  return cascada({ documentos, preguntas, huella: { documentos: Object.fromEntries(documentos.map(d => [d.id, { fingerprint: d.fingerprint }])) }, ...extra });
}
test('cascada: preguntas cerradas llevan el UXR a En revisión', () => {
  const r = calcular([doc('UXR-901')], [q({ estado: 'Decidida' })]);
  assert.equal(r.estadosCalculados['UXR-901'], 'En revisión');
});
test('cascada: Diferida y Descartada permiten revisar, Propuesta UX y Propuesta no', () => {
  for (const estado of ['Diferida', 'Descartada']) assert.equal(calcular([doc('UXR-901')], [q({ estado })]).estadosCalculados['UXR-901'], 'En revisión');
  for (const estado of ['Abierta', 'Propuesta UX', 'Propuesta']) assert.equal(calcular([doc('UXR-901')], [q({ estado })]).estadosCalculados['UXR-901'], 'Borrador');
});
test('cascada: UXR con flujos construidos propone Aprobado y exige Enzo', () => {
  const r = calcular([doc('UXR-901'), doc('FLW-901', { estado: 'in_construction', requirements: ['UXR-901'] })], [q({ estado: 'Decidida' })]);
  const p = r.propuestas.find(p => p.id === 'UXR-901');
  assert.equal(p.propuesto, 'Aprobado'); assert.match(p.condicion, /Enzo.*approved_by/);
});
test('cascada: una pantalla construida mueve FLW e IB, todas validadas los validan', () => {
  const base = [doc('FLW-901', { screens: ['SCR-901', 'SCR-902'] }), doc('IB-901', { screens: ['SCR-901', 'SCR-902'] })];
  let r = calcular([...base, doc('SCR-901', { estado: 'in_construction' }), doc('SCR-902')]);
  assert.equal(r.estadosCalculados['FLW-901'], 'En construcción'); assert.equal(r.estadosCalculados['IB-901'], 'En construcción');
  r = calcular([...base, doc('SCR-901', { estado: 'validated' }), doc('SCR-902', { estado: 'validated' })]);
  assert.equal(r.estadosCalculados['FLW-901'], 'Validado'); assert.equal(r.estadosCalculados['IB-901'], 'Validado');
});
test('cascada: IB con lienzo o capturas propone En revisión', () => {
  const r = calcular([doc('IB-901', { texto: 'https://figma.com/file/prueba' })]);
  assert.equal(r.estadosCalculados['IB-901'], 'En revisión');
});
test('cascada: una pantalla ausente no permite validar un flujo o exploración', () => {
  const r = calcular([doc('FLW-901', { screens: ['SCR-901', 'SCR-902'] }), doc('IB-901', { screens: ['SCR-901', 'SCR-902'] }), doc('SCR-901', { estado: 'validated' })]);
  assert.notEqual(r.estadosCalculados['FLW-901'], 'Validado'); assert.notEqual(r.estadosCalculados['IB-901'], 'Validado');
});
test('cascada: un UXR sin preguntas registradas no se aprueba por vacío', () => {
  assert.equal(calcular([doc('UXR-901')]).estadosCalculados['UXR-901'], 'Borrador');
});
test('cascada descendente: cambio de Arquitectura invalida pregunta, resumen y cierre', () => {
  const d = doc('UXR-901', { estado: 'approved', sourceHashes: { 'architecture/ARQ-901.md': 'nuevo' } });
  const h = { documentos: { 'UXR-901': { fingerprint: d.fingerprint } }, preguntas: { 'UXR-901-Q1': { fingerprint: 'vieja', sourceHashes: { 'architecture/ARQ-901.md': 'viejo' } } } };
  const r = cascada({ documentos: [d], preguntas: [q({ estado: 'Decidida' })], huella: h });
  assert.equal(r.estadosCalculados['UXR-901'], 'En revisión');
  assert.ok(r.propuestas.some(p => p.propiedad === 'Vigencia' && p.propuesto === 'Revisar por cambio de fuente'));
  assert.ok(r.propuestas.some(p => p.propiedad === 'Resumen vigente' && p.propuesto === 'Desactualizado'));
});
test('cascada descendente: se propaga por dependencias y prevalece sobre avances', () => {
  const ds = [doc('UXR-901', { estado: 'approved', sourceHashes: { 'architecture/ARQ-901.md': 'nuevo' } }),
    doc('FLW-901', { estado: 'validated', sourceHashes: { 'design/UXR-901.md': 'sin-cambio' }, screens: ['SCR-901'] }), doc('SCR-901', { estado: 'validated' })];
  const h = { documentos: Object.fromEntries(ds.map(d => [d.id, { fingerprint: d.fingerprint }])), preguntas: { 'UXR-901-Q1': { fingerprint: 'vieja', sourceHashes: { 'architecture/ARQ-901.md': 'viejo' } } } };
  const r = cascada({ documentos: ds, preguntas: [q({ estado: 'Decidida' })], huella: h });
  assert.equal(r.estadosCalculados['FLW-901'], 'En revisión');
});
test('cascada: una aprobación propuesta no cierra UXS ni paquete', () => {
  const ds = [doc('UXR-901', { paquetes: ['DSP-901'] }), doc('FLW-901', { estado: 'in_construction', requirements: ['UXR-901'], paquetes: ['DSP-901'] }),
    doc('SCR-901', { estado: 'validated', paquetes: ['DSP-901'] }), doc('UXS-901', { paquetes: ['DSP-901'] }), doc('DSP-901')];
  const r = calcular(ds, [q({ estado: 'Decidida' })]);
  assert.equal(r.estadosCalculados['UXR-901'], 'Aprobado');
  assert.equal(r.propuestas.find(p => p.id === 'UXS-901').propuesto, 'En curso');
  assert.notEqual(r.propuestas.find(p => p.id === 'DSP-901').propuesto, 'Cerrado');
});
test('cascada: UXS y paquete cierran solo con aprobación registrada y pantallas validadas', () => {
  const ds = [doc('UXR-901', { estado: 'approved', approvedBy: 'Enzo', paquetes: ['DSP-901'] }),
    doc('FLW-901', { estado: 'validated', requirements: ['UXR-901'], paquetes: ['DSP-901'] }),
    doc('SCR-901', { estado: 'validated', paquetes: ['DSP-901'] }), doc('IB-901', { estado: 'validated', screens: ['SCR-901'], paquetes: ['DSP-901'] }), doc('UXS-901', { paquetes: ['DSP-901'] }), doc('DSP-901')];
  const r = calcular(ds, [q({ estado: 'Decidida' })]);
  assert.equal(r.propuestas.find(p => p.id === 'UXS-901').propuesto, 'Listo para desarrollo');
  assert.equal(r.propuestas.find(p => p.id === 'DSP-901').propuesto, 'Cerrado');
});
test('cascada: sin huella documental declara cobertura incompleta', () => {
  const r = cascada({ documentos: [doc('FLW-901')], preguntas: [] });
  assert.equal(r.sinHuella.length, 1); assert.equal(r.avisos.length, 1);
});
test('HU afectada: solo propone comentario al analista del DSP con AC y regla', () => {
  const pregunta = q({ pregunta: 'HU-90-01 AC-02 BR-901', respuesta: 'Cambió la validación', ubicaciones: [{ archivo: 'design/UXR-901.md' }] });
  const documentos = [doc('UXR-901', { historias: ['HU-90-01'], paquetes: ['DSP-901'] })];
  const r = historiasAfectadas({ preguntas: [pregunta], documentos }, [{ id: pregunta.id, tipo: 'a', notion: { respuesta: 'Nueva decisión' } }], {});
  assert.equal(r.length, 1); assert.equal(r[0].tipo, TIPO_HU); assert.match(r[0].destinatario, /Analista funcional de DSP-901/);
  assert.match(r[0].propuesta, /AC-02, BR-901/); assert.equal(r[0].soloPropuesta, true);
});
test('HU afectada: no inventa el analista cuando falta el DSP', () => {
  const r = historiasAfectadas({ preguntas: [q({ pregunta: 'HU-90-01', respuesta: 'Respuesta' })], documentos: [] }, [{ id: 'UXR-901-Q1', tipo: 'a' }], {});
  assert.match(r[0].destinatario, /identificar el paquete/);
});
test('planes: deduplica un ID idéntico y bloquea conflicto o null', () => {
  assert.equal(deduplicarPlan([{ id: 'Q-901', texto: 'Uno' }, { id: 'Q-901', texto: 'Uno' }]).length, 1);
  assert.throws(() => deduplicarPlan([{ id: 'Q-901', texto: 'Uno' }, { id: 'Q-901', texto: 'Dos' }]));
  assert.throws(() => deduplicarPlan([{ id: 'Q-901', dato: null }]));
});
