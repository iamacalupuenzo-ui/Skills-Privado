// Crea lote-doc-cr.js y lote-diseno-cr.js (Captura y Recupero, DSP-003) a partir de las variantes -iph.
// Cambios: historias HU-SVR-NN-NN y pantallas de un solo archivo (sin «## SCR-nnn»).
// Uso: node crear-variante-cr.cjs   (no toca los originales)
const fs = require('fs'), path = require('path');

function variante(origen, destino, cambios) {
  let t = fs.readFileSync(path.join(__dirname, origen), 'utf8');
  for (const [a, b] of cambios) {
    if (!t.includes(a)) throw new Error(origen + ': no encuentro: ' + a);
    t = t.replace(a, () => b);
  }
  fs.writeFileSync(path.join(__dirname, destino), t);
  console.log(destino + ' creado');
}

variante('lote-doc-iph.js', 'lote-doc-cr.js', [
  ['matchAll(/^\\|\\s*\\[(HU-(?:IPH-)?\\d{2}(?:-\\d{2})?)\\]/gm)', 'matchAll(/^\\|\\s*\\[(HU-(?:SVR-\\d{2}-\\d{2}|IPH-\\d{2}|\\d{2}(?:-\\d{2})?))\\]/gm)'],
  ['/^HU-(?:IPH-\\d{2}|\\d{2}-\\d{2})$/.test(s)', '/^HU-(?:SVR-\\d{2}-\\d{2}|IPH-\\d{2}|\\d{2}-\\d{2})$/.test(s)'],
]);

variante('lote-diseno-iph.js', 'lote-diseno-cr.js', [
  // Pantallas de un solo archivo: el cuerpo entero es la fila (no hay secciones «## SCR-nnn»).
  ['const bloque = bloques.find(b => b.enc.startsWith("## " + id + " "));\n        if (!bloque) { docs.push({ id, error: "sin sección ## " + id + " en " + f }); continue; }',
   'const bloque = bloques.find(b => b.enc.startsWith("## " + id + " "));\n        if (!bloque) {\n          const h1 = cuerpo.split("\\n").find(l => /^# SCR-/.test(l));\n          if (pantallas.length === 1 && h1) {\n            docs.push({ id, title: h1.replace(/^#\\s*/, ""), repoPath, cuerpo: cuerpo.trim(),\n              relations: { "Flujo": { ds: DS.flw, ids: [flow] } },\n              props: { "Estados requeridos": { rich_text: [{ type: "text", text: { content: estados.split(",").map(s => s.trim()).join(", ") } }] } } });\n            continue;\n          }\n          docs.push({ id, error: "sin sección ## " + id + " en " + f }); continue;\n        }'],
]);
