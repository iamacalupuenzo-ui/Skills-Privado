// Extrae Open questions desde la rama configurada, sin cambiar el KB ni Notion.
const fs = require('node:fs');
const path = require('node:path');
const { opciones, configuracion, snapshot } = require('./kb-preguntas.js');
const cfg = configuracion(opciones()), s = snapshot(cfg);
const salida = path.join(process.env.NOTION_TRABAJO || path.resolve(__dirname, '../trabajo'), 'preguntas');
fs.mkdirSync(salida, { recursive: true });
const preguntas = s.preguntas.map(q => ({ ...q, textos: [{ fuente: q.archivo, texto: q.pregunta }],
  fuentes: q.ubicaciones.map(u => u.archivo), evidencia: q.fuentes, alias: [], notas: [], uxrDueno: q.id.match(/^UXR-\d+/)?.[0] || '' }));
fs.writeFileSync(path.join(salida, 'extraccion.json'), JSON.stringify({ ...s, preguntas, E: [] }, null, 2));
console.log(JSON.stringify({ total: preguntas.length, ref: s.ref, commit: s.commit, contradicciones: s.incidencias.length }));
