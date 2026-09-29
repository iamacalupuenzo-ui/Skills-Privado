# Un punto de entrada por componente (desde 0.6.0)

Desde la versión 0.6.0, cada componente del Comsatel DS se publica en su propio
subpath, como Angular Material o PrimeNG:
`@iamacalupuenzo-ui/comsatel-ds/button`, `/table`, `/modal`… La raíz
`@iamacalupuenzo-ui/comsatel-ds` sigue exportando los mismos símbolos, pero ya no
contiene código: solo reexporta los subpaths. **Leer siempre** antes de agregar un
componente, mover una carpeta, cambiar un import entre componentes o tocar
`public-api.ts`.

Por qué existe: la librería se publicaba en un solo archivo y cualquier import traía
la librería entera. En FleetOperations, con imports por subpath, el tablero pasó de
860 a 641 kB al abrirse (medido con el mismo código y lockfile; detalle en
`docs/releases/0.6.0.md` del DS y `docs/spike-puntos-de-entrada/`).

## Dónde vive cada cosa

| Qué | Ruta |
| :-- | :-- |
| Fuentes de un componente | `projects/comsatel-ds/<componente>/src/` (`.ts`, `.html`, `.css`, `.stories.ts`, `.spec.ts`) |
| Configuración de la entrada | `projects/comsatel-ds/<componente>/ng-package.json` |
| API del subpath | `projects/comsatel-ds/<componente>/public-api.ts` |
| API de la raíz | `projects/comsatel-ds/src/public-api.ts` (solo reexporta) |
| Estilos globales | `projects/comsatel-ds/src/styles/` (`styles.css`, `tokens.css`, `typography-tokens.css`): siguen siendo globales, no son subpaths |
| Apoyo interno | `projects/comsatel-ds/shared/` (`radioDotSize`, `focus.css`, `selection-glyphs.css`): lo usan otras entradas; la raíz no lo reexporta y las apps no lo importan |

`projects/comsatel-ds/src/lib/` ya no existe (quedó vacío y git no guarda carpetas
vacías). En las referencias históricas de este skill, `projects/comsatel-ds/src/lib/<x>/`
equivale hoy a `projects/comsatel-ds/<x>/src/`.

## Agregar un componente nuevo

1. Crear `projects/comsatel-ds/<componente>/` con:
   - `ng-package.json`:

     ```json
     {
       "$schema": "../../../node_modules/ng-packagr/ng-package.schema.json",
       "lib": { "entryFile": "public-api.ts" }
     }
     ```

   - `public-api.ts` con un `export * from './src/<archivo>';` por archivo público.
   - `src/` con las fuentes. **ng-packagr exige que las fuentes estén dentro de la
     carpeta de la entrada** (error TS6059 de `rootDir`); un `public-api.ts` que
     apunte a `../src/lib/...` no compila.
2. Agregar en `projects/comsatel-ds/src/public-api.ts` la línea
   `export * from '@iamacalupuenzo-ui/comsatel-ds/<componente>';`.
   - Si el subpath expone algo solo para otras entradas (como los tokens internos
     de `/dropdown` que usan `select` y `column-manager`), la raíz lo reexporta con
     **lista explícita** (`export { A, B } from '…'` y `export type { T } from '…'`)
     para no ampliar la API pública.
3. Imports dentro de la librería:
   - Hacia otro componente: **siempre por subpath**
     (`import { Icon } from '@iamacalupuenzo-ui/comsatel-ds/icons'`), incluidos
     `import type`.
   - Nunca desde la raíz `'@iamacalupuenzo-ui/comsatel-ds'`: arma el ciclo
     raíz → subpath → raíz.
   - Nunca con ruta relativa que salga de la carpeta (`'../button/button'`): ng-packagr
     la rechaza o duplica la clase.
   - Dentro de la misma entrada, rutas relativas (`'./tag-tokens'`); un subpath no
     se importa a sí mismo.
4. Recursos de compilación (`@import` en CSS, `styleUrl`, `templateUrl`) pueden
   apuntar a otra carpeta con ruta relativa (por ejemplo `date-picker` usa
   `'../../date-range-picker/src/date-range-picker.css'`); no son subpaths.
5. Historias y specs viven en `src/` de su entrada. Pueden importar otros
   componentes por subpath (no van en el paquete). Storybook ya incluye
   `projects/comsatel-ds/*/src/**/*.stories.ts` y los tests de la librería
   `../*/src/**/*.spec.ts`.
6. Guía: agregar debajo de `- **Import:**` la línea
   `- **Import liviano:** \`import { X } from '@iamacalupuenzo-ui/comsatel-ds/<componente>';\``
   (`node scripts/add-light-imports.mjs <componente>` la genera desde las tablas de
   props). Luego `npm run docs` y completar descripciones.
7. Correr las puertas de abajo.

## Mover una carpeta existente a su subpath

Usar `node scripts/migrate-entry-points.mjs <carpeta> <carpeta> …` en una rama. El
script mueve con `git mv`, crea `ng-package.json` y `public-api.ts` con lo mismo que
exportaba la raíz, reescribe imports entre entradas, recalcula `@import`, `styleUrl` y
`templateUrl` desde la ubicación original, actualiza `adsa.config.json` y **falla** si
cambia la API pública (compara `exportedSymbols()` antes y después), si una carpeta
tiene reexports indirectos (`export … from`) o si un recurso queda roto. No ejecutarlo a
ciegas: revisar el diff y correr las puertas.

## Puertas antes de publicar

| Comando | Qué garantiza |
| :-- | :-- |
| `npm run build:lib` | Compila cada entrada y enlaza `dist/comsatel-ds` en `node_modules` (sitio, Storybook y tests resuelven por `exports`) |
| `npm run check:entry-imports` | Sin imports a la raíz ni relativos fuera de la carpeta, sin ciclos entre entradas, sin subpaths inexistentes y cada nombre importado exportado por su entrada |
| `npm run verify:package` | El tarball declara la raíz y cada entrada (derivadas de las carpetas con `ng-package.json`) con `types` y `default` exactos, más los CSS |
| `npm run check:docs` | Guías, props, a11y, ejemplos y nota de versión al día |
| `npm run test:ci` y `npx ng test comsatel-ds --watch=false` | Tests del sitio y de la librería |
| `npm run build-storybook` | Historias en las carpetas nuevas (contar historias contra la versión anterior) |
| `npx --yes adsa-cli@0.1.5 audit --gate` | 45/45; si baja «Docs coverage», revisar que `adsa.config.json` liste cada `<entrada>/src` |

Comprobar además que no haya clases duplicadas entre los FESM de `dist/comsatel-ds/fesm2022/`
y, si se movió CSS, que el CSS emitido coincida con la versión publicada anterior.

## Gotchas reales (2026-09-29)

- **La palabra «todo» en una nota de versión** hace fallar `check:release-notes`: el
  detector de `TODO` no distingue mayúsculas. Redactar con «cada», «todos los».
- **`build:lib` y no `ng build comsatel-ds`**: el segundo no agrega `./styles.css` a
  `exports` ni enlaza el paquete.
- **Un `npm install` puede borrar el enlace** de `node_modules/@iamacalupuenzo-ui/comsatel-ds`;
  `build:lib` lo recrea. En Windows, un `ng serve` o `esbuild.exe` vivo del repo bloquea
  `npm ci` con `EPERM`: detener solo los procesos que corren desde el repo del DS.
- **El import raíz ya no trae la librería entera**, pero junta en un chunk todo lo que
  la app importa desde la raíz; por eso a las apps se les indica importar por subpath.
