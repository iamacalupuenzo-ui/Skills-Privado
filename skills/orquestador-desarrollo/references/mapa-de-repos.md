# Mapa de repositorios y entornos

Estado verificado el 2026-10-13. Releer GitLab antes de afirmar versiones: cambian a diario.

## Repositorios

Raíz local: `C:\Users\emacalupu\Documents\00 - Proyectos Enzo - V1\`. Raíz GitLab:
`comsatel/development/products/clocator2/`.

| Repo | Ruta GitLab | Qué es | Despliega |
|---|---|---|---|
| `ui-components` | `webs/componentes-ui/ui-components` | Design System (`@comsatel/ui-components`) | Etiqueta `ds-vX.Y.Z` publica en el registro |
| `web-backoffice` | `webs/web-backoffice` | Shell del Backoffice | `develop` → QA |
| `microui-bo-tenants` | `micros-ui/backoffice/microui-bo-tenants` | Micro UI de Distribuidores (alta, identidad visual) | `develop` → QA |
| `web-flotas` | `webs/web-flotas` | Shell de Web Cliente | `develop` → QA |
| `microui-monitoring` | `micros-ui/flotas/microui-monitoring` | Micro UI de Monitoreo (mapa) | `develop` → QA |
| `flotas-web-bff` | `webs/flotas-web-bff` | BFF de Web Cliente; hoy lleva `mock/` (BFF de prueba, solo QA) | `develop` → QA |

## Parejas que se publican juntas

| Pareja | Por qué |
|---|---|
| `web-backoffice` + `microui-bo-tenants` | El Shell aloja fuentes, sanitizer y avisos que usa la micro UI; y comparten el DS |
| `web-flotas` + `microui-monitoring` | Comparten el DS como singleton |

## Ramas y quién fusiona

- Trabajo: `feature/*` desde `origin/develop`; MR a `develop`.
- Las fusiones las hace el arquitecto (César, `cquevedo`) o Enzo en GitLab. Las ramas `release` y `main` y las etiquetas del DS son suyas.
- El entorno de Claude Code puede bloquear fusionar sin revisión de otra persona: no se rodea (B6).

## Puertos locales

| Puerto | Qué |
|---|---|
| 4300 | Shell Backoffice (`npx ng serve --configuration bff --port 4300`) |
| 4201 | Micro UI de Distribuidores (`npx ng serve --port 4201`) |
| 8081 | Mock del BFF de Backoffice (`MOCK_PORT=8081 node dev/mock-bff/server.mjs`) |
| 4400 | Shell Web Cliente (`npm start`) |
| 8082 | Mock del BFF de Web Cliente (`npm run mock`) |
| 4202 | Micro UI de Monitoreo (`npm start`) |
| 4210 | Piloto de referencia (`capturas-recuperos`) |
| 4200 | Catálogo del DS (Storybook/demo) |

El 3000 es ajeno: no tocar. Matar solo por PID del puerto (`netstat -ano | grep :PUERTO`).

## Entornos

- QA Backoffice: `https://backoffice.qa.comsatel.com.pe` (BFF real; login por Keycloak).
- QA Web Cliente: `https://flotas.qa.comsatel.com.pe` (BFF de prueba en `/api`; micro UI en `/mfe/monitoring`).
- Cuentas de mock de Web Cliente: `con-unidades@acme.test` y siguientes, contraseña `flotas` (lista completa en `mock/README.md` de `flotas-web-bff`).
- PRE y PROD: los `values` de los charts no definen host a propósito.
