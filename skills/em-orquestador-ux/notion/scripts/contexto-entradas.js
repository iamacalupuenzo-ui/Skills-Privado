// Prepara las entradas por lotes (4 preguntas) para que un modelo redacte título, contexto, alternativas y propuesta. SOLO LECTURA.
// Uso: node contexto-entradas.js  -> preguntas/ctx/entrada-N.json y prompt-N.md
const fs = require("fs");
const path = require("path");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const B = 4;
const out = path.join(S, "preguntas", "ctx");
fs.mkdirSync(out, { recursive: true });
const { preguntas } = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "extraccion.json"), "utf8"));
const { R } = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "respuestas.json"), "utf8"));
const limpia = s => String(s || "").replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();

const PILOTO = ["UXR-007-Q6", "UXR-017-Q2", "UXR-001-Q8", "UXR-010-Q2", "UXR-013-Q3", "UXR-024-Q2", "ARQ-12", "UXR-004-Q1", "UXR-016-Q7", "UXR-014-Q3", "UXR-001-Q7"];
const DUPLICADAS = ["UXR-010-Q1", "UXR-010-Q5", "UXR-012-Q1", "UXR-014-Q2", "UXR-003-Q1"];
const CERRADAS_ARQ = ["ARQ-08", "ARQ-11.5", "ARQ-10.1", "ARQ-09.3", "HU-07-02-Q8"];
const EXCLUIR = new Set([...PILOTO, ...DUPLICADAS, ...CERRADAS_ARQ, "HU-07-02-Q7"]);

const uxrDocs = fs.readdirSync(path.join(WT, "design/ux-requirements")).filter(f => /^UXR-\d+/.test(f));
const docDe = id => { const m = id.match(/^UXR-(\d{3})/); if (m) return "design/ux-requirements/" + uxrDocs.find(f => f.startsWith("UXR-" + m[1])); return id.startsWith("HU-") ? "requirements/context-packs/user-stories (historia " + id.replace(/-Q\d+$/, "") + ")" : "design/dudas/DUD-002-decisiones-para-definir-el-diseno.md"; };

const items = preguntas.filter(p => !EXCLUIR.has(p.id)).map(p => ({
  id: p.id,
  documento: docDe(p.id),
  texto_original: limpia((p.textos[0] || {}).texto || (p.dud2 && p.dud2.pregunta) || (p.cpo && p.cpo.aclarar) || ""),
  estado_en_el_documento: limpia(p.estadoTexto).slice(0, 500),
  responsable: limpia(p.responsable || (p.cpo && p.cpo.responsable) || (p.dud2 && p.dud2.responsable)),
  prioridad: limpia(p.prioridad || (p.cpo && p.cpo.prioridad)),
  bloquea: limpia(p.bloquea || (p.cpo && p.cpo.bloquea)).slice(0, 200),
  contexto_cpo001: p.cpo && p.cpo.bloque ? limpia(p.cpo.bloque).slice(0, 1800) : "",
  ejemplo_dud002: p.dud2 && p.dud2.ejemplo ? limpia(p.dud2.ejemplo).slice(0, 500) : "",
  respuestas_registradas: (R[p.id] || []).slice(0, 3).map(a => ({ fuente: a.fuente, fecha: a.fecha, texto: limpia(a.texto).slice(0, 500) })),
}));

const PLANTILLA = fs.readFileSync(path.join(MOD, "scripts", "contexto-prompt-plantilla.md"), "utf8");
let lote = 0;
for (let i = 0; i < items.length; i += B) {
  lote++;
  const trozo = items.slice(i, i + B);
  fs.writeFileSync(path.join(out, "entrada-" + lote + ".json"), JSON.stringify(trozo, null, 1));
  fs.writeFileSync(path.join(out, "prompt-" + lote + ".md"), PLANTILLA.replace("{{ENTRADA}}", () => JSON.stringify(trozo, null, 1)));
}
console.log(JSON.stringify({ preguntas: items.length, lotes: lote, excluidas: EXCLUIR.size }));
