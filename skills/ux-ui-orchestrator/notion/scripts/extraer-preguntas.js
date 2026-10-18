// Extracción de SOLO LECTURA de las preguntas del diseño. No toca Notion ni el repo.
// Uso: node extraer-preguntas.js  -> escribe preguntas/extraccion.json y imprime el resumen.
const fs = require("fs");
const path = require("path");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const D = "C:/Users/emacalupu/Documents/00 - Proyectos Enzo - V1/kb-ux-uxr/design";
const leer = f => fs.readFileSync(path.join(D, f), "utf8").replace(/\r\n/g, "\n");
const ID_Q = /\b(UXR-\d{3}-Q\d+|HU-\d{2}-\d{2}-Q\d+)\b/g;
const celdas = l => { const c = l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map(x => x.trim()); return c; };
const limpia = s => s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

const P = {}; // id -> registro
const reg = id => (P[id] = P[id] || { id, textos: [], responsable: "", prioridad: "", bloquea: "", estadoTexto: "", fuentes: [], alias: [], notas: [] });

// 1) Tablas «# Open questions» de cada UXR (fuente canónica)
const uxrDir = "ux-requirements";
for (const f of fs.readdirSync(path.join(D, uxrDir)).filter(x => /^UXR-\d+.*\.md$/.test(x)).sort()) {
  const ruta = uxrDir + "/" + f, txt = leer(ruta), uxr = f.match(/^(UXR-\d+)/)[1];
  const i = txt.search(/^#{1,3} Open questions/m); if (i < 0) continue;
  const resto = txt.slice(i).split("\n"); let cab = null;
  for (let k = 1; k < resto.length; k++) {
    const l = resto[k];
    if (/^#{1,3} /.test(l)) break;
    if (!l.startsWith("|")) continue;
    const c = celdas(l);
    if (/^-+$/.test(c[0].replace(/[: ]/g, ""))) continue;
    if (/^ID$/i.test(c[0])) { cab = c.map(x => x.toLowerCase()); continue; }
    const m = c[0].match(/^(UXR-\d{3}-Q\d+|HU-\d{2}-\d{2}-Q\d+)/); if (!m) continue;
    const r = reg(m[1]);
    const col = n => { const j = cab ? cab.findIndex(x => x.startsWith(n)) : -1; return j >= 0 ? limpia(c[j] || "") : ""; };
    r.textos.push({ fuente: ruta, texto: col("pregunta") || limpia(c[1] || "") });
    r.responsable = r.responsable || col("responsable");
    r.prioridad = r.prioridad || col("prioridad");
    r.bloquea = r.bloquea || col("bloquea");
    r.estadoTexto = r.estadoTexto || col("estado");
    r.fuentes.push(ruta); r.uxrDueno = r.uxrDueno || (m[1].startsWith("UXR") ? "UXR-" + m[1].slice(4, 7) : uxr);
    if (c.length > (cab ? cab.length : 6)) r.notas.push("fila con más celdas que el encabezado en " + ruta);
  }
}

// 2) CPO-001: sección A (encabezados ####) y C (tabla). Aporta bloqueo, prioridad, responsable sugerido, alias.
const cpoRuta = "consultas/CPO-001-consultas-al-product-owner-dsp-001.md", cpo = leer(cpoRuta).split("\n");
let seccion = "";
for (let k = 0; k < cpo.length; k++) {
  const l = cpo[k];
  const s = l.match(/^## ([ABC])\./); if (s) seccion = s[1];
  if (seccion === "A" && /^#### /.test(l)) {
    const t = l.replace(/^#### /, ""), partes = t.split(/\s+—\s+/), ids = (partes[0].match(ID_Q) || []);
    const extra = (partes[0].match(/\b(D-\d+|P-\d+)\b/g) || []);
    let bloque = ""; for (let j = k + 1; j < cpo.length && !/^#{1,4} /.test(cpo[j]); j++) bloque += cpo[j] + "\n";
    const rp = (bloque.match(/Responsable sugerido \/ Prioridad \/ Bloquea:\*\*\s*(.*)/) || [])[1] || "";
    const [resp, prio, bloq] = rp.split(" / ").map(x => limpia(x || ""));
    const aclarar = limpia((bloque.match(/Qué hay que aclarar[^:]*:\*\*\s*(.*)/) || [])[1] || "");
    const todos = ids.length ? ids : [];
    for (const id of todos) {
      const r = reg(id);
      r.cpo = { titulo: limpia(partes[1] || ""), responsable: resp, prioridad: prio, bloquea: bloq, aclarar, seccion: "A (bloquea el paso a flujos)", bloque: bloque.trim() };
      r.fuentes.push(cpoRuta); if (todos.length > 1) r.alias = [...new Set([...r.alias, ...todos.filter(x => x !== id)])];
    }
    if (!ids.length) { const clave = extra.join(" / ") || limpia(partes[0]); const r = reg(clave); r.cpo = { titulo: limpia(partes[1] || ""), responsable: resp, prioridad: prio, bloquea: bloq, aclarar, seccion: "A (bloquea el paso a flujos)", bloque: bloque.trim() }; r.fuentes.push(cpoRuta); r.sinIdCanonico = true; }
  }
  if (seccion === "C" && l.startsWith("|")) {
    const c = celdas(l), m = c[0].match(/^(UXR-\d{3}-Q\d+|HU-\d{2}-\d{2}-Q\d+)$/); if (!m) continue;
    const r = reg(m[1]); r.cpo = { titulo: "", responsable: limpia(c[3] || ""), prioridad: limpia(c[4] || ""), bloquea: "No", aclarar: limpia(c[2] || ""), seccion: "C (no bloquea)" };
    r.fuentes.push(cpoRuta);
  }
}

// 3) DUD-002: tablas con ID | Pregunta | Responsable | Ejemplo. Aporta preguntas de arquitectura/negocio y alias «A = B».
const dudRuta = "dudas/DUD-002-decisiones-para-definir-el-diseno.md", dud = leer(dudRuta).split("\n");
let cabD = null, secD = "";
for (const l of dud) {
  if (/^## Estado de la revisi/.test(l)) break;
  const h = l.match(/^## (\d\..*)/); if (h) secD = h[1];
  if (!l.startsWith("|")) continue;
  const c = celdas(l);
  if (/^-+$/.test(c[0].replace(/[: ]/g, ""))) continue;
  if (/^ID$/i.test(c[0])) { cabD = c.map(x => x.toLowerCase()); continue; }
  if (!cabD || !c[0]) continue;
  const ids = c[0].replace(/\s+—\s+.*$/, "").split(/\s*(?:=|\+)\s*/).map(x => x.trim()).filter(Boolean);
  const col = n => { const j = cabD.findIndex(x => x.startsWith(n)); return j >= 0 ? limpia(c[j] || "") : ""; };
  for (const id of ids) {
    const esQ = ID_Q.test(id); ID_Q.lastIndex = 0;
    const r = reg(id);
    r.dud2 = { seccion: secD, pregunta: col("pregunta"), responsable: col("responsable"), ejemplo: col("ejemplo").slice(0, 400), respuesta: col("respuesta") };
    r.fuentes.push(dudRuta);
    if (ids.length > 1) r.alias = [...new Set([...r.alias, ...ids.filter(x => x !== id)])];
    if (!esQ) r.noEsQDeUxr = true;
  }
}

// 4) DUD-001 §1: filas E-n (puntos que Enzo debe responder), con las Q que citan
const d1Ruta = "dudas/DUD-001-dudas-y-preguntas-dsp-001.md", d1 = leer(d1Ruta).split("\n");
const E = [];
for (const l of d1) {
  if (!/^\| E-\d+ /.test(l)) continue;
  const c = celdas(l); E.push({ id: c[0], estado: limpia(c[1] || "").slice(0, 300), siguiente: limpia(c[2] || ""), cita: [...new Set((l.match(ID_Q) || []))] });
}

// Resumen
const lista = Object.values(P);
const esUxrQ = r => /^(UXR-\d{3}-Q\d+|HU-\d{2}-\d{2}-Q\d+)$/.test(r.id);
const conFuenteUxr = lista.filter(r => r.textos.length);
const soloCpo = lista.filter(r => !r.textos.length && esUxrQ(r));
const noQ = lista.filter(r => !esUxrQ(r));
const sinTexto = lista.filter(r => !r.textos.length && !r.dud2 && !(r.cpo && r.cpo.aclarar));
fs.mkdirSync(path.join(S, "preguntas"), { recursive: true });
fs.writeFileSync(path.join(S, "preguntas", "extraccion.json"), JSON.stringify({ preguntas: lista, E }, null, 1));
const por = {}; for (const r of lista) { const k = r.id.startsWith("UXR") ? "UXR-Q" : r.id.startsWith("HU-") ? "HU-Q" : "otro"; por[k] = (por[k] || 0) + 1; }
console.log(JSON.stringify({
  total: lista.length, porTipo: por, conTextoEnUXR: conFuenteUxr.length, soloEnCPO001: soloCpo.map(r => r.id), noSonQdeUXR: noQ.map(r => r.id),
  sinTextoUtil: sinTexto.map(r => r.id), conAlias: lista.filter(r => r.alias.length).length, filasE: E.length,
  filasIrregulares: lista.filter(r => r.notas.length).map(r => r.id),
}, null, 1));
