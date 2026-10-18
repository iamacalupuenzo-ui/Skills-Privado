// Valida las fichas de contexto que redactó el modelo (salida-N.json) y las une en preguntas/ctx/fichas.json. SOLO LECTURA.
// Uso: node contexto-validar.js
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const dir = path.join(S, "preguntas", "ctx");
const git = (...a) => execFileSync("git", ["-C", WT, ...a], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

// Catálogos vigentes (origin/develop) para comprobar identificadores citados
const huc = git("show", "origin/develop:requirements/context-packs/user-stories/HUC-00-catalogo-reglas-y-backlog.md");
const rcp = git("show", "origin/develop:requirements/context-packs/RCP-001-cl2-flotas-estandar.md");
const archivos = git("ls-tree", "-r", "--name-only", "origin/develop");
const BR = new Set([...huc.matchAll(/^\|\s*(BR-\d+)\s*\|/gm)].map(m => m[1]));
const DH = new Set([...rcp.matchAll(/^\|\s*(DH-\d+)\s*\|/gm)].map(m => m[1]));
const ARQ = new Set([...rcp.matchAll(/^\|\s*(ARQ-[\d.]+(?:-[AB])?)\s*\|/gm)].map(m => m[1]));
const HU = new Set([...archivos.matchAll(/user-stories\/(HU-\d{2}-\d{2})-/g)].map(m => m[1]));
const existe = id => {
  if (/^BR-/.test(id)) return BR.has(id);
  if (/^DH-/.test(id)) return DH.has(id);
  if (/^ARQ-/.test(id)) return ARQ.has(id) || ARQ.has(id.replace(/-[AB]$/, ""));
  if (/^HU-/.test(id)) return HU.has(id) || /HUC-/.test(huc) && new RegExp("\\b" + id + "\\b").test(huc);
  if (/^SCR-/.test(id)) return +id.slice(4) >= 1 && +id.slice(4) <= 15;
  if (/^FLW-/.test(id)) return +id.slice(4) >= 1 && +id.slice(4) <= 5;
  if (/^UXR-/.test(id)) return +id.slice(4, 7) >= 1 && +id.slice(4, 7) <= 25;
  if (/^INV-/.test(id)) return +id.slice(4) >= 1 && +id.slice(4) <= 3;
  return true;
};

const QUIEN = ["Diseño", "Negocio", "Arquitectura o Seguridad", "Mixta"];
const entradas = {};
for (const f of fs.readdirSync(dir).filter(x => /^entrada-\d+\.json$/.test(x))) for (const e of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))) entradas[e.id] = e;

const fichas = {}, problemas = [];
const nota = (id, nivel, msg) => problemas.push({ id, nivel, msg });
let archivosLeidos = 0;
for (const f of fs.readdirSync(dir).filter(x => /^salida-\d+\.json$/.test(x)).sort((a, b) => parseInt(a.slice(7)) - parseInt(b.slice(7)))) {
  archivosLeidos++;
  let arr;
  try { arr = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8").replace(/^\uFEFF/, "").trim().replace(/^```(?:json)?\s*|\s*```$/g, "")); }
  catch (e) { nota(f, "ERROR", "JSON inválido: " + e.message.slice(0, 80)); continue; }
  for (const x of arr) {
    const id = x.id;
    if (!entradas[id]) { nota(id, "ERROR", "id que no está en la entrada"); continue; }
    if (!(typeof x.titulo === "string" && /^¿.*\?$/.test(x.titulo.trim()) && x.titulo.length <= 140)) nota(id, "ERROR", "título no es una pregunta completa ≤140: " + String(x.titulo).slice(0, 60));
    if (!QUIEN.includes(x.quien)) nota(id, "ERROR", "quien inválido: " + x.quien);
    for (const k of ["contexto", "evalua"]) if (!x[k] || String(x[k]).length < 25) nota(id, "ERROR", k + " vacío o muy corto");
    if (!Array.isArray(x.alternativas) || x.alternativas.length < 2 || x.alternativas.length > 4) nota(id, "ERROR", "alternativas fuera de 2–4");
    else for (const a of x.alternativas) if (!a.clave || !a.texto || !a.efecto || !["repo", "IA"].includes(a.origen)) nota(id, "ERROR", "alternativa incompleta " + a.clave);
    const r = x.recomendacion;
    if (r) {
      for (const k of ["opcion", "respuesta", "porque", "limites"]) if (!r[k]) nota(id, "ERROR", "recomendación sin " + k);
      if (!Array.isArray(r.como) || !r.como.length) nota(id, "ERROR", "recomendación sin pasos");
      if (!Array.isArray(r.evidencia) || !r.evidencia.length) nota(id, "AVISO", "recomendación sin evidencia");
      if (r.diagrama && !/^(flowchart|sequenceDiagram|stateDiagram)/.test(r.diagrama.trim())) nota(id, "ERROR", "diagrama no es Mermaid válido");
      if (r.diagrama && /```/.test(r.diagrama)) nota(id, "ERROR", "diagrama con cercas");
      if (!["Diseño", "Mixta"].includes(x.quien)) nota(id, "AVISO", "recomendación en pregunta de " + x.quien);
      for (const ev of r.evidencia || []) if (/https?:\/\//.test(JSON.stringify(ev))) nota(id, "AVISO", "evidencia con URL: " + JSON.stringify(ev).slice(0, 80));
    } else if (x.quien === "Diseño") nota(id, "AVISO", "pregunta de Diseño sin recomendación");
    // identificadores citados
    const texto = JSON.stringify(x);
    const ids = [...new Set((texto.match(/\b(?:BR-\d+|DH-\d+|ARQ-\d+(?:\.\d+)?(?:-[AB])?|HU-\d{2}-\d{2}|SCR-\d{3}|FLW-\d{3}|UXR-\d{3}|INV-\d{3})\b/g) || []))];
    const desconocidos = ids.filter(i => !existe(i));
    if (desconocidos.length) nota(id, "ERROR", "identificadores inexistentes: " + desconocidos.join(", "));
    fichas[id] = x;
  }
}
const faltan = Object.keys(entradas).filter(id => !fichas[id]);
fs.writeFileSync(path.join(dir, "fichas.json"), JSON.stringify(fichas, null, 1));
fs.writeFileSync(path.join(dir, "problemas.json"), JSON.stringify(problemas, null, 1));
const c = { diseno: 0, negocio: 0, arq: 0, mixta: 0 };
for (const x of Object.values(fichas)) c[{ "Diseño": "diseno", "Negocio": "negocio", "Arquitectura o Seguridad": "arq", "Mixta": "mixta" }[x.quien]]++;
console.log(JSON.stringify({ archivos: archivosLeidos, fichas: Object.keys(fichas).length, esperadas: Object.keys(entradas).length, faltan: faltan.length, errores: problemas.filter(p => p.nivel === "ERROR").length, avisos: problemas.filter(p => p.nivel === "AVISO").length, porTipo: c, conRecomendacion: Object.values(fichas).filter(x => x.recomendacion).length, conDiagrama: Object.values(fichas).filter(x => x.recomendacion && x.recomendacion.diagrama).length, cerradas: Object.values(fichas).filter(x => x.cerrada).length }));
for (const p of problemas.slice(0, 40)) console.log(p.nivel, p.id, "-", p.msg);
