// Crea lote-doc-iph.js a partir de lote-doc.js: producto por variable de entorno y historias HU-IPH-NN.
// Uso: node crear-variante-iph.cjs   (no toca lote-doc.js)
const fs = require('fs'), path = require('path');
let t = fs.readFileSync(path.join(__dirname, 'lote-doc.js'), 'utf8');
const cambios = [
  ['const PRODUCTO = "3fb1a7d0-6388-814e-8cce-f48a414b5cf2"; // Piloto de CL2 Flotas',
   'const PRODUCTO = process.env.NOTION_PRODUCTO || "3fb1a7d0-6388-814e-8cce-f48a414b5cf2"; // Piloto de CL2 Flotas por defecto'],
  ['matchAll(/^\\|\\s*\\[(HU-\\d{2}-\\d{2})\\]/gm)', 'matchAll(/^\\|\\s*\\[(HU-(?:IPH-)?\\d{2}(?:-\\d{2})?)\\]/gm)'],
  ['/^HU-\\d{2}-\\d{2}$/.test(s)', '/^HU-(?:IPH-\\d{2}|\\d{2}-\\d{2})$/.test(s)'],
];
for (const [a, b] of cambios) {
  if (!t.includes(a)) throw new Error('No encuentro: ' + a);
  t = t.replace(a, () => b);
}
fs.writeFileSync(path.join(__dirname, 'lote-doc-iph.js'), t);
console.log('lote-doc-iph.js creado');
