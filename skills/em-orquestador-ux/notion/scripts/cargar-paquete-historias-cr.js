// Carga en Notion el paquete DSP-003 y sus 24 historias vigentes (Captura y Recupero).
// Uso: node cargar-paquete-historias-cr.js [--dry-run] [--only=DSP-003,HU-SVR-01-06]
// Variables: NOTION_WORKTREE, NOTION_TRABAJO, NOTION_PRODUCTO (página del producto en Notion).
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = path.resolve(__dirname, "..");
const CFG = JSON.parse(fs.readFileSync(path.join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || path.join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = path.resolve(MOD, CFG.sync);
const PRODUCTO = process.env.NOTION_PRODUCTO;
if (!PRODUCTO) { console.error("Falta NOTION_PRODUCTO"); process.exit(2); }
const REPO_URL = CFG.repo_url + "develop/"; // paquete e historias están en develop
const DS = { historias: "4951a7d0-6388-820e-8c76-87b77818bc9f", paquetes: "66f1a7d0-6388-83f8-881b-0758134faa78" };
const hoy = new Date().toISOString().slice(0, 10);
const dry = process.argv.includes("--dry-run");
const only = (process.argv.find(a => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const out = path.join(S, "carga-cr");
fs.mkdirSync(out, { recursive: true });

const VIGENTES = "01-03 01-05 01-06 01-07 01-08 01-09 01-10 01-11 01-13 01-14 01-15 01-16 01-18 02-01 02-02 02-03 02-05 02-06 02-07 02-08 02-09 02-11 02-12 02-13".split(" ");
const US_DIR = "requirements/context-packs/user-stories/svr-captura-recupero";
const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8" });
const titulo = txt => { const m = txt.replace(/\r\n/g, "\n").match(/^title:\s*(.*)$/m); return m ? m[1].trim().replace(/^"|"$/g, "") : ""; };

const items = [];
const pack = fs.readdirSync(path.join(WT, "requirements/scope-packs")).find(f => /^DSP-003/.test(f));
items.push({ id: "DSP-003", ds: DS.paquetes, repoPath: "requirements/scope-packs/" + pack, props: {}, relations: {} });
for (const n of VIGENTES) {
  const f = fs.readdirSync(path.join(WT, US_DIR)).find(x => x.startsWith("HU-SVR-" + n + "-"));
  if (!f) { console.error("Falta la historia HU-SVR-" + n); process.exit(2); }
  items.push({ id: "HU-SVR-" + n, ds: DS.historias, repoPath: US_DIR + "/" + f,
    props: { "Catálogo": { select: { name: "RCP-002 CL2 SVR captura y recupero" } } },
    relations: { "Paquetes de alcance": { ds: DS.paquetes, ids: ["DSP-003"] } } });
}

const resumen = [];
for (const it of items) {
  if (only.length && !only.includes(it.id)) continue;
  const origen = path.join(out, it.id + "-origen.md"), cuerpo = path.join(out, it.id + "-cuerpo.md"), metaF = path.join(out, it.id + "-meta.json");
  const texto = fs.readFileSync(path.join(WT, it.repoPath), "utf8");
  fs.writeFileSync(origen, texto);
  try { run(path.join(MOD, "scripts", "prepare-body.js"), [it.repoPath, origen, cuerpo, WT, it.id]); }
  catch (e) { resumen.push({ id: it.id, error: "prepare: " + String(e.message).slice(0, 160) }); continue; }
  const meta = { id: it.id, title: titulo(texto) || it.id, props: Object.assign({
    "Ruta en el repo": { rich_text: [{ type: "text", text: { content: it.repoPath } }] },
    "Enlace GitLab": { url: REPO_URL + it.repoPath },
    "Última carga": { date: { start: hoy } },
    "Producto": { relation: [{ id: PRODUCTO }] },
  }, it.props), relations: it.relations };
  fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
  if (dry) { resumen.push({ id: it.id, dry: true, titulo: meta.title.slice(0, 70), bytes: fs.statSync(cuerpo).size }); continue; }
  try {
    const up = JSON.parse(run(SYNC, ["upsert", "--ds", it.ds, "--meta", metaF, "--body", cuerpo, "--source", it.repoPath, "--loaded", hoy]));
    let ver = {};
    try { ver = JSON.parse(run(SYNC, ["verify", "--page", up.page, "--body", cuerpo]).split("\n").filter(l => l.startsWith("{"))[0]); } catch (e) { ver = { ok: false, error: "verify" }; }
    resumen.push({ id: it.id, creada: up.creada, ok: ver.ok, sinResolver: up.sinResolver, page: up.page });
  } catch (e) { resumen.push({ id: it.id, error: "upsert: " + String(e.stderr || e.message).slice(0, 220) }); }
}
fs.writeFileSync(path.join(out, "resumen.json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, fallos: resumen.filter(r => r.error || r.ok === false).length, dry }));
