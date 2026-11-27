# El generador de escenas: `scripts/illustrations/scenes.mjs`

Vive en `ui-components`. Calcula la geometría una vez con el kit del skill `anatomy` y
escribe un archivo de plantilla Angular por escena en
`projects/comsatel-ds/illustrations/src/scenes/<nombre>.html`. Esos archivos llevan la
cabecera «Generado por scripts/illustrations/scenes.mjs … no se edita a mano»: cualquier
cambio se hace en el script y se regenera.

```bash
ANATOMY_DIR="<carpeta del skill anatomy instalado>" node scripts/illustrations/scenes.mjs
```

Sin `ANATOMY_DIR` busca `~/.claude/skills/anatomy` (o `$CLAUDE_HOME/skills/anatomy`). En
Orca la carpeta real está en el perfil de Claude:
`%APPDATA%/orca/claude-profiles/<perfil>/home/skills/anatomy`. Imprime el peso de cada
escena; las que no cambiaste deben pesar lo mismo que antes.

## Módulos del kit que usa

| Import | Para qué |
| :-- | :-- |
| `k` = `kit/iso-kit.mjs` | Cámara (`fitProjection`, `iso`, `axisVector`), losas (`slabOf`, `cylinder`), líneas sobre caras (`segment`, `lineOnTop`, `sideSeam`, `planOutline`, `insetPlan`, `corners`, `sideRing`), sombra (`haloOf`) |
| `G` = `kit/lathe.mjs` | Piezas redondas en cualquier eje: `frameAlong`, `solidOf`, `ringBand`, `sphereOf`, `arcOf`, `circleOf`, `pointOf`, `radialOf`, `viewOf` |
| `T` = `kit/tube.mjs` | Cables y tubos: `tubePieces` |

## Helpers propios del generador

| Helper | Qué hace |
| :-- | :-- |
| `solid(paths, pieza, inner)` | Envuelve un sólido del kit en `<g class="sc-<pieza>">` con relleno, caras, tapa, pliegue, `inner` (costuras sobre las caras) y contorno al final. |
| `line(d, clase)` / `dots(puntos, clase, r)` | Trazos y tornillos. `line` devuelve vacío si `d` está vacío. |
| `poly(puntos3D, P)` | Polígono cerrado sobre una cara: vidrios, placas, flechas pintadas, el espacio marcado. Pon la cara 0,1–0,2 por fuera del sólido para que no parpadee. |
| `halo(d)` + `haloFilter` | Sombra suave con un `<filter>` de id propio (`[attr.id]="haloId"`). El id lo da `SceneBase` por copia, para que dos escenas en la misma página no compartan filtro. Nunca uses blur de CSS: sería un px suelto. |
| `tube(puntos, radio, P, pieza)` | Cable con brillo y sombra. |
| `planeMatrix(P, origen)` | Matriz del plano vertical xz en un punto: dibuja círculos exactos de rueda y hace girar rayos dentro de ese plano. |
| `tireOf(x, ya, yb, r, z)` | Llanta con eje en y (vehículo orientado en x): cara de atrás, banda tangente y cara de adelante. Depende de `P_` global. |
| `planeMatrixOf(P, origen, eje)` / `tireAlongX(P, y, xa, xb, r, z)` | Lo mismo con el eje en x (vehículo orientado en y, como las furgonetas estacionadas). |
| `swing(inner)` | Grupo con un vaivén lento (`translate`, 5 s, `keySplines`). La lupa y su sombra usan dos `swing` iguales. |
| `template({ W, H, body }, etiqueta)` | Arma el `<svg>` con `role="presentation"`, `aria-hidden="true"` y la cabecera de archivo generado. |

## Receta de una escena nueva

Cada escena es una función que devuelve `{ W, H, body }` y se registra en la lista
`scenes` al final del script. Orden de pintado: atrás hacia adelante, abajo hacia arriba.

```js
function lot() {
  const W = 420, H = 300;
  const LOT = { x: -112, y: -62, w: 224, d: 124, r: 14 };
  const LENS = [90, 4, 42];
  const P = k.fitProjection([...k.boxCorners(LOT, -7, 0), [LENS[0], LENS[1], LENS[2] + 26]], W, H, { pad: 14, azimuth: 38 });
  const at = (p) => k.iso(p, P);
  const out = [haloFilter];

  // 1. Base: sombra, losa, bordillo y tornillos
  out.push(halo(k.haloOf(LOT, -7, 7, P)));
  out.push(solid(k.slabOf(LOT, -7, 7, P, 10, 1.2), 'road'));
  out.push(line(k.planOutline(k.insetPlan(LOT, 6), 0, P, 10), 'sc-line-faint'));
  out.push(dots(k.corners(LOT, 12).map(([x, y]) => at([x, y, 0])), 'sc-screw', 1));

  // 2. Lo pintado en el piso (líneas, flechas, el lugar marcado)
  // 3. Objetos de atrás hacia adelante; cada vehículo: ruedas lejanas, chasis, cuerpo, detalles, ruedas cercanas
  // 4. El protagonista al final, con su sombra en el piso
  return { W, H, body: out.join('\n') };
}

const scenes = [
  // …
  ['fleet-no-results.html', template(lot(), 'Estacionamiento con Unidades que no coinciden y la lupa sobre el espacio vacío.')],
];
```

Patrones que ya resolvieron problemas:

- **Pieza que mira a quien observa** (lupa): `G.frameAlong(centro, [v[0] * 0.9, v[1] * 0.9, v[2] - 0.7])`
  con `v = G.viewOf(P)`. Para que el mango salga abajo a la derecha en pantalla, recorre
  72 ángulos con `G.pointOf` y quédate con el de mayor `0,6·dx + 0,8·dy` en pantalla.
- **Brillo de un vidrio**: arma el arco con `G.pointOf` (13 puntos) en el ángulo opuesto al
  mango. `G.arcOf` solo dibuja la parte que mira a la cámara y puede salir casi vacío.
- **Señal de una antena**: arcos en pantalla alrededor de la punta (`A r r 0 0 1`), no en 3D.
- **Objeto que debe verse completo** (enchufe y tomacorriente): deja una separación
  real entre ambos en x, pon la cara útil hacia +x y verifica a 2× que no se tapen.

## Clases de las escenas

Las clases son `sc-*` para las isométricas y `fl-*` para la plana. Una clase nueva va en
`scenes.css`, en la sección de su escena, con un comentario de una línea que diga qué es.
