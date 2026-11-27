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
| No toda pantalla lleva INV o DEC nueva; además la auditoría buscaba las DEC solo en design/ (viven en decisions/) y SCR-086 fallaba por eso | Validación | `audit_ux.py` acepta `investigation: no-aplica` y `decision_reused: true` con `research.motivo`, y busca en design/ y decisions/; 4 pruebas nuevas (27 en verde) |
| La exploración se proponía saltar en DSP-009 porque Desarrollo ya había construido | Regla | Enzo (2026-11-26): la exploración en baja fidelidad en Claude Design no se salta. Orden: SCR con lista preliminar de componentes → exploración → UXS → desarrollo. Las brechas que salten en la exploración o en desarrollo van a la tabla de la SCR y a GAPS.md. Se agregó IDV-UX · 06 (exploración) y la UXS pasó a · 07 |
| El skill ponía la UXS antes de la exploración (la usaba como contexto de Claude Design); el agente cambió el orden dos veces | Regla | Enzo (2026-11-26): la exploración lee las pantallas; la UXS va al final y agrupa todo. SKILL.md: fases 3b componentes preliminares → 4 exploración obligatoria → 4b UXS. En DSP-009 las tareas ya estaban así (· 06 exploración, · 07 UXS) |
| IB-016 a IB-024 están en Notion pero no en develop de la KB; la exploración de DSP-009 tomó IB-016 y chocó | Validación | Antes de numerar un IB, DEC o INV, el siguiente ID sale del máximo entre la KB (todas las ramas remotas) y la base de Notion; `audit_ux.py` avisa de IDs de Notion sin archivo en la KB |
| La rama de la KB se subió sin darle el MR a Enzo | Regla | Toda entrega cierra con una tabla: MR, qué trae y orden de merge |
| Tras el merge, los enlaces de Notion apuntaban a una rama borrada | Regla | Después del merge se recargan los UXR y las preguntas con `DESIGN_REF=develop` y se corrigen las notas de GitLab |

### Pendientes

| Qué falta | Tipo | Propuesta |
|---|---|---|
| !555 quedó en conflicto en `changelog.md`: todos los equipos escriben arriba de la misma fecha | Automatización | Antes de cada push y antes de avisar a Enzo, `git fetch` y merge de `origin/develop` en la rama; si el único conflicto es el changelog, se conservan las dos entradas y se audita de nuevo |
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
| Validar las pantallas contra el Design System sin releerlo a mano (pedido de Enzo, 2026-11-26) | Validación | `audit_ux.py` lee el DS de `ui-components` en develop (`git show`): cada componente de `components` de una SCR existe en `guidelines/`, cada fila «Brecha» cita un ID que está en GAPS.md, y cada brecha de GAPS.md que nombra una pantalla aparece en esa SCR |
| El orquestador no dice solo en qué fase va el paquete; hay que releer todo para saberlo (pedido de Enzo, 2026-11-26) | Automatización | Un script `fase-paquete` lee los artefactos dsp-NNN de la KB y el estado de las tareas en Notion y responde: fase actual, qué falta para cerrarla y qué toca después (incluido «ya estamos en desarrollo: toca la revisión del front») |
| La exploración podía faltar sin que nada lo marcara | Validación | La compuerta de la UXS falla si una SCR del paquete no tiene su exploración (IB) con capturas |
| El orquestador UX y los de desarrollo web y móvil no comparten el contrato de entrega ni el retorno de brechas | Regla | Alinear `ux-ui-orchestrator` con `orquestador-desarrollo` y `orquestador-desarrollo-movil`: la UXS es la entrada de desarrollo, y lo que desarrollo descubre vuelve a la SCR y a GAPS.md. Queda como anotación de Enzo; se trabaja después de DSP-009 |
| Validar lo que construyó Desarrollo: el agente propuso hacerlo en DEV con el usuario de Enzo; los mock BFF de web-flotas y web-backoffice no tienen las rutas de identidad del Cliente ni del Producto (pedido de Enzo, 2026-11-26) | Hecho (2026-11-26): regla en flujo-producto, orquestador-desarrollo y orquestador-desarrollo-movil; proxy de ejemplo en scripts/mock-validacion | Siempre en local con datos simulados, sin tocar el backend: Shell + micro UI con su mock; lo que el mock no cubra se simula en el navegador (intercepción de Playwright con datos del contrato de la micro UI), sin cambiar los repos de producto. Llevar la regla a `flujo-producto`, `orquestador-desarrollo` y `orquestador-desarrollo-movil`, y avisar a Desarrollo de las rutas que faltan en el mock |
| Decisiones de Enzo retiradas por el PO sin aviso: DH-659 (RCP-001, 2026-10-28) quitó isotipo, tipografías y escala de colores; la escala se llevó a UXR-014-Q4 y a un aviso (AVS-DSP-009-2026-11-26), el isotipo y las tipografías no (Enzo, 2026-11-26) | Hecho (2026-11-26): scripts/decisiones-retiradas.mjs y references/mapa-de-decisiones-y-validacion.md; prioridad «Obligatoria en la siguiente versión» en Preguntas | Script que, al iniciar un paquete, lea las filas DH de RCP-001 §10 que citan un DEC-*/una pregunta DEC-*-Q* o dicen «se quitan»/«otra versión», y compruebe que cada elemento retirado tenga su pregunta Diferida en un UXR y su aviso en avisos/management; lo que falte se reporta a Enzo antes de diseñar. Mapa de lectura para el skill: decisiones de Enzo en decisions/ux-ui/decisiones (DEC-*), decisiones del PO en RCP-001 §10 (DH-*), diferidas en las preguntas UXR-*-Q* con estado Diferida, avisos en avisos/management (AVS-*) |
