# Checklist de auditoría de tokens — 13 criterios (Angular)

Aplicar los 13 en orden sobre cada componente
(`projects/comsatel-ds/<nombre>/src/<nombre>.ts/html/css` desde la 0.6.0; ver
`entry-points.md`) y su página de
documentación (`src/app/pages/<nombre>-demo/<nombre>-page.ts/html/css`). La
disciplina de tokens (C1, C2, C3, C5-C12) es la MISMA que en el sistema React
— son criterios de diseño, no de framework — así que cada uno trae también el
bug real encontrado en React como referencia de qué tipo de problema buscar,
más el equivalente Angular cuando ya se encontró uno. C4 es enteramente
distinto: reemplaza el bug de Base UI (que no existe en Angular) por los bugs
reales de Angular encontrados esta sesión. C12 (contraste WCAG) es el más
nuevo — se agregó tras un hallazgo real cambiando el color de marca.

## C1 — Valores fijos que coinciden con un token pero no están atados

Buscar en cada `.css` un padding/gap/border-width/tamaño numérico fijo
(`padding: 12px`, `gap: 6px`, `border-width: 2px`) y comparar el valor contra
la escala `--layout-padding-*` / `--layout-gap-*` / `--layout-border-*`.

- Si coincide exacto → reemplazar por `var(--layout-gap-lg)` (mismo valor
  visual, ahora conectado al token).
- Si NO coincide con ningún paso de la escala (10px, 14px en contexto de
  ícono, 1px de gap label/description) → dejarlo explícito con un comentario
  que explique por qué, en vez de forzarlo a un token cercano y cambiar el
  tamaño visual sin aprobación de diseño.

Al portar un componente desde React, este es el paso obligatorio antes de
copiar cualquier valor: convertir la clase Tailwind de React a su equivalente
en px, y desde ahí decidir si coincide con la escala o si es un hueco
conocido (ver `token-architecture.md`).

## C2 — El textStyle usado no corresponde al ROL semántico del texto

No basta con "usa algún token" — el nivel debe ser el correcto para lo que ES
ese texto: contenido de lectura (`content/*`) vs. etiqueta compacta de UI
(`label/*`).

Ejemplo real (React, mismo criterio aplica en Angular): `tooltip.tsx` usaba
`content/note` (12px, pensado para texto de lectura) para el texto del
tooltip — un tooltip es UI compacta y efímera, no contenido de lectura; se
corrigió a `label/small` (11px) y se registró en
`componentTypography.tooltip`. El `cs-tooltip` de Angular ya se construyó
usando `label/small` desde el inicio, con esta decisión ya aplicada.

También verificar que TODA regla con `font-size` fijo trae su
`line-height` par del mismo `textStyle` — ver el bug real de Angular #6
más abajo, en C4.

## C3 — El texto de un control no escala con su prop `size`

Si un componente tiene `@Input() size: 'sm' | 'md' | 'lg'`, su
label/description/texto interno debe crecer o achicarse junto con ese
tamaño — no quedarse en un `textStyle` fijo sin importar qué `size` se pasó.

Patrón Angular ya establecido en `cs-checkbox`/`cs-toggle`: un mapa
`Record<Size, StyleName>` por tamaño, expuesto como getter:
```ts
const LABEL_STYLE: Record<CheckboxSize, StyleName> = { sm: 'content/note', md: 'content/caption', lg: 'content/body' };
const DESC_STYLE: Record<CheckboxSize, StyleName> = { sm: 'label/small', md: 'content/note', lg: 'content/caption' };
```
Al portar un componente nuevo con prop `size`, construir este mapa desde el
principio en vez de fijar un `textStyle` único.

## C4 — Bugs reales de Angular (reemplaza el bug de Base UI de React)

Angular no tiene equivalente a `@base-ui/react` — los componentes sin
primitivo accesible usan un `<input>` nativo oculto (Checkbox/Toggle) o
`@HostListener` (Dropdown/Tooltip). Los bugs reales de esta plataforma son
otros, y son igual de sutiles: el código "se ve correcto" y no se aplica.

**1 — `computed()` sobre un `@Input()` clásico nunca invalida su caché.**
```ts
@Input() code = '';
protected readonly highlightedCode = computed(() => highlight(this.code)); // ❌
```
`computed()` solo trackea signals reales — un `@Input()` plano cambia como
propiedad de clase normal, pero `computed()` nunca se entera y se queda
pegado al primer valor para siempre. Fix: usar la API de input basada en
signals para cualquier propiedad que un `computed()` necesite leer
reactivamente:
```ts
readonly code = input(''); // ✅
protected readonly highlightedCode = computed(() => highlight(this.code()));
```
Caso real: `demo-shell.ts` — el bloque de código no seguía a los controles
del Playground hasta este fix.

**2 — El sanitizer de Angular borra el atributo `style` de HTML inyectado
por `[innerHTML]`**, incluso cuando el HTML lo genera código propio de
confianza (el resaltador de sintaxis, un SVG de ícono). Sin
`DomSanitizer.bypassSecurityTrustHtml()`, el resultado visual desaparece
SIN error de consola — solo una advertencia fácil de pasar por alto:
`WARNING: sanitizing HTML stripped some content`. Fix:
```ts
protected readonly highlightedCode = computed<SafeHtml>(() =>
  this.sanitizer.bypassSecurityTrustHtml(highlight(this.code())),
);
```
Caso real: `code-block.ts` — el resaltado de colores no se veía hasta este fix.

**3 — Un `{` suelto en texto plano rompe la compilación entera.** Fuera de
un binding `[prop]="..."` o de `{{ }}`, un `{`/`}` literal (ej. documentar
`{ value, label, disabled? }` en la descripción de una prop) dispara
`NG5002: Invalid ICU message`, apuntando al FINAL del archivo (EOF), no a la
línea real. Fix: escapar con `{{ '{' }}`/`{{ '}' }}` en texto interpolable,
o `&#123;`/`&#125;` dentro de un atributo estático multilínea. Al ver este
error, buscar el `{`/`}` desbalanceado manualmente por todo el archivo — el
mensaje no ayuda a localizarlo.

**4 — CSS con scope de componente (encapsulation Emulated) NUNCA alcanza
contenido inyectado por `[innerHTML]`.** Un `<svg>` insertado en runtime vía
`[innerHTML]` no recibe el atributo `_ngcontent-*` que Angular usa para
scopear selectores — un `.icono svg { width: 24px }` en el `.css` del
componente simplemente no aplica, sin error. Fix real usado: reescribir los
atributos `width`/`height` del string SVG antes de sanitizarlo, en vez de
intentar controlar el tamaño por CSS. Caso real: la grilla de la página de
Íconos — el selector de tamaño no cambiaba nada visualmente hasta este fix.

**5 — Variante de CSS specificity (misma familia que el bug de React, sí
aplica igual en Angular).** Un elemento con una clase `:hover` que ADEMÁS
tiene la misma propiedad fijada por `[style.background-color]` inline nunca
muestra el hover — un `style` inline siempre gana contra una clase, sin
importar el orden. Verificar con el navegador cualquier elemento con hover
esperado que también reciba esa propiedad vía binding de estilo.

**6 — Un `input()` señal leído en el inicializador de campo de la MISMA
clase todavía no tiene el valor vinculado desde el template — solo ve su
default.** Parece "seguro" porque a diferencia de un `@Input()` clásico,
`input()` SÍ es legible sincrónicamente sin esperar `ngOnChanges`/
`ngOnInit` — pero eso aplica quien LEE el input reactivamente (en un
`computed()`, un método, o el propio template), no a otro campo de la
misma clase que intenta sembrar SU valor inicial a partir de él en el
momento de la declaración:
```ts
readonly defaultMonth = input<number>();
// ❌ defaultMonth() todavía es undefined acá — Angular recién asigna el
// valor real del binding después de que termina de construir la instancia.
private readonly internalMonth = signal(this.defaultMonth() ?? fallback);
```
El síntoma es silencioso y solo se ve probando la interacción real: el
componente siempre usa el valor por defecto/fallback, como si el binding
del consumidor nunca hubiera llegado — sin error de compilación ni de
consola. Fix: sembrar ese estado en `ngOnInit()` en vez del inicializador
de campo (`ngOnInit()` SÍ corre después de que Angular asigna los inputs,
sean clásicos o signal-based):
```ts
private readonly internalMonth = signal<number | null>(null);
ngOnInit(): void {
  this.internalMonth.set(this.defaultMonth() ?? fallback); // ✅
}
```
Si el valor sembrado alimenta un `computed()`, agregar el mismo fallback
ahí también (`this.internalMonth() ?? fallback`) para el instante entre la
construcción y `ngOnInit()`. Si se necesita un `effect()` para reaccionar a
cambios posteriores, registrarlo en el CONSTRUCTOR (`effect()` exige un
contexto de inyección, que `ngOnInit()` ya no garantiza) — el cuerpo del
efecto se autocorrige solo cuando `ngOnInit()` haga `.set()` sobre las
signals de las que depende, así que no hace falta forzar el orden entre
ambos. Caso real: `calendar.ts` (`defaultMonth`/`defaultYear` — el
Playground mostraba el mes actual en vez del mes pedido) y
`datetime-picker.ts` (`defaultValue` — ninguna demo con fecha precargada
mostraba nada, `resolvedId`/`gridId` con `fieldId` sufrían lo mismo).

**7 — Este proyecto corre SIN `zone.js` (zoneless por defecto, confirmado:
no está en `package.json`) — una propiedad plana mutada dentro de un
`setTimeout`/callback async nunca dispara una nueva pasada de detección de
cambios.** El código "funciona" en el sentido de que la propiedad SÍ cambia
en memoria — pero la vista nunca se entera, porque no hay `zone.js`
parcheando esas APIs para avisarle a Angular que reaccione. La pista para
distinguirlo de un bug real: un efecto imperativo en el MISMO callback (ej.
`element.focus()`, que no depende de que Angular renderice nada de nuevo) sí
funciona, mientras que un cambio de clase/estado en ese mismo callback no se
refleja. Fix: usar `signal()` en vez de una propiedad plana para cualquier
estado que se vaya a mutar fuera de un evento ligado por Angular
(`(click)`, `@HostListener`, un `@Input()`/`input()` que cambia):
```ts
protected visible = false; // ❌ no se refleja si se muta en un setTimeout
protected readonly visible = signal(false); // ✅
```
Caso real: `modal.ts` — la transición de entrada (opacity/scale) nunca se
veía pese a que el foco, en el mismo callback, sí se aplicaba
correctamente. Detalle completo del patrón en
`references/accessibility-patterns.md` sección 0.

**8 — El CSS de un componente sin template no alcanza su propio host si se
escribe como una clase normal.** En encapsulación `Emulated`, un selector
interno como `.cs-skeleton` se compila para elementos con `_ngcontent-*`,
pero el host `<cs-skeleton>` recibe `_nghost-*`. Cuando el componente usa
`template: ''` y su superficie visual ES el host, la regla no aplica, sin
error de compilación: el DOM contiene las filas de carga, pero sus barras se
ven transparentes. Fix: estilizar el host con `:host`, también dentro de
media queries; no asumir que una clase declarada en `host: { class: ... }`
equivale a un elemento de la plantilla.

Caso real: `skeleton.css` — Table y TableTree insertaban el primitivo y
anunciaban la carga, pero no dibujaban ninguna barra hasta cambiar
`.cs-skeleton` por `:host` y verificarlo visualmente en ambos flujos.

**9 — Un `@Input()` clásico leído en un inicializador de campo conserva el
valor por defecto y descarta el binding del consumidor.** Angular asigna los
inputs después de construir la instancia; por eso un campo como
`resolvedName = this.name ?? generatedName` o `inputId = this.id ?? generatedId`
queda congelado antes de recibir `name`/`id`. El síntoma es silencioso: la
composición se ve correcta, pero el formulario no comparte el `name` esperado
o el label externo no encuentra el `id` solicitado. Fix: conservar un id/name
generado y resolverlo en un getter (o sincronizarlo en `ngOnChanges`), nunca en
el inicializador. Caso real: `radio.ts`/`radio-group.ts`; se corrigió y se
verificó con el árbol de accesibilidad y navegación nativa por flechas.

## C5 — z-index no usa la escala semántica

Buscar cualquier `z-index` numérico suelto en componentes con
overlay/popup (`cs-dropdown`, `cs-tooltip`, futuros Modal/Toast). Debe ser
`var(--elevation-z-index-<nombre>)` con el nombre semántico correcto — la
escala es jerárquica a propósito (dropdown=100 < modal=300 < toast=500 <
tooltip=600). Ya aplicado correctamente en `cs-dropdown`
(`--elevation-z-index-dropdown`) y `cs-tooltip`
(`--elevation-z-index-tooltip`) — verificar que se mantenga al portar Modal
y Toast.

## C6 — Sombra no usa el sistema, o referencia un token inexistente

Buscar cualquier `box-shadow` con valores crudos → reemplazar por
`var(--shadow-md)` etc. También buscar activamente **tokens rotos**: una
`var(--algo)` usada en el código pero nunca definida en `tokens.css`. No
genera error de consola — silenciosamente no aplica ningún estilo.
```bash
grep -rn "var(--nombre-sospechoso)" projects/comsatel-ds/*/src/
grep -n "nombre-sospechoso:" projects/comsatel-ds/src/styles/tokens.css   # si no aparece, está roto
```

## C7 — Íconos no vienen del registro curado, o no escalan en progresión

Cualquier componente en `projects/comsatel-ds/*/src/` que use un ícono
debe consumirlo vía `<cs-icon name="..." [size]="n">` desde
`icon-registry.ts` — nunca un SVG suelto dibujado a mano dentro del
componente. Si el ícono que hace falta no está en el registro, agregarlo
primero (ver `token-architecture.md`, sección Íconos — y no confundir con el
catálogo completo de 1531 íconos de la página de documentación).

Además, si el componente tiene una escala de tamaños, el tamaño de ícono
debe crecer en cada paso — sin un paso repetido que rompa la progresión
(bug real ya corregido en React `dropdown.tsx`: `iconSize` 12/14/16/16 con
md y lg compartiendo 16 pese a que el texto sí crecía — verificar el mismo
patrón al portar Dropdown-like components nuevos).

## C8 — Un elemento visual que ya existe en otro componente se reimplementa a mano

Regla general: si un componente nuevo necesita un elemento visual/de
comportamiento que YA existe en otro componente de la librería Angular, hay
que traer ese componente o extraer un CSS/función compartida — nunca
redibujarlo a ojo desde cero. El usuario lo dejó explícito en React y aplica
igual acá: "si vas a construir un componente que va a ocupar algún elemento
que ya tenemos construido, debemos traer ese mismo componente."

**Caso real ya resuelto en Angular — glyphs de checkbox/radio dentro de
Dropdown.** El glyph de un ítem `selectionMode: "checkbox"` reutiliza
literalmente las clases `.cs-checkbox__box`/`.cs-checkbox__box--checked` del
Checkbox real, extraídas a `projects/comsatel-ds/shared/src/selection-glyphs.css`
e importadas con `@import` tanto en `checkbox.css` como en
`dropdown-item.css` — nunca duplicar ese CSS. Cuando se porte Radio, su
anillo/punto deben usar el mismo criterio: extraer a
`selection-glyphs.css` (agregar `.cs-radio-ring`/`.cs-radio-dot` ahí) y que
Dropdown los consuma de ahí también, en vez de la implementación standalone
actual en `dropdown-item.ts` (que hoy calcula el anillo/punto localmente
porque Radio todavía no existía al construir Dropdown — corregir esto es
parte de portar Radio).

**Caso real — selects nativos en vez de `cs-input-dropdown`.** Ver detalle
completo en `page-pattern.md` — cualquier `<select>` nativo en un Playground
es exactamente este criterio: ya existe el componente real, había que
traerlo, no reimplementar un `<select>` estilizado a mano.

## C9 — Popover/listbox sin espacio reservado en la demo, o sin límite de alto

Dos síntomas relacionados que solo aparecen al abrir el componente
interactivamente en el navegador (no se ven leyendo el código):

**(a) El popover se recorta o queda flotando sobre el Toolbar/CodeBlock de
abajo.** `.demo-shell__canvas` ya tiene `overflow: visible` (ver
`demo-shell.css`) — confirmado que un `<cs-dropdown>`/`<cs-tooltip>` dentro
de `<app-demo-shell>` no se recorta. Pero si el contenido proyectado no
reserva espacio de sobra (`padding-bottom` generoso en el wrapper del
preview), el popover abierto queda flotando ENCIMA del Toolbar/CodeBlock en
vez de tener aire debajo — ver el patrón `.stage`/`padding-bottom` usado en
`dropdown-page.css` como referencia al portar Calendar/DateTimePicker.

**(b) Un listbox sin límite de alto, con muchas opciones.** Ya resuelto en
`cs-input-dropdown`: el listbox limita a 9 elementos visibles
(`max-height: tok.height * 9 + 8`) con `overflow-y: auto`. Verificar que
cualquier lista larga nueva (ej. selector de hora en DateTimePicker) siga el
mismo criterio.

## C10 — Dos campos que deberían verse simétricos no lo están (ancho o alineación vertical)

Dos síntomas que solo se detectan comparando `getBoundingClientRect()` de
los dos campos, no leyendo el código — relevantes especialmente al portar
DateTimePicker (campo de fecha + campo de hora en la misma fila):

**(a) Un popover se comprime al ancho de su trigger en vez de a su ancho
natural.** Un elemento `position: absolute` con solo `left` fijado (sin
`right` ni `width`) usa shrink-to-fit acotado al contenedor posicionado más
cercano — si el trigger es más angosto que el contenido del popover (ej. un
calendario de ~260px dentro de un botón de 160px), el popover se ve
comprimido. Fix: `width: max-content` explícito en el wrapper del popover.

**(b) Dos columnas con `align-items: flex-start` en la misma fila no
arrancan a la misma altura.** Si una columna es `display: flex` pero la otra
es un `<div>` normal cuyo único hijo es en sí mismo `inline-flex`, ese hijo
queda sujeto al espacio fantasma de line-box/vertical-align — el campo
completo queda unos píxeles más abajo que la columna vecina. Fix: la columna
problemática también debe ser `display: flex`, no un `<div>` normal.

Regla general al construir cualquier fila de campos que deban verse
simétricos: medir ambos con `getBoundingClientRect()` tras renderizar — "se
ve bien" no basta cuando la diferencia es de pocos píxeles.

**(c) Texto ópticamente alto en un control compacto de altura fija.**
`align-items: center` centra la caja de línea, no necesariamente los glifos.
En tamaños pequeños, el espacio interno de la métrica de la fuente puede hacer
que el texto se perciba más alto que un ícono geométrico correctamente
centrado. Es especialmente visible en badges, chips y estados con alto fijo.

Regla: cuando un control compacto proyecta texto y opcionalmente íconos,
verificar visualmente en el navegador al menos una composición solo-texto y
otra texto+ícono. Si hay desbalance óptico, envolver el contenido proyectado
en un hijo `inline-flex` centrado y hacer coincidir su caja de línea con la
del ícono usado en esa composición; mantener la tipografía tokenizada en el
contenedor. No aplicar este ajuste por intuición a texto de lectura o a
controles cuya altura dependa del contenido.

Caso real: `cs-badge` necesitó `.cs-badge__content` para separar la altura
tipográfica del alto fijo del control. El wrapper conserva `gap` y centra
texto e íconos como una unidad; los íconos de 12px de las composiciones se
alinean con una caja de línea explícita de 12px, no con una caja de 11px.
Para pares ícono+texto, revisar también el espacio visible entre ambos y usar
un token de `--layout-gap-*`; en Badge, `--layout-gap-xs` (4px) conserva la
relación sin que los elementos se perciban pegados.

**(d) Solapamiento que tapa contenido legible.** En grupos apilados, el
solapamiento válido para una foto puede recortar iniciales o texto. Verificar
la composición con contenido visual y textual; si difieren, el margen negativo
debe responder al contenido que queda debajo, usando un token de layout. Caso
real: AvatarGroup conserva el solapamiento de fotos y reduce a 4px el de
avatares con iniciales.

Además, medir el ítem apilado, el anillo y el avatar interno: los tres deben
tener el mismo ancho y alto. Un custom element `inline-flex` dentro de un
contenedor normal puede introducir una caja de línea adicional; fijar el
tamaño del ítem y usar `display: flex` evita que el anillo sea mayor que el
círculo real.

## C11 — Un punto/glyph interior calculado como % del contenedor queda descentrado

Un punto de radio, o cualquier hijo circular/cuadrado dentro de un
contenedor de tamaño fijo, calculado como `containerSize * ratio` (ej.
`box * 0.5`), puede quedar VISIBLEMENTE descentrado según la paridad: si
`containerSize` es par pero el resultado del ratio es impar (14 × 0.5 = 7),
el navegador reparte el resto de .5px hacia un solo lado — visible a tamaños
chicos (14-18px).

Regla: el tamaño del hijo centrado debe tener la MISMA paridad que el
contenedor. No calcular como porcentaje crudo — usar un valor explícito por
tamaño o una función que ajuste la paridad:
```ts
function safeInnerSize(containerSize: number, ratio = 0.5): number {
  let inner = Math.round(containerSize * ratio);
  if ((containerSize - inner) % 2 !== 0) inner += 1;
  return inner;
}
```
Ya aplicado en `dropdown-item.ts` (`radioDotSize` getter, misma fórmula).
Verificar con `getBoundingClientRect()` en los cuatro lados al portar Radio
como componente independiente — no asumir que el mismo cálculo que ya
funciona en el glyph de Dropdown va a seguir centrado si se copia sin
revisar al Radio real (React encontró exactamente este desfase entre las dos
implementaciones antes de unificarlas).

## C12 — Un par texto/fondo no cumple el contraste WCAG real (no aproximado)

Cualquier cambio a un color de `tokens.css` — nuevo color de marca, ajuste
de un paso de escala, un token que antes no existía — exige verificar el
contraste real contra cada fondo/texto donde ese color se usa, ANTES de
darlo por cerrado. "Se ve legible" o comparar la luminosidad HSL (`L%`)
entre dos colores **no es lo mismo que el contraste WCAG** — son cálculos
distintos, y el segundo puede fallar aunque el primero parezca razonable.
Caso real: al cambiar el color de marca a un azul más oscuro, una
comparación a ojo de luminosidad HSL dio por buenos 3 pares que en
realidad medían 2.99:1, 3.14:1 y 3.41:1 (los tres por debajo del mínimo de
4.5:1 para texto) — se detectaron recién al calcular la luminancia
relativa real.

**Cómo calcular (fórmula WCAG 2.1, no una aproximación):**
```
relLuminance(r,g,b) = 0.2126·R + 0.7152·G + 0.0722·B
  donde cada canal (R,G,B) es:
    c ≤ 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4
  con c = canal/255 (r,g,b en 0-255)

contraste(color1, color2) = (L_claro + 0.05) / (L_oscuro + 0.05)
```
Mínimos exigidos:
- **4.5:1** — cualquier par texto/fondo de lectura normal (labels, links,
  texto de botón sobre su fondo, texto de badge sobre su fondo).
- **3:1** — texto grande (≥24px, o ≥18.66px en negrita) y elementos de UI
  no-textuales con significado (anillo de foco contra su fondo, borde de
  un control interactivo, ícono con función propia).

**Qué pares verificar como mínimo** al tocar cualquier color de marca o
semántico (`brand`/`danger`/`warning`/`success`/`neutral`):
- `background-*-default` + `text-inverse` (fondo sólido de botón/badge)
- `background-*-default-hover`/`-pressed` + `text-inverse` (mismos
  estados, no solo el de reposo — un hover/pressed que falle contraste es
  igual de real que el estado default)
- `text-*-default`/`text-link-default` + el fondo de página (`base` o
  `elevation-surface-default`) del mismo tema
- `border-focused`/`border-selected` + el fondo de página (mínimo 3:1, no
  4.5:1, por ser no-textual)
- Repetir TODO lo anterior en **ambos temas** (light y dark) por separado
  — no asumir que un valor que pasa en light también pasa en dark: los
  fondos base son opuestos, así que un mismo color puede pasar en uno y
  fallar en el otro (ver caso real arriba, específico de dark).

Un script Node de ~20 líneas con la fórmula de arriba es más rápido y
confiable que revisar a ojo — ver el caso real de esta sesión para el
patrón (generar el hex candidato, calcular contraste contra cada fondo
relevante, iterar la luminosidad hasta que las que fallan pasen, sin
romper el orden relativo de la escala — ej. `bolder` debe seguir siendo
más prominente que `default`, no invertirse al corregir).

## C13 — `font-size` sin su `line-height` en un elemento cuya altura la define el propio texto

Un `font-size: var(--font-size-*)` sin `line-height: var(--font-line-height-*)`
en la MISMA regla cae al `line-height: normal` del navegador (~1.2, varía
por fuente) en vez del ritmo real del sistema
(`--font-line-height-content-note` = tamaño × 1.5, por ejemplo). Casi nunca
importa cuando el elemento tiene un alto fijo explícito (`width`/`height`
+ `align-items: center`) o el padding domina la caja — SÍ importa, y se ve
roto, en cualquier elemento cuya altura la determina puramente el texto:
un botón de acción con solo padding vertical chico, un label, un párrafo
de descripción, un chip. El síntoma es visual y específico: el control se
ve más bajo/apretado de lo que su propio padding sugeriría.

**Caso real (2026-09-10, encontrado por el usuario mirando Toast):** los
botones de acción de `cs-toast` (`.cs-toast__action`) tenían
`padding: var(--layout-padding-2xs) var(--layout-padding-md)` (2px
vertical, valor real, fiel a la referencia) pero NINGÚN `line-height`
propio — con `line-height: normal` el botón medía 18px con contenido
(14px sin padding en la variante link de texto), notablemente más bajo
que el resto de controles chicos del sistema (Button `xs` = 24px). Título
y descripción del propio Toast (`.cs-toast__title`/`__desc`) tenían el
mismo hueco. Auditoría de esa sesión encontró el mismo patrón repetido en
Radio (`RadioGroup` label/error/helper), Pagination (`__of`), Spotlight
(headline/desc/step/botones — el botón con el MISMO síntoma exacto que
Toast, 2px de padding sin line-height), DateTimeRangePicker (label/error/
helper), Menu (group-header/flyout-title/flyout-item/tooltip — dos de
estos además tenían un `font-size` crudo en px que sí coincidía con un
token real y no estaba atado, ver C1), y las celdas de Table/Table tree.
Fix: agregar el `line-height` del mismo par de tokens (`--font-size-X` +
`--font-line-height-X` siempre van juntos) a cada regla afectada — NUNCA
a elementos con alto fijo explícito, ahí es ruido sin efecto visual, no
hace falta perseguirlos.

**Cómo detectarlo rápido:** grep de `font-size` en el `.css` del
componente, y para cada match verificar en la MISMA regla si hay
`line-height`. Si no lo hay, verificar si el elemento tiene alto fijo
(`width`+`height`, o vive dentro de un padre `display:flex` con
`align-items:center` Y su propio tamaño ya está determinado por otra vía)
— si no lo tiene, es un hallazgo real.

---

## Cómo reportar un hallazgo

Formato por hallazgo: criterio (C1-C12) → archivo:línea → qué está mal → qué
debería ser. En modo AUDITAR, listar todos los hallazgos sin corregir nada.
En modo RECONSTRUIR, aplicar la corrección y luego reportar qué cambió, en el
mismo formato.
