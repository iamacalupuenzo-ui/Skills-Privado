// Segunda y tercera pasada de Preguntas: (1) vínculos exactos a Flujos y Pantallas a partir de las secciones de preguntas abiertas
// que declaran los propios FLW/SCR; (2) «Nivel de bloqueo» (y Bloquea solo si estaba vacío) a partir del texto de la fuente.
// Uso: node preguntas-refs.js <niveles|relaciones> [--dry-run] [--lote=i/n]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = CFG.sync;
const DS = { preg: "9811a7d0-6388-829a-82b4-0735e973e46b", flw: "3a91a7d0-6388-83d7-972f-07afabf710e0", scr: "a101a7d0-6388-8200-ace3-0747fc33b0fb" };
const fase = process.argv[2];
if (!["niveles", "relaciones", "estados"].includes(fase)) { console.error("fase: niveles | relaciones | estados"); process.exit(2); }
const dry = process.argv.includes("--dry-run");
const lote = (process.argv.find(a => a.startsWith("--lote=")) || "").slice(7).split("/").map(Number);
const out = path.join(S, "preguntas", "refs");
fs.mkdirSync(out, { recursive: true });

const { preguntas } = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "extraccion.json"), "utf8"));
const SALTADAS = { "HU-07-02-Q7": "UXR-001-Q2" };
const filas = new Set(preguntas.map(p => p.id).filter(id => !SALTADAS[id]));
const leer = f => fs.readFileSync(path.join(WT, f), "utf8").replace(/\r\n/g, "\n");
const norm = s => String(s || "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

// ---- IDs de pregunta citados en un texto (expande «UXR-015-Q1/Q2/Q3») ----
function idsEn(texto) {
  const res = new Set();
  for (const m of texto.matchAll(/((?:UXR-\d{3}|HU-\d{2}-\d{2})-Q)(\d+)((?:\s*\/\s*Q?\d+)*)/g)) {
    res.add(m[1] + m[2]);
    for (const n of m[3].matchAll(/(\d+)/g)) res.add(m[1] + n[1]);
  }
  for (const m of texto.matchAll(/\bARQ-\d+(?:\.\d+)?(?:-[AB])?\b/g)) res.add(m[0]);
  for (const k of ["DOM-CLIENTE-01", "ID-ALTA-01"]) if (texto.includes(k)) res.add(k);
  if (/\bD-03\b|\bP-34\b/.test(texto)) res.add("D-03 / P-34");
  return [...res].map(id => SALTADAS[id] || id).filter(id => filas.has(id));
}
// ---- texto de las secciones (## ...) cuyo encabezado cumple re ----
function secciones(txt, re) {
  const lineas = txt.split("\n"), r = []; let dentro = false;
  for (const l of lineas) {
    if (/^#{1,3} /.test(l)) dentro = re.test(l);
    if (dentro) r.push(l);
  }
  return r.join("\n");
}

// Flujos: secciones de preguntas abiertas / pendientes que declara cada FLW
const FLW_PREG = {}; // idPregunta -> [FLW]
for (const f of fs.readdirSync(path.join(WT, "design/user-flows")).filter(x => /^FLW-\d+.*\.md$/.test(x)).sort()) {
  const id = f.match(/^(FLW-\d+)/)[1], txt = leer("design/user-flows/" + f);
  const sec = secciones(txt, /preguntas abiertas|supuestos, propuestas y decisiones pendientes|ramas pendientes|pendientes/i);
  for (const q of idsEn(sec)) (FLW_PREG[q] = FLW_PREG[q] || new Set()).add(id);
}
// Pantallas: «Decisiones abiertas» de cada archivo SCR -> todas las pantallas que declara su frontmatter
const SCR_PREG = {};
for (const f of fs.readdirSync(path.join(WT, "design/screens")).filter(x => /^SCR-\d+.*\.md$/.test(x)).sort()) {
  const txt = leer("design/screens/" + f), fm = (txt.match(/^---\n([\s\S]*?)\n---\n/) || [])[1] || "";
  const pantallas = [...fm.matchAll(/^  - id: (SCR-\d+)/gm)].map(m => m[1]);
  const sec = secciones(txt, /^## Decisiones abiertas/i);
  for (const q of idsEn(sec)) (SCR_PREG[q] = SCR_PREG[q] || new Set([])), pantallas.forEach(p => SCR_PREG[q].add(p));
}

// ---- Nivel de bloqueo ----
function nivel(r) {
  const uxr = norm(r.bloquea), cpo = norm(r.cpo && r.cpo.bloquea);
  if (/^No\b/.test(uxr)) return { n: null, conflicto: /FLW|SCR|flujo|pantalla/i.test(cpo) ? "UXR dice «No», CPO-001 dice «" + cpo.slice(0, 50) + "»" : null };
  const t = (uxr + " | " + cpo).toLowerCase();
  if (/\bflw\b|flujo/.test(t)) return { n: "Flujo" };
  if (/\bscr\b|pantalla|campo|aviso|mensaje|texto|componente|validaci[oó]n|estado de error|dise[nñ]o/.test(t)) return { n: "Pantalla" };
  if (/entrega|implement|desarrollo/.test(t)) return { n: "Entrega" };
  if (/documental/.test(t)) return { n: "Documental" };
  return { n: null };
}

let ids = [...filas];
if (lote.length === 2 && lote[1]) ids = ids.filter((_, i) => i % lote[1] === lote[0] - 1);
const run = (args) => execFileSync("node", [SYNC, ...args], { encoding: "utf8" });
const resumen = [];
for (const id of ids) {
  const r = preguntas.find(p => p.id === id), f = id.replace(/[^\w.-]+/g, "_");
  if (fase === "estados") {
    // Estado «Abierta» solo para las preguntas sin ninguna señal de cierre en su texto; si ya tienen estado, no se toca (ifEmpty).
    const t = [r.textos.map(x => x.texto).join(" "), r.estadoTexto, r.bloquea, r.dud2 ? r.dud2.respuesta : ""].join(" ").replace(/\*\*/g, "");
    const e = norm(r.estadoTexto);
    const señal = /^(Abierta|Respondida|Cerrada|Resuelta)/i.test(e) || /cerrada\s*(\d{4}|\()|resuelta\b|\bresuelto\b/i.test(t) || /sustituida|reformulada|consolidada|absorbe|DEC-00[0-9]/i.test(t);
    if (señal) { resumen.push({ id, sinCambio: true, motivo: "con señal en el texto" }); continue; }
    const mF = path.join(out, f + "-estado.json"); fs.writeFileSync(mF, JSON.stringify({ id, title: id, props: { "Estado": { select: { name: "Abierta" } } }, ifEmpty: ["Estado"] }, null, 1));
    if (dry) { resumen.push({ id, estado: "Abierta" }); continue; }
    try { resumen.push(JSON.parse(run(["upsert", "--ds", DS.preg, "--meta", mF, "--solo-props"]))); } catch (er) { resumen.push({ id, error: String(er.stderr || er.message).slice(0, 200) }); }
    continue;
  }
  if (fase === "niveles") {
    const nv = nivel(r), bloqueaVacio = !norm(r.bloquea) || /^(—|-)$/.test(norm(r.bloquea));
    const props = {}, ifEmpty = [];
    if (nv.n) props["Nivel de bloqueo"] = { select: { name: nv.n } };
    if (nv.n === "Flujo" || nv.n === "Pantalla") { props["Bloquea"] = { select: { name: "Diseño" } }; ifEmpty.push("Bloquea"); }
    if (nv.n === "Entrega") { props["Bloquea"] = { select: { name: "Desarrollo" } }; ifEmpty.push("Bloquea"); }
    const rec = { id, nivel: nv.n, conflicto: nv.conflicto || null };
    if (!Object.keys(props).length) { resumen.push(Object.assign(rec, { sinCambio: true })); continue; }
    const mF = path.join(out, f + "-nivel.json"); fs.writeFileSync(mF, JSON.stringify({ id, title: id, props, ifEmpty }, null, 1));
    if (dry) { resumen.push(rec); continue; }
    try { resumen.push(Object.assign(rec, JSON.parse(run(["upsert", "--ds", DS.preg, "--meta", mF, "--solo-props"])))); } catch (e) { resumen.push({ id, error: String(e.stderr || e.message).slice(0, 200) }); }
  } else {
    const flw = [...(Object.entries(FLW_PREG).find(([q]) => q === id) || [, []])[1]], scr = [...(SCR_PREG[id] || [])];
    const mF = path.join(out, f + "-rel.json");
    fs.writeFileSync(mF, JSON.stringify({ id, title: id, relations: { "Flujos": { ds: DS.flw, ids: flw }, "Pantallas": { ds: DS.scr, ids: scr } } }, null, 1));
    if (dry) { resumen.push({ id, flujos: flw, pantallas: scr }); continue; }
    try { resumen.push(JSON.parse(run(["upsert", "--ds", DS.preg, "--meta", mF, "--solo-relaciones", "--reemplazar"]))); } catch (e) { resumen.push({ id, error: String(e.stderr || e.message).slice(0, 200) }); }
  }
}
fs.writeFileSync(path.join(S, "preguntas", "refs-" + fase + (lote.length === 2 ? "-" + lote[0] : "") + (dry ? "-dry" : "") + ".json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ fase, total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length, dry }));
