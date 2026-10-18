// Carga en Notion las preguntas del diseño (base Preguntas) a partir de preguntas/extraccion.json.
// Uso: node lote-preguntas.js [--only=ID,ID] [--dry-run]    (antes: node extraer-preguntas.js)
// Reglas acordadas con Enzo: estado y bloqueo solo cuando la fuente lo dice de forma inequívoca; nada se marca Decidida por inferencia
// salvo «Cerrada/Resuelta» explícito; los vínculos a flujos/pantallas/exploraciones salen solo de menciones explícitas.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = process.env.NOTION_SYNC || require("path").resolve(MOD, CFG.sync);
const REPO_URL = CFG.repo_url;
const DESIGN_REF = process.env.DESIGN_REF || CFG.design_ref;
const PRODUCTO = "3fb1a7d0-6388-814e-8cce-f48a414b5cf2";
const DS = {
  preg: "9811a7d0-6388-829a-82b4-0735e973e46b", uxr: "6361a7d0-6388-8376-816d-076587d56e7f", hu: "4951a7d0-6388-820e-8c76-87b77818bc9f",
  paq: "66f1a7d0-6388-83f8-881b-0758134faa78", flw: "3a91a7d0-6388-83d7-972f-07afabf710e0", scr: "a101a7d0-6388-8200-ace3-0747fc33b0fb",
  ib: "fb11a7d0-6388-8315-bbe5-8723b8807a73",
};
const hoy = new Date().toISOString().slice(0, 10);
const only = (process.argv.find(a => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const dry = process.argv.includes("--dry-run");
const lote = (process.argv.find(a => a.startsWith("--lote=")) || "").slice(7).split("/").map(Number); // --lote=i/n (1-based)
const out = path.join(S, "preguntas", "lote");
fs.mkdirSync(out, { recursive: true });

const { preguntas } = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "extraccion.json"), "utf8"));
const leer = f => fs.readFileSync(path.join(WT, f), "utf8").replace(/\r\n/g, "\n");

// UXR -> historias (frontmatter sources)
const UXR_HU = {};
for (const f of fs.readdirSync(path.join(WT, "design/ux-requirements")).filter(x => /^UXR-\d+.*\.md$/.test(x))) {
  const t = leer("design/ux-requirements/" + f), fm = (t.match(/^---\n([\s\S]*?)\n---\n/) || [])[1] || "";
  UXR_HU[f.match(/^(UXR-\d+)/)[1]] = [...new Set([...fm.matchAll(/^\s*-\s*id:\s*(HU-\d{2}-\d{2})\b/gm)].map(m => m[1]))];
}
const UXR_FILE = {};
for (const f of fs.readdirSync(path.join(WT, "design/ux-requirements")).filter(x => /^UXR-\d+.*\.md$/.test(x))) UXR_FILE[f.match(/^(UXR-\d+)/)[1]] = "design/ux-requirements/" + f;

// UXR -> flujos que lo declaran (frontmatter `requirements` de design/user-flows)
const UXR_FLW = {};
for (const f of fs.readdirSync(path.join(WT, "design/user-flows")).filter(x => /^FLW-\d+.*\.md$/.test(x))) {
  const t = leer("design/user-flows/" + f), fm = (t.match(/^---\n([\s\S]*?)\n---\n/) || [])[1] || "", id = f.match(/^(FLW-\d+)/)[1];
  const m = fm.match(/^requirements:\s*\[([^\]]*)\]/m), b = fm.match(/^requirements:\s*\n((?:[ \t]+-[^\n]*\n?)+)/m);
  const lista = m ? m[1].split(",").map(x => x.trim()) : b ? b[1].split("\n").map(x => x.replace(/^[ \t]+-\s*/, "").trim()) : [];
  for (const u of lista.filter(x => /^UXR-\d+$/.test(x))) (UXR_FLW[u] = UXR_FLW[u] || []).push(id);
}
const norm = s => String(s || "").replace(/\s+/g, " ").trim();
const SALTADAS = new Set(["HU-07-02-Q7"]); // absorbida por UXR-001-Q2 (se anota como equivalencia)

// --- mapeos acordados ---
function mapResponsable(txt) {
  const out = new Set();
  for (const p of String(txt || "").split(/[\/+,;]| y /)) {
    const t = norm(p).toLowerCase();
    if (!t) continue;
    if (/^(product owner|po|negocio)/.test(t)) out.add("PO");
    else if (/ux writing/.test(t)) out.add("UX Writing");
    else if (/^(ux|responsable de ux|diseño)/.test(t)) out.add("UX");
    else if (/^(arq|arquitectura)/.test(t)) out.add("Arquitectura");
    else if (/seguridad/.test(t)) out.add("Seguridad");
    else if (/desarrollo/.test(t)) out.add("Desarrollo");
    else if (/^(analista funcional|af)\b/.test(t)) out.add("Analista funcional");
  }
  return [...out];
}
const mapPrioridad = t => { const m = norm(String(t || "").replace(/\*\*/g, "")).match(/^(Alta|Media|Baja)$/i); return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : null; };
function mapBloquea(t) {
  t = norm(String(t || "").replace(/\*\*/g, ""));
  if (!t || t === "—") return null;
  if (/^No\b/.test(t)) return "No";
  if (/^S[ií]\b/.test(t) && !/si se aprueba/i.test(t) && /(flujo|FLW|SCR|pantalla|dise[nñ]o)/i.test(t)) return "Diseño";
  if (/^(FLW|SCR)\b/.test(t)) return "Diseño";
  return null; // ambigua: el texto original queda en el cuerpo
}
function mapEstado(t) {
  t = norm(String(t || "").replace(/\*\*/g, ""));
  if (!t) return null;
  if (/^Abierta/i.test(t)) return "Abierta";
  if (/^Respondida/i.test(t)) return "Propuesta";
  if (/^(Cerrada|Resuelta)/i.test(t)) return "Decidida";
  return null; // Reformulada/Consolidada/otros: lo decide una persona
}
const menciones = (txt, re) => [...new Set((txt.match(re) || []))];

const titulo = r => {
  const bruto = norm((r.textos[0] && r.textos[0].texto) || (r.dud2 && r.dud2.pregunta) || (r.cpo && (r.cpo.titulo || r.cpo.aclarar)) || r.id)
    .replace(/\*\*/g, "").replace(/^(Corrección documental|Nueva|Reformulada)[^.]*\.\s*/i, "");
  const q = bruto.match(/^[^?]*\?/);
  let t = (q ? q[0] : bruto).trim();
  if (t.length > 140) t = t.slice(0, 137).replace(/\s+\S*$/, "") + "…";
  return t;
};

const docs = [];
for (const r of preguntas) {
  if (SALTADAS.has(r.id)) continue;
  if (only.length && !only.includes(r.id)) continue;
  const esUxrQ = /^UXR-\d{3}-Q\d+$/.test(r.id), esHuQ = /^HU-\d{2}-\d{2}-Q\d+$/.test(r.id);
  const origen = esUxrQ ? "UXR" : esHuQ ? (r.textos.length ? "HU" : "CPO-001") : (r.dud2 ? "DUD-002" : "CPO-001");
  const fuentePrincipal = (r.fuentes.find(f => f.startsWith("design/ux-requirements/")) || r.fuentes[0] || "");
  const uxrs = [...new Set([
    ...(esUxrQ ? [r.id.slice(0, 7)] : []),
    ...r.fuentes.map(f => (f.match(/ux-requirements\/(UXR-\d+)/) || [])[1]).filter(Boolean),
    ...(r.cpo ? menciones((r.cpo.bloque || "").split("\n").find(l => /Historia \/ UXR/.test(l)) || "", /UXR-\d{3}/g) : []),
  ])].filter(u => UXR_FILE[u]);
  const hus = [...new Set([...(esHuQ ? [r.id.replace(/-Q\d+$/, "")] : []), ...uxrs.flatMap(u => UXR_HU[u] || [])])];
  const textoLibre = [r.textos.map(t => t.texto).join(" "), r.estadoTexto, r.cpo ? r.cpo.bloque || r.cpo.aclarar : "", r.dud2 ? r.dud2.pregunta + " " + r.dud2.ejemplo : ""].join(" ");
  const flujos = [...new Set([...menciones(textoLibre, /FLW-\d{3}/g), ...uxrs.flatMap(u => UXR_FLW[u] || [])])], pantallas = menciones(textoLibre, /SCR-\d{3}/g), expl = menciones(textoLibre, /IB-\d{3}/g);

  const resp = mapResponsable(r.responsable || (r.cpo && r.cpo.responsable) || (r.dud2 && r.dud2.responsable));
  const prio = mapPrioridad(r.prioridad) || mapPrioridad(r.cpo && r.cpo.prioridad);
  const bloquea = mapBloquea(r.bloquea) || mapBloquea(r.cpo && r.cpo.bloquea);
  const estado = mapEstado(r.estadoTexto);
  const eq = [...new Set([...r.alias, ...(r.id === "UXR-001-Q2" ? ["UXR-003-Q1", "HU-07-02-Q7"] : [])])].filter(x => x !== r.id);

  // --- cuerpo ---
  const L = [];
  L.push("## Pregunta", "", norm((r.textos[0] && r.textos[0].texto) || (r.dud2 && r.dud2.pregunta) || (r.cpo && r.cpo.aclarar) || ""), "");
  L.push("## Lo que dice la fuente", "", "| Campo | Valor en el repo |", "|---|---|",
    "| Responsable | " + (norm(r.responsable || (r.cpo && r.cpo.responsable) || (r.dud2 && r.dud2.responsable)) || "—") + " |",
    "| Prioridad | " + (norm(r.prioridad || (r.cpo && r.cpo.prioridad)) || "—") + " |",
    "| Bloquea | " + (norm(r.bloquea || (r.cpo && r.cpo.bloquea)) || "—") + " |",
    "| Estado | " + (norm(r.estadoTexto) || "no indicado en la tabla de origen") + " |", "");
  if (eq.length) L.push("**Equivale a:** " + eq.join(", ") + ".", "");
  if (r.dud2 && r.dud2.ejemplo) L.push("## Ejemplo (DUD-002)", "", r.dud2.ejemplo, "");
  if (r.cpo && r.cpo.bloque) L.push("## Contexto (CPO-001, " + r.cpo.seccion + ")", "", r.cpo.bloque.replace(/\n- \*\*Respuesta:\*\*\s*$/, ""), "");
  else if (r.cpo && r.cpo.aclarar) L.push("## Contexto (CPO-001, " + r.cpo.seccion + ")", "", r.cpo.aclarar, "");
  if (r.notas.length) L.push("> Nota de extracción: " + r.notas.join("; ") + ". El texto se tomó completo.", "");
  L.push("## Dónde está en el repo", "");
  for (const f of [...new Set(r.fuentes)]) L.push("- [`" + f + "`](" + REPO_URL + DESIGN_REF + "/design/" + f.replace(/^design\//, "") + ")");
  const cuerpoOrigen = path.join(out, r.id.replace(/[^\w.-]+/g, "_") + "-origen.md"), cuerpo = path.join(out, r.id.replace(/[^\w.-]+/g, "_") + "-cuerpo.md");
  const metaF = path.join(out, r.id.replace(/[^\w.-]+/g, "_") + "-meta.json");
  const repoPath = fuentePrincipal.startsWith("design/") ? fuentePrincipal : "design/" + fuentePrincipal;
  docs.push({ eq, r, id: r.id, titulo: titulo(r), origen, repoPath, uxrs, hus, flujos, pantallas, expl, resp, prio, bloquea, estado, md: L.join("\n"), cuerpoOrigen, cuerpo, metaF });
}

if (lote.length === 2 && lote[1]) { const k = docs.filter((_, i) => i % lote[1] === lote[0] - 1); docs.length = 0; docs.push(...k); }
const soloRel = process.argv.includes("--relaciones");
const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8", env: Object.assign({}, process.env, { DESIGN_REF }) });
const resumen = [];
for (const d of docs) {
  if (soloRel) {
    const eqIds = d.eq.filter(x => docs.some(o => o.id === x) || preguntas.some(p => p.id === x && !SALTADAS.has(p.id)));
    const metaR = { id: d.id, title: d.titulo, relations: { "Flujos": { ds: DS.flw, ids: d.flujos }, "Equivale a": { ds: DS.preg, ids: eqIds } } };
    const fR = path.join(out, d.id.replace(/[^w.-]+/g, "_") + "-metaRel.json"); fs.writeFileSync(fR, JSON.stringify(metaR, null, 1));
    if (dry) { resumen.push({ id: d.id, flujos: d.flujos, eq: eqIds }); continue; }
    try { resumen.push(JSON.parse(run(SYNC, ["upsert", "--ds", DS.preg, "--meta", fR, "--solo-relaciones"]))); } catch (e) { resumen.push({ id: d.id, error: String(e.stderr || e.message).slice(0, 200) }); }
    continue;
  }
  fs.writeFileSync(d.cuerpoOrigen, d.md);
  try { run(path.join(MOD, "scripts", "prepare-body.js"), [d.repoPath, d.cuerpoOrigen, d.cuerpo, WT, d.id]); }
  catch (e) { resumen.push({ id: d.id, error: "prepare: " + String(e.message).slice(0, 160) }); continue; }
  const props = {
    "Origen": { select: { name: d.origen } },
    "Ruta en el repo": { rich_text: [{ type: "text", text: { content: d.repoPath } }] },
    "Enlace GitLab": { url: REPO_URL + DESIGN_REF + "/" + d.repoPath },
    "Última carga": { date: { start: hoy } },
    "Producto": { relation: [{ id: PRODUCTO }] },
  };
  if (d.bloquea) props["Bloquea"] = { select: { name: d.bloquea } };
  if (d.estado) props["Estado"] = { select: { name: d.estado } };
  if (d.prio) props["Prioridad"] = { select: { name: d.prio } };
  if (d.resp.length) props["Responsable"] = { multi_select: d.resp.map(name => ({ name })) };
  const meta = {
    id: d.id, title: d.titulo, props,
    relations: {
      "Requerimientos UX": { ds: DS.uxr, ids: d.uxrs }, "Historias": { ds: DS.hu, ids: d.hus }, "Paquetes de alcance": { ds: DS.paq, ids: ["DSP-001"] },
      "Flujos": { ds: DS.flw, ids: d.flujos }, "Pantallas": { ds: DS.scr, ids: d.pantallas }, "Exploraciones": { ds: DS.ib, ids: d.expl },
    },
  };
  fs.writeFileSync(d.metaF, JSON.stringify(meta, null, 1));
  if (dry) { resumen.push({ id: d.id, dry: true, titulo: d.titulo, origen: d.origen, bloquea: d.bloquea, estado: d.estado, prio: d.prio, resp: d.resp, uxr: d.uxrs.length, hu: d.hus.length, flw: d.flujos, scr: d.pantallas.length, ib: d.expl }); continue; }
  try {
    const up = JSON.parse(run(SYNC, ["upsert", "--ds", DS.preg, "--meta", d.metaF, "--body", d.cuerpo, "--source", d.repoPath, "--loaded", hoy]));
    let ver = {};
    try { ver = JSON.parse(run(SYNC, ["verify", "--page", up.page, "--body", d.cuerpo]).split("\n").filter(l => l.startsWith("{"))[0]); } catch (e) { ver = { ok: false }; }
    resumen.push({ id: d.id, creada: up.creada, ok: ver.ok, sinResolver: up.sinResolver, page: up.page });
  } catch (e) { resumen.push({ id: d.id, error: "upsert: " + String(e.stderr || e.message).slice(0, 220) }); }
}
fs.writeFileSync(path.join(S, "preguntas", (soloRel ? "rel-" : "") + (lote.length === 2 ? "resumen-" + lote[0] + ".json" : "resumen.json")), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, fallos: resumen.filter(r => r.error || r.ok === false).length, dry }));
