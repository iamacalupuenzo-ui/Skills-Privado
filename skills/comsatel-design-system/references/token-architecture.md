# Arquitectura de tokens — Comsatel Design System (Angular)

Mapa de dónde vive cada tipo de token y cómo se resuelve, en el proyecto Angular
(`C:\Users\emacalupu\Documents\00 - Proyectos Enzo - V1\ui-components`). Todo cambio de token pasa por uno de
estos archivos — nunca por un valor hardcodeado en un componente.

Los VALORES son idénticos a los del sistema React (`Sistema-de-dise-o-Comsatel`)
porque `tokens.css` se copió 1:1 de ahí — pero React ya NO es la fuente de
verdad de estos valores desde que ambos proyectos existen por separado. Si algún
día divergen, el valor correcto es el que está en el `tokens.css` de ESTE
proyecto Angular, nunca "lo que dice React".

## Colores, radios, sombras, layout, motion, elevación — `projects/comsatel-ds/src/styles/tokens.css`

Variables CSS puras, en tres bloques por tema: `:root, [data-theme="light"]`,
`[data-theme="dark"]`, `[data-theme="glass"]`. Familias principales:

- `--color-background-*` (base, selected, disabled, neutral-{subtlest..strongest},
  brand-*, danger-*, warning-*, success-*, cada uno con variante `-hover`/`-pressed`)
- `--color-text-*` (base-{subtlest..boldest}, inverse, selected, disabled, brand-*,
  danger-*, warning-*, success-*, link-*)
- `--color-border-*` (default, selected, disabled, focused, divider, neutral-*, brand-*,
  danger-*, warning-*, success-*)
- `--color-icon-*`, `--color-accent-*`, `--color-status-*`, `--color-interaction-*`
- `--radius-*` (none, xs=2px, sm=4px, md=6px, lg=8px, xl=10px, 2xl=12px, full=9999px)
  — theme-independent, definido una sola vez fuera de los bloques de tema.
- `--shadow-*` (xs, sm, md, lg, xl) — usar SIEMPRE estos, nunca un valor de sombra
  suelto o inventado.
- `--layout-padding-*`: none=0, 2xs=2, xs=4, sm=6, md=8, lg=12, xl=16, 2xl=20, 3xl=24,
  4xl=32, 5xl=40, 6xl=48 (px)
- `--layout-gap-*`: misma escala, hasta 4xl=32
- `--layout-size-*`: 2xs=16, xs=20, sm=24, base=32, md=40, lg=48, xl=56, 2xl=64, 3xl=80
  — pensada para dimensiones de CONTROLES/cajas completas (avatares, botones cuadrados),
  no para el tamaño de un ícono individual dentro de un control.
- `--layout-border-*`: none=0, thin=1, thick=2, thicker=4
- `--motion-duration-*`: fast=100ms, leaving=150ms, medium=200ms, entering=250ms, slow=350ms
- `--motion-easing-*`: default, enter, exit, spring (cubic-bezier)
- `--elevation-z-index-*`: base=0, raised=1, dropdown=100, sticky=200, modal=300,
  overlay=400, toast=500, tooltip=600 — **jerárquico a propósito**: un tooltip debe
  ganarle a todo lo demás. Nunca un z-index arbitrario donde corresponda uno de estos.

**Huecos conocidos de la escala** (no hay token exacto — es correcto dejarlos
explícitos con un comentario, nunca forzarlos a redondear):
- 10px (ej. Badge `lg` padding horizontal, Toggle/Checkbox `gap` del label — 10px)
- 14px en contexto de tamaño de ícono (Dropdown `sm`)
- 1px (micro-ajustes de `gap` entre label y description en Checkbox/Toggle)

Al portar un componente nuevo desde React, verificar cada valor de padding/gap/
tamaño contra esta escala ANTES de escribirlo en el `.css` de Angular — no
copiar el valor Tailwind de React sin convertirlo a `var(--layout-*)` primero
(ver `audit-checklist.md`, C1).

## Tipografía — ÚNICA fuente: `projects/comsatel-ds/src/lib/tokens/typography.ts`

Puerto TypeScript de `typography.mjs` (React). Genera además
`projects/comsatel-ds/src/styles/typography-tokens.css` — GENERADO por un
script tsx que importa el `typography.mjs` REAL de React, nunca transcrito a
mano. Si `typography.mjs` cambia en React, regenerar `typography-tokens.css`
con el mismo script, no editarlo directo.

```ts
export const primitiveFonts = {
  family: { primary: '"Manrope", sans-serif', secondary: '"Public Sans", sans-serif' },
  weight: { 100: '100', ..., 900: '900' },
  size: { '2xs': 10, micro: 11, xs: 12, ui: 13, sm: 14, md: 16, lg: 18, xl: 20,
           '2xl': 24, '3xl': 28, '4xl': 32, '5xl': 36, '6xl': 40, '7xl': 48, '8xl': 56, '9xl': 64 },
  letterSpacing: { xs: '-0.02em', sm: '-0.01em', md: '0em', lg: '0.01em', xl: '0.02em' },
};

export const weights = { regular: '400', accent: '500', emphasis: '600', bold: '700' };

export const textStyles = {
  'heading/display': { primitive: '7xl', ratio: 1.25, weight: 'bold' },     // 48px
  'heading/large':   { primitive: '5xl', ratio: 44/36, weight: 'emphasis' }, // 36px
  'heading/medium':  { primitive: '3xl', ratio: 36/28, weight: 'emphasis' }, // 28px
  'heading/small':   { primitive: '2xl', ratio: 32/24, weight: 'emphasis' }, // 24px
  'content/feature':   { primitive: 'xl', ratio: 1.5, weight: 'regular' },  // 20px
  'content/highlight': { primitive: 'lg', ratio: 1.5, weight: 'regular' },  // 18px
  'content/body':      { primitive: 'md', ratio: 1.5, weight: 'regular' },  // 16px
  'content/caption':   { primitive: 'sm', ratio: 1.5, weight: 'regular' },  // 14px
  'content/ui':        { primitive: 'ui', ratio: 1.5, weight: 'regular' },  // 13px
  'content/note':      { primitive: 'xs', ratio: 1.5, weight: 'regular' },  // 12px
  'label/small': { primitive: 'micro', ratio: 16/11, weight: 'accent' },   // 11px
  'label/micro': { primitive: '2xs', ratio: 1.4, weight: 'accent' },        // 10px
};
```

**Ya NO es una divergencia respecto a React — es tipografía compartida:**
`family.secondary` usa `"Public Sans"`. Nació como excepción solo de Angular
(2026-09-06, comparando x-height/ancho de Public Sans, Inter, Geist, Inter
Tight, IBM Plex Sans y Satoshi — Public Sans tiene x-height más baja, 0.54
contra 0.58 de Inter, se ve más compacta a igual tamaño en px), pero el
usuario revirtió esa separación el 2026-09-07 y llevó Public Sans también al
`typography.mjs` de React, para que ambas plataformas usen exactamente la
misma tipografía. El resto de la escala (tamaños, pesos, ratios de
interlineado, `family.primary`=Manrope) ya era idéntico a React.

### La función `textStyle(name, weight?)`

Devuelve un objeto de estilo ya resuelto a tokens (mismo shape que React, pero
en camelCase TS en vez de objeto de estilo React — se usa igual vía binding
`[ngStyle]` o `[style.propiedad]` en el template):

```ts
textStyle('content/caption', 'accent')
// → { fontFamily: 'var(--font-family-content)', fontSize: 'var(--font-size-content-caption)',
//     lineHeight: 'var(--font-line-height-content-caption)', fontWeight: 'var(--font-weight-accent)',
//     letterSpacing: 'var(--font-letter-spacing-content)' }
```

Úsala cuando el tamaño debe variar dinámicamente (ej. según una `@Input() size`
del componente, vía un mapa `Record<Size, StyleName>` + `[ngStyle]="labelStyle"`
en el getter). Cuando el tamaño es fijo, una regla `.css` normal con
`font-size: var(--font-size-content-caption); line-height: var(--font-line-height-content-caption);`
sirve igual — **misma fuente de datos**, nunca diverge.

**Regla que rompió el estándar una vez y hay que verificar siempre:** toda
regla `.css` que fija `font-size` a un token DEBE fijar también su
`line-height` par (`--font-line-height-<mismo-estilo>`), nunca solo el
tamaño — si falta, el navegador usa su line-height por defecto en vez del
token real, y el texto queda con una altura de línea distinta a la del resto
del sistema aunque el tamaño en px sea idéntico. Bug real encontrado en
`doc-page.css`: `.section__title` tenía `font-size: var(--font-size-heading-small)`
(24px) sin `line-height`, dando ~28.8px en vez de los 32px reales del token
`--font-line-height-heading-small`.

### `componentTypography` — registro de qué estilo usa cada componente

```ts
export const componentTypography = {
  button:  { xs: 'content/note', sm: 'content/ui', md: 'content/caption', lg: 'content/body' },
  badge:   { sm: 'label/micro', md: 'label/small', lg: 'content/note' },
  avatar:  { xs: 'label/micro', sm: 'content/note', md: 'content/caption', lg: 'content/highlight', xl: 'content/feature' },
  banner:  { title: 'content/caption', body: 'content/caption', action: 'content/caption' },
  tooltip: 'label/small',
  calendar: { header: 'content/note', weekday: 'label/small', day: 'content/note' },
} as const;
```

Al portar un componente nuevo desde React, si no tiene entrada acá, es señal
de que su tipografía nunca se decidió formalmente — proponer una entrada y
agregarla al mismo tiempo que se construye el componente. Ya incluye la
entrada `calendar` preparada para cuando se porte ese componente.

## Íconos — DOS catálogos distintos, no confundir

- **Registro curado interno** — `projects/comsatel-ds/src/lib/icons/icon-registry.ts`.
  Un `Record<string, string>` con el `<path>`/`<circle>`/etc. interno de cada
  ícono (paths de Lucide 24×24, stroke-width 2), consumido vía
  `<cs-icon name="..." [size]="n">`. Es el equivalente Angular del catálogo
  curado de React (`src/components/ui/icons/index.tsx`) — mismo criterio: un
  único lugar del que salen los íconos que usan los COMPONENTES internos
  (Badge, Banner, Avatar, Dropdown, etc.), nunca un ícono suelto importado
  directo en un componente.
- **Catálogo completo de exploración** — la página de documentación de Íconos
  hace `fetch('/icons/lucide/catalog.json')` en runtime contra un catálogo de
  ~1531 íconos copiado de `public/icons/lucide/` (React) a
  `public/icons/lucide/` (Angular), más `public/icons/lucide.zip` para la
  descarga completa. Sirve para BUSCAR y copiar cualquier ícono de Lucide,
  no para el registro curado — nunca intentar meter los 1531 íconos dentro de
  `icon-registry.ts`, son dos sistemas con propósitos distintos (uno interno
  y pequeño, otro de catálogo público y grande).

Al agregar un ícono nuevo al registro curado: copiar el path interno del SVG
de `public/icons/lucide/<id>.svg` (mismo id que usa React) y agregarlo a
`ICON_REGISTRY` — no crear un componente nuevo por ícono, no usar una librería
de íconos externa.

## Puente a Tailwind — NO APLICA en Angular

React genera clases `.text-heading-large` etc. vía un plugin de Tailwind que
importa `typography.mjs` directo. Angular no usa Tailwind — el equivalente es
una regla `.css` normal (font-family/font-size/line-height/color) por cada
elemento de texto, o el binding dinámico `[ngStyle]="textStyle(...)"` cuando
el tamaño varía por prop. Si aparece una clase o valor de tamaño de fuente que
NO sea uno de los doce `textStyles` (por ejemplo un `font-size: 13px` suelto
sin pasar por `--font-size-content-ui`), es tipografía fuera del sistema —
repórtalo como hallazgo (ver C1/C2 en `audit-checklist.md`).
