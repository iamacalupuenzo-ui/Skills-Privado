// Marca como «Duplicada» las preguntas que el repo declara iguales a otra (DUD-002 «A = B» o «Equivale a» en su texto) y las enlaza a la principal.
// No borra nada. Uso: node marcar-duplicadas.js [--dry-run]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const SYNC = CFG.sync;
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b";
const dry = process.argv.includes("--dry-run");
// duplicada -> principal (el repo señala la principal: es la que las demás remiten o la primera de la igualdad)
const DUP = {
  "UXR-016-Q6": "UXR-015-Q6", "UXR-020-Q4": "UXR-017-Q1", "UXR-020-Q1": "UXR-015-Q1", "UXR-022-Q1": "UXR-016-Q1",
  "UXR-008-Q5": "UXR-006-Q5", "UXR-010-Q7": "UXR-014-Q5", "UXR-010-Q1": "UXR-011-Q1", "UXR-010-Q5": "UXR-011-Q1",
  "UXR-012-Q1": "UXR-011-Q1", "UXR-014-Q2": "UXR-011-Q3", "UXR-003-Q1": "UXR-001-Q2", "UXR-020-Q6": "UXR-015-Q3",
};
const out = path.join(S, "preguntas", "duplicadas");
fs.mkdirSync(out, { recursive: true });
const run = args => execFileSync("node", [SYNC, ...args], { encoding: "utf8" });
const resumen = [];
for (const [dup, main] of Object.entries(DUP)) {
  const f = dup.replace(/[^\w.-]+/g, "_");
  const mP = path.join(out, f + "-props.json"), mR = path.join(out, f + "-rel.json");
  fs.writeFileSync(mP, JSON.stringify({ id: dup, title: dup, props: { "Duplicada": { checkbox: true } } }));
  fs.writeFileSync(mR, JSON.stringify({ id: dup, title: dup, relations: { "Equivale a": { ds: DS_PREG, ids: [main] } } }));
  if (dry) { resumen.push({ id: dup, principal: main, dry: true }); continue; }
  try {
    const p = JSON.parse(run(["upsert", "--ds", DS_PREG, "--meta", mP, "--solo-props"]));
    const r = JSON.parse(run(["upsert", "--ds", DS_PREG, "--meta", mR, "--solo-relaciones"]));
    resumen.push({ id: dup, principal: main, ok: p.ok && r.ok, sinResolver: r.sinResolver });
  } catch (e) { resumen.push({ id: dup, error: String(e.stderr || e.message).slice(0, 200) }); }
}
fs.writeFileSync(path.join(S, "preguntas", "duplicadas-resumen.json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length, dry }));
