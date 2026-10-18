// Sube a Preguntas las respuestas ya registradas en DEC-001…005 (preguntas/respuestas.json): propiedades + sección «Respuestas registradas».
// Uso: node subir-respuestas.js [--dry-run] [--lote=i/n] [--only=ID,ID]
// Reglas: Respuesta solo si estaba vacía; Estado pasa a «Propuesta» solo si estaba vacío o en «Abierta»; nada se marca Decidida.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = CFG.sync;
const REPO_URL = CFG.repo_url;
const DESIGN_REF = process.env.DESIGN_REF || CFG.design_ref;
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b";
const hoy = new Date().toISOString().slice(0, 10);
const dry = process.argv.includes("--dry-run");
const lote = (process.argv.find(a => a.startsWith("--lote=")) || "").slice(7).split("/").map(Number);
const only = (process.argv.find(a => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const out = path.join(S, "preguntas", "resp");
fs.mkdirSync(out, { recursive: true });

const { R } = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "respuestas.json"), "utf8"));
const PAGE = {};
for (const i of [1, 2, 3, 4]) for (const x of JSON.parse(fs.readFileSync(path.join(S, "preguntas", "resumen-" + i + ".json"), "utf8"))) if (x.page) PAGE[x.id] = x.page;

const esC = a => /§C/.test(a.fuente);
const orden = (a, b) => (b.vigente ? 1 : 0) - (a.vigente ? 1 : 0) || (esC(a) ? 1 : 0) - (esC(b) ? 1 : 0) || b.fecha.localeCompare(a.fecha) || (/DEC-001/.test(b.fuente) ? 1 : 0) - (/DEC-001/.test(a.fuente) ? 1 : 0);
const trozos = (s, n) => { const r = []; for (let i = 0; i < s.length; i += n) r.push(s.slice(i, i + n)); return r.length ? r : [""]; };
const rt = s => ({ rich_text: trozos(s, 1900).slice(0, 1).map(c => ({ type: "text", text: { content: c } })) });

let ids = Object.keys(R).filter(id => PAGE[id]);
if (only.length) ids = ids.filter(id => only.includes(id));
if (lote.length === 2 && lote[1]) ids = ids.filter((_, i) => i % lote[1] === lote[0] - 1);
const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8", env: Object.assign({}, process.env, { DESIGN_REF }) });
const resumen = [];
for (const id of ids) {
  const resp = [...R[id]].sort(orden), v = resp[0], f = id.replace(/[^\w.-]+/g, "_");
  const delegada = esC(v);
  const texto = "[" + v.fuente + " · " + v.fecha + "] " + v.texto;
  const respuesta = texto.length > 1900 ? texto.slice(0, 1880).replace(/\s+\S*$/, "") + "… (texto completo en el cuerpo de la página)" : texto;
  const decidido = delegada ? "Recomendación (IA), delegada por Enzo Macalupu; pendiente de validar" : "Enzo Macalupu (diseño); pendiente del PO";
  const meta = {
    id, title: id,
    props: {
      "Respuesta": rt(respuesta), "Decidido por": rt(decidido), "Fecha de decisión": { date: { start: v.fecha } },
      "Estado": { select: { name: "Propuesta" } },
    },
    ifEmpty: ["Respuesta", "Decidido por", "Fecha de decisión"], ifValues: { "Estado": ["Abierta"] },
  };
  // Sección «Respuestas registradas»: la vigente primero, luego el historial (más reciente a más antigua)
  const L = ["", "## Respuestas registradas", "", "Respuestas de Enzo Macalupu y recomendaciones registradas en el repo. **Todas están pendientes de confirmación del responsable indicado**; ninguna es regla de negocio. La primera es la que se usa como «Respuesta».", ""];
  resp.forEach((a, i) => {
    L.push("### " + (i === 0 ? "Vigente · " : "") + a.fuente + " — " + a.fecha, "", a.texto, "");
    if (a.confirma) L.push("**Quién debe confirmar:** " + a.confirma, "");
    L.push("Fuente: [`" + a.archivo.replace(/^design\//, "") + "`](" + REPO_URL + DESIGN_REF + "/" + a.archivo + ")", "");
  });
  const base = path.join(S, "preguntas", "lote", f), origen = base + "-origen.md", nuevo = path.join(out, f + "-origen2.md"), cuerpo2 = path.join(out, f + "-cuerpo2.md"), mF = path.join(out, f + "-resp.json");
  fs.writeFileSync(mF, JSON.stringify(meta, null, 1));
  const repoPath = (R[id][0].archivo || "design/consultas/CPO-001-consultas-al-product-owner-dsp-001.md");
  fs.writeFileSync(nuevo, fs.readFileSync(origen, "utf8").replace(/\s+$/, "") + "\n" + L.join("\n"));
  const rec = { id, vigente: v.fuente, fecha: v.fecha, respuestas: resp.length, delegada };
  if (dry) { resumen.push(rec); continue; }
  try {
    const p = JSON.parse(run(SYNC, ["upsert", "--ds", DS_PREG, "--meta", mF, "--solo-props"]));
    run(path.join(MOD, "scripts", "prepare-body.js"), [repoPath, nuevo, cuerpo2, WT, id]);
    // el cuerpo conserva su ruta de fuente original
    const fuenteCuerpo = (preguntasFuente(id));
    run(SYNC, ["push", "--page", PAGE[id], "--body", cuerpo2, "--source", fuenteCuerpo, "--loaded", hoy]);
    resumen.push(Object.assign(rec, { ok: true, props: p.soloProps, omitidas: p.omitidas }));
  } catch (e) { resumen.push(Object.assign(rec, { error: String(e.stderr || e.message).slice(0, 220) })); }
}
function preguntasFuente(id) {
  const m = path.join(S, "preguntas", "lote", id.replace(/[^\w.-]+/g, "_") + "-meta.json");
  try { return JSON.parse(fs.readFileSync(m, "utf8")).props["Ruta en el repo"].rich_text[0].text.content; } catch (e) { return ""; }
}
fs.writeFileSync(path.join(S, "preguntas", "resp-resumen" + (lote.length === 2 ? "-" + lote[0] : "") + (dry ? "-dry" : "") + ".json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length, dry }));
