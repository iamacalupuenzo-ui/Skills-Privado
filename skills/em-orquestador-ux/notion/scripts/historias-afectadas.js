// Propone comentarios al analista del DSP; nunca modifica la HU ni envía comentarios.
const TIPO_HU = 'HU afectada → comentario al analista del DSP';
function historiasAfectadas(kb, diferencias, huella) {
  const propuestas = [], vistos = new Set();
  for (const q of kb.preguntas) {
    const delta = diferencias.find(d => d.id === q.id && d.tipo === 'a');
    const cambio = huella.preguntas?.[q.id] && huella.preguntas[q.id].fingerprint !== q.fingerprint;
    if (!(delta || (cambio && (q.respuesta || q.estado === 'Decidida')))) continue;
    const duenos = kb.documentos.filter(d => q.ubicaciones?.some(u => u.archivo === d.archivo));
    const historias = [...new Set([...duenos.flatMap(d => d.historias || []),
      ...((q.pregunta + ' ' + q.respuesta + ' ' + q.impacto).match(/\bHU(?:-[A-Z]+)?-\d+-\d+\b/g) || [])])];
    const paquetes = [...new Set(duenos.flatMap(d => d.paquetes || []))];
    for (const hu of historias) {
      const clave = q.id + ':' + hu;
      if (vistos.has(clave)) continue; vistos.add(clave);
      const referencias = [...new Set((q.pregunta + ' ' + q.respuesta + ' ' + q.impacto).match(/\b(?:AC-\d+|BR-\d+|DH-\d+|ARQ-[\w.-]+)\b/g) || [])];
      const cambioTexto = delta?.notion?.respuesta || q.respuesta || q.estadoTexto;
      const destinatario = paquetes.length ? 'Analista funcional de ' + paquetes.join(', ') : 'Analista funcional del DSP de ' + hu + ' (identificar el paquete antes de enviar)';
      propuestas.push({ tipo: TIPO_HU, id: q.id, historia: hu, paquetes, destinatario,
        motivo: 'Una respuesta o decisión puede afectar la HU, que pertenece al analista funcional de su DSP.',
        propuesta: `Comentario propuesto para ${destinatario}: la pregunta ${q.id} registra este cambio: ${cambioTexto}. Revisa ${referencias.length ? referencias.join(', ') : 'los AC o reglas afectados; falta identificar su referencia exacta'} en ${hu}.`,
        condicion: delta ? 'Primero concilia e incorpora la respuesta aprobada al KB; después Enzo aprueba el comentario.' : 'Enzo aprueba el comentario; el analista decide si debe modificar la HU.',
        requiereAprobacion: true, soloPropuesta: true });
    }
  }
  return propuestas;
}
module.exports = { TIPO_HU, historiasAfectadas };
