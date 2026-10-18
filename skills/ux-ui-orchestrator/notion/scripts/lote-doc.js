// Carga en Notion los documentos de diseño de una carpeta del worktree: propiedades + relaciones + cuerpo.
// Uso: node lote-doc.js <tipo> [--only UXR-001,UXR-002] [--dry-run]
//   tipo: uxr
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
const PRODUCTO = "3fb1a7d0-6388-814e-8cce-f48a414b5cf2"; // Piloto de CL2 Flotas
const DS = { historias: "4951a7d0-6388-820e-8c76-87b77818bc9f", paquetes: "66f1a7d0-6388-83f8-881b-0758134faa78" };
const hoy = new Date().toISOString().slice(0, 10);
const crypto = require("crypto");
const RES_FILE = "C:/Users/emacalupu/.claude/notion/resumenes-" + (process.argv[2] || "uxr") + ".json";
const RESUMENES = fs.existsSync(RES_FILE) ? JSON.parse(fs.readFileSync(RES_FILE, "utf8")) : {};

// Historias que incluye cada paquete de alcance (tabla «| [HU-xx-yy](...) | ... |» del archivo del paquete en origin/develop).
const PACK_HU = {};
for (const pack of fs.readdirSync(WT + "/requirements/scope-packs").filter(f => /^DSP-\d+/.test(f))) {
  const id = pack.match(/^(DSP-\d+)/)[1];
  const txt = execFileSync("git", ["-C", WT, "show", "origin/develop:requirements/scope-packs/" + pack], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  PACK_HU[id] = [...new Set([...txt.matchAll(/^\|\s*\[(HU-\d{2}-\d{2})\]/gm)].map(m => m[1]))];
}

const tipos = {
  uxr: { dir: "design/ux-requirements", prefijo: "UXR-", ds: "6361a7d0-6388-8376-816d-076587d56e7f", salida: "uxr" },
};

const tipo = tipos[process.argv[2]];
if (!tipo) { console.error("tipo desconocido"); process.exit(2); }
const only = (process.argv.find(a => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const dry = process.argv.includes("--dry-run");
const out = path.join(S, tipo.salida);
fs.mkdirSync(out, { recursive: true });

function frontmatter(text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const fm = m[1];
  const get = k => { const r = fm.match(new RegExp("^" + k + ":\\s*(.*)$", "m")); return r ? r[1].trim().replace(/^"|"$/g, "") : ""; };
  const sources = [...fm.matchAll(/^\s*-\s*id:\s*([^\s]+)/gm)].map(x => x[1]);
  return { id: get("id"), title: get("title"), status: get("status"), sources };
}

const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8", env: Object.assign({}, process.env, { DESIGN_REF }) });

const files = fs.readdirSync(path.join(WT, tipo.dir)).filter(f => f.startsWith(tipo.prefijo) && f.endsWith(".md")).sort();
const resumen = [];
for (const f of files) {
  const repoPath = tipo.dir + "/" + f;
  const text = fs.readFileSync(path.join(WT, repoPath), "utf8");
  const fm = frontmatter(text);
  if (!fm || !fm.id) { resumen.push({ f, error: "sin frontmatter" }); continue; }
  if (only.length && !only.includes(fm.id)) continue;

  const origen = path.join(out, fm.id + "-origen.md"), cuerpo = path.join(out, fm.id + "-cuerpo.md"), metaF = path.join(out, fm.id + "-meta.json");
  fs.copyFileSync(path.join(WT, repoPath), origen);
  let prep;
  try { prep = JSON.parse(run(path.join(MOD, "scripts", "prepare-body.js"), [repoPath, origen, cuerpo, WT, fm.id])); }
  catch (e) { resumen.push({ id: fm.id, error: "prepare: " + String(e.message).slice(0, 160) }); continue; }

  const hu = fm.sources.filter(s => /^HU-\d{2}-\d{2}$/.test(s));
  // Pertenencia al paquete: lo que el documento nombra + los paquetes que incluyen alguna de sus historias.
  const dsp = [...new Set([
    ...fm.sources.filter(s => /^DSP-\d+$/.test(s)),
    ...Object.entries(PACK_HU).filter(([, hus]) => hu.some(h => hus.includes(h))).map(([id]) => id),
  ])];
  const meta = {
    id: fm.id,
    title: fm.title,
    props: {
      "Estado del documento": { select: { name: "Borrador" } },
      "Ruta en el repo": { rich_text: [{ type: "text", text: { content: repoPath } }] },
      "Enlace GitLab": { url: REPO_URL + DESIGN_REF + "/" + repoPath },
      "Última carga": { date: { start: hoy } },
      "Producto": { relation: [{ id: PRODUCTO }] },
    },
    relations: {
      "Historias": { ds: DS.historias, ids: hu },
      "Paquetes de alcance": { ds: DS.paquetes, ids: dsp },
    },
  };
  // Resumen «En 30 segundos»: vive fuera del repo; si el documento cambió desde que se redactó, se marca Desactualizado.
  let resumenArgs = [];
  const r = RESUMENES[fm.id];
  if (r) {
    const huella = crypto.createHash("sha1").update(fs.readFileSync(origen, "utf8").replace(/\r\n/g, "\n")).digest("hex");
    const vigente = r.hash === huella;
    const bloque = [
      "<callout>", "\t**En 30 segundos**" + (vigente ? "" : " (resumen desactualizado: el documento cambió después de redactarlo)"),
      "\t**Qué permite:** " + r.permite, "\t**Para quién:** " + r.para, "\t**Qué se ve:** " + r.ve, "\t**Estado:** " + r.estado, "</callout>",
    ].join("\n");
    const resF = path.join(out, fm.id + "-resumen.md");
    fs.writeFileSync(resF, bloque);
    resumenArgs = ["--summary", resF];
    meta.props["Resumen"] = { rich_text: [{ type: "text", text: { content: r.permite } }] };
    meta.props["Resumen vigente"] = { select: { name: vigente ? "Vigente" : "Desactualizado" } };
  }
  fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
  if (dry) { resumen.push({ id: fm.id, dry: true, historias: hu, paquetes: dsp, bytes: fs.statSync(cuerpo).size }); continue; }

  try {
    const up = JSON.parse(run(SYNC, ["upsert", "--ds", tipo.ds, "--meta", metaF, "--body", cuerpo, "--source", repoPath, "--loaded", hoy, ...resumenArgs]));
    let ver = {};
    try { ver = JSON.parse(run(SYNC, ["verify", "--page", up.page, "--body", cuerpo]).split("\n").filter(l => l.startsWith("{"))[0]); } catch (e) { ver = { ok: false, error: "verify" }; }
    resumen.push({ id: fm.id, creada: up.creada, ok: ver.ok, sinResolver: up.sinResolver, esperado: up.esperado, enNotion: ver.notion, historias: hu.length, paquetes: dsp.length, page: up.page });
  } catch (e) {
    resumen.push({ id: fm.id, error: "upsert: " + String(e.stderr || e.message).slice(0, 220) });
  }
}
fs.writeFileSync(path.join(out, "resumen.json"), JSON.stringify(resumen, null, 1));
const ok = resumen.filter(r => r.ok).length, fallos = resumen.filter(r => r.error || (r.ok === false)).length;
console.log(JSON.stringify({ total: resumen.length, ok, fallos, dry }));
