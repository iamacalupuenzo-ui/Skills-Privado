#!/usr/bin/env node
// Guarda la decisión de Enzo sobre las subidas a GitLab y ClickUp (B1):
//   delegar   → el agente ejecuta sin pedir confirmación por paso hasta el fin del día (hora de Lima).
//   intervenir → cada subida espera su confirmación (comportamiento por defecto).
// El hook guardia-tareas.mjs lee este archivo y deja de preguntar mientras la delegación sea de hoy.
//
// Uso: node delegar.mjs delegar | intervenir | estado
// Archivo: ~/.claude/em-gestion-tareas/delegacion.json (o la ruta de EM_GESTION_DELEGACION).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ARCHIVO = process.env.EM_GESTION_DELEGACION || path.join(os.homedir(), '.claude', 'em-gestion-tareas', 'delegacion.json');
const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
const orden = process.argv[2];

if (orden === 'delegar') {
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  fs.writeFileSync(ARCHIVO, JSON.stringify({ fecha: hoy(), decision: 'delegar' }, null, 2));
  console.log(`Delegado hasta el fin del ${hoy()}: las subidas a GitLab y ClickUp se ejecutan sin confirmación por paso.`);
} else if (orden === 'intervenir') {
  fs.rmSync(ARCHIVO, { force: true });
  console.log('Cada subida a GitLab y ClickUp espera tu confirmación.');
} else if (orden === 'estado') {
  let d = null;
  try { d = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')); } catch { /* sin delegación */ }
  console.log(d?.decision === 'delegar' && d.fecha === hoy() ? `delegado (${d.fecha})` : 'intervienes');
} else {
  console.error('Uso: node delegar.mjs delegar | intervenir | estado');
  process.exit(2);
}
