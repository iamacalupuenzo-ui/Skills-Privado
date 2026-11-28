# Tareas y Notion

Leer al empezar o cerrar una tarea, y antes de la primera carga a Notion de la sesión.

## Índice

1. Mejoras del proceso y MR
2. Tareas con em-gestion-tareas
3. Módulo Notion

## 1. Mejoras del proceso y MR

Leer también `references/mejoras-del-proceso.md` al iniciar el paso 0 y, al cerrar cada fase, anotar ahí cada hueco encontrado (validación, automatización o job) con su estado. Después de cada merge, recargar en Notion los documentos de la rama con `DESIGN_REF=develop` y corregir los enlaces de las notas de GitLab. Toda entrega cierra con la tabla de MR: enlace, qué trae y orden de merge.

**Tareas al ritmo del trabajo (Enzo, 2026-11-26).** Cada skill que termina un paso entrega su evidencia y en ese mismo turno se llama a `em-gestion-tareas`: al abrir el MR, AVANCE (estado «En curso», línea de MR y enlaces provisionales a la rama); al fusionarlo, CIERRE de las tareas que ese MR completa (casillas con evidencia, Artefactos que produce, Resultado, «Completada» y la línea del Plan en la madre). Una casilla sin evidencia no se marca: se escribe qué falta y se le pregunta a Enzo. No se pasa al paso siguiente con tareas terminadas sin cerrar.

## 2. Tareas con em-gestion-tareas

Toda tarea que este orquestador ejecuta se registra con `em-gestion-tareas`; ningún otro skill escribe en la base Tareas, en issues ni en ClickUp.

- **Antes de empezar** (paso 0): las tareas existen y la KB está revisada con `cambios-kb.mjs`.
- **Al empezar** una tarea UX (y al recibir un paquete: modo RECIBIR): modo AVANCE (estado «En curso»). Si la tarea no existe, se pide; no se crea sin su mapeo.
- **Al pasar cada compuerta** (G1 a G7, GU): modo AVANCE con la salida de `audit_ux.py --compuerta` como evidencia. Así cada avance deja su trazabilidad sin depender de la memoria.
- **Al terminar cada paso con evidencia** (MR, artefacto, comentario): modo AVANCE con los enlaces, para marcar su casilla. Mientras el trabajo vive en la rama `ux/*`, la rama y el commit son evidencia provisional; al fusionar se cambian por el enlace a `develop`.
- **A mitad del trabajo**: la tabla del paso 4 (bloqueo, AJUSTAR o nota).
- **Al terminar la tarea**: modo CERRAR con la evidencia. Cerrar marca criterios, cierre, Plan de la madre y Resultado; GitLab y ClickUp esperan su fecha límite.
- Las capturas y «Cómo funciona» las agrega el ejecutor en la misma tarea; `em-gestion-tareas` no las sube.

Con la auditoría limpia, o los errores restantes declarados, cierra según la sección 4 de `references/worktree-protocol.md`: `graphify update .`, resumen de cambios y decisiones pendientes, y propuesta de merge, PR, conservar o descartar. Espera la respuesta; no hagas commit, merge ni borres el worktree por iniciativa propia.

## 3. Módulo Notion

**Activación.** Si junto a este archivo existe `notion/config.json` con `"activo": true`, el módulo está activo; si el usuario dice «sin Notion», se omite en esa sesión. El catálogo conserva el módulo personal; su configuración y los cargadores opcionales no eximen del ciclo obligatorio. Si el usuario pide «sin Notion», respetarlo y declarar la sincronización pendiente, sin cierre integral. Antes de la primera subida de la sesión lee `notion/LEEME.md` y `notion/reglas-de-carga.md`; la especificación completa está en `notion/arquitectura-preguntas.md`.

**Al empezar** (cuando el usuario diga «tenemos este paquete de historias»):
1. Ejecuta `notion/scripts/conciliar-kb-notion.js` en solo lectura y revisa sus diferencias con una persona. Revisa `notion/pendientes.json`: si hay subidas pendientes, avísalas y súbelas en orden.
2. Lee la rama indicada en config.json y compara con la huella de la última carga, incluidas fuentes de PO, Arquitectura e Infraestructura; propone *Vigencia = Revisar por cambio de fuente*. No apliques diferencias ni cambies estados sin aprobación.
3. Crea o actualiza en Notion el proyecto y el producto si no existen. El paquete de alcance, las historias y las tareas los crea `em-gestion-tareas` (modo RECIBIR).
4. Propón la lista de **módulos** (un módulo = un flujo) con el orden sugerido y espera la confirmación del usuario antes de seguir.

**En cada fase, primero el KB y después Notion (Enzo, 2026-11-14).** Toda respuesta, decisión y cambio de estado se registra primero en Open questions del UXR, FLW o SCR; una decisión deja además un DEC. Luego los scripts suben lo aprobado. Antes de cargar y cerrar, ejecuta la conciliación de solo lectura KB↔Notion: una persona resuelve las diferencias y autoriza su aplicación. No esperes al fin de sesión para devolver decisiones al repo. Consulta el mapa de estados y la estructura Resolución en `notion/arquitectura-preguntas.md`.

| Fase | Skill | Se sube | Base |
|---|---|---|---|
| Historias de experiencia | `ux-requirements-analyzer` | UXR con resumen «En 30 segundos»; sus preguntas con ficha (contexto, qué se evalúa, alternativas, propuesta o resolución) | Requerimientos UX, Preguntas |
| Flujos | `user-flow-designer` | Flujos | Flujos |
| Pantallas | `ui-spec-writer` | Una fila por pantalla | Pantallas |
| Conjunto | `ux-context-builder` | UXS con el veredicto por consumidor (Claude Design, Stitch, Figma, Desarrollo y QA) | Especificaciones UX |
| Exploración | `claude-design-orchestrator` o `stitch-ui-generator` | Exploración y enlace al lienzo | Exploraciones |

Con el módulo activo se **omiten** las fases de diseño gobernado en Figma y de handoff (el usuario entrega a desarrollo el paquete completo: historias de experiencia, flujos, pantallas y UXS), y no se emiten los veredictos de Figma ni de Desarrollo. `accessibility-reviewer` verifica lo implementado antes de Validado; no se omite en la vía directa a código. Los resúmenes «En 30 segundos» se redactan para todos los documentos de las historias nuevas y viven solo en Notion.

**Preguntas.** Nacen y se mantienen en Open questions del KB. Estados: Abierta, Propuesta UX, Propuesta, Decidida, Diferida y Descartada. Propuesta UX es solo para validaciones de Enzo; las propuestas de PO, Arquitectura, Seguridad o Analista no se tocan ni se remapean. Si se mezclan PO y UX, decide el PO y UX propone. Diferida queda fuera del paquete o piloto actual y se reabre al construir esa función. La IA puede cerrar prácticas estándar UX (textos, estados vacíos, mensajes, formatos, patrones) con benchmarking, DEC, fecha y fuentes, como «IA (delegado por Enzo)»; nunca negocio, permisos, datos o alcance. Respuesta en Notion: resumen de hasta 200 caracteres, con [Confirma: X] si está pendiente; cuerpo Resolución con heading_3 Respuesta, Fuentes y evidencia, Quién decide e Impacto, sin heading_1.

**Cierre de módulo.** Exige conciliación completa KB↔Notion sin diferencias abiertas, documentación aprobada y evidencia de validación. No aplica automáticamente el informe ni remapea estados. Los cambios de fuentes de Arquitectura, PO o Infraestructura también se comparan con la huella de la última carga y proponen Vigencia = Revisar por cambio de fuente.

**Si Notion u opencode no están disponibles.** Conserva el trabajo local y registra los pendientes con su motivo; no declares el cierre integral ni avances en las piezas bloqueadas por B1/B2.
