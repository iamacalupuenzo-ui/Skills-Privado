// Busca tablas cuyas filas tienen un número de celdas distinto al del encabezado.
// Uso: node tablas-irregulares.js <carpeta con *-cuerpo.md>
const fs = require("fs");
const dir = process.argv[2];
const cells = r => r.replace(/^\|/, "").replace(/\|\s*$/, "").split(/(?<!\\)\|/).length;
let total = 0;
for (const f of fs.readdirSync(dir).filter(x => x.endsWith("-cuerpo.md"))) {
  const L = fs.readFileSync(dir + "/" + f, "utf8").split("\n");
  let inCode = false;
  for (let i = 0; i < L.length; i++) {
    if (/^\s*```/.test(L[i])) inCode = !inCode;
    if (inCode || !/^\|/.test(L[i]) || !/^\|[\s:|-]+\|?\s*$/.test(L[i + 1] || "")) continue;
    const w = cells(L[i]);
    let j = i + 2; const malas = [];
    while (j < L.length && /^\|/.test(L[j])) { const c = cells(L[j]); if (c !== w) malas.push("L" + (j + 1) + ":" + c); j++; }
    if (malas.length) { total++; console.log(f.replace("-cuerpo.md", ""), "tabla L" + (i + 1), "encabezado", w, "cols | filas distintas:", malas.slice(0, 4).join(" ")); }
    i = j;
  }
}
console.log("tablas irregulares:", total);
