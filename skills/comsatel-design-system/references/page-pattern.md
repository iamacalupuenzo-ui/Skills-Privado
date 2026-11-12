# Patrón de página estándar — Comsatel Design System (Angular)

Toda página de fundamentos (`src/app/pages/<nombre>/`) y de componente
(`src/app/pages/<nombre>-demo/`) sigue esta misma estructura. Cuando audites
una página, compárala literal contra esta plantilla — no contra "algo
parecido", y no contra el `*PageContent.tsx` de React salvo para ver qué
SECCIONES existen y en qué orden (React es referencia de estructura, nunca de
implementación — ver `token-architecture.md` sobre por qué tampoco es fuente
de valores).

**NO es una traducción literal del patrón React.** SectionHeading, DemoShell,
Canvas, Toolbar, CodeBlock y PropsTable en React son componentes/funciones
JSX; en Angular, algunos son componentes reales (`DemoShell`, `CodeBlock`) y
otros son directamente clases CSS compartidas sin componente propio
(`SectionHeading`, `PropsTable`) — ver el detalle de cada uno abajo.

## Ruta y registro

Cada página nueva necesita, en orden:
1. Carpeta `src/app/pages/<nombre>-demo/` (componentes) o
   `src/app/pages/<nombre>/` (fundamentos) con `<nombre>-page.ts/html/css`.
2. Entrada en `src/app/app.routes.ts` — lazy `loadComponent`.
3. Entrada en `src/app/lib/nav.ts` — quitar `pending: true` cuando la página
   queda lista (una entrada con `pending: true` sin página real es esperado
   mientras no se construyó; con página real y `pending: true` todavía puesto
   es un hallazgo).

## Wrapper raíz — CSS compartido obligatorio

Cada `.css` de página empieza con:
```css
@import '../../shared/styles/doc-page.css';

:host { display: block; }
```

`src/app/shared/styles/doc-page.css` es la ÚNICA fuente para estas clases —
**nunca reimplementarlas a mano en el `.css` de una página**:
`.page`, `.eyebrow`, `.title`, `.description`, `.section`, `.section__title`,
`.section__intro`, `.subsection`/`.subsection__title`, `.table`/`.table__*`
(la tabla de propiedades), `.guidelines-grid`/`.guideline*` (bloque de
viñetas Recomendado/Evita), `.guide-grid`/`.guide-card*` (tarjeta individual
Recomendado/Evita con demo en vivo adentro), `.static-block`/`.static-block__preview`,
`.row`/`.col` (layout genérico dentro de un `<app-demo-shell>`),
`.size-item`/`.size-item__label`, `.inline-code`, `.code-block`.

**`<h3 class="subsection__title">` SIEMPRE va envuelto en
`<div class="subsection">`** — el `margin-top` que separa una subsección de
la anterior vive en `.subsection` (el wrapper), NO en `.subsection__title`
(que solo trae `margin-bottom`). Un `<h3 class="subsection__title">` suelto,
seguido directo de un `.table` u otro contenido, no tiene NINGÚN espacio
arriba — queda pegado al elemento anterior (una tabla de la subsección de
al lado, por ejemplo). Hallazgo real repetido en 3 páginas (Avatar, Input,
Card) antes de corregirlo: cada tabla de propiedades de un componente
compuesto (varios sub-componentes en un mismo archivo, ej. `Avatar`+
`AvatarGroup`, o las 5 piezas de `Card`) usaba el h3 sin el wrapper.

```html
<!-- ❌ sin espacio arriba, se ve pegado a lo anterior -->
<h3 class="subsection__title">AvatarGroup</h3>
<div class="table">...</div>

<!-- ✅ -->
<div class="subsection">
  <h3 class="subsection__title">AvatarGroup</h3>
  <div class="table">...</div>
</div>
```

Señal de alerta exacta al patrón que ya se corrigió una vez: una página con su
propia copia local de `.section__title` o `.field__control` en vez del
import — mismo síntoma que el "SectionHeading local" que se corrigió en
React (ver C8 en `audit-checklist.md`), ahora en la variante Angular.

## Header (idéntico en estructura al de React, sin i18n)

```html
<div class="page">
  <p class="eyebrow">{Sección} / {Título}</p>
  <h1 class="title">{Título}</h1>
  <p class="description">{Descripción}.</p>
  <!-- secciones -->
</div>
```

El breadcrumb es SIEMPRE un solo `<p class="eyebrow">`, texto plano con `/` —
nunca un `<nav>` con spans separados (error real corregido a mitad de
sesión: dos páginas tenían el breadcrumb con estructura distinta).

## SectionHeading — NO es un componente en Angular

En React es un componente compartido (`<SectionHeading id title desc />`). En
Angular es directamente:
```html
<section class="section">
  <h2 class="section__title" id="playground">{Título de sección}</h2>
  <p class="section__intro">{Descripción de la sección}.</p>
  <!-- contenido -->
</section>
```
El `id` del `<h2>` sigue existiendo por si en el futuro se agrega una tabla
de contenido que lo escanee (React lo usa así vía `TableOfContents`); Angular
todavía no tiene ese componente, pero mantener el `id` de todas formas.

## DemoShell — SÍ es un componente real: `<app-demo-shell>`

Vive en `src/app/shared/docs/demo-shell.ts/html/css` — puerto 1:1 de
Canvas+Toolbar+CodeBlock (`DocsComponents.tsx` en React). Import siempre
desde ahí, **nunca reimplementar Canvas/Toolbar/CodeBlock a mano** en una
página nueva.

```html
<app-demo-shell [controls]="playgroundControls" [code]="pgCode()" (stateChange)="onPlaygroundState($event)">
  <cs-componente [size]="pgSize()" [disabled]="pgDisabled()"></cs-componente>
</app-demo-shell>
```

```ts
protected readonly playgroundControls: ControlDef[] = [
  { kind: 'select', label: 'Tamaño', key: 'size', options: ['sm', 'md', 'lg'], default: 'md' },
  { kind: 'toggle', label: 'Deshabilitado', key: 'disabled', default: false },
];
protected readonly pgSize = signal<Size>('md');
protected readonly pgDisabled = signal(false);

protected onPlaygroundState(s: DemoState): void {
  if (s['size']) this.pgSize.set(s['size'] as Size);
  if (s['disabled'] !== undefined) this.pgDisabled.set(!!s['disabled']);
}
protected readonly pgCode = computed(() =>
  `<cs-componente size="${this.pgSize()}"${this.pgDisabled() ? ' [disabled]="true"' : ''}></cs-componente>`,
);
```

**El estado vive DENTRO de DemoShell** (un `signal<DemoState>` interno,
inicializado desde los `default` de cada `ControlDef` en `ngOnInit`). La
página consumidora NUNCA controla el estado del Toolbar directamente — se
entera de cada cambio vía `(stateChange)` y de ahí actualiza sus PROPIOS
signals, de los que derivan el contenido proyectado (preview) y el código
mostrado. Es el mismo patrón `preview(state)`/`code(state)` de React, pero
adaptado a projected content (`<ng-content>`) en vez de render props, porque
Angular no tiene una forma directa de pasar una función que reciba el estado
y devuelva template.

**Todo Playground de un componente usa `<app-demo-shell>` — INCLUSO las
secciones sin controles.** Pasar `[controls]="[]"` igual, así la sección
conserva el Canvas con grid de puntos y el selector de tema, consistente con
el resto del sistema. Error real ya corregido: páginas que solo envolvían el
Playground top en `<app-demo-shell>` y usaban un `<div class="demo-panel">`
suelto para el resto de secciones — hay que leer el `*PageContent.tsx` real
de React sección por sección, porque ahí TAMBIÉN todo pasa por `<DemoShell>`
salvo el patrón "static-block" descrito abajo.

### Controles del Toolbar — SIEMPRE `<cs-input-dropdown>`, nunca `<select>` nativo

Un control `kind: 'select'` en el Toolbar de `DemoShell` se renderiza
internamente como:
```html
<cs-input-dropdown
  size="xs"
  [options]="optionsFor(ctrl)"
  [value]="$any(valueOf(ctrl.key))"
  (valueChange)="onChange(ctrl.key, $event)"
></cs-input-dropdown>
```
Esto es interno a `demo-shell.html` — no hay que tocarlo al construir una
página nueva, pero es la razón por la que **cualquier `<select>` nativo en
CUALQUIER Playground de la app es un hallazgo**, sin excepción: ya existe
`cs-input-dropdown` real, calcado del `InputDropdown size="xs"` que usa el
Toolbar de React. Esto aplica también a selects fuera de `<app-demo-shell>`
(ej. un selector de tamaño en una página de fundamentos que no usa DemoShell,
como Íconos o Tipografía) — se reemplazan igual, con el tamaño (`xs`/`sm`/
`md`/`lg`) que corresponda al contexto visual.

`ControlDef.options` acepta `string[]` (la mayoría de los casos: el string
ES el valor literal de la prop, como `size='sm'`, y se muestra tal cual) o
`{value, label}[]` cuando la opción NO es un valor de prop real sino una
clave interna de la página (ej. el control "Tipo" de Input, que elige qué
composición de `InputGroup` previsualizar — `'leading-dropdown'` no es una
prop de ningún componente). Hallazgo real corregido en Input: `optionsFor()`
usaba siempre el mismo string como value y label, así que un
`INPUT_TYPE_LABELS` en español ya escrito en la página nunca llegaba al
Toolbar — el trigger mostraba la clave cruda en inglés. Al agregar un
control nuevo, revisar si sus opciones son props reales (dejar como
`string[]`) o claves internas (pasar `{value, label}[]` con el label en
español).

## CodeBlock — componente real, standalone o dentro de DemoShell

`src/app/shared/docs/code-block.ts/html/css` (`<app-code-block [code]="...">`)
— mismo resaltado de sintaxis que usa `DemoShell` internamente (de hecho
`DemoShell` renderiza un `<app-code-block>` adentro, no duplica el código).
Se usa SUELTO (sin Canvas/Toolbar) en el patrón "static-block" de abajo.

## Patrón "static-block" — para secciones sin Canvas/Toolbar/tema

React construye así las secciones de Variantes/Tamaños de `Button`
(`ButtonPageContent.tsx`): una caja con borde SIN el Canvas de puntos ni el
selector de tema, solo la muestra + `<CodeBlock>` suelto debajo. El
equivalente Angular:
```html
<div class="static-block">
  <div class="static-block__preview">
    <cs-componente variant="primary">Ejemplo</cs-componente>
    <!-- ...más muestras lado a lado -->
  </div>
  <app-code-block code="<cs-componente variant=&quot;primary&quot;>Ejemplo</cs-componente>"></app-code-block>
</div>
```
**Hay que leer el `*PageContent.tsx` real de React sección por sección** para
saber si esa sección específica usa `<DemoShell>` completo o el patrón
static-block — no asumir que todas las secciones de una página usan lo
mismo, ambos coexisten en la misma página real.

## Colocación de las muestras — regla obligatoria (Enzo, 12-nov-2026)

Toda muestra de un componente vive **dentro de un contenedor y centrada**. Se verifica midiendo, no a ojo.

1. **Siempre en un contenedor.** Cada ejemplo va en `<app-demo-shell>` (con su código) o en un `static-block`.
   Nada de componentes sueltos entre párrafos, ni contadores o textos de prueba («Acciones ejecutadas: 3»)
   fuera de la muestra. El aviso de un evento va dentro del lienzo, debajo del componente, con `role="status"`.
2. **Centrado horizontal.** `.demo-shell__canvas` y `.static-block__preview` ya centran: no los anules con
   `align-items: flex-start` en el escenario de la página. Un componente que en el producto ocupa todo el
   ancho de un cajón (Description list, Action card) va en un marco del ancho de ese cajón, centrado; no
   se estira a todo el lienzo. Un overlay que se abre hacia un lado (Spotlight, menú en rail) se compensa
   para que el conjunto quede centrado. **Excepción:** cuando la posición es lo que se explica (dos paneles
   del mapa a izquierda y derecha, el mapa del producto), se conserva.
   Comprobación: desvío horizontal entre el contenido y el lienzo ≤ 24 px, medido con
   `getBoundingClientRect` a 1440 px.
3. **Orden de la página**, como Button: Playground → ejemplos y estados → Accesibilidad (`id="accessibility"`,
   `.table.table--two-columns`) → Lineamientos de uso (`id="guidelines"`, `.guide-grid` con
   `guide-card--do`/`--dont`) → Propiedades (`id="props"`). Todo `h2` lleva `id`. Si la página documenta
   una directiva auxiliar (por ejemplo `csCollapse` en Motion), va en su propia sección con playground,
   no como bloque suelto arriba del Playground.
4. **Playground si el componente tiene variantes o estados**: controles que muestren la regla del componente
   (una opción frente a varias, modo auto frente a full), no solo colores.
5. **Los enlaces de una muestra no navegan.** Se ven y muestran el hover, pero el clic no cambia de vista: lo
   resuelve un escuchador en fase de captura en `src/app/app.ts` para los enlaces dentro de
   `.demo-shell__canvas` y `.static-block__preview` (RouterLink navega aunque el evento llegue cancelado).
   No pongas `href` hacia secciones de la propia página para «desactivar» un enlace.
6. **Textos de las muestras en español** y con el componente vigente: nada de `cs-tag` (obsoleto), usa `cs-badge`.

## PropsTable — NO es un componente, es la clase `.table`

```html
<div class="table">
  <div class="table__head"><span>Propiedad</span><span>Tipo</span><span>Predeterminado</span><span>Descripción</span></div>
  <div class="table__row">
    <code class="table__name">size</code>
    <code class="table__type">"sm" | "md" | "lg"</code>
    <code class="table__default">"md"</code>
    <span class="table__desc">Descripción en español.</span>
  </div>
</div>
```
Los headers de columna (Propiedad/Tipo/Predeterminado/Descripción) SÍ van en
español en Angular — a diferencia de React, que los deja en inglés a
propósito (Prop/Type/Default/Description) por ser nombres técnicos. Esto es
una diferencia intencional entre plataformas, no un error si aparece así.

## Escrito de literales `{`/`}` en texto plano — riesgo real de compilación

Cualquier texto plano (no dentro de un binding `[prop]="..."` ni de una
interpolación `{{ }}`) que contenga un `{` o `}` literal — por ejemplo
documentar la forma de un objeto (`{ value, label, disabled? }`) en una
`table__desc` — **rompe la compilación completa** con
`NG5002: Invalid ICU message`, apuntando al FINAL del archivo (EOF), no a la
línea real del problema. Ver detalle y fix en `audit-checklist.md` (bug
Angular #3).

## Sin i18n — Spanish-only directo en el template

El proyecto Angular es monolingüe en español (tuteo, nunca voseo) —
**no existe** archivo de traducciones ni `locale`/`useLocale`. Al portar
contenido de `src/lib/translations/<componente>.ts` (React) a una página
Angular, se usa el texto en español DIRECTAMENTE en el template — no se
porta el mecanismo de i18n, ni se crea un archivo de traducciones paralelo
en Angular. Si una página Angular tiene texto en inglés fuera de nombres
técnicos/props, es un hallazgo (salvo el contenido de ejemplo, ver abajo).

### Qué SÍ se traduce (igual criterio que React, ahora fijo en español)
Breadcrumb, título de página, descripción, título/descripción de cada
sección, labels de controles del playground, `description` de cada fila de
la tabla de propiedades, headers de la tabla de propiedades.

### Qué NO se traduce (queda en inglés siempre)
- Contenido de EJEMPLO dentro de una demo: nombres de muestra ("Alex Brown"),
  placeholders ("Enter your email"), texto de los snippets de código
  (`code="..."` / `[code]="miCodigoComputed()"`).
- Nombres técnicos de props, tipos TypeScript, y selectores de componente
  (`cs-button`, `[size]`, `DropdownItem`, etc.).
- El nombre del componente en sí (`Checkbox`, no "Casilla").

## Assets de fotos/imágenes de demo — usar los reales, nunca generar placeholders

Si React tiene assets reales en `public/` (ej. `public/avatars/avatar-1.jpg`
a `avatar-9.jpg`), copiarlos al `public/` de Angular y usarlos tal cual —
nunca generar un placeholder sintético (un círculo de color con SVG data URI,
etc.) cuando el asset real ya existe y se puede copiar. Error real corregido
a mitad de sesión: la página de Avatar usaba círculos de color generados en
vez de las 9 fotos reales que ya estaban en el repo React.
