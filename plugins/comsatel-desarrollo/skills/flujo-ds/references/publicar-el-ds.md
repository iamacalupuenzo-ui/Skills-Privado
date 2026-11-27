# Publicar el DS: de `develop` a la versión estable

**Pregunta antes de leer:** ¿quién crea la etiqueta `ds-vX.Y.Z` de una versión estable?

**En 30 segundos:** cada rama publica sola su prerelease en el registro. `main` publica la
estable con el job manual `publish`, y el job `tag ds` del mismo pipeline crea la etiqueta. Nadie
crea etiquetas a mano: la etiqueta ya no publica nada, solo marca lo que se publicó.
Vigente desde el DS 1.15 (`.gitlab-ci.yml` y `docs/versionado.md` de `release`), comprobado
con la 1.17.0 el 2026-11-15.

## Qué publica cada rama

| Rama | Versión que publica | dist-tag | Cómo |
|---|---|---|---|
| `feature/*`, `bugfix/*`, `hotfix/*` | `X.Y.Z-dev.N` | `dev` | Automático al subir la rama |
| `develop` | `X.Y.Z-qa.N` | `qa` | Automático al fusionar |
| `release` | `X.Y.Z-pre.N` | `pre` | Automático al fusionar |
| `main` | `X.Y.Z` | `latest` | **Manual**: job `publish`; después el job `tag ds` crea `ds-vX.Y.Z` |

`X.Y.Z` es la versión de `projects/comsatel-ds/package.json`; `N`, el número de pipeline. El
pipeline no comitea: escribe la versión solo en el paquete que publica. Ninguna prerelease queda
como `latest`, y un rango (`^1.17.0`) nunca la instala. Una estable nunca se republica: si
`X.Y.Z` existe, el job de `main` falla. Los pipelines no corren con etiquetas.

## Quién hace cada paso

| # | Paso | Quién | Cómo se verifica |
|---|---|---|---|
| 1 | MR `feature/<tema>` → `develop` | El agente sube la rama y abre el MR; **Enzo** fusiona | MR `merged`; pipeline de `develop` en verde y `X.Y.Z-qa.N` en el registro |
| 2 | MR `develop` → `release` (título en ASCII, descripción con lo que entra) | El agente lo abre; **Enzo** fusiona | `release` con la versión nueva; pipeline en verde y `X.Y.Z-pre.N` en el registro |
| 3 | MR `release` → `main` (el MR existente se actualiza en título y descripción) | **César** fusiona | `main` contiene la punta de `release` |
| 4 | Job manual `publish` en el pipeline de `main` | **César** lo ejecuta (▶) | `publish` y `tag ds` en verde |
| 5 | Comprobar el registro y la etiqueta | El agente, por API | `X.Y.Z` con dist-tag `latest`; `ds-vX.Y.Z` apunta al commit de `main` |

Si `main` no contiene la punta de `release`, el job `publish` falla a propósito: primero se
integra `release`.

## Antes de abrir el MR a `release`

- `develop` tiene la versión nueva en `projects/comsatel-ds/package.json` y su `docs/releases/<versión>.md`.
- `npm run check:release-notes` reconoce la nota.
- El pipeline de `develop` terminó en verde.

**La versión base se sube al empezar el siguiente trabajo, no al final.** `1.18.0-qa.3` es
*anterior* a `1.18.0`: si la base sigue en una versión ya estable, `scripts/publish-ds.mjs` falla
(«sube la versión base»). Se sube junto con su nota de versión.

## Mientras la estable no sale

Los productos pueden probar la prerelease en sus ramas, con la versión exacta
(`1.17.0-pre.157`, nunca el rango). **Ninguna `-dev`, `-qa` ni `-pre` llega a `integration`:**
antes del MR del producto se cambia a la estable. Detalle en `subir-ds-a-productos.md`.

## Comprobaciones por API (sin imprimir el token)

- Versión en una rama: `GET …/repository/files/projects%2Fcomsatel-ds%2Fpackage.json/raw?ref=<rama>`.
- Pipeline y jobs de una rama: `GET …/pipelines?ref=<rama>&per_page=1` y `GET …/pipelines/:id/jobs`.
- Paquetes: `GET …/packages?package_name=@comsatel/ui-components&order_by=created_at&sort=desc`.
- Etiqueta (después del paso 4): `GET …/repository/tags/ds-vX.Y.Z`; su commit debe ser el HEAD de `main`.

## Errores que ya ocurrieron

- **Seguir la guía vieja «publicar por etiqueta».** Hasta la 1.14 se publicaba creando `ds-vX.Y.Z` sobre `release`. Hoy los pipelines ignoran las etiquetas: crear una a mano no publica nada y deja ocupada la etiqueta que el job `tag ds` debe crear. Nunca se crea a mano.
- **Pipeline en rojo por Docker Hub.** El runner no pudo bajar `comsatel/node-builder` u `oke-cli-tools` (timeout). Se reintenta el job; no se toca el código.
- **Job `capturas` en rojo en `release`.** Tiene `allow_failure`: no bloquea la publicación. Se revisa aparte.
- **Fusión bloqueada.** El entorno bloquea fusionar sin revisión de otra persona, y el rol del usuario puede limitar `release` y `main`. Se informa y se deja la acción a quien corresponde.

**Pregunta de comprobación:** si `release` ya tiene la 1.18.0 y César todavía no fusiona a
`main`, ¿qué versión puede fijar un producto en su rama y cuál puede llegar a `integration`?
(Respuesta: en la rama, la `1.18.0-pre.N` exacta; a `integration` solo llega la `1.18.0` estable.)
