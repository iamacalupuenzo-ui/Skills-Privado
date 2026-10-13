# Diagnosticar QA cuando algo no carga

Sondear primero, culpar después. Todas las pruebas son sin sesión y de solo lectura.

## Web Cliente (`https://flotas.qa.comsatel.com.pe`)

| Prueba | Esperado | Si devuelve HTML |
|---|---|---|
| `GET /login` | 200 HTML del Shell | El Shell no está desplegado |
| `GET /api/auth/me` | **401 `application/problem+json`** | No hay BFF: el Shell lo toma como caído y redirige a `/mantenimiento` («Flotas no está disponible») |
| `GET /mfe/monitoring/remoteEntry.json` | 200 `application/json` | La micro UI no está desplegada: error de consola `Could not fetch remoteEntry … Unexpected token '<'` |
| `GET /mf.manifest.json` | JSON con `monitoring` | Si falta, el Shell no registra la ruta |

- `/mantenimiento` en `web-flotas` es la **página de caída**, no un módulo: se llega ahí cuando el Shell no puede hablar con el BFF.
- Causa frecuente en `microui-*`: `chart/values-qa.yaml` con `ingress.hosts: []` hace que `helm template` falle y nunca se despliegue.

## Backoffice (`https://backoffice.qa.comsatel.com.pe`)

- `GET /api/auth/me` → 401 JSON (BFF real). El login del personal redirige a Keycloak (`via=staff`); `via=tenant` responde 501; no existe `POST /api/auth/login/staff`.
- Los contratos propuestos del mock (isotipo, tipografías, `null` en colores) no existen en el BFF real: con él esas funciones no responden.

## Mezcla de versiones del DS

Consola: `@comsatel/ui-components/<componente>@X is not compatible with existing …@Y requiredRange 'Y'` y la micro UI muestra «No se pudo cargar». Un lado se desplegó con el DS nuevo y el otro no. Reintentar el job `deploy to qa` que falló o desplegar la pareja pendiente.

## Pipeline

`GET /projects/:id/pipelines?ref=develop&per_page=2` y los `jobs` del primero. `deploy to qa` en `failed` con «failed to pull image» es infraestructura (reintento), no código.

## Prueba de punta a punta (con el navegador)

1. Limpiar cookies, abrir `/login`, ingresar con una cuenta de prueba.
2. Comprobar que llega a la pantalla esperada y que la consola solo trae errores conocidos (por ejemplo el 404 de `/mfe/monitoring/map-config.local.json`, que es opcional).
3. Una sesión vieja del navegador acumula errores de red de otros momentos: repetir con una carga limpia antes de concluir.
