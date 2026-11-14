// Carga una UXS de un paquete (UXS-003 a UXS-006) en la base «Especificaciones UX»: propiedades, veredictos (transcritos del propio documento), relaciones y cuerpo.
// Las relaciones se leen de la propia UXS: UXR, flujos, pantallas e historias (secciones 1, 2 y 4) y preguntas abiertas (sección 5). No aprueba nada ni modifica veredictos.
// Uso: NOTION_WORKTREE=<worktree con la UXS> DESIGN_REF=<rama ya subida> node cargar-uxs-paquete.js <ruta de la UXS en el repo> [--dry-run]
// Requiere que la rama esté subida: «Enlace GitLab» apunta a DESIGN_REF y daría 404 si no existe.
const fs = require("fs");
const { registrarDocumento } = require('./registrar-huella.js');
const { snapshot: snapshotHuella, configuracion: configuracionHuella } = require('./kb-preguntas.js');
const cfgHuella = configuracionHuella(), kbHuella = snapshotHuella(cfgHuella);
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = path.resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(fs.readFileSync(path.join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || path.join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = process.env.NOTION_SYNC || path.resolve(MOD, CFG.sync);
const REPO_URL = CFG.repo_url;
const DESIGN_REF = process.env.DESIGN_REF || CFG.design_ref;
// Producto al que cuelgan las pantallas de DSP-004 a DSP-007 en Notion (leído de la fila de SCR-075; no es el de DSP-001).
const PRODUCTO = process.env.NOTION_PRODUCTO || "4161a7d0-6388-8101-9c4b-e9b2eef812f5";
const DS = {
  uxs: "23c1a7d0-6388-8293-bac3-871f76aac85e", paq: "66f1a7d0-6388-83f8-881b-0758134faa78", hu: "4951a7d0-6388-820e-8c76-87b77818bc9f",
  uxr: "6361a7d0-6388-8376-816d-076587d56e7f", flw: "3a91a7d0-6388-83d7-972f-07afabf710e0", scr: "a101a7d0-6388-8200-ace3-0747fc33b0fb",
  preg: "9811a7d0-6388-829a-82b4-0735e973e46b",
};
const repoPath = process.argv[2];
const dry = process.argv.includes("--dry-run");
if (!repoPath || !/^design\/specs\/UXS-\d+/.test(repoPath)) { console.error("Uso: node cargar-uxs-paquete.js design/specs/UXS-00N-....md [--dry-run]"); process.exit(2); }
const hoy = new Date().toISOString().slice(0, 10);
const txt = fs.readFileSync(path.join(WT, repoPath), "utf8").replace(/\r\n/g, "\n");
const id = (/^id:\s*(UXS-\d+)/m.exec(txt) || [])[1];
const titulo = (/^title:\s*"([^"]+)"/m.exec(txt) || [])[1];
const paquete = (/\(paquete (DSP-\d+)\)/.exec(txt) || [])[1];
if (!id || !titulo || !paquete) { console.error("No pude leer id, título o paquete de la UXS"); process.exit(2); }

const unicos = (a) => [...new Set(a)];
const sec = (n) => { const m = new RegExp("\\n## " + n + "\\.[^\\n]*\\n([\\s\\S]*?)(?=\\n## \\d\\.|$)").exec(txt); return m ? m[1] : ""; };
const s1 = sec(1), s2 = sec(2), s4 = sec(4), s5 = sec(5);
const historias = unicos((/Historias en alcance:\*\*\s*([^\n]*)/.exec(s1) || [, ""])[1].match(/HU-\d+-\d+/g) || []);
const filasDe = (tipo) => s2.split("\n").filter((l) => l.startsWith("| " + tipo + " |"));
const uxr = unicos(filasDe("UX Requirement").map((l) => (l.match(/UXR-\d+/) || [])[0]).filter(Boolean));
const flw = unicos(filasDe("User Flow").map((l) => (l.match(/FLW-\d+/) || [])[0]).filter(Boolean));
const scr = unicos(s4.split("\n").map((l) => (/^\| (SCR-\d+) \|/.exec(l) || [])[1]).filter(Boolean));
const preg = unicos(s5.split("\n").map((l) => (/^\| ((?:UXR|FLW|SCR)-\d+-Q\d+) \|/.exec(l) || [])[1]).filter(Boolean));
// Veredictos: se transcriben de la tabla «6. Preparación por consumidor»
const veredicto = (consumidor) => (new RegExp("\\| " + consumidor + " \\| \\**(READY|CONDITIONAL|NOT READY)").exec(sec(6)) || [])[1] || null;
// El veredicto de la exploración visual (Claude Design) queda en el cuerpo de la UXS. La propiedad de la base se llama hoy «Veredicto Stitch» y NO se usa para ese veredicto
// (quedaría mal etiquetado). Si algún día existe una propiedad propia, definir NOTION_PROP_DISENO con su nombre.
const PROP_DISENO = process.env.NOTION_PROP_DISENO || null;
const vDiseno = veredicto("Claude Design \\(exploración visual\\)"), vQA = veredicto("QA");
const fechaEsp = (/^\s+at:\s*"(\d{4}-\d{2}-\d{2})/m.exec(txt) || [, hoy])[1];

const meta = {
  id, title: titulo,
  props: Object.assign({
    "Estado del documento": { select: { name: "Borrador" } },
    "Ruta en el repo": { rich_text: [{ type: "text", text: { content: repoPath } }] },
    "Enlace GitLab": { url: REPO_URL + DESIGN_REF + "/" + repoPath },
    "Última carga": { date: { start: hoy } },
    "Fecha de la especificación": { date: { start: fechaEsp } },
    "Producto": { relation: [{ id: PRODUCTO }] },
    "Nivel de cierre": { select: { name: "En curso" } },
  }, vDiseno && PROP_DISENO ? { [PROP_DISENO]: { select: { name: vDiseno } } } : {}, vQA ? { "Veredicto QA": { select: { name: vQA } } } : {}),
  relations: {
    "Paquetes de alcance": { ds: DS.paq, ids: [paquete] },
    "Historias": { ds: DS.hu, ids: historias },
    "Requerimientos UX": { ds: DS.uxr, ids: uxr },
    "Flujos": { ds: DS.flw, ids: flw },
    "Pantallas": { ds: DS.scr, ids: scr },
    "Preguntas": { ds: DS.preg, ids: preg },
  },
};
const out = path.join(S, "uxs");
fs.mkdirSync(out, { recursive: true });
const mF = path.join(out, id + "-meta.json");
fs.writeFileSync(mF, JSON.stringify(meta, null, 1));
const origen = path.join(out, id + "-origen.md"), cuerpo = path.join(out, id + "-cuerpo.md");
fs.writeFileSync(origen, txt);
const resumenMeta = { id, paquete, vDiseno, vQA, historias: historias.length, uxr: uxr.length, flw: flw.length, scr: scr.length, preguntas: preg.length, enlace: meta.props["Enlace GitLab"].url };
if (dry) { console.log(JSON.stringify({ dry: true, ...resumenMeta })); process.exit(0); }
const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8", env: Object.assign({}, process.env, { DESIGN_REF }) });
try {
  run(path.join(MOD, "scripts", "prepare-body.js"), [repoPath, origen, cuerpo, WT, id]);
  const up = JSON.parse(run(SYNC, ["upsert", "--ds", DS.uxs, "--meta", mF, "--body", cuerpo, "--source", repoPath, "--loaded", hoy]));
  let ver = {};
  try { ver = JSON.parse(run(SYNC, ["verify", "--page", up.page, "--body", cuerpo]).split("\n").filter((l) => l.startsWith("{"))[0]); } catch (e) { ver = { ok: false }; }
  if (ver.ok) registrarDocumento(cfgHuella, kbHuella, id, txt);
  const res = { ...resumenMeta, creada: up.creada, ok: ver.ok, page: up.page, sinResolver: up.sinResolver || [] };
  fs.writeFileSync(path.join(out, id + "-resumen.json"), JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res));
} catch (e) { console.log(JSON.stringify({ id, error: String(e.stderr || e.message).slice(0, 300) })); }
