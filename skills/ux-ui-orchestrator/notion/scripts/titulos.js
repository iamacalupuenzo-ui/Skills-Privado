// Genera el nombre «ID · pregunta corta» de cada fila de Preguntas. Uso: node titulos.js [--dry-run] [--lote=i/n]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const SYNC = CFG.sync;
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b";
const dry = process.argv.includes("--dry-run");
const lote = (process.argv.find(a => a.startsWith("--lote=")) || "").slice(7).split("/").map(Number);
const out = path.join(S, "preguntas", "titulos");
fs.mkdirSync(out, { recursive: true });
const { preguntas } = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "extraccion.json"), "utf8"));

const limpia = s => String(s || "").replace(/\*\*/g, "").replace(/\*\(/g, "(").replace(/\)\*/g, ")").replace(/`/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();
const ENCABEZADOS = /^(NUEVA|Nueva|Reformulada|Reabierta|Parcialmente respondida|Respondida[^.:]*|Abierta|Cerrada|Pregunta can[oó]nica|Correcci[oó]n documental|Ampliaci[oó]n propuesta por Enzo Macalupu)[^.:]{0,90}?[.:]\s+/;
function corto(r) {
  let t = limpia((r.textos[0] && r.textos[0].texto) || (r.dud2 && r.dud2.pregunta) || (r.cpo && (r.cpo.titulo || r.cpo.aclarar)) || "");
  for (let i = 0; i < 3 && ENCABEZADOS.test(t); i++) t = t.replace(ENCABEZADOS, "");
  const q = t.match(/¿[^?¿]{8,170}\?/);
  let s = q ? q[0] : t.split(/(?<=[.!])\s/)[0];
  s = s.replace(/^\((?:ej\.?,? )?/, "…(");
  if (s.length > 110) s = s.slice(0, 107).replace(/\s+\S*$/, "") + "…";
  return s;
}
const SALTADAS = new Set(["HU-07-02-Q7"]);
let ids = preguntas.map(p => p.id).filter(id => !SALTADAS.has(id));
if (lote.length === 2 && lote[1]) ids = ids.filter((_, i) => i % lote[1] === lote[0] - 1);
const run = args => execFileSync("node", [SYNC, ...args], { encoding: "utf8" });
const resumen = [];
for (const id of ids) {
  const r = preguntas.find(p => p.id === id), nombre = id + " · " + corto(r);
  if (dry) { resumen.push({ id, nombre }); continue; }
  const f = path.join(out, id.replace(/[^\w.-]+/g, "_") + ".json");
  fs.writeFileSync(f, JSON.stringify({ id, title: nombre, props: { "Nombre": { title: [{ type: "text", text: { content: nombre } }] } } }));
  try { resumen.push(Object.assign({ nombre }, JSON.parse(run(["upsert", "--ds", DS_PREG, "--meta", f, "--solo-props"])))); }
  catch (e) { resumen.push({ id, error: String(e.stderr || e.message).slice(0, 200) }); }
}
fs.writeFileSync(path.join(S, "preguntas", "titulos" + (lote.length === 2 ? "-" + lote[0] : "") + (dry ? "-dry" : "") + ".json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length, dry }));
