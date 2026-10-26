# La versión del producto, en cinco sitios

La plantilla de CI de las webs despliega a QA la imagen `<versión de package.json>-qa`. La etiqueta de imagen se trata como inmutable: si la versión no cambia, QA conserva la imagen anterior (`imagePullPolicy: IfNotPresent`). Por eso **todo cambio desplegable sube de versión**.

## Los cinco sitios (deben coincidir)

| Archivo | Dónde |
|---|---|
| `package.json` | línea 3, `"version"` |
| `package-lock.json` | líneas 3 y 9, `"version"` (el nombre del propio paquete) |
| `Dockerfile` | `LABEL version=X.Y.Z` |
| `chart/Chart.yaml` | `version:` y `appVersion:` |
| `chart/values.yaml` | `image.tag:` |

Comprobar con `grep` que los cinco dicen lo mismo y que ninguno quedó con la anterior.

## Qué número subir

- Mejora visible o funcional: menor (0.3.1 → 0.4.0).
- Solo subir el DS o un ajuste menor: parche (0.4.0 → 0.4.1).
- Empezando de cero en un repo nuevo: la versión base es 0.1.0.

## Trampas

- Reemplazos con `sed` por línea (`3s/…/…/`): una expresión regular con `\.` mal escapada deja un sitio sin cambiar. Verificar con `grep`.
- El nombre del producto aparece en el lock más veces: tocar solo las líneas 3 y 9.
- `.gitlab-ci.yml` y el `Dockerfile` leen la versión de `package.json` (o de `WEB_HOME/package.json` en repos con el código en una subcarpeta, como `flotas-web-bff/mock`).
- Una versión ya publicada con `-qa` no se reutiliza: subir otra.
