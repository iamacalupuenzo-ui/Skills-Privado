# Mapa de repositorios y entornos

Estado verificado el 2026-10-13. Releer GitLab antes de afirmar versiones: cambian a diario.

## Tres ambientes de trabajo

Antes de actuar, declara en cuál estás. Las reglas de uno no se aplican a los otros.

| Ambiente | Qué es | Flujo |
|---|---|---|
| Sistema de diseño | `ui-components` (`@comsatel/ui-components`) | `flujo-ds` |
| Producto de CL2 Flotas | Shell, micro UI o BFF de la tabla de abajo | `flujo-producto` |
| Producto en evaluación | Otro proyecto, ajeno al clocator2, que se evalúa aparte (repo y reglas por definir) | Preguntar antes de actuar; no asumir versión en cinco sitios, parejas ni el DS |

Si el pedido no deja claro el ambiente, pregunta. Un cambio en un producto no autoriza tocar el DS.

## Repositorios

Raíz local en la laptop del trabajo: `C:\Users\emacalupu\Documents\00 - Proyectos Enzo - V1\`.
Raíz local en la laptop personal: `D:\0001 - Proyectos Generales\01 - Proyectos Trabajo\`.
Raíz GitLab: `comsatel/development/products/clocator2/` (servidor `project.comsatel.com.pe`, solo por VPN).

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
- **El agente no fusiona ni etiqueta.** Sube la rama `feature/*`, abre el MR a `develop` y lo asigna a César (`cquevedo`, arquitecto). La fusión y las etiquetas del DS las ejecuta César; Enzo puede hacerlo, pero por defecto se le comenta o etiqueta a César.
- `develop` y `main` están protegidas: nadie empuja directo, solo por MR. `release` y `main` no se tocan.
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
