// Carga en Notion flujos, pantallas y exploraciones del worktree: propiedades + relaciones + cuerpo.
// Uso: node lote-diseno.js <flw|scr|ib> [--only=ID,ID] [--dry-run]
const fs = require("fs");
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
const PRODUCTO = "3fb1a7d0-6388-814e-8cce-f48a414b5cf2";
const DS = {
  uxr: "6361a7d0-6388-8376-816d-076587d56e7f", flw: "3a91a7d0-6388-83d7-972f-07afabf710e0",
  scr: "a101a7d0-6388-8200-ace3-0747fc33b0fb", ib: "fb11a7d0-6388-8315-bbe5-8723b8807a73",
};
const hoy = new Date().toISOString().slice(0, 10);
const tipo = process.argv[2];
if (!["flw", "scr", "ib"].includes(tipo)) { console.error("tipo: flw | scr | ib"); process.exit(2); }
const only = (process.argv.find(a => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const dry = process.argv.includes("--dry-run");
const out = path.join(S, tipo);
fs.mkdirSync(out, { recursive: true });

const RES_FILE = "C:/Users/emacalupu/.claude/notion/resumenes-" + tipo + ".json";
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
  const dir = { flw: "design/user-flows", scr: "design/screens", ib: "design/explorations" }[tipo];
  const pref = { flw: "FLW-", scr: "SCR-", ib: "IB-" }[tipo];
  const docs = [];
  for (const f of fs.readdirSync(path.join(WT, dir)).filter(x => x.startsWith(pref) && x.endsWith(".md")).sort()) {
    const repoPath = dir + "/" + f, { fm, cuerpo } = partir(leer(repoPath));
    if (tipo === "flw") {
      docs.push({ id: campo(fm, "id"), title: campo(fm, "title"), repoPath, cuerpo,
        relations: { "Requerimientos UX": { ds: DS.uxr, ids: lista(fm, "requirements").filter(x => /^UXR-\d+$/.test(x)) } }, props: {} });
    } else if (tipo === "ib") {
      const url = (cuerpo.match(/Lienzo[^|\n]*\|\s*(https:\/\/claude\.ai\/artifact\/[A-Za-z0-9]+)/) || [])[1];
      const props = { "Fidelidad": { select: { name: "Alta" } }, "Decisión humana": { select: { name: "Pendiente" } } };
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
      "Producto": { relation: [{ id: PRODUCTO }] },
    }, d.props),
    relations: d.relations,
  };
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
  fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
  if (dry) { resumen.push({ id: d.id, dry: true, relaciones: Object.fromEntries(Object.entries(d.relations).map(([k, v]) => [k, v.ids])), bytes: fs.statSync(cuerpo).size, lienzo: !!(d.props && d.props["Enlace del lienzo"]) }); continue; }
  try {
    const up = JSON.parse(run(SYNC, ["upsert", "--ds", DS[tipo], "--meta", metaF, "--body", cuerpo, "--source", d.repoPath, "--loaded", hoy, ...resumenArgs]));
    let ver = {};
    try { ver = JSON.parse(run(SYNC, ["verify", "--page", up.page, "--body", cuerpo]).split("\n").filter(l => l.startsWith("{"))[0]); } catch (e) { ver = { ok: false }; }
    resumen.push({ id: d.id, creada: up.creada, ok: ver.ok, sinResolver: up.sinResolver, esperado: up.esperado, enNotion: ver.notion, page: up.page });
  } catch (e) { resumen.push({ id: d.id, error: "upsert: " + String(e.stderr || e.message).slice(0, 220) }); }
}
fs.writeFileSync(path.join(out, "resumen.json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ tipo, total: resumen.length, ok: resumen.filter(r => r.ok).length, fallos: resumen.filter(r => r.error || r.ok === false).length, dry }));
