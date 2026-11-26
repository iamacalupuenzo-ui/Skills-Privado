#!/usr/bin/env node
// Carga en Notion un paquete (DSP) y sus historias tal como están en la KB (origin/develop).
// Es parte obligatoria del paso 0 del orquestador: sin esto, Notion muestra historias viejas.
//
//   node cargar-paquete.js DSP-009 --kb <clon de la KB> [--ref origin/develop] [--dry-run] [--only=HU-01-16]
//
// - Lee cada archivo con `git show <ref>:<ruta>`, nunca la carpeta de trabajo.
// - Las historias salen de la tabla «Historias incluidas» del paquete.
// - Busca la página por ID y, en las historias, también por Catálogo (el mismo ID existe en otros catálogos).
// - Conserva lo que la página tenga arriba del aviso «Contenido generado desde el repositorio» (el resumen).
// - Las relaciones se agregan sin quitar las que ya tenga (segunda pasada --solo-relaciones).
// - El Producto de cada historia es el del paquete (CL2 Flotas, no el Piloto).
// - Verifica cada página después de subirla. Token: NOTION_TOKEN o ~/.notion/token.txt (nunca se imprime).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = path.resolve(__dirname, "..");
const CFG = JSON.parse(fs.readFileSync(path.join(MOD, "config.json"), "utf8"));
const SYNC = path.resolve(MOD, CFG.sync);
const DS = { historias: "4951a7d0-6388-820e-8c76-87b77818bc9f", paquetes: "66f1a7d0-6388-83f8-881b-0758134faa78" };
const CATALOGO = "RCP-001 CL2 Flotas";
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const dsp = process.argv[2];
const KB = arg("--kb", process.env.NOTION_WORKTREE || CFG.worktree);
const REF = arg("--ref", "origin/develop");
const dry = process.argv.includes("--dry-run");
const only = (process.argv.find(a => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
if (!/^DSP-\d{3}$/.test(dsp || "") || !KB) { console.error("uso: node cargar-paquete.js DSP-NNN --kb <clon de la KB> [--ref origin/develop] [--dry-run]"); process.exit(2); }

const git = (...a) => execFileSync("git", ["-C", KB, ...a], { encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] });
const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
const out = path.join(os.tmpdir(), "carga-" + dsp.toLowerCase());
fs.mkdirSync(out, { recursive: true });
const commit = git("rev-parse", REF).trim();

function token() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN.trim();
  const f = path.join(os.homedir(), ".notion", "token.txt");
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8").split(/\r?\n/)[0].trim() : "";
}
async function api(method, url, body) {
  const r = await fetch("https://api.notion.com/v1" + url, { method, body: body && JSON.stringify(body),
    headers: { Authorization: "Bearer " + token(), "Notion-Version": "2026-03-11", "Content-Type": "application/json" } });
  if (!r.ok) throw new Error(method + " " + url + " -> " + r.status);
  return r.json();
}
async function buscar(ds, id, extra) {
  const porId = { property: "ID", rich_text: { equals: id } };
  const r = await api("POST", "/data_sources/" + ds + "/query", { filter: extra ? { and: [porId, extra] } : porId, page_size: 2 });
  return r.results || [];
}
// Lo que está arriba del aviso generado es de la página (su resumen) y se conserva. Sin aviso y corto, todo es resumen.
function resumenDe(md) {
  const i = md.search(/<callout>\s*Contenido generado desde el repositorio/);
  if (i >= 0) return md.slice(0, i).trim();
  return md.length < 3000 ? md.trim() : null;
}
const run = (script, a) => execFileSync("node", [script, ...a], { encoding: "utf8" });
const ultimaLinea = s => JSON.parse(s.trim().split("\n").filter(l => l.startsWith("{")).pop());
const titulo = t => { const m = t.replace(/\r\n/g, "\n").match(/^title:\s*(.*)$/m); return m ? m[1].trim().replace(/^["']|["']$/g, "") : ""; };

(async () => {
  const packs = git("ls-tree", "--name-only", REF, "requirements/scope-packs/").split("\n").filter(f => path.basename(f).startsWith(dsp + "-"));
  if (packs.length !== 1) throw new Error(dsp + ": " + packs.length + " archivos del paquete en " + REF);
  const textoPack = git("show", REF + ":" + packs[0]).replace(/\r\n/g, "\n");
  const seccion = (textoPack.split(/^## Historias incluidas/m)[1] || "").split(/^## /m)[0];
  const historias = [...seccion.matchAll(/^\|\s*\[(HU-\d+-\d+)\]\(([^)]+)\)/gm)]
    .map(m => ({ id: m[1], ruta: decodeURIComponent(m[2].replace(/^.*?\/-\/blob\/[^/]+\//, "")) }));
  if (!historias.length) throw new Error(dsp + ": la tabla «Historias incluidas» no lista historias");

  const items = [{ id: dsp, ds: DS.paquetes, ruta: packs[0], props: {}, filtro: null, relaciones: null }]
    .concat(historias.map(h => ({ id: h.id, ds: DS.historias, ruta: h.ruta,
      props: { "Catálogo": { select: { name: CATALOGO } } },
      filtro: { property: "Catálogo", select: { equals: CATALOGO } },
      relaciones: { "Paquetes de alcance": { ds: DS.paquetes, ids: [dsp] } } })));

  // Las historias pertenecen al mismo Producto que su paquete (p. ej. CL2 Flotas): se copia del paquete.
  // Así una historia vieja que apuntaba a otro producto (el Piloto) vuelve a aparecer en las vistas del producto.
  const pagPaquete = (await buscar(DS.paquetes, dsp))[0];
  const producto = pagPaquete ? (pagPaquete.properties.Producto?.relation || []).map(x => ({ id: x.id })) : [];
  if (producto.length) for (const it of items) if (it.ds === DS.historias) it.props["Producto"] = { relation: producto };

  const resumen = [];
  for (const it of items) {
    if (only.length && !only.includes(it.id)) continue;
    const r = { id: it.id, ruta: it.ruta };
    try {
      const texto = git("show", REF + ":" + it.ruta);
      const origen = path.join(out, it.id + "-origen.md"), cuerpo = path.join(out, it.id + "-cuerpo.md");
      const metaF = path.join(out, it.id + "-meta.json"), resF = path.join(out, it.id + "-resumen.md");
      fs.writeFileSync(origen, texto);
      run(path.join(__dirname, "prepare-body.js"), [it.ruta, origen, cuerpo, KB, it.id]);
      const paginas = await buscar(it.ds, it.id, it.filtro);
      if (paginas.length > 1) throw new Error("hay " + paginas.length + " páginas con " + it.id + " en el mismo catálogo: se resuelve a mano antes de cargar");
      const pagina = paginas[0];
      let resumenPagina = "";
      if (pagina) {
        const md = (await api("GET", "/pages/" + pagina.id + "/markdown")).markdown || "";
        const res = resumenDe(md);
        if (res === null) throw new Error("la página tiene contenido largo sin el aviso generado: revísala antes de reemplazarla");
        resumenPagina = res;
      }
      fs.writeFileSync(resF, resumenPagina ? resumenPagina + "\n\n" : "");
      // El Nombre de una página que ya existe no se toca (otros scripts la buscan por él). Una nueva sigue la convención «ID — título».
      const nombreActual = pagina ? (pagina.properties.Nombre?.title || []).map(x => x.plain_text).join("") : "";
      const t = titulo(texto) || it.id;
      const nombre = nombreActual || (t.startsWith(it.id) ? t : it.id + " — " + t.replace(/^Paquete\s*[-—:]\s*/i, ""));
      const meta = { id: it.id, title: nombre, page: pagina && pagina.id, filtro: it.filtro || undefined, props: Object.assign({
        "Ruta en el repo": { rich_text: [{ type: "text", text: { content: it.ruta } }] },
        "Enlace GitLab": { url: CFG.repo_url + "develop/" + it.ruta },
        "Última carga": { date: { start: hoy } },
      }, it.props) };
      fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
      Object.assign(r, { pagina: pagina ? pagina.id : "(nueva)", conservaResumen: !!resumenPagina, bytes: fs.statSync(cuerpo).size });
      if (dry) { r.dry = true; resumen.push(r); continue; }
      const up = ultimaLinea(run(SYNC, ["upsert", "--ds", it.ds, "--meta", metaF, "--body", cuerpo, "--summary", resF, "--source", it.ruta, "--loaded", hoy]));
      r.pagina = up.page; r.creada = up.creada;
      if (it.relaciones) {
        const relF = path.join(out, it.id + "-rel.json");
        fs.writeFileSync(relF, JSON.stringify({ id: it.id, title: meta.title, page: up.page, filtro: it.filtro, relations: it.relaciones }));
        r.sinResolver = ultimaLinea(run(SYNC, ["upsert", "--ds", it.ds, "--meta", relF, "--solo-relaciones"])).sinResolver;
      }
      // La página es resumen + cuerpo: se verifica contra los dos juntos.
      const esperado = path.join(out, it.id + "-esperado.md");
      fs.writeFileSync(esperado, fs.readFileSync(resF, "utf8") + fs.readFileSync(cuerpo, "utf8"));
      let ver;
      try { ver = run(SYNC, ["verify", "--page", up.page, "--body", esperado]); } catch (e) { ver = String(e.stdout || ""); }
      ver = ver.split("\n").find(l => l.startsWith("{"));
      r.ok = ver ? JSON.parse(ver).ok : false;
      if (!r.ok) r.verificacion = ver;
    } catch (e) { r.error = String(e.stderr || e.message).split("\n").filter(Boolean)[0].slice(0, 200); }
    resumen.push(r);
  }
  const fin = { paquete: dsp, ref: REF, commit: commit.slice(0, 8), dry, total: resumen.length,
    ok: resumen.filter(r => r.ok).length, fallos: resumen.filter(r => r.error || r.ok === false).length, items: resumen };
  fs.writeFileSync(path.join(out, "resumen.json"), JSON.stringify(fin, null, 1));
  console.log(JSON.stringify(fin));
  process.exit(fin.fallos ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
