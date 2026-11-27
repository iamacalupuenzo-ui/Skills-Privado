# Tokens generados y roles de color accesibles

## De dónde salen los tokens

`lib/src/tokens/cs_tokens.g.dart` es **generado**: no se edita a mano. Lo escribe
`tool/generar_tokens.mjs` (Node 24 o superior, importa los archivos TypeScript de Angular
directamente) a partir de `projects/comsatel-ds/tokens/src` de `ui-components`:

- `all-tokens.data.ts` (colores y medidas, claro y oscuro) y `typography.ts` (estilos de texto).
- `tokens.css`, para completar los colores que el catálogo de tokens no trae (secundarios, de mapa, bordes de layout). El generador cruza las fuentes y falla si no coinciden.

Búsqueda de la fuente, en este orden: la variable `CS_TOKENS_FUENTE`, la carpeta hermana `../ds-fuente`
(una copia de `ui-components` en `develop`, sin rama propia) y `../ui-components`. El generador imprime de
qué commit lee. **La fuente correcta es `develop`**: una copia en una rama vieja trae otra paleta y otra
tipografía y el resultado sale equivocado.

Comandos:

- `node tool/generar_tokens.mjs` regenera el archivo y lo formatea con `dart format`.
- `node tool/generar_tokens.mjs --check` no escribe: falla si el archivo publicado difiere de lo que saldría hoy.

Reglas del generador: los nombres que empiezan con número llevan una `x` (`2xl` pasa a `x2xl`); los z-index no se
generan (Flutter ordena por el árbol de widgets); un valor con formato desconocido hace fallar el generador.

## Cómo se usan

- Colores: `context.cs.textBaseDefault` (`CsColors`, una `ThemeExtension` del tema).
- Medidas: `CsPadding`, `CsGap`, `CsSize`, `CsRadius`, `CsOpacity`.
- Movimiento y sombras: `CsDuration`, `CsEasing`, `CsShadow`.
- Texto: `CsTextStyles` (Manrope en títulos y Public Sans en contenido, empaquetadas en `fonts/`).

## Roles accesibles `...Aa`

Los tokens de Angular no cumplen AA en varios puntos, sobre todo en oscuro (grises de apoyo, placeholders,
texto de marca, bordes de campo, rellenos de éxito, advertencia y peligro con texto blanco). En vez de tocar
Angular, la biblioteca suma **21 roles** en `tool/roles_accesibles.json`, que se agregan a `CsColors`:

- Texto: `textSubtleAa`, `textBrandAa`, `textDangerAa`…
- Bordes de control: `borderControlAa`, `borderControlHoverAa`.
- Rellenos con su texto: `fill*Aa` y `onFillAa`.

Cada rol declara un **contrato de contraste** (texto 4,5:1; íconos y bordes de control 3:1) contra los fondos
donde se usa, en claro y oscuro. **El generador falla si un contrato no se cumple.** Cuando se corrija el
modo oscuro de Angular, los roles pueden volver a apuntar al token.

## Auditoría de contraste

`test/contraste_test.dart` recorre el árbol real de cada componente (texto, íconos y bordes de control) en reposo,
hover, presionado y foco, en claro y oscuro, y mide el contraste contra su fondo. Incluye una prueba del detector
(un caso que debe fallar a propósito). Un elemento deshabilitado (opacidad menor a 1) queda exento.

Al agregar un componente nuevo, se suma a esa prueba. Si la prueba encuentra hallazgos, se corrige el rol o el
componente; no se excluye el componente.
