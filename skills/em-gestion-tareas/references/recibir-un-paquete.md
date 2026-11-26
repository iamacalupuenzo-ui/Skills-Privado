# Recibir un paquete (modo RECIBIR)

Probado con el DSP-009 (Identidad visual del Cliente y base del Producto) el 2026-11-26.

## Pasos

1. **Actualizar la KB sin tocar el clon:** `git fetch` con el token de npm en el encabezado (memoria «Git contra GitLab») y leer siempre `origin/develop`.
2. **Leer:** `node scripts/leer-paquete.mjs DSP-0NN --kb <clon> --json lectura.json`. Da por historia la plataforma, los criterios de aceptación (AC) por tipo (nuevo, reutiliza, validación, sin tipo), las preguntas abiertas, los estados, lo que ya existe en la KB y la estimación de UX.
3. **Juzgar lo que el script no sabe:**
   - Una historia con los AC «sin tipo» tiene un impacto poco fiable: el agente lo juzga leyendo la historia.
   - **Lo ya construido por Desarrollo:** leer los issues de Desarrollo de cada historia (casillas, estado, rama). Si Desarrollo va adelante, las tareas FRONT son de **revisión**, no de construcción.
   - **La micro UI:** `architecture/REPOS-001` de la KB, las decisiones de Arquitectura del paquete (`questions/design/consultas/RSP-ARQ-*`) y las ramas de las micro UI. Muchas pantallas ya las construyó Arquitectura o están en otra micro UI.
   - **Componentes:** si lo que necesita la pantalla existe en otra micro UI o en el Design System, o si hay una brecha.
4. **Mapear:** un JSON con la estructura de `estructura-de-la-tarea.md`. Subtareas agrupadas por relación entre historias. Horas del modelo, ajustadas por lo que ya existe.
5. **Validar:** `node scripts/armar-mapeo.mjs mapeo.json --kb <clon> --salida paginas.json`. Si no pasa, no se escribe.
6. **Mostrar el mapeo a Enzo** si cambia la lógica habitual (una revisión en lugar de construcción, un tipo nuevo). Si sigue el patrón, se crea directo: la escritura en Notion está aprobada.
7. **Crear en Notion, en este orden:**
   1. Las historias que falten en la base Historias (Catálogo «RCP-001 CL2 Flotas»), con su enlace a la KB.
   2. El registro del paquete en Paquetes de alcance (estructura de la plantilla «Nuevo proyecto»: Qué se logra, Alcance, Tareas, Riesgos y decisiones).
   3. Las madres y después las subtareas, con `Tarea padre`.
   4. `Bloqueada por` en cada subtarea.
8. **Guardar el mapeo** junto a las demás entregas del paquete y anotar en `ids.json` la URL de Notion de cada tarea.
9. **Publicar** (modo PUBLICAR) solo si Enzo lo pide.

## Estimación

`config/modelo-estimacion.json` es una hipótesis calibrada con un solo dato (DSP-006, 39 h de UX).
Se recalibra con las horas reales de DSP-004, 005 y 007 en Notion cuando cierren. Las horas que el
script da son un punto de partida; el agente las ajusta y lo dice.
