// Corrige marcar-duplicadas.js: estas 7 preguntas son la misma pregunta en otro login o se deciden juntas, pero no son copias. Se desmarcan.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const SYNC = process.env.NOTION_SYNC || require("path").resolve(MOD, CFG.sync);
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b";
const IDS = ["UXR-016-Q6", "UXR-020-Q4", "UXR-020-Q1", "UXR-022-Q1", "UXR-008-Q5", "UXR-010-Q7", "UXR-020-Q6"];
const out = path.join(S, "preguntas", "duplicadas");
const resumen = [];
for (const id of IDS) {
  const f = path.join(out, id + "-desmarcar.json");
  fs.writeFileSync(f, JSON.stringify({ id, title: id, props: { "Duplicada": { checkbox: false } } }));
  try { resumen.push(JSON.parse(execFileSync("node", [SYNC, "upsert", "--ds", DS_PREG, "--meta", f, "--solo-props"], { encoding: "utf8" }))); }
  catch (e) { resumen.push({ id, error: String(e.stderr || e.message).slice(0, 200) }); }
}
fs.writeFileSync(path.join(S, "preguntas", "desmarcar-resumen.json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length }));
