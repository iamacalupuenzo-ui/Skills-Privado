#!/usr/bin/env node
// Lee un paquete de alcance (DSP) y sus historias de la KB sin cambiar la copia local:
// todo se lee con `git show <ref>:<ruta>`. Devuelve un JSON con la ficha del paquete, la
// lectura de cada historia, lo que ya existe en la KB y una estimación de horas de UX.
//
// Uso: node leer-paquete.mjs DSP-009 --kb <ruta a knowledge-base> [--ref origin/develop]
//        [--modelo <modelo-estimacion.json>] [--json <salida.json>]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opcion = (n, def) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : def;
};
const dsp = args.find((a) => /^DSP-\d+$/i.test(a))?.toUpperCase();
const kb = opcion('--kb');
const ref = opcion('--ref', 'origin/develop');
const rutaModelo = opcion('--modelo', path.join(aqui, '..', 'config', 'modelo-estimacion.json'));
const salidaJson = opcion('--json');
if (!dsp || !kb) {
  console.error('Uso: node leer-paquete.mjs DSP-009 --kb <ruta> [--ref origin/develop] [--json salida.json]');
  process.exit(2);
}

const git = (...a) => execFileSync('git', ['-C', kb, ...a], { encoding: 'utf8', maxBuffer: 64 << 20 });
const leer = (ruta) => git('show', `${ref}:${ruta}`);
const archivos = git('ls-tree', '-r', '--name-only', ref).split('\n').filter(Boolean);
const modelo = JSON.parse(fs.readFileSync(rutaModelo, 'utf8'));

// ---------- utilidades de markdown ----------
const seccion = (md, titulo) => {
  const lineas = md.split('\n');
  const i = lineas.findIndex((l) => /^#{2,3} /.test(l) && l.includes(titulo));
  if (i < 0) return '';
  const nivel = lineas[i].match(/^#+/)[0].length;
  let j = i + 1;
  while (j < lineas.length && !(new RegExp(`^#{1,${nivel}} `).test(lineas[j]))) j++;
  return lineas.slice(i + 1, j).join('\n');
};
const filasTabla = (texto) =>
  texto
    .split('\n')
    .filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l))
    .slice(1) // encabezado
    .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
const limpiar = (s) => (s || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').replace(/`/g, '').trim();
const ficha = (md) => Object.fromEntries(filasTabla(seccion(md, 'Ficha')).map(([k, v]) => [limpiar(k), limpiar(v)]));
const corto = (s, n = 140) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// ---------- paquete ----------
const rutaDsp = archivos.find((f) => f.startsWith('requirements/scope-packs/') && f.includes(`${dsp}-`));
if (!rutaDsp) {
  console.error(`No encontré ${dsp} en requirements/scope-packs/ de ${ref}`);
  process.exit(1);
}
const mdDsp = leer(rutaDsp);
const front = (clave) => mdDsp.match(new RegExp(`^${clave}:\\s*(.+)$`, 'm'))?.[1]?.replace(/^['"]|['"]$/g, '').trim() ?? null;
const lineaAlcance = (etiqueta) => limpiar(mdDsp.match(new RegExp(`^- \\*\\*${etiqueta}:\\*\\*\\s*(.+)$`, 'm'))?.[1] ?? '');

const historiasDsp = filasTabla(seccion(mdDsp, 'Historias incluidas')).map((c) => ({
  id: limpiar(c[0]).match(/HU-\d+-\d+/)?.[0],
  titulo: limpiar(c[1]),
  actor: limpiar(c[2]),
  plataforma: limpiar(c[3]),
  prioridad: limpiar(c[4]).split(' ')[0],
  preparacion: limpiar(c[5]),
}));
const excluido = filasTabla(seccion(mdDsp, 'Trabajo excluido')).map((c) => ({ trabajo: limpiar(c[0]), historia: limpiar(c[1]) }));
const dependencias = filasTabla(seccion(mdDsp, 'Dependencias y restricciones')).map((c) => ({
  dependencia: corto(limpiar(c[1])),
  afecta: limpiar(c[2]),
  donde: corto(limpiar(c[3]), 100),
}));
const horasPaquete = Number(lineaAlcance('Estimación').match(/(\d+(?:[.,]\d+)?)\s*horas/)?.[1]?.replace(',', '.')) || null;

// ---------- lo que ya existe en la KB ----------
const tipoDeArtefacto = (ruta) => {
  const base = path.basename(ruta, '.md');
  const m = base.match(/^([A-Z]{2,4})-(?:DSP-\d+|AF-DSP-\d+|[A-Z]+-)?\d+/);
  return m ? { tipo: m[1], id: base.match(/^[A-Z]{2,4}(?:-[A-Z]+)*-\d+(?:-\d{3})?/)[0], ruta } : null;
};
const DISENO = ['UXR', 'FLW', 'SCR', 'UXS', 'ARP', 'CMP', 'IB', 'FDT', 'API', 'DEC'];
const quienMenciona = (clave) => {
  let salida = '';
  try {
    salida = git('grep', '-l', '-F', clave, ref, '--', 'design', 'management');
  } catch {
    return [];
  }
  return salida
    .split('\n')
    .filter(Boolean)
    .map((l) => l.replace(`${ref}:`, ''))
    .map(tipoDeArtefacto)
    .filter(Boolean);
};
const agrupar = (lista) => {
  const g = {};
  for (const a of lista) (g[a.tipo] ||= new Set()).add(a.id);
  return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, [...v].sort()]));
};

// ---------- historias ----------
const historias = historiasDsp.map((h) => {
  const ruta = archivos.find((f) => f.includes('/user-stories/') && path.basename(f).startsWith(`${h.id}-`));
  const md = ruta ? leer(ruta) : '';
  const f = ficha(md);
  const acs = [...md.matchAll(/^### (AC-\d+) — (.+)$/gm)].map((m) => {
    const bloque = md.slice(m.index, md.indexOf('\n### ', m.index + 4) > 0 ? md.indexOf('\n### ', m.index + 4) : undefined);
    const tipo = limpiar(bloque.match(/^- \*\*Tipo:\*\*\s*(.+)$/m)?.[1] ?? '');
    return {
      id: m[1],
      titulo: m[2].trim(),
      tipo: tipo ? tipo.split(':')[0].trim() : 'Sin tipo',
      reutilizaDe: [...new Set(tipo.match(/HU-\d+-\d+/g) || [])],
    };
  });
  const preguntas = filasTabla(seccion(md, 'Preguntas abiertas')).map((c) => ({
    id: limpiar(c[0]),
    abierta: !/cerrada/i.test(c[c.length - 1]),
    bloquea: limpiar(c[4] ?? ''),
  }));
  const negativos = filasTabla(seccion(md, 'Casos negativos')).length;
  const reglas = [...new Set((seccion(md, 'Reglas de negocio').match(/BR-\d+/g) || []))];
  const estadosUi =
    limpiar(seccion(md, 'Consideraciones de UX').match(/Estados de la interfaz:\*\*\s*(.+)/)?.[1] ?? '')
      .replace(/\.$/, '')
      .split(/,\s*|\s+y\s+/)
      .filter(Boolean);
  const consume = [...new Set([...`${f['Componentes comunes'] || ''} ${f['Dependencias'] || ''}`.matchAll(/HU-\d+-\d+/g)].map((m) => m[0]))];
  const reutilizadas = [...new Set([...acs.flatMap((a) => a.reutilizaDe), ...consume])].filter((x) => x !== h.id);
  const propios = quienMenciona(h.id);
  const UX = ['UXR', 'FLW', 'SCR', 'UXS', 'ARP'];
  const porHistoriaReutilizada = Object.fromEntries(
    reutilizadas.map((r) => [r, agrupar(quienMenciona(r).filter((a) => UX.includes(a.tipo)))]),
  );
  const plataformas = h.plataforma.split(/\s*[,+y]\s+|\s*\/\s*/).filter(Boolean);
  return {
    ...h,
    ruta,
    issue: f['Issue de GitLab']?.match(/US\d+/)?.[0] ?? null,
    plataformas,
    acs,
    conteo: {
      acs: acs.length,
      nuevo: acs.filter((a) => /^Nuevo/i.test(a.tipo)).length,
      reutiliza: acs.filter((a) => /^Reutiliza/i.test(a.tipo)).length,
      validacion: acs.filter((a) => /^Validaci/i.test(a.tipo)).length,
      sinTipo: acs.filter((a) => a.tipo === 'Sin tipo').length,
      negativos,
      reglas: reglas.length,
      estadosUi: estadosUi.length,
      preguntasAbiertas: preguntas.filter((p) => p.abierta).length,
      preguntasCerradas: preguntas.filter((p) => !p.abierta).length,
    },
    estadosUi,
    preguntasAbiertas: preguntas.filter((p) => p.abierta),
    reutilizadas,
    yaExiste: {
      deLaHistoria: agrupar(propios.filter((a) => DISENO.includes(a.tipo))),
      deLoQueReutiliza: porHistoriaReutilizada,
      gestion: agrupar(propios.filter((a) => !DISENO.includes(a.tipo))),
    },
  };
});

// ---------- estimación de UX ----------
// Fórmula transparente: cada parte sale del modelo y se puede recalibrar sin tocar el código.
const m = modelo.horas;
const estimar = (h) => {
  const conInterfaz = h.plataformas.length > 0;
  if (!conInterfaz) return { total: 0, partes: { sinInterfaz: 0 } };
  const partes = {
    uxrYFlujo: m.uxrYFlujoPorHistoria,
    pantallas: m.pantallasPorPlataforma * h.plataformas.length,
    accesibilidad: m.accesibilidadPorHistoria,
    estadosExtra: Math.max(0, h.conteo.estadosUi - modelo.umbrales.estadosIncluidos) * m.porEstadoExtra,
    preguntasAbiertas: h.conteo.preguntasAbiertas * m.porPreguntaAbierta,
  };
  // Si los AC «Reutiliza» tienen diseño previo en la KB, esa parte cuesta menos.
  const hayDisenoPrevio = Object.values(h.yaExiste.deLoQueReutiliza).some((g) =>
    ['UXR', 'FLW', 'SCR'].some((t) => g[t]?.length),
  );
  const proporcionReutiliza = h.conteo.acs ? h.conteo.reutiliza / h.conteo.acs : 0;
  const descuento = hayDisenoPrevio ? proporcionReutiliza * modelo.umbrales.descuentoMaximoPorReutilizar : 0;
  const base = partes.uxrYFlujo + partes.pantallas + partes.accesibilidad;
  partes.descuentoPorReutilizar = -Math.round(base * descuento * 10) / 10;
  const total = Object.values(partes).reduce((a, b) => a + b, 0);
  return { total: Math.round(total * 2) / 2, partes, hayDisenoPrevio, proporcionReutiliza: Math.round(proporcionReutiliza * 100) };
};
for (const h of historias) h.estimacionUx = estimar(h);
const fijas = {
  lecturaYMapa: m.lecturaBase + m.lecturaPorHistoria * historias.length,
  mapeoAlDs: m.mapeoAlDs,
  uxsYEntrega: m.uxsYEntrega,
};
const totalUx = historias.reduce((a, h) => a + h.estimacionUx.total, 0) + Object.values(fijas).reduce((a, b) => a + b, 0);

// ---------- impacto ----------
const impacto = (h) => {
  const c = h.conteo;
  let puntos = 0;
  puntos += c.nuevo + c.sinTipo; // comportamiento nuevo
  puntos += h.plataformas.length > 1 ? 2 : 0;
  puntos += c.preguntasAbiertas * 2;
  puntos += c.estadosUi > modelo.umbrales.estadosIncluidos ? 1 : 0;
  puntos -= h.estimacionUx.hayDisenoPrevio ? Math.round(c.reutiliza / 2) : 0;
  const nivel = puntos >= modelo.umbrales.impactoAlto ? 'Alto' : puntos >= modelo.umbrales.impactoMedio ? 'Medio' : 'Bajo';
  return { puntos, nivel };
};
for (const h of historias) h.impacto = impacto(h);

const resultado = {
  leidoDe: { kb: path.basename(path.resolve(kb)), ref, commit: git('rev-parse', '--short', ref).trim(), fecha: new Date().toISOString().slice(0, 10) },
  paquete: {
    id: dsp,
    titulo: front('title'),
    estado: front('scope_state'),
    aprobadoPor: front('approved_by'),
    aprobadoEl: front('approved_on'),
    sprint: lineaAlcance('Sprint'),
    equipo: lineaAlcance('Equipo'),
    horasDesarrolloYQa: horasPaquete,
    ruta: rutaDsp,
    excluido,
    dependencias,
    yaExiste: { gestion: agrupar(quienMenciona(dsp).filter((a) => !DISENO.includes(a.tipo))), diseno: agrupar(quienMenciona(dsp).filter((a) => DISENO.includes(a.tipo))) },
  },
  historias,
  estimacionUx: { fijas, total: totalUx, modelo: modelo.fuente },
};

if (salidaJson) fs.writeFileSync(salidaJson, JSON.stringify(resultado, null, 2));

// ---------- resumen legible ----------
// Toda sigla sale con su nombre completo: quien lee el resumen no tiene por qué conocerlas.
const NOMBRES = {
  UXR: 'Requerimiento UX',
  FLW: 'Flujo de usuario',
  SCR: 'Pantalla',
  UXS: 'Especificación UX',
  ARP: 'Informe de accesibilidad',
  CMP: 'Componente',
  IB: 'Exploración visual',
  FDT: 'Funcionalidad del microservicio',
  API: 'Contrato de API',
  DEC: 'Decisión',
  AVS: 'Aviso',
  RSP: 'Respuesta a consulta',
  MCP: 'Mapa del proyecto',
  PI: 'Issue del proyecto',
  SSP: 'Sprint',
  UST: 'Issues de las historias',
};
const L = [];
const p = resultado.paquete;
L.push(`# ${p.id} · ${p.titulo}`);
L.push(`Leído de ${resultado.leidoDe.kb} ${ref} (${resultado.leidoDe.commit}) el ${resultado.leidoDe.fecha}. Estado: ${p.estado}; aprobado por ${p.aprobadoPor} el ${p.aprobadoEl}.`);
L.push(`Sprint: ${corto(p.sprint, 200)}`);
L.push(`Desarrollo y QA: ${p.horasDesarrolloYQa ?? '¿?'} h. UX estimado: ${totalUx} h (${historias.map((h) => `${h.id} ${h.estimacionUx.total} h`).join(', ')}, fijas ${Object.values(fijas).reduce((a, b) => a + b, 0)} h).`);
L.push('');
L.push('| Historia (HU) | Plataforma | Criterios de aceptación (AC): nuevo/reutiliza/validación/sin tipo | Preguntas abiertas | Impacto | UX h |');
L.push('|---|---|---|---|---|---|');
for (const h of historias) {
  const c = h.conteo;
  L.push(`| ${h.id} ${corto(h.titulo, 45)} | ${h.plataforma} | ${c.acs} (${c.nuevo}/${c.reutiliza}/${c.validacion}/${c.sinTipo}) | ${c.preguntasAbiertas} | ${h.impacto.nivel} | ${h.estimacionUx.total} |`);
}
L.push('');
for (const h of historias) {
  L.push(`## ${h.id}`);
  L.push(`- Reutiliza: ${h.reutilizadas.join(', ') || '—'} (${h.estimacionUx.proporcionReutiliza}% de los AC)`);
  const fmt = (g) => Object.entries(g).map(([t, ids]) => `${NOMBRES[t] ?? t} (${t}): ${ids.join(', ')}`).join(' · ') || '—';
  for (const [r, g] of Object.entries(h.yaExiste.deLoQueReutiliza)) L.push(`- UX que ya existe de ${r}: ${fmt(g)}`);
  L.push(`- Diseño que ya menciona esta historia: ${fmt(h.yaExiste.deLaHistoria)}`);
  L.push(`- Preguntas abiertas: ${h.preguntasAbiertas.map((q) => q.id).join(', ') || '—'}`);
  L.push(`- Estados de interfaz: ${h.estadosUi.join(', ') || '—'}`);
  L.push(`- Partes de la estimación: ${Object.entries(h.estimacionUx.partes).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}
L.push('');
L.push(`Gestión del paquete en la KB: ${Object.entries(p.yaExiste.gestion).map(([t, ids]) => `${NOMBRES[t] ?? t} (${t}) ${ids.length}`).join(', ') || '—'}`);
console.log(L.join('\n'));
