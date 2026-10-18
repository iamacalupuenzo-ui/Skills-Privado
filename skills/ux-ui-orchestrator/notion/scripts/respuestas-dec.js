// Empareja las respuestas ya registradas en DEC-001…DEC-005 con las preguntas cargadas en Notion. SOLO LECTURA.
// Uso: node respuestas-dec.js  -> escribe preguntas/respuestas.json y imprime el resumen.
const fs = require("fs");
const path = require("path");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const leer = f => fs.readFileSync(path.join(WT, f), "utf8").replace(/\r\n/g, "\n");
const limpia = s => String(s || "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
const celdas = l => l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map(x => x.trim());

const { preguntas } = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "extraccion.json"), "utf8"));
const SALTADAS = { "HU-07-02-Q7": "UXR-001-Q2" };
const filas = new Set(preguntas.map(p => p.id).filter(id => !SALTADAS[id]));

function idsEn(texto) {
  const res = new Set();
  for (const m of texto.matchAll(/((?:UXR-\d{3}|HU-\d{2}-\d{2})-Q)(\d+)((?:\s*[\/+]\s*Q?\d+|\s*y\s*Q\d+)*)/g)) {
    res.add(m[1] + m[2]);
    for (const n of m[3].matchAll(/(\d+)/g)) res.add(m[1] + n[1]);
  }
  for (const m of texto.matchAll(/\bARQ-\d+(?:\.\d+)?(?:-[AB])?\b/g)) res.add(m[0]);
  for (const k of ["DOM-CLIENTE-01", "ID-ALTA-01"]) if (texto.includes(k)) res.add(k);
  if (/\bD-03\b|\bP-34\b/.test(texto)) res.add("D-03 / P-34");
  return [...res].map(id => SALTADAS[id] || id).filter(id => filas.has(id));
}

const R = {}; // id -> [{fuente, fecha, texto, confirma}]
const add = (id, a) => { (R[id] = R[id] || []).push(a); };
const noEmparejadas = [];
const MENCION = {}; // id -> Dn citados («sustituida … por DEC-005 Dn») en las filas de los DEC anteriores
const citaDn = (ids, txt) => { for (const m of txt.matchAll(/DEC-005\s+((?:D\d+(?:\s*[\/,y]\s*)?)+)/g)) for (const d of m[1].matchAll(/D\d+/g)) for (const id of ids) (MENCION[id] = MENCION[id] || new Set()).add(d[0]); };

// DEC-002: «### ID / ID» + «**Respuesta literal:** …»
{
  const f = "design/decisiones/DEC-002-respuestas-literales-de-enzo.md", txt = leer(f);
  const cortes = txt.split(/\n(?=### )/).slice(1);
  for (const b of cortes) {
    const enc = b.split("\n")[0].replace(/^###\s*/, "");
    if (/^D\d+/.test(enc)) continue; // las D1… son «Actualización vigente DEC-005», se tratan aparte
    const m = b.match(/\*\*Respuesta literal:\*\*\s*([\s\S]*?)(?:\n\n\*\*Página|\n\n###|$)/);
    if (!m) continue;
    const ids = idsEn(enc);
    if (!ids.length) noEmparejadas.push({ fuente: "DEC-002", enc });
    for (const id of ids) add(id, { fuente: "DEC-002 (respuesta literal de Enzo)", archivo: f, fecha: "2026-10-06", texto: limpia(m[1]), confirma: "" });
  }
}
// DEC-001: tabla A (consulta | resolución) y viñetas de B, C, E, G
{
  const f = "design/decisiones/DEC-001-decisiones-de-enzo-dsp-001.md", L = leer(f).split("\n");
  let sec = "";
  for (const l of L) {
    const h = l.match(/^## ([A-G])\./); if (h) sec = h[1];
    if (/^## Actualizaci/.test(l)) break;
    if (/^- /.test(l)) citaDn(idsEn(l.replace(/^- /, "").split(":")[0]), l);
    if (sec === "A" && l.startsWith("|") && !/^\|\s*(Consulta|-+)/.test(l)) {
      const c = celdas(l), ids = idsEn(c[0]);
      citaDn(ids, l);
      if (!ids.length) { noEmparejadas.push({ fuente: "DEC-001 A", enc: c[0] }); continue; }
      for (const id of ids) add(id, { fuente: "DEC-001 §A (resuelta por Enzo)", archivo: f, fecha: "2026-10-06", texto: limpia(c[1]), confirma: "" });
    } else if (["B", "C", "G"].includes(sec) && /^- /.test(l)) {
      const cabeza = l.replace(/^- /, "").split(":")[0];
      const ids = idsEn(cabeza);
      if (!ids.length) continue;
      const texto = limpia(l.replace(/^- [^:]*:\s*/, ""));
      for (const id of ids) add(id, { fuente: "DEC-001 §" + sec + (sec === "C" ? " (delegada a IA)" : ""), archivo: f, fecha: sec === "G" ? "2026-10-07" : "2026-10-06", texto, confirma: "" });
    }
  }
}
// DEC-004: tablas «Duda | Respuesta de Enzo | Contraste | Quién debe confirmar» (§1 y rondas 2–4)
{
  const f = "design/decisiones/DEC-004-respuestas-de-enzo-a-dud-002-2026-10-13.md", L = leer(f).split("\n");
  let sec = "";
  for (const l of L) {
    const h = l.match(/^## (\d)\./); if (h) sec = h[1];
    if (/^## Actualizaci/.test(l)) break;
    if (!l.startsWith("|") || /^\|\s*(Duda|-+)/.test(l)) continue;
    const c = celdas(l); if (c.length < 2) continue;
    const ids = idsEn(c[0]);
    citaDn(ids, l);
    if (!ids.length) { noEmparejadas.push({ fuente: "DEC-004 §" + sec, enc: c[0].slice(0, 60) }); continue; }
    for (const id of ids) add(id, { fuente: "DEC-004 §" + sec + " (2026-10-13)", archivo: f, fecha: "2026-10-13", texto: limpia(c[1]), confirma: limpia(c[3] || "").replace(/—.*$/, "").trim() });
  }
}
// DEC-005: filas D1…D16 (vigentes) y su vínculo con las preguntas mediante la mención «DEC-005 Dn» en la propia pregunta
const D = {};
{
  const f = "design/decisiones/DEC-005-decisiones-de-enzo-2026-10-14.md";
  for (const l of leer(f).split("\n")) {
    const m = l.match(/^\| (D\d+) \|/); if (!m) continue;
    const c = celdas(l); D[c[0]] = { texto: limpia(c[1]), quien: limpia(c[2]), fecha: limpia(c[3]), estado: limpia(c[4]), archivo: f };
  }
}
const DEC005_DE = {};
for (const p of preguntas) {
  if (SALTADAS[p.id]) continue;
  const t = [p.textos.map(x => x.texto).join(" "), p.estadoTexto, p.bloquea].join(" ");
  const ds = new Set();
  for (const m of t.matchAll(/DEC-005\s+((?:D\d+(?:\s*[\/,y]\s*)?)+)/g)) for (const d of m[1].matchAll(/D\d+/g)) ds.add(d[0]);
  if (ds.size) DEC005_DE[p.id] = [...ds];
}
for (const [id, s] of Object.entries(MENCION)) DEC005_DE[id] = [...new Set([...(DEC005_DE[id] || []), ...s])];
for (const [id, ds] of Object.entries(DEC005_DE)) for (const d of ds) if (D[d]) add(id, { fuente: "DEC-005 " + d + " (vigente)", archivo: D[d].archivo, fecha: D[d].fecha || "2026-10-14", texto: D[d].texto, confirma: "PO", vigente: true });

// Resumen
const con = Object.keys(R), sin = [...filas].filter(id => !R[id]);
const porFuente = {};
for (const id of con) for (const a of R[id]) { const k = a.fuente.split(" ")[0] + " " + (a.fuente.match(/§\w+/) || [""])[0]; porFuente[k.trim()] = (porFuente[k.trim()] || 0) + 1; }
fs.writeFileSync(path.join(S, "preguntas", "respuestas.json"), JSON.stringify({ R, D: Object.keys(D), DEC005_DE, noEmparejadas }, null, 1));
console.log(JSON.stringify({
  preguntasConRespuesta: con.length, sinRespuestaRegistrada: sin.length, respuestasPorFuente: porFuente, filasDEC005: Object.keys(D).length,
  preguntasLigadasADEC005: Object.keys(DEC005_DE).length, noEmparejadas: noEmparejadas.length, variasRespuestas: con.filter(id => R[id].length > 1).length,
}, null, 1));
console.log("sin respuesta:", sin.join(", "));
console.log("no emparejadas:", JSON.stringify(noEmparejadas));
