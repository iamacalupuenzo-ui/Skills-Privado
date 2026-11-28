// Prepara respuestas desde Open questions y enlaza sus DEC; no deduce cierres de DEC históricos.
const fs = require('node:fs');
const path = require('node:path');
const { opciones, configuracion, snapshot, validarDelegacion } = require('./kb-preguntas.js');
const s = snapshot(configuracion(opciones())), R = {};
for (const q of s.preguntas.filter(q => q.respuesta)) {
  validarDelegacion(q);
  R[q.id] = [{ fuente: q.decision || q.decisiones.join(', ') || 'Open questions', archivo: q.archivo,
    fecha: q.fecha, texto: q.respuesta, confirma: q.estado === 'Propuesta UX' ? 'Enzo' : q.responsable,
    estado: q.estado, decididoPor: q.decididoPor, evidencia: q.fuentes, impacto: q.impacto, vigente: true }];
}
const salida = path.join(process.env.NOTION_TRABAJO || path.resolve(__dirname, '../trabajo'), 'preguntas');
fs.mkdirSync(salida, { recursive: true });
fs.writeFileSync(path.join(salida, 'respuestas.json'), JSON.stringify({ R, ref: s.ref, commit: s.commit }, null, 2));
console.log(JSON.stringify({ preguntasConRespuesta: Object.keys(R).length, sinRespuestaRegistrada: s.preguntas.length - Object.keys(R).length }));
