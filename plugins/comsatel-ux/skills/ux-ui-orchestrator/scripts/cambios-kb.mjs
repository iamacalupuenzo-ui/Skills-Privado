#!/usr/bin/env node
// ¿Qué cambió en la KB? Compara una revisión base con `develop` y responde, para un paquete (DSP):
//   1. el inventario de sus historias (HU) y del paquete, con la fecha y el autor de su última actualización;
//   2. lo que cambió desde la base: historias, paquete, avisos (AVS), consultas y respuestas (QST/RSP),
//      decisiones y artefactos de diseño, con la sección tocada (p. ej. «AC-4»);
//   3. las preguntas abiertas del paquete y de sus historias, y las de UX (UXR, FLW, SCR) que las citan;
//   4. el efecto en cadena: qué artefactos de diseño y qué tareas de Notion trabajan sobre lo que cambió.
// Lee la KB con `git show`/`git log` (no cambia la rama ni el árbol) y Notion con GET/query.
// Escribe el informe pedido y, con --registrar, la revisión vista en ~/.comsatel/revision-kb.json.
//   5. Carga obligatoria (Enzo, 2026-11-26): sube a Notion el paquete y sus historias tal como están en
//      la KB, con notion/scripts/cargar-paquete.js. Es mecánica (la estructura es la misma) y no pide
//      aprobación. Solo se omite con --sin-carga o si esta copia del skill no trae el módulo de Notion.
//
// Uso: node cambios-kb.mjs DSP-009 --kb <knowledge-base> [--ref origin/develop] [--desde <commit|AAAA-MM-DD>]
//        [--sin-fetch] [--sin-notion] [--sin-carga] [--informe salida.md] [--json salida.json] [--registrar]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opcion = (n, def) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : def; };
const bandera = (n) => args.includes(n);
const dsp = args.find((a) => /^DSP-\d+$/i.test(a))?.toUpperCase();
const kb = opcion('--kb', process.env.NOTION_WORKTREE);
const ref = opcion('--ref', 'origin/develop');
const ESTADO = path.join(os.homedir(), '.comsatel', 'revision-kb.json');
if (!dsp || !kb) {
  console.error('Uso: node cambios-kb.mjs DSP-009 --kb <knowledge-base> [--desde <commit|AAAA-MM-DD>] [--informe salida.md] [--registrar]');
  process.exit(2);
}

const git = (...a) => execFileSync('git', ['-C', kb, ...a], { encoding: 'utf8', maxBuffer: 256 << 20 }).replace(/\r\n/g, '\n');
const gitSeguro = (...a) => { try { return execFileSync('git', ['-C', kb, ...a], { encoding: 'utf8', maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'ignore'] }).replace(/\r\n/g, '\n'); } catch { return ''; } };
if (!bandera('--sin-fetch')) { try { git('fetch', '-q', 'origin'); } catch { console.error('Aviso: no pude actualizar origin (¿VPN?); uso lo que hay en local.'); } }
const commit = git('rev-parse', ref).trim();
let avisoSha = '';
if (!bandera('--sin-fetch') && ref.startsWith('origin/')) {
  const remoto = gitSeguro('ls-remote', 'origin', 'refs/heads/' + ref.slice(7)).split(/\s/)[0];
  if (remoto && remoto !== commit) avisoSha = `El SHA local de ${ref} (${commit.slice(0, 8)}) no coincide con el remoto (${remoto.slice(0, 8)}): repite el fetch antes de usar este informe.`;
  else if (!remoto) avisoSha = 'No pude comprobar el SHA remoto (ls-remote): el informe usa lo que hay en local.';
}
const fechaCommit = (c) => git('log', '-1', '--format=%cI', c).trim();

// ---------- revisión base ----------
const estado = fs.existsSync(ESTADO) ? JSON.parse(fs.readFileSync(ESTADO, 'utf8')) : { paquetes: {} };
let desde = opcion('--desde') || estado.paquetes?.[dsp]?.commit;
let origenBase = opcion('--desde') ? 'indicada con --desde' : desde ? `última revisión registrada (${estado.paquetes[dsp].registrado})` : '';
if (!desde) {
  console.error(`No hay revisión registrada para ${dsp}. Indica --desde <commit|AAAA-MM-DD> la primera vez.`);
  process.exit(2);
}
if (/^\d{4}-\d{2}-\d{2}$/.test(desde)) {
  const c = git('rev-list', '-1', `--before=${desde}T00:00:00-05:00`, ref).trim();
  if (!c) { console.error(`No hay commits antes de ${desde}.`); process.exit(1); }
  origenBase = `último commit antes del ${desde}`;
  desde = c;
}
const base = git('rev-parse', desde).trim();

// ---------- utilidades de markdown ----------
const archivos = git('ls-tree', '-r', '--name-only', ref).split('\n').filter(Boolean);
const leer = (ruta, en = ref) => gitSeguro('show', `${en}:${ruta}`);
const limpiar = (s) => (s || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();
const corto = (s, n = 160) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const seccion = (md, prueba) => {
  const l = md.split('\n');
  const i = l.findIndex((x) => /^#{2,3} /.test(x) && prueba.test(x));
  if (i < 0) return '';
  const nivel = l[i].match(/^#+/)[0].length;
  let j = i + 1;
  while (j < l.length && !new RegExp(`^#{1,${nivel}} `).test(l[j])) j++;
  return l.slice(i + 1, j).join('\n');
};
const tabla = (texto) => {
  const filas = texto.split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*:?-/.test(l))
    .map((l) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim()));
  return { cabecera: (filas[0] || []).map(limpiar), filas: filas.slice(1) };
};
const NOMBRES = { HU: 'Historia de usuario (HU)', DSP: 'Paquete de alcance (DSP)', AVS: 'Aviso (AVS)', CONSULTA: 'Consulta o respuesta (QST/RSP)',
  DECISION: 'Decisión (DH/DEC)', UXR: 'Requerimiento UX (UXR)', FLW: 'Flujo de usuario (FLW)', SCR: 'Pantalla (SCR)', UXS: 'Especificación UX (UXS)',
  ARP: 'Informe de accesibilidad (ARP)', DISENO: 'Otro artefacto de diseño', ARQ: 'Arquitectura (ADR/ASR)', GESTION: 'Gestión del proyecto', PRUEBAS: 'Pruebas (QA)', OTRO: 'Otro' };
const tipoDe = (f) => {
  const b = path.posix.basename(f);
  if (/^requirements\/context-packs\/user-stories\//.test(f)) return 'HU';
  if (/^requirements\/scope-packs\//.test(f)) return 'DSP';
  if (/^avisos\//.test(f)) return 'AVS';
  if (/^questions\/|\/consultas\//.test(f)) return 'CONSULTA';
  if (/^decisions\//.test(f) || /^(DH|DEC)-/.test(b)) return 'DECISION';
  if (/^design\/ux-requirements\//.test(f)) return 'UXR';
  if (/^design\/user-flows\//.test(f)) return 'FLW';
  if (/^design\/screens\//.test(f)) return 'SCR';
  if (/^design\/specs\//.test(f)) return 'UXS';
  if (/^design\/accessibility\//.test(f) || /^ARP-/.test(b)) return 'ARP';
  if (/^design\//.test(f)) return 'DISENO';
  if (/^architecture\//.test(f)) return 'ARQ';
  if (/^management\//.test(f)) return 'GESTION';
  if (/^testing\//.test(f)) return 'PRUEBAS';
  return 'OTRO';
};

// ---------- el paquete y sus historias ----------
const rutaDsp = archivos.find((f) => f.startsWith('requirements/scope-packs/') && path.posix.basename(f).startsWith(dsp + '-'));
if (!rutaDsp) { console.error(`No encontré ${dsp} en requirements/scope-packs/ de ${ref}.`); process.exit(1); }
const mdDsp = leer(rutaDsp);
const historias = [...new Set((seccion(mdDsp, /Historias incluidas/).match(/HU-\d+-\d+/g) || []))];
const rutaHu = Object.fromEntries(historias.map((h) => [h, archivos.find((f) => /^requirements\/context-packs\/user-stories\//.test(f) && path.posix.basename(f).startsWith(h + '-'))]));
const claves = [dsp, ...historias];
const reClaves = new RegExp(`(?<![\\w-])(?:${claves.map((c) => c.replace(/-/g, '\\-')).join('|')})(?![\\w-]?\\d)`, 'i');
const titulo = (md) => limpiar(md.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] || md.match(/^# (.+)$/m)?.[1] || '');

const ultima = (ruta) => {
  const [c, fecha, autor, asunto] = git('log', '-1', '--format=%h%x1f%cI%x1f%an%x1f%s', ref, '--', ruta).trim().split('\x1f');
  return { commit: c, fecha, autor, asunto };
};
const inventario = [{ id: dsp, tipo: 'DSP', ruta: rutaDsp }, ...historias.map((h) => ({ id: h, tipo: 'HU', ruta: rutaHu[h] }))]
  .map((x) => ({ ...x, titulo: x.ruta ? titulo(leer(x.ruta)).replace(new RegExp('^' + x.id + '\\s*[—-]\\s*'), '') : '(no encontrada en la KB)', estado: x.ruta ? (leer(x.ruta).match(/^status:\s*["']?([\w-]+)/m)?.[1] || '') : '',
    ultima: x.ruta ? ultima(x.ruta) : null }));

// ---------- qué cambió desde la base ----------
// Por archivo: commits (fecha, autor, asunto) y secciones tocadas según el diff.
const registro = git('log', '--format=@@%h%x1f%cI%x1f%an%x1f%s', '--name-status', '--no-renames', `${base}..${commit}`);
const porArchivo = new Map();
let actual = null;
for (const linea of registro.split('\n')) {
  if (linea.startsWith('@@')) { const [h, fecha, autor, asunto] = linea.slice(2).split('\x1f'); actual = { commit: h, fecha, autor, asunto }; continue; }
  const m = linea.match(/^([AMD])\t(.+)$/);
  if (!m || !actual || !m[2].endsWith('.md')) continue;
  const lista = porArchivo.get(m[2]) || [];
  lista.push({ ...actual, accion: { A: 'nuevo', M: 'modificado', D: 'eliminado' }[m[1]] });
  porArchivo.set(m[2], lista);
}
const seccionesTocadas = (ruta) => {
  const diff = gitSeguro('diff', '-U0', base, commit, '--', ruta);
  const nuevo = leer(ruta).split('\n');
  const tocadas = new Set();
  for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const ini = Number(m[1]);
    for (let i = Math.min(ini, nuevo.length) - 1; i >= 0; i--) {
      if (/^#{2,4} /.test(nuevo[i])) { tocadas.add(limpiar(nuevo[i].replace(/^#+ /, ''))); break; }
      if (i === 0) tocadas.add('Ficha / cabecera');
    }
  }
  return [...tocadas];
};
// Archivos generales de la KB: cambian con todo y no dicen nada del paquete.
const GENERALES = /(^|\/)(changelog|index|GRAPH_REPORT|MEMORY|log)\.md$|^graphify-out\//;
const relevantes = [];
for (const [ruta, commits] of porArchivo) {
  const tipo = tipoDe(ruta);
  if (GENERALES.test(ruta)) continue;
  const enRuta = reClaves.test(ruta);
  // Fuera de los archivos propios del paquete, cuenta solo si las líneas cambiadas lo citan.
  const texto = enRuta ? '' : gitSeguro('diff', '-U0', base, commit, '--', ruta).split('\n').filter((l) => /^[+-](?![+-])/.test(l)).join('\n');
  if (!enRuta && !reClaves.test(texto)) continue;
  if (tipo === 'PRUEBAS' && !enRuta) continue; // los casos de prueba que solo citan la HU no cambian el diseño
  const eliminado = commits.some((c) => c.accion === 'eliminado') && !archivos.includes(ruta);
  relevantes.push({ ruta, tipo, nombreTipo: NOMBRES[tipo], titulo: eliminado ? '' : titulo(leer(ruta)), eliminado,
    commits: commits.sort((a, b) => a.fecha.localeCompare(b.fecha)), secciones: eliminado ? [] : seccionesTocadas(ruta),
    citaA: claves.filter((c) => new RegExp(`(?<![\\w-])${c}(?![\\w-]?\\d)`).test(ruta + '\n' + (texto || leer(ruta)))),
    directo: enRuta });
}
const ORDEN = ['DSP', 'HU', 'AVS', 'CONSULTA', 'DECISION', 'UXR', 'FLW', 'SCR', 'UXS', 'ARP', 'DISENO', 'ARQ', 'GESTION', 'PRUEBAS', 'OTRO'];
relevantes.sort((a, b) => ORDEN.indexOf(a.tipo) - ORDEN.indexOf(b.tipo) || a.ruta.localeCompare(b.ruta));

// ---------- preguntas abiertas ----------
const estadoPregunta = (t) => {
  const x = limpiar(t).toLowerCase();
  if (/^(cerrad|resuelt|decidid|respondid|confirmad|descartad|diferid|reemplazad|absorbid)/.test(x)) return x.match(/^\w+/)[0];
  if (!x || /^(abierta|pendiente|en espera|sin respuesta)/.test(x)) return 'abierta';
  return 'revisar';
};
const preguntas = [];
for (const doc of inventario.filter((d) => d.ruta)) {
  const { cabecera, filas } = tabla(seccion(leer(doc.ruta), /Preguntas abiertas/));
  const iEstado = cabecera.findIndex((c) => /estado/i.test(c));
  const iResp = cabecera.findIndex((c) => /responsable|decide/i.test(c));
  const iBloq = cabecera.findIndex((c) => /bloquea/i.test(c));
  const iAfecta = cabecera.findIndex((c) => /afecta|alcance/i.test(c));
  for (const f of filas) {
    const celdaEstado = iEstado >= 0 ? f[iEstado] : f[1];
    let est = estadoPregunta(celdaEstado);
    if (est === 'revisar') {
      const fila = limpiar(f.join(' '));
      if (/\b(Abierta|Pendiente)\b/.test(fila)) est = 'abierta';
      else if (/(Cerrad[ao]|Respondid[ao]|Decidid[ao]|Resuelt[ao]|Confirmad[ao]|Descartad[ao]|Diferid[ao])/i.test(fila)) est = 'cerrada';
    }
    if (!['abierta', 'revisar'].includes(est)) continue;
    const id = limpiar(f[0]);
    if (preguntas.some((p) => p.id === id)) continue;
    preguntas.push({ id, donde: doc.id, estado: est === 'abierta' ? 'Abierta' : 'Revisar el estado',
      texto: corto(limpiar(iEstado >= 0 ? f[1] : celdaEstado), 220), responsable: iResp >= 0 ? limpiar(f[iResp]) : (limpiar(celdaEstado).match(/decide (el|la) ([\w ]+?)\)/i)?.[2] || ''),
      bloquea: iBloq >= 0 ? limpiar(f[iBloq]) : '', afecta: iAfecta >= 0 ? limpiar(f[iAfecta]) : '' });
  }
}
// Preguntas de UX (Open questions de UXR, FLW y SCR) que citan el paquete o sus historias.
const disenoQueCita = archivos.filter((f) => /^design\/(ux-requirements|user-flows|screens|specs|explorations|accessibility)\/.+\.md$/.test(f))
  .filter((f) => reClaves.test(leer(f)));
for (const f of disenoQueCita) {
  const { cabecera, filas } = tabla(seccion(leer(f), /Open questions|Preguntas abiertas/i));
  const iEstado = cabecera.findIndex((c) => /estado|status/i.test(c));
  for (const fila of filas) {
    const est = estadoPregunta(iEstado >= 0 ? fila[iEstado] : '');
    if (!['abierta', 'revisar'].includes(est)) continue;
    const id = limpiar(fila[0]);
    if (!id || preguntas.some((p) => p.id === id)) continue;
    preguntas.push({ id, donde: path.posix.basename(f).replace(/\.md$/, '').match(/^[A-Z]+-\d+/)?.[0] || f, estado: est === 'abierta' ? 'Abierta' : 'Revisar el estado',
      texto: corto(limpiar(fila[1] || ''), 220), responsable: limpiar(fila[cabecera.findIndex((c) => /responsable|owner/i.test(c))] || ''), bloquea: '', afecta: '' });
  }
}

// ---------- efecto en cadena ----------
const cambiaron = new Set(relevantes.filter((r) => ['HU', 'DSP', 'AVS', 'CONSULTA', 'DECISION'].includes(r.tipo)).flatMap((r) => r.citaA));
const disenoAfectado = disenoQueCita
  .map((f) => ({ ruta: f, id: path.posix.basename(f).match(/^[A-Z]+-\d+/)?.[0] || path.posix.basename(f), tipo: tipoDe(f),
    estado: leer(f).match(/^status:\s*["']?([\w-]+)/m)?.[1] || '', cita: claves.filter((c) => cambiaron.has(c) && new RegExp(`(?<![\\w-])${c}(?![\\w-]?\\d)`).test(leer(f))) }))
  .filter((d) => d.cita.length && !relevantes.some((r) => r.ruta === d.ruta));

let tareas = [];
let avisoNotion = '';
if (!bandera('--sin-notion')) {
  try {
    // Token de Notion: variable NOTION_TOKEN o el archivo del módulo Notion de quien lo tenga. Sin token, no se cruzan tareas.
    const archivoToken = path.join(os.homedir(), '.notion', 'token.txt');
    const token = (process.env.NOTION_TOKEN || (fs.existsSync(archivoToken) ? fs.readFileSync(archivoToken, 'utf8') : '')).trim();
    if (!token) throw new Error('falta el token (NOTION_TOKEN)');
    const h = { Authorization: `Bearer ${token}`, 'Notion-Version': '2026-03-11', 'Content-Type': 'application/json' };
    const consulta = async (ds, cuerpo) => {
      const salida = [];
      let cursor;
      do {
        const r = await fetch(`https://api.notion.com/v1/data_sources/${ds}/query`, { method: 'POST', headers: h, body: JSON.stringify({ ...cuerpo, start_cursor: cursor, page_size: 100 }) });
        if (!r.ok) throw new Error(`Notion respondió ${r.status}`);
        const j = await r.json();
        salida.push(...j.results);
        cursor = j.has_more ? j.next_cursor : undefined;
      } while (cursor);
      return salida;
    };
    const texto = (p, n) => (p.properties[n]?.title || p.properties[n]?.rich_text || []).map((x) => x.plain_text).join('');
    const paquetes = await consulta('66f1a7d0-6388-83f8-881b-0758134faa78', { filter: { or: [{ property: 'ID', rich_text: { equals: dsp } }, { property: 'title', title: { starts_with: dsp } }] } }).catch(async () => {
      // El nombre de la propiedad título puede variar: se busca sin filtro de propiedad.
      return [];
    });
    const pagDsp = paquetes[0];
    if (!pagDsp) avisoNotion = `No encontré ${dsp} en la base Paquetes de alcance de Notion.`;
    else {
      const filas = await consulta('87a1a7d0-6388-82a0-82c0-8709ea959111', { filter: { property: 'Paquetes de alcance', relation: { contains: pagDsp.id } } });
      tareas = filas.map((p) => {
        const nombre = texto(p, 'Nombre');
        // «(HU-01-14 y 16)» o «(HU-01-14)»: la tarea no tiene relación con Historias, las HU van en el título.
        const hu = [];
        for (const m of nombre.matchAll(/HU-(\d+)-(\d+)((?:\s*(?:,|y)\s*\d+)*)/g)) {
          hu.push(`HU-${m[1]}-${m[2]}`);
          for (const n of (m[3].match(/\d+/g) || [])) hu.push(`HU-${m[1]}-${n.padStart(2, '0')}`);
        }
        return { nombre, url: p.url, estado: p.properties.Estado?.status?.name || '', limite: p.properties['Fecha límite']?.date?.start || '',
          issue: p.properties.Issue?.url || '', historias: [...new Set(hu)], madre: !(p.properties['Tarea padre']?.relation || []).length };
      }).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  } catch (e) { avisoNotion = `No pude leer las tareas de Notion: ${e.message}.`; }
} else avisoNotion = 'Sin Notion (--sin-notion): no se cruzan las tareas.';

const cerradas = /^(Hecho|Listo|Completad|Cerrad|Finalizad)/i;
const propuestas = [];
for (const t of tareas) {
  if (cerradas.test(t.estado)) continue;
  const toca = t.historias.length ? t.historias.filter((h) => cambiaron.has(h)) : (cambiaron.size ? ['(todo el paquete)'] : []);
  const paqueteCambio = cambiaron.has(dsp);
  if (!toca.length && !paqueteCambio) continue;
  // Bloquea solo una pregunta abierta de otro responsable (PO, Arquitectura…) que diga que bloquea.
  const deEstaTarea = (p) => !t.historias.length || p.donde === dsp || t.historias.some((h) => (p.afecta + ' ' + p.donde + ' ' + p.texto).includes(h));
  const bloqueantes = preguntas.filter((p) => p.estado === 'Abierta' && deEstaTarea(p) && p.bloquea && !/^(no\b|—|-)/i.test(p.bloquea) && !/^UX\b/i.test(p.responsable));
  const delPaquete = preguntas.filter((p) => p.estado === 'Abierta' && deEstaTarea(p) && !bloqueantes.includes(p));
  const fuentes = relevantes.filter((r) => r.citaA.some((c) => toca.includes(c) || c === dsp) && ['HU', 'DSP', 'AVS', 'CONSULTA', 'DECISION'].includes(r.tipo))
    .sort((a, b) => ORDEN.indexOf(a.tipo) - ORDEN.indexOf(b.tipo) || Number(b.directo) - Number(a.directo) || b.commits.at(-1).fecha.localeCompare(a.commits.at(-1).fecha));
  propuestas.push({ tarea: t.nombre, url: t.url, estado: t.estado,
    accion: bloqueantes.length ? 'AVANCE con bloqueo' : 'AVANCE con nota',
    abiertas: delPaquete.length,
    motivo: `Cambió ${[...new Set([...toca, ...(paqueteCambio ? [dsp] : [])])].filter((x) => !x.startsWith('(')).join(', ')}: ${fuentes.slice(0, 4).map((r) => path.posix.basename(r.ruta).replace(/\.md$/, '') + (r.secciones.length ? ` (${r.secciones.slice(0, 3).join('; ')})` : '')).join(', ')}${fuentes.length > 4 ? ` y ${fuentes.length - 4} más` : ''}.`,
    bloqueantes: bloqueantes.map((p) => `${p.id} (${p.responsable || 'responsable sin registrar'})`) });
}

// ---------- carga obligatoria en Notion ----------
let carga = null;
const cargador = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'notion', 'scripts', 'cargar-paquete.js');
if (bandera('--sin-carga')) carga = { omitida: 'se pidió --sin-carga' };
else if (!fs.existsSync(cargador)) carga = { omitida: 'esta copia del skill no trae el módulo de Notion (notion/scripts/cargar-paquete.js)' };
else {
  let salida = '';
  try { salida = execFileSync('node', [cargador, dsp, '--kb', kb, '--ref', ref], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { salida = String(e.stdout || ''); if (!salida) carga = { error: String(e.stderr || e.message).split('\n')[0].slice(0, 200) }; }
  if (!carga) { try { carga = JSON.parse(salida.trim().split('\n').pop()); } catch { carga = { error: 'el cargador no devolvió un resumen' }; } }
}

// ---------- salida ----------
const resultado = { version: 1, generado: new Date().toISOString(), soloLectura: true, paquete: dsp, kb: { ref, commit: commit.slice(0, 8), fecha: fechaCommit(commit) },
  base: { commit: base.slice(0, 8), fecha: fechaCommit(base), origen: origenBase }, inventario, cambios: relevantes, preguntas, disenoAfectado, tareas, propuestas, avisoNotion, carga };

const f = (iso) => (iso ? iso.slice(0, 16).replace('T', ' ') : '—');
const md = [];
md.push(`# Cambios en la KB · ${dsp}`, '');
md.push(`- **KB:** \`${ref}\` en \`${resultado.kb.commit}\` (${f(resultado.kb.fecha)}).`);
if (avisoSha) md.push(`> ${avisoSha}`, '');
md.push(`- **Desde:** \`${resultado.base.commit}\` (${f(resultado.base.fecha)}), ${origenBase}.`);
md.push(`- **Resumen:** ${relevantes.length} archivos del paquete cambiaron · ${preguntas.filter((p) => p.estado === 'Abierta').length} preguntas abiertas · ${disenoAfectado.length} artefactos de diseño por revisar · ${propuestas.length} tareas con propuesta.`, '');
md.push('## 0. Carga en Notion', '');
if (!carga || carga.omitida) md.push(`> No se cargó: ${carga ? carga.omitida : 'sin datos'}. Notion puede mostrar historias viejas.`, '');
else if (carga.error) md.push(`> **La carga falló:** ${carga.error}. Repite antes de seguir.`, '');
else {
  md.push(`${carga.ok} de ${carga.total} páginas cargadas y verificadas desde \`${carga.ref}\` en \`${carga.commit}\`.`, '');
  for (const i of carga.items) md.push(`- ${i.ok ? 'Cargada' : '**Falló**'}: ${i.id}${i.creada ? ' (nueva)' : ''}${i.error ? ' — ' + i.error : ''}`);
  md.push('');
}
md.push('## 1. Inventario del paquete', '', '| Documento | Última actualización | ¿Cambió? |', '|---|---|---|');
for (const d of inventario) {
  const cambio = relevantes.find((r) => r.ruta === d.ruta);
  md.push(`| **${d.id}** ${d.titulo ? '— ' + corto(d.titulo, 60) : ''} (${d.estado || 'sin estado'}) | ${d.ultima ? `${f(d.ultima.fecha)} · ${d.ultima.autor}` : '—'} | ${cambio ? `Sí: ${cambio.secciones.slice(0, 4).join('; ') || 'contenido'}` : 'No'} |`);
}
md.push('', '## 2. Qué cambió desde la base', '');
if (!relevantes.length) md.push('Nada del paquete cambió desde la base.');
for (const tipo of ORDEN) {
  const grupo = relevantes.filter((r) => r.tipo === tipo);
  if (!grupo.length) continue;
  md.push(`### ${NOMBRES[tipo]} · ${grupo.length}`, '');
  for (const r of grupo) {
    const ult = r.commits.at(-1);
    md.push(`- **${path.posix.basename(r.ruta).replace(/\.md$/, '')}**${r.eliminado ? ' (eliminado)' : ''} — ${f(ult.fecha)} · ${ult.autor} · ${r.commits.length} commit${r.commits.length > 1 ? 's' : ''}. «${corto(ult.asunto, 120)}»` +
      (r.commits.every((c) => c.accion === 'nuevo') ? '\n  Documento nuevo.' : r.secciones.length ? `\n  Secciones: ${r.secciones.slice(0, 6).join('; ')}${r.secciones.length > 6 ? '…' : ''}` : ''));
  }
  md.push('');
}
md.push('## 3. Preguntas abiertas', '');
if (!preguntas.length) md.push('No hay preguntas abiertas en el paquete, sus historias ni los artefactos de UX que los citan.');
else {
  md.push('| Pregunta | Estado y responsable | Bloquea |', '|---|---|---|');
  for (const p of preguntas) md.push(`| **${p.id}** (${p.donde}) ${corto(p.texto, 140)} | ${p.estado}${p.responsable ? ' · ' + p.responsable : ''} | ${p.bloquea || '—'} |`);
}
md.push('', '## 4. Efecto en cadena', '');
md.push('### Artefactos de diseño que citan lo que cambió', '');
if (!disenoAfectado.length) md.push('Ninguno fuera de los que ya aparecen en la sección 2.');
for (const d of disenoAfectado) md.push(`- ${NOMBRES[d.tipo]} **${d.id}** (${d.estado || 'sin estado'}) cita ${d.cita.join(', ')}: revisar si sigue vigente.`);
md.push('', '### Tareas', '');
if (avisoNotion) md.push(`> ${avisoNotion}`, '');
if (tareas.length && !propuestas.length) md.push('Ninguna tarea abierta trabaja sobre lo que cambió.');
for (const p of propuestas) md.push(`- **${p.accion}** en [${p.tarea}](${p.url}) (${p.estado}). ${p.motivo}${p.bloqueantes.length ? ` Bloquean: ${p.bloqueantes.join(', ')}.` : ''}${p.abiertas ? ` Preguntas abiertas que no bloquean: ${p.abiertas}.` : ''}`);
md.push('', '## 5. Qué sigue', '',
  'Esto es una propuesta: no se aplicó nada. Con la aprobación de Enzo:',
  '1. Las tareas se actualizan con `em-gestion-tareas` (modo AVANCE, o el bloqueo si una pregunta abierta frena el trabajo).',
  '2. Los artefactos de diseño afectados pasan a «Revisar por cambio de fuente» con la conciliación (`conciliar-kb-notion.js`).',
  '3. Si una decisión afecta una HU, se propone el comentario al analista funcional del paquete; la HU no se edita.',
  `4. Al terminar, se registra esta revisión: \`node cambios-kb.mjs ${dsp} --kb <kb> --registrar\`.`);
const texto = md.join('\n') + '\n';

if (opcion('--informe')) fs.writeFileSync(opcion('--informe'), texto);
if (opcion('--json')) fs.writeFileSync(opcion('--json'), JSON.stringify(resultado, null, 2));
if (bandera('--registrar')) {
  estado.paquetes ||= {};
  estado.paquetes[dsp] = { commit, registrado: new Date().toISOString(), ref };
  fs.mkdirSync(path.dirname(ESTADO), { recursive: true });
  fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 2));
}
if (!opcion('--informe')) process.stdout.write(texto);
else console.log(`${dsp}: ${relevantes.length} cambios, ${preguntas.filter((p) => p.estado === 'Abierta').length} preguntas abiertas, ${disenoAfectado.length} artefactos por revisar, ${propuestas.length} tareas con propuesta. Informe: ${opcion('--informe')}${bandera('--registrar') ? ' · revisión registrada' : ''}`);
