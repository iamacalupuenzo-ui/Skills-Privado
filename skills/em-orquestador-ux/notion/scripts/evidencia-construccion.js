// Inspección local de repositorios de producto autorizados. Sin fetch, checkout ni escritura.
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { normalizar } = require('./kb-preguntas.js');
const ESTADOS = { draft: 'Borrador', in_review: 'En revisión', in_construction: 'En construcción', validated: 'Validado', approved: 'Aprobado' };
function inspeccionarRepos(rutas) {
  const evidencias = [], avisos = [];
  for (const ruta of rutas) {
    const git = args => execFileSync('git', ['-C', ruta, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024, timeout: 30000 });
    const repo = path.basename(ruta);
    try {
      const refs = git(['for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes']).trim().split('\n').filter(Boolean);
      // También inspecciona ramas CLF_Feature_<US>; una rama sin código no demuestra construcción.
      const relevantes = [...new Set(['HEAD', ...refs.filter(r => /CLF_Feature_/i.test(r))])];
      for (const ref of relevantes) {
        let lineas = '';
        try { lineas = git(['grep', '-n', '-I', '-E', '(HU(-[A-Z]+)?-[0-9]+-[0-9]+|FLW-[0-9]+|SCR-[0-9]+|CLF[-_][0-9]+)', ref, '--', '*.ts', '*.tsx', '*.js', '*.html', '*.vue', '*.cs', '*.java']); }
        catch (e) { if (e.status !== 1) throw e; }
        for (const l of lineas.split('\n').filter(Boolean)) {
          const m = l.match(/^(.+?):([^:]+):(\d+):(.*)$/);
          if (!m) continue;
          const ids = [...new Set(m[4].match(/\b(?:HU(?:-[A-Z]+)?-\d+-\d+|FLW-\d+|SCR-\d+|CLF[-_]\d+)\b/g) || [])];
          evidencias.push({ repo, ref, archivo: m[2], linea: Number(m[3]), ids, tipo: 'codigo' });
        }
        const us = ref.match(/CLF_Feature_(?:US[-_]?)?(\d+)/i)?.[1];
        if (us) {
          const base = refs.includes('refs/remotes/origin/develop') ? 'refs/remotes/origin/develop' : 'HEAD';
          try {
            const archivos = git(['diff', '--name-only', base + '...' + ref, '--', '*.ts', '*.tsx', '*.js', '*.html', '*.vue', '*.cs', '*.java']).trim().split('\n').filter(Boolean);
            if (archivos.length) evidencias.push({ repo, ref, archivo: archivos[0], archivos, linea: 1,
              ids: ['CLF-' + us, 'US-' + us], tipo: 'codigo-rama', nota: 'Código de una rama de historia; solo se vincula si el KB identifica explícitamente ese US o CLF.' });
          } catch { avisos.push(repo + ': no se pudo comparar la rama ' + ref); }
        }
      }
      const merges = git(['log', '--all', '--merges', '--format=%H%x09%B%x00']);
      for (const l of merges.split('\0').filter(Boolean)) {
        const [commit, asunto = ''] = l.trim().split('\t');
        const ids = asunto.match(/\b(?:HU(?:-[A-Z]+)?-\d+-\d+|FLW-\d+|SCR-\d+|CLF[-_]\d+)\b/g) || [];
        for (const m of asunto.matchAll(/CLF_Feature_(?:US[-_]?)?(\d+)/gi)) ids.push('CLF-' + m[1], 'US-' + m[1]);
        const mr = asunto.match(/(?:See merge request|Merge request)\s+([^\n]+!\d+)/i)?.[1];
        if (ids.length) evidencias.push({ repo, commit, ids, tipo: mr ? 'mr-fusionado-local' : 'merge-local', ...(mr ? { mr } : {}), nota: 'Evidencia del historial local; no consulta el estado remoto actual.' });
      }
      // Una MR fusionada requiere registro explícito exportado por el proyecto, nunca una rama remota inferida.
    } catch { avisos.push(repo + ': lectura incompleta; no se puede concluir ausencia de construcción.'); }
  }
  if (!rutas.length) avisos.push('Sin repositorios de producto configurados; la detección de construcción queda incompleta.');
  return { evidencias, avisos };
}
function proponerDocumentos(documentos, paginas, evidencias, kb) {
  const propuestas = [], advertencias = [];
  for (const d of documentos) {
    if (!/^(FLW|SCR|IB)-/.test(d.id)) continue;
    const n = paginas.find(p => normalizar((p.properties?.ID?.rich_text || []).map(t => t.plain_text ?? t.text?.content ?? '').join('')) === d.id);
    const estado = n?.properties?.['Estado del documento']?.select?.name || ESTADOS[d.estado] || d.estado;
    const refs = new Set([d.id, ...d.referencias, ...(d.referenciasProducto || [])]);
    // IDs de historias CLF también pueden declararse explícitamente en el documento del KB.
    for (const id of d.texto.match(/\bCLF[-_]\d+\b/g) || []) refs.add(id);
    const codigo = evidencias.filter(e => ['codigo', 'codigo-rama'].includes(e.tipo) && e.ids.some(id => refs.has(id)));
    if (!codigo.length) continue;
    const prueba = d.texto.match(/^validation:[ \t]*\n([\s\S]*?)(?=^\S|$(?![\s\S]))/m)?.[1] || '';
    const valor = nombre => prueba.match(new RegExp('^  ' + nombre + ':\\s*([^\\n]+)', 'm'))?.[1]?.replace(/["']/g, '').trim();
    const existe = rel => { if (!kb || !rel) return false; const p = path.resolve(kb, rel), r = path.relative(kb, p); return !r.startsWith('..') && !path.isAbsolute(r) && fs.existsSync(p); };
    const hayCaptura = existe(valor('screenshot'));
    const enzo = /^\s+by:\s*["']?Enzo\b/im.test(prueba) && /^\s+browser:\s*\S+/m.test(prueba) && /^\s+date:\s*\S+/m.test(prueba);
    // La auditoría de cierre comprueba que la captura y el ARP realmente existan y coincidan en versión.
    const arp = prueba.match(/^    report:\s*([^\n]+)/m)?.[1]?.replace(/["']/g, '').trim();
    const version = valor('version'), versionArp = prueba.match(/^    version:\s*([^\n]+)/m)?.[1]?.replace(/["']/g, '').trim();
    const evidenciaArp = existe(arp) ? fs.readFileSync(path.resolve(kb, arp), 'utf8') : '';
    const propuesto = hayCaptura && enzo && version && version === versionArp && evidenciaArp.includes(d.id) && evidenciaArp.includes(version)
      && /target:\s*implemented/.test(prueba) && /status:\s*pass/.test(prueba) ? 'Validado' : 'En construcción';
    if (estado !== propuesto && !['Validado', 'Aprobado'].includes(estado)) propuestas.push({ id: d.id, archivo: d.archivo, actual: estado, propuesto, evidencia: codigo,
      motivo: 'Código localizado que referencia la HU o el FLW/SCR; una persona debe aprobar el estado en el KB antes de cargarlo.' });
    if (estado === 'Borrador') advertencias.push({ codigo: 'ARTEFACTO_BORRADOR_CON_CONSTRUCCION', id: d.id, mensaje: 'Hay código detectado; proponer En construcción y evitar que permanezca en Borrador.' });
  }
  return { propuestas, advertencias };
}
module.exports = { inspeccionarRepos, proponerDocumentos, ESTADOS };
