// Contrato de carga; no crea propiedades ni opciones en Notion.
const { normalizar } = require('./kb-preguntas.js');
const ESTADOS = { draft: 'Borrador', in_review: 'En revisión', in_construction: 'En construcción', validated: 'Validado', approved: 'Aprobado',
  Borrador: 'Borrador', 'En revisión': 'En revisión', 'En construcción': 'En construcción', Validado: 'Validado', Aprobado: 'Aprobado' };
const ORIGENES = ['UXR', 'HU', 'DUD-001', 'DUD-002', 'CPO-001', 'Otro', 'Flujo', 'Pantalla', 'Investigación', 'UXS', 'Decisión', 'Construcción'];
function origenPregunta(q) {
  if (q.origen) {
    if (!ORIGENES.includes(q.origen)) throw new Error(q.id + ': Origen no reconocido; revisa el KB.');
    return q.origen;
  }
  for (const [re, nombre] of [[/^FLW-/, 'Flujo'], [/^SCR-/, 'Pantalla'], [/^INV-/, 'Investigación'], [/^(?:UXS-|Q-UXS-)/, 'UXS'], [/^DEC-/, 'Decisión'], [/^HU-/, 'HU'], [/^UXR-/, 'UXR']]) if (re.test(q.id)) return nombre;
  return 'Otro';
}
function propiedadesDocumento(fm, cuerpo, tipo) {
  const estado = normalizar(fm.match(/^status:\s*([^\n]+)/m)?.[1]).replace(/^["']|["']$/g, '') || 'draft';
  if (!ESTADOS[estado]) throw new Error('Estado documental sin mapa: ' + estado);
  const props = { 'Estado del documento': { select: { name: ESTADOS[estado] } } };
  if (['flw', 'ib'].includes(tipo)) {
    // Los archivos locales deben subirse primero; nunca se expone una ruta local como URL.
    const urls = [...new Set([...cuerpo.matchAll(/!\[[^\]]*\]\((https:\/\/[^\s)]+)\)/g)].map(m => m[1]))];
    if (urls.length) props.Capturas = { files: urls.map((url, i) => ({ name: 'Captura ' + (i + 1), type: 'external', external: { url } })) };
  }
  return props;
}
module.exports = { ESTADOS, ORIGENES, origenPregunta, propiedadesDocumento };
