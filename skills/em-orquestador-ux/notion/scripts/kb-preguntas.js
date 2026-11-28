// Lectura de una revisión inmutable del KB. No cambia la rama ni el árbol de trabajo.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const MOD = path.resolve(__dirname, '..');
const normalizar = s => String(s || '').replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();
const clave = s => normalizar(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const celdas = s => s.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(normalizar);
const vacio = s => !normalizar(s) || /^(?:—|-|pendiente|sin respuesta)$/i.test(normalizar(s));

function opciones(argv = process.argv.slice(2)) {
  const r = {};
  for (let i = 0; i < argv.length; i++) {
    const m = argv[i].match(/^--([^=]+)(?:=(.*))?$/);
    if (m) r[m[1]] = m[2] ?? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true);
  }
  return r;
}
function configuracion(args = {}) {
  const configPath = path.resolve(args.config || path.join(MOD, 'config.json'));
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const expandir = p => p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : path.resolve(path.dirname(configPath), p);
  const worktree = args.kb || process.env.NOTION_WORKTREE || cfg.worktree;
  if (!worktree) throw new Error('Indica --kb o NOTION_WORKTREE con la ruta del KB local.');
  return { ...cfg, worktree: expandir(worktree), ref: args.ref || process.env.DESIGN_REF || cfg.design_ref,
    huella: expandir(args.huella || process.env.NOTION_HUELLA || cfg.huella || '~/.notion/huellas-preguntas.json') };
}
function estadoKB(texto, responsable = '') {
  const t = clave(texto);
  if (/^(descartada|descartado|reemplazada|absorbida|duplicada)\b/.test(t)) return 'Descartada';
  if (/^(diferida|diferido)\b/.test(t)) return 'Diferida';
  if (/^(cerrada|cerrado|resuelta|resuelto|decidida|decidido)\b/.test(t)) return 'Decidida';
  if (/^propuesta ux\b/.test(t)) return 'Propuesta UX';
  // No remapear propuestas de PO, Arquitectura, Seguridad ni Analista.
  if (/^(propuesta|respondida|respondido)\b/.test(t)) return 'Propuesta';
  if (!t || /^abierta\b|^pendiente\b/.test(t)) return 'Abierta';
  return null; // Una formulación ambigua requiere revisión humana.
}
function leerGit(cfg) {
  const git = args => execFileSync('git', ['-C', cfg.worktree, ...args], { maxBuffer: 128 * 1024 * 1024 });
  const commit = git(['rev-parse', '--verify', cfg.ref + '^{commit}']).toString('utf8').trim();
  const entradas = git(['ls-tree', '-rz', commit]).toString('utf8').split('\0').filter(Boolean)
    .map(s => s.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/s)).filter(m => m && m[2].endsWith('.md') && !m[2].startsWith('.'));
  const salida = gitBatch(entradas.map(m => m[1]), cfg.worktree);
  const archivos = new Map(entradas.map((m, i) => [m[2], salida[i].replace(/\r\n/g, '\n')]));
  return { commit, archivos };
}
function gitBatch(ids, cwd) {
  if (!ids.length) return [];
  const b = execFileSync('git', ['-C', cwd, 'cat-file', '--batch'], { input: ids.join('\n') + '\n', maxBuffer: 128 * 1024 * 1024 });
  let pos = 0;
  return ids.map(() => {
    const fin = b.indexOf(10, pos), cab = b.subarray(pos, fin).toString('utf8');
    const n = Number(cab.split(' ')[2]);
    if (!Number.isFinite(n)) throw new Error('No se pudo leer un objeto del KB.');
    pos = fin + 1; const s = b.subarray(pos, pos + n).toString('utf8'); pos += n + 1; return s;
  });
}

function extraer(archivos) {
  const preguntas = new Map(), incidencias = [];
  for (const [archivo, texto] of archivos) {
    if (!/^design\/(ux-requirements|user-flows|screens)\/(UXR|FLW|SCR)-.*\.md$/.test(archivo)) continue;
    let activa = false, profundidad = 0, cab = null;
    const lineas = texto.split('\n');
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i], h = l.match(/^(#{1,6})\s+(.+)/);
      if (h) {
        if (activa && h[1].length <= profundidad) activa = false;
        if (/open questions|preguntas abiertas|decisiones abiertas/i.test(h[2])) { activa = true; profundidad = h[1].length; }
        cab = null;
      }
      if (!activa || !/^\s*\|/.test(l)) continue;
      const c = celdas(l);
      if (c.every(x => /^[:\s-]+$/.test(x))) continue;
      if (/^id$/i.test(c[0])) { cab = c.map(clave); continue; }
      if (!cab || !c[0]) continue;
      // Las tablas de FLW que solo referencian preguntas de UXR no son nuevas preguntas.
      if (!cab.some(x => /^(pregunta|respuesta|estado)$/.test(x))) continue;
      const id = c[0].match(/^((?:[A-Z][A-Z0-9]*-)[A-Z0-9.\/-]+(?:-Q\d+)?)(?=\s|$)/)?.[1];
      if (!id) continue;
      const col = (...nombres) => { const j = cab.findIndex(x => nombres.some(n => x === n || x.startsWith(n + ' '))); return j < 0 ? '' : c[j] || ''; };
      const estadoTexto = col('estado') || (c.length === cab.length + 1 ? c[cab.length] : '');
      const pregunta = col('pregunta'), responsable = col('responsable', 'quien decide');
      const embebida = estadoTexto || pregunta.match(/\b(?:Cerrada|Resuelta|Respondida|Diferida|Descartada)(?:\s|\().*$/i)?.[0] || '';
      const estado = estadoKB(embebida, responsable);
      let respuesta = col('respuesta', 'resolucion');
      if (vacio(respuesta)) respuesta = /^(?:cerrada|resuelta|respondida|decidida|propuesta)/i.test(embebida) ? embebida.replace(/^[^:]*:\s*/, '') : '';
      const q = { id, pregunta, responsable, prioridad: col('prioridad'), bloquea: col('bloquea'), estadoTexto: embebida,
        estado, respuesta: vacio(respuesta) ? '' : respuesta, decididoPor: col('decidido por'),
        fecha: col('fecha de decision', 'fecha') || embebida.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] || '',
        fuentes: col('fuentes y evidencia', 'fuentes', 'evidencia'), impacto: col('impacto'),
        decision: col('dec', 'decision'), dominio: col('dominio'), origen: col('origen'), archivo, linea: i + 1, fila: l, ubicaciones: [{ archivo, linea: i + 1 }] };
      const prev = preguntas.get(id);
      if (prev) {
        prev.ubicaciones.push(...q.ubicaciones);
        if (prev.estado !== q.estado && (q.estadoTexto || prev.estadoTexto)) incidencias.push({ id, motivo: 'Estados contradictorios dentro del KB', archivos: [prev.archivo, archivo] });
      } else preguntas.set(id, q);
    }
  }
  return { preguntas, incidencias };
}

function snapshot(cfg) {
  const { commit, archivos } = leerGit(cfg), { preguntas, incidencias } = extraer(archivos);
  const indice = new Map();
  const agregar = (id, f) => { if (!indice.has(id)) indice.set(id, new Set()); indice.get(id).add(f); };
  for (const [f, txt] of archivos) {
    const id = path.posix.basename(f).match(/^([A-Z][A-Z0-9]*(?:-[A-Z]+)?-\d+(?:-\d+)?)/)?.[1];
    if (id) agregar(id, f);
    // Definiciones en catálogos de Negocio, Arquitectura, PO o Infraestructura.
    if (!f.startsWith('design/')) for (const m of txt.matchAll(/^(?:#{1,6}\s+|\|\s*)(?:\*\*)?((?:HU|BR|DH|ARQ|INF)-[\w.-]+)/gm)) agregar(m[1], f);
  }
  for (const q of preguntas.values()) {
    const deps = new Set(q.ubicaciones.map(x => x.archivo));
    const fuente = q.ubicaciones.map(x => archivos.get(x.archivo)).join('\n');
    for (const m of fuente.matchAll(/(?:resource:\s*|\]\()(\/?[^\s)#]+\.md)/g)) {
      const f = m[1].startsWith('/') ? m[1].slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(q.archivo), m[1]));
      if (archivos.has(f)) deps.add(f);
    }
    for (const m of fuente.matchAll(/\b(?:HU(?:-[A-Z]+)?-\d+-\d+|(?:BR|DH|ARQ|INV|DEC|ASR|INF)-[\w.-]+)/g)) for (const f of indice.get(m[0]) || []) deps.add(f);
    // Incluye los DEC que citan directamente la pregunta (evidencia de la resolución).
    const dec = [...archivos].filter(([f, txt]) => /\/DEC-.*\.md$/.test(f) && new RegExp('(?<![\\w-])' + q.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])').test(txt));
    for (const [f] of dec) deps.add(f);
    q.decisiones = dec.map(([f]) => f);
    q.sourceHashes = Object.fromEntries([...deps].sort().map(f => [f, hash(archivos.get(f))]));
    q.fingerprint = hash(JSON.stringify({ fila: q.fila, fuentes: q.sourceHashes }));
  }
  const documentos = [];
  for (const [archivo, texto] of archivos) {
    if (!/^design\/(ux-requirements|user-flows|screens|explorations|specs)\/(UXR|FLW|SCR|IB|UXS)-.*\.md$/.test(archivo)
      && !/^requirements\/scope-packs\/DSP-.*\.md$/.test(archivo)) continue;
    const fm = texto.match(/^---\n([\s\S]*?)\n---/)?.[1] || '';
    if (!fm) continue;
    const ids = archivo.includes('/screens/') ? [...fm.matchAll(/^\s*- id:\s*(SCR-\d+)/gm)].map(m => m[1])
      : [fm.match(/^id:\s*(\S+)/m)?.[1]].filter(Boolean);
    const lista = campo => {
      const inline = fm.match(new RegExp('^' + campo + ':\\s*\\[([^\\]]*)\\]', 'm'))?.[1];
      const bloque = fm.match(new RegExp('^' + campo + ':[ \\t]*\\n((?:[ \\t]+-[^\\n]*\\n?)+)', 'm'))?.[1];
      return (inline || bloque || '').match(/\b(?:UXR|FLW|SCR|IB|UXS|DSP)-\d+\b/g) || [];
    };
    const deps = new Set([archivo]);
    for (const m of texto.matchAll(/resource:\s*\/?([^\s]+\.md)/g)) if (archivos.has(m[1])) deps.add(m[1]);
    for (const m of texto.matchAll(/\b(?:HU(?:-[A-Z]+)?-\d+-\d+|(?:BR|DH|ARQ|INF)-[\w.-]+)/g)) for (const f of indice.get(m[0]) || []) deps.add(f);
    const sourceHashes = Object.fromEntries([...deps].sort().map(f => [f, hash(archivos.get(f))]));
    for (const id of ids) documentos.push({ id, archivo, texto, estado: fm.match(/^status:\s*([^\n]+)/m)?.[1]?.replace(/["']/g, '').trim() || 'draft',
      referencias: [...new Set(texto.match(/\b(?:HU(?:-[A-Z]+)?-\d+-\d+|UXR-\d+|FLW-\d+|SCR-\d+)\b/g) || [])],
      screens: lista('screens'), requirements: lista('requirements'), flows: lista('flows'),
      historias: [...new Set([...fm.matchAll(/^\s*- id:\s*(HU(?:-[A-Z]+)?-\d+-\d+)/gm)].map(m => m[1]))],
      flow: fm.match(/^flow:\s*(FLW-\d+)/m)?.[1],
      paquetes: [...new Set((fm.match(/\bDSP-\d+\b/g) || []).concat((fm.match(/\bdsp-\d+\b/g) || []).map(s => s.toUpperCase())))],
      approvedBy: fm.match(/^approved_by:\s*([^\n]+)/m)?.[1] || '', sourceHashes, fingerprint: hash(JSON.stringify(sourceHashes)) });
    for (const d of documentos.filter(d => d.archivo === archivo)) {
      d.referenciasProducto = [...new Set([...deps].filter(f => /(?:^|\/)HU-[^/]+\.md$/.test(f))
        .flatMap(f => archivos.get(f).match(/\b(?:CLF[-_]\d+|US[-_]?\d+)\b/g) || []).map(id => id.replace(/^CLF_/, 'CLF-').replace(/^US[-_]?/, 'US-')))];
    }
  }
  return { commit, ref: cfg.ref, preguntas: [...preguntas.values()], incidencias, documentos };
}
function resumenRespuesta(q) {
  const pendiente = ['Abierta', 'Propuesta', 'Propuesta UX'].includes(q.estado);
  const quien = q.estado === 'Propuesta UX' ? 'Enzo' : /po\b|product owner/i.test(q.responsable) ? 'PO' : q.responsable || 'responsable';
  const prefijo = pendiente ? '[Confirma: ' + quien + '] ' : '';
  const texto = prefijo + (q.respuesta || 'Pendiente de respuesta en el KB.');
  const chars = Array.from(texto); return chars.length > 200 ? chars.slice(0, 199).join('') + '…' : texto;
}
function resolucion(q, cfg = {}) {
  const enlaces = q.decisiones.map(f => cfg.repo_url ? `[${path.posix.basename(f)}](${cfg.repo_url}${cfg.ref}/${f})` : f);
  return ['## Resolución', '', '### Respuesta', '', q.respuesta || 'Pendiente de respuesta en el KB.', '',
    '### Fuentes y evidencia', '', q.fuentes || 'No registradas; completar en el KB.', ...enlaces.map(s => '- ' + s), '',
    '### Quién decide', '', q.estado === 'Propuesta UX' ? 'UX propone; Enzo aprueba.' : q.decididoPor || q.responsable || 'No registrado en el KB.',
    q.fecha ? 'Fecha: ' + q.fecha + '.' : 'Fecha de decisión: pendiente.', '', '### Impacto', '', q.impacto || 'No registrado; completar en el KB.', ''].join('\n');
}
function validarDelegacion(q) {
  if (q.decididoPor !== 'IA (delegado por Enzo)') return;
  if (q.estado !== 'Decidida' || !/^\d{4}-\d{2}-\d{2}$/.test(q.fecha) || !q.fuentes || !q.decisiones.length ||
      !/^(textos|estados vacios|mensajes|formatos|patrones)$/.test(clave(q.dominio)) ||
      /po\b|product owner|negocio|arquitectura|seguridad|analista|infraestructura/.test(clave(q.responsable))) {
    throw new Error(q.id + ': delegación inválida; exige práctica estándar UX, DEC, fecha y fuentes, sin negocio, permisos, datos ni alcance.');
  }
}
module.exports = { opciones, configuracion, snapshot, extraer, estadoKB, normalizar, clave, hash, resumenRespuesta, resolucion, validarDelegacion };
