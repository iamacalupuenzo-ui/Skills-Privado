# Módulo Notion del ux-ui-orchestrator (personal de Enzo Macalupu)

> Regla vigente desde el 18-nov-2026: el [ciclo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/ux-ui-orchestrator/references/ciclo-retroalimentacion.md) prevalece sobre los antecedentes de este documento respecto al inicio, cierre y transcripción de respuestas documentadas. La comparación de vigencia no decide; el cierre sí sincroniza decisiones humanas ya verificadas, sin fabricar aprobación ni resolver contradicciones.

Hace que el orquestador mantenga al día la base de Notion «Gestión Operativa» (CL2 Flotas): carga lo registrado primero en el KB y concilia las preguntas en ambos sentidos; nunca difiere su registro hasta el cierre de sesión. **Solo vive en esta copia local.** La copia del repo (`.claude/skills/ux-ui-orchestrator`, compartida con el equipo) no lo tiene y no debe tenerlo.

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
6. UXS: `cargar-uxs-paquete.js` (genérico: lee de la propia UXS las relaciones —UXR, flujos, pantallas, historias y preguntas abiertas— y sus veredictos; uso: `NOTION_WORKTREE=<worktree> DESIGN_REF=<rama ya subida> node cargar-uxs-paquete.js design/specs/UXS-00N-….md [--dry-run]`; la rama debe estar subida porque «Enlace GitLab» apunta a ella; el veredicto de Claude Design queda en el cuerpo, no en «Veredicto Stitch»). Prompt para opencode: `prompts-opencode/opencode-uxs-dsp-004-007.md`. `historico/cargar-uxs.js` era de DSP-001. Antes, la UXS se arma con el skill `ux-context-builder`; luego `uxs-preguntas.js`.
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

## Conciliar antes de cargar y cerrar (2026-11-14)

Configura `NOTION_WORKTREE` con tu KB local; `design_ref` de config.json determina la rama (por defecto develop). No se cambia el checkout ni se hace fetch. El token se lee solo de `~/.notion/token.txt`; no lo pongas en argumentos.

```powershell
node scripts/conciliar-kb-notion.js --kb <ruta-del-kb> --informe <carpeta-local>/conciliacion.md --dry-run
```

Siempre es de solo lectura remota, también sin --dry-run. El POST de consulta no escribe páginas. Deja un Markdown y un JSON; `--json <ruta>` cambia la salida JSON, `--huella <archivo>` selecciona la última carga y `--notion-json <fixture.json>` permite probar sin red. Sale con 0 si no hay diferencias y la cobertura está completa, 1 con diferencias o sin huella, 2 si no pudo completar la lectura. a=Notion→KB, b=KB→Notion/huella, c=un solo lado, d=estados; una pregunta puede contar en varios tipos.

No se usa la extracción antigua de CPO/DUD como fuente canónica: si una pregunta solo vive ahí, se propone migrarla a Open questions del UXR/FLW/SCR. Sin huella inicial no se inventan cambios: se informa cobertura incompleta. La huella se guarda fuera del repo (config.huella), después de una carga verificada; no la modifica la conciliación.

Después de aprobar y registrar los cambios en el KB:

```powershell
node scripts/extraer-preguntas.js --kb <ruta-del-kb>
node scripts/respuestas-dec.js --kb <ruta-del-kb>
node scripts/subir-respuestas.js --kb <ruta-del-kb> --only <ID,ID> --dry-run --plan <carpeta-local>/plan.json
```

El plan lee Notion y no escribe allí. Una persona revisa propiedades, cuerpo, estado y fuentes; opencode ejecuta `subir-respuestas.js --kb <ruta-del-kb> --aplicar-plan <plan.json>` solo con esa aprobación. Un cambio posterior en el KB o Notion invalida el plan. El contexto temporal de IA no reemplaza Resolución; los cargadores históricos de respuestas redirigen a este flujo. Las propuestas de otros responsables permanecen Propuesta; Propuesta UX se reserva para Enzo.

Pruebas sin red: `node --test scripts/conciliar-kb-notion.test.js`. Para los controles de cierre: `py -m unittest discover -s ../tests -p "test_*.py"` desde notion/ (o usa las rutas desde la raíz indicadas en controles-de-cierre.md).

## Detectar construcción sin cambiar estados

Configura `repos_producto` como una lista de rutas relativas al KB, o pasa `--repos-producto "<repo-1>;<repo-2>"`. La conciliación lee código e historial locales (incluidas ramas CLF_Feature_<US> y mensajes de merge con referencias de MR); no hace fetch ni usa credenciales de GitLab. Si el clon no tiene una rama o MR reciente, no puede afirmar que no existe construcción. El informe añade propuestas documentales y la advertencia ARTEFACTO_BORRADOR_CON_CONSTRUCCION. Un merge sin referencia explícita de MR se rotula merge local, sin inventar una MR fusionada.

La propuesta de Validado requiere evidencia local real de Enzo, navegador, fecha, captura y ARP implementado coincidente; la aprobación sigue siendo humana. `audit_ux.py --conciliacion <informe.json>` expone las advertencias. Los scripts de lote preparan Estado del documento desde el KB y Capturas (files) en Flujos y Exploraciones; conservan Aprobado cuando ya esté registrado y no crean el esquema de Notion.

## Propuesta de cascada

Añade `--cascada-informe <salida.md>` al comando de conciliación para guardar la cadena de cambios en un informe separado. La misma propuesta queda en cascada.propuestas del JSON. UXR y UXS conservan Borrador/En revisión/Aprobado; no reciben En construcción ni Validado. La regla completa de propagación y retorno a revisión está en arquitectura-preguntas.md §8. La carga verificada registra huellas de documentos además de preguntas; sin esa línea base la invalidación descendente declara su límite y GC bloquea el cierre.

La conciliación agrega el tipo «HU afectada → comentario al analista del DSP» (conteos.hu): prepara el texto con pregunta, cambio y AC/regla para revisión; no edita historias ni envía comentarios. La salida de la cascada es un plan de propuestas sujeto a aprobación de Enzo. Todos los planes de respuesta se deduplican por ID y rechazan registros contradictorios o incompletos; ninguna carga se declara finalizada con campos null.
