# Módulo Notion del ux-ui-orchestrator (personal de Enzo Macalupu)

Hace que el orquestador mantenga al día la base de Notion «Gestión Operativa» (CL2 Flotas): sube lo que cada fase genera, gestiona las preguntas y devuelve las decisiones al repo. **Solo vive en esta copia local.** La copia del repo (`.claude/skills/ux-ui-orchestrator`, compartida con el equipo) no lo tiene y no debe tenerlo.

## Activación
Está activo cuando existe este `notion/config.json` con `"activo": true`. Si Enzo dice «sin Notion», se omite en esa sesión. Para desactivarlo del todo, poner `"activo": false` o renombrar la carpeta.

## Contenido
| Archivo | Para qué |
|---|---|
| `config.json` | Rutas (worktree, scripts), IDs de proyecto, producto y bases. **No contiene el token** (está en `~/.notion/token.txt`; nunca se imprime). |
| `arquitectura-preguntas.md` | Especificación completa: modelo de la base Preguntas, estados, regla de bloqueo, estructura de página, cierre de módulo, decisiones de diseño del módulo. |
| `esquema-bases.md` | Bases, propiedades y relaciones. |
| `reglas-de-carga.md` | Cómo se sube, qué no se pisa, qué se delega y límites de Notion. |
| `pendientes.json` | Cola de subidas que no se pudieron hacer. |
| `prompts-opencode/` | Instrucciones listas para delegar la subida en opencode. |
| `scripts/` | Cargadores genéricos (rutas relativas al módulo). `scripts/historico/` son los de la primera carga (DSP-001): referencia, con valores propios de ese paquete. |
| `trabajo/` | Archivos intermedios que generan los scripts (extracciones, cuerpos, resúmenes). Se puede vaciar. |

## Orden de los scripts para un paquete nuevo
1. Historias y paquete: `historico/subir-lote.sh` y `historico/lote-contenido.sh` como guía (con `prepare-body.js`).
2. UXR: `lote-doc.js uxr`; resúmenes «En 30 segundos»: `resumenes-codex.sh` → `unir-resumenes.js`.
3. Flujos, pantallas, exploraciones: `lote-diseno.js flw|scr|ib`.
4. Preguntas: `extraer-preguntas.js` → `lote-preguntas.js --lote=i/4` (cuatro tramos) → `preguntas-refs.js niveles|relaciones|estados` → `respuestas-dec.js` → `subir-respuestas.js` → `vigencia-inicial.js`.
5. Contexto de cada pregunta: `contexto-entradas.js` → `contexto-codex.sh` (Codex, en lotes de 4) → `contexto-validar.js` → `contexto-lote.js`.
6. UXS: `historico/cargar-uxs.js` como plantilla (ajustar ids) y `uxs-preguntas.js`.
7. Verificación: `notion-sync.js verify`, `comparar-enlaces.js`, `comparar-texto.js`, `tablas-irregulares.js`.

Ejecución: `node scripts/<script>.js` desde cualquier carpeta; usan `NOTION_TRABAJO` y `NOTION_WORKTREE` si están definidas. La subida real se delega en opencode con los textos de `prompts-opencode/`.

## Lo que hay que ajustar por paquete
Los scripts son genéricos en rutas, pero conservan valores de DSP-001 en listas concretas: las exclusiones de `contexto-entradas.js` (preguntas piloto, duplicadas, cerradas de arquitectura), los ids de `marcar-duplicadas.js`, y las constantes de `cargar-uxs.js`. Revisarlas antes de usarlas con otro paquete; no ejecutar los de `historico/` sin leerlos.

## Probado
Con `NOTION_TRABAJO` apuntando a una carpeta temporal se ejecutaron en seco `extraer-preguntas`, `lote-preguntas`, `preguntas-refs`, `respuestas-dec`, `contexto-entradas`, `contexto-validar` y `vigencia-inicial` desde esta ubicación.

## Cómo se delega en opencode
opencode solo lee dentro de su carpeta de trabajo y consume la entrada estándar. Por eso se lanza con `cd` a `notion/scripts` y `< /dev/null`:

`cd notion/scripts && opencode run "Ejecuta al pie de la letra las instrucciones del archivo adjunto. Responde solo con el informe final que pide." -f ../prompts-opencode/<prompt>.md --title "<título>" > ../trabajo/<salida>.md 2>&1 < /dev/null`

Los prompts de `prompts-opencode/` son los de la primera carga: indican el comando exacto a ejecutar y el informe que debe devolver. Verificar siempre después leyendo Notion.
