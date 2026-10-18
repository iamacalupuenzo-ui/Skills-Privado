// Enlaza cada pregunta con UXS-001 desde el lado de la pregunta (Notion limita a 100 elementos una relación por petición).
// Uso: node uxs-preguntas.js [--lote=i/n] [--dry-run]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const SYNC = process.env.NOTION_SYNC || require("path").resolve(MOD, CFG.sync);
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b", DS_UXS = "23c1a7d0-6388-8293-bac3-871f76aac85e";
const dry = process.argv.includes("--dry-run");
const lote = (process.argv.find(a => a.startsWith("--lote=")) || "").slice(7).split("/").map(Number);
const out = path.join(S, "uxs", "preg");
fs.mkdirSync(out, { recursive: true });
const { preguntas } = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "extraccion.json"), "utf8"));
const DUPLICADAS_BORRADAS = new Set(["UXR-003-Q1", "UXR-010-Q1", "UXR-010-Q5", "UXR-012-Q1", "UXR-014-Q2", "HU-07-02-Q7"]);
let ids = preguntas.map(p => p.id).filter(id => !DUPLICADAS_BORRADAS.has(id));
if (lote.length === 2 && lote[1]) ids = ids.filter((_, i) => i % lote[1] === lote[0] - 1);
const resumen = [];
for (const id of ids) {
  const f = path.join(out, id.replace(/[^\w.-]+/g, "_") + ".json");
  fs.writeFileSync(f, JSON.stringify({ id, title: id, relations: { "Especificaciones UX": { ds: DS_UXS, ids: ["UXS-001"] } } }));
  if (dry) { resumen.push({ id, dry: true }); continue; }
  try { resumen.push(JSON.parse(execFileSync("node", [SYNC, "upsert", "--ds", DS_PREG, "--meta", f, "--solo-relaciones"], { encoding: "utf8" }))); }
  catch (e) { resumen.push({ id, error: String(e.stderr || e.message).slice(0, 200) }); }
}
fs.writeFileSync(path.join(S, "uxs", "preg-resumen" + (lote.length === 2 ? "-" + lote[0] : "") + ".json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length, sinResolver: resumen.filter(r => r.sinResolver && r.sinResolver.length).length, dry }));
