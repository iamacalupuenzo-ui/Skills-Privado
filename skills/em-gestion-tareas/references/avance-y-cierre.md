# Avance y cierre

Este skill **marca lo que el ejecutor demostró**. No ejecuta, no da el trabajo por terminado y
no sube capturas (B16). El ejecutor (flujo-producto, flujo-ds, ux-a-desarrollo,
accessibility-reviewer…) entrega la evidencia; el orquestador llama a este skill con ella.

## AVANCE

| Momento | Notion | GitLab y ClickUp |
|---|---|---|
| Empieza la tarea | Estado «En curso» | No cambia: el tablero depende de la fecha (B4) |
| Termina un paso con evidencia | Marca su casilla de «Criterios de aceptación» y agrega el enlace en Trazabilidad (MR, artefacto, comentario) | Marca la misma casilla en la descripción, con confirmación (B1) |
| Se abre un MR | Línea en «MR» de Trazabilidad | Igual |
| MR abierto sin fusionar al terminar | Estado «Finalizada - falta merge» | ClickUp «review» (mapeo) |
| Pasa una compuerta UX (G1 a G7, GU) | Casilla del criterio que cubre, con la salida de `audit_ux.py --compuerta` como evidencia | Igual, con confirmación (B1) |
| Evidencia aún en la rama `ux/*` | Enlace a la rama y al commit, marcado «provisional»; al fusionar se cambia por el de `develop` | Igual |
| **Con nota:** cambió la KB y la tarea sigue igual | Línea en «Trazabilidad → Cambios de la KB»: fecha, documento, sección («HU-01-16 · AC-4») y enlace. No marca casillas | Nota en el issue con el mismo texto, con confirmación |
| **Con bloqueo:** pregunta abierta de otro responsable | Línea en «Bloqueada por»: la pregunta, quién responde y qué desbloquea; «En pausa» si frena toda la tarea | Nota y `Task :: Stand By / Blocked` si se pausó, con confirmación |

Las notas y los bloqueos salen del informe de `ux-ui-orchestrator/scripts/cambios-kb.mjs` (paso 0 del orquestador). Las notas se aplican con `scripts/notas-kb.mjs <cambios.json> <mapeo.json>`, que las guarda en `cambiosKb` del mapeo, y después `armar-mapeo.mjs` y `escribir-notion.mjs`: así una regeneración no las borra. Los bloqueos se aprueban con Enzo antes de aplicarse.

## AJUSTAR

Trabajo nuevo a mitad de la ejecución. Se edita el mapeo del paquete (el JSON que validó
`armar-mapeo.mjs`): se agrega la subtarea con su alcance, criterios, `cubre` e historias, o se
retira la que dejó de tener sentido (queda «Descartada» con el motivo, nunca se borra). Se valida
con `armar-mapeo.mjs`, se crea o reescribe en Notion con `escribir-notion.mjs` y la madre
actualiza su Plan. Si el paquete ya está publicado, la tarea nueva se sube con PUBLICAR, en seco y
con confirmación.

Las capturas y «Cómo funciona» los agrega el ejecutor en la misma página
(`flujo-producto/references/evidencia-de-avance.md`).

## CERRAR

1. **Buscar la evidencia de cada casilla** de «Criterios de aceptación» y de «Condición de cierre»: MR fusionado, archivo en `develop`, comentario en el issue de la historia, reunión. Lo que no tiene evidencia no se marca y se pregunta (B9).
2. **Marcar** las casillas con evidencia, en Notion y en GitLab y ClickUp (estos con confirmación).
3. **Trazabilidad:** llenar «Artefactos que produce» con el enlace de cada archivo en `develop`.
4. **Resultado:** resumen de una o dos líneas, enlace y fecha; la propiedad Resultado pasa a «Listo».
5. **Estado:** «Completada» y `Fecha real de cierre`, solo si todas las casillas de cierre están marcadas. Si falta alguna, queda en su estado y se dice qué falta.
6. **Madre:** marcar la línea de la subtarea en su «Plan». Cuando todas están marcadas, se cierra la madre con el mismo procedimiento.
7. **GitLab y ClickUp** se cierran el día de su fecha límite entre las 17:00 y las 18:00 de Lima (`tablero-dia.mjs cierre`), no antes.

## Cómo se marca una casilla en cada sistema

- **Notion:** `notion-update-page` con `update_content`, cambiando `- [ ] <texto>` por `- [x] <texto>`; se cambia solo esa línea.
- **GitLab:** leer la descripción, cambiar la línea y `PUT /issues/<iid>` con la descripción completa. Se muestra el cambio antes (B1).
- **ClickUp:** igual, con `markdown_description`.
