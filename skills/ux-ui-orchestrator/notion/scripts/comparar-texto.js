// Compara el texto plano de un cuerpo preparado con el markdown que devuelve Notion.
// Uso: node comparar-texto.js <cuerpo.md> <notion.md>
const fs = require("fs");
const norm = s => s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, " ").replace(/[|*`\\]/g, " ").replace(/\s+/g, " ").trim();
const src = fs.readFileSync(process.argv[2 - 1 + 1], "utf8").split("\n");
const notion = norm(fs.readFileSync(process.argv[3], "utf8"));
let falta = 0;
src.forEach((l, i) => {
  const trozos = /^\|/.test(l) ? l.split("|").map(norm).filter(x => x.length >= 20) : [norm(l)].filter(x => x.length >= 25);
  for (const t of trozos) {
    if (!notion.includes(t)) { falta++; if (falta <= 8) console.log("L" + (i + 1), "NO está en Notion:", t.slice(0, 140)); }
  }
});
console.log("trozos no encontrados:", falta);
