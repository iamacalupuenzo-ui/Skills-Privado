#!/usr/bin/env node
// Hook SessionStart de Claude Code: al empezar una sesión, avisa si cambiaron en la KB los UXR, flujos, pantallas o
// decisiones de un paquete que se está desarrollando (los que registró `scripts/seguir-paquete.mjs registrar`).
// Nunca bloquea: si algo falla (sin VPN, sin KB), se calla. El aviso entra como contexto para el agente, que se lo
// cuenta a Enzo y aplica references/seguimiento-de-cambios.md.
import { revisar } from '../scripts/seguir-paquete.mjs';

try {
  const res = revisar({ fetch: process.env.UX_SEGUIMIENTO_SIN_FETCH !== '1' }).filter((r) => r.cambios?.length);
  if (res.length) {
    const lineas = ['Cambios de diseño en la KB desde la última revisión (ux-a-desarrollo, seguimiento de paquetes):'];
    for (const r of res) {
      lineas.push(`- ${r.paquete}: ${r.cambios.length} artefactos (último cambio: ${r.ultimo})${r.traido === false ? ' — sin fetch, comparado con la copia local' : ''}`);
      for (const c of r.cambios.slice(0, 15)) lineas.push(`  - ${c.tipo}: ${c.ruta}`);
      if (r.cambios.length > 15) lineas.push(`  - y ${r.cambios.length - 15} más`);
    }
    lineas.push('Avisa a Enzo al inicio, revisa qué cambió frente al código (references/seguimiento-de-cambios.md) y, cuando esté revisado, corre `seguir-paquete.mjs visto`.');
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: lineas.join('\n') } }));
  }
} catch {
  // Silencio: el hook informa, no bloquea.
}
process.exit(0);
