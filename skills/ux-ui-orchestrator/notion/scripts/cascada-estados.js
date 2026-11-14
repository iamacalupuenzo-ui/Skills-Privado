// Propuestas en cadena: calcula hasta un punto fijo; nunca escribe estados.
const { ESTADOS } = require('./contrato-documentos.js');
const { normalizar } = require('./kb-preguntas.js');
const CERRADAS = new Set(['Decidida', 'Diferida', 'Descartada']);
const CONSTRUIDAS = new Set(['En construcción', 'Validado']);
function cascada({ documentos, preguntas, paginas = [], huella = {}, construccion = [] }) {
  const propuestas = [], avisos = [], nodes = new Map(), cambios = new Set(), sinHuella = [];
  const paginasId = new Map(paginas.map(p => [normalizar((p.properties?.ID?.rich_text || []).map(t => t.plain_text ?? t.text?.content ?? '').join('')), p]));
  const propiedades = d => paginasId.get(d.id)?.properties || {};
  for (const d of documentos) {
    const p = propiedades(d), estado = p['Estado del documento']?.select?.name || ESTADOS[d.estado] || d.estado;
    nodes.set(d.id, { ...d, actual: estado, estado });
    if (huella.documentos?.[d.id] && huella.documentos[d.id].fingerprint !== d.fingerprint) cambios.add(d.id);
    if (!huella.documentos?.[d.id]) sinHuella.push(d.id);
  }
  // Un cambio en cualquier fuente externa se propaga a los documentos dependientes.
  const fuentes = new Set();
  for (const q of preguntas) {
    const anterior = huella.preguntas?.[q.id];
    if (anterior && anterior.fingerprint !== q.fingerprint) for (const f of Object.keys(q.sourceHashes || {})) if (anterior.sourceHashes?.[f] !== q.sourceHashes[f]) fuentes.add(f);
  }
  for (const d of nodes.values()) if ([...fuentes].some(f => Object.hasOwn(d.sourceHashes || {}, f))) cambios.add(d.id);
  for (let vuelta = 0; vuelta < nodes.size; vuelta++) {
    let cambio = false;
    for (const d of nodes.values()) if (!cambios.has(d.id) && [...cambios].some(id => Object.hasOwn(d.sourceHashes || {}, nodes.get(id).archivo))) {
      cambios.add(d.id); cambio = true;
    }
    if (!cambio) break;
  }
  const poner = (d, propiedad, valor, motivo, condicion = '') => {
    const anterior = propiedad === 'Estado del documento' ? d.actual : propiedades(d)[propiedad]?.select?.name;
    if (anterior === valor) return;
    const existente = propuestas.find(p => p.id === d.id && p.propiedad === propiedad);
    const p = { id: d.id, archivo: d.archivo, propiedad, actual: anterior || 'Sin valor', propuesto: valor, motivo,
      requiereAprobacion: true, ...(condicion ? { condicion } : {}) };
    if (existente) Object.assign(existente, p); else propuestas.push(p);
  };
  for (const q of preguntas) {
    const anterior = huella.preguntas?.[q.id];
    if (anterior && anterior.fingerprint !== q.fingerprint) propuestas.push({ id: q.id, propiedad: 'Vigencia', propuesto: 'Revisar por cambio de fuente',
      motivo: 'Cambió una fuente del KB frente a la última carga verificada, cualquiera que sea su autor.', requiereAprobacion: true });
  }
  for (const c of construccion) {
    const d = nodes.get(c.id);
    if (d && !cambios.has(d.id)) { d.estado = c.propuesto; poner(d, 'Estado del documento', d.estado, c.motivo); }
  }
  for (const id of cambios) {
    const d = nodes.get(id);
    if (/^(UXR|FLW)-/.test(id)) poner(d, 'Resumen vigente', 'Desactualizado', 'Cambió la fuente del documento respecto de la última carga.');
    if (['Validado', 'Aprobado'].includes(d.estado)) { d.estado = 'En revisión'; poner(d, 'Estado del documento', 'En revisión', 'La versión aprobada o validada ya no corresponde a la fuente vigente.'); }
  }
  // Itera porque una pantalla cambia el flujo y este cambia UXR, UXS y paquete.
  for (let vuelta = 0; vuelta <= nodes.size; vuelta++) {
    let cambio = false;
    for (const d of nodes.values()) {
      if (cambios.has(d.id)) continue;
      let nuevo = d.estado, razon = '';
      if (/^FLW-/.test(d.id)) {
        const hijas = [...nodes.values()].filter(s => /^SCR-/.test(s.id) && (d.screens?.includes(s.id) || s.flow === d.id));
        const completas = d.screens?.length && d.screens.every(id => nodes.has(id));
        if (completas && hijas.length && hijas.every(s => s.estado === 'Validado')) { nuevo = 'Validado'; razon = 'Todas las pantallas del flujo están Validadas; registra prueba y captura del flujo antes de aprobar.'; }
        else if (hijas.some(s => CONSTRUIDAS.has(s.estado))) { nuevo = 'En construcción'; razon = 'Al menos una pantalla del flujo está En construcción o Validado.'; }
        else if (hijas.some(s => s.estado === 'En revisión') && ['Validado', 'Aprobado'].includes(d.estado)) { nuevo = 'En revisión'; razon = 'Una pantalla dependiente volvió a revisión.'; }
      } else if (/^IB-/.test(d.id)) {
        const hijas = (d.screens || []).map(id => nodes.get(id)).filter(Boolean);
        const completas = d.screens?.length && d.screens.every(id => nodes.has(id));
        const p = propiedades(d), lienzo = p['Enlace del lienzo']?.url || /https:\/\/(?:claude\.ai|figma\.com)/.test(d.texto);
        const capturas = p.Capturas?.files?.length || /!\[|^captures:\s*\[/m.test(d.texto);
        if (completas && hijas.length && hijas.every(s => s.estado === 'Validado')) { nuevo = 'Validado'; razon = 'Las pantallas de la exploración están Validadas; conserva su evidencia.'; }
        else if (hijas.some(s => CONSTRUIDAS.has(s.estado))) { nuevo = 'En construcción'; razon = 'Una pantalla de la exploración se está construyendo.'; }
        else if (hijas.some(s => s.estado === 'En revisión') || lienzo || capturas) { nuevo = 'En revisión'; razon = 'Hay lienzo, capturas o pantallas que requieren revisión.'; }
      } else if (/^UXR-/.test(d.id)) {
        const qs = preguntas.filter(q => q.ubicaciones?.some(u => u.archivo === d.archivo) || q.id.startsWith(d.id + '-Q'));
        const flujos = [...nodes.values()].filter(f => /^FLW-/.test(f.id) && f.requirements?.includes(d.id));
        if (qs.length && qs.every(q => CERRADAS.has(q.estado))) {
          if (flujos.length && flujos.every(f => CONSTRUIDAS.has(f.estado))) { nuevo = 'Aprobado'; razon = 'Todas las preguntas están resueltas o fuera de alcance y los flujos están En construcción o Validado.'; }
          else { nuevo = 'En revisión'; razon = 'No quedan preguntas Abiertas, Propuesta UX ni Propuesta.'; }
        } else if (qs.some(q => !CERRADAS.has(q.estado)) && d.estado === 'Aprobado') { nuevo = 'En revisión'; razon = 'El UXR aprobado volvió a tener preguntas pendientes.'; }
      }
      if (nuevo !== d.estado) { d.estado = nuevo; cambio = true; poner(d, 'Estado del documento', nuevo, razon,
        nuevo === 'Aprobado' ? 'Enzo debe aprobar el cierre y registrar approved_by; primero guarda el cambio aprobado en el KB.' : 'Primero registra el cambio aprobado y su evidencia en el KB.'); }
    }
    if (!cambio) break;
    if (vuelta === nodes.size) avisos.push('La cascada no alcanzó un punto fijo; revisar dependencias contradictorias.');
  }
  for (const d of nodes.values()) if (/^(UXS|DSP)-/.test(d.id)) {
    const deps = [...nodes.values()].filter(n => /^(UXR|FLW|SCR|IB)-/.test(n.id) && (d.referencias?.includes(n.id) || n.paquetes?.includes(d.id) || (d.paquetes || []).some(pk => n.paquetes?.includes(pk))));
    const qs = preguntas.filter(q => deps.some(n => q.ubicaciones?.some(u => u.archivo === n.archivo) || q.id.startsWith(n.id + '-Q')));
    const pantallas = deps.filter(n => /^SCR-/.test(n.id));
    const sinPendientes = qs.every(q => CERRADAS.has(q.estado));
    const uxrs = deps.filter(n => /^UXR-/.test(n.id));
    const revisionHumana = uxrs.length && uxrs.every(n => n.estado === 'Aprobado' && n.approvedBy && /enzo/i.test(n.approvedBy));
    const exploraciones = deps.filter(n => /^IB-/.test(n.id));
    const sinBloqueoDiseno = !qs.some(q => q.estado === 'Abierta' && /diseño|desarrollo|sí|flujo|pantalla/i.test(q.bloquea || ''));
    const fuentesVigentes = !cambios.has(d.id) && deps.every(n => !cambios.has(n.id));
    const documentosAprobados = deps.every(n => ['Aprobado', 'Validado'].includes(n.estado));
    const cierreDiseno = fuentesVigentes && pantallas.length && sinBloqueoDiseno && revisionHumana && documentosAprobados && exploraciones.every(n => ['Validado', 'Aprobado'].includes(n.estado));
    const validado = cierreDiseno && sinPendientes && pantallas.every(n => n.estado === 'Validado');
    const nivel = validado ? 'Listo para desarrollo' : cierreDiseno ? 'Diseño cerrado' : 'En curso';
    if (/^UXS-/.test(d.id)) poner(d, 'Nivel de cierre', nivel, 'Recalculado desde preguntas, aprobación humana, flujos, pantallas y exploraciones; una aprobación propuesta aún no es aprobada.');
    else {
      const actual = propiedades(d)['Estado del alcance']?.select?.name || 'Borrador';
      let target = validado ? 'Cerrado' : cierreDiseno ? 'Listo para selección de sprint' : pantallas.some(n => CONSTRUIDAS.has(n.estado)) ? 'En sprint' : deps.length ? 'En preparación' : 'Borrador';
      // El alcance lo planifica el gestor de proyectos (sprint en GitLab), no este cálculo:
      // la cascada nunca hace retroceder un paquete y la entrada a sprint o el cierre solo se proponen.
      const ORDEN_ALCANCE = ['Borrador', 'En preparación', 'Listo para selección de sprint', 'En sprint', 'Cerrado'];
      if (ORDEN_ALCANCE.indexOf(target) < ORDEN_ALCANCE.indexOf(actual)) {
        avisos.push(`${d.id}: el cálculo daría «${target}», pero el paquete está en «${actual}»; no se propone retroceso porque el alcance lo decide la planificación.`);
      } else {
        const delGestor = ['En sprint', 'Cerrado'].includes(target);
        poner(d, 'Estado del alcance', target, delGestor
          ? 'Propuesta derivada del avance del diseño; la confirma el gestor de proyectos con el sprint de GitLab.'
          : 'Propuesta de estado de alcance derivada de la preparación y construcción del paquete.');
      }
    }
  }
  if (sinHuella.length) avisos.push(`${sinHuella.length} documentos sin huella verificada: la invalidación descendente tiene cobertura incompleta.`);
  return { propuestas, avisos, sinHuella, estadosCalculados: Object.fromEntries([...nodes].map(([id, d]) => [id, d.estado])) };
}
module.exports = { cascada };
