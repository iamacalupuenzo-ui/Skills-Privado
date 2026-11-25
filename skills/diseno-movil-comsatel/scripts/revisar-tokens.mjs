#!/usr/bin/env node
// revisar-tokens.mjs — busca colores literales y medidas sueltas en código Dart de widgets.
//
// Contrato
//   Entrada : node revisar-tokens.mjs <archivo.dart | carpeta> [--incluir-ilustraciones]
//             node revisar-tokens.mjs --selftest
//   Salida  : una línea por hallazgo `ruta:línea: tipo: texto` y un resumen final.
//   Código  : 0 sin hallazgos · 1 con hallazgos · 2 entrada inválida (ruta inexistente o sin .dart).
//   Solo lee: no modifica ningún archivo.
//
// Qué marca
//   color-literal   `Color(0x...)` y `Colors.algo` (salvo `Colors.transparent`): el color debe salir de `context.cs`.
//   medida-suelta   un número mayor que 0 dentro de `EdgeInsets.*(...)`, `BorderRadius.circular(n)`,
//                   `Radius.circular(n)`, `SizedBox(width|height: n)`, `size: n` o `fontSize: n`:
//                   debe salir de `CsPadding`, `CsGap`, `CsSize`, `CsRadius` o de un estilo de texto del sistema.
//
// Qué NO marca (operaciones que requieren juicio): proporciones dentro de un `CustomPainter`, fracciones de
//   un tamaño recibido, alfa de colores, duraciones y curvas. Por eso excluye por defecto los archivos de
//   ilustraciones; usa --incluir-ilustraciones para revisarlos igual.
//
// Excepciones explícitas: una línea con o precedida por un comentario `token-excepcion` (con o sin tilde) se
//   acepta; el comentario debe decir por qué (por ejemplo: «token-excepcion: radio de 28 dp de Material 3, sin token»).

import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EXCLUIDOS_POR_DEFECTO = ['_illustration', 'vehicle_illustrations', 'function_illustrations', '.g.dart', 'main_preview', `${sep}preview${sep}`, `${sep}test${sep}`];
const NUM = String.raw`(?<![\w.])[1-9]\d*(?:\.\d+)?(?![\w])|(?<![\w.])0\.\d*[1-9]\d*(?![\w])`;
const REGLAS = [
  { tipo: 'color-literal', re: /\bColor\(\s*0x[0-9a-fA-F]+\s*\)/ },
  { tipo: 'color-literal', re: /\bColors\.(?!transparent\b)[a-zA-Z]+/ },
  { tipo: 'medida-suelta', re: new RegExp(String.raw`EdgeInsets\.\w+\([^)]*(?:${NUM})`) },
  { tipo: 'medida-suelta', re: new RegExp(String.raw`(?:Border)?Radius\.circular\(\s*(?:${NUM})`) },
  { tipo: 'medida-suelta', re: new RegExp(String.raw`SizedBox\([^)]*\b(?:width|height):\s*(?:${NUM})`) },
  { tipo: 'medida-suelta', re: new RegExp(String.raw`\b(?:size|fontSize):\s*(?:${NUM})`) },
];
const EXCEPCION = /token-excepci[oó]n/i;

function listarDart(ruta, incluirIlustraciones) {
  const st = statSync(ruta);
  const salida = [];
  const visitar = (p) => {
    const s = statSync(p);
    if (s.isDirectory()) {
      for (const n of readdirSync(p)) if (n !== 'node_modules' && n !== '.git' && n !== 'build') visitar(join(p, n));
    } else if (extname(p) === '.dart') {
      if (!incluirIlustraciones && EXCLUIDOS_POR_DEFECTO.some((x) => p.includes(x))) return;
      salida.push(p);
    }
  };
  visitar(ruta);
  return { st, salida };
}

export function revisarTexto(texto) {
  const lineas = texto.split(/\r?\n/);
  const hallazgos = [];
  lineas.forEach((l, i) => {
    const t = l.trim();
    if (t.startsWith('//')) return;
    const previa = i > 0 ? lineas[i - 1] : '';
    if (EXCEPCION.test(l) || EXCEPCION.test(previa)) return;
    const codigo = l.replace(/\/\/.*$/, '');
    for (const r of REGLAS) {
      if (r.re.test(codigo)) {
        hallazgos.push({ linea: i + 1, tipo: r.tipo, texto: t });
        break;
      }
    }
  });
  return hallazgos;
}

function principal(args) {
  const incluir = args.includes('--incluir-ilustraciones');
  const ruta = args.find((a) => !a.startsWith('--'));
  if (!ruta) { console.error('Uso: revisar-tokens.mjs <archivo.dart|carpeta> [--incluir-ilustraciones]'); return 2; }
  const abs = resolve(ruta);
  if (!existsSync(abs)) { console.error(`No existe la ruta: ${abs}`); return 2; }
  const { salida } = listarDart(abs, incluir);
  if (salida.length === 0) { console.error(`No hay archivos .dart que revisar en: ${abs}`); return 2; }
  let total = 0;
  for (const f of salida) {
    for (const h of revisarTexto(readFileSync(f, 'utf8'))) {
      console.log(`${f}:${h.linea}: ${h.tipo}: ${h.texto}`);
      total++;
    }
  }
  console.log(`${salida.length} archivos revisados, ${total} hallazgos`);
  return total > 0 ? 1 : 0;
}

function autoprueba() {
  const dir = mkdtempSync(join(tmpdir(), 'rev-tokens-'));
  const aqui = fileURLToPath(import.meta.url);
  const correr = (...a) => spawnSync(process.execPath, [aqui, ...a], { encoding: 'utf8' });
  let fallos = 0;
  const esperar = (nombre, ok) => { console.log(`${ok ? 'OK ' : 'FALLA'} ${nombre}`); if (!ok) fallos++; };
  try {
    writeFileSync(join(dir, 'malo.dart'), [
      'final a = Color(0xFF112233);',
      'final b = Colors.red;',
      'final c = EdgeInsets.all(12);',
      'final d = BorderRadius.circular(8);',
      'final e = SizedBox(width: 40);',
      'final f = Icon(Icons.add, size: 24);',
    ].join('\n'));
    writeFileSync(join(dir, 'bueno.dart'), [
      'final a = context.cs.textBaseDefault;',
      'final b = EdgeInsets.all(CsPadding.xl);',
      'final c = BorderRadius.circular(CsRadius.x2xl);',
      'final d = SizedBox(width: CsSize.lg);',
      'final e = Colors.transparent;',
      '// token-excepcion: radio de 28 dp de Material 3, sin token',
      'const r = BorderRadius.circular(28);',
      'final g = EdgeInsets.zero;',
      'final h = EdgeInsets.all(0);',
    ].join('\n'));
    const malo = correr(join(dir, 'malo.dart'));
    esperar('caso con fallos: sale 1 y marca las 6 líneas', malo.status === 1 && /6 hallazgos/.test(malo.stdout));
    const bueno = correr(join(dir, 'bueno.dart'));
    esperar('caso limpio: sale 0 (token, transparent, excepción comentada, cero)', bueno.status === 0 && /0 hallazgos/.test(bueno.stdout));
    const noExiste = correr(join(dir, 'no-existe'));
    esperar('ruta inexistente: sale 2', noExiste.status === 2);
    const sinDart = correr(dir + sep + '..' + sep + 'ruta-vacia-' + Date.now());
    esperar('ruta inválida repetida: sale 2, sin tocar nada', sinDart.status === 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(fallos === 0 ? 'Autoprueba: todo bien' : `Autoprueba: ${fallos} fallos`);
  return fallos === 0 ? 0 : 1;
}

const args = process.argv.slice(2);
process.exit(args.includes('--selftest') ? autoprueba() : principal(args));
