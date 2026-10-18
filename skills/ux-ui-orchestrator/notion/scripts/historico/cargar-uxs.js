// Carga UXS-001 en la base «Especificaciones UX»: propiedades, veredictos por consumidor (transcritos del propio documento), relaciones y cuerpo.
// Uso: node cargar-uxs.js [--dry-run]. Los veredictos son los que declara UXS-001 (2026-10-14); el agente no los modifica ni aprueba nada.
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
const PRODUCTO = "3fb1a7d0-6388-814e-8cce-f48a414b5cf2";
const DS = {
  uxs: "23c1a7d0-6388-8293-bac3-871f76aac85e", paq: "66f1a7d0-6388-83f8-881b-0758134faa78", hu: "4951a7d0-6388-820e-8c76-87b77818bc9f",
  uxr: "6361a7d0-6388-8376-816d-076587d56e7f", flw: "3a91a7d0-6388-83d7-972f-07afabf710e0", scr: "a101a7d0-6388-8200-ace3-0747fc33b0fb",
  ib: "fb11a7d0-6388-8315-bbe5-8723b8807a73", preg: "9811a7d0-6388-829a-82b4-0735e973e46b",
};
const hoy = new Date().toISOString().slice(0, 10);
const dry = process.argv.includes("--dry-run");
const out = path.join(S, "uxs");
fs.mkdirSync(out, { recursive: true });
const repoPath = "design/specs/UXS-001-dsp-001-alta-identidad-login-esac.md";

const pad = (n, k) => String(n).padStart(k, "0");
const rango = (pre, a, b, k) => Array.from({ length: b - a + 1 }, (_, i) => pre + pad(a + i, k));
const { preguntas } = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "extraccion.json"), "utf8"));
const idsPreg = preguntas.map(p => p.id).filter(id => id !== "HU-07-02-Q7");

const meta = {
  id: "UXS-001", title: "UXS-001 — DSP-001: especificación de diseño UX/UI",
  props: {
    "Estado del documento": { select: { name: "Borrador" } },
    "Ruta en el repo": { rich_text: [{ type: "text", text: { content: repoPath } }] },
    "Enlace GitLab": { url: REPO_URL + DESIGN_REF + "/" + repoPath },
    "Última carga": { date: { start: hoy } },
    "Fecha de la especificación": { date: { start: "2026-10-13" } },
    "Producto": { relation: [{ id: PRODUCTO }] },
    "Veredicto Stitch": { select: { name: "NOT READY" } },
    "Veredicto QA": { select: { name: "CONDITIONAL" } },
    "Nivel de cierre": { select: { name: "En curso" } },
  },
  relations: {
    "Paquetes de alcance": { ds: DS.paq, ids: ["DSP-001"] },
    "Historias": { ds: DS.hu, ids: ["HU-01-01", "HU-01-09", "HU-02-01", "HU-02-02", "HU-07-02"] },
    "Requerimientos UX": { ds: DS.uxr, ids: rango("UXR-", 1, 25, 3) },
    "Flujos": { ds: DS.flw, ids: rango("FLW-", 1, 5, 3) },
    "Pantallas": { ds: DS.scr, ids: rango("SCR-", 1, 15, 3) },
    "Exploraciones": { ds: DS.ib, ids: rango("IB-", 1, 5, 3) },
    "Preguntas": { ds: DS.preg, ids: idsPreg.slice(0, 100) },
  },
};
const mF = path.join(out, "UXS-001-meta.json");
fs.writeFileSync(mF, JSON.stringify(meta, null, 1));
const origen = path.join(out, "UXS-001-origen.md"), cuerpo = path.join(out, "UXS-001-cuerpo.md");
const txt = fs.readFileSync(path.join(WT, repoPath), "utf8").replace(/\r\n/g, "\n");
fs.writeFileSync(origen, txt);
const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8", env: Object.assign({}, process.env, { DESIGN_REF }) });
if (dry) { console.log(JSON.stringify({ dry: true, preguntas: idsPreg.length, bytes: txt.length })); process.exit(0); }
try {
  run(path.join(MOD, "scripts", "prepare-body.js"), [repoPath, origen, cuerpo, WT, "UXS-001"]);
  const up = JSON.parse(run(SYNC, ["upsert", "--ds", DS.uxs, "--meta", mF, "--body", cuerpo, "--source", repoPath, "--loaded", hoy]));
  // Notion admite como máximo 100 elementos por relación en una petición: el resto se añade después (unión)
  let extra = null;
  if (idsPreg.length > 100) {
    const mR = path.join(out, "UXS-001-rel2.json");
    fs.writeFileSync(mR, JSON.stringify({ id: "UXS-001", title: "UXS-001", relations: { "Preguntas": { ds: DS.preg, ids: idsPreg.slice(100) } } }));
    extra = JSON.parse(run(SYNC, ["upsert", "--ds", DS.uxs, "--meta", mR, "--solo-relaciones"]));
  }
  let ver = {};
  try { ver = JSON.parse(run(SYNC, ["verify", "--page", up.page, "--body", cuerpo]).split("\n").filter(l => l.startsWith("{"))[0]); } catch (e) { ver = { ok: false }; }
  const res = { id: "UXS-001", creada: up.creada, ok: ver.ok, page: up.page, sinResolver: [].concat(up.sinResolver || [], extra ? extra.sinResolver || [] : []) };
  fs.writeFileSync(path.join(S, "uxs", "resumen.json"), JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res));
} catch (e) { console.log(JSON.stringify({ id: "UXS-001", error: String(e.stderr || e.message).slice(0, 300) })); }
