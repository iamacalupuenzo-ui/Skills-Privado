# Mapa de repositorios y entornos

Estado verificado el 2026-10-13; ramas y entornos, el 2026-11-13. Releer GitLab antes de afirmar versiones: cambian a diario.

## Repositorios

Raíz local: la carpeta donde cada persona clona los repositorios (todos hermanos, con el nombre del repo). Raíz GitLab:
`comsatel/development/products/clocator2/` (servidor `project.comsatel.com.pe`, solo por VPN).

| Repo | Ruta GitLab | Qué es | Despliega |
|---|---|---|---|
| `ui-components` | `webs/componentes-ui/ui-components` | Design System (`@comsatel/ui-components`) | Cada rama publica su prerelease (`-dev`, `-qa`, `-pre`); `main` publica la estable con el job manual `publish` y crea `ds-vX.Y.Z` |
| `web-backoffice` | `webs/web-backoffice` | Shell del Backoffice | `integration` → DEV; `develop` → QA |
| `microui-bo-tenants` | `micros-ui/backoffice/microui-bo-tenants` | Micro UI de Distribuidores (alta, identidad visual, ficha, Funcionalidades, Clientes) | `integration` → DEV; `develop` → QA |
| `web-flotas` | `webs/web-flotas` | Shell de Web Cliente | `integration` → DEV; `develop` → QA |
| `microui-monitoring` | `micros-ui/flotas/microui-monitoring` | Micro UI de Monitoreo (mapa) | `integration` → DEV; `develop` → QA |
| `flotas-web-bff` | `webs/flotas-web-bff` | BFF de Web Cliente; hoy lleva `mock/` (BFF de prueba, solo QA) | `develop` → QA |

## Parejas que se publican juntas

| Pareja | Por qué |
|---|---|
| `web-backoffice` + `microui-bo-tenants` | El Shell aloja fuentes, sanitizer y avisos que usa la micro UI; y comparten el DS. Misma rama `CLF_Feature_<n>` en los dos |
| `web-flotas` + `microui-monitoring` | Comparten el DS como singleton |

## Ramas y quién fusiona

- **Productos (CL2, desde 2026-11-12):** rama `CLF_Feature_<n>` por historia (n = IID del issue en collaboration), desde `origin/develop`; MR a `integration`, que despliega en DEV. Revisa y fusiona Luis (`lrodriguez`), jefe de desarrollo. `integration` nunca se mezcla hacia `develop`: cada rama llega a `develop` (QA) con su propio MR, y eso lo lleva desarrollo. Detalle en `flujo-producto/references/publicar-con-mr.md`.
- **DS y knowledge-base:** rama `feature/<tema>` desde `origin/develop`; MR a `develop`. Revisa César (`cquevedo`); Enzo puede fusionar, pero César queda de revisor. `release`, `main` y las etiquetas del DS son de César.
- **El agente no fusiona ni etiqueta.** Sube la rama y abre el MR con su revisor. El guardia de `hooks/` lo hace cumplir (ver `hooks-bloqueantes.md`).
- `develop`, `integration`, `main` y `release` están protegidas: nadie empuja directo, solo por MR.
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

Levantamiento verificado el 2026-11-17 (manda sobre la tabla anterior si difieren): Shell del Backoffice en el 4200, bo-tenants en el 4201, Shell de Flotas en el 4400 (4401 en otra copia), monitoring en el 4202 y mock de Flotas en el 8082. El mock del Backoffice usa el 3000 por defecto, que ocupa el servidor MCP de draw.io: se levanta con `MOCK_PORT=3001` y `proxy.conf.json` apuntado al 3001 solo en local, sin commit. El proxy del Shell del Backoffice manda `/mfe/microui-bo-feature-flags` al 4202, el mismo puerto de monitoring. Antes de levantar: `puertos_libres.py` de `verificar-calidad`.

## Entornos

- QA Backoffice: `https://backoffice.qa.comsatel.com.pe` (BFF real; login por Keycloak).
- QA Web Cliente: `https://flotas.qa.comsatel.com.pe` (BFF de prueba en `/api`; micro UI en `/mfe/monitoring`).
- Cuentas de mock de Web Cliente: `con-unidades@acme.test` y siguientes, contraseña `flotas` (lista completa en `mock/README.md` de `flotas-web-bff`).
- PRE y PROD: los `values` de los charts no definen host a propósito.
