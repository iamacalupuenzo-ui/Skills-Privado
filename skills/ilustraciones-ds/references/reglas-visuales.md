# Reglas visuales de las escenas ilustradas

La calidad de referencia es `fleet-load-error`. Cada escena nueva se compara contra ella
lado a lado antes de entrar al DS.

## Lienzo y cámara

- Isométricas: `viewBox="0 0 420 300"`. Se muestran a 240 px de ancho
  (`calc(var(--layout-size-3xl) * 3)` en `:host(.cs-illustration--scene)`);
  `--cs-illustration-size` lo cambia. A 200 px se pierde detalle: no bajar de 240.
- Cámara con `fitProjection(puntos, 420, 300, { pad: 14, azimuth: 38 })` (el mapa usa 40).
  Los puntos que pasas a `fitProjection` deciden el encuadre: incluye la losa base y el
  punto más alto de la escena (la punta de la antena, la parte de arriba de la lupa).
- Base: una losa redondeada `{ x: -112, y: -62, w: 224, d: 124, r: 14 }` de 7 de alto,
  con sombra suave, bordillo inscrito y tornillos en las esquinas. Da unidad a la familia.
- Ejes: x a la derecha y abajo en pantalla, y a la izquierda y abajo, z hacia arriba.
  Las caras visibles son +x, +y y la tapa. Lo que debe verse de frente mira a +x o +y.

## Sólidos y sombreado

Cada sólido sale del kit con relleno, cuatro caras por orientación (0 la más oscura), tapa
clara, pliegue y contorno. La función `solid(paths, pieza)` del generador les pone las
clases `sc-fill`, `sc-shade-0..3`, `sc-top`, `sc-crease`, `sc-edge` dentro de `<g class="sc-<pieza>">`.

Cada pieza fija sus cinco tonos con variables en `scenes.css`:

```css
.sc-body {
  --sc-fill: var(--color-primitive-brand-100);
  --sc-top: var(--color-primitive-brand-050);
  --sc-0: var(--color-primitive-brand-400);
  --sc-1: var(--color-primitive-brand-300);
  --sc-2: var(--color-primitive-brand-200);
  --sc-3: var(--color-primitive-brand-100);
  --sc-edge: var(--color-primitive-brand-900);
  --sc-crease: var(--color-primitive-brand-300);
}
```

Una pieza nueva copia este bloque con otra escala y otro nombre. Las piezas de líneas
(costuras, nervaduras, brillos) llevan su clase propia con `fill: none` y un `stroke`.

## Color: solo primitivas

| Uso | Escala | Clase de ejemplo |
| :-- | :-- | :-- |
| Protagonista y lo que sigue la marca del Distribuidor | `--color-primitive-brand-*` | `.sc-body`, `.sc-grip`, `.sc-target` |
| Estructura, acero, llantas, pista, objetos apagados | `--color-primitive-gray-*`, `white` | `.sc-road`, `.sc-steel`, `.sc-van` |
| Lo que falla, solo en escenas de error | `--color-primitive-danger-*` | `.sc-alert`, `.sc-signal`, `.sc-plug` |
| Detalles de ambiente (cono, faros) | `--color-primitive-warning-*` | `.sc-cone`, `.sc-lamp` |
| Naturaleza del mapa | `--color-primitive-success-*` | `.sc-park`, `.sc-tree` |

No usar tokens semánticos (`--color-background-brand-*`, `--color-text-*`): en el tema
claro `--color-background-brand-strongest` es casi negro y la carrocería sale oscura. Las
escenas son objetos con color propio y no cambian con el tema oscuro; dilo en la guía.

`check:component-tokens` prohíbe hex, px y ms sueltos en el CSS del componente. Los
`stroke-width`, `opacity` y `stroke-dasharray` sin unidad sí pasan.

## Detalle

- Al menos 25 piezas por escena: tornillos, costuras, nervaduras, faros, parachoques,
  placa, espejo, topes de estacionamiento, flechas pintadas, cono.
- Cada pieza se apoya en otra y cada línea termina en un borde. Nada flota salvo lo que
  está pensado para flotar (la lupa) y lleva sombra en el piso.
- Un solo protagonista de color fuerte; lo demás en gris o marca suave.
- Revisa a 2× que no queden caras lisas grandes sin ningún detalle.

## Movimiento

- Animación SMIL dentro del SVG, siempre envuelta en `@if (animated) { … }`.
  `animated` es falso con `prefers-reduced-motion: reduce` (lo define `SceneBase`).
- Movimiento lento y que sume al relato: ruedas (`animateTransform rotate`, 0,9 s), carril
  (`stroke-dashoffset`, 0,9 s), señal que parpadea (`opacity`, 2,4 s), lupa que barre
  (`translate` con `keySplines`, 5 s).
- Lo que se mueve junto (la lupa y su sombra) usa el mismo `swing()` para no despegarse.
- Sin animaciones de CSS: los `ms` del CSS no pasan `check:component-tokens`.

## Peso

- Objetivo: menos de 30 KB por escena; tope 50 KB. `fleet-load-error` pesa 26 KB.
- Lo que más pesa: sólidos de revolución con sombreado suave (`smooth`) y muchos pasos.
  Usa `{ steps: 20, smooth: false }` en piezas pequeñas (mango, cono) y `{ steps: 48 }`
  en aros. Las llantas van con `tireOf`/`tireAlongX` (elipses exactas), no con `disc`.
- El generador imprime el peso de cada archivo; revísalo en cada corrida.
