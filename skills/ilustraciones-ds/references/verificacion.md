# Verificar una escena

Una escena no está lista porque la prueba pasa: está lista cuando se ve a la altura de
`fleet-load-error` a 2×, en el catálogo y dentro del producto.

## 1. Vista previa estática (antes de tocar el componente)

Itera la geometría sin compilar el DS. Este script arma una página con los tokens del
`dist`, `scenes.css` y el SVG sin la sintaxis de Angular. Guárdalo en tu carpeta temporal:

```js
// preview.cjs <nombre> [<nombre>…]  ·  W=840 para verla a 2×
const fs = require('fs');
const DS = process.env.DS_DIR;      // raíz de ui-components
const OUT = process.env.OUT_DIR;    // carpeta servida por http-server
const names = process.argv.slice(2);
const tokens = fs.readFileSync(DS + '/dist/comsatel-ds/tokens.css', 'utf8');
const css = fs.readFileSync(DS + '/projects/comsatel-ds/illustrations/src/scenes/scenes.css', 'utf8').replace(':host', '.host');
const svg = (n) => fs.readFileSync(DS + `/projects/comsatel-ds/illustrations/src/scenes/${n}.html`, 'utf8')
  .replace(/\[attr\.id\]="haloId"/g, `id="h-${n}"`)
  .replace(/\[attr\.filter\]="'url\(#' \+ haloId \+ '\)'"/g, `filter="url(#h-${n})"`)
  .replace(/@if \(animated\) \{(.*?)\}(?=<\/)/g, '$1');
const body = names.map((n) => `<figure><div class="host" style="width:${process.env.W || 420}px">${svg(n)}</div><figcaption>${n}</figcaption></figure>`).join('');
fs.writeFileSync(OUT + '/preview.html', `<!doctype html><meta charset="utf-8"><style>${tokens}${css} body{margin:24px;font-family:sans-serif;background:#fff;display:flex;gap:24px;flex-wrap:wrap} figure{margin:0}</style>${body}`);
```

Sírvela con `npx http-server <OUT_DIR> -p <puerto> -c-1` (Playwright no abre `file:`) y
captúrala. Pon la escena nueva al lado de `fleet-load-error` para comparar calidad.

Si una pieza sale negra, le falta su clase en `scenes.css`.

## 2. Revisión a 2× (W=840)

Mira cada zona y anota lo que falte antes de seguir:

- ¿Se entiende la metáfora en un segundo y sin texto?
- ¿Cada objeto está completo y en su lugar? (el enchufe se veía «a un lado» y tapado por
  el tomacorriente: hubo que separarlos y girar su cara útil).
- ¿Hay caras lisas grandes? Suma piezas reales (costuras, placa, espejo, topes, rejilla).
- ¿Los colores siguen las reglas? Nada rojo fuera de un error.
- ¿El peso quedó bajo 50 KB?

## 3. Catálogo y producto

- Catálogo 4215: sección «Escenas ilustradas», con la escena junto a las demás.
- Producto 4401 con el usuario del mock que produce el estado. Para «sin resultados»:
  `con-unidades` y escribir «zzz» en el buscador. Para el error: `esac-error-carga`.
- Capturas a 1440 y 390 px en `capturas-dsp006/` del worktree de microui-monitoring, con
  nombre `us<historia>-<n>-<estado>-<ancho>.png`.
- Revisa la consola: los 404 del mock (`/api/config/map`, `/api/audit-events`) y los
  avisos NG0912 de federación ya existían; cualquier otro error es nuevo.

## 4. Notion

Sube las capturas nuevas a la tarea FRONT de la historia y a la página de servidores y
estados, y quita las que quedaron viejas. Notion no deja borrar una imagen con edición
parcial: para quitarla, reescribe la página con `replace_content` copiando las etiquetas
`notion-file-block://` tal como vienen del fetch.

Las cargas: `notion-create-file-upload`, luego un `curl -F file=@<archivo>` con los
encabezados devueltos, ejecutado desde la carpeta de la captura (las rutas con espacios
fallan).
