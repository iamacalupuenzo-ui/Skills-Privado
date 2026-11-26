// Carga en Notion flujos, pantallas y exploraciones del worktree: propiedades + relaciones + cuerpo.
// Uso: node lote-diseno.js <flw|scr|ib> [--only=ID,ID] [--dry-run]
const fs = require("fs");
const { registrarDocumento } = require('./registrar-huella.js');
const { snapshot: snapshotHuella, configuracion: configuracionHuella } = require('./kb-preguntas.js');
const cfgHuella = configuracionHuella(), kbHuella = snapshotHuella(cfgHuella);
const { propiedadesDocumento } = require('./contrato-documentos.js');
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = process.env.NOTION_SYNC || require("path").resolve(MOD, CFG.sync);
const REPO_URL = CFG.repo_url;
const DESIGN_REF = process.env.DESIGN_REF || CFG.design_ref;
// Producto: NOTION_PRODUCTO lo fuerza; si no, sale del paquete que el documento nombra en sources (DSP-NNN).
// Sin paquete o con paquetes de productos distintos, el documento no se carga y queda como duda (Enzo, 2026-11-26).
const PRODUCTO_FORZADO = process.env.NOTION_PRODUCTO || "";
const DS_PAQUETES = "66f1a7d0-6388-83f8-881b-0758134faa78";
const TOKEN_N = (() => { if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN.trim(); const t = require("path").join(require("os").homedir(), ".notion", "token.txt"); return require("fs").existsSync(t) ? require("fs").readFileSync(t, "utf8").split(/\r?\n/)[0].trim() : ""; })();
function productosDe(dsps) {
  // Consulta síncrona a Notion en un proceso hijo, porque el cargador es síncrono.
  const code = "(async()=>{const out=[];for(const d of " + JSON.stringify(dsps) + "){const r=await fetch('https://api.notion.com/v1/data_sources/" + DS_PAQUETES + "/query',{method:'POST',headers:{Authorization:'Bearer '+process.env.T,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:JSON.stringify({filter:{or:[{property:'ID',rich_text:{equals:d}},{property:'title',title:{starts_with:d}}]}})});const j=await r.json();for(const p of j.results||[])for(const x of (p.properties.Producto?.relation||[]))out.push(x.id)}console.log(JSON.stringify([...new Set(out)]))})()";
  return JSON.parse(require("child_process").execFileSync("node", ["-e", code], { encoding: "utf8", env: Object.assign({}, process.env, { T: TOKEN_N }) }));
}
const DS = {
  uxr: "6361a7d0-6388-8376-816d-076587d56e7f", flw: "3a91a7d0-6388-83d7-972f-07afabf710e0",
  scr: "a101a7d0-6388-8200-ace3-0747fc33b0fb", ib: "fb11a7d0-6388-8315-bbe5-8723b8807a73",
  inv: "85b1a7d0-6388-82fb-80f5-07742f858d2c", dec: "9251a7d0-6388-8371-8107-070e3b5bd50a",
  dsp: "66f1a7d0-6388-83f8-881b-0758134faa78", preg: "9811a7d0-6388-829a-82b4-0735e973e46b",
};
// INV y DEC (Enzo, 2026-11-26): las relaciones salen de screens, flow, requirements, supersedes y de los IDs de sources.
// SCR-011-013 se expande a SCR-011, SCR-012 y SCR-013. Estado de la decisión: draft = Propuesta; accepted y approved = Aprobada.
const ESTADO_DEC = { draft: "Propuesta", proposed: "Propuesta", accepted: "Aprobada", approved: "Aprobada", superseded: "Sustituida", rejected: "Descartada" };
function idsDe(fm) {
  const crudos = [...fm.matchAll(/\b((?:SCR|FLW|UXR|DSP|INV|DEC)-\d{3}(?:-\d{3})?)\b/g)].map(m => m[1]);
  const out = new Set();
  for (const x of crudos) {
    const r = x.match(/^SCR-(\d{3})-(\d{3})$/);
    if (r) { for (let n = +r[1]; n <= +r[2]; n++) out.add("SCR-" + String(n).padStart(3, "0")); }
    else out.add(x.replace(/^((?:FLW|UXR|DSP|INV|DEC)-\d{3})-\d{3}$/, "$1"));
  }
  return [...out];
}
function propsInvDec(fm, t) {
  const v = k => campo(fm, k).replace(/^["']|["']$/g, "");
  const st = v("status") || "draft";
  const fecha = v("decision_date") || v("approved_on") || v("date") || (fm.match(/at:\s*"?(\d{4}-\d{2}-\d{2})/) || [])[1] || "";
  const p = {};
  if (t === "dec") {
    if (!ESTADO_DEC[st]) throw new Error("Estado de decisión sin mapa: " + st);
    p["Estado de la decisión"] = { select: { name: ESTADO_DEC[st] } };
    const por = v("decided_by") || v("approved_by");
    if (por) p["Decidido por"] = { rich_text: [{ type: "text", text: { content: por.slice(0, 200) } }] };
    if (fecha) p["Fecha de decisión"] = { date: { start: fecha } };
  } else {
    p["Estado del documento"] = { select: { name: { draft: "Borrador", in_review: "En revisión", approved: "Aprobado", accepted: "Aprobado" }[st] || "Borrador" } };
    if (fecha) p["Fecha"] = { date: { start: fecha } };
  }
  return p;
}
const hoy = new Date().toISOString().slice(0, 10);
const tipo = process.argv[2];
if (!["flw", "scr", "ib", "inv", "dec"].includes(tipo)) { console.error("tipo: flw | scr | ib | inv | dec"); process.exit(2); }
const only = (process.argv.find(a => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const dry = process.argv.includes("--dry-run");
const out = path.join(S, tipo);
fs.mkdirSync(out, { recursive: true });

const RES_FILE = path.join(S, "resumenes-" + tipo + ".json");
const RESUMENES = fs.existsSync(RES_FILE) ? JSON.parse(fs.readFileSync(RES_FILE, "utf8")) : {};

const leer = f => fs.readFileSync(path.join(WT, f), "utf8").replace(/\r\n/g, "\n");
const lista = (txt, clave) => {
  const m = txt.match(new RegExp("^" + clave + ":\\s*\\[([^\\]]*)\\]", "m"));
  if (m) return m[1].split(",").map(s => s.trim()).filter(Boolean);
  const b = txt.match(new RegExp("^" + clave + ":\\s*\\n((?:[ \\t]+-[^\\n]*\\n?)+)", "m")); // lista en varias líneas
  return b ? b[1].split("\n").map(s => s.replace(/^[ \t]+-\s*/, "").trim()).filter(Boolean) : [];
};
const campo = (txt, clave) => { const m = txt.match(new RegExp("^" + clave + ":\\s*(.*)$", "m")); return m ? m[1].trim().replace(/^"|"$/g, "") : ""; };
const partir = t => { const m = t.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/); return m ? { fm: m[1], cuerpo: m[2] } : { fm: "", cuerpo: t }; };

// Genera la lista de documentos a cargar: { id, title, repoPath, cuerpo, props, relations }
function documentos() {
  const dir = { flw: "design/user-flows", scr: "design/screens", ib: "design/explorations", inv: "design/investigacion", dec: "decisions/ux-ui/decisiones" }[tipo];
  const pref = { flw: "FLW-", scr: "SCR-", ib: "IB-", inv: "INV-", dec: "DEC-" }[tipo];
  const docs = [];
  for (const f of fs.readdirSync(path.join(WT, dir)).filter(x => x.startsWith(pref) && x.endsWith(".md")).sort()) {
    const repoPath = dir + "/" + f, { fm, cuerpo } = partir(leer(repoPath));
    if (tipo === "flw") {
      docs.push({ id: campo(fm, "id"), title: campo(fm, "title"), repoPath, cuerpo,
        relations: { "Requerimientos UX": { ds: DS.uxr, ids: lista(fm, "requirements").filter(x => /^UXR-\d+$/.test(x)) } }, props: {} });
    } else if (tipo === "inv" || tipo === "dec") {
      const propio = campo(fm, "id");
      const ids = idsDe(fm).filter(x => x !== propio);
      const de = re => ids.filter(x => re.test(x));
      const relations = {
        "Paquetes de alcance": { ds: DS.dsp, ids: de(/^DSP-/) },
        "Pantallas": { ds: DS.scr, ids: de(/^SCR-/) },
        "Flujos": { ds: DS.flw, ids: de(/^FLW-/) },
        "Requerimientos UX": { ds: DS.uxr, ids: de(/^UXR-/) },
      };
      if (tipo === "dec") {
        relations["Investigación"] = { ds: DS.inv, ids: de(/^INV-/) };
        const sust = lista(fm, "supersedes").concat((campo(fm, "supersedes").match(/DEC-\d{3}/g) || []));
        relations["Sustituye a"] = { ds: DS.dec, ids: [...new Set(sust)] };
        // Preguntas que responde: los IDs de pregunta que cita la DEC (UXR-014-Q4, HU-01-14-Q2, PA-DSP-009-03).
        const preg = [...(fm + "\n" + cuerpo).matchAll(/\b((?:UXR|HU|FLW|SCR|INV|UXS|DEC)-[\d-]+?-Q\d+|PA-DSP-\d{3}-\d{2})\b/g)].map(m => m[1]);
        relations["Preguntas que responde"] = { ds: DS.preg, ids: [...new Set(preg)] };
      } else relations["Decisiones"] = { ds: DS.dec, ids: de(/^DEC-/) };
      docs.push({ id: propio, title: campo(fm, "title"), repoPath, cuerpo, relations, props: propsInvDec(fm, tipo) });
    } else if (tipo === "ib") {
      const url = (cuerpo.match(/Lienzo[^|\n]*\|\s*(https:\/\/claude\.ai\/artifact\/[A-Za-z0-9]+)/) || [])[1];
      const props = { "Fidelidad": { select: { name: "Alta" } } };
      if (url) props["Enlace del lienzo"] = { url };
      docs.push({ id: campo(fm, "id"), title: campo(fm, "title"), repoPath, cuerpo,
        relations: { "Pantallas": { ds: DS.scr, ids: lista(fm, "screens") } }, props });
    } else {
      // SCR: una fila por pantalla del frontmatter; su sección propia + secciones compartidas del archivo.
      const bloques = []; let actual = null;
      for (const l of cuerpo.split("\n")) {
        if (/^## /.test(l)) { actual = { enc: l, lineas: [l] }; bloques.push(actual); } else if (actual) actual.lineas.push(l);
      }
      const compartidas = bloques.filter(b => !/^## SCR-\d+/.test(b.enc));
      const intro = cuerpo.split("\n").slice(0, cuerpo.split("\n").findIndex(l => /^## /.test(l))).join("\n").trim();
      const pantallas = [...fm.matchAll(/^  - id: (SCR-\d+)\n    flow: (FLW-\d+)\n(?:    .*\n)*?    required_states: \[([^\]]*)\]/gm)];
      for (const p of pantallas) {
        const [, id, flow, estados] = p;
        const bloque = bloques.find(b => b.enc.startsWith("## " + id + " "));
        if (!bloque) { docs.push({ id, error: "sin sección ## " + id + " en " + f }); continue; }
        const titulo = bloque.enc.replace(/^##\s*/, "");
        const propio = ["# " + titulo, ...bloque.lineas.slice(1)].join("\n").trim();
        const comp = compartidas.map(b => b.lineas.join("\n").trim()).join("\n\n");
        const cuerpoFila = [intro ? "> " + intro.replace(/\n/g, "\n> ") : "", propio,
          "\n## Secciones compartidas del archivo\n\nLas secciones siguientes valen para todas las pantallas de este archivo.\n", comp].filter(Boolean).join("\n\n");
        docs.push({ id, title: titulo, repoPath, cuerpo: cuerpoFila,
          relations: { "Flujo": { ds: DS.flw, ids: [flow] } },
          props: { "Estados requeridos": { rich_text: [{ type: "text", text: { content: estados.split(",").map(s => s.trim()).join(", ") } }] } } });
      }
    }
  }
  return docs;
}

const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8", env: Object.assign({}, process.env, { DESIGN_REF }) });
const resumen = [];
for (const d of documentos()) {
  if (d.error) { resumen.push({ id: d.id, error: d.error }); continue; }
  if (only.length && !only.includes(d.id)) continue;
  const origen = path.join(out, d.id + "-origen.md"), cuerpo = path.join(out, d.id + "-cuerpo.md"), metaF = path.join(out, d.id + "-meta.json");
  fs.writeFileSync(origen, d.cuerpo);
  try { run(path.join(MOD, "scripts", "prepare-body.js"), [d.repoPath, origen, cuerpo, WT, d.id]); }
  catch (e) { resumen.push({ id: d.id, error: "prepare: " + String(e.message).slice(0, 160) }); continue; }

  const meta = {
    id: d.id, title: d.title,
    props: Object.assign({
      "Estado del documento": { select: { name: "Borrador" } },
      "Ruta en el repo": { rich_text: [{ type: "text", text: { content: d.repoPath } }] },
      "Enlace GitLab": { url: REPO_URL + DESIGN_REF + "/" + d.repoPath },
      "Última carga": { date: { start: hoy } },
    }, d.props, ["inv", "dec"].includes(tipo) ? {} : propiedadesDocumento(partir(leer(d.repoPath)).fm, d.cuerpo, tipo)),
    relations: d.relations,
  };
  // La base Decisiones no tiene «Estado del documento»: usa «Estado de la decisión».
  if (tipo === "dec") delete meta.props["Estado del documento"];
  // Reutilizado por un paquete nuevo (regla de Enzo, 2026-11-26): NOTION_PAQUETES_EXTRA=DSP-009 suma ese paquete
  // y se combina con NOTION_PRODUCTO para dejarlo en el producto del paquete nuevo; el paquete anterior se conserva.
  const extra = (process.env.NOTION_PAQUETES_EXTRA || "").split(",").filter(Boolean);
  if (extra.length && meta.relations["Paquetes de alcance"]) meta.relations["Paquetes de alcance"].ids = [...new Set(meta.relations["Paquetes de alcance"].ids.concat(extra))];
  let resumenArgs = [];
  const r = RESUMENES[d.id];
  if (r) {
    const vigente = r.hash === crypto.createHash("sha1").update(d.cuerpo.replace(/\r\n/g, "\n")).digest("hex");
    const resF = path.join(out, d.id + "-resumen.md");
    fs.writeFileSync(resF, ["<callout>", "\t**En 30 segundos**" + (vigente ? "" : " (resumen desactualizado)"), "\t**Qué permite:** " + r.permite,
      "\t**Para quién:** " + r.para, "\t**Qué se ve:** " + r.ve, "\t**Estado:** " + r.estado, "</callout>"].join("\n"));
    resumenArgs = ["--summary", resF];
    meta.props["Resumen"] = { rich_text: [{ type: "text", text: { content: r.permite } }] };
    meta.props["Resumen vigente"] = { select: { name: vigente ? "Vigente" : "Desactualizado" } };
  }
  const fmDoc = partir(leer(d.repoPath)).fm;
  let dsps = [...fmDoc.matchAll(/^\s*-\s*\{?\s*id:\s*"?(DSP-\d+)"?\s*[,}]?/gm)].map(m => m[1]);
  // INV y DEC suelen nombrar el paquete solo en tags (dsp-006): se usan como respaldo.
  if (!dsps.length && ["inv", "dec"].includes(tipo)) dsps = [...new Set([...(fmDoc.match(/^tags:.*$/m) || [""])[0].matchAll(/\bdsp-(\d{3})\b/gi)].map(m => "DSP-" + m[1]))];
  if (["inv", "dec"].includes(tipo) && dsps.length) meta.relations["Paquetes de alcance"].ids = [...new Set(dsps.concat(meta.relations["Paquetes de alcance"].ids))];
  const productos = PRODUCTO_FORZADO ? [PRODUCTO_FORZADO] : (dsps.length ? productosDe(dsps) : []);
  if (productos.length !== 1) { resumen.push({ id: d.id, duda: true, paquetes: dsps, productos, motivo: dsps.length ? "sus paquetes no dan un solo producto" : "no nombra su paquete en sources; usa NOTION_PRODUCTO" }); continue; }
  meta.props["Producto"] = { relation: [{ id: productos[0] }] };
  fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
  if (dry) { resumen.push({ id: d.id, dry: true, relaciones: Object.fromEntries(Object.entries(d.relations).map(([k, v]) => [k, v.ids])), bytes: fs.statSync(cuerpo).size, lienzo: !!(d.props && d.props["Enlace del lienzo"]) }); continue; }
  try {
    const up = JSON.parse(run(SYNC, ["upsert", "--ds", DS[tipo], "--meta", metaF, "--body", cuerpo, "--source", d.repoPath, "--loaded", hoy, ...resumenArgs]));
    let ver = {};
    try { ver = JSON.parse(run(SYNC, ["verify", "--page", up.page, "--body", cuerpo]).split("\n").filter(l => l.startsWith("{"))[0]); } catch (e) { ver = { ok: false }; }
    if (ver.ok) registrarDocumento(cfgHuella, kbHuella, d.id, leer(d.repoPath));
    resumen.push({ id: d.id, creada: up.creada, ok: ver.ok, sinResolver: up.sinResolver, esperado: up.esperado, enNotion: ver.notion, page: up.page });
  } catch (e) { resumen.push({ id: d.id, error: "upsert: " + String(e.stderr || e.message).slice(0, 220) }); }
}
fs.writeFileSync(path.join(out, "resumen.json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ tipo, total: resumen.length, ok: resumen.filter(r => r.ok).length, fallos: resumen.filter(r => r.error || r.ok === false).length, dry }));
