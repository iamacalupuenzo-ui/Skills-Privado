# Uso del Design System en un producto

Fuente de verdad: el `AGENTS.md` y las guías (`guidelines/`) de `ui-components`, y `adsa-cli` (`npx adsa-cli search "<qué necesitas>"` y `docs <componente>`). No leer tipos de `node_modules` ni importar hábitos de shadcn, MUI o Radix: este sistema tiene sus nombres.

## Imports y versión

- `import { Button } from '@comsatel/ui-components/button'` (un subpath por componente). Nunca `projects/comsatel-ds/src/...`.
- Los iconos salen del registro del sistema (`@comsatel/ui-components/icons`); ni una segunda librería ni una carpeta `components/ui` copiada.
- La versión se fija **exacta** en `package.json` y es la misma en el Shell y en cada micro UI de su familia.

## Estilos

- Color, espaciado, radio, tipografía, sombra, movimiento y `z-index` salen de tokens. Escala de espaciado: gap y padding `2xs…4xl` (2, 4, 6, 8, 12, 16, 20, 24, 32 px; padding sigue hasta 6xl: 40, 48). Para ancho o alto fijos, `--layout-size-*`.
- Un valor que no existe como token se pregunta, no se inventa. Un cálculo con tokens (`calc(var(--layout-size-3xl) * 2)`) es aceptable; un `px` suelto, no.
- Sin `::ng-deep`, `!important` ni estilos globales para tocar el interior de un componente del DS. La excepción documentada es una regla global del Shell con un comentario que explique por qué (por ejemplo, `scrollbar-gutter`).

## Componentes

- Nada de `<select>` nativo: `cs-input-dropdown` (selección simple en formularios) o `cs-select` (múltiple).
- Casi todos los componentes son controlados: los eventos (`closed`, `dismiss`, `valueChange`) solo avisan; cerrar, ocultar o actualizar el valor lo hace el producto.
- Propiedades booleanas y numéricas **con binding** (`[disabled]="true"`). Escritas como atributo, Angular pasa texto y el componente las ignora.
- Tamaño de campo: el `size` del `cs-form-field` debe coincidir con el `fieldSize` del control.
- `cs-tag` admite `rounded`; `cs-radio` tiene `size` sm/md/lg; `cs-toast` con acción usa `appearance="subtle"` si la acción debe verse como enlace.

## Cuando falta algo

1. Detenerse y preguntar (no aproximar con un `div`).
2. Si se confirma que no existe, construirlo en el producto con una API pensada para migrar: entradas (`value`, `label`, `disabled`), una salida (`valueChange`), solo tokens y sin depender del servicio de la pantalla.
3. Registrar la brecha: `npm run gap:report -- "Qué falta" "Qué usar en su lugar" "Por qué o estado"` en `ui-components` (modo `BRECHA` de `flujo-ds`), en una rama aparte.
4. Entra al DS por olas cuando el diseño está validado en QA; entonces se borra la copia del producto.

## Accesibilidad que se exige siempre

Foco visible con `--color-border-focused`; nombre accesible en todo control; el estado no depende solo del color (texto o ícono además); regiones `polite` con espera para anunciar cambios; objetivos de teclado completos y alternativa a toda interacción de arrastre.
