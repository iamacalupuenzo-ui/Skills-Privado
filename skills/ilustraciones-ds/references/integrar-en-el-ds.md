# Integrar una escena en el DS y llevarla a los productos

Todo ocurre en el repositorio `ui-components` (worktree de trabajo actual:
`D:/0001 - Proyectos Generales/01 - Proyectos Trabajo/ds-avatar-tooltip`, rama
`feature/ilustraciones-escenas`). Comprueba la rama antes de tocar nada.

## 1. Componente

| Archivo (`projects/comsatel-ds/illustrations/src/`) | Cambio |
| :-- | :-- |
| `scenes/<nombre>.html` | Lo escribe el generador. |
| `scenes/scenes.css` | Clases nuevas, solo primitivas. Actualiza el comentario de cabecera con el nombre nuevo. |
| `scenes/scenes.ts` | Un componente interno por escena que extiende `SceneBase`: selector `cs-illustration-<nombre>`, `OnPush`, `templateUrl` y `styleUrl: './scenes.css'`, con JSDoc de una línea. |
| `illustration.ts` | Importar la escena; sumar el nombre al tipo `IllustrationName`, a `ILLUSTRATION_NAMES` y a `SceneIllustrationName`; sumarla a `imports`; ampliar el getter `scene`; describirla en el JSDoc del tipo. |
| `illustration.html` | Un `@case ('<nombre>') { <cs-illustration-<nombre> /> }` dentro del `@switch` de escenas. |

## 2. Catálogo y guía

- `src/app/pages/illustrations-demo/illustrations-page.ts`: una entrada en `SCENES`
  (título, descripción y pie de foto reales) y el nombre en `ILLUSTRATED`.
- `illustrations-page.html`: si la escena lleva una acción, súmala al playground
  (Reintentar para errores, Limpiar filtros para sin resultados) y actualiza la
  introducción de «Escenas ilustradas» (cuántas son y qué se mueve).
- `guidelines/illustrations.md`: fila en «Cuál usar» y menciones en «Escenas ilustradas
  (tercera familia)» (Color, Movimiento, Uso). Mantén «Disponible desde» en la versión
  que Enzo decida.

## 3. Prueba

`src/app/illustration.spec.ts`, bloque «Illustration: escenas ilustradas»:

- Sumar el nombre y su `viewBox` a la tabla del primer `it.each`.
- Un `it` propio que compruebe las piezas que cuentan la metáfora (por ejemplo, dos
  `.sc-filtered`, `.sc-target` y `.sc-lens`) y lo que no debe estar (sin `.sc-alert` en
  una escena que no es error).

## 4. Controles (todos en la raíz de `ui-components`)

```bash
npm run docs:props && npm run docs:a11y && npm run docs:states
npm run check:docs              # debe salir con código 0
npm run check:component-tokens  # sin valores sueltos
npm run build:lib
npx ng test comsatel-ds-angular --watch=false --include src/app/illustration.spec.ts
```

La prueba importa `@comsatel/ui-components`, que apunta a `dist/`: corre `build:lib`
antes. `build:lib` falla con EBUSY si hay un `ng serve` del 4200 corriendo.

## 5. Ver en el catálogo (4215)

El catálogo usa dependencias preempaquetadas por Vite: después de `build:lib` hay que
matar el servidor, borrar `.angular/cache` y levantarlo de nuevo con
`npx ng serve --port 4215`. Comprueba que aparezca en
`http://localhost:4215/components/illustrations#ilustradas`.

## 6. Probar en los productos sin publicar

El DS no se publica para probar (es de César). Se copia el `dist` sobre los productos:

1. Detén los servidores 4202 (microui-monitoring) y 4401 (web-flotas); si no, la copia
   falla con «Device or resource busy».
2. Copia `dist/comsatel-ds/.` dentro de `node_modules/@comsatel/ui-components/` de cada
   producto. Si la carpeta queda bloqueada, copia el contenido encima en vez de borrarla.
3. Pon la versión `1.17.0-pre.157` en ese `package.json` copiado (el shell exige la misma
   versión en todas las piezas).
4. Borra `node_modules/.cache/native-federation` y `.angular/cache` en ambos.
5. Levanta `npx ng serve --port 4202` y `npx ng serve --port 4401`.
6. En el producto, usa la escena por nombre: `<cs-empty-state illustration="<nombre>" …>`,
   y ajusta su spec para que busque `cs-illustration-<nombre>`.

Un `npm ci` en el producto borra la copia y vuelve al DS publicado.

## 7. Git

Commits locales permitidos cuando el cambio está verificado. Nunca push, rama remota ni
MR sin que Enzo lo pida: son propuestas suyas. Los cambios en los productos se dejan sin
commit salvo pedido expreso.
