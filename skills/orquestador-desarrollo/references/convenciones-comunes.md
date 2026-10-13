# Convenciones comunes de commits, MR y herramientas

## Commits

- Estilo del repositorio de producto: `[develop] : texto en español`, en minúsculas y sin punto final. El DS usa Conventional Commits (`fix(table-footer): …`, `feat(…)`, `docs(…)`).
- Cada commit termina con el trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Un commit por tema cuando se pueda; no mezclar la versión con el cambio funcional (la versión va en su propio commit).

## Ramas

- `feature/<tema>` (o `fix/`, `docs/`) desde `origin/develop`. Antes de rebasar, `git fetch`.
- No se trabaja ni se sube a `main` ni a `release`.

## Merge requests

- Destino siempre `develop`, con `remove_source_branch: true`.
- Se crean por la API con `PRIVATE-TOKEN` desde `GITLAB_TOKEN`. **Título en ASCII** (la línea de comandos de Windows rompe los acentos); el **cuerpo** va en un archivo JSON UTF-8 con `curl --data-binary @archivo.json` o con `fetch` de Node.
- Contenido mínimo de la descripción: qué cambia, por qué, contrato propuesto si lo hay, **pareja** (con enlace), verificación con cifras reales, lo no verificado y la versión.
- Cuando dos MR van en pareja, abrirlos y luego editar cada descripción con el enlace del otro.

## Pruebas antes de publicar

- La suite completa del repo afectado, con salida filtrada (solo conteos y fallos): `npm run lint`, `npm run test:ci`, `npm run test:mock` y `npm run test:rules` si existen, y `npm run build`.
- Después de `ng test` o `ng build`, reiniciar los servidores locales (se rompen con chunks 404 o `ngDevMode is not defined`).

## Tokens y registro de paquetes

- `GITLAB_TOKEN` sirve para la API y `git`. No imprimirlo nunca.
- El `.npmrc` de los productos espera `GITLAB_NPM_TOKEN`; sin esa variable `npm install` responde 401. Usar `GITLAB_NPM_TOKEN="$GITLAB_TOKEN" npm install paquete@x.y.z --save-exact` solo para ese comando.

## Trampas de Windows

- Finales de línea: el repo normaliza a CRLF/LF; un `git status` lleno de `M` puede ser solo eso. `git add -A` normaliza y deja ver lo real.
- Scripts con comillas, acentos o `$` en `node -e` se corrompen: escribir un archivo `.cjs` y ejecutarlo.
- `sleep` largo y bucles de espera se bloquean: usar un script de Node que sondee, o la ejecución en segundo plano.
- Antes de compilar la librería del DS, detener el servidor del 4200 (`link-dist.mjs` falla con EBUSY).

## Delegar a otros agentes

Por Orca con `orquestacion-multi-harness`, no con la herramienta interna de agentes. El encargo va en un archivo y un mensaje de una línea que apunta a su ruta. A Codex se le piden solo las pruebas importantes del módulo y del mock, nunca la suite completa ni `ng build`; la suite completa la corre quien publica.
