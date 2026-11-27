# Tablero y compromiso del día

Verificado contra el proyecto `collaboration` (id 622) el 2 de noviembre de 2026.

## Listas del tablero «Sprint Backlog» (id 513)

`User Story` · `Status :: PENDING` · `Status :: IN PROGRESS` · `Status :: IN TESTING` · `Status :: TESTED` · `Status :: TO TEST` · `Task :: To Do` · `Task :: In Progress` · `Task :: In Compromise` · `Task :: Recurrente` · `Task :: In Review`

- Las listas `Status ::` son del flujo de las historias.
- Las listas `Task ::` son del flujo de las tareas.
- No se mezclan las dos familias en un mismo issue.

## Etiquetas de carga del día (con la descripción que tienen en GitLab)

| Etiqueta | Descripción |
|---|---|
| `In Compromise` | Issues comprometidos a cerrar en el día |
| `Carga :: In Progress` | Tareas de la carga diaria asignada como avance en el día |
| `Carga :: In Compromise` | (sin descripción) |

De ahí se puede afirmar, porque lo dice GitLab: lo que se **compromete** es lo que se piensa **cerrar el mismo día**, y lo que va como **avance** es lo que solo se trabaja ese día.

## Regla del compromiso (confirmada por Enzo el 4 de noviembre de 2026)

Al revisar las tareas, se valida cuáles **corresponden al día de hoy** y esas se etiquetan en la columna de compromiso (la lista `Task :: In Compromise`).

Cómo se aplica:

1. **Leer** las tareas abiertas del responsable (`api-issues.md`).
2. **Proponer** cuáles corresponden a hoy y por qué, con el criterio de abajo.
3. **Esperar la confirmación** del usuario (B1). No se mueve nada por iniciativa propia.
4. **Mover** solo las confirmadas: poner `Task :: In Compromise` y quitar la etiqueta de lista anterior (`Task :: To Do` o `Task :: In Progress`).
5. **Informar** qué se quitó y qué se puso, issue por issue.

Criterio propuesto para decir que una tarea corresponde a hoy (se muestra como propuesta, el usuario decide):

- Su fecha límite es hoy o ya pasó.
- Estaba en `Task :: In Progress` y no se cerró ayer.
- El usuario la nombra para hoy.

Una tarea sin fecha límite nunca entra sola: se pregunta.

## Fin del día (confirmado por Enzo el 4 de noviembre de 2026)

Lo comprometido que no se cerró se **reevalúa al día siguiente**: se vuelve a proponer con el mismo criterio y no se mueve solo. Se le avisa al usuario qué quedó sin cerrar al terminar el día.

## Hito del sprint

El 4 de noviembre de 2026 el único hito del proyecto es `Sprint 1: CL2 Flota Piloto` (id 1752), que venció el 30 de octubre. No existe uno del siguiente sprint. Al crear un issue se avisa y se pregunta cuál usar; no se reutiliza el vencido en silencio.

## Sigue por confirmar

No se aplican como regla hasta que se confirmen. Preguntar antes de actuar:

1. ¿Las etiquetas `In Compromise` y `Carga :: In Compromise` se usan junto con la lista, en lugar de ella, o están en desuso?
2. ¿Cuándo pasa a `Task :: In Review`: al abrir el MR o al pedir la revisión a César?
3. ¿Qué es `Task :: Recurrente` y cuándo se usa?
4. ¿El criterio de «corresponde a hoy» de arriba es el correcto o falta alguno?

## Mientras tanto

Al mover, se informa qué etiqueta se quitó y cuál se puso, y no se inventa una regla que nadie confirmó.
