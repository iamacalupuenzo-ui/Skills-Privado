// Localiza las líneas donde Notion tiene menos enlaces que el cuerpo preparado.
// Uso: node comparar-enlaces.js <cuerpo.md> <notion.md>
const fs = require("fs");
const cuenta = s => (s.match(/\]\(https?:[^)\s]+\)/g) || []).length;
const plano = s => s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, " ").replace(/[|*`\\]/g, " ").replace(/\s+/g, " ").trim();
const src = fs.readFileSync(process.argv[2], "utf8").split("\n");
const nt = fs.readFileSync(process.argv[3], "utf8").split("\n");
const notionLinea = nt.map(l => ({ p: plano(l), n: cuenta(l) }));
let diffs = 0, totalSrc = 0, totalMatch = 0;
src.forEach((l, i) => {
  const c = cuenta(l);
  if (!c) return;
  totalSrc += c;
  const trozos = /^\|/.test(l) ? l.split("|") : [l];
  let enNotion = 0;
  for (const t of trozos) {
    const cs = cuenta(t); if (!cs) continue;
    const p = plano(t); if (p.length < 8) continue;
    const m = notionLinea.find(x => x.p.includes(p.slice(0, 40)));
    if (m) { enNotion += Math.min(m.n, cs); if (m.n < cs) { diffs++; console.log("L" + (i + 1), "fuente", cs, "Notion", m.n, "|", p.slice(0, 80)); } }
    else console.log("L" + (i + 1), "sin línea equivalente en Notion |", p.slice(0, 80));
  }
});
console.log("enlaces fuente:", totalSrc, "| líneas con menos enlaces en Notion:", diffs);
