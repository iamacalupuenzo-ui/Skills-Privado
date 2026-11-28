// Une los lotes de Codex, valida campos y longitudes, y muestra los resúmenes.
// Uso: node unir-resumenes.js [--ver]
const fs = require("fs");
const dir = "C:/Users/EMACAL~1/AppData/Local/Temp/claude/C--Users-emacalupu-Documents-00---Proyectos-Enzo---V1-knowledge-base/d35797f7-63f1-4bee-bdc7-989b47a095a5/scratchpad/notion-review/resumenes";
const max = { permite: 200, para: 120, ve: 220, estado: 260 };
const todos = [];
for (let n = 1; n <= 5; n++) {
  const t = fs.readFileSync(dir + "/lote-" + n + ".json", "utf8").trim().replace(/^```json\s*|```$/g, "");
  todos.push(...JSON.parse(t));
}
// Correcciones del validador (Claude) sobre lo que redactó Codex: acortar «estado» y no presentar propuestas como hechos.
const correcciones = {
  "UXR-006": { estado: "Confirmado: datos obligatorios, país único, contacto y alta sin usuarios (HU-01-01, BR-236/256). Estado Activo, valores regionales y validación previa son propuestas de DEC-005 pendientes del PO y chocan con AC-7/BR-249. Abiertas: UXR-006-Q3/Q9." },
  "UXR-009": { estado: "Confirmado: WCAG 2.2 AA (HU-01-01 §9); no hay pantalla evaluada. Resumen de errores y numeración de contactos son propuestas. Los cambios de DEC-005 D1/D12 chocan con AC-7/BR-249 y esperan al PO. Abiertas: UXR-009-Q1/Q2." },
  "UXR-010": { estado: "Confirmado: cuatro elementos, herencia, logotipo obligatorio y auditoría (AC-1/2/9/14; BR-240/257/261). DEC-005 D2/D3/D10 es decisión de Enzo pendiente del PO; permisos y dos vías del editor chocan con BR-258. Abiertas: HU-01-09-Q8, UXR-010-Q2/Q3/Q6/Q7." },
  "UXR-023": { estado: "Confirmado: mismo alcance en ambos canales y aviso sin Grupos (AC-9/10; BR-005/220/245). Aviso para otros vacíos: UXR-023-Q1. El onboarding es propuesta de Enzo, pendiente del PO y bloqueada por una contradicción: UXR-023-Q3." },
  "UXR-014": { ve: "Se propone que, al editar un color bajo el mínimo, un panel muestre la relación e «Insuficiente», la pestaña marque error y el foco vaya al color, sin permitir guardar. El editor funciona con teclado y lector de pantalla." },
};
for (const r of todos) Object.assign(r, correcciones[r.id] || {});
let problemas = 0;
for (const r of todos) {
  for (const c of Object.keys(max)) {
    if (!r[c] || typeof r[c] !== "string") { console.log(r.id, "falta", c); problemas++; }
    else if (r[c].length > max[c] + 30) { console.log(r.id, c, "largo", r[c].length, "(máx", max[c] + ")"); problemas++; }
    else if (/\n|\*\*|^#/.test(r[c])) { console.log(r.id, c, "contiene formato"); problemas++; }
  }
}
fs.writeFileSync(dir + "/resumenes-uxr.json", JSON.stringify(todos, null, 1));
// Almacén definitivo FUERA del repo, con la huella (sha1) del documento fuente al redactar el resumen.
if (problemas === 0 || process.argv.includes("--guardar")) {
  const crypto = require("crypto");
  const destDir = "C:/Users/emacalupu/.claude/notion"; fs.mkdirSync(destDir, { recursive: true });
  const almacen = {};
  for (const r of todos) {
    const origen = dir + "/../uxr/" + r.id + "-origen.md";
    const hash = fs.existsSync(origen) ? crypto.createHash("sha1").update(fs.readFileSync(origen, "utf8").replace(/\r\n/g, "\n")).digest("hex") : null;
    almacen[r.id] = { permite: r.permite, para: r.para, ve: r.ve, estado: r.estado, hash, redactado: new Date().toISOString().slice(0, 10), autor: "Codex, validado por Claude" };
  }
  fs.writeFileSync(destDir + "/resumenes-uxr.json", JSON.stringify(almacen, null, 1));
  console.log("guardado en", destDir + "/resumenes-uxr.json");
}
console.log("total:", todos.length, "| problemas de forma:", problemas);
if (process.argv.includes("--ver")) {
  for (const r of todos) console.log("\n" + r.id + "\n  permite: " + r.permite + "\n  para:    " + r.para + "\n  ve:      " + r.ve + "\n  estado:  " + r.estado);
}
