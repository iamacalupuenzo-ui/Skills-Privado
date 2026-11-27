# Subir una versión del DS a los productos

Los productos fijan el DS con **versión exacta**. Qué versión según el momento:

| Momento | Qué se fija | Hasta dónde llega |
|---|---|---|
| La estable `X.Y.Z` ya está en el registro (paso 5 de `publicar-el-ds.md`) | `X.Y.Z` | MR a `integration` |
| `release` ya publicó, pero César aún no publica la estable | `X.Y.Z-pre.N` exacta | Solo la rama de la historia, para probar. **No llega a `integration`** |
| El cambio del DS aún no se fusiona | Copia de `dist/comsatel-ds` en `node_modules` (B8 de `flujo-ds`); `package.json` sin tocar | Solo el servidor local |

Cuando sale la estable, cada rama que usaba la `-pre` cambia a `X.Y.Z` antes de abrir su MR.

**La etiqueta no prueba la publicación.** `ds-v1.17.0` existía en `release` y el registro no tenía la 1.17.0 (`latest` seguía en 1.14.0). Antes de empezar, desde una carpeta con `.npmrc`: `npm view @comsatel/ui-components@<versión> version`. Si no devuelve la versión, no está publicada.

## Qué se cambia en cada producto

1. El cambio va como primer commit (`chore(ds)`) de la rama `CLF_Feature_<n>` de la historia que lo necesita (`flujo-producto`, modo `DS`). Solo si ninguna historia lo necesita se usa una rama `chore/ds-<versión con guiones>` desde `origin/develop`, con solo `package.json`, `package-lock.json` y las migraciones mínimas de API que exija la versión (por ejemplo, `cs-tag` → `cs-badge`, obsoleto desde la 1.16: `severity` `warn` → `warning` y `secondary` → `neutral`). El menú del Shell va en su propia rama apilada (`feature/menu-ds-<versión>`) y las ramas de historia se apilan sobre la del DS.
2. `GITLAB_NPM_TOKEN="$GITLAB_TOKEN" npm install @comsatel/ui-components@<versión> --save-exact`. Sin esa variable el registro responde 401.
3. La **versión del producto** (para que DEV despliegue la imagen nueva), en los cinco sitios: `package.json`, `package-lock.json` (líneas 3 y 9), `LABEL version` del `Dockerfile`, `chart/Chart.yaml` (`version` y `appVersion`) y `chart/values.yaml` (`tag`).
4. Buscar referencias viejas a la versión anterior del DS (`grep`) y corregirlas. Si la versión retira o marca obsoleto un componente (por ejemplo `Tag` → `Badge` en la 1.16), migrar sus usos con la tabla de equivalencias de su nota de versión.
5. Suite completa del producto (lint, tests, mock y reglas si existen, build).
6. Push y MR a `integration`, en pareja, con Luis de revisor (`flujo-producto/references/publicar-con-mr.md`).

## Parejas (B3 del orquestador)

| Pareja | MR |
|---|---|
| `web-backoffice` + `microui-bo-tenants` | Abrir los dos y enlazar cada descripción con el del otro |
| `web-flotas` + `microui-monitoring` | Ídem |

Deben fusionarse juntas y desplegarse juntas.

## Si el DS todavía no está publicado

Las ramas `feature/ds-<versión>` pueden prepararse con una versión `-pre`, pero no se fusionan a `develop` (B8): esperan la estable. Se suben sin MR y con `-o ci.skip`, junto con las ramas del DS de las que dependen. Los pasos de subida están en el skill `flujo-producto` (referencia `subir-sin-fusionar.md`) y el orden de fusión en tres fases (DS, productos a `integration` en pareja, DEV) en su referencia `orden-de-fusion-ds-sin-publicar.md`.

## Qué puede salir mal

- **Una mitad desplegada con el DS nuevo y la otra con el viejo.** El error de la consola lo dice: `@comsatel/ui-components/banner@1.9.2 Is not compatible with existing …@1.9.1 requiredRange '1.9.1'`, y el remoto muestra «No se pudo cargar». Ocurrió cuando el despliegue del Shell de flotas falló (Docker Hub) y el de la micro UI sí pasó. Solución: reintentar el job `deploy to qa` que falló; mientras tanto avisar que la pareja está rota.
- **Mi token no puede reintentar jobs de despliegue (403).** Los jobs `deploy to qa` los reintenta quien tenga rol de despliegue: Retry en el job, o «Run pipeline» sobre `develop`.
- **El producto no compila con la versión fijada.** Su código ya usa un DS sin publicar (ejemplo: el piloto usa la 1.16.0 con la 1.14.0 fijada). Se construye el DS (`npm run build:lib`) y se copia `dist/comsatel-ds` sobre `node_modules/@comsatel/ui-components`. Si la pantalla no cambia, el servidor no recompiló: se reinicia. Comprueba con `diff -rq` que la copia es igual al `dist`.
- **Imagen `-dev` o `-qa` ya publicada.** Si no se subió la versión del producto, el entorno conserva la imagen vieja.
- **Una `-pre` llega a `integration`.** DEV quedaría con un DS que no es estable y que puede desaparecer. Se cambia a la estable antes del MR.

## Comprobar al terminar

Pipelines de `integration` de los repos tocados en verde (incluido el despliegue) y DEV en vivo (ver `estatus.md` del orquestador): login, mapa y la pantalla tocada.
