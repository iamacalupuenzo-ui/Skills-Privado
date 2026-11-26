#!/usr/bin/env node
// Escribe en Notion el contenido que generó armar-mapeo.mjs, por la API de markdown de Notion.
// Solo actualiza páginas que ya existen (su URL en ids.json); crear sigue siendo del modo RECIBIR.
// Reemplaza el contenido de la página y, con --propiedades, también horas, fechas y criterio de cierre.
// La escritura en Notion está aprobada por Enzo (2026-11-26); --seco muestra sin escribir.
//
// Uso: node escribir-notion.mjs <paginas.json> --ids <ids.json> [--solo "IDV-UX · 01"] [--propiedades] [--seco]
// Token: ~/.notion/token.txt (nunca se imprime).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const [rutaPaginas] = process.argv.slice(2);
const rutaIds = arg('--ids');
if (!rutaPaginas || !rutaIds) { console.error('Uso: node escribir-notion.mjs <paginas.json> --ids <ids.json> [--solo CLAVE] [--propiedades] [--seco]'); process.exit(2); }
const SECO = process.argv.includes('--seco');
const PROPS = process.argv.includes('--propiedades');
const SOLO = arg('--solo');
const paginas = JSON.parse(fs.readFileSync(rutaPaginas, 'utf8'));
const ids = JSON.parse(fs.readFileSync(rutaIds, 'utf8'));
const token = fs.readFileSync(path.join(os.homedir(), '.notion', 'token.txt'), 'utf8').trim();
const H = { Authorization: `Bearer ${token}`, 'Notion-Version': '2026-03-11', 'Content-Type': 'application/json' };
const SECCIONES = ['Antes de leer', '## En 30 segundos', '## El relato', '## Alcance', '## Criterios de aceptación', '## Condición de cierre', '## Trazabilidad', '## Resultado', '## Comprueba'];
const idDe = (url) => (url.match(/([0-9a-f]{32})/) || [])[1];

let n = 0;
for (const pg of paginas) {
  if (SOLO && pg.clave !== SOLO) continue;
  const id = ids[pg.clave]?.notion && idDe(ids[pg.clave].notion);
  if (!id) { console.log(`- ${pg.clave}: sin página en ids.json, se omite`); continue; }
  const faltan = SECCIONES.filter((s) => !pg.notion.includes(s));
  if (faltan.length) { console.error(`${pg.clave}: faltan ${faltan.join(', ')}. Regenera con armar-mapeo.mjs.`); process.exit(1); }
  console.log(`${SECO ? '(seco) ' : ''}${pg.nombre}`);
  if (SECO) continue;
  const r = await fetch(`https://api.notion.com/v1/pages/${id}/markdown`, { method: 'PATCH', headers: H, body: JSON.stringify({ type: 'replace_content', replace_content: { new_str: pg.notion } }) });
  if (!r.ok) { console.error(`  ERROR ${r.status}: ${(await r.text()).slice(0, 200)}`); process.exit(1); }
  if (PROPS) {
    const properties = {
      'Horas estimadas': { number: pg.horas },
      'Horas humano estimadas': { number: pg.horas },
      'Criterio de cierre': { rich_text: [{ text: { content: pg.criterio } }] },
      Inicio: { date: { start: pg.inicio } },
      'Fecha límite': { date: { start: pg.limite } },
    };
    const rp = await fetch(`https://api.notion.com/v1/pages/${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ properties }) });
    if (!rp.ok) { console.error(`  ERROR propiedades ${rp.status}: ${(await rp.text()).slice(0, 200)}`); process.exit(1); }
  }
  // Comprobar lo que quedó escrito.
  const g = await (await fetch(`https://api.notion.com/v1/pages/${id}/markdown`, { headers: H })).json();
  const quedaron = SECCIONES.filter((s) => !g.markdown?.includes(s));
  if (quedaron.length) { console.error(`  Notion no guardó ${quedaron.join(', ')}`); process.exit(1); }
  n++;
}
console.log(`\n${SECO ? 'Corrida en seco.' : `${n} páginas actualizadas y comprobadas en Notion.`}`);
