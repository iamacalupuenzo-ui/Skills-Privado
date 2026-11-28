// Carga en Notion los documentos de diseño de una carpeta del worktree: propiedades + relaciones + cuerpo.
// Uso: node lote-doc.js <tipo> [--only UXR-001,UXR-002] [--dry-run]
//   tipo: uxr
const fs = require("fs");
const { registrarDocumento } = require('./registrar-huella.js');
const { snapshot: snapshotHuella, configuracion: configuracionHuella } = require('./kb-preguntas.js');
const cfgHuella = configuracionHuella(), kbHuella = snapshotHuella(cfgHuella);
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = process.env.NOTION_SYNC || require("path").resolve(MOD, CFG.sync);
const REPO_URL = CFG.repo_url;
const DESIGN_REF = process.env.DESIGN_REF || CFG.design_ref;
// Producto: sale de los paquetes del documento en Notion (Producto → Paquete). --producto <id> lo fuerza.
// Si los paquetes no dan un solo producto, o la fila ya está en otro, se levanta una duda (salida 3) y no se carga,
// salvo --confirmar-producto=nuevo (el producto del paquete más reciente: el documento se mueve adonde se trabaja ahora y
// conserva la relación con el paquete anterior), --confirmar-producto=union (queda en todos) o --producto <id>.
// Regla de Enzo, 2026-11-26: un UXR reutilizado por un paquete nuevo se mueve a ese paquete y a su producto.
const argProducto = (() => { const i = process.argv.indexOf("--producto"); return i > 0 ? process.argv[i + 1] : ""; })();
const confirmar = (process.argv.find(a => a.startsWith("--confirmar-producto=")) || "").split("=")[1] || "";
const DS_PRODUCTOS = "8f11a7d0-6388-83aa-8575-07f48d4cdc91";
const DS = { historias: "4951a7d0-6388-820e-8c76-87b77818bc9f", paquetes: "66f1a7d0-6388-83f8-881b-0758134faa78" };
const hoy = new Date().toISOString().slice(0, 10);
const crypto = require("crypto");
const RES_FILE = require("os").homedir().replace(/\\/g, "/") + "/.claude/notion/resumenes-" + (process.argv[2] || "uxr") + ".json";
const RESUMENES = fs.existsSync(RES_FILE) ? JSON.parse(fs.readFileSync(RES_FILE, "utf8")) : {};

// Historias que incluye cada paquete de alcance (tabla «| [HU-xx-yy](...) | ... |» del archivo del paquete en origin/develop).
const PACK_HU = {};
for (const pack of fs.readdirSync(WT + "/requirements/scope-packs").filter(f => /^DSP-\d+/.test(f))) {
  const id = pack.match(/^(DSP-\d+)/)[1];
  const txt = execFileSync("git", ["-C", WT, "show", "origin/develop:requirements/scope-packs/" + pack], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  PACK_HU[id] = [...new Set([...txt.matchAll(/^\|\s*\[[^\]]*?\b(HU-\d{2}-\d{2})[^\]]*\]\(/gm)].map(m => m[1]))];
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
// Lectura de Notion para resolver el producto (el token nunca se imprime).
const TOKEN = (() => { if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN.trim(); const t = path.join(require("os").homedir(), ".notion", "token.txt"); return fs.existsSync(t) ? fs.readFileSync(t, "utf8").split(/\r?\n/)[0].trim() : ""; })();
const api = async (m, u, b) => { const r = await fetch("https://api.notion.com/v1" + u, { method: m, headers: { Authorization: "Bearer " + TOKEN, "Notion-Version": "2025-09-03", "Content-Type": "application/json" }, body: b ? JSON.stringify(b) : undefined }); if (!r.ok) throw new Error(m + " " + u + " → " + r.status); return r.json(); };
const cacheProd = {};
async function productosDePaquete(dsp) {
  if (cacheProd[dsp]) return cacheProd[dsp];
  const r = await api("POST", "/data_sources/" + DS.paquetes + "/query", { filter: { or: [{ property: "ID", rich_text: { equals: dsp } }, { property: "title", title: { starts_with: dsp } }] } });
  return (cacheProd[dsp] = [...new Set(r.results.flatMap(p => (p.properties.Producto?.relation || []).map(x => x.id)))]);
}
async function filaActual(id) {
  const r = await api("POST", "/data_sources/" + tipo.ds + "/query", { filter: { property: "ID", rich_text: { equals: id } } });
  return r.results[0] || null;
}
async function opcionesProducto() {
  const r = await api("POST", "/data_sources/" + DS_PRODUCTOS + "/query", {});
  return r.results.map(p => ({ id: p.id, nombre: (Object.values(p.properties).find(x => x.type === "title")?.title || []).map(t => t.plain_text).join("") }));
}
const sinGuion = (x) => x.replace(/-/g, "");
const dudas = [];

(async () => {
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

  const huFuentes = fm.sources.filter(s => /^HU-\d{2}-\d{2}$/.test(s));
  const dspNombrados = fm.sources.filter(s => /^DSP-\d+$/.test(s));
  // Pertenencia al paquete. Si el documento nombra su paquete, solo cuentan ese paquete y sus historias: las demás
  // historias son fuentes que reutiliza, no historias a las que sirve (UXR-139 cita HU-01-09 y no es de DSP-001).
  // Si no lo nombra, se deduce de los paquetes que incluyen alguna de sus historias.
  const hu = dspNombrados.length ? huFuentes.filter(h => dspNombrados.some(d => (PACK_HU[d] || []).includes(h))) : huFuentes;
  const dsp = dspNombrados.length ? dspNombrados
    : [...new Set(Object.entries(PACK_HU).filter(([, hus]) => hu.some(h => hus.includes(h))).map(([id]) => id))];
  const meta = {
    id: fm.id,
    title: fm.title,
    props: {
      "Estado del documento": { select: { name: "Borrador" } },
      "Ruta en el repo": { rich_text: [{ type: "text", text: { content: repoPath } }] },
      "Enlace GitLab": { url: REPO_URL + DESIGN_REF + "/" + repoPath },
      "Última carga": { date: { start: hoy } },
    },
    relations: {
      "Historias": { ds: DS.historias, ids: hu, filtro: { property: "Catálogo", select: { equals: "RCP-001 CL2 Flotas" } } },
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
  // Producto: del paquete, sin pisar el que ya tiene la fila.
  const fila = TOKEN ? await filaActual(fm.id) : null;
  const actuales = (fila?.properties?.Producto?.relation || []).map(x => x.id);
  const deLosPaquetes = [...new Set((await Promise.all(dsp.map(productosDePaquete))).flat())];
  let productos = argProducto ? [argProducto] : deLosPaquetes;
  const union = [...new Set([...actuales, ...deLosPaquetes].map(sinGuion))];
  const ajeno = actuales.some(a => !deLosPaquetes.map(sinGuion).includes(sinGuion(a)));
  if (!argProducto && (deLosPaquetes.length !== 1 || ajeno)) {
    if (confirmar === "union") productos = union;
    else if (confirmar === "nuevo" && dsp.length) {
      const ultimo = [...dsp].sort((a, b) => Number(b.slice(4)) - Number(a.slice(4)))[0];
      productos = await productosDePaquete(ultimo);
    }
    else {
      dudas.push({ id: fm.id, paquetes: dsp, productosDeLosPaquetes: deLosPaquetes, productosActuales: actuales,
        motivo: deLosPaquetes.length === 0 ? "sus paquetes no tienen producto" : deLosPaquetes.length > 1 ? "sus paquetes son de productos distintos" : "la fila ya está en otro producto",
        opciones: ["--confirmar-producto=nuevo (se mueve al producto del paquete más reciente; recomendado si lo reutiliza un paquete nuevo)", "--confirmar-producto=union (queda en todos)", "--producto <id> (uno solo)"] });
      resumen.push({ id: fm.id, duda: true }); continue;
    }
  }
  meta.props["Producto"] = { relation: productos.map(id => ({ id })) };
  // Una fila existente conserva sus historias y paquetes (la carga suma, no quita).
  for (const prop of ["Historias", "Paquetes de alcance"]) meta.relations[prop].pages = (fila?.properties?.[prop]?.relation || []).map(x => x.id);
  fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
  if (dry) { resumen.push({ id: fm.id, dry: true, historias: hu, paquetes: dsp, productos, bytes: fs.statSync(cuerpo).size }); continue; }

  try {
    const up = JSON.parse(run(SYNC, ["upsert", "--ds", tipo.ds, "--meta", metaF, "--body", cuerpo, "--source", repoPath, "--loaded", hoy, ...resumenArgs]));
    let ver = {};
    try { ver = JSON.parse(run(SYNC, ["verify", "--page", up.page, "--body", cuerpo]).split("\n").filter(l => l.startsWith("{"))[0]); } catch (e) { ver = { ok: false, error: "verify" }; }
    if (ver.ok) registrarDocumento(cfgHuella, kbHuella, fm.id, text.replace(/\r\n/g, "\n"));
    resumen.push({ id: fm.id, creada: up.creada, ok: ver.ok, sinResolver: up.sinResolver, esperado: up.esperado, enNotion: ver.notion, historias: hu.length, paquetes: dsp.length, page: up.page });
  } catch (e) {
    resumen.push({ id: fm.id, error: "upsert: " + String(e.stderr || e.message).slice(0, 220) });
  }
}
fs.writeFileSync(path.join(out, "resumen.json"), JSON.stringify(resumen, null, 1));
const ok = resumen.filter(r => r.ok).length, fallos = resumen.filter(r => r.error || (r.ok === false)).length;
const opciones = dudas.length ? await opcionesProducto() : [];
console.log(JSON.stringify({ total: resumen.length, ok, fallos, dry, dudas, productosDisponibles: opciones }, null, dudas.length ? 1 : 0));
if (fallos) process.exitCode = 1; else if (dudas.length) process.exitCode = 3;
})().catch(e => { console.error(e.message); process.exit(1); });
