#!/usr/bin/env node
// Detecta decisiones del PO (filas DH de RCP-001 §10) que retiran, difieren o tocan decisiones de UX,
// y comprueba que cada una tenga su pregunta en un UXR (Diferida o Cerrada) y, si queda diferida, su aviso.
// Caso que lo originó: DH-659 (2026-10-28) quitó isotipo, tipografías y escala de colores; el isotipo
// quedó sin pregunta ni aviso hasta el 2026-11-26 (Enzo no se enteró).
//
// Uso (desde la raíz de la KB, sin modificar nada):
//   node decisiones-retiradas.mjs [--kb <ruta>] [--paquete DSP-009] [--todo] [--json]
// Lee el árbol de trabajo de la KB. Sale con código 1 si hay retiros sin pregunta o diferidas sin aviso.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const kb = path.resolve(opt('--kb') ?? '.');
const paquete = opt('--paquete');
const comoJson = args.includes('--json');
const todo = args.includes('--todo');

const leer = (r) => fs.readFileSync(path.join(kb, r), 'utf8');
const listar = (dir) => {
  const abs = path.join(kb, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { recursive: true }).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f).replaceAll('\\', '/'));
};

// 1. Filas DH candidatas. «UX»: citan una decisión o pregunta de UX (DEC-*, UXR-*-Q*) o una propuesta de Enzo; esas se exigen.
//    «Alcance»: solo retiran o difieren alcance; se listan como información con --todo.
const TOCA_UX = /\bDEC-\d+|\bUXR-\d+(-Q\d+)?|propuest[ao] de Enzo|Enzo Macalupu|\bUX\b/;
const RETIRO = /(otra|siguiente) versi[oó]n|se quitan? de la micro ?UI|fuera del (piloto|Sprint)|se difiere|diferid[ao]/i;
const rcp = leer('requirements/context-packs/RCP-001-cl2-flotas-estandar.md');
let filas = rcp.split('\n').filter((l) => /^\| DH-\d+ \|/.test(l)).map((l) => {
  const celdas = l.split('|').map((c) => c.trim());
  return { id: celdas[1], texto: celdas[2] ?? '', fuentes: celdas[3] ?? '' };
}).map((f) => ({ ...f, nivel: TOCA_UX.test(f.texto + ' ' + f.fuentes) ? 'UX' : 'Alcance' }))
  .filter((f) => (f.nivel === 'UX' && (RETIRO.test(f.texto) || /\bDEC-\d+/.test(f.texto + f.fuentes))) || (todo && RETIRO.test(f.texto)));

// 2. Filtro por paquete: HU y BR que nombra su scope pack.
if (paquete) {
  const sp = listar('requirements/scope-packs').find((f) => path.basename(f).startsWith(paquete));
  if (!sp) { console.error(`No hay scope pack de ${paquete}`); process.exit(2); }
  const ids = new Set(leer(sp).match(/\b(HU-\d{2}-\d{2}|BR-\d+)\b/g) ?? []);
  filas = filas.filter((f) => (f.texto + ' ' + f.fuentes).match(/\b(HU-\d{2}-\d{2}|BR-\d+)\b/g)?.some((x) => ids.has(x)));
}

// 3. Preguntas UXR que citan cada DH (con su estado) y avisos que lo citan.
const uxr = listar('design/ux-requirements').map((f) => ({ f, s: leer(f) }));
const avisos = listar('avisos').map((f) => ({ f, s: leer(f) }));
const reporte = filas.map((dh) => {
  const re = new RegExp(`\\b${dh.id}\\b`);
  const preguntas = [];
  for (const { f, s } of uxr) {
    for (const l of s.split('\n')) {
      const m = l.match(/^\| ((?:UXR|HU)-[\w-]+-Q\d+) \|/);
      if (m && re.test(l)) {
        const estado = (l.split('|').map((c) => c.trim())[6] ?? '').replace(/\*/g, '');
        preguntas.push({ id: m[1], estado, archivo: f });
      }
    }
  }
  const avisosDh = avisos.filter(({ s }) => re.test(s)).map(({ f, s }) => ({ archivo: f, publicado: /status:\s*"?SENT/.test(s) }));
  const diferidas = preguntas.filter((p) => /Diferida/i.test(p.estado));
  const problemas = [];
  if (dh.nivel !== 'UX') return { ...dh, texto: dh.texto.slice(0, 220), preguntas, avisos: avisosDh, problemas };
  if (!preguntas.length) problemas.push('sin pregunta en ningún UXR: lo retirado no consta como Diferida ni como Cerrada');
  if (diferidas.length && !avisosDh.some((a) => a.publicado)) problemas.push('tiene preguntas Diferidas pero ningún aviso publicado al Analista Funcional');
  return { ...dh, texto: dh.texto.slice(0, 220), preguntas, avisos: avisosDh, problemas };
});

const conProblemas = reporte.filter((r) => r.problemas.length);
if (comoJson) {
  console.log(JSON.stringify({ kb, paquete, revisadas: reporte.length, conProblemas: conProblemas.length, reporte }, null, 2));
} else {
  console.log(`Decisiones del PO revisadas${paquete ? ` (${paquete})` : ''}: ${reporte.length} · con faltantes: ${conProblemas.length}`);
  for (const r of reporte) {
    console.log(`\n${r.problemas.length ? '[FALTA]' : '[ok]   '} ${r.id}: ${r.texto}`);
    for (const p of r.preguntas) console.log(`   pregunta ${p.id} · ${p.estado || 'sin estado'} · ${p.archivo}`);
    for (const a of r.avisos) console.log(`   aviso ${a.publicado ? 'publicado' : 'borrador'} · ${a.archivo}`);
    for (const p of r.problemas) console.log(`   -> ${p}`);
  }
  if (conProblemas.length) console.log('\nRevisa cada [FALTA] con Enzo: lo que retiró el PO y él había decidido va como pregunta Diferida (prioridad «Obligatoria en la siguiente versión» en Preguntas) y con aviso en la Issue de la historia.');
}
process.exit(conProblemas.length ? 1 : 0);
