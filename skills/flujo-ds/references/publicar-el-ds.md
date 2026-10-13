# Publicar el DS: de `develop` a `main`

Camino: `feature` → MR a `develop` → MR `develop` → `release` → etiqueta `ds-vX.Y.Z` (publica) → MR `release` → `main`.
Cada paso es una acción separada que pide su autorización. Ejemplo real: DS 1.9.2 (2026-10-12).

## Antes de empezar

- `develop` tiene la versión nueva en `projects/comsatel-ds/package.json` y su `docs/releases/<versión>.md`.
- Los pipelines de `develop` (los que arrancan al fusionar) terminaron en verde.
- `npm run check:release-notes` pasa y reconoce la nota.

## Pasos y verificación

| # | Paso | Cómo se verifica |
|---|---|---|
| 1 | Fusionar los MR de trabajo a `develop` | MR `merged`; `package.json` de `develop` con la versión nueva |
| 2 | Abrir el MR `develop` → `release` (título en ASCII; descripción con los archivos que entran) y fusionarlo | `release` HEAD distinto del anterior y su `package.json` con la versión nueva |
| 3 | **Después del paso 2**, crear la etiqueta anotada `ds-vX.Y.Z` sobre el HEAD de `release`, con el mensaje `@comsatel/ui-components X.Y.Z` | La API devuelve la etiqueta y su commit coincide con el HEAD de `release`; el `package.json` de ese commit dice la versión |
| 4 | Esperar el pipeline de la etiqueta (`verify` y `publish`) | Ambos jobs en verde |
| 5 | Comprobar el registro de paquetes | `@comsatel/ui-components` con la versión nueva en la lista |
| 6 | Fusionar `release` → `main` (el MR de `release` a `main` existente se actualiza en título y descripción) | `main` con la versión nueva |

## Comprobaciones por API (sin imprimir el token)

- Etiqueta: `GET /projects/:id/repository/tags/ds-vX.Y.Z` → comparar `commit.short_id` con `GET …/repository/branches/release`.
- Versión en un commit: `GET …/repository/files/projects%2Fcomsatel-ds%2Fpackage.json/raw?ref=<etiqueta o rama>`.
- Pipeline de la etiqueta: `GET …/pipelines?ref=ds-vX.Y.Z` y sus `jobs`.
- Paquete: `GET …/packages?package_name=@comsatel/ui-components&order_by=created_at&sort=desc`.

## Errores que ya ocurrieron

- **Etiqueta antes de fusionar a `release`.** La etiqueta quedó sobre el commit anterior (versión vieja) y su `publish` habría publicado el contenido viejo. Se canceló el pipeline antes de que publicara, se borró la etiqueta y se rehízo tras fusionar. Evitarlo: verificar que `release` ya tiene la versión nueva antes de etiquetar.
- **Mensaje de etiqueta vacío.** Las etiquetas anteriores llevan `@comsatel/ui-components X.Y.Z`; mantener el mismo formato.
- **Pipeline en rojo por Docker Hub.** El runner no pudo bajar `comsatel/node-builder` u `oke-cli-tools` (timeout). Reintentar el job; no tocar el código.
- **Fusión bloqueada.** El entorno de Claude Code bloquea fusionar sin revisión de otra persona y el rol del usuario puede limitar `release` y `main`. Informar y dejar la acción al usuario o al arquitecto.
