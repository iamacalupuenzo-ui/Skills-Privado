# Llamados: quién usa este skill y cuándo

Mapeado el 2026-11-26 sobre los 46 skills. Antes de esa fecha ningún orquestador lo llamaba y las
tareas solo se actualizaban cuando Enzo lo pedía.

## Orquestadores (únicos que llaman a Avance y Cerrar)

| Orquestador | Cuándo llama |
|---|---|
| `em-orquestador-ux` | Al recibir un paquete (Recibir), al empezar cada tarea UX (Avance), al terminar cada artefacto (Avance con el MR o el archivo) y al cerrar (Cerrar) |
| `orquestador-desarrollo` | Al empezar una tarea FRONT o DS (Avance), al abrir o fusionar un MR (Avance) y al terminar (Cerrar) |
| `orquestador-desarrollo-movil` | Igual que el de desarrollo, para la biblioteca y la app móvil |

Lo que pasan: la clave o la URL de la tarea en Notion, el modo y la evidencia (enlaces). Si no
encuentran la tarea, la piden; no la crean sin mapeo.

## Ejecutores (no llaman a este skill)

`flujo-producto`, `flujo-ds`, `flujo-app-movil`, `flujo-ds-movil`, `ux-a-desarrollo`,
`accessibility-reviewer`, `ui-spec-writer`, `user-flow-designer`, `ux-requirements-analyzer`,
`ilustraciones-ds`… Agregan sus capturas y «Cómo funciona» en la tarea y devuelven al orquestador
la evidencia de lo hecho.

## Skills que dejan de crear tareas

| Skill | Se queda con | Delega aquí |
|---|---|---|
| `gestion-proyectos` | Proyecto, sprint, riesgos, salud y reportes | Crear, publicar, avanzar y cerrar tareas |
| `product-orchestrator` | Épicas, segmentación y ruteo | Las tareas que salen de un plan |
| `epica-a-plan-desarrollo` | Épicas, historias y casos de uso | Las tareas del plan |
| `gestor-notion` | Registros, relaciones y plantillas generales | Las páginas de la base Tareas |
| `em-orquestador-ux` (módulo Notion) | Conciliar UXR, FLW y SCR entre la KB y Notion | El registro del paquete, las historias y las tareas (modo Recibir) |
