// La carga histórica se reemplazó por respuestas canónicas del KB (2026-11-14).
// Sin --aplicar-plan solo prepara un plan; no restaura estados ni respuestas antiguas.
require('../subir-respuestas.js').main().catch(e => { console.error(e.message); process.exitCode = 2; });
