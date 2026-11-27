# Convenciones de commits, MR y herramientas (móvil)

## Commits

- Conventional Commits en español, en minúsculas y sin punto final: `feat(auth): …`, `fix(cs-button): …`, `docs: …`.
- Cada commit termina con el trailer de coautoría que indique el entorno de Claude Code.
- Un commit por tema cuando se pueda; no mezclar la versión con el cambio funcional.

## Ramas

- `feature/<tema>` (o `fix/`, `docs/`) desde `origin/develop`. Antes de rebasar, `git fetch`.
- Si el repositorio ya trae una rama `feature/US-…` creada para el cambio, se usa esa.
- No se trabaja ni se sube a `main` ni a `release`.

## Merge requests

- Destino siempre `develop`, con `remove_source_branch: true` y César como revisor (`reviewer_ids: [91]`).
- Se crean por la API con la cabecera `PRIVATE-TOKEN` desde la variable `GITLAB_TOKEN`. El **cuerpo** va en un archivo JSON UTF-8 con `curl --data-binary @archivo.json`; el título, sin acentos si la terminal los rompe.
- Contenido mínimo de la descripción: qué cambia, impacto, dependencia con otro MR (con enlace), verificación con cifras reales y **lo no verificado**.
- Si el MR de la app depende del de la biblioteca, decirlo en la descripción: se fusiona primero la biblioteca y después se cambia el `ref`.

## Git por HTTP y el token

- `GITLAB_TOKEN` sirve para la API y para `git`. No imprimirlo nunca.
- La API acepta la cabecera `PRIVATE-TOKEN`; **`git` no**: usa autenticación básica. Sin guardar el token en la URL ni en la configuración:
  `git -c "http.extraHeader=Authorization: Basic <base64 de oauth2:TOKEN>" fetch|push|clone …`
- `flutter pub get` con una dependencia de Git privada llama a `git` por dentro. Para pasarle la cabecera sin escribirla en ningún archivo, usa variables de entorno solo para ese comando: `GIT_CONFIG_COUNT=1`, `GIT_CONFIG_KEY_0=http.extraHeader`, `GIT_CONFIG_VALUE_0=<cabecera>`.
- GitLab es 14.2.1: no existe `/personal_access_tokens/self`. El servidor responde solo por VPN.

## Trampas de Windows

- En Git Bash, las rutas del teléfono (`/sdcard/...`) se convierten en rutas de Windows: anteponer `MSYS_NO_PATHCONV=1` a los comandos de `adb`.
- Scripts con comillas, acentos o `$` en `node -e` o en bloques largos de shell se corrompen: escribir un archivo y ejecutarlo.
- Un `| tail` al final de `flutter build` oculta el código de salida y puede encadenar un `adb install` con un APK viejo. Guardar la salida en un archivo, leer el código de salida y solo entonces instalar.
- Finales de línea: el repositorio normaliza con `.gitattributes`; un `git status` lleno de `M` puede ser solo eso.

## Delegar a otros agentes

Opcional, si el entorno tiene Orca: con `orquestacion-multi-harness`, no con la herramienta interna de agentes. Sin Orca, el trabajo se reparte como lo defina el equipo.
