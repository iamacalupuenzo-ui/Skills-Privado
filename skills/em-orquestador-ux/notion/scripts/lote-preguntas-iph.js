// Carga en la base Preguntas las preguntas de los UXR de Restricción por IP (tablas «# Open questions»).
// Uso: node lote-preguntas-iph.js [--dry-run] [--only=ID,ID] [--fase=2]
//   fase 1 (por defecto): crea/actualiza cada pregunta con propiedades, relaciones y cuerpo.
//   fase 2: marca Duplicada y enlaza «Equivale a» (pares declarados en el texto de la propia pregunta).
// Variables: NOTION_TRABAJO, NOTION_WORKTREE, NOTION_PRODUCTO, DESIGN_REF, UXR_RANGO (por defecto 026-035).
// Reglas de Enzo: estado y bloqueo solo cuando la fuente es inequívoca; nada se marca Decidida; los vínculos salen de menciones explícitas.
const fs = require("fs");
const { snapshot, configuracion, estadoKB, resolucion } = require('./kb-preguntas.js');
const { origenPregunta } = require('./contrato-documentos.js');
const cfgKB = configuracion(), preguntasKB = new Map(snapshot(cfgKB).preguntas.map(q => [q.id, q]));
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = path.resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(fs.readFileSync(path.join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || path.join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = process.env.NOTION_SYNC || path.resolve(MOD, CFG.sync);
const REPO_URL = CFG.repo_url;
const DESIGN_REF = process.env.DESIGN_REF || CFG.design_ref;
const PRODUCTO = process.env.NOTION_PRODUCTO || "3fb1a7d0-6388-814e-8cce-f48a414b5cf2";
const PAQUETE = process.env.NOTION_PAQUETE || "DSP-002";
const DS = {
  preg: "9811a7d0-6388-829a-82b4-0735e973e46b", uxr: "6361a7d0-6388-8376-816d-076587d56e7f", hu: "4951a7d0-6388-820e-8c76-87b77818bc9f",
  paq: "66f1a7d0-6388-83f8-881b-0758134faa78", flw: "3a91a7d0-6388-83d7-972f-07afabf710e0",
};
const hoy = new Date().toISOString().slice(0, 10);
const dry = process.argv.includes("--dry-run");
const fase2 = process.argv.includes("--fase=2");
const only = (process.argv.find(a => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const [r0, r1] = (process.env.UXR_RANGO || "026-035").split("-").map(Number);
const out = path.join(S, "preguntas-iph");
fs.mkdirSync(out, { recursive: true });

const leer = f => fs.readFileSync(path.join(WT, f), "utf8").replace(/\r\n/g, "\n");
const norm = s => String(s || "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
const celdas = l => l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map(x => x.trim());

// --- UXR en alcance, sus historias y los flujos que los declaran ---
const dirUxr = "design/ux-requirements", dirFlw = "design/user-flows";
const ficheros = fs.readdirSync(path.join(WT, dirUxr)).filter(f => { const m = f.match(/^UXR-(\d{3})-/); return m && +m[1] >= r0 && +m[1] <= r1; }).sort();
const UXR_HU = {}, UXR_FILE = {}, UXR_FLW = {};
for (const f of ficheros) {
  const id = f.match(/^(UXR-\d+)/)[1], t = leer(dirUxr + "/" + f), fm = (t.match(/^---\n([\s\S]*?)\n---\n/) || [])[1] || "";
  UXR_FILE[id] = dirUxr + "/" + f;
  UXR_HU[id] = [...new Set([...fm.matchAll(/^\s*-\s*id:\s*(HU-[A-Z0-9-]+?)\s*$/gm)].map(m => m[1]).filter(x => /^HU-IPH-\d{2}$/.test(x)))];
}
for (const f of fs.readdirSync(path.join(WT, dirFlw)).filter(x => /^FLW-\d+.*\.md$/.test(x))) {
  const t = leer(dirFlw + "/" + f), fm = (t.match(/^---\n([\s\S]*?)\n---\n/) || [])[1] || "", id = f.match(/^(FLW-\d+)/)[1];
  const b = fm.match(/^requirements:\s*\n((?:[ \t]+-[^\n]*\n?)+)/m);
  const lista = b ? b[1].split("\n").map(x => x.replace(/^[ \t]+-\s*/, "").replace(/#.*$/, "").trim()).filter(Boolean) : [];
  for (const u of lista.filter(x => UXR_FILE[x])) (UXR_FLW[u] = UXR_FLW[u] || []).push(id);
}

// --- extracción de las tablas «Open questions» ---
const preguntas = [];
for (const [uxr, ruta] of Object.entries(UXR_FILE)) {
  const txt = leer(ruta), i = txt.search(/^#{1,3} Open questions/m);
  if (i < 0) continue;
  const resto = txt.slice(i).split("\n"); let cab = null;
  for (let k = 1; k < resto.length; k++) {
    const l = resto[k];
    if (/^#{1,3} /.test(l)) break;
    if (!l.startsWith("|")) continue;
    const c = celdas(l);
    if (/^-+$/.test(c[0].replace(/[: ]/g, ""))) continue;
    if (/^ID$/i.test(c[0])) { cab = c.map(x => x.toLowerCase()); continue; }
    const m = c[0].match(/^(UXR-\d{3}-Q\d+|HU-IPH-\d{2}-Q\d+)/); if (!m) continue;
    const col = n => { const j = cab ? cab.findIndex(x => x.startsWith(n)) : -1; return j >= 0 ? (c[j] || "") : ""; };
    preguntas.push({ id: m[1], uxrDueno: uxr, ruta, texto: col("pregunta"), responsable: col("responsable"), prioridad: col("prioridad"), bloquea: col("bloquea") });
  }
}

function mapResponsable(txt) {
  const out = new Set();
  for (const p of String(txt || "").split(/[\/+,;]| y /)) {
    const t = norm(p).toLowerCase();
    if (!t) continue;
    if (/^(product owner|po|negocio)/.test(t)) out.add("PO");
    else if (/ux writing/.test(t)) out.add("UX Writing");
    else if (/^(ux|responsable de ux|dise[nñ]o)/.test(t)) out.add("UX");
    else if (/^(arq|arquitectura)/.test(t)) out.add("Arquitectura");
    else if (/seguridad/.test(t)) out.add("Seguridad");
    else if (/desarrollo/.test(t)) out.add("Desarrollo");
    else if (/^(analista funcional|af)\b/.test(t)) out.add("Analista funcional");
  }
  return [...out];
}
const quienResponde = resp => {
  const g = new Set(resp.map(r => ({ UX: "Diseño", "UX Writing": "Diseño", PO: "Negocio", "Analista funcional": "Negocio", Arquitectura: "Arquitectura o Seguridad", Seguridad: "Arquitectura o Seguridad", Desarrollo: "Arquitectura o Seguridad" }[r])));
  return g.size === 1 ? [...g][0] : g.size > 1 ? "Mixta" : null;
};
const mapPrioridad = t => { const m = norm(t).match(/^(Alta|Media|Baja)$/i); return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : null; };
const mapBloquea = t => { t = norm(t); if (!t || t === "—") return null; if (/^No\b/.test(t)) return "No"; if (/^S[ií](?![A-Za-z])/.test(t)) return "Diseño"; return null; };
const nivel = t => {
  t = norm(t).toLowerCase();
  if (!/^s[ií](?![a-z])/.test(t)) return null;
  if (/\bflw\b|flujo/.test(t)) return "Flujo";
  if (/\bscr\b|pantalla|campo|aviso|mensaje|texto|componente|validaci[oó]n|dise[nñ]o|formulario|contenido|estados?/.test(t)) return "Pantalla";
  return null;
};
// Pares declarados en el texto: «Misma pregunta que UXR-029-Q1»
const equivale = r => [...new Set([...norm(r.texto).matchAll(/Misma pregunta que ((?:UXR-\d{3}|HU-IPH-\d{2})-Q\d+)/g)].map(m => m[1]))];
const titulo = r => {
  let bruto = norm(r.texto).replace(/^(Abierta en la historia\.)\s*/i, "");
  const q = bruto.match(/^[^?]*\?/);
  let t = (q ? q[0] : bruto).trim();
  const pref = r.id + " · ";
  if (pref.length + t.length > 130) t = t.slice(0, 130 - pref.length - 1).replace(/\s+\S*$/, "") + "…";
  return pref + t;
};

const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8", env: Object.assign({}, process.env, { DESIGN_REF }) });
const resumen = [];
const lista = preguntas.filter(r => !only.length || only.includes(r.id));
const ids = new Set(preguntas.map(p => p.id));

for (const r of lista) {
  const f = r.id.replace(/[^\w.-]+/g, "_");
  const esUxr = r.id.startsWith("UXR-");
  const resp = mapResponsable(r.responsable), prio = mapPrioridad(r.prioridad), bloquea = mapBloquea(r.bloquea), nv = nivel(r.bloquea);
  const uxrs = [...new Set([r.uxrDueno, ...preguntas.filter(p => p.id === r.id).map(p => p.uxrDueno)])];
  const hus = [...new Set([...uxrs.flatMap(u => UXR_HU[u] || []), ...(r.id.startsWith("HU-IPH-") ? [r.id.replace(/-Q\d+$/, "")] : [])])];
  const flujos = [...new Set(uxrs.flatMap(u => UXR_FLW[u] || []))];

  if (fase2) {
    const eq = equivale(r).filter(x => ids.has(x));
    if (!eq.length) continue;
    const metaP = { id: r.id, title: titulo(r), props: { "Duplicada": { checkbox: true } } };
    const metaR = { id: r.id, title: titulo(r), relations: { "Equivale a": { ds: DS.preg, ids: eq } } };
    const fP = path.join(out, f + "-dup.json"), fR = path.join(out, f + "-eq.json");
    fs.writeFileSync(fP, JSON.stringify(metaP)); fs.writeFileSync(fR, JSON.stringify(metaR));
    if (dry) { resumen.push({ id: r.id, duplicada: true, equivale: eq }); continue; }
    try {
      const a = JSON.parse(run(SYNC, ["upsert", "--ds", DS.preg, "--meta", fP, "--solo-props"]));
      const b = JSON.parse(run(SYNC, ["upsert", "--ds", DS.preg, "--meta", fR, "--solo-relaciones"]));
      resumen.push({ id: r.id, duplicada: a.ok, equivale: b.ok, eq });
    } catch (e) { resumen.push({ id: r.id, error: String(e.stderr || e.message).slice(0, 200) }); }
    continue;
  }

  // --- cuerpo ---
  const L = [];
  L.push("## Pregunta", "", norm(r.texto), "");
  L.push("## Lo que dice la fuente", "", "| Campo | Valor en el repo |", "|---|---|",
    "| Responsable | " + (norm(r.responsable) || "—") + " |", "| Prioridad | " + (norm(r.prioridad) || "—") + " |", "| Bloquea | " + (norm(r.bloquea) || "—") + " |",
    "| Estado | " + (preguntasKB.get(r.id)?.estadoTexto || "Abierta") + " |", "");
  if (preguntasKB.has(r.id)) L.push(resolucion(preguntasKB.get(r.id), cfgKB));
  const eqs = equivale(r); if (eqs.length) L.push("**Equivale a:** " + eqs.join(", ") + ".", "");
  L.push("## Dónde está en el repo", "", "- [`" + r.ruta + "`](" + REPO_URL + DESIGN_REF + "/" + r.ruta + ")");
  const origenF = path.join(out, f + "-origen.md"), cuerpoF = path.join(out, f + "-cuerpo.md"), metaF = path.join(out, f + "-meta.json");
  fs.writeFileSync(origenF, L.join("\n"));
  try { run(path.join(MOD, "scripts", "prepare-body.js"), [r.ruta, origenF, cuerpoF, WT, r.id]); }
  catch (e) { resumen.push({ id: r.id, error: "prepare: " + String(e.message).slice(0, 160) }); continue; }
  const props = {
    "Origen": { select: { name: origenPregunta(preguntasKB.get(r.id) || r) } },
    "Estado": { select: { name: preguntasKB.get(r.id)?.estado || "Abierta" } },
    "Vigencia": { select: { name: "Vigente" } },
    "Ruta en el repo": { rich_text: [{ type: "text", text: { content: r.ruta } }] },
    "Enlace GitLab": { url: REPO_URL + DESIGN_REF + "/" + r.ruta },
    "Última carga": { date: { start: hoy } },
    "Producto": { relation: [{ id: PRODUCTO }] },
  };
  if (bloquea) props["Bloquea"] = { select: { name: bloquea } };
  if (nv) props["Nivel de bloqueo"] = { select: { name: nv } };
  if (prio) props["Prioridad"] = { select: { name: prio } };
  if (resp.length) props["Responsable"] = { multi_select: resp.map(name => ({ name })) };
  const qr = quienResponde(resp); if (qr) props["Quién puede responder"] = { select: { name: qr } };
  const meta = { id: r.id, title: titulo(r), props, relations: {
    "Requerimientos UX": { ds: DS.uxr, ids: uxrs }, "Historias": { ds: DS.hu, ids: hus }, "Paquetes de alcance": { ds: DS.paq, ids: [PAQUETE] }, "Flujos": { ds: DS.flw, ids: flujos } } };
  fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
  if (dry) { resumen.push({ id: r.id, titulo: meta.title, bloquea, nivel: nv, prio, resp, quien: qr, uxr: uxrs, hu: hus.length, flw: flujos }); continue; }
  try {
    const up = JSON.parse(run(SYNC, ["upsert", "--ds", DS.preg, "--meta", metaF, "--body", cuerpoF, "--source", r.ruta, "--loaded", hoy]));
    let ver = {};
    try { ver = JSON.parse(run(SYNC, ["verify", "--page", up.page, "--body", cuerpoF]).split("\n").filter(l => l.startsWith("{"))[0]); } catch (e) { ver = { ok: false }; }
    resumen.push({ id: r.id, creada: up.creada, ok: ver.ok, sinResolver: up.sinResolver, page: up.page });
  } catch (e) { resumen.push({ id: r.id, error: "upsert: " + String(e.stderr || e.message).slice(0, 220) }); }
}
fs.writeFileSync(path.join(out, (fase2 ? "fase2-" : "") + "resumen" + (dry ? "-dry" : "") + ".json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ fase: fase2 ? 2 : 1, total: resumen.length, ok: resumen.filter(r => r.ok || r.duplicada).length, errores: resumen.filter(r => r.error || r.ok === false).length, dry }));
