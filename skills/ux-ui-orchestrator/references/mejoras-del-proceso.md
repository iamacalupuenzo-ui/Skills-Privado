# Mejoras del proceso UX (registro vivo)

**Antes de leer:** ¿qué mejora ya está aplicada y cuál sigue pendiente de automatizar?

## En 30 segundos

Cada vez que una corrida del orquestador encuentra un hueco (algo manual, un error del script, una validación que faltó), se anota aquí. Se registra qué pasó, qué se hizo y qué falta, en una de estas formas: **validación**, **automatización** o **job**. Lo pendiente se aplica en el skill y aquí se marca hecho. El orquestador lee este archivo al iniciar el paso 0 y al cerrar cada fase.

## Cómo se registra

| Campo | Qué va |
|---|---|
| Qué pasó | El hueco, con el caso real |
| Tipo | Validación, automatización o job |
| Estado | Hecho (con el commit o el archivo) o Pendiente |

## Corrida DSP-009 (2026-11-26)

### Hechas

| Qué pasó | Tipo | Qué se hizo |
|---|---|---|
| El paquete y sus historias no se subían a Notion en el paso 0 | Automatización | `cambios-kb.mjs` llama a `cargar-paquete.js` de forma obligatoria |
| HU-01-14 estaba en el producto Piloto y no se veía | Validación | `validar-relaciones.js` revisa paquete → producto → proyecto, historias y tareas |
| Las vistas del paquete se armaban a mano | Automatización | `cargar-paquete.js` las conserva arriba; las crea `notion-create-view` (`pagina-del-paquete.md`) |
| `lote-doc.js` fijaba el producto Piloto en todos los UXR | Validación | Toma el producto de los paquetes; si no hay uno solo, levanta una duda con opciones (salida 3) |
| UXR-139 quedaba en DSP-001 porque cita HU-01-09 | Validación | Si el UXR nombra su paquete en `sources`, solo cuentan ese paquete y sus historias |
| UXR reutilizado por un paquete nuevo | Regla | Se mueve al paquete y producto nuevos y conserva el anterior (`--confirmar-producto=nuevo`) |
| HU-01-09 y HU-01-14 se enlazaban con sus duplicados SVR | Validación | Las historias se resuelven por ID y Catálogo «RCP-001 CL2 Flotas»; la carga suma relaciones, no quita |
| `lote-diseno.js` (flujos, pantallas) fijaba el producto Piloto | Validación | Toma el producto del paquete que el documento nombra en `sources`, en formato de bloque o de una línea; si no lo nombra, queda como duda y no se carga |
| Las tareas IDV-UX · 01 y · 02 seguían «Por hacer» con sus MR ya fusionados | Regla | SKILL.md: AVANCE al abrir cada MR y CIERRE al fusionarlo, en el mismo turno; se aplicó a · 01 a · 04 el 2026-11-26 |
| INV y DEC existían en la KB (6 y 102) pero no en Notion | Regla | Enzo creó las bases Investigaciones y Decisiones (2026-11-26); estructura aplicada y registrada en `config.json` y `esquema-bases.md`. Cargador hecho: `lote-diseno.js inv|dec` (frontmatter, tags dsp-NNN como respaldo, preguntas citadas y `NOTION_PAQUETES_EXTRA` para lo reutilizado). Se carga por paquete: DEC-004 y DEC-005 a DSP-001 y DSP-009 |
| La rama de la KB se subió sin darle el MR a Enzo | Regla | Toda entrega cierra con una tabla: MR, qué trae y orden de merge |
| Tras el merge, los enlaces de Notion apuntaban a una rama borrada | Regla | Después del merge se recargan los UXR y las preguntas con `DESIGN_REF=develop` y se corrigen las notas de GitLab |

### Pendientes

| Qué falta | Tipo | Propuesta |
|---|---|---|
| Recargar los enlaces después del merge sin depender de la memoria del agente | Job | Al detectar el MR fusionado, recargar los documentos de la rama con `DESIGN_REF=develop` y avisar en el MR |
| El aviso AVS fusionado en `develop` todavía tiene el enlace a la rama | Validación | Al preparar un aviso, escribir el enlace a `develop` desde el inicio. Se corrige en la próxima rama del DSP-009 |
| `subir-respuestas.js` no guarda la huella de UXR-014-Q4: la verificación falla por los corchetes escapados (`\[Confirma`) | Validación | Normalizar los escapes de Notion antes de comparar el cuerpo |
| Las columnas de una fila de preguntas se pueden correr al editarlas por script (pasó con UXR-014-Q4) | Validación | Editar por nombre de columna leído del encabezado, nunca por posición; `audit_ux.py` avisa si «Estado» no es un estado válido |
| `lote-doc.js` no relaciona el UXR con su tarea (IDV-UX · 02) | Automatización | Leer la tarea del mapeo del paquete y llenar la relación «Tareas» |
| Git Bash convierte `/projects/...` en ruta de Windows y la API de GitLab responde 404 | Validación | Los scripts de GitLab reciben la ruta sin barra inicial, o se corren con `MSYS_NO_PATHCONV=1` |
| El hook bloquea `printf` con la variable del token | Automatización | Usar los ayudantes `git-gitlab` y `gitlab-api`, que leen la variable en memoria; llevarlos al skill |
| La verificación previa independiente (B1) la hizo el mismo agente que construyó | Validación | Al delegar la orquestación, un agente evaluador distinto revisa cada UXR antes de cargarlo |
| Una tabla partida por líneas en blanco (historial de UXR-024, desde octubre) hizo fallar la verificación en Notion: 6 tablas en la KB, 5 en Notion | Validación | `audit_ux.py` avisa de las filas de tabla separadas por líneas en blanco; se corrigió UXR-024 en !549 |
| UXR-139 y UXR-140 se fusionaron sin su fila en `index.md`; se notó al hacer los flujos | Validación | `audit_ux.py` avisa si un UXR, FLW o SCR no tiene fila en `index.md` |
| Un flujo no puede listar pantallas que aún no existen (error de auditoría), y cada pantalla tiene un solo flujo | Regla | El flujo deja `screens: []` con una tabla de pantallas reservadas; `ui-spec-writer` las pasa al encabezado al crearlas |
| El preflight de `ui-spec-writer` (Stitch) da BLOCKED en toda pantalla de la KB: no hay proyecto de Stitch, los componentes son nombres del DS y no conceptos CMP, y los AC sueltos no resuelven | Validación | Para prototipos en código, un perfil del preflight que resuelva los componentes contra las guías del DS y los AC contra su historia; el de Stitch queda solo para Stitch |
| 75 de 102 DEC y 3 de 5 INV no nombran su paquete; INV-002 tiene id REF-SAMSARA-001 | Validación | `audit_ux.py` avisa de DEC o INV sin dsp-NNN ni DSP en sources, y de id distinto al archivo; se completan al trabajar su paquete |
| La DEC cita preguntas propias (DEC-005-Q1…) que no están en Preguntas, y sus pantallas solo aparecen en el cuerpo | Validación | Decidir si las preguntas propias de una DEC se cargan a Preguntas; la DEC declara `screens` en su encabezado |
| La INV y la DEC de cada pantalla se notan recién en la auditoría, después de escribirla | Validación | `ui-spec-writer` pide la INV y la DEC (o las crea como propuesta) en el mismo paso que el SCR |
