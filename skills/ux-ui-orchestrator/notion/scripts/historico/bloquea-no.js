// Ajuste según DEC-004 §7 (criterio de Enzo, 2026-10-13): estas preguntas NO bloquean avanzar con el diseño.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const SYNC = CFG.sync;
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b";
const IDS = ["UXR-015-Q6", "UXR-017-Q3", "ARQ-10.1", "ARQ-10.1-A", "ARQ-10.1-B", "DOM-CLIENTE-01"];
const out = path.join(S, "preguntas", "bloquea-no");
fs.mkdirSync(out, { recursive: true });
const resumen = [];
for (const id of IDS) {
  const f = path.join(out, id.replace(/[^\w.-]+/g, "_") + ".json");
  fs.writeFileSync(f, JSON.stringify({ id, title: id, props: { "Bloquea": { select: { name: "No" } } } }));
  try { resumen.push(JSON.parse(execFileSync("node", [SYNC, "upsert", "--ds", DS_PREG, "--meta", f, "--solo-props"], { encoding: "utf8" }))); }
  catch (e) { resumen.push({ id, error: String(e.stderr || e.message).slice(0, 200) }); }
}
fs.writeFileSync(path.join(S, "preguntas", "bloquea-no-resumen.json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length }));
