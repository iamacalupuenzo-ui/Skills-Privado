# Trazabilidad

**Regla (Enzo, 2026-11-26): la trazabilidad apunta a GitLab.** Notion también lleva la sección,
con los mismos enlaces que el issue, por tres motivos:

1. **La KB es la fuente y Notion su reflejo.** Un enlace a `develop` muestra siempre la versión vigente; una copia en Notion envejece.
2. **Enzo lee en Notion.** Desde la tarea llega en un clic al issue, a la historia y al artefacto.
3. **El cierre la necesita.** La evidencia de una casilla es un enlace: el MR fusionado, el archivo en `develop`, el comentario.

GitLab y ClickUp nunca enlazan a Notion (`armar-mapeo.mjs` lo rechaza).

## Qué lleva

| Línea | De dónde sale | Cuándo |
|---|---|---|
| Paquete | `paquete.ruta` (archivo del DSP en la KB) y `paquete.issue` | Al crear |
| Cada historia | Su issue, su archivo en la KB y los issues de Desarrollo y Calidad | Al crear |
| Tarea madre / Bloqueada por | Las otras tareas del mapeo o un issue (`#272`) | Al crear; el número se resuelve al publicar |
| Artefactos que usa | Los códigos del mapeo (`UXR-010`, `FLW-004`…), resueltos a su archivo con `git ls-tree` de la KB | Al crear |
| Referencias | Decisiones, consultas y avisos (`RSP-ARQ-…`, `DEC-…`) | Al crear |
| Artefactos que produce | Lo que se fusionó en `develop` de la KB | Al cerrar (modo Cerrar) |
| MR | Los MR de la tarea | Cuando se abren |

En GitLab los issues van como `#268` (GitLab los enlaza y muestra el estado). En Notion y ClickUp
van como enlace completo. Un artefacto que no tiene un único archivo en la KB hace fallar el mapeo:
se corrige el código antes de crear.

## De dónde salen los artefactos

`leer-paquete.mjs` busca con `git grep` qué UXR, FLW, SCR y UXS mencionan cada historia y cada
historia que reutiliza (`yaExiste`). Esa lista es la base de «Artefactos que usa»; el agente
deja solo los que la subtarea de verdad toca.

## Referencias entre tareas antes de publicar

Antes de que exista el issue, GitLab y ClickUp llevan `⟦IDV-UX · 01⟧`. `publicar.mjs` lo reemplaza
por el número en una segunda pasada y se detiene si queda alguno. Notion muestra «issue pendiente
de publicar» hasta que se vuelve a correr `armar-mapeo.mjs --ids ids.json`.
