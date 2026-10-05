# Patrón de Storybook (ui-components)

El proyecto Angular tiene Storybook configurado (`.storybook/main.ts`,
glob `../projects/comsatel-ds/src/lib/**/*.stories.ts`) publicado en
Chromatic vía GitHub Actions en cada push a `main`
(`.github/workflows/chromatic.yml`). Cada componente de librería tiene su
propio `<nombre>.stories.ts` junto a `<nombre>.ts/html/css`.

**Storybook nunca es el lugar donde se decide o se estrena un patrón,
variante o composición nueva de un componente.** Es un espejo de lo que ya
existe y está verificado en `src/app/pages/*-demo/` (la app de
documentación Angular). Ver B11 en `SKILL.md`.

---

## Orden de trabajo al agregar o actualizar un `.stories.ts`

1. Confirmar que el patrón ya existe en la página `*-demo` real de Angular
   (o en el `.tsx`/`*PageContent.tsx` de React si Angular todavía no
   construyó ese componente). Si no existe, construirlo primero ahí
   siguiendo `page-pattern.md` — nunca inventarlo directo en el story.
2. Verificar ese patrón en el navegador (Angular dev server), como exige
   el protocolo RECONSTRUIR normal.
3. Recién entonces escribir o actualizar el `.stories.ts`, reflejando
   exactamente esa composición — mismos valores de ejemplo cuando sea
   razonable (ayuda a detectar si el story se desvió del real).

**Distinción clave — qué SÍ es cobertura técnica normal (no es inventar):**
mostrar en un story todos los valores reales de un `@Input()` que ya está
documentado en la tabla de propiedades del componente (los 4 tamaños de un
botón, las 9 variantes, los 3 valores de un enum). Eso es documentación de
superficie de API, esperable en cualquier Storybook.

**Qué NO es cobertura técnica, es inventar un patrón:** combinar props de
formas que el sistema real nunca combina, o usar un slot/prop en un
contexto distinto al que la página real documenta. Ejemplos reales
revertidos en sesión (2026-09-07): un botón con ícono a ambos extremos a
la vez (React/Angular solo documentan ícono antes O después, nunca ambos
juntos en el mismo botón), un botón solo-ícono sin texto (no existe en
ningún lado del sistema), `showPlaceholderIcon=false` de Avatar mostrado
como variante suelta de Avatar (es de uso interno exclusivo de
CardBanner/FeatureSpotlightCard, nunca se documenta como opción de Avatar
por sí solo), `embedded`/`fullWidth` de InputDropdown como demos sueltas
(solo existen compuestos dentro de InputGroup).

---

## Gotcha real: `NG0304` al usar un componente ajeno dentro de un `template` de story

Cuando un story define su propio `render: () => ({ template: '...' })` con
markup que referencia un componente Angular DISTINTO al `meta.component`
(por ejemplo `<cs-icon>` dentro de un story de `cs-button`, o
`<cs-button>` dentro de uno de `cs-tooltip`), Angular falla en
compilación con:

```
NG0304: 'cs-icon' is not a known element (used in the 'StorybookWrapperComponent' component template)
```

Esto pasa porque Storybook envuelve cada story en un componente sintético
propio (`StorybookWrapperComponent`) que NO hereda los `imports` del
componente real — aunque `Button`/`Tooltip`/etc. sí importen `Icon` en su
propio `@Component`, ese import no llega al wrapper. `.storybook/preview.ts`
tampoco declara imports globales.

**Fix:** agregar `decorators: [moduleMetadata({ imports: [...] })]` en el
`meta` del story, listando cada componente Angular extra usado en
CUALQUIER template de ese archivo (no solo el del `render` por defecto):

```ts
import { moduleMetadata } from '@storybook/angular';
import { Icon } from '../icons/icon';

const meta: Meta<Button> = {
  component: Button,
  decorators: [moduleMetadata({ imports: [Icon] })],
  // ...
};
```

Casos reales que lo necesitaron: `button.stories.ts` (Icon),
`tooltip.stories.ts` (Button + Icon), `badge.stories.ts` (Icon),
`input-group.stories.ts` (InputGroupAddon, InputGroupInput,
InputGroupText, Icon, InputDropdown, Button), `preview-card.stories.ts`
(Icon). Un componente cuyo PROPIO template ya usa `<cs-icon>` internamente
(ej. `Banner`, `Calendar`) NO necesita esto para renderizarse a sí mismo —
el gotcha solo aplica a markup EXTRA que el story agrega alrededor del
componente.

**Verificación real, no asumida:** los errores de compilación de Angular
en Storybook solo aparecen limpios en una pestaña del navegador nueva —
Storybook precompila TODOS los archivos de stories para armar el sidebar,
así que un error en un archivo contamina la consola de cualquier story que
se esté viendo en esa pestaña, incluso una sin relación. Abrir una pestaña
nueva antes de leer la consola para no confundir errores viejos con
nuevos (mismo principio que `environment-issues.md` punto 4, aplicado a
Storybook).

---

## Convención de `title` en el `meta`

- Componente de nivel raíz: `'Componentes/<Nombre>'` (ej.
  `'Componentes/Button'`).
- Sub-componente que solo se usa compuesto dentro de otro (Avatar Group,
  Avatar Label, Avatar Add Button, Dropdown Item, Input Dropdown, Card
  Banner, Action Card, etc.): `'Componentes/<Familia>/<SubNombre>'` (ej.
  `'Componentes/Avatar/AvatarGroup'`, `'Componentes/Card/ActionCard'`).
  Esto agrupa la familia completa bajo una sola carpeta en el sidebar de
  Storybook, igual que la página `*-demo` los agrupa bajo un solo
  `<nombre>-page`.

---

## Cuándo SÍ escribir `args`-driven directo vs. `render` custom

- Si el componente recibe su contenido vía `@Input()`/`@Output()` puros
  (sin `<ng-content>`), dejar que Storybook infiera el markup solo desde
  `args` (sin `render` en el `meta`) — ejemplo: `Checkbox`, `Toggle`,
  `Input`, `Calendar`, `DateTimePicker`.
- Si el componente usa `<ng-content>` para su contenido principal (label,
  trigger, cuerpo), el `meta` necesita su propio `render: (args) => ({
  props: args, template: '...' })` — ejemplo: `Button`, `Badge`, `Banner`,
  `Tooltip`. Documentarlo con el mismo comentario que ya usan esos
  archivos ("usa `<ng-content>` ... por eso cada story define su propio
  `template`").
