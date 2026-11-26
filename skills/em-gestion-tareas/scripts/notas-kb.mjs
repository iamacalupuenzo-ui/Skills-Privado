#!/usr/bin/env node
// AVANCE con nota, desde el informe del paso 0: pasa los cambios de la KB al mapeo (`cambiosKb`) para que
// armar-mapeo.mjs los ponga en «Trazabilidad → Cambios de la KB» de cada tarea, y escribir-notion.mjs los suba.
// Así la nota vive en la fuente: una regeneración de la página no la borra.
//
// Uso: node notas-kb.mjs <cambios.json de cambios-kb.mjs> <mapeo.json> [--seco]
// - Solo toma lo que cambió en el propio paquete y en sus historias (`directo`), no lo que otro paquete cita.
// - Agrega una nota con las preguntas abiertas de otros responsables (PO, Arquitectura) que no bloquean.
// - No repite una nota ya registrada (misma revisión de la KB y mismo documento).
import fs from 'node:fs';

const [rutaCambios, rutaMapeo] = process.argv.slice(2);
if (!rutaCambios || !rutaMapeo) { console.error('Uso: node notas-kb.mjs <cambios.json> <mapeo.json> [--seco]'); process.exit(2); }
const SECO = process.argv.includes('--seco');
const c = JSON.parse(fs.readFileSync(rutaCambios, 'utf8'));
const mapeo = JSON.parse(fs.readFileSync(rutaMapeo, 'utf8'));
const dia = (iso) => iso.slice(0, 10);
const HU = /HU-\d+-\d+/g;

const nuevas = [];
for (const r of c.cambios.filter((x) => x.directo && ['HU', 'DSP'].includes(x.tipo))) {
  const secciones = r.secciones.filter((s) => !/^Historial/.test(s));
  if (!secciones.length) continue;
  const ult = r.commits.at(-1);
  const id = (r.ruta.split('/').pop().match(/^(HU-\d+-\d+|DSP-\d+)/) || [r.titulo])[0];
  nuevas.push({ revision: c.kb.commit, fecha: dia(ult.fecha), documento: id, ruta: r.ruta,
    historias: r.tipo === 'HU' ? [id] : [],
    texto: `cambió ${secciones.join('; ')} (${[...new Set(r.commits.map((x) => x.autor))].join(', ')}, ${[...new Set(r.commits.map((x) => dia(x.fecha)))].join(' y ')}). La tarea sigue igual; se revisa al trabajar esa sección.` });
}
const ajenas = c.preguntas.filter((p) => p.estado === 'Abierta' && !/^UXR|^FLW|^SCR/.test(p.id) && !/^s[ií]/i.test(p.bloquea || ''));
if (ajenas.length)
  nuevas.push({ revision: c.kb.commit, fecha: dia(c.kb.fecha), documento: 'Preguntas abiertas', ruta: '',
    historias: [...new Set(ajenas.flatMap((p) => (p.donde + ' ' + (p.afecta || '')).match(HU) || []))],
    texto: `${ajenas.map((p) => `${p.id} (decide ${p.responsable})`).join(', ')}: abiertas, no bloquean. Se trabaja con la propuesta y se ajusta si la respuesta cambia algo.` });

mapeo.cambiosKb = mapeo.cambiosKb || [];
const clave = (n) => n.revision + '|' + n.documento;
const agregar = nuevas.filter((n) => !mapeo.cambiosKb.some((m) => clave(m) === clave(n)));
mapeo.cambiosKb.push(...agregar);
if (!SECO) fs.writeFileSync(rutaMapeo, JSON.stringify(mapeo, null, 2));
console.log(JSON.stringify({ seco: SECO, agregadas: agregar.length, yaEstaban: nuevas.length - agregar.length, notas: agregar.map((n) => `${n.documento} → ${n.historias.join(', ') || 'todas las tareas'}: ${n.texto.slice(0, 140)}`) }, null, 1));
