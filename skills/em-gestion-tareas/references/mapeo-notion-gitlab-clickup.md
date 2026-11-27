# Mapeo de tareas entre Notion, GitLab y ClickUp

Aprobado por Enzo Macalupu el 2026-11-14. Notion es la fuente principal, GitLab la secundaria y
ClickUp la visibilidad del equipo. Una tarea sabe dónde vive en los demás por dos campos de Notion:
`Issue` (GitLab) y `ClickUp` (enlace de la tarea en ClickUp).

## Caminos

| Camino | Cuándo | Qué se hace |
|---|---|---|
| Notion → GitLab → ClickUp | Tarea de desarrollo o de diseño con issue | Se crea en Notion, el issue sale de ella (`em-gestion-tareas`, modo PUBLICAR) y después la subtarea en ClickUp |
| Notion → ClickUp | Tarea sin código ni issue (C-GO, capacitación, revisiones) | De Notion pasa directo a ClickUp |
| ClickUp → Notion | Tarea abierta **asignada a Enzo** en ClickUp que no está en Notion | Entra a la Bandeja de Notion con su enlace en `ClickUp`. Las tareas de otras personas no se tocan |

## Niveles

- Una tarea padre de ClickUp (por ejemplo, «C-Locator 2: Versiones, publicación y distribución») equivale a una tarea padre de Notion (`Tarea padre`/`Subtareas`).
- Cada tarea de Notion es una subtarea en ClickUp y, si lleva código o un entregable versionado, un issue en GitLab.

## Estados

| Notion | ClickUp | Nota |
|---|---|---|
| Bandeja, Por hacer | Open | |
| En curso | in progress | |
| Finalizada - falta merge | review | |
| Completada | finalizado | Solo si su fecha límite es hoy o anterior; si vence después, ClickUp espera a esa fecha (no adelantar) |
| Casilla «En pausa» (con cualquier estado) | en pausa | En GitLab: etiqueta `Task :: Stand By / Blocked`, sin cerrar. En Notion la tarea conserva su estado, incluso Completada, y lleva la casilla (Enzo, 2026-11-14) |
| — | Closed | No se usa desde aquí |

**Las fechas se cumplen (Enzo, 2026-11-14).** En Notion una tarea se termina cuando se termina. En GitLab y en ClickUp se cierra **el día de su fecha límite**, ni antes ni después, aunque no tenga horas registradas. Si en Notion se terminó antes, GitLab y ClickUp esperan a esa fecha. Al llegar la fecha, **al final de la jornada, entre las 17:00 y las 18:00, hora de Lima (America/Lima, UTC−5)**, el issue se cierra y la tarea de ClickUp pasa a «finalizado»; antes de esa hora no se mueve (Enzo, 2026-11-15). Mientras tanto, una tarea Completada en Notion sigue «in progress» en ClickUp y abierta en GitLab. Cada día se revisa qué vence hoy.

**El tablero muestra solo lo del día (Enzo, 2026-11-16).** En GitLab y ClickUp el estado de una tarea abierta depende de su fecha límite, no de si ya está terminada en Notion:

| Vence | GitLab | ClickUp |
|---|---|---|
| Hoy | `Task :: In Compromise` | in progress |
| Mañana (siguiente día hábil) | `Task :: In Progress` | in progress |
| En 2 días o más | `Task :: To Do` | Open |

No se da estado de avance en GitLab ni en ClickUp a lo que vence más adelante. Notion sí refleja el estado real. Las etiquetas `Task ::` tienen ámbito: se envía solo `add_labels` (con `remove_labels` del mismo ámbito GitLab quita también la nueva). Script de referencia: `tablero-dia.mjs`.

## Formato en ClickUp (acordado con Katherine Uribe, Coordinadora de Diseño UX/UI, 2026-11-16)

- **Título:** `PRODUCTO: título`, por ejemplo «CL2: AUD-UX · 01 — Mapa de las historias de Auditoría» o «C-GO: Reunión gerencial». Códigos: CL2, C-GO, SVR, CL, APP TÉCNICO, KUYRAPET, SMART TRACING. Si el resto empieza con una categoría («Backoffice: …»), queda «CL2: Backoffice — …». Las tareas internas del equipo (procesos, skills, capacitación, Zoho, Monark) van con el prefijo «UX/UI:» y **sin** etiqueta de producto (Enzo, 2026-11-16).
- **GitLab no lleva prefijo:** sus títulos los mantiene Desarrollo. La correspondencia vive en la descripción de ClickUp: primera línea `**Nombre en GitLab:** <título exacto>` y luego el enlace al issue.
- **Siempre prioridad** (Notion Alta/Media/Baja → high/normal/low; sin dato, normal) y **al menos dos etiquetas**: una de producto y una o más de actividad. Aplica también a las tareas finalizadas y cerradas.
- **«finalizado» es solo del mes en curso.** Lo que venció en meses anteriores pasa a «Closed».
- **Tareas antiguas reemplazadas por una vinculada a GitLab:** no se eliminan. Pasan a «Closed» con una primera línea `Reemplazada por: <enlace>`, para no contar dos veces y conservar el historial.
- Respetar el límite de la API de ClickUp (100 llamadas por minuto): pausa de ~1 s entre escrituras. Script de referencia: `cu-formato.mjs`.

## Descripción de la tarea en ClickUp

Es la misma que la del issue (`estructura-de-la-tarea.md`, aprobada el 2026-11-26), generada por `armar-mapeo.mjs`: primera línea «Nombre en GitLab», el enlace al issue, la cabecera, Alcance, Criterios de aceptación, Condición de cierre y Trazabilidad. **No se menciona Notion** en ClickUp ni en GitLab.

No toda tarea de Notion sube a GitLab ni a ClickUp: Enzo elige cuáles.

## Campos

- Lista de ClickUp: Espacio del equipo [ES-LA] → Diseño UX/UI → «Tareas del equipo» (901714403439). Responsable: Enzo (101231538).
- Etiquetas de ClickUp, siempre dos: «producto …» (cl2, c-go, app técnico, kuyrapet, svr…) y «actividad de …» (diseño ui, diseño ux, revisión, documentación, investigación, implementación…). Se usan los nombres exactos que ya existen.
- Fechas: inicio y fecha límite iguales en los tres sistemas. Las fechas de ClickUp no se adelantan.
- Prioridad: Notion Baja/Media/Alta → ClickUp low/normal/high. `urgent` solo si Enzo lo pide.
- Horas (propuesta, falta confirmar): la estimación de ClickUp (`time_estimate`) = Horas humano estimadas, igual que `/estimate` en GitLab. El tiempo registrado en ClickUp = el `/spend` de GitLab (horas reales que Enzo indica, por día). Las horas con IA viven solo en Notion y nunca van a GitLab ni a ClickUp.

## Reglas

- Nada se crea, se mueve ni se cierra en ClickUp o GitLab sin la confirmación de Enzo. Primero se muestra una corrida en seco.
- Antes de escribir, se concilia por enlace (`Issue`, `ClickUp`). Solo si falta el enlace se compara por nombre, y esa coincidencia la confirma Enzo.
- El token de ClickUp se lee de `~/.clickup/token.txt` y nunca se imprime.
