# Subir una versión del DS a los productos

Se hace **solo cuando el paquete ya está en el registro** (paso 5 de `publicar-el-ds.md`). Los cuatro productos fijan el DS con versión exacta.

## Qué se cambia en cada producto

1. Rama `feature/ds-<versión con guiones>` desde `origin/develop`.
2. `GITLAB_NPM_TOKEN="$GITLAB_TOKEN" npm install @comsatel/ui-components@<versión> --save-exact`. Sin esa variable el registro responde 401.
3. La **versión del producto** (para que QA despliegue la imagen nueva), en los cinco sitios: `package.json`, `package-lock.json` (líneas 3 y 9), `LABEL version` del `Dockerfile`, `chart/Chart.yaml` (`version` y `appVersion`) y `chart/values.yaml` (`tag`).
4. Buscar referencias viejas a la versión anterior del DS (`grep`) y corregirlas.
5. Suite completa del producto (lint, tests, mock y reglas si existen, build).
6. Commit `[develop] : Sistema de Diseno <versión> (<qué cambia>) y version <nueva>`, push y MR a `develop`.

## Parejas (B3 del orquestador)

| Pareja | MR |
|---|---|
| `web-backoffice` + `microui-bo-tenants` | Abrir los dos y enlazar cada descripción con el del otro |
| `web-flotas` + `microui-monitoring` | Ídem |

Deben fusionarse juntas y desplegarse juntas.

## Qué puede salir mal

- **Una mitad desplegada con el DS nuevo y la otra con el viejo.** El error de la consola lo dice: `@comsatel/ui-components/banner@1.9.2 Is not compatible with existing …@1.9.1 requiredRange '1.9.1'`, y el remoto muestra «No se pudo cargar». Ocurrió cuando el despliegue del Shell de flotas falló (Docker Hub) y el de la micro UI sí pasó. Solución: reintentar el job `deploy to qa` que falló; mientras tanto avisar que la pareja está rota.
- **Mi token no puede reintentar jobs de despliegue (403).** Los jobs `deploy to qa` los reintenta quien tenga rol de despliegue: Retry en el job, o «Run pipeline» sobre `develop`.
- **Etiqueta `-qa` ya publicada.** Si no se subió la versión del producto, QA conserva la imagen vieja.

## Comprobar al terminar

Pipelines de `develop` de los cuatro repos en verde (incluido `deploy to qa`) y QA en vivo (ver `estatus.md` del orquestador): login, mapa y la pantalla tocada.
