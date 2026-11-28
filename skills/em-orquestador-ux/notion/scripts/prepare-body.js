// Prepara el cuerpo de un archivo del repo para subirlo a Notion.
// Uso: node prepare-body.js <ruta-en-repo> <origen> <salida> [<raiz-git> <id-propio>]
// - quita el frontmatter YAML
// - convierte enlaces relativos a URLs absolutas de GitLab (rama develop)
// - si se da <raiz-git>: enlaza BR-nnn, DH-nn, ARQ-nn, HUC-00:Lnnn y HU-xx-yy al archivo/línea del repo (origin/develop)
const fs = require("fs");
const path = require("path").posix;
const { execFileSync } = require("child_process");

const CFG = JSON.parse(fs.readFileSync(require("path").join(__dirname, "..", "config.json"), "utf8"));
const REPO_URL = CFG.repo_url;
const BASE = REPO_URL + "develop/";
// Los documentos de diseño viven en la rama del worktree hasta que se integre el MR (DESIGN_REF=develop después).
const baseFor = p => REPO_URL + (p.startsWith("design/") ? (process.env.DESIGN_REF || "develop") : "develop") + "/";
const [repoPath, src, out, gitRoot, ownId] = process.argv.slice(2);
if (!repoPath || !src || !out) { console.error("uso: node prepare-body.js <ruta-en-repo> <origen> <salida> [<raiz-git> <id-propio>]"); process.exit(2); }

let text = fs.readFileSync(src, "utf8").replace(/\r\n/g, "\n");
const m = text.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
if (m) text = m[1];

// 1) enlaces relativos -> absolutos
const dir = path.dirname(repoPath);
let rewritten = 0, kept = 0;
text = text.replace(/\]\(([^)\s]+)\)/g, (all, target) => {
  if (/^(https?:|mailto:)/i.test(target)) { kept++; return all; }
  if (target.startsWith("#")) { kept++; return all; }
  const [file, hash] = target.split("#");
  const resolved = path.normalize(path.join(dir, file));
  if (resolved.startsWith("..")) { kept++; return all; }
  rewritten++;
  return "](" + baseFor(resolved) + resolved + (hash ? "#" + hash : "") + ")";
});

// 2) enlazar referencias (BR, DH, ARQ, HUC-00:L, HU)
const stats = { BR: 0, DH: 0, ARQ: 0, HUC: 0, HU: 0, sinDestino: new Set() };
if (gitRoot) {
  const git = (...a) => execFileSync("git", ["-C", gitRoot, ...a], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const US = "requirements/context-packs/user-stories/";
  const HUC = US + "HUC-00-catalogo-reglas-y-backlog.md";
  const RCP = "requirements/context-packs/RCP-001-cl2-flotas-estandar.md";
  const rowIndex = (file, re) => {
    const idx = {};
    git("show", "origin/develop:" + file).split("\n").forEach((l, i) => {
      const r = l.match(re); if (r && !(r[1] in idx)) idx[r[1]] = i + 1;
    });
    return idx;
  };
  const brIdx = rowIndex(HUC, /^\|\s*(BR-\d+)\s*\|/);
  const dhIdx = rowIndex(RCP, /^\|\s*(DH-\d+)\s*\|/);
  const arqIdx = rowIndex(RCP, /^\|\s*(ARQ-\d+(?:\.\d+)?)[\s,|]/);
  const slug = s => s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");
  const rcpSec = {};
  git("show", "origin/develop:" + RCP).split("\n").forEach(l => {
    const h = l.match(/^#{1,6}\s+(\d+(?:\.\d+)*)\.?\s+(.*)$/); if (h && !(h[1] in rcpSec)) rcpSec[h[1]] = slug(h[1] + " " + h[2]);
  });
  const IMD = "business/information-model/IMD-001-cl2-flotas.md";
  const huFiles = {};
  git("ls-tree", "--name-only", "origin/develop", US).split("\n").forEach(p => {
    const mm = p.match(/\/(HU-\d{2}-\d{2})-[^/]+\.md$/); if (mm) huFiles[mm[1]] = p;
  });
  // Historias candidatas (sin archivo propio): definidas como encabezado en un catálogo HUC-0x o como fila del backlog en HUC-00.
  const huCand = {};
  const cats = git("ls-tree", "--name-only", "origin/develop", US).split("\n")
    .filter(p => /\/HUC-\d+-[^/]+\.md$/.test(p))
    .sort((a, b) => (/HUC-00-/.test(a) ? 1 : 0) - (/HUC-00-/.test(b) ? 1 : 0) || a.localeCompare(b));
  for (const f of cats) {
    git("show", "origin/develop:" + f).split("\n").forEach((l, i) => {
      const r = l.match(/^(?:#{2,6}\s*|\|\s*\[?)(HU-\d{2}-\d{2})\b/);
      if (r && !(r[1] in huCand)) huCand[r[1]] = { file: f, line: i + 1 };
    });
  }
  const link = (label, file, line) => "[" + label + "](" + BASE + file + (line ? "#L" + line : "") + ")";

  const TOKEN = /HUC-00:L(\d+)(?:-(\d+))?((?:,\s*L\d+(?:-\d+)?)*)|\b(BR-\d+)\b|\b(DH-\d+)\b|\b(ARQ-\d+(?:\.\d+)?)\b|\b(HU-\d{2}-\d{2})\b(?!-Q\d)|RCP-001 §(\d+(?:\.\d+)*)|\b(IMD-001)\b/g;
  const PROTEGIDO = /`[^`]*`|\[[^\]]*\]\([^)]*\)/g;
  const linkify = (gap) => gap.replace(TOKEN, (all, l1, l2, resto, br, dh, arq, hu, rcp, imd) => {
    if (l1) {
      stats.HUC++;
      let t = link("HUC-00:L" + l1 + (l2 ? "-" + l2 : ""), HUC, l1 + (l2 ? "-L" + l2 : ""));
      if (resto) t += resto.replace(/L(\d+)(?:-(\d+))?/g, (x, a, b) => link("L" + a + (b ? "-" + b : ""), HUC, a + (b ? "-L" + b : "")));
      return t;
    }
    if (br)  { if (brIdx[br])  { stats.BR++;  return link(br,  HUC, brIdx[br]); }  stats.sinDestino.add(br);  return all; }
    if (dh)  { if (dhIdx[dh])  { stats.DH++;  return link(dh,  RCP, dhIdx[dh]); }  stats.sinDestino.add(dh);  return all; }
    if (arq) { if (arqIdx[arq]){ stats.ARQ++; return link(arq, RCP, arqIdx[arq]);} stats.sinDestino.add(arq); return all; }
    if (hu)  { if (hu === ownId) return all; if (huFiles[hu]) { stats.HU++; return link(hu, huFiles[hu]); } if (huCand[hu]) { stats.HUC_CAND = (stats.HUC_CAND || 0) + 1; return link(hu, huCand[hu].file, huCand[hu].line); } stats.sinDestino.add(hu); return all; }
    if (rcp) { stats.RCP = (stats.RCP || 0) + 1; return "[" + all + "](" + BASE + RCP + (rcpSec[rcp] ? "#" + rcpSec[rcp] : "") + ")"; }
    if (imd) { stats.IMD = (stats.IMD || 0) + 1; return link(imd, IMD); }
    return all;
  });

  let enCodigo = false;
  text = text.split("\n").map(line => {
    if (/^\s*```/.test(line)) { enCodigo = !enCodigo; return line; }
    if (enCodigo || /^#{1,6}\s/.test(line)) return line;
    let res = "", last = 0, mm;
    PROTEGIDO.lastIndex = 0;
    while ((mm = PROTEGIDO.exec(line)) !== null) {
      res += linkify(line.slice(last, mm.index)) + mm[0];
      last = mm.index + mm[0].length;
    }
    return res + linkify(line.slice(last));
  }).join("\n");
}

fs.writeFileSync(out, text);
const links = (text.match(/\]\([^)\s]+\)/g) || []);
const relativos = links.filter(l => !/^\]\((https?:|mailto:|#)/i.test(l)).length;
console.log(JSON.stringify({
  lineas: text.split("\n").length, enlacesReescritos: rewritten, relativosRestantes: relativos,
  enlazados: { BR: stats.BR, DH: stats.DH, ARQ: stats.ARQ, HUC: stats.HUC, HU: stats.HU, HUcand: stats.HUC_CAND || 0, RCP: stats.RCP || 0, IMD: stats.IMD || 0 },
  sinDestino: [...stats.sinDestino].slice(0, 12)
}));
