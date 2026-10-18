# Reglas de carga a Notion

## Quién hace qué
- **El orquestador (Claude)** decide qué subir, prepara los archivos, valida y verifica leyendo Notion.
- **opencode** ejecuta la subida (instrucciones en `prompts-opencode/`). Esta regla de Enzo es permanente.
- **Codex** redacta en solo lectura el contexto de las preguntas, en lotes de 4 (`contexto-codex.sh`). Claude valida el resultado con `contexto-validar.js` antes de subirlo.
- **Una persona** decide: estados de cierre, aprobaciones, elecciones entre alternativas. El agente comprueba indicadores, nunca aprueba ni confirma por nadie.

## Qué no se pisa
- Campos humanos: Estado, Respuesta, Decidido por, Fecha de decisión, Estado del documento, Aprobado por, Nivel de cierre, Decisión humana.
- Para filas ya editadas usar solo `notion-sync.js upsert --solo-props` (con `ifEmpty`/`ifValues`) y `--solo-relaciones [--reemplazar]`. Nunca el `upsert` completo sobre Preguntas ya editadas.
- Las páginas de documentos son espejo de lectura («no se edita aquí»). En Notion solo se editan preguntas, estados, respuestas y comentarios; cualquier cambio de texto lo regenera el agente desde el archivo.
- Borrar o archivar bases lo hace Enzo.

## Antes de cada carga
1. `git fetch origin develop` en el worktree. Historias, paquete y decisiones (RCP-001: ARQ/DH) salen de `origin/develop`; el worktree puede estar atrasado.
2. Comparar con la huella de la última carga y marcar *Vigencia = Revisar por cambio de fuente* donde cambió la fuente.
3. Revisar `pendientes.json`.

## Contenido de cada página
- Cuerpo = copia fiel del archivo del repo, sin frontmatter, con enlaces absolutos al repo (`prepare-body.js`) y las referencias BR/DH/ARQ/HU enlazadas. Los resúmenes «En 30 segundos» solo viven en Notion y se redactan para todos los documentos de las historias nuevas.
- Texto de IA siempre rotulado «(IA)», sin nombrar el modelo.
- Pregunta: título = `ID · pregunta completa`; contexto, qué se evalúa, alternativas, propuesta o resolución (con cómo funcionaría, diagrama Mermaid si es un flujo, evidencia con grado D/I y límites); debajo, el texto original.
- No inventar identificadores, reglas ni enlaces: `contexto-validar.js` comprueba que cada BR/DH/ARQ/HU citado exista en `origin/develop`.

## Después de cada carga
Verificar leyendo Notion (conteos, relaciones, una muestra de páginas). No dar una carga por buena solo con el informe del ejecutor. Recalcular los indicadores de bloqueo (se recalculan solos al cambiar estados).

## Límites de la API de Notion
- Una relación admite como máximo 100 elementos por petición: para más, enlazar desde el lado de la pregunta (`uxs-preguntas.js`).
- Al leer una página, Notion recorta cada relación a 25 elementos: usar la propiedad paginada (ya hecho en `--solo-relaciones`).
- No existe rollup de un rollup: usar una fórmula intermedia.
- La API no renombra opciones de select, no oculta propiedades vacías ni crea vistas. Las vistas se hacen a mano o con opencode y el MCP oficial.
- Las sesiones `claude -p` con el MCP `notion` a veces no conectan a tiempo: reintentar una vez. Las herramientas de borrado las bloquea el clasificador.
- Evitar `node -e` y reemplazos con barras invertidas; editar con archivos. En Windows, `process.exit` tras `fetch` puede dar un fallo de libuv: usar `process.exitCode`.

## Si Notion u opencode no están disponibles
Seguir en el repo y anotar en `pendientes.json` `{fase, ids, script, motivo, fecha}`. Al empezar la siguiente sesión, avisar y subir en orden. No avanzar al paso siguiente si depende de que las preguntas del anterior estén ya en Notion.

## Vistas de Notion (opencode + MCP oficial)
- Se crean con el MCP oficial desde opencode (`notion-create-view`, `notion-update-view`): filtros, agrupación por propiedades reales, propiedades visibles y orden. Con `parent_page_id` se crea una vista enlazada dentro de una página.
- **No se puede agrupar por una fórmula** (p. ej. *Situación*): agrupar por *Estado* y mostrar *Situación* como columna. **Subagrupar solo existe en tableros.**
- En la base Preguntas existen las vistas: Bloquean el diseño, Por situación, Por confirmar, Revisar por cambio de fuente, Por flujo, Por pantalla, Por exploración y Por historia. Cada página de flujo, pantalla, exploración, UXS-001 y DSP-001 lleva «Preguntas de esta página», filtrada por la relación con esa página y sin duplicadas.
- **Las recargas de contenido pueden quitar estas vistas** (el volcado reemplaza el cuerpo de la página): después de recargar un documento hay que volver a crear su vista enlazada. Prompts de ejemplo en `prompts-opencode/` (`opencode-vistas-*.md`).
- Contar siempre las filas devueltas por una vista nueva (`notion-query-data-sources` en modo vista) y compararlas con lo esperado.
