// Carga en Notion las fichas de contexto validadas (preguntas/ctx/fichas.json): título «ID · pregunta», «Quién puede responder» y el cuerpo con la estructura acordada.
// Uso: node contexto-lote.js [--dry-run] [--lote=i/n] [--only=ID,ID]. No toca Estado, Bloquea ni Prioridad. Conserva el texto original del repo debajo.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = process.env.NOTION_SYNC || require("path").resolve(MOD, CFG.sync);
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b";
const DESIGN_REF = process.env.DESIGN_REF || CFG.design_ref;
const hoy = new Date().toISOString().slice(0, 10);
const dry = process.argv.includes("--dry-run");
const lote = (process.argv.find(a => a.startsWith("--lote=")) || "").slice(7).split("/").map(Number);
const only = (process.argv.find(a => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const out = path.join(S, "preguntas", "ctx", "carga");
fs.mkdirSync(out, { recursive: true });

const fichas = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "ctx", "fichas.json"), "utf8"));
const PAGE = {};
for (const i of [1, 2, 3, 4]) for (const x of JSON.parse(fs.readFileSync(path.join(S, "preguntas", "resumen-" + i + ".json"), "utf8"))) if (x.page) PAGE[x.id] = x.page;
const AVISO = "> Título, contexto, alternativas y propuesta elaborados con apoyo de IA a partir del texto del repo y de las reglas que cita. El texto original se conserva más abajo. Por validar por Enzo Macalupu.";
const una = s => String(s || "").replace(/\s+/g, " ").trim();

function cuerpo(x) {
  const L = [AVISO, "", "## Contexto de la necesidad", una(x.contexto), "", "## Qué se evalúa", una(x.evalua), ""];
  const hayIA = x.alternativas.some(a => a.origen === "IA");
  L.push(hayIA ? "## Alternativas posibles (las marcadas IA son propuestas de la IA)" : "## Alternativas posibles");
  for (const a of x.alternativas) L.push("- **" + a.clave + ".** " + una(a.texto) + (a.origen === "IA" ? " (IA)" : "") + " — *Efecto:* " + una(a.efecto));
  L.push("");
  if (x.cerrada) L.push("## Decisión relacionada en el repo (puede cerrar solo una parte)", una(x.cerrada.por) + ": " + una(x.cerrada.texto), "");
  L.push("## Propuesta o resolución");
  const r = x.recomendacion;
  if (r) {
    L.push("**Respuesta (IA): " + una(r.respuesta) + " (alternativa " + una(r.opcion) + ").** " + una(r.porque), "");
    L.push("**Cómo funcionaría**", "");
    r.como.forEach((p, i) => L.push((i + 1) + ". " + una(p)));
    L.push("");
    if (r.diagrama && r.diagrama.trim()) L.push("```mermaid", r.diagrama.trim().replace(/\r/g, ""), "```", "");
    if (r.evidencia && r.evidencia.length) {
      L.push("**Evidencia**", "");
      for (const e of r.evidencia) L.push("- " + una(e.fuente) + ": " + una(e.dato) + " (grado " + una(e.grado) + ")");
      L.push("");
    }
    L.push("**Límites:** " + una(r.limites));
  } else {
    const quien = x.quien === "Diseño" ? "una persona del equipo" : x.quien === "Negocio" ? "el Product Owner (o Legal)" : x.quien === "Mixta" ? "el Product Owner y el equipo de diseño" : "Arquitectura o Seguridad";
    L.push("Sin propuesta de diseño: la decide " + quien + ". El efecto de cada alternativa en el diseño está descrito arriba.");
  }
  return L;
}

let ids = Object.keys(fichas);
if (only.length) ids = ids.filter(id => only.includes(id));
if (lote.length === 2 && lote[1]) ids = ids.filter((_, i) => i % lote[1] === lote[0] - 1);
const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8", env: Object.assign({}, process.env, { DESIGN_REF }) });
const resumen = [];
for (const id of ids) {
  const x = fichas[id], f = id.replace(/[^\w.-]+/g, "_");
  if (!PAGE[id]) { resumen.push({ id, error: "sin página" }); continue; }
  const baseF = [path.join(S, "preguntas", "resp", f + "-origen2.md"), path.join(S, "preguntas", "lote", f + "-origen.md")].find(p => fs.existsSync(p));
  const base = fs.readFileSync(baseF, "utf8").replace("## Pregunta\n", "## Texto original del repo\n");
  const nombre = id + " · " + una(x.titulo);
  const mP = path.join(out, f + "-props.json");
  fs.writeFileSync(mP, JSON.stringify({ id, title: nombre, props: { "Nombre": { title: [{ type: "text", text: { content: nombre } }] }, "Quién puede responder": { select: { name: x.quien } } } }, null, 1));
  const nuevo = path.join(out, f + "-origen2.md"), cuerpo2 = path.join(out, f + "-cuerpo2.md");
  fs.writeFileSync(nuevo, [...cuerpo(x), "", "---", "", base].join("\n"));
  const rec = { id, nombre, quien: x.quien, recomendacion: !!x.recomendacion, diagrama: !!(x.recomendacion && x.recomendacion.diagrama) };
  if (dry) { resumen.push(rec); continue; }
  try {
    const p = JSON.parse(run(SYNC, ["upsert", "--ds", DS_PREG, "--meta", mP, "--solo-props"]));
    const repoPath = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "lote", f + "-meta.json"), "utf8")).props["Ruta en el repo"].rich_text[0].text.content;
    run(path.join(MOD, "scripts", "prepare-body.js"), [repoPath, nuevo, cuerpo2, WT, id]);
    run(SYNC, ["push", "--page", PAGE[id], "--body", cuerpo2, "--source", repoPath, "--loaded", hoy]);
    resumen.push(Object.assign(rec, { ok: true, props: p.soloProps }));
  } catch (e) { resumen.push(Object.assign(rec, { error: String(e.stderr || e.message).slice(0, 220) })); }
}
fs.writeFileSync(path.join(S, "preguntas", "ctx-carga" + (lote.length === 2 ? "-" + lote[0] : "") + (dry ? "-dry" : "") + ".json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length, dry }));
