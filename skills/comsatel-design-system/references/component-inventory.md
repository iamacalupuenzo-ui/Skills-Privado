# Inventario de estado — Comsatel Design System (Angular)

> **Rutas desde la 0.6.0 (2026-09-29):** cada componente es un punto de entrada.
> Donde este inventario dice `projects/comsatel-ds/src/lib/<x>/`, la ruta vigente es
> `projects/comsatel-ds/<x>/src/`, y el componente se importa desde
> `@iamacalupuenzo-ui/comsatel-ds/<x>`. Excepciones: `PressScale` vive en `/motion`
> y `Collapse` en `/directives`. Receta y puertas en `entry-points.md`.

Actualización: 2026-09-17, reconstrucción de la marca de Flotas. Se reemplazó la
identidad visual aislada de C-Locater Flotas por el sistema C-Flotas: wordmark
`C-` + cápsula negra `FLOTAS` + firma `by COMSATEL`, e isotipo `C-` + cápsula
negra `FL`. Ambos SVG embebidos como data URL para
evitar rutas internas y el fallo de pre-bundling de Vite. El API canónico es
`CFlotasLogo` / `cs-c-flotas-logo`, con `variant="wordmark" | "isotype"`;
`CLocaterFlotasLogo`, `cs-c-locater-flotas-logo`, `full` e `icon` se conservan
como compatibilidad no rompiente. Se actualizaron la página de Logos, guía,
README, nota de release y Storybook. Verificación: `npm run build`,
`npm run check:docs`, `npm run test:ci`, `npm run build-storybook`, reinicio de
`ng serve` y revisión visual de `/foundations/logos` con ambos recursos cargados
desde `data:image/svg+xml`.

Actualización: 2026-09-14, segundo hallazgo real de reuso en la misma
sesión, en el botón "Columnas" de `table-page.html` (toolbar del
Playground de Table): era un `<button>` nativo con clase propia
(`.table-toolbar__columns-btn`), no `cs-button` — el usuario lo detectó
con un inspector de página, viendo `Font Family: Arial` en vez del token
`--font-family-content` (la clase a mano nunca declaraba font-family, solo
font-size/line-height, así que el navegador caía al default). Corregido:
ahora es `<cs-button variant="default" size="sm" [selected]="...">` como
trigger de `cs-popover` — patrón YA establecido y verificado en
`popover-page.html` (`#pgTrigger`/`#placementBtn` + `@ViewChild(...,
{ read: ElementRef })`), que además resuelve automáticamente
`aria-expanded`/`aria-haspopup`/`aria-controls` sobre el `<button>` interno
real (`popover.ts` → `accessibleTrigger()`), así que el binding manual de
esos atributos ARIA que yo había escrito a mano sobró y se quitó. Verificado
en el navegador real: `font-family: "Public Sans"` (antes Arial),
`aria-expanded`/`aria-haspopup="dialog"` inyectados por Popover al abrir,
el panel de columnas sigue abriendo con 4 filas.

Seguido de un tercer ajuste en el mismo botón, pedido por el usuario
comparando el mismo toolbar: "Estado" y "Filas" (ambos `cs-input-dropdown`)
muestran un label arriba de su control — "Columnas" no tenía esa misma
estructura y quedaba visualmente distinto en la fila. `cs-button` no
expone una prop `label`, así que se envolvió en un `<div class="table-
toolbar__columns">` con un `<span>` decorativo (`aria-hidden="true"`,
el nombre accesible del botón ya lo da su texto visible "Columnas", así
que duplicarlo en `aria-labelledby` no suma nada) calcando **la misma
receta tipográfica** de `.cs-input-dropdown__label` (font-family/size/
weight/line-height/color, mismos tokens) en vez de inventar una nueva —
es la única fuente de "label arriba de un control" en esa toolbar.
Verificado: el borde inferior del botón "Columnas" y el de "Estado" caen
en el mismo px (427.5), misma tipografía tokenizada.

**Lección para auditorías futuras (refuerza la de abajo):** un componente
de librería (`cs-button`) ya construido y ya usado como trigger de
`cs-popover` en otra página (`popover-page.html`) no se reinventa como
`<button>` con clase local — buscar primero si el elemento que se está por
construir a mano ya tiene un componente real en la librería, y si ese
componente ya se usó en el mismo rol (trigger de popover) en otra página
de este mismo sistema.

Actualización: 2026-09-14, hallazgo real de reuso en `table-page.ts`
(Table, Playground): la columna "Estado" seguía usando `cs-badge` sin
ícono (`STATUS_VARIANT`/`statusBadge()`), mientras que Table tree ya había
migrado esa misma columna a `cs-tag` con `severity`+`icon`+`rounded` (ver
entrada de Table tree más abajo) — el comentario en
`table-tree-page.ts` decía explícitamente "un solo lenguaje visual de
estado en todo el sistema", pero esta página nunca se actualizó a esa
migración. El usuario lo detectó comparando ambas páginas ("¿por qué a
este le pones el icono y a este otro no, si ya tenemos ese componente?").
Corregido: `table-page.ts` ahora importa `Tag` (no `Badge`), define
`STATUS_SEVERITY`/`STATUS_ICON` (mismos valores que `table-tree-page.ts`:
`success`/`warn`/`secondary` + `activity`/`circle-pause`/`wifi-off`) y el
`statusCell` renderiza `<cs-tag [severity] [icon] [value]="statusText(status)"
[rounded]="true" size="sm" />`. Verificado en el navegador real: los 3
badges/tags de "Activo" en la tabla real muestran ícono `activity` y
`border-radius: var(--radius-full)`, "Detenido" mapea a `warning`. Gate
completo (`check:docs` + `test:ci`) en verde tras el cambio. **Lección para
auditorías futuras:** cuando dos páginas de docs distintas modelan el
mismo concepto de dominio (aquí: "Estado" de una unidad de flota), migrar
el patrón visual en una sin revisar las demás deja el sistema
inconsistente — al tocar cualquier columna/celda que representa un
concepto ya resuelto en otra página (Estado, Prioridad, etc.), buscar
activamente sus otros usos antes de darla por cerrada.

Actualización: 2026-09-14, corrección de arquitectura en "Table: reordenar
y mostrar/ocultar columnas" (agregado minutos antes en la misma sesión,
ver entrada más abajo). El usuario rechazó la primera versión completa —
headers de `cs-table` arrastrables + botón separado con panel de
checkboxes — por no ser el patrón real de la industria. Se revirtió
`Table` (librería) al estado sin ningún control de columnas en los
headers: `reorderableColumns`, `columnsReorder` y `TableColumn.reorderable`
salieron por completo de `table.ts`/`.html`/`.css`/`table-types.ts`. La
reconstrucción correcta quedó 100% en `table-page.ts`/`.html` (página de
documentación, NO la librería): un único panel "Columnas" (mismo botón +
`cs-popover` de antes) con una LISTA donde cada fila trae el handle de
arrastre (`grip-vertical`) y el ícono de mostrar/ocultar (`eye`/`eye-off`)
uno al lado del otro — mismo patrón que Notion "Properties" o Airtable
"Hide fields". El arrastre ahora reordena directo `columnOrder` (el
arreglo maestro de keys, visibles y ocultas por igual) en vez de mergear
un subconjunto emitido por Table. Se agregó **B16** a `SKILL.md`: antes de
construir un patrón con prior art conocido, hay que poder nombrar qué
producto real ya lo resuelve así — revisar la API de PrimeNG (Gate de
cierre paso 1) confirma capacidades, no arquitectura visual. Verificado de
nuevo con `DragEvent`/click reales tras el revert: ocultar "Conductor" lo
saca de los headers reales de `cs-table`, y arrastrar "Unidad" al final de
la lista del panel reordena los headers reales respetando la columna
oculta.


Actualización: 2026-09-14, nueva característica en `Table` pedida por el
usuario: reordenar columnas por arrastre y mostrar/ocultar columnas —
ambas inspiradas en `p-table` de PrimeNG (`reorderableColumns`/
`pReorderableColumn`), consultado solo como referencia funcional (nunca de
implementación ni de tokens, B2/B12/Gate de cierre). Hallazgo real de esa
consulta: la propia documentación de PrimeNG y un issue abierto en su
repo confirman que su reordenamiento es "drag-only, no keyboard
alternative" — se lo señalé al usuario antes de construir; decidió
explícitamente NO agregar alternativa de teclado por ahora ("no tiene
sentido... no voy a recomendarle manejarla por teclado"), así que quedó
igual de mouse-only que la referencia, pero DOCUMENTADO como decisión
explícita en `GAPS.md` (vía `npm run gap:report`), no como un olvido.
- **Reordenar columnas** (`Table`, librería): `TableColumn` ganó
  `reorderable?: boolean` (opt-out por columna); `Table` ganó
  `@Input() reorderableColumns` + `@Output() columnsReorder`. Headers
  arrastrables con eventos HTML5 nativos (`dragstart`/`dragover`/`drop`/
  `dragend`), ícono `grip-vertical` visible como affordance de
  descubribilidad (mouse-only no significa invisible), indicador de
  drop-target con `--color-border-brand-default`. Controlado: Table nunca
  muta su propio `columns`, solo emite el arreglo ya reordenado — mismo
  criterio que `(sort)`. Verificado con eventos `DragEvent` reales
  (`dispatchEvent`) en el navegador: headers Y celdas de datos quedan en
  el mismo orden nuevo, confirmado leyendo el DOM real.
- **Mostrar/ocultar columnas** (composición en la página, NO en la
  librería): un botón "Columnas" abre un `cs-popover` con un `cs-checkbox`
  real por columna — mismo patrón de composición que ya usan
  búsqueda/filtros alrededor de `Table` (Table sigue sin saber nada de
  visibilidad, el consumidor filtra `columns` antes de pasarlo). No se
  puede ocultar la última columna visible (checkbox se deshabilita).
  Construido en `table-page.ts`/`.html`, no como primitivo nuevo de
  `comsatel-ds` — si se repite en más tablas reales, ahí sí amerita
  promoverlo a componente reusable.
- **Reubicación del resumen de filas** (pedido explícito, confirmado con
  el usuario antes de aplicar): "Mostrando X de Y" pasó de estar arriba de
  la tabla a compartir la fila de abajo con `cs-pagination`, en el extremo
  opuesto (patrón estándar: conteo a la izquierda, paginador a la
  derecha) — antes eran dos bloques separados en distintas posiciones.

Verificación: `npm run build`/`docs`/`check:docs`/`test:ci` en verde
(hubo que completar a mano 2 filas "Sin descripción" que el generador de
`guidelines/table.md` dejó en blanco para las props nuevas). Navegado en
servidor real reiniciado limpio: panel de columnas abre y oculta
"Conductor" en vivo (confirmado que desaparece de la tabla), reorder
verificado con `DragEvent` reales.


Actualización: 2026-09-14, corrección real en `TableTree` reportada por el
usuario probando la demo: al expandir un nodo con carga perezosa
(`children === undefined`), el skeleton SIEMPRE dibujaba una sola fila —
sin importar cuántos hijos iban a resolverse. `Table` (el componente
hermano) ya resolvía exactamente este problema con `@Input()
skeletonRowCount = 5` + `skeletonRowIndices`; `TableTree` nunca lo portó
para su propio caso de carga perezosa (C8: no se reusó un patrón que ya
existía). Fix: `TableTreeItem` ganó `skeletonRowCount?: number` (opcional,
default 1 por nodo si no se declara — conservador, no cambia el
comportamiento de quien no lo use), y `table-tree.html` reemplazó la fila
skeleton única por un `@for` sobre `skeletonRowsFor(item)`. La demo de
carga perezosa (`table-tree-page.ts`) se actualizó para declarar
`skeletonRowCount: 6` en Región Norte y `3` en Región Sur, resolviendo
después esa misma cantidad real de unidades — antes solo resolvía 2 fijas
sin importar la región. Verificado con `getComputedStyle`/conteo real de
`<cs-skeleton>` en el DOM 50ms después de expandir (no por screenshot: la
transición de 900ms es más corta que la latencia normal de una captura de
pantalla en este Browser pane): 6 elementos, coincide exacto.

**Segunda ronda en la misma pasada, 2 hallazgos más reportados por el
usuario probando la demo real:**
- **El skeleton no respetaba columnas.** Tanto el skeleton raíz
  (`showSkeleton`) como el de carga perezosa dibujaban UN solo
  `<cs-skeleton>` dentro de una celda con `colspan` — la columna "Nombre"
  se veía cargando, pero "Estado"/"Actualizado" quedaban vacías. `Table`
  (el hermano) ya resolvía esto con un `@for` anidado sobre `columns`, un
  `<cs-skeleton>` por columna (`table.html:34-41`) — `TableTree` nunca lo
  portó para su propio caso (C8 de nuevo, mismo patrón que el hallazgo de
  `skeletonRowCount`). Fix: los dos bloques de `table-tree.html` pasaron a
  `@for (col of columns; ...)` con `[width]="col.width ? '70%' : undefined"`,
  igual criterio que Table. Verificado: 18 elementos skeleton = 6 filas ×
  3 columnas, confirmado por conteo real en el DOM.
- **Cerrar y reabrir un nodo lazy mostraba los datos ya resueltos en vez
  de volver a cargar.** Correcto para un caso real de caché, pero el
  usuario quería poder repetir la carga en la demo. Se resolvió en la
  PÁGINA (`table-tree-page.ts`), no en el componente — `TableTreeItem.children`
  es 100% responsabilidad del consumidor, no hay ningún mecanismo del
  componente que decida cachear o no. `onLazyExpandedChange` ahora
  detecta qué ids se CERRARON en cada cambio y les resetea `children` a
  `undefined`; además se guardó contra una carrera real (colapsar antes de
  que resuelva el `setTimeout` de 900ms ya no aplica los datos viejos a un
  nodo que el usuario volvió a cerrar). Verificado con click real +
  `aria-expanded` + conteo de filas: colapsar quita las 6 filas de la
  tabla, reabrir vuelve a mostrar 18 elementos skeleton (no los datos
  viejos).
- **Estado sin ícono, sin el patrón de Tag ya establecido.** La página
  usaba `cs-badge` con solo texto y colores propios (`success`/`warning`/
  `neutral`) en vez de reusar el patrón real que ya fijó `FleetUnitList`
  para exactamente este mismo caso (estado de una unidad de flota):
  `cs-tag` con `severity`/`icon`/`value`/`[rounded]="true"`, con el mismo
  mapeo estado→ícono (`active`→`activity`, `stopped`→`circle-pause`,
  `offline`→`wifi-off`) y estado→severidad (`success`/`warn`/`secondary`).
  Fix: `table-tree-page.ts`/`.html` migrados a `cs-tag`, `Badge` retirado
  de los imports (ya no se usaba en ningún otro lado de la página).


Actualización: 2026-09-14, reconstrucción puntual de "PressScale"
(`src/app/pages/press-scale-demo/`), 2 hallazgos reportados por el usuario
tras ver la página:
- **Contenedor duplicado en el Playground:** `.press-scale-stage` tenía su
  propio `background-color`/`min-height`/`border-radius` — el Canvas de
  `DemoShell` YA centra y da contexto visual (`display:flex; align-items:
  center; justify-content:center; min-height:120px; background-image:
  radial-gradient(...)`), así que se veía una caja gris sólida flotando
  adentro del grid punteado del Canvas. Precedente real confirmado en
  `button-page.html`: su Playground no envuelve `<cs-button>` en ningún
  div propio, se apoya en el Canvas directo. Fix: `.press-scale-stage`
  quedó solo con `display:flex; flex-direction:column; align-items:
  center; gap`, sin fondo ni alto mínimo propios.
- **Íconos de lineamientos sin el color semántico:** los `<cs-icon
  name="check"/"x">` de "Recomendado"/"Evita" no tenían
  `class="guide-card__header-icon"` — esa clase (definida en
  `doc-page.css`) es la que aplica `--color-text-success-bolder`/
  `--color-text-danger-bolder`; sin ella, el ícono queda con el color de
  texto por defecto. Mismo patrón ya usado en Motion/Markers/Tokens en
  esta misma sesión — acá se había omitido. Verificado con
  `getComputedStyle`: `rgb(2,122,72)` (verde) / `rgb(192,16,72)` (rojo)
  tras el fix.

Verificación: `npm run build`/`check:docs`/`test:ci` en verde, navegado en
servidor real reiniciado limpio, sin errores de consola, click real
confirmó que el contador del guide-card sigue funcionando.


Actualización: 2026-09-14, construcción de "Guía de instalación"
(`src/app/pages/installation/`, `/foundations/installation`, primer ítem
de la sección Fundamentos). **Hallazgo real antes de escribir la página:**
se verificó que `comsatel-ds` NO está publicado en ningún registro
(`npm view comsatel-ds` → 404) — la única forma real de consumirlo hoy es
dentro de este mismo workspace, vía el path mapping de `tsconfig.json`
(`"comsatel-ds": ["./dist/comsatel-ds"]`). La página lo documenta honesto
(banner de advertencia), en vez de asumir que `npm install comsatel-ds`
funciona desde otro proyecto — y se registró como gap real en `GAPS.md`
(`npm run gap:report`) para que la próxima sesión no lo redescubra.
Cubre además, con evidencia verificada en la misma sesión: consumo dentro
del workspace (`build:lib` + import real), `adsa-cli` vía `npx` (sin
instalación), el servidor MCP ya registrado en `.mcp.json`, y
`npm run check:docs` como gate de verificación antes de cerrar un cambio.


Actualización: 2026-09-14, construcción de "Tokens explicados", "Uso en
código" y "Uso en diseño" (`src/app/pages/tokens-explained/`,
`tokens-code/`, `tokens-design/`) — las 3 páginas de fundamentos que no
dependían de ninguna decisión de diseño pendiente. La cuarta (Themes,
`/foundations/color/themes`) se cerró en la misma sesión, minutos después:
el usuario resolvió la decisión Glass (ver "Decisiones de diseño ya
tomadas" más abajo) y se construyó también — las 4 páginas quedan
Finalizadas.
- **Tokens explicados**: las 3 capas (primitivo→semántico→componente) con
  la cadena real (`--font-primitive-size-micro` → `--font-size-label-small`
  → `componentTypography.badge.sm`), convención de nombres, mecanismo de
  tema (`[data-theme="dark"]` redefine el MISMO nombre), qué hacer cuando
  un valor no tiene token, y la sección de accesibilidad ligada a tokens
  (adaptada de `guidelines/design-tokens.md`, ya generada del código real).
- **Uso en código**: `var(--token)` directo para CSS, `textStyle()`/
  `componentTypography` para tipografía — con el ejemplo REAL de
  `badge.ts`/`badge.html` (`[ngStyle]="style"`), no uno inventado. Incluye
  la escala de z-index completa y cómo se verifica (`npm run check:docs`).
- **Uso en diseño**: honesto sobre el estado real del proyecto — no hay
  sincronización automática entre `tokens.css` y ningún archivo de diseño
  todavía (se verificó explícitamente que no existe tooling de Figma sync
  en este repo antes de escribir la página, en vez de asumir una
  integración que no está). Documenta elegir por ROL en vez de por valor,
  los mínimos de contraste WCAG reales, y qué hacer cuando ningún token
  calza (mismo criterio B1 del lado de diseño: proponer y registrar, no
  redondear en silencio).
- `app.routes.ts` y `nav.ts` actualizados (`pending: true` retirado de las
  3 entradas); las 3 traducidas al español (`nav.ts` ya tenía "Tokens
  explained"/"Use in code"/"Use in design" en inglés, inconsistente con el
  resto del nav — se corrigió solo para estas 3 entradas nuevas, no se
  tocó "All design tokens"/"Overview"/"Color palette"/"Semantic tokens",
  que ya existían así y quedan fuera de este alcance).
- `GAPS.md` estaba desactualizado (listaba Logos/Grids/List item/estas 3
  páginas como huecos pese a estar ya Finalizados en sesiones anteriores)
  — se limpió, dejando solo Temas de color como pendiente real.

Verificación: `npm run build`/`check:docs`/`test:ci` en verde, navegado en
servidor real reiniciado limpio, sin errores de consola, y navegación real
confirmada por click (`inline-link` → `/foundations/tokens`).

Validación adicional pedida por el usuario en esta sesión: se corrió
`npx adsa-cli doctor` (5/5 PASS) y `npx adsa-cli audit` (45/45, las 9
dimensiones al máximo, gateado en CI vía `.github/workflows/docs.yml`
contra `.adsa/score.json` versionado) para confirmar que el sistema ya
tiene una auditoría real de "qué tan listo está para un agente de IA" —
existe, funciona, y el proyecto ya pasa. Ese puntaje mide la LIBRERÍA
(`projects/comsatel-ds/` + `guidelines/`), es independiente de las páginas
de fundamentos de la app Angular. Hay además un servidor MCP ya registrado
(`.mcp.json`, `npx adsa-cli mcp`) — no hace falta instalar nada para que un
cliente MCP lea las guías del sistema. No existe todavía una página
"Fundamentos → Guía de instalación" en el sitio (solo vive en `AGENTS.md`,
que le habla al agente, no a quien navega el sitio).

Actualización: 2026-09-14, auditoría y reconstrucción de "Motion"
(`projects/comsatel-ds/src/lib/motion/` + `src/app/pages/motion-demo/` +
`src/app/pages/motion-tokens-demo/`). 3 hallazgos, todos corregidos:
- **C7 (1, 8 instancias):** los 4 pares Recomendado/Evita de "Lineamientos
  de uso" en `motion-page.html` usaban `<svg>` inline a mano en vez de
  `<cs-icon name="check"/"x">` — mismo patrón corregido antes en Accordion
  y Marcadores. Reveló además que `MotionPage` no importaba `Icon` desde
  `comsatel-ds` — se agregó al array `imports` del componente.
- **B15.3 (1, 3 archivos):** el botón "Repetir" de `preset-card.css`,
  `duration-row.css` y `easing-row.css` (misma pieza repetida en 3 lugares)
  usaba `--font-size-label-micro` en vez de `--font-size-content-note` — el
  default de B15.3 para acciones auxiliares, ya usado correctamente por
  `.guide-card__action` en `motion-page.css` y por el botón "Copiar" real
  de `code-block.css`. Verificado con `getComputedStyle`: 10px→12px.
- **C1 (1):** `preset-card.css` `border-top: 1px solid` sin atar a
  `var(--layout-border-thin)`.

El resto del componente (motion.ts/eases.ts/token-duration.ts) ya estaba
limpio: `rendered` es `signal()` (sin bug zoneless), y `tokenEase`/
`tokenSeconds` se reusan desde `comsatel-ds` en las páginas de fundamentos
en vez de reimplementarse (C8 correcto).

Verificación: `npm run build`/`check:docs`/`test:ci` en verde, navegado en
servidor real reiniciado limpio, sin errores de consola.

**Corrección de layout tras feedback visual del usuario (misma sesión):**
en `duration-row.html`/`easing-row.html`, el botón "Repetir" vivía dentro de
`.row-card__head` (fila superior) mientras la descripción era un bloque
aparte debajo, ambos compartiendo el ancho completo de `.row-card__body` —
cuando la descripción ocupaba 2 líneas (el caso de `--motion-duration-fast`,
la más larga), su segunda línea quedaba visualmente pegada bajo el botón,
mientras que las descripciones cortas tenían aire de sobra: separación
inconsistente según el largo del contenido, no un límite real. Fix: se sacó
`Repetir` de `.row-card__head` a una columna nueva `.row-card__actions`,
hermana de `.row-card__body` (no hija), con `border-left` separador — mismo
criterio que ya usaba `.row-card__track` en el lado opuesto. Así el texto
nunca puede alcanzar al botón sin importar cuántas líneas ocupe, en vez de
depender de un `margin-left: auto` que comparte fila con contenido de largo
variable. Verificado con click real (`aria-label` correcto) y revisión
visual en ambas páginas tras reinicio del servidor.

Actualización: 2026-09-14, auditoría y reconstrucción de "Marcadores"
(`src/app/pages/markers-demo/` — VehiclePill, GpsCompact, GpsFull,
ClusterBadge, página). 15 hallazgos, todos corregidos:
- **C1 (11):** bordes/outline sin tokenizar en las 4 piezas (`2px`→
  `var(--layout-border-thick)`, `1px`→`var(--layout-border-thin)`,
  `4px`→`var(--layout-border-thicker)`), más 3 huecos reales (1.5px en
  vehicle-pill/gps-compact/gps-full, 3px en cluster-badge) que no tenían el
  comentario de excepción B1 que sí llevaban los 17px/7px ya documentados
  de `cluster-badge.css` — se agregó la justificación a cada uno.
- **C7 (1, 6 instancias):** los 3 pares Recomendado/Evita de "Lineamientos
  de uso" en `markers-page.html` usaban `<svg>` inline a mano en vez de
  `<cs-icon name="check"/"x">` — mismo patrón ya corregido antes en
  Accordion, ahora también acá.
- **B6/C3 (1):** el texto de `VehiclePill` (`.marker-pill__name`/`__plate`)
  no escalaba con `iconTier` (sm/base) mientras el ícono y el punto sí.
  Fix: clase `.marker-pill--tier-base` que sube un paso la escala
  tipográfica (label-micro→label-small, label-small→content-note) —
  verificado con `getComputedStyle` real (11px→12px).
- **Hallazgo de contenido, no de tokens (1, el más grande):** la página
  describía la integración como "se integran con Leaflet mediante
  `divIcon`" y el código de ejemplo del Playground generaba
  `L.marker`/`L.divIcon`/`renderVehicleMarker()` — quedó desactualizado en
  la MISMA sesión al migrar `/map/theme` de Leaflet a MapLibre GL. Se
  reescribió la descripción y `pgCode()` en `markers-page.ts` con el patrón
  MapLibre real (`createComponent` + `Marker({element, anchor:'bottom'})`),
  el mismo que ya usa `live-map-preview.ts`.

Verificación: `npm run build`/`check:docs`/`test:ci` en verde, navegado en
servidor real reiniciado limpio, sin errores de consola, íconos check/x
renderizando, y texto de la columna "Propuesta" (iconTier base) confirmado
en 12px vs. 11px de la columna "Actual" (sm) vía `getComputedStyle`.

**Ruta del proyecto, aclaración 2026-09-14:** en la laptop donde se corrió esta
sesión, el repositorio vive en
`C:\Users\emacalupu\Documents\Boveda\Monday\Comsatel-DS` (con `AGENTS.md`,
`GAPS.md`, `guidelines/` generadas y gates `check:docs`/`test:ci` — variante
"agent readiness" del proyecto), no en `D:\Investigacion\Comsatel-DS-Angular`
como asume el resto de este skill. La página de seguimiento propia del
proyecto (`src/app/pages/evaluation-tracking/evaluation-tracking-page.html`)
es la fuente de verdad de estado en esa copia — contrastarla contra este
archivo al empezar una sesión ahí, no asumir que están sincronizadas.

Actualización: 2026-09-14, auditoría y reconstrucción de "Tema del mapa"
(`src/app/pages/map-theme-demo/`). Hallazgos C1 (4 bordes sin tokenizar +
2 colores crudos sin excepción documentada), C8 (`.warning-banner` hecho a
mano en vez de `cs-banner variant="warning"`) y C13 (4 reglas de tipografía
sin `line-height` par) corregidos. A mitad de la reconstrucción el usuario
pidió evaluar si CartoDB Voyager/Stadia Alidade Smooth Dark (los proveedores
que la página documentaba) seguían siendo la elección correcta — CARTO
cambió de política en agosto 2026 y ahora exige API key incluso en su
endpoint gratis, y por eso `live-map-preview.ts` caía a un fallback de Esri
World Gray Base sin diseño pensado para dashboards (el "demasiado claro/
oscuro" que reportó el usuario era ese fallback, no los proveedores reales).
**Decisión de arquitectura tomada por el usuario, no por el skill:**
reemplazar el motor completo — Leaflet (tiles raster) por **MapLibre GL JS**
(BSD-3-Clause, evaluado con el mismo criterio de utilidad sin identidad
visual que ya se aplicó a Leaflet, ver B14) y los tiles por **OpenFreeMap**
(`tiles.openfreemap.org`, vectorial, sin API key, sin cuenta, sin límite de
requests — estilos `positron`/`dark`). Detalle real de la migración, por si
se repite en otro proyecto:
- **Bug de plataforma nuevo, no cubierto antes en `audit-checklist.md` C4:**
  MapLibre resuelve su propio Web Worker con un patrón que ni Vite (dev) ni
  esbuild (`@angular/build`, prod) detectan como referencia de asset — el
  mapa queda en blanco sin ningún error de consola (el `Map` se construye,
  hay `<canvas>`, pero el estilo nunca se pide). Fix real: copiar
  `maplibre-gl-worker.mjs` + su sibling `maplibre-gl-shared.mjs` a la raíz
  servida vía `assets` en `angular.json` (glob directo sobre
  `node_modules/maplibre-gl/dist`) y `setWorkerUrl('/maplibre-gl-worker.mjs')`
  — una URL de string plano, nada de bundling. También hizo falta
  `serve.options.prebundle.exclude: ["maplibre-gl"]` en `angular.json`
  (la pre-optimización de dependencias de Vite rompía el worker en dev de
  otra forma distinta, con el mismo síntoma de mapa en blanco).
- **Variante nueva del bug C4 #4 (encapsulación Emulated no alcanza
  contenido inyectado):** un marcador construido con
  `document.createElement` fuera de la plantilla de Angular (para pasarlo a
  `new Marker({element})`) tampoco recibe el atributo `_ngcontent-*` — el
  CSS del componente con clases normales no lo alcanza, igual que con
  `[innerHTML]`. Fix: estilos inline por JS (`el.style.cssText`) usando los
  tokens reales — los custom properties CSS sí atraviesan la encapsulación,
  solo el selector con scope no matchea.
- Layout: `.preview-grid` (dos columnas) pasó a `.preview-stack` (columna
  única, mapas más grandes — 220px→360px de alto) por pedido explícito del
  usuario, con una unidad de ejemplo en ambos mapas para validar contraste
  real en claro/oscuro.
- **Corrección real tras feedback del usuario (misma pasada):** el primer
  intento de la unidad de ejemplo fue un punto+placa dibujado a mano — el
  usuario lo marcó como el MISMO error que C8 audita en otros componentes
  ("ya tenemos definido un marcador... no inventes otro"). Fix: reusar el
  componente real `VehiclePill` de `/map/markers` vía `createComponent()`
  (no `document.createElement`) — al pasar por el compilador real de
  Angular, su vista recibe `_ngcontent-*` y su propio CSS con scope aplica
  sin el gotcha de encapsulación que sí afectaba al nodo creado a mano.
  `Marker({ element: ref.location.nativeElement, anchor: 'bottom' })`.
- **Bug real de accesibilidad encontrado en el estilo "dark" de OpenFreeMap**
  (usuario reportó que las calles no se leían bien en oscuro): confirmado
  leyendo el `style.json` real — las etiquetas de calle/lugar usan texto
  gris ~40% (`rgb(101,101,101)`/`hsl(0,0%,37%)`) sobre fondo casi negro
  (`rgb(12,12,12)`, contraste real ~3.3-3.9:1, bajo el mínimo 4.5:1) y
  `water_name` va literal en negro sobre negro (invisible). El estilo
  "positron" (claro) no tiene este problema. Fix: `map.setPaintProperty()`
  sobre esas capas apenas dispara `'load'`, solo en modo oscuro, subiendo el
  color a valores con contraste real verificado (~9-11:1) — es la hoja de
  estilo del proveedor externo, no tokens propios (mismo criterio que ya
  documenta la página sobre por qué el mapa no usa `data-theme`), así que el
  valor queda explícito con el cálculo en el comentario, no copiado de
  ningún lado.
  **Segunda ronda del mismo bug (misma sesión):** el problema no era solo
  el texto — `highway_minor` (la capa que dibuja la mayoría de calles
  visibles, las locales/residenciales) usaba `#181818` sobre el fondo
  `rgb(12,12,12)`: contraste real ~1.1:1, la red vial completa quedaba
  invisible, no solo las etiquetas. `building` y el propio `background`
  agravaban el efecto (todos agrupados cerca del negro puro). Mismo fix
  (`setPaintProperty` en `'load'`, solo dark), mismos criterios de
  contraste calculado, no copiado: `highway_minor` ~4.5:1, `highway_major_subtle`/
  `highway_motorway_subtle` ~7.5-10:1 (jerarquía visual sobre las locales),
  `highway_path` deliberadamente más sutil (~2:1, es la vía de menor
  jerarquía), fondo y edificios con ajuste leve. **Aclaración de arquitectura
  importante que el usuario preguntó explícitamente:** el canvas de
  MapLibre (WebGL) nunca puede leer los custom properties de `tokens.css`
  — no hay forma de que un token del sistema le "llegue" al render de un
  tile; `setPaintProperty` es la única superficie de ajuste, y solo acepta
  valores explícitos (no hay token de sistema para "línea de calle en un
  mapa"), consistente con C1 cuando no hay ningún token que coincida.
- Dependencia raíz (no de `comsatel-ds`): `leaflet`/`@types/leaflet`
  desinstalados, `maplibre-gl` instalado. `angular.json` actualizado en
  `build.options.styles` (leaflet.css→maplibre-gl.css, dos builders) y
  `build.options.assets` (worker + shared).

Actualización: 2026-09-14, reconstrucción de Logos. Se añadió la ruta `/foundations/logos`, se habilitó el enlace en la navegación y se documentaron las variantes real y compacta existentes en el menú, además del recurso PNG `design-system-by-comsatel.png` para identificar la plataforma. La marca textual anterior del encabezado fue reemplazada por ese recurso, preservando el enlace al inicio y su nombre accesible. Las descripciones quedaron fuera de las superficies visuales; los lineamientos incluyen ejemplos recomendado/evita y criterios de texto alternativo. Verificación: `npm run build`, reinicio de `ng serve` y ruta cargada sin errores.

Actualización: 2026-09-13, cierre de Motion y Motion tokens. El motor GSAP resuelve curvas y duraciones desde tokens; se migraron Motion, Accordion, Collapse y PressScale para evitar valores duplicados. Ambas páginas ahora documentan accesibilidad y lineamientos; el Playground, presets y botones Repetir se comprobaron en un tab limpio. Verificación: `npm run build`, reinicio de `ng serve`, rutas `/animations/motion` y `/animations/tokens` con HTTP 200, interacción real de Mostrar/Repetir y árbol de accesibilidad. `prefers-reduced-motion` está cubierto por el guard compartido `prefersReducedMotion()` antes de cada tween de Motion.

Actualización: 2026-09-10, reconstrucción de `AppLayout` y navegación. Se
tokenizaron bordes, motion y tipografía; se agregaron landmarks y estados ARIA
(`aria-expanded`, `aria-controls`, `aria-current`), nombres accesibles en rail,
foco visible, drawer móvil con Escape, foco inicial/restauración y trampa de
foco. La página `/components/app-layout` ahora documenta accesibilidad y
lineamientos en dos columnas, y se agregó `app-layout.stories.ts` con las
composiciones ya verificadas en la página Angular. La página temporal de
seguimiento se reorganizó por átomos, moléculas, organismos y patrones
compuestos, incluyendo los pendientes de Angular y los pendientes de fuente
React.

Este archivo se actualiza al final de cada auditoría o reconstrucción sobre
el proyecto Angular (`C:\Users\emacalupu\Documents\Boveda\Monday\Comsatel-DS`; alternativa histórica: `D:\Investigacion\Comsatel-DS-Angular`). Es el único
archivo del skill que se espera que cambie con el uso — los demás son
conocimiento estático de la arquitectura.

Actualización concurrente: 2026-09-10, reconstrucción aislada de `Button` y
`Badge`. Button: C1 corregido en los dos bordes de variante y en el anillo de
foco; se agregó la transferencia de `aria-label` al `<button>` nativo y la
sección de lineamientos de uso con sus ocho casos de paridad documental. Una
instancia local separada confirmó el nombre accesible, el orden de Tab y la
sección; Storybook compiló su caso solo-ícono accesible. Badge: el borde base
pasó a `--layout-border-thin`, el contenido proyectado se centra por su
altura tipográfica real dentro del alto fijo, y se incorporaron los ocho
ejemplos de lineamientos del referente, agrupados en las dos columnas
Recomendado/Evita.

Actualización concurrente: 2026-09-10, reconstrucción aislada de `Menu`
(trabajo en paralelo con la ronda de Button/Badge de arriba — sesión
distinta, mismo repositorio; se evitó tocar cualquier archivo fuera de
`menu/`, `directives/collapse.directive.ts`, `public-api.ts` y
`menu-demo/`). Hallazgos de la auditoría contra `menu.tsx`/
`MenuPageContent.tsx`, todos corregidos:
- **Bug de comportamiento real** (`menu.ts`): `isOpen()` hacía
  `openHrefs.has(href) || isHighlighted(item)` — un grupo con hijo activo
  quedaba highlighted para siempre y el toggle manual nunca lo cerraba
  visualmente (el `||` seguía ganando). React sí permite colapsar un grupo
  activo (`useState` real + `useEffect` que solo FUERZA a abrir cuando
  cambia el activo). Fix: `isOpen()` ahora lee solo `openHrefs`; se agregó
  `ngOnChanges` que agrega el href activo al set cuando `activeHref`/
  `groups` cambian — mismo efecto que el `useEffect` de React, sin dejar el
  grupo pegado en cada evaluación.
- **Animación de expandir/colapsar faltante**: el submenú aparecía/
  desaparecía de golpe con `@if`. Se extrajo el mecanismo GSAP que ya usaba
  `cs-accordion-item` (`height: 0→auto`, CSS puro no puede transicionar eso)
  a una directiva reusable nueva, **`Collapse` (`[csCollapse]`)** en
  `projects/comsatel-ds/src/lib/directives/collapse.directive.ts`, exportada
  en `public-api.ts` — Menu es su primer consumidor; el `<ul
  class="cs-menu__children">` ahora vive siempre en el DOM (mismo criterio
  que el `body` de Accordion) y el binding `[csCollapse]="isOpen(item)"`
  controla la animación.
- **C1** (padding convertido mal desde Tailwind al portar): `.cs-menu__row`
  vertical `sm`→`md` (React `py-2`=8px), `.cs-menu__child` y
  `.cs-menu__flyout-item` verticales `xs`→`sm` (React `py-1.5`=6px),
  `.cs-menu__rail-btn`/`--disabled` `sm`→10px explícito (React
  `py-2.5`=10px, hueco de escala) y `.cs-menu__tooltip` horizontal
  `md`→10px explícito (React `px-2.5`=10px). También el `transition` del
  chevron pasó de `0.15s ease` crudo a
  `var(--motion-duration-leaving) var(--motion-easing-default)` (150ms ya
  coincidía con el token, solo no estaba atado).
- **C13**: `.cs-menu__row` y `.cs-menu__child` tenían `line-height: 16px`
  fijo en vez de `var(--font-line-height-content-note)` — se habían
  escapado de la ronda de auditoría C13 anterior (que sí corrigió
  group-header/flyout-title/flyout-item/tooltip).
- **Página** (`menu-page.*`): assets `public/logos/c-locator-logo.png` y
  `-compact.png` copiados desde React (no existían en Angular). Sección
  "Ejemplo completo" reescrita a un solo frame en modo expandido con header
  de marca (logo), sin alto fijo — el alto 424px + header rotulado de texto
  que tenía antes correspondía en realidad al patrón del Playground de
  React, no al de esta sección. Playground: agregado el control "Ítem
  activo" que faltaba (`activeItem`, ausente respecto a
  `MenuPageContent.tsx`) y el header de logo (compacto en modo rail).
  Lineamientos de uso: agregado el par "groups" completo que faltaba
  (agrupar ítems relacionados vs. grupo de un solo ítem) y, siguiendo B15,
  las tarjetas "Recomendado" de los pares actions/depth pasaron de solo
  texto a un `<cs-menu>` real embebido e interactivo (igual que React,
  que sí los renderiza vivos ahí) — los 4 snippets de código restantes
  (`.guide-card__code`, patrón ya usado en Accordion) se agregaron donde
  antes solo había texto.

**Verificación en vivo (2026-09-10, tras reinicio de `ng serve` coordinado
por el usuario):** el usuario reportó 4 hallazgos reales adicionales al
ver la página reconstruida, los 4 corregidos en la misma pasada:
- **Imágenes del logo desbordaban el frame.** El asset real
  (`c-locator-logo.png` = 1106×100px, `-compact.png` = 317×90px) es mucho
  más ancho que alto — fijar solo `height:28px` (mismo criterio que
  `h-7 w-auto` de React) lo desborda del ancho del frame (240px/72px). Fix:
  `.frame__header img` con `max-width:100%; max-height:28px; width:auto;
  height:auto;` en `menu-page.css` — el ancho manda cuando la proporción lo
  exige.
- **Colisión de key reservada `mode` con el tema del Canvas.** Bug real de
  la página (preexistente, no introducido en esta ronda): el
  `ControlDef` de Menu usaba `key: 'mode'` para su prop `mode`
  (expanded/rail) — pero `demo-shell.ts` usa esa MISMA clave internamente
  para su propio interruptor de tema claro/oscuro (`state = signal({mode:
  'light'})`, `[attr.data-theme]="mode()"`). El valor de Menu sobreescribía
  el tema real, dejando `data-theme="expanded"` en vez de `"light"`/`"dark"`
  — rompía visualmente el grid de puntos/colores del Canvas. Fix: la key del
  control de Menu pasó a `menuMode` en `menu-page.ts` (`onPlaygroundState`
  actualizado igual). Cualquier página futura con una prop real llamada
  `mode` debe usar una key distinta a `mode` en su `ControlDef` por la misma
  razón.
- **Playground con alto fijo generaba scrollbar interna.** Se quitó
  `.frame--fixed-height` (424px + `overflow-y:auto`) — el frame ahora crece
  con su contenido, sin scroll, incluida la variante rail/expandido.
- **Faltaba el frame contraído (rail) en "Ejemplo completo".** Pedido
  explícito del usuario tras ver el resultado (diverge de
  `MenuPageContent.tsx`, que solo muestra expandido ahí — decisión del
  usuario, no un hallazgo de paridad con React). Se agregó el segundo frame
  en modo rail con el logo compacto, igual patrón que el frame expandido.

**Verificado con interacción real** (`ng.getDirectives`/`ng.getComponent`
vía consola, más recarga con `activeHref` temporal apuntando a un hijo de
"Flota"): el grupo con hijo activo SÍ se puede colapsar y reabrir con clic
(`openHrefs`/`ngOnChanges` correctos en ambas direcciones — confirmado por
el chevron y el `@Input` de `Collapse` alternando `true`/`false`), y la
animación GSAP progresa correctamente hacia los extremos (0 / altura real).
La DURACIÓN exacta de la animación no se pudo medir con precisión en este
Browser pane — `document.hasFocus()` devuelve `false` incluso con el tab al
frente (mismo gotcha ya documentado en `environment-issues.md` punto 6),
lo que throttlea `setTimeout`/rAF y distorsiona cualquier medición de
tiempo real; el progreso relativo de la animación sí se confirmó estable
en ambas direcciones. Sin errores de consola. Playground, Estados y las 2
guide-cards vivas (`actions`/`depth`) confirmados visualmente sin errores.

Componente y página quedan **Cerrados** con esta pasada.

**Segunda ronda (2026-09-10): auditoría de la referencia React, 2 bugs
heredados encontrados y corregidos también en Angular.** El usuario pidió
auditar `menu.tsx` en `Sistema-de-dise-o-Comsatel` (excepción puntual al
alcance habitual del skill — no para portar nada, sino para revisar la
calidad de la fuente) tras notar en vivo que el flyout de rail se veía con
etiquetas grandes y un doble borde raro. Confirmado con HTML/estilos
computados reales (no solo lectura de código):
- **Tooltip de hoja del flyout de rail reimplementado a mano en React**
  (`RailItem`, rama sin `children`) en vez de reusar `<Tooltip>` real:
  `text-[12px]`/`px-2.5 py-1.5`/`rounded-md`/`shadow-lg` contra
  `label/small` (11px)/`layout-padding-xs md`/`radius-xs`/`shadow-md` que
  sí usa `tooltip.tsx`. **Este mismo bug ya estaba en Angular** (heredado
  al portar): `.cs-menu__tooltip` usaba `--font-size-content-note`
  (12px)/`--layout-padding-sm 10px`/`--radius-sm`/`--shadow-lg` en vez de
  calcar `cs-tooltip` real (`tooltip.css:24-28`). Corregido en Angular
  (`menu.css`) a `--font-size-label-small`/`--layout-padding-xs md`/
  `--radius-xs`/`--shadow-md`. **React sigue sin corregir** — el usuario no
  confirmó todavía si quiere ese fix también en la fuente.
- **Ningún ítem de Menu (rail ni expandido) definía foco visible
  tokenizado**, ni en React ni en Angular — a diferencia de `Button`
  (`focus-visible:ring-2 ring-[var(--color-border-focused)] ring-offset-2`
  en React; `box-shadow` doble equivalente en `button.css:39-43` de
  Angular). El navegador aplicaba su outline nativo en su lugar. Corregido
  en Angular: `.cs-menu__row`/`.cs-menu__rail-btn` (triggers raíz) con el
  mismo `box-shadow` doble de Button; `.cs-menu__child`/
  `.cs-menu__flyout-item` (ítems de lista secundarios) con el criterio de
  `.cs-dropdown-item:focus-visible` (fondo de hover, sin ring propio —
  serían redundantes/se recortarían contra los vecinos). **React sigue sin
  corregir.**

Librería Angular reconstruida (`✔ Built comsatel-ds` sin errores) y
verificado con interacción real (`ng.getDirectives`/hover real vía
`computer`) que el fix del tooltip SÍ quedó aplicado: `.cs-menu__tooltip`
midió 11px/4px-8px/2px de radius/sombra de dos capas — coincide con
`cs-tooltip` real. Pendiente confirmar con el usuario si corresponde
aplicar los mismos 2 fixes en React (`menu.tsx`), ya que ahí se originó el
patrón.

**Tercera ronda (2026-09-10): refactor a `cs-popover` real, motivado por el
usuario ("el hover sigue entrecortado... el de varias opciones sí parece
usar el Popover que tenemos, creo").** Confirmado un hallazgo C8 más
grande de lo que parecía: el flyout de rail de Menu (tooltip de hoja Y
lista de children) reimplementaba TODO el motor de overlay a mano
(`onRailEnter` calculando `getBoundingClientRect` manual, `position:fixed`
propio, SIN animación de entrada/salida, SIN cierre por click-afuera ni
Escape) — mientras que `cs-popover` (`projects/comsatel-ds/src/lib/popover/`)
ya resuelve exactamente eso, documentado desde su construcción como "base
real para Select/Spotlight/**Menu**" en este mismo archivo, pero nunca se
integró. Nadie más en la librería consumía `<cs-popover>` todavía —
Menu es su primer uso real.
- **`Popover` ganó un `@Input() bare`** (`popover.ts`/`.html`/`.css`): quita
  el marco propio (borde/fondo/radio/sombra), dejando solo posicionamiento/
  portal/animación/cierre — para un consumidor cuyo contenido ya trae su
  propia superficie visual (el tooltip oscuro de Menu no debe verse dentro
  de una segunda tarjeta clara). No rompe ningún uso existente (no había
  ninguno).
- **`menu.ts`**: `onRailEnter` ya no calcula posición a mano (perdió el
  parámetro del evento); se quitó el signal `flyoutPos` (ahora lo resuelve
  Popover vía `[triggerRef]`).
- **`menu.html`**: cada trigger de rail (`#railTrigger`) tiene su propio
  `<cs-popover [isOpen]="hoveredItem()===item" [triggerRef]="railTrigger"
  placement="right-start" [offset]="6">` — `[bare]="true"` en el caso hoja
  (tooltip), sin `bare` en el caso children (lista, que SÍ debe verse como
  tarjeta con marco). Se quitó el bloque `@if` global que dibujaba el
  flyout fuera del `@for`.
- **`menu.css`**: `.cs-menu__flyout` perdió `position/z-index/border-radius/
  border/background-color/box-shadow` (duplicaban el marco que ya provee
  `cs-popover`) — de paso corrigió que usaba `--elevation-surface-raised`
  en vez de `--elevation-surface-overlay` (el token real de overlay
  flotante, el mismo que usan Popover y Modal).

Librería reconstruida (`✔ Built comsatel-ds` sin errores).
**Pendiente:** verificación visual del refactor completo (animación de
entrada/salida del flyout, cierre con click-afuera/Escape, reposición en
scroll/resize) — el usuario coordina el reinicio de `ng serve` (puerto
4300, compartido con otra sesión en paralelo).

Última reconstrucción individual: `Avatar` (incluye AvatarLabel,
AvatarGroup y AvatarAddButton). Se cerraron los criterios C1–C13, la paridad
documental y la verificación visual del conjunto el 2026-09-10.

Última reconstrucción individual: `Input` + `InputGroup` (incluye
InputGroupAddon, InputGroupInput, InputGroupText y PasswordInput). Se cerraron los criterios
C1–C13, la API nativa de accesibilidad, la paridad documental con React y la
verificación visual/interactiva del conjunto el 2026-09-10.

Última reconstrucción individual: `Dropdown` + `InputDropdown` (incluye
DropdownItem). Se cerraron los criterios C1–C13, los patrones de menú y
combobox/listbox, la navegación por teclado, la paridad documental con React y
la verificación visual/interactiva del conjunto el 2026-09-10.

Última actualización: 2026-09-16, escala de etiquetas de campo. Se publica
`fieldLabelTypography` desde `lib/input/input-tokens.ts`: `xs` usa
`label/small`; `sm` y `md`, `content/note`; y `lg`, `content/caption`, siempre
con peso `accent`. `Select`, `InputDropdown`, `DateTimePicker` y
`DateTimeRangePicker` derivan su etiqueta encapsulada de ese mapa y conservan
los spacers del rango en la misma altura. `Input`, `InputGroupInput` y
`PasswordInput` mantienen intencionalmente una etiqueta externa; la guía de
Input documenta la receta pública `textStyle(fieldLabelTypography[size],
'accent')`. No añadir un input `label` a esos controles sin diseñar primero un
`FormField` que resuelva toda la anatomía. Verificado con build de librería y
app, tests de librería/aplicación, controles de documentos, Storybook y la ruta
local `/components/select` en tamaño `lg`, además de `/components/datetime-picker`.

Última actualización: 2026-09-10, quinta ronda (cierre de la lista completa
del usuario: Mapa y Animaciones). Se investigaron primero las páginas reales
de React (`MapThemePageContent.tsx`, `MarkersPageContent.tsx`,
`LiveMapPreview.tsx`, `MotionPageContent.tsx`, `MotionTokensPageContent.tsx`,
`motion.tsx`) antes de tocar código Angular, mismo criterio que cada
componente anterior. Construido:
- **`Motion` (`projects/comsatel-ds/src/lib/motion/motion.ts`)** —
  primitivo de animación de entrada/salida genérico, nuevo componente de
  librería (no solo una directiva puntual como `PressScale`). 6 presets
  (fade/scale/slide-*), duración/easing por token, motor GSAP. Ver su
  entrada completa más abajo en "Componentes de librería".
- **Páginas `/animations/tokens` y `/animations/motion`** — documentan los
  tokens de motion (ya existían en `tokens.css`, sin cambios de valor) y el
  componente `Motion` nuevo.
- **Página `/map/theme`** — requirió evaluar qué librería de mapas es
  compatible con Angular (pedido explícito del usuario: "no necesariamente
  el que utilizamos en react es compatible con angular"). Se verificó
  `leaflet` (BSD-2-Clause, sin `peerDependencies`, confirmado leyendo el
  LICENSE real del tarball de npm, no solo el metadata) — se usa el paquete
  core `leaflet` con su API vanilla directo en un componente Angular
  (`LiveMapPreview`, local a esta página de documentación, NO exportado
  desde `comsatel-ds`: en React tampoco vive en `components/ui/`, es un
  componente de docs). Nuevos tokens de color en `tokens.css` (ver su
  entrada abajo).
  **Superseded 2026-09-14:** `leaflet` se reemplazó por `maplibre-gl` (misma
  disciplina de evaluación, ver la entrada de auditoría al inicio de este
  archivo) — los proveedores CartoDB/Stadia documentados acá empezaron a
  exigir API key y el fallback real terminó siendo Esri sin diseño pensado
  para dashboards. `LiveMapPreview` ahora usa OpenFreeMap (sin key). El
  resto de esta nota (arquitectura de tokens de color, `/map/markers`) sigue
  vigente sin cambios.
- **Página `/map/markers`** — documentación pura, sin componente de
  librería nuevo: igual que en React, los marcadores reales los pinta
  Leaflet con `divIcon`/HTML plano (código de C-Locater, fuera de este
  repo). Los componentes `VehiclePill`/`GpsCompact`/`GpsFull`/
  `ClusterBadge` son locales a esta página (mockups de referencia), no
  parte de `comsatel-ds`.
- Íconos nuevos en el registro: `car`, `bike`, `bus`, `tractor`,
  `satellite`, `sun`, `map-pin`, `locate-fixed`, `timer`, `wand-2`.
- `nav.ts`: secciones nuevas "Mapa" y "Animaciones"; corregido un
  `pending: true` obsoleto en Pagination (ya estaba construido y con ruta
  real desde una ronda anterior, quedó sin actualizar en `nav.ts`).
- Dependencia nueva del proyecto Angular (raíz, no de `comsatel-ds`):
  `leaflet` + `@types/leaflet`, con `leaflet.css` registrado en
  `angular.json` (`styles`).

**Con esto se cierra la lista completa de componentes/secciones pedida por
el usuario el 2026-09-10.** No queda ningún pendiente explícito de esa
lista. Sigue, si el usuario lo pide: auditoría de tokens/tamaños de este
último tramo (Motion, Mapa, Marcadores) con el mismo checklist de 13
criterios ya aplicado al resto.

Actualización anterior: 2026-09-10, cuarta ronda (auditoría completa de
tokens/tamaños/tipografía de todo lo construido hasta ese punto — bug
sistémico de `line-height` faltante encontrado y corregido en 8
componentes, más 2 valores crudos de `menu.css` alineados a token; ver
`audit-checklist.md` C13 para el detalle completo).

Actualización anterior: 2026-09-10, tercera ronda (Skeleton, Accordion y
Radio construidos y verificados — primeros de la lista de componentes
faltantes, en el orden de dependencia acordado con el usuario. Corrección
real: Header y List item NO estaban listos para portar, son dead links en
React también — se sacaron de la lista de "listos". Progress indicator se
reconstruyó después como componente nuevo solicitado explícitamente.
Mecanismo `@ContentChildren` establecido como el estándar para coordinar
componentes compuestos padre-hijo, documentado para que Menu/Table lo
reutilicen sin reabrir la pregunta de DI).

Actualización anterior: 2026-09-10, segunda ronda (fundamento "Layout"
construido — reveló que el Shell real del sitio no implementaba el sistema
de 3 modos responsivos que la página describe; se reconstruyó completo:
tokens de breakpoint/layout-chrome nuevos, servicio `SidenavState`, rail
con flyout, drawer mobile. Pendiente explícito: `AppLayout` reusable para
producto, ver sección "Pendientes").

Actualización anterior: 2026-09-10, primera ronda (GSAP evaluado y aceptado
como motor de animación — ver sección propia más abajo; directiva
`PressScale` construida y aplicada en el sidebar; corregido el color del
ícono del sidebar para heredar del texto en vez de un color propio fijo).

Actualización anterior: 2026-09-07 (tercera ronda: se escribió `.stories.ts`
para todos los componentes de librería que faltaban en Storybook — y se
corrigió, agregando la regla B11/`storybook-pattern.md`, que varias
composiciones se habían inventado directo en Storybook sin existir en el
desarrollo Angular real: un botón con ícono a ambos extremos, un botón
solo-ícono, `showPlaceholderIcon` suelto en Avatar, `embedded`/`fullWidth`
sueltos en InputDropdown — todas revertidas o reemplazadas por el patrón
real. Detalle completo en `storybook-pattern.md`.

Segunda ronda de hallazgos reales
reportados por el usuario: (1) InputDropdown embebido en un InputGroup se
veía roto/doble marco en el Playground de Input; el campo de hora de
DateTimePicker no llenaba su ancho, dejando el botón de limpiar muy
alejado — ver `[embedded]`/`[fullWidth]` en la entrada de Dropdown +
InputDropdown; (2) CardBanner/FeatureSpotlightCard dibujaban un ícono de
silueta en sus avatares placeholder que el diseño real no tiene (solo
círculos de color planos) — ver `[showPlaceholderIcon]` en Avatar/
AvatarGroup; (3) `<h3 class="subsection__title">` suelto sin envolver en
`.subsection` en 3 páginas (Avatar, Input, Card) — corregido, ver
`page-pattern.md`. Detalle de (1) en la entrada de Dropdown + InputDropdown,
detalle de (2) en la entrada de Avatar, ambas más abajo).

## PrimeNG — evaluado y descartado (decisión cerrada, 2026-09-09)

Se evaluó a fondo usar PrimeNG como motor de comportamiento/accesibilidad
para componentes complejos (se llegó a construir un piloto funcional de
Modal envolviendo `p-dialog`). **Decisión final: no.** No por motivo
técnico — por licenciamiento: PrimeNG 22 exige licencia comercial que
Comsatel no califica gratis (15+ desarrolladores, tope real es 4), y
envolverlo dentro del sistema de diseño no exime a los desarrolladores que
lo consuman después (confirmado con la FAQ oficial de PrimeUI). La única
versión MIT permanente (PrimeNG 21) no soporta Angular 22, que es lo que
corre este proyecto. Historial completo de la evaluación en
`C:\Users\emacalupu\Documents\Boveda\Monday\Comsatel-DS\PRIMENG_PLAN.md` (o `D:\Investigacion\Comsatel-DS-Angular\PRIMENG_PLAN.md` si esa fue la ruta validada).

**Todo componente se construye a mano, sin excepción — ver B14 en
`SKILL.md` y `references/accessibility-patterns.md`.** Ese archivo tiene el
patrón concreto (código real) para foco atrapado, portal a
`document.body`, bloqueo de scroll, cierre con Escape/clic afuera, y
animación de entrada/salida sin librería — más un gotcha real de esta app
(corre sin `zone.js`, zoneless por defecto: cualquier estado mutado dentro
de un `setTimeout` tiene que ser `signal()`, no una propiedad plana, o la
vista nunca se actualiza — ver C4 punto 7 en `audit-checklist.md`).

Registrado también en `Sistema-de-dise-o-Comsatel/COMPONENT_GAPS.md` para
que quede visible desde los dos proyectos.

## GSAP — evaluado y aceptado (2026-09-10)

Distinto de PrimeNG: no es una librería de UI (sin componentes ni identidad
visual propia), es un motor de animación de utilidad. Se evaluó con el
mismo rigor de necesidad (¿CSS puro ya lo resuelve?) para el caso real que
lo disparó — el feedback de "presionado" del sidebar (equivalente a
`whileTap` de Framer Motion en React, ver `Sidebar.tsx`/`menu.tsx` en
`Sistema-de-dise-o-Comsatel`) — y se aceptó como dependencia de
`comsatel-ds`. Se descartó antes `@angular/animations`: instalado,
probado, y desinstalado en la misma sesión al confirmar que Angular 22 lo
marca deprecado a favor de `animate.enter`/`animate.leave` (que solo cubre
entrada/salida del DOM, no el caso de interacción que hacía falta).

Detalle técnico y el criterio de "cuándo sí / cuándo no" en
`references/accessibility-patterns.md` sección 9. B14 en `SKILL.md` se
actualizó para aclarar que la regla de "nada de librerías de terceros" era
sobre librerías de UI (PrimeNG-tipo), no sobre cualquier paquete npm.

## Componentes de librería — construidos en Angular con el patrón completo

Librería (`projects/comsatel-ds/src/lib/`) + página de documentación
(`src/app/pages/<nombre>-demo/`) + ruta + entrada en `nav.ts`, verificados en
navegador con interacción real:

- Button (incluye `fullWidth`, agregado después del build inicial)
- Badge
- Tag — componente informativo nuevo solicitado explícitamente: compone
  `cs-badge` para reutilizar geometría, tipografía y centrado; expone
  `severity`, `size`, `rounded`, `value`, `icon`, `aria-label` y `aria-live`.
  Las severidades siguen la semántica de categorización pública evaluada
  para el patrón (`primary`, `secondary`, `success`, `info`, `warn`,
  `danger`, `contrast`) y se mapean a variantes de Badge propias del sistema.
- Progress indicator — componente de recorrido por etapas solicitado
  explícitamente: estados `done`/`active`/`pending`, orientación horizontal o
  vertical, interacción opcional por botones y evento `stepClick`; usa la
  estructura de recorrido de la referencia funcional, con tokens y motor
  propios de Angular.
- Stepper — indicador de una secuencia fija: los estados `done`/`active`/
  `pending` usan una lista informativa por defecto y botones nativos solo con
  `interactive`; los conectores comienzan y terminan en los centros de los
  nodos y la variante vertical conserva sus tramos visibles. No implementa
  paneles de wizard, que son un patrón distinto.
- Header — patrón compuesto solicitado explícitamente: marca de texto no navegable, notificaciones y menú de cuenta
  configurable, acciones de utilidad y cuenta. Reutiliza Avatar, Icon y el
  portal accesible de Popover; expone eventos de navegación, notificaciones,
  configuración y cierre de sesión sin acoplarse a un producto concreto.
- Avatar (+ AvatarLabel, AvatarGroup, AvatarAddButton) — usa las 9 fotos
  reales de `public/avatars/avatar-1.jpg` a `avatar-9.jpg` (copiadas de
  React), no placeholders generados. `Avatar` tiene dos `@Input()`
  opcionales para el placeholder (sin foto/iniciales), ambos `true`/color
  brand-subtle por defecto — no rompen ningún uso existente:
  - `placeholderBg` — color de fondo del círculo.
  - `showPlaceholderIcon` — si se dibuja la silueta SVG dentro. Hallazgo
    real: Card (`CardBanner`/`FeatureSpotlightCard`) reusaba el
    placeholder de Avatar para su constelación decorativa de "personas sin
    foto", pero el diseño real de esos dos (`card.tsx`) dibuja solo un
    círculo de color PLANO, sin silueta — la reutilización directa de
    Avatar agregó un ícono que el sistema real no tiene ahí. `AvatarGroup`
    reenvía ambos (`showPlaceholderIcon`, y `placeholderBg` por ítem vía
    `AvatarGroupItem.placeholderBg`) a cada `cs-avatar` interno.
- Banner
- Checkbox — accesibilidad vía `<input type="checkbox">` nativo oculto, sin
  Base UI
- Toggle — mismo criterio que Checkbox, track/thumb dibujado + input nativo
- Tooltip — posicionamiento CSS puro relativo al trigger, delay simulado con
  `transition-delay`
- Dropdown + InputDropdown — cierre al clic afuera vía
  `@HostListener('document:mousedown')`; glyphs de checkbox/radio del ítem
  de menú comparten CSS con Checkbox/Radio vía `shared/selection-glyphs.css`
  y la fórmula del punto vive en `shared/radio-glyph.ts`, para evitar que
  ambos contextos diverjan. `InputDropdown` tiene dos modificadores opcionales
  agregados tras hallazgos reales (ambos `false` por defecto, no rompen el
  uso normal):
  - `[embedded]="true"` — para usarlo dentro de un `cs-input-group-addon`
    (ej. selector de código de país en un campo de teléfono). Sin esto se
    veía como un "select" completo con su propio borde/fondo anidado
    dentro de otro campo completo (doble marco), y no escalaba de alto con
    el tamaño del grupo si nadie le pasaba `[size]` a mano — hallazgo real
    en el Playground de Input, tipo "Dropdown al inicio"/"al final". Ojo:
    la altura embebida se resuelve con el binding `[style.height.px]`
    normal (mismo que el modo no-embebido), NUNCA con `height:100%` — un
    porcentaje ahí no resuelve de forma confiable a través del
    `display:contents` del addon (se probó y falló silenciosamente,
    quedando ~23px en vez de los 40px reales del grupo).
  - `[fullWidth]="true"` — estira el trigger al 100% de su contenedor en
    vez de encogerse a su contenido, CONSERVANDO su borde/fondo propios
    (a diferencia de `embedded`). Hallazgo real: el campo de hora de
    DateTimePicker vivía en un wrapper de ancho fijo (`FIELD_WIDTH`) pero
    el trigger se quedaba en su ancho de contenido natural (~90-130px),
    dejando un hueco enorme antes del botón de limpiar (se veía "la X muy
    a la derecha") — este SÍ funciona con `width:100%` normal porque no
    hay ningún `display:contents` de por medio en ese caso.
- Input + InputGroup/InputGroupAddon/InputGroupInput/InputGroupText/PasswordInput —
  `projects/comsatel-ds/src/lib/input/`. `InputGroup` reacciona a
  foco/inválido/disabled del `input` proyectado con selectores `:has()`
  puros (`.cs-input-group:has([data-slot='input-group-control'][aria-invalid='true'])`,
  etc.), sin JS de coordinación — verificado que el borde/anillo de peligro
  SÍ se aplica visualmente (screenshot), aunque `getComputedStyle()` en
  este Browser pane reportó el valor viejo incluso forzando un
  `style.setProperty(..., 'important')` inline: es una limitación de
  lectura del sandbox, no del CSS — ver punto nuevo en
  `environment-issues.md`. `InputGroupAddon` enfoca el `<input>` interno al
  hacer clic fuera de un botón anidado (`elementRef.nativeElement
  .parentElement?.querySelector('input')?.focus()`); ojo al probarlo por
  JS: el `(click)` está en el `<div>` interno, no en el host
  `<cs-input-group-addon>` (que es `display:contents`) — hacer
  `.click()` sobre el host no dispara el handler.
- Calendar — `projects/comsatel-ds/src/lib/calendar/`. Grilla de 6 semanas
  fijas (42 celdas), selección simple/rango/deshabilitado, navegación
  mes/año controlada o no controlada (mismo patrón dual que React). Nombres
  de mes/día vía `Intl.DateTimeFormat('es', …)` fijo, sin mecanismo de
  locale (ver "Sin i18n" abajo). El hover de celda se resuelve con un
  signal `hoveredIso` + `[ngStyle]` reactivo en vez de CSS `:hover` puro —
  mismo motivo que el bug C4 variante 5 (un color de estado ya viene por
  `[ngStyle]`, así que un `:hover` de CSS externo nunca le ganaría). Reveló
  el bug C4 variante 6 (`defaultMonth`/`defaultYear` sembrados en el
  inicializador de campo en vez de `ngOnInit()` — el Playground mostraba
  el mes actual en vez del pedido pese al binding correcto); ya corregido
  y documentado.
- DateTimePicker — `projects/comsatel-ds/src/lib/datetime-picker/`.
  Compone `InputGroup`/`InputGroupInput`/`InputGroupAddon` (campo de fecha
  con popover de `cs-calendar`) + `InputDropdown` (campo de hora), fecha y
  hora en signals separados. Escritura directa vía `parseTypedDate()` +
  tecla Enter, cierre por clic afuera vía `@HostListener('document:mousedown')`
  (para probarlo con `javascript_tool`, disparar un evento `mousedown` real,
  NO `.click()` — `.click()` no dispara `mousedown`, un falso negativo
  encontrado y descartado en esta sesión). `FIELD_WIDTH=258` fijo
  (7 columnas × `--layout-size-base` de Calendar + padding + borde) y
  `padding-bottom: 320px` reservado en el contenedor de la demo para que el
  popover no quede flotando sobre el Toolbar (C9). También reveló C4
  variante 6: `defaultValue`/`fieldId` sembraban `internalDate`/
  `internalTime`/`inputText`/`viewMonth`/`viewYear`/`resolvedId` en
  inicializadores de campo — ninguna demo con fecha precargada mostraba
  nada hasta mover esa siembra a `ngOnInit()`. `InputGroupInput` (librería
  compartida con Input) se extendió con `id`/`required`/`ariaHasPopup`/
  `ariaExpanded`/`ariaControls` y los outputs `focused`/`blurred`/
  `enterKey`/`escapeKey` — todos opcionales, no rompen el uso existente de
  Input — para que el campo de fecha pudiera reusar el mismo componente en
  vez de un `<input>` bespoke.
- Card — `projects/comsatel-ds/src/lib/card/`, 5 componentes separados
  (React los tenía los 5 en un solo `card.tsx`, acá cada uno es su propio
  `.ts/.html/.css`, igual que Avatar/AvatarGroup/AvatarLabel):
  `ActionCard`, `CardBanner`, `FeatureSpotlightCard`, `SpotlightCard`
  (compone `FeatureSpotlightCard`), `PreviewCard`. Todos reusan piezas ya
  construidas en vez de redibujar a mano (C8) — `ActionCard` usa
  `<cs-toggle size="md">` real donde React tenía un mini-toggle local
  propio, y `<cs-button variant="default" size="sm">`; `CardBanner` usa
  `<cs-avatar-group size="xs" [maxVisible]="3">` para el stack de
  avatares (24px = tamaño `xs` exacto) en vez de círculos superpuestos a
  mano; `FeatureSpotlightCard` usa `<cs-avatar>` individual por posición
  (tamaños 40/32 = `md`/`sm` exactos) dentro de wrappers con coordenadas
  `calc()` propias de esta constelación decorativa (no son tokens de
  layout, quedan explícitas con comentario, mismo criterio que
  `FIELD_WIDTH` en DateTimePicker). `Avatar` se extendió con
  `@Input() placeholderBg` (opcional, default el mismo brand-subtle de
  siempre) para que la constelación pueda variar el color de placeholder
  por posición sin reimplementar el círculo.
  **Hallazgo real corregido:** `cs-avatar-group` no fabrica placeholders
  solo — a diferencia de React (que mostraba 3 círculos de color cuando
  `avatars.length === 0`), si no se le pasan items no renderiza nada. La
  demo de `CardBanner` sin avatares reales pasa 3 `{}` explícitos
  (`AvatarGroupItem` vacío) para que el placeholder real de `cs-avatar`
  (ícono de silueta) aparezca — no hace falta redibujar círculos de color
  para este caso, el placeholder genérico del sistema ya es coherente.
  `PreviewCard` usa `<ng-content select="[logo]">`/`[image]` (slots
  proyectados) en vez de `@Input() logo/image: ReactNode`, que no tiene
  equivalente directo en Angular — mismo criterio que `InputGroupAddon`.
- Modal — `projects/comsatel-ds/src/lib/modal/`. Motor de comportamiento
  100% a mano (ver B14 en `SKILL.md` y `accessibility-patterns.md`): foco
  atrapado, portal a `document.body` vía `Renderer2`, bloqueo de scroll,
  restauración de foco, cierre con Escape/clic afuera. `appearance`
  (`default`/`warning`/`danger`) tiñe el título y el botón principal juntos
  — mapea a las variantes ya existentes de `cs-button`
  (`primary`/`warning`/`destructive`). `width` con escala propia (`sm`
  400px/`md` 560px/`lg` 720px/`xl` 960px, sin equivalente en
  `token-architecture.md` — mismos números que el Modal de React, ver B1)
  o un número directo. `scrollBehavior` (`body`/`viewport`) controla si el
  contenido interno scrollea (con tope `85vh`) o si todo el panel se
  desplaza en la página. **Bug real de plataforma encontrado y corregido:**
  el estado de la animación de entrada/salida (`rendered`/`visible`) se
  escribió primero como propiedades planas mutadas dentro de un
  `setTimeout` — la transición nunca se veía porque esta app corre sin
  `zone.js` (zoneless). Fix: `signal()` en vez de propiedad plana — ver C4
  punto 7 en `audit-checklist.md`.
- `PressScale` (directiva `[csPressScale]`) —
  `projects/comsatel-ds/src/lib/directives/press-scale.directive.ts`.
  Feedback de "presionado" reusable (encoge a escala 0.98 mientras el
  puntero está abajo) vía GSAP — ver sección "GSAP" arriba y
  `accessibility-patterns.md` sección 9. Aplicada por ahora en el sidebar
  de la shell (`src/app/layout/shell/shell.html`: grupo, ítem raíz activo,
  ítem hijo). Las duraciones se leen en tiempo real de
  `--motion-duration-fast`/`--motion-duration-leaving`, no quedan copiadas
  como número suelto.
- **Corrección real (2026-09-10), sidebar de la shell:** el ícono de cada
  ítem del menú (`.sidebar__item-icon`) tenía un color propio fijo
  (`--color-text-base-subtlest`) en vez de heredar el color del texto que
  lo acompaña — a diferencia de la referencia React, donde el ícono es un
  SVG con `stroke="currentColor"` y sigue automáticamente el color del
  texto del contenedor (normal/hover/activo) sin reglas por estado. Fix:
  `color: inherit` en `.sidebar__item-icon` (`shell.css`), que además
  permitió borrar las reglas `.sidebar__item--active .sidebar__item-icon`/
  `.sidebar__group--active .sidebar__item-icon` — ya no hacían falta.

- **App Layout (2026-09-10)** —
  `projects/comsatel-ds/src/lib/app-layout/` (`AppLayout` + `AppLayoutState`,
  ambos exportados en `public-api.ts`) + página
  `/components/app-layout` (`src/app/pages/app-layout-demo/`). Componente
  NUEVO sin equivalente 1:1 en React (React no separa "shell del sitio" de
  "shell reusable de producto") — pedido explícito del usuario tras cerrar
  el fundamento Layout: el Shell interno del sitio
  (`src/app/layout/shell/`) sirve a ESTE sitio; `AppLayout` es la misma
  mecánica empaquetada para que cualquier producto la consuma sin conocer
  `nav.ts` de este repo.
  - **API**: `[hasPanel]`/`[showCollapseButton]` como `@Input()`; áreas vía
    `<ng-content select="[topnav]">`/`[sidenav]`/`[panel]`, `main` es el
    `<ng-content>` por defecto. `AppLayoutState` (`providedIn: 'root'`)
    expone `mode()` (`'expanded'|'rail'`), `collapsed()`,
    `toggleCollapsed()` — cualquier componente de la app puede inyectarla,
    incluido el propio contenido proyectado del consumidor.
  - **Decisión de diseño real, no trivial:** `AppLayoutState` es
    `providedIn: 'root'` a propósito, NO un provider a nivel del propio
    componente — el contenido proyectado vía `<ng-content>` resuelve su
    inyección contra el árbol donde se DECLARÓ (el template del
    consumidor), no donde Angular lo renderiza dentro de `AppLayout`; un
    provider de componente sería invisible para el nav del consumidor. Un
    singleton root es correcto acá porque un producto monta un solo
    `AppLayout` en la raíz de su app, igual que este sitio monta un solo
    Shell.
  - **Qué NO resuelve, a propósito:** no conoce datos de navegación ni
    íconos de ningún producto — el `[sidenav]` proyectado es responsabilidad
    del consumidor, incluido decidir cómo se ve en modo rail (ocultar
    labels, etc.), inyectando `AppLayoutState` igual que hace la demo.
    Tampoco tiene modo Drawer/mobile: decisión explícita del usuario
    (2026-09-10) — la app mobile va a ser un producto aparte con estructura
    propia, todavía sin definir; no construir esa pieza hasta que exista
    esa definición.
  - **Verificado con interacción real:** toggle de colapsar/expandir vía
    click real dentro del demo, confirmado `data-mode`, ancho del sidenav
    (`240px`→`64px`) y que el label del nav de ejemplo desaparece al leer
    `AppLayoutState.mode()` — sin errores de consola. La auditoría posterior
    confirmó en el árbol de accesibilidad el landmark de navegación, los
    nombres de los ítems en rail y el estado expandido/colapsado de los
    grupos. El drawer del Shell conserva el foco, cierra con Escape y restaura
    el foco al botón que lo abrió.
  - **Reconstrucción cerrada:** `app-layout.html/css`, `shell.ts/html/css`,
    `app-layout-page.html/css`, `app-layout.stories.ts` y la página temporal
    de seguimiento. Las transiciones respetan `prefers-reduced-motion`; no se
    agregó modo Drawer al componente reusable porque la decisión vigente lo
    reserva para el producto mobile separado.

- **Skeleton (2026-09-10)** — `projects/comsatel-ds/src/lib/skeleton/`. Primitivo
  interno de carga (shimmer en loop), sin página de documentación propia —
  React tampoco le da una (no aparece en su `nav.ts`), es un primitivo que
  otros componentes consumen (prerequisito real de Table). Duración del
  shimmer (1.6s) declarada explícita con comentario — no coincide con ningún
  `--motion-duration-*` de la escala (100-350ms, pensada para transiciones
  puntuales de UI, no para un loop ambiente) y no correspondía forzarla
  (B1).
- **Accordion (2026-09-10)** — `projects/comsatel-ds/src/lib/accordion/`
  (`Accordion` + `AccordionItem`) + página `/components/accordion`. API
  compuesta (`<cs-accordion><cs-accordion-item id="x"><div header>...</div>
  ...contenido...</cs-accordion-item></cs-accordion>`), NO el `items: []`
  de React — Angular no tiene un equivalente directo a pasar JSX dentro de
  un array de datos, y un compound component es el patrón idiomático acá
  (mismo criterio que Angular Material `mat-accordion`/`mat-expansion-panel`).
  **Decisión de arquitectura real:** el padre coordina la exclusión mutua
  (`type="single"`) vía `@ContentChildren(AccordionItem)` + suscripción
  manual a un `@Output() toggled` de cada hijo — NO vía `inject(Accordion)`
  desde el hijo, porque un `<cs-accordion-item>` está declarado en el
  template del CONSUMIDOR (contenido proyectado), y la resolución de DI de
  Angular para eso es terreno ambiguo; `@ContentChildren`/`QueryList`
  siempre funciona sin importar esa ambigüedad. Mismo patrón para Radio
  (ver abajo) — **cualquier componente compuesto nuevo (Tab, etc.) debe
  seguir este mismo mecanismo, no reabrir la pregunta de DI cada vez.**
  Animación de expandir/colapsar con **GSAP animando a `height: 'auto'`**
  (`accordion-item.ts`) — primer caso real donde CSS puro genuinamente no
  alcanza (no se puede transicionar a `height: auto` con CSS), justo el
  caso que motivó aceptar GSAP como motor (ver sección "GSAP" arriba). El
  chevron sí es CSS puro (`transform: rotate` + `transition`) — GSAP solo
  donde CSS no resuelve. **Auditoría individual cerrada (2026-09-10):**
  encabezado y panel enlazados con `aria-controls`/`aria-labelledby`, panel
  con `role="region"` y `aria-hidden` sincronizado, foco visible por tokens,
  estado disabled nativo y exclusión `single` verificada con interacción real;
  Storybook documenta Default/Multiple/DisabledItem. **Revisión de estados
  (2026-09-11):** las etiquetas de telemetría reutilizan `cs-badge` con
  íconos curados más texto (`activity`/Activo, `circle-pause`/Detenido y
  `wifi-off`/Sin señal); el contenido se centra mediante el wrapper propio
  de Badge, sin dibujar una variante local. La página sustituyó sus SVG
  inline de lineamientos por `cs-icon`, y completó los pares
  `font-size`/`line-height` de la demo. **Reconstrucción de geometría y
  teclado (2026-09-11):** el componente conserva ancho fluido para consumo,
  mientras la documentación limita únicamente la muestra de flota a 40rem
  para una lectura proporcionada; los ids ARIA de cada instancia son únicos,
  los paneles cerrados quedan `inert` y Flecha arriba/abajo, Inicio y Fin
  recorren encabezados habilitados.
- **Radio (2026-09-10)** —
  `projects/comsatel-ds/src/lib/radio/` (`Radio` + `RadioGroup`) + página
  `/components/radio`. Mismo mecanismo de coordinación padre-hijo que
  Accordion (`@ContentChildren`, nunca DI). Accesibilidad vía
  `<input type="radio">` nativo oculto compartiendo `name` (mismo criterio
  que Checkbox: el navegador da teclado/arrow-keys/roving-tabindex gratis,
  sin reimplementar ARIA a mano) — `RadioGroup` reparte el `name` generado
  y el `checked`/`disabled` efectivo a cada `Radio` hijo.
  **Extracción real (ya anotada como pendiente en la sesión anterior):** el
  glyph de anillo/punto que antes vivía SOLO dentro de `dropdown-item.ts`
  (para `selectionMode="radio"`) se movió a `shared/selection-glyphs.css`
  (clases renombradas de `cs-dropdown-item__radio-*` a `cs-radio-*`, genéricas)
  y la fórmula `radioDotSize` a `shared/radio-glyph.ts` — `dropdown-item.ts`
  ahora importa la función en vez de tener su propia copia. Sin esto, Radio
  y el glyph de Dropdown podían divergir con el tiempo (exactamente el
  problema que ya había en React antes de compartir el código real, ver
  comentario original en `radio.tsx`).
  **Simplificación real respecto a React:** no existe un `options: []`
  declarativo — mismo criterio que Accordion, el consumidor arma el `@for`
  en su propio template en vez de pasar un array de datos; también se
  quitó la propagación automática de `size` de grupo a hijos (React la
  tiene vía `options`, acá cada `<cs-radio>` declara su propio `size`) para
  no dejar un prop de grupo que no hiciera nada real en la API compuesta.

- **Tab (2026-09-10)** — `projects/comsatel-ds/src/lib/tab/` (`Tabs` +
  `Tab`) + página `/components/tab`. **Única excepción real al mecanismo
  `@ContentChildren` de Accordion/Radio**: acá se usó `contentChildren()`
  (la query basada en signals, no `@ContentChildren`/`QueryList`) porque el
  PROPIO template de `Tabs` necesita re-renderizar la fila de botones a
  partir de la lista de tabs — en Accordion/Radio el padre nunca dibuja
  nada a partir de la lista en su propio template, solo setea signals en
  cada hijo (que se re-renderiza solo). Cuando el padre sí necesita iterar
  la lista en su propio template de forma reactiva en esta app zoneless,
  la query tiene que ser un signal de verdad — `QueryList` no alcanza ahí.
  Variantes `line`/`pill`, CSS puro (sin GSAP, no hacía falta).
- **Pagination (2026-09-10)** — `projects/comsatel-ds/src/lib/pagination/`.
  Completamente controlado (`page`/`totalPages` los posee el padre, sin
  estado interno) — puerto directo, incluida `buildPageTokens()` (algoritmo
  de truncado con elipsis) exportada tal cual. Variantes `numbered`/`simple`.
- **Toast (2026-09-10)** — `projects/comsatel-ds/src/lib/toast/`. Puramente
  visual, sin cola ni auto-cierre — confirmado que ni la propia página de
  documentación de React arma una cola real (cada demo es estático), así
  que no hay ninguna referencia real que portar para eso; encolar/apilar/
  auto-cerrar por temporizador queda 100% del lado del consumidor (ver
  accessibility-patterns.md sección 8). Variantes con tono
  (info/success/warning/error) nunca muestran botón de cerrar — decisión
  real de React que se preserva: exigen una acción directa, no permiten
  descartar sin leer.

- **Popover (2026-09-10)** — `projects/comsatel-ds/src/lib/popover/`
  (`Popover` + `computePopoverPosition` exportada aparte, función pura sin
  dependencias de Angular). Primitivo genérico de posicionamiento flotante
  — base real para Select/Spotlight/Menu. Reutiliza los patrones ya
  documentados de Modal (portal a `document.body` vía `Renderer2`, cierre
  con Escape/clic afuera, animación de entrada/salida con dos signals) —
  lo único nuevo es el algoritmo de posición: mide el panel real
  (`offsetWidth/offsetHeight`, nunca una estimación fija) y voltea al lado
  opuesto cuando no entra en el eje principal, se recalcula en
  resize/scroll mientras está abierto. 12 placements (4 lados ×
  start/center/end), `matchTriggerWidth`, `offset` configurable.
  **Verificado con interacción real:** abre/cierra con clic y Escape,
  placement "top" confirmado abriendo arriba del trigger
  (`getBoundingClientRect()` del panel vs. del trigger), `matchTriggerWidth`
  confirmado con `getComputedStyle` (280px exacto) — sin errores de consola.
  **Actualización 2026-09-17:** cuando el trigger pertenece a un modal, el
  portal ya no conserva su contexto de apilamiento. `Popover` detecta ese
  caso y usa la capa semántica `overlay` (400) en vez de `dropdown` (100),
  para que los listbox de Select e InputDropdown permanezcan interactivos
  sobre la máscara modal; fuera de un modal conserva la capa dropdown.

- **Select (2026-09-10)** — `projects/comsatel-ds/src/lib/select/`.
  **Hallazgo real antes de construir:** el archivo `select.tsx` suelto en
  React (Base UI Select, sin border, pensado para addons) NO es lo que la
  página `/components/select` documenta — es código huérfano, ningún
  import real lo usa. La página real importa `InputSelect` desde
  `dropdown.tsx` (selección simple/múltiple con chips) — se portó ESE,
  verificado leyendo qué importa `SelectPageContent.tsx` antes de asumir
   que el archivo con el nombre obvio era el correcto. Reconstruido el
   2026-09-11: reutiliza `Popover` como primitivo real de portal y
   posicionamiento para que el listbox no quede recortado por una tarjeta o
   el cuerpo desplazable de una modal; conserva `INPUT_TOKENS` y `Badge`
   para los chips en modo `multiple`. El valor simple y múltiple se guardan
   por separado en el playground, y el estado múltiple de la documentación
   es interactivo. En modo múltiple, cada chip conserva su acción accesible
   de quitar; el limpiado total solo se ofrece para selección simple. Incluye
   navegación con flechas/Home/End/Escape, etiqueta asociada y Storybook.

- **Spotlight (2026-09-10)** — `projects/comsatel-ds/src/lib/spotlight/`.
  Mucho más simple de lo esperado por el nombre: no es un command palette,
  es un resaltado de onboarding (halo + callout junto a un elemento real,
  proyectado vía `<ng-content>`). Sin portal, sin blanket, sin focus-trap
  a propósito — la persona puede seguir usando el resto de la página. CSS
  puro (`position: absolute` dentro de un `:host` `position: relative`),
  sin GSAP ni Popover: no lo necesitaba. Reconstrucción individual cerrada
  el 2026-09-11: el diálogo no modal vincula titular y descripción con ARIA,
  anuncia en modo cortés y, si es descartable, responde a Escape; las
  recorrido usa una columna de objetivos con el callout activo a la derecha
  y permite que salga del bloque sin recorte; las posiciones se muestran en
  filas con título, contexto y separadores a todo el ancho; los lineamientos
  tienen ejemplos vivos compactos y sin recorte. Storybook cubre el caso
  base, recorrido, cierre y posición lateral.
- **DateTimeRangePicker (2026-09-10)** —
  `projects/comsatel-ds/src/lib/datetime-range-picker/`. Compone
  `cs-calendar` (selección de rango por dos clics, mismo patrón que su
  propia demo de rango) + dos `cs-input-dropdown` para una ventana horaria
  ÚNICA que aplica a todo el rango de fechas (no dos datetimes
  independientes). `generateTimeOptions`/`formatRangeDisplay` DUPLICADOS a
  propósito en su propio archivo de helpers en vez de importados de
  `datetime-picker-helpers.ts` — mismo criterio que React: mantener este
  componente sin depender del de un solo datetime evita que un cambio ahí
  rompa silenciosamente el caso de rango.

- **Menu (2026-09-10)** —
  `projects/comsatel-ds/src/lib/menu/` (`Menu` + tipos `MenuGroupData`/
  `MenuItemData`/`MenuMode`). Generalización real de la lógica que YA
  existía ad-hoc en el Shell del sitio (rail con flyout, `csPressScale`,
  grupos expandibles) — no una implementación paralela, Shell resultó ser
  un consumidor temprano no-reusable del mismo patrón. Requiere
  `@angular/router` como peer dependency nueva (agregada a
  `package.json`) porque usa `routerLink` para los ítems.
  **Corrección real sobre `accessibility-patterns.md` sección 7:** esa
  sección anticipaba navegación por teclado con flechas/Home/End/
  type-ahead para cuando se construyera Menu — al leer la referencia real
  (`menu.tsx`) se confirmó que React NUNCA lo implementó, la navegación es
  el orden de Tab nativo de los `<a>` reales. Se portó fiel a lo que
  existe (no lo que la sección 7 anticipaba); el outline queda como
  referencia si el usuario pide esa navegación explícita más adelante.
  Mismo gotcha de zoneless ya documentado: `hoveredItem`/`flyoutPos` son
  `signal()` porque `scheduleHide()` los muta dentro de un `setTimeout`.

- **Table (2026-09-10)** — `projects/comsatel-ds/src/lib/table/`
  (`Table` + tipos). Completamente controlado — igual que Pagination, nunca
  ordena `rows` por su cuenta, solo emite `(sort)`. Usa `cs-skeleton`
  (prerequisito ya construido) para el estado de carga inicial, y un
  overlay de opacidad+spinner para refetch (datos ya visibles, no
  reemplazarlos por skeleton — pierde la posición de scroll de quien mira).
  **Decisión de diseño real, no en React:** React tipa `cells:
  React.ReactNode[]` (JSX arbitrario); Angular no tiene equivalente
  directo, así que `TableCellValue` es `string | { template: TemplateRef,
  context? }` — el consumidor define un `<ng-template #cell let-x>` UNA
  vez (ej. el badge de estado) y pasa `{ template, context: { $implicit:
  valorDeEstaFila } }` por cada fila, vía `[ngTemplateOutletContext]`. Caso
  real confirmado en la referencia (no una posibilidad teórica): la
  columna de estado de la demo real de React usa un `Badge`, no texto.

- **Table tree (2026-09-10)** —
  `projects/comsatel-ds/src/lib/table-tree/`. Última pieza de la lista
  original de componentes faltantes. **Decisión real de arquitectura:**
  las filas recursivas se resuelven con UN `<ng-template #rowTpl>` que se
  referencia a sí mismo vía `*ngTemplateOutlet` (pasando `depth + 1` en
  cada nivel) — NO un sub-componente por fila, que hubiera metido un
  elemento custom entre `<tbody>`/`<tr>` y roto la estructura real de
  tabla. Mismo tipo de celda que Table (texto o `{ template, context }`).
  Soporta carga perezosa real: `TableTreeItem.children === undefined`
  dibuja una fila skeleton al expandir (vs. `children: []`, que significa
  "cargado, sin hijos") — verificado en la demo con un timeout simulando
  la resolución real.
- **Motion (2026-09-10)** — `projects/comsatel-ds/src/lib/motion/motion.ts`.
  Primitivo de animación de entrada/salida genérico (`show`, `preset`:
  fade/scale/slide-up/down/left/right, duración/easing por token) —
  equivalente a `<Motion>` en React (que envuelve Framer Motion), acá
  motorizado con GSAP como el resto de la animación de este proyecto.
  **Diferencia real de plataforma, documentada en el propio código:**
  React desmonta el contenido recién después de la salida animada gracias a
  `AnimatePresence`; en Angular el contenido proyectado por `<ng-content>`
  ya existe como vista del consumidor en cuanto `<cs-motion>` se instancia
  (Angular no puede diferir la creación de contenido proyectado desde
  adentro del hijo) — la señal `rendered` solo controla si esa vista está
  insertada en el DOM vía `@if`, mismo patrón dual-signal que ya usan
  Modal/Toast/Popover. El efecto visual final es idéntico: nada queda
  visible ni interactuable después de la salida. Sigue el mismo patrón de
  `ngOnChanges` + `setTimeout` de Modal para esperar a que `@ViewChild`
  resuelva el wrapper recién insertado antes de animarlo. `eases.ts` ganó
  `EASE_ENTER`/`EASE_EXIT`/`EASE_SPRING` (antes solo tenía `EASE_DEFAULT`,
  usado por `PressScale`) — los 4 `CustomEase` de GSAP que corresponden a
  los 4 `--motion-easing-*` de `tokens.css`.

  **Con esto se completó la lista original de componentes pendientes**
  (Popover, Radio, Select, Spotlight, Stepper, Tab, Table, Table tree,
  Toast, Accordion, DateTimeRangePicker, Pagination, Menu). Siguieron, ya cerradas: la auditoría
  completa de tokens/tamaños (ver "cuarta ronda" arriba, C13) y las
  secciones Mapa/Marcadores + Animaciones (ver "quinta ronda" arriba).

## Fundamentos — alineados al estándar de página Angular

- Tokens (`/foundations/tokens`)
- Color (overview, palette, semantic — Themes queda pendiente, tiene
  referencias a Glass desactualizadas incluso en React)
- Tipografía (`/foundations/typography` y `/typography/tokens`)
- Espaciado (`/foundations/spacing` y `/spacing/tokens`)
- Radios
- Íconos — catálogo completo de 1531 vía fetch a `/icons/lucide/catalog.json`
  (copiado de React), distinto del registro curado interno (ver
  `token-architecture.md`)
- Efectos
- **Layout (2026-09-10)** — `/foundations/layout`
  (`src/app/pages/layout/`). No fue solo documentar: portar esta página
  desde `LayoutPageContent.tsx` reveló que el Shell real de Angular
  (`src/app/layout/shell/`) todavía no implementaba lo que la página
  describe — sidebar de un solo modo (224px fijo, sin token), sin rail, sin
  drawer mobile, sin ningún token de breakpoint/layout-chrome en
  `tokens.css`. Se reconstruyó el Shell completo para que la página deje de
  documentar una aspiración y pase a documentar el comportamiento real:
  - **Tokens nuevos** en `tokens.css`: `--breakpoint-sm/md/lg/xl/2xl`
    (640/768/1024/1280/1536, mismos valores que React — mismo criterio que
    los tokens de motion: nombre y valor son la decisión real del sistema,
    no un valor copiado de React sin pasar por acá) y
    `--layout-topnav-height` (56px), `--layout-sidenav-width-expanded`
    (240px, antes 224px sin token), `--layout-sidenav-width-collapsed`
    (64px), `--layout-panel-width` (192px). Ojo: este `--layout-` es un
    prefijo distinto del `--layout-padding/gap/radius/size` de la escala
    primitiva — ambos coexisten a propósito, mismo criterio que React.
  - **`SidenavState`** (`src/app/lib/sidenav-state.ts`) — servicio
    `providedIn: 'root'` con signals (`mode`: `expanded`/`rail`/`drawer`,
    `mobileOpen`), persistencia de la preferencia del usuario en
    `localStorage`. Simplificación real respecto a React: `sidenav.ts` en
    React necesita un hack de `CustomEvent`+`window` porque TopNav y
    Sidebar son dos islas de Astro que no comparten árbol; acá Shell es un
    único árbol de componentes Angular, así que un servicio singleton con
    signals ya se comparte solo — no hace falta el evento de window.
  - **Shell reconstruido** (`shell.ts`/`.html`/`.css`) — host binding
    `[attr.data-sidenav-mode]`/`[attr.data-mobile-open]` maneja los 3 modos
    vía selectores `:host([data-sidenav-mode='rail'])` etc. Rail: solo
    íconos, flyout al hover/foco con label + hijos (mismo patrón que
    `RailItem` en `menu.tsx` de React, sin portar código, ver
    `onRailEnter`/`scheduleHide`/`cancelHide` en `shell.ts`). Drawer: fuera
    de pantalla por defecto (`transform: translateX(-100%)`), entra como
    overlay con backdrop, botón de menú en el topnav (solo existe en modo
    drawer). Botón de colapsar/expandir al pie del sidebar (ausente en
    drawer). `TableOfContents` (`table-of-contents.css`) se tokenizó
    también: `192px`→`var(--layout-panel-width)`,
    `56px`→`var(--layout-topnav-height)`.
  - **Verificado con interacción real** en los 3 viewports
    (`resize_window`: desktop/900px-tablet/mobile): rail muestra
    solo-íconos + flyout funcional con hijos y estado pending correcto;
    drawer abre/cierra con el botón y con clic en el backdrop
    (`data-mobile-open` + `getComputedStyle().transform` confirmados antes
    y después); sin errores de consola en ningún tamaño.
  - **Pendiente, explícitamente fuera de esta pasada:** un `AppLayout`
    reusable y exportado desde `comsatel-ds` para que un PRODUCTO real (no
    el propio sitio del design system) lo consuma. Decisión del usuario
    (2026-09-10): "al final ejecutarás ambos, solo uno primero y después el
    otro" — el Shell del sitio se resolvió primero; el componente
    reusable de producto es la siguiente tarea, no una decisión abierta.

## Mapa y Animaciones — páginas de documentación (2026-09-10)

- **`/animations/tokens`** — muestra los 5 `--motion-duration-*` y 4
  `--motion-easing-*` que ya existían en `tokens.css` sin cambios; cada fila
  es un bloque local (`DurationRow`/`EasingRow`, no exportados desde
  `comsatel-ds`) que anima con GSAP al hacer clic en "Repetir".
- **`/animations/motion`** — Playground + galería de los 6 presets +
  lineamientos + tabla de props del componente `Motion` (ver su entrada en
  "Componentes de librería").
- **`/map/theme`** — documenta por qué el tema del mapa es independiente
  del tema de la app (los tiles son imágenes de un proveedor externo, no
  hay token que los repinte), los dos proveedores reales (CartoDB
  Voyager/Stadia Alidade Smooth Dark, ambos hoy sin API key configurada en
  C-Locater — mismo hallazgo que documenta React, no es un problema nuevo
  de Angular) y los colores de categoría GPS. **Nuevos tokens en
  `tokens.css`** (bloque "Map", una copia por tema claro/oscuro, igual que
  "Status indicators"): `--color-map-gps-flotas/basico/contingencia/svr-x`
  (alias de `--color-accent-blue/teal/purple/orange`),
  `--color-map-status-reporting/no-signal/low-signal/disconnected` (alias
  de `--color-status-online/busy/warning/offline`),
  `--color-map-vehicle-active/stopped/offline` (alias de
  `--color-status-online/busy/offline`, sin el tier de warning — así lo
  documenta React también), `--color-map-alarm` (alias de
  `--color-background-danger-default`). **Token nuevo real, no solo un
  alias de Mapa:** `--color-status-warning`, agregado al bloque "Status
  indicators" existente (antes solo tenía online/busy/offline) — se ató a
  `--color-background-warning-default`, que ya existía en `tokens.css` con
  el mismo valor que React documenta para ese tier (coincidencia de
  arquitectura de tokens, no un valor copiado — ver B2).
  **`LiveMapPreview`** (`src/app/pages/map-theme-demo/live-map-preview.ts`)
  es un componente Angular local a esta página (no exportado desde
  `comsatel-ds`, igual que en React) que usa el paquete `leaflet` (core,
  API vanilla) directo — ver el racionamiento de por qué esta librería en
  la entrada de "quinta ronda" al inicio del archivo.
- **`/map/markers`** — documentación pura de los mockups de marcador
  (`VehiclePill`, `GpsCompact`, `GpsFull`, `ClusterBadge`, todos locales a
  `src/app/pages/markers-demo/`, no exportados desde `comsatel-ds`): Leaflet
  pinta los pines reales con `divIcon`/HTML plano en C-Locater, fuera de
  este repo, igual que documenta React. **Excepciones B1 explícitas**
  (valores que no coinciden con ningún paso de la escala tipográfica):
  `.cluster-badge__count--unit` a 17px y `.cluster-badge__unit` a 7px — ni
  10 (2xs) ni ningún otro primitivo calza. El resto de la tipografía de
  estos mockups sí sale de tokens reales (`--font-size-label-small/micro` +
  su `line-height` correspondiente, sin repetir el bug C13).

## Pendientes — pedidos ahora, siguientes en construirse

Ninguno. La lista completa pedida por el usuario el 2026-09-10 (componentes
faltantes → auditoría de tokens/tamaños → Mapa/Marcadores + Animaciones)
está cerrada — ver la entrada "quinta ronda" al inicio del archivo. El
siguiente trabajo sobre este proyecto parte de un pedido nuevo del usuario,
no de este backlog.

## Sin tocar todavía — ni auditados ni construidos en Angular

Todos los componentes que React tiene listos para portar ya se portaron:
Popover, Select, Spotlight, DateTimeRangePicker, Menu, Table, Table tree,
Skeleton, Accordion, Radio, Tab, Pagination, Toast, Modal — ver cada uno en
"Componentes de librería" arriba. Si el próximo pedido es un componente
nuevo, revisar primero si React ya lo resolvió (mismo criterio de siempre:
estructura/comportamiento de React, valores de acá) y, si coordina hijos
compuestos, seguir el mecanismo `@ContentChildren` ya establecido en
Accordion/Radio — no `inject()` del padre desde el hijo.

**Corrección real (2026-09-10):** Header y List item NO están listos para
portar — se revisó `nav.ts` de React directo y ambos están marcados
`pending: true` ahí también (dead links, React nunca los construyó). Van al
mismo grupo que Logos/Grids abajo: no construir sin que el usuario lo pida
explícitamente con un diseño propio, porque acá no hay ninguna referencia
real que portar.

**No existen ni en React** (dead links en su propio `nav.ts`, no construir
sin que el usuario lo pida explícitamente): Logos, Grids, Header y List item.
`Tag` y `Progress indicator` fueron solicitados explícitamente y ahora quedan
construidos en Angular como componentes nuevos, con sus decisiones de diseño
registradas arriba; no se presentan como ports directos desde React.

## Referencia funcional de React para próximos componentes

Notas de comportamiento y API de los componentes React equivalentes — **son
referencia de ESTRUCTURA y comportamiento, nunca de valores de token** (ver
GUARD en `SKILL.md`). Al portar, releer el `.tsx` real de
`Sistema-de-dise-o-Comsatel` para el detalle exacto; esto es un resumen para
no perder las decisiones ya validadas con el usuario en ese proyecto. El
patrón `InputGroup` que Radio puede llegar a reutilizar
(foco/inválido/disabled vía `:has()`) ya está construido en Angular — ver
la entrada de Input arriba; Calendar, DateTimePicker y Card también ya
están construidos (ver "Componentes de librería" arriba), sus notas de
referencia funcional se retiraron de acá porque ya no aplican como
pendientes.

**Radio (referencia funcional histórica)** — `Radio` individual + `RadioGroup` con `options` (declarativo) o
`children` (layout avanzado,
ej. radios en una tabla). Trae `label`/`required`/`helperText`/`errorText`/
`invalid` nativos, mismo patrón que Input/DateTimePicker. Angular ya cerró
esta implementación en `projects/comsatel-ds/src/lib/radio/`; esta nota
conserva la estructura de React para futuras comprobaciones de paridad, pero
las decisiones de tokens, ARIA y composición válidas son las de la fila
Radio + RadioGroup del registro de auditorías.

## Decisiones de diseño ya tomadas (no reabrir sin que el usuario lo pida)

- **Sin tema "Glass" (2026-09-14).** Solo existen dos temas: Light y Dark.
  El usuario lo cerró explícito: "glass no va con nuestro sistema de
  diseño, solo vamos a manejar dark y claro" — las menciones a Glass que
  traía la referencia React (y que bloqueaban `/foundations/color/themes`)
  quedaron desactualizadas a propósito, no hace falta portarlas. Con esto
  se construyó la página `color-themes` (`src/app/pages/color-themes/`):
  documenta el mecanismo real `[data-theme="light"/"dark"]` de
  `tokens.css`, aclara que el SITIO no tiene un toggle global (cada página
  de componente trae su propio Canvas vía `demo-shell.html`,
  `[attr.data-theme]="mode()"`) y que persistir el tema en una app real
  consumidora es responsabilidad de esa app, mismo criterio que
  `SidenavState`.


- Tipografía: Manrope para heading, Public Sans para content — **ya no es
  divergencia, es la decisión compartida por ambas plataformas.** Public
  Sans nació como excepción solo de Angular (2026-09-06); el usuario
  revirtió esa separación el 2026-09-07 y llevó Public Sans también al
  sistema React (`typography.mjs`, `globals.css`, `translations/
  typography.ts`), para que Angular y React usen exactamente la misma
  tipografía. Ver `token-architecture.md`.
- **Color de marca (brand): azul marino `#1B4079`, no el índigo `#6172F3`
  del sistema React de referencia** — divergencia intencional decidida por
  el usuario (2026-09-07), NO viene de Figma/React, es una excepción real
  al mismo nivel que la tipografía de arriba. Toda la familia `brand`
  (`--color-background/text/border-brand-*`, `--color-text-link-*`,
  `--color-border-selected`, `--color-border-focused`, `--color-icon-selected`,
  `--color-background-selected`) se regeneró en `tokens.css` a partir de
  ese ancla, para AMBOS temas, preservando la misma arquitectura posicional
  de 9-11 pasos que ya tenía el sistema (cada token sigue apuntando a la
  misma "posición" relativa que antes, solo cambió la familia de color de
  fondo). El light theme usa el ancla `#1B4079` tal cual en `-default`; el
  dark theme usa una sub-escala MÁS CLARA (`#4981d7` en adelante) para
  `-default/-bolder/-boldest/-strongest` — el ancla es demasiado oscura
  para servir de fondo sólido con `--color-text-inverse` encima en dark.

  **Dos rondas de corrección real, no una:**
  1. Primer intento: reusó las mismas posiciones que React 1:1 en dark, y
     el botón primary quedó casi ilegible (texto oscuro sobre fondo azul
     oscuro) — cualquier cambio de color de marca a un tono más oscuro que
     el original necesita revisar el theme oscuro aparte, no basta con
     mapear posiciones.
  2. Segundo intento (a ojo, comparando luminosidad HSL "L%" entre pasos):
     se VEÍA legible y aun así 3 pares no cumplían WCAG AA real al
     calcularlos con la fórmula de contraste (luminancia relativa, no HSL
     L%) — `text-brand-subtle` en light (2.99:1), y el fondo del botón
     primary + el texto de link en dark (3.14:1 y 3.41:1), los tres contra
     el mínimo de 4.5:1 para texto. La luminosidad HSL NO es un proxy
     confiable del contraste WCAG — hay que calcular la luminancia relativa
     real (`references/token-architecture.md` tiene la fórmula y un script
     de verificación) cada vez que se toca un color, no alcanza con que "se
     vea bien". Valores finales, todos verificados ≥4.5:1 (texto) / ≥3:1
     (UI): light `text-brand-subtle` → `#3474d8`; dark `default/bolder/
     boldest/strongest` → `#4981d7/#79a1e0/#a4c0ec/#cbdcf6`; dark `text-
     brand-default`/`text-link-default`/`border-selected`/`border-brand-
     default`/`icon-selected` → `#3f7ad5`.

  Verificado visualmente (no por `getComputedStyle`, que en este Browser
  pane reportó el token viejo pese a que el CSS real sí cambió — mismo
  síntoma ya documentado en `environment-issues.md` punto 6) Y por cálculo
  real de contraste (script Node, fórmula WCAG 2.1).
- Escala de tamaños de fuente (10px a 48px): no reducir el rango global — el
  ajuste es de USO (elegir el nivel correcto por componente), no de escala.
- El registro curado de íconos (`icon-registry.ts`) es la fuente obligatoria
  para uso interno de componentes — el catálogo completo de 1531 es solo
  para la página de exploración, nunca se mezclan.
- Todo `<select>` de Playground es `cs-input-dropdown`, nunca nativo.
- Sin i18n en Angular — Spanish-only directo en el template, a propósito
  (simplificación intencional respecto a React, que sí es bilingüe).
- Logos, Grids y List item no se construyen sin una solicitud explícita:
  siguen siendo dead links en React. Header fue solicitado y reconstruido
  como patrón compuesto configurable. `Tag` y `Progress indicator`
  ya no pertenecen a esta excepción porque fueron solicitados y reconstruidos
  como extensiones controladas del sistema.
- **Storybook (`.stories.ts`) nunca estrena un patrón nuevo** — se escribe
  o actualiza SOLO después de que ese patrón ya está construido y
  verificado en `src/app/pages/*-demo/` (o en React si Angular no lo tiene
  aún). Ver B11 en `SKILL.md` y `references/storybook-pattern.md`. Todos
  los componentes de librería ya tienen su `.stories.ts` (2026-09-07) —
  cualquier patrón NUEVO en un componente existente necesita construirse
  primero en su página `*-demo`, y recién después reflejarse en el story.

## Registro de auditorías y mejoras verificadas

Cada fila requiere evidencia concreta; no se infiere una auditoría individual
solo porque exista una ronda global histórica.

| Componente | Alcance cerrado | Verificación ejecutada | Estado |
|---|---|---|---|
| Button | C1: bordes y anillo de foco atados a tokens; paridad de lineamientos; `aria-label` para botón solo-ícono y nombre de respaldo durante loading; documentación de semántica, teclado y estados. El contenido proyectado conserva su espacio durante `loading`, mientras el spinner se centra sobre él, evitando cambios de ancho. | Build de librería, app local con árbol de accesibilidad + Tab, build de Storybook; rutas Button, Badge y Avatar con sección de accesibilidad. Cambio de carga pendiente de validación visual solicitada por el usuario. | Pendiente de validación — 2026-09-18 |
| Badge | C1: borde base atado a `--layout-border-thin`; paridad de variantes, tamaños, íconos y lineamientos de uso; documentación de etiqueta informativa, significado textual e interacción. | Build de librería y rutas Button, Badge y Avatar con sección de accesibilidad. | Cerrado — 2026-09-10 |
| Tag | C1-C3/C13: severidades, escala y line-height se delegan a `cs-badge`; C7-C8: ícono del registro curado y composición del primitivo Badge sin CSS visual duplicado; C9: no interactivo, sin foco por defecto; C12: el texto permanece visible junto al color; B15.2: lineamientos en dos columnas. API con `value`, `severity`, `size`, `rounded`, `icon`, `aria-label` y `aria-live`. | Build de librería y app, reinicio del servidor, ruta `/components/tag`, árbol de accesibilidad, cambio real de severidad, switch de redondeado (`role=switch`, `aria-checked`), revisión visual de Playground/severidades/tamaños/íconos y consola sin errores. | Cerrado — 2026-09-10 |
| Progress indicator | C1-C3/C13: nodos, conectores y etiquetas usan tokens de layout y tipografía con line-height; C7-C8: ícono `check` del registro curado y composición autónoma; C9-C10: recorrido horizontal/vertical con líneas limitadas entre centros en horizontal y conectores visibles en vertical; C11-C12: estados `done`/`active`/`pending` se comunican con texto y `aria-current`; B15.2: lineamientos en dos columnas. API con `steps`, `orientation`, `interactive`, `ariaLabel` y `stepClick`; `interactive` convierte nodos en botones nombrados. | Build de librería y app, reinicio del servidor, ruta `/components/progress-indicator`, árbol de accesibilidad (`list`/`listitem`, `aria-current`), controles con etiquetas en español y valores técnicos internos, cambio real del switch `Interactivo`, click real de paso en Playground y sección interactiva, revisión visual horizontal/vertical, consola sin errores y build de Storybook con Default/Vertical/Interactive. | Cerrado — 2026-09-11 |
| Stepper | C1-C3/C13: dimensiones, conectores y textos usan tokens de layout y tipografía con line-height; C7: `check` procede del registro curado; C9-C10: los conectores horizontales llegan exactamente al centro de los nodos y la variante vertical los conserva; C11: punto interior par dentro del nodo de 20 px; C12: estado se comunica por texto, marca/punto y `aria-current`; B15.2: lineamientos en dos columnas. La referencia funcional de PrimeNG confirma que los paneles pertenecen a un wizard; se excluyen deliberadamente porque Stepper es un estado de progreso. API con `steps`, `orientation`, `interactive`, `ariaLabel` y `stepClick`. | `npm run build`, reinicio de servidor y ruta `/components/stepper`; árbol de accesibilidad con `list`/`listitem` y botones nombrados en modo interactivo; selección real de orientación vertical, click de «En tránsito» que actualiza el estado y la región `status`; revisión visual clara y oscura, horizontal/vertical, conectores y lineamientos; build de Storybook con Default/Vertical/Interactive. | Cerrado — 2026-09-11 |
| Accordion | C1-C3/C13: superficie, separación y contenido con tokens y line-height; C4: coordinación reactiva por `@ContentChildren` y signals; C7-C8: `cs-icon` curado y `cs-badge` compartido para estados Activo/Detenido/Sin señal; C9-C10: panel expandido/colapsado con animación de altura y chevron; C11-C12: foco, disabled y estados conservan semántica. Encabezado/panel enlazados con ids únicos mediante `aria-controls`/`aria-labelledby`; región con `aria-hidden` e `inert`, navegación single/multiple y flechas/Inicio/Fin entre encabezados habilitados. La documentación limita solo el ejemplo de flota a un ancho de lectura y conserva lineamientos en pares. | Build de librería y app, reinicio del servidor, ruta `/components/accordion`, árbol ARIA con IDs y regiones, click real del segundo ítem que cierra el primero en `single`, Flecha abajo y Espacio sobre el segundo encabezado, revisión visual de ancho y badges con ícono+texto centrados; build de Storybook con Default/Multiple/DisabledItem. | Cerrado — 2026-09-11 |
| Tabs | C1-C3/C13: variantes line/pill, geometría y tipografía con line-height; C4: estado activo con signals; C8: compound component `Tabs` + `Tab`; C9-C10: paneles sincronizados y IDs únicos por instancia; C11-C12: selección, disabled y foco conservan semántica. `role=tablist`, tabs y paneles enlazados con `aria-controls`/`aria-labelledby`, roving tabindex y navegación Arrow/Home/End. | Build de librería y app, reinicio del servidor, ruta `/components/tab`, árbol ARIA, click y navegación real con ArrowRight (Overview → Specs), foco restaurado en el tab activo, paneles asociados y consola sin errores; build de Storybook con Default/Pill/Disabled. | Cerrado — 2026-09-10 |
| Pagination | C1-C3/C13: tamaños, estados, botones y line-height con tokens; C7-C8: íconos curados y directiva compartida; C9-C10: truncado, saltos de límite y variantes numbered/simple; C11-C12: página activa, disabled y estado anunciado. Landmark `nav` con `navLabel`, `aria-current="page"`, nombres por acción y región `role=status`; lineamientos y accesibilidad en dos columnas. | Build de librería y app, reinicio del servidor, ruta `/components/pagination`, árbol ARIA, click real en Página 2 que actualiza `aria-current` y «Página 2 de 10», revisión visual de truncado/variantes, consola sin errores y build de Storybook con Numbered/Simple/LargeSet. | Cerrado — 2026-09-10 |
| Avatar | C1: diámetros y solapamientos atados a tokens; C3: escala tipográfica; C7: íconos curados; C10: grupo sin caja de línea extra ni recorte de iniciales; la variante de iniciales usa 6px para conservar densidad sin ocultar letras; indicador con borde fino en xs/sm y grueso desde md para conservar superficie visible; estado expuesto a lectores de pantalla; `alt` nombra foto, iniciales y placeholder; company usa un borde fino de 1px alrededor de `companyIconSrc` y el fallback adapta el ícono al área interior sin recorte; lineamientos en pares y documentación de accesibilidad. | Build de librería, ruta local `/components/avatar`, cambios reales de Playground, árbol de accesibilidad, mediciones de geometría y revisión visual. | Cerrado — 2026-09-10 |
| Checkbox | C1: anillo de foco atado a `--layout-border-thick` y excepciones de 10px/1px/1.5px justificadas; C2-C3: texto escala por tamaño y rol; C7-C8: glyph compartido; C9: input nativo, etiqueta o `aria-label`; C10: geometría de check y estado mixto revisada; C11: lineamientos en pares; C12: check y guion usan `--color-text-inverse`. | Build de librería, reinicio de app, ruta local `/components/checkbox`, revisión visual, interacción por clic/Espacio y conteo de 24/24 nombres accesibles. | Cerrado — 2026-09-10 |
| Toggle | C1: anillo de foco atado a `--layout-border-thick` y excepciones de 10px/1px justificadas; C2-C3: etiqueta y descripción escalan por tamaño; C6: sombra de thumb usa token; C10-C11: track/thumb centrados por paridad; C12: thumb usa `--color-text-inverse`; switch nativo, etiqueta o `aria-label` y lineamientos en pares. | Build de librería, reinicio de app, ruta local `/components/toggle`, revisión visual, interacción por clic/Espacio y conteo de 18/18 nombres accesibles. | Cerrado — 2026-09-10 |
| Tooltip | C1: separación y flecha atadas a tokens; excepción explícita de 400ms para el retardo de puntero y 20rem para límite de lectura; C2: `label/small`; C5-C6: z-index y sombra semánticos; C9: popup no recortado en DemoShell; accesibilidad con `aria-describedby`, foco inmediato, Escape y botones de ícono con nombre propio; lineamientos en pares y documentación. | Build de librería, reinicio de app, ruta local `/components/tooltip`, árbol de accesibilidad, relación ARIA, apertura por foco, Escape y revisión visual. | Cerrado — 2026-09-10 |
| Toast | C1: borde, espaciado y anillo de foco atados a tokens; la caja del ícono es flex con `line-height: 0`, evitando espacio basal y manteniendo simetría vertical en el Toast de solo título; C2-C3/C13: título y descripción conservan pares tipográficos completos; C4: resultados y visibilidad del Playground usan `signal()`; C7: íconos y encabezados de lineamientos usan el registro curado; C9-C10: acciones y cierre son controles nativos dentro de un toast de geometría estable; C11-C12: las variantes se comunican por título, ícono y color. El host anuncia con `role="status"`, `aria-live="polite"` y `aria-atomic="true"`; el cierre tiene nombre configurable y foco visible. La página documenta accesibilidad, lineamientos en pares y ejemplos vivos de acción/cierre, con resultado debajo del componente. | `npm run build:lib`, reinicio de servidor y ruta `/components/toast`; click real en «Reintentar» actualiza el resultado debajo del Toast, «Descartar» retira el toast del Playground, atributos ARIA leídos del DOM, medición posterior de Toast sin descripción (título 13/13 px e ícono 14/13 px respecto al contenedor), y consola sin errores; `npm run build-storybook` completó con historias Default/SuccessWithAction/Warning. | Cerrado — 2026-09-11 |
| Popover | C1: superficie, borde, sombra, z-index y geometría usan tokens; el offset de 8 px es una excepción documentada para separar trigger y panel. C4: apertura/cierre/posición usan `signal()` y se cancelan timers pendientes; C5-C6: portal a `document.body`, z-index de dropdown y sombra semántica; C7: íconos de lineamientos consumen el registro curado; C9-C10: mide el panel real, reubica con scroll/resize y cambia de lado ante colisión; C11-C12: estado abierto expuesto en el trigger. El panel tiene id y nombre accesible; `aria-expanded`, `aria-controls` y `aria-haspopup` se aplican al botón nativo real incluso dentro de `cs-button`; Escape devuelve el foco. Documentación de accesibilidad, lineamientos en pares con overlays reales y Storybook. | `npm run build:lib`, reinicio de servidor y ruta `/components/popover`; apertura real, ARIA `expanded/controls/haspopup` enlazado con el id del panel, Escape con cierre + foco en el botón nativo, selector `matchTriggerWidth` con selección real, lineamiento con portal fuera de la tarjeta sin recorte y consola sin errores; `npm run build-storybook` completó con Default/RightEnd/MatchTriggerWidth. | Cerrado — 2026-09-11 |
| Input + InputGroup | C1: escala de alturas, bordes y anillos atados a tokens; tablas de accesibilidad de dos columnas alineadas con `content/note` y su `line-height`; excepción explícita de 2px para el inset exterior del addon `compact`, además de las excepciones de 10px/14px del inset horizontal sin paso equivalente; C2-C3: sm/md/lg mantienen el par font-size/line-height; C8: InputGroup compone piezas existentes; C10: campos y addons medidos en la misma altura; C13: reglas tipográficas completas. API nativa con `id`, `name`, `required`, `autocomplete`, límites y atributos ARIA; grupos con foco/invalidez vía `:has()`; addon `compact` para acciones y `divider` para distinguir selectores integrados; accesibilidad, lineamientos en pares y ejemplos en inglés; recomendación de contraseña con estado signal e interacción real. | Build de librería y app, reinicio de servidor, build de Storybook, ruta local `/components/input`, árbol de accesibilidad, alturas 28/32/40, foco del grupo, foco por addon, apertura de selector embebido con portal, selección por clic y teclado, opciones textuales de país junto a bandera decorativa, selector de moneda compacto, medición del botón Copy a 2px del borde, toggle de contraseña en Playground y recomendación (password → text → password), y medición de tabla de accesibilidad a 12/18px. | Cerrado — 2026-09-11 |
| Dropdown + InputDropdown | C1-C3: escala xs/sm/md/lg y tipografía con line-height; C4: estado zoneless con `signal()` y foco posterior a render; C5-C6: z-index/sombra del menú; C7: check compartido vía `cs-icon`; C8: glyphs de selección compartidos; C9: listbox limitado a 9 opciones y portado con `Popover`, sin recorte; C10: triggers y opciones simétricos, con representación compacta independiente de la etiqueta del menú; C11: glyphs centrados; C12: estados semánticos. Para código telefónico, la bandera es decorativa y cada opción conserva el país y código como texto. API accesible con trigger nombrado, `role="menu"`, `menuitem*`, `role="combobox"`/`listbox`, asociación label/id, required/invalid/describedby, `name` para formulario, navegación Arrow/Home/End/Escape y lineamientos en pares. | Build de librería y app, build de Storybook, reinicio de servidor, ruta local `/components/dropdown` y `/components/input`, árbol de accesibilidad, alturas 24/28/32/40, trigger de ícono nombrado, foco inicial con ArrowDown, selección con clic, combobox/listbox mediante portal y revisión de asociaciones ARIA; menús de acciones y listbox de lineamientos abiertos sin recorte dentro de su tarjeta. | Cerrado — 2026-09-11 |
| Radio + RadioGroup | C1: gap de 10px y separación label/description de 1px documentados como huecos ópticos; C2-C3/C13: label y descripción escalan por tamaño con line-height correspondiente; C4: `id`/`name` se resuelven después de aplicar inputs y el grupo sincroniza estado con `signal()`; C7: íconos de documentación usan el registro curado; C8/C11: anillo y punto consumen glyph compartido con Dropdown y mantienen paridad de centrado; C9: input radio nativo, label visible o `aria-label`, flechas/Espacio y estados disabled; C12: estados required/invalid/error conservan semántica además del color. Grupo con `role="radiogroup"`, `aria-labelledby`, `aria-describedby`, `aria-errormessage`, `aria-required` y `aria-invalid`; documentación de accesibilidad, lineamientos en dos columnas y API de ambos componentes. | Build de librería y app, build de Storybook, reinicio del servidor, ruta local `/components/radio`, árbol de accesibilidad, clic + flecha abajo (Rojo → Azul), radios disabled, error enlazado y revisión visual de centrado en sm/md/lg. | Cerrado — 2026-09-10 |
| Calendar | C1: bordes y foco atados a tokens; C4: navegación reactiva y estado inicial; C7: nombres de mes/día en español; C9-C10: grilla de seis semanas y geometría estable; C11-C12: estados de fecha seleccionada, actual, deshabilitada y rango; C13: tipografía con line-height. Grilla ARIA con nombres completos de fecha, estados anunciables y foco roving con flechas, Home/End, PageUp/PageDown, Enter/Space. Documentación de accesibilidad y lineamientos en pares. | Build de librería y app, reinicio de servidor, ruta `/components/calendar`, árbol de accesibilidad, foco roving, navegación PageDown con foco restaurado, mes siguiente/anterior, fechas deshabilitadas y selección de rango verificados. | Cerrado — 2026-09-10 |
| DateTimePicker | C1: popover, foco y mensajes usan tokens; C4: signals inicializadas en `ngOnInit`; C9-C10: calendario en overlay `max-content` con espacio reservado y campos simétricos; C13: mensajes tipográficos completos. Campo de fecha con `aria-haspopup`, `aria-expanded`, `aria-controls`, ayuda/error mediante `aria-describedby`, calendario accesible, limpieza alcanzable por teclado y retorno de foco. Documentación de accesibilidad y lineamientos. | Build de librería y app, reinicio de servidor, ruta `/components/datetime-picker`, apertura real del calendario, selección de fecha con cierre y foco restaurado, valor ISO inicial, ayuda/error enlazados, botón de limpiar y secciones de accesibilidad/lineamientos verificadas. | Cerrado — 2026-09-10 |
| DateTimeRangePicker | C1: borde, separación y foco atados a tokens; C4: id estable y estado inicial; C9-C10: overlay de rango con espacio reservado, campos de hora medidos y labels alineados con spacer simétrico; C13: mensajes tipográficos completos. Trigger de rango etiquetado, horas de inicio/fin con nombres independientes, `aria-describedby`, Escape, selección en dos pasos, limpieza alcanzable y documentación de accesibilidad/lineamientos. | Build de librería y reinicio de servidor, ruta `/components/datetime-range-picker`, ids y labels asociados, medición previa y posterior de Requerido/Deshabilitado (fecha y horas a la misma coordenada vertical), selección real 10–18 sep 2026, cierre con foco restaurado, horas nombradas, overlay visible y secciones de accesibilidad/lineamientos verificadas. | Cerrado — 2026-09-10 |
| Banner | C1: bordes, padding y foco atados a tokens; C2-C3/C13: título, cuerpo y acción mantienen `content/ui` (13/19.5px), igual que Card Banner; la jerarquía se conserva por peso y color. El reinicio de ejemplos usa `content/note` (12/18px) y padding compacto; C7: íconos curados por variante; C9: acción y cierre quedan dentro del contenedor sin recorte; C12: estados semánticos conservan texto además de color. API con acción y cierre nombrados, secciones de accesibilidad y lineamientos en pares de dos columnas, ejemplos con acción/cierre verificables y `aria-live` en los resultados. | `npm run build:lib`, reinicio de servidor y ruta `/components/banner`; estructura de texto, acciones y cierres confirmada en el árbol de accesibilidad. | Cerrado — 2026-09-11 |
| Card (todas sus piezas) | C1: bordes de Action/CardBanner/Preview/Spotlight atados a `--layout-border-thin`; C7-C8: composición con AvatarGroup, Badge, Button, Toggle e Icon; C10: contenido y controles se mantienen dentro de la tarjeta; C12-C13: variantes y textos conservan contraste y line-height. Action card expone `buttonClick`/`toggleCheckedChange`, Toggle usa el título como nombre accesible y Preview button usa «Más opciones»; documentación de accesibilidad y lineamientos en pares de dos columnas con toggle real. | Build de librería y app, reinicio de servidor, ruta `/components/card`, árbol de accesibilidad, toggle de recomendación (estado y `aria-label`), botones de opciones nombrados, seis pares de lineamientos y revisión visual de la grilla de dos columnas. | Cerrado — 2026-09-10 |
| Modal | C1: overlay, superficie, sombra, bordes y foco atados a tokens; C2-C3/C13: título `content/highlight` (18/27px), cuerpo `content/ui` (13/19.5px) y acciones `Button sm` conservan jerarquía; C4: portal, signals y transición; C9-C10: panel con scroll de body/viewport sin recorte; C12: apariencia warning/danger sincroniza título y acción principal. Motor con `role="dialog"`, `aria-modal`, `aria-labelledby`, foco inicial configurable, trampa de foco, Escape, cierre por overlay, restauración de foco y scroll lock; `closeLabel` configurable; accesibilidad y lineamientos en pares de dos columnas con modales reales, estados anunciables y registro de íconos compartido. | Build de librería y app, build de Storybook con historias Default/Warning/Danger/WithoutCloseButton/LongContent, ruta local `/components/modal`, árbol ARIA, apertura real, foco visible, Escape, cierre y restauración, acciones de footer, overlay y revisión visual tipográfica. | Cerrado — 2026-09-10 |
| Table + TableTree | C4: el buscador del playground compone `InputGroup` con addon de ícono en vez de intentar atravesar la encapsulación de `cs-input`; C8: el ejemplo de lineamientos reutiliza `cs-skeleton`. `cs-column-manager` es el control reutilizable de administración de columnas: toma la geometría, fondo, borde y foco de InputDropdown/Select, pero conserva semántica de botón y panel propio porque reordenar por arrastre y mostrar/ocultar no son una selección de valor. El trigger comunica `X de X visibles` sin repetir un ojo decorativo; las filas del panel usan la misma altura compacta de Select `sm`, sin separación entre opciones. Mantiene al menos una columna visible. Table conserva tabla nativa, carga anunciable y filas skeleton, mientras TableTree mantiene carga perezosa con `children === undefined`. | Build de librería y app, Storybook `Componentes/ColumnManager` y ruta `/components/table`; panel de Columnas con visibilidad real, protección contra tabla vacía, cierre con Escape y orden por arrastre. Ruta `/components/table-tree` con expansión perezosa visible y resolución posterior de sus hijos. | Cerrado — 2026-09-14 |
| Skeleton | C4: el host vacío se estiliza con `:host`, no con un selector interno que Emulated no puede aplicar; usa gradiente `base`/`shimmer`, animación ambiente explícita de 1.6s y alternativa estática para `prefers-reduced-motion`. | Build de librería y app; verificación visual de las cinco filas de Table y de la fila perezosa de TableTree. | Cerrado — 2026-09-10 |
| Patrón de lineamientos | `guide-grid` y `guidelines-grid` fijados a dos columnas: Recomendado a la izquierda y Evita a la derecha; cada tarjeta conserva su demo vivo dentro del cuerpo. | Recarga correcta del servidor Angular y rutas Button, Card, Banner y Modal actualizadas; acciones, toggles, cierres y modales interactivos comprobados. | Cerrado — 2026-09-10 |

- **FleetUnitList (2026-09-11)** — `projects/comsatel-ds/src/lib/fleet-unit-list/`.
  Organismo de telemetría que compone Accordion, Badge, Icon y Button: identidad,
  estado con texto e ícono, frescura de señal, telemetría semántica mediante
  `dl`, alerta opcional y evento `detailClick`. Se verificaron el panel
  expandido y la acción de detalle en la página de Accordion; queda pendiente
  una página de documentación propia para cerrar su auditoría independiente.

## Matriz de evaluación por componente

Esta es la lista operativa para las siguientes pasadas. “Auditoría global”
significa que la cuarta ronda revisó el conjunto, pero todavía no hay una ficha
con hallazgos y evidencia por componente; no debe confundirse con un cierre
individual trazable.

| Prioridad | Componente o familia | Estado de evaluación | Siguiente alcance |
|---|---|---|---|
| P1 | Button | Cambio de carga: debe conservar el ancho del contenido proyectado con spinner centrado. | Validar visualmente reposo y `loading` en xs/sm/md/lg, texto largo e ícono; después actualizar la ficha individual. |
| Cerrado | Badge | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Tag | Componente nuevo solicitado: API semántica, composición con Badge, accesibilidad, Storybook y lineamientos verificados. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Progress indicator | Componente nuevo solicitado: recorrido por etapas, estados, orientaciones, líneas de conexión horizontales/verticales, interacción opcional, accesibilidad, Storybook y lineamientos verificados. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Stepper | Indicador de progreso de secuencia fija, con orientación, interacción opcional, accesibilidad, Storybook y lineamientos verificados. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Accordion | Ficha individual completa: compound component, coordinación single/multiple, animación, ARIA, foco, disabled, Storybook y lineamientos verificados. | Ninguno; reabrir solo ante cambio. |
| P1 | FleetUnitList | Organismo nuevo de telemetría; la composición y acción se verificaron dentro de Accordion. | Página propia: accesibilidad, API, lineamientos y matriz de estados. |
| Cerrado | Tabs | Ficha individual completa: paneles ARIA, selección, disabled, foco, teclado Arrow/Home/End, Storybook y lineamientos verificados. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Pagination | Ficha individual completa: variantes, truncado, saltos, estados disabled, landmark, anuncios, Storybook y lineamientos verificados. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Avatar | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Checkbox | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Toggle | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Tooltip | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Input + InputGroup + PasswordInput | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Dropdown + InputDropdown | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | AppLayout + navegación | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Motion | Auditoría y reconstrucción individual completa: borde tokenizado, íconos de lineamientos migrados a cs-icon, botón "Repetir" alineado al patrón de acciones auxiliares (content/note) en las 3 piezas que lo repetían. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Tema de mapa | Auditoría y reconstrucción individual completa: tokens, motor MapLibre+OpenFreeMap, contraste de proveedor (etiquetas y calles) y marcador real reusado. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Marcadores | Auditoría y reconstrucción individual completa: tokens, escala tipográfica por iconTier, íconos curados y contenido de integración actualizado a MapLibre. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Logos | Página de fundamentos reconstruida con las variantes aprobadas de menú, ejemplos de lineamientos y criterios de accesibilidad. El paquete público incluye `CFlotasLogo`: wordmark `C-` + cápsula `FLOTAS` + `by COMSATEL` e isotipo `C-` + cápsula `FL`, SVG auto-contenidos, tamaños, `fit` y alternativa accesible configurable; aliases heredados preservados. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Motion + Motion tokens | C1-C13: durations/easings, bordes, espaciado y tipografía se atan a tokens; estados de entrada/salida usan signals; GSAP respeta movimiento reducido; documentación incluye accesibilidad, lineamientos y controles nombrados con foco visible. | `npm run build`, reinicio de servidor, rutas `/animations/motion` y `/animations/tokens`, toggle Mostrar, botones Repetir y árbol de accesibilidad. |
| Cerrado | Toast | Reconstrucción individual: anuncio accesible, acciones y cierre verificables, lineamientos en pares, documentación de accesibilidad y Storybook. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Popover | Reconstrucción individual: portal, posicionamiento por colisión, vínculo ARIA trigger/panel, Escape con retorno de foco, lineamientos interactivos y Storybook. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Spotlight | Reconstrucción individual: diálogo no modal, relaciones ARIA, Escape opcional, posiciones sin colisión, lineamientos interactivos, accesibilidad y Storybook verificados. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Select | Reconstrucción individual: selección múltiple controlada, listbox portado, teclado, etiqueta asociada, lineamientos interactivos y Storybook. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Menu | Reconstrucción y verificación individual completadas; se sincronizó la matriz. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Table + TableTree | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Skeleton | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | PressScale | Ficha individual: puntero y teclado, movimiento reducido, limpieza de tweens, documentación, accesibilidad y lineamientos verificables. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Banner | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Calendar | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | DateTimePicker | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | DateTimeRangePicker | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Card (todas sus piezas) | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |
| Cerrado | Modal | Ficha individual completa. | Ninguno; reabrir solo ante cambio. |

## Cómo actualizar este archivo

Al terminar una auditoría o reconstrucción de un componente/fundamento
existente, moverlo a la sección que corresponda. Al construir un componente
que no existía antes en Angular, agregarlo a "Componentes de librería" con
cualquier decisión de diseño nueva que otras auditorías futuras deban
respetar. Si se porta Radio, mover su nota de "Referencia funcional" a la
entrada real del componente construido, no borrarla — sigue siendo útil
para futuras correcciones.
