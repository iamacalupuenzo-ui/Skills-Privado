# BFF de prueba de Web Cliente (QA)

Mientras no exista el BFF real de flotas, QA responde en `/api` con un mock. Vive en el repositorio del BFF real, `flotas-web-bff`, bajo `mock/`.

## Qué es y qué no es

- Es el mismo mock de `web-flotas/dev/mock-bff`, empaquetado: `mock/src` es una **copia** (`npm run sync` desde `mock/` la refresca).
- Sin dependencias, sin base de datos, sin Keycloak, sin datos reales. **Solo QA y solo para flotas**: el Backoffice usa su BFF real.
- Los `values` de dev, PRE y PROD dejan `ingress.hosts` vacío a propósito: `helm template` falla y el mock no llega allí.
- Cuando exista el BFF real se reemplaza la imagen conservando el nombre del servicio, el Ingress `/api` y el chart; el Shell no cambia.

## Piezas

| Pieza | Detalle |
|---|---|
| Imagen | `Dockerfile` en la raíz: `node:24-alpine`, usuario 1000, `MOCK_PORT=8080`, `MOCK_SESSION_COOKIE=__Host-fl-session` (QA va con HTTPS) |
| CI | `.gitlab-ci.yml` con `WEB_HOME: "mock"`; `verify` corre `cd mock && npm test` |
| Chart | `chart/` con Ingress `/api` solo en QA; sondas TCP (el mock responde 401/404 en rutas sin sesión y un `httpGet` lo daría por caído) |
| Versión | `mock/package.json` (también `LABEL version` y el chart): subirla al refrescar `mock/src` |

## Cuentas de prueba

Contraseña `flotas` en todas. Código 2FA `A7K2M9` (reenvíos `B8L3N0`, `C9M4P1`, `D0N5Q2`; vigencia 120 s). Contraseña nueva válida `Flotas#2026`. Tokens de recuperación `token-valido-demo` y `token-vencido-demo`.

| Escenario | Correo |
|---|---|
| Entra directo, con mapa | `con-unidades@acme.test`, `sin-unidades@acme.test` |
| Controles posteriores | `clave@`, `dosfa@`, `mfa@`, `mfa-sin-canal@`, `vencido@`, `error-reenvio@`, `terminos@`, `todo@` (todos `@acme.test`) |
| Rechazos | `bloqueado@`, `inactivo@`, `cliente-sin-unidades@acme.test`, `distribuidor-inactivo@dormido.test`, `error@acme.test` |
| Casos del mapa | `esac-pierde-acceso@`, `esac-error-carga@`, `esac-sin-conexion@`, `sin-monitoreo@`, `sin-grupos@`, `todas-suspendidas@` (todos `@acme.test`) |

La fuente exacta es `mock/src/data.mjs`. Son cuentas de mock, nunca reales.

## Verificación mínima

`GET /api/auth/me` sin sesión debe dar **401 `application/problem+json`**; con eso el Shell muestra el login. Un `POST /api/auth/login` sin la cabecera anti-CSRF responde 403 (es correcto: el Shell sí la envía).
