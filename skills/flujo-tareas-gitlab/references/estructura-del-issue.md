# Estructura de un issue de tarea

Copiada de la estructura que ya usa el equipo en el proyecto `collaboration` de CL2 Flota. Se verificó en octubre de 2026 con las tareas UX14 (#40 a #57) y el ejemplo `svr-basico#14061`.

## Título

`<HISTORIA> · <CÓDIGO> — <Entregable>`

- Ejemplos: `UX14 · CA3.5 — Biblioteca de componentes reutilizables…`, `US8 · …`, `US9 · …`.
- El nombre es el **entregable en sustantivo**, igual que la casilla de la historia que lo origina. No un verbo ni un paso.
- El cuerpo se envía en UTF-8 desde un archivo, no desde la línea de comandos (las tildes se corrompen).

## Etiquetas

- `Task` en toda tarea.
- La etiqueta de estado de la lista del tablero (`Task :: To Do`, `Task :: In Progress`, `Task :: In Review`, …). Ver `tablero-y-compromiso.md`.
- Una tarea cerrada conserva solo `Task`.

## Hito, responsable y fecha

- **Hito:** el sprint activo. Si venció, confirmar cuál usar (GUARD 1).
- **Responsable:** una persona (`assignee_ids`).
- **Fecha límite** (`due_date`): la de Notion.

## Enlace a la historia

Cada issue lleva un enlace `relates_to` a su historia (por ejemplo `#14` «Experiencia del Usuario»). Se crea con la API de enlaces (`api-issues.md`).

## Descripción

```
[[_TOC_]]

## Qué hay que hacer
<una o dos frases con el entregable>

## Outputs
- <lo que se entrega>

## Criterios de aceptación
- CA-01 — <nombre>: DADO <contexto> CUANDO <acción> ENTONCES <resultado>

## Notas
<dependencias, decisiones>

## Trazabilidad
- Historia: #<n>
- Origen / Notion: <enlace>
- MR: <enlaces cuando existan>
```

Una versión corta, también usada por el equipo: `**Origen:**`, `**Responsable:**`, `## Estado` (🟢 Completo / 🟡 Parcial), `## Evidencia` (MR y enlace a Notion) y `## Pendiente para cerrar` (casillas).

## Tiempos

En una nota del issue, no en la descripción:

- `/estimate 1h30m` fija la estimación.
- `/spend 1h30m 2026-10-29` imputa tiempo; **la fecha va en la cantidad** y es el día trabajado.

Solo se cargan horas que el usuario indica. Las horas con IA y las humanas estimadas no van a GitLab.

## Después de crear

Poner el enlace del issue en la propiedad `Issue` de la tarea de Notion, si existe.
