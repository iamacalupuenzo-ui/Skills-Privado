# Hooks bloqueantes: qué frenan y por qué

**Pregunta antes de leer:** ¿qué acciones de GitLab no puede hacer el agente aunque se lo pidan?

**En 30 segundos:** un hook es un programa que Claude Code ejecuta *antes* de cada comando. Si
la acción es crítica, la detiene y explica por qué y a quién pedírsela. Fusionar, etiquetar,
publicar, empujar a ramas protegidas, forzar un push y mostrar el token están **bloqueados**.
Subir una rama o abrir un MR **pide tu confirmación**. Todo lo demás pasa sin ruido.

## Por qué un hook y no solo una regla en el skill

Una regla escrita en un skill es una instrucción: el modelo puede olvidarla o malinterpretarla.
Un hook es código fuera del modelo: si el comando coincide, no se ejecuta. Los skills
(`orquestador-desarrollo`, `flujo-ds`, `flujo-producto`) siguen explicando el proceso; el hook
garantiza los pocos casos donde un error no se puede deshacer.

## Qué hace cada bloqueo

| Acción | Resultado | Por qué | Quién la hace |
|---|---|---|---|
| Fusionar un MR (`/merge`, `glab mr merge`) | Bloquea | El agente no fusiona; revisa y fusiona César | César (o el responsable del repositorio, en GitLab) |
| Crear o borrar etiquetas (`git tag`, `--tags`, API de tags) | Bloquea | Una etiqueta `ds-vX.Y.Z` publica el paquete del sistema de diseño | César |
| `npm publish` | Bloquea | Publicar un paquete es irreversible | César, por etiqueta |
| `git push` a `develop`, `main` o `release` | Bloquea | Están protegidas: solo entran por MR | César, tras el MR |
| `git push --force`, `+rama`, `--delete` | Bloquea | Reescribe o borra historia remota | El responsable del repositorio, en su terminal |
| Mostrar el token o escribirlo en un comando | Bloquea | Queda en el historial y la conversación | Nadie: usa la variable |
| `git push` de una rama `feature/*` | Pide confirmación | Regla B1: nada se sube sin tu visto bueno | Tú confirmas |
| Abrir un MR por la API | Pide confirmación | Debe ir a `develop`, asignado a César y enlazado a su pareja | Tú confirmas |
| Subir algo desde `ui-components` | Pide confirmación, con aviso | Un cambio en el DS afecta a todos los productos | Tú confirmas |

Pasan sin aviso: `git status`, `fetch`, `log`, `git push --dry-run`, `git tag --list` y las
consultas de lectura a la API.

## Avisos al subir una rama de producto (no bloquean)

Al confirmar un push a un repo de producto de Comsatel, el guardia suma avisos al motivo, sin
cambiar la decisión: si `package.json` fija el DS sin versión exacta o en prerelease, y si `HEAD`
choca con `origin/integration` según `git merge-tree` (sin fetch, con lo que haya en el clon).
Son lecturas locales de menos de un segundo. La revisión completa sigue siendo de
`revisar_ds.py` y `simular_fusion.py` (`flujo-producto`); un aviso no reemplaza correrlos.

## Cómo se ve un bloqueo

```
BLOQUEADO: git push a la rama protegida develop
Motivo: develop, main y release están protegidas: nadie empuja directo, todo entra por
merge request y lo fusiona César.
Qué hacer: Crea una rama feature/<tema> desde origin/develop, súbela y abre un MR a develop
asignado a César.
```

## Archivos (viven en el repo de skills, como base de conocimiento)

- `hooks/guardia-gitlab.mjs` — el guardia (Node, sin dependencias).
- `hooks/probar-guardia.mjs` — 43 casos (incluye los avisos de un push): lo que debe bloquear, confirmar y dejar pasar.
- `hooks/instalar-hooks.mjs` — lo instala en tu configuración de Claude Code.

## Instalar, probar y retirar

```
node skills/orquestador-desarrollo/hooks/probar-guardia.mjs
node skills/orquestador-desarrollo/hooks/instalar-hooks.mjs --dry-run
node skills/orquestador-desarrollo/hooks/instalar-hooks.mjs --apply
node skills/orquestador-desarrollo/hooks/instalar-hooks.mjs --quitar --apply
```

El instalador muestra una propuesta sin escribir por defecto. Tras confirmar --apply registra ambos guardias (GitLab y UXS); --settings permite indicar el archivo de un perfil concreto. Copia los guardias y el auditor UXS a `~/.claude/hooks/` (así `skils update` no lo borra), agrega registros idempotentes de `PreToolUse` para Bash y PowerShell, conserva los hooks ajenos (incluido Orca), deja copia de respaldo única de `settings.json` y no
toca los demás hooks. Ábrelo en una sesión nueva para que se cargue.

## Si hay que reescribir una rama ya subida

El push forzado sigue bloqueado aunque el usuario lo autorice en el chat. Tampoco se rodea:
borrar la rama remota y volver a subirla es lo mismo que forzar. Lo que sí se hace:

1. Comprobar con `git ls-remote origin <rama>` que el remoto sigue en el SHA que subiste tú.
2. Darle al usuario el comando para que lo ejecute él, con `!` en Claude Code:
   `git push --force-with-lease=<rama>:<sha-esperado> origin <rama> -o ci.skip`
3. Prevenirlo: separar las historias en ramas antes del primer push.

## Cómo identificar qué hooks tienes

- Los de **Orca** ejecutan `~\.orca\agent-hooks\claude-hook.cmd`: solo informan el estado del
  agente a la app y nunca bloquean.
- El de este guardia contiene `comsatel-guardia-gitlab` en su comando.
- Todos están en `~/.claude/settings.json`, sección `hooks`.
- Un bloqueo de este guardia empieza con `BLOQUEADO:` y trae *Motivo* y *Qué hacer*. Si un
  comando se frena sin ese formato, no es este hook: son los permisos de la herramienta.

## Límites honestos

- Detecta patrones del texto del comando. Un comando muy disfrazado (variables armadas a
  trozos) podría escaparse; la protección de ramas de GitLab sigue siendo la barrera final.
- La protección de `develop`, `main` y `release` aplica a los remotos de Comsatel. En otros repos (por ejemplo el de skills en GitHub) el push solo pide confirmación.
- Ignora el texto de los mensajes de commit (`-m` y heredoc), para no frenar un commit que solo *menciona* una acción bloqueada.
- Solo cubre Claude Code. Codex tiene otro mecanismo de hooks y no está configurado.
- El hook no sustituye a los permisos de GitLab: el token debe tener rol que no pueda fusionar.

## Pregunta de comprobación

Un agente va a ejecutar `git push origin HEAD:release`. ¿Qué pasa y a quién le toca la acción?
(Respuesta: se bloquea, porque `release` está protegida; la acción entra por MR y la fusiona César.)

## Guardias para Codex, Orca y otros agentes

El guardia de GitLab nació como hook de Claude Code. Para que las mismas reglas rijan sin importar qué agente
trabaje, se reparten en capas. Cada una cubre lo que la anterior no ve.

| Capa | Qué ve | Quién queda cubierto | Límite |
|---|---|---|---|
| 1. Hook nativo de Claude Code | El comando antes de ejecutarlo; pide confirmación (`ask`) | Claude Code | Solo ese agente |
| 2. Hook nativo de Codex | El mismo comando, mismo protocolo (`PreToolUse`) | Codex | Codex no sabe pedir confirmación: lo toma como fallo del hook y deja pasar el comando. Por eso se instala en modo estricto (`--estricto`: un `ask` pasa a bloqueo). Hay que confiar en el hook con `/hooks` |
| 3. Hook `pre-push` de git | Lo que git va a subir de verdad: ramas protegidas, forzados, borrados, etiquetas | Cualquier agente, terminal o persona | `git push --no-verify`, o un repositorio con su propio `core.hooksPath` |
| 4. Atajos en el PATH (`glab`, `npm`, `curl`) | Fusionar con `glab`, `npm publish`, fusiones o etiquetas por API con `curl` | Cualquier terminal que herede el PATH | Una ruta absoluta, `Invoke-RestMethod` o un script que llame a la API |
| 5. GitLab (ramas protegidas, aprobaciones, alcance del token) | Todo, en el servidor | Todos | No se construye aquí; es la única capa que no se puede esquivar |

Qué decide cada capa: lo que es `deny` se bloquea siempre. Lo que pide confirmación (`ask`) se confirma en Claude Code,
se bloquea en Codex y en modo estricto, y en los hooks de git y los atajos se avisa por stderr y se deja pasar
(salvo `COMSATEL_GUARDIA_ASK=deny`, recomendado para workers sin nadie al teclado). El motor es uno solo
(`guardia-gitlab.mjs`, función `evaluar`); `guardia-git.mjs` y `guardia-shim.mjs` lo reutilizan.

### Instalación

Vista previa (no escribe nada) y aplicación:

    node hooks/instalar-guardias-universales.mjs
    node hooks/instalar-guardias-universales.mjs --apply --git-repo <ruta-del-repositorio>
    node hooks/instalar-guardias-universales.mjs --apply --git-global          # todos los repositorios
    node hooks/instalar-guardias-universales.mjs --apply --quitar              # deshace todo

Copia las guardias en `~/.comsatel-guardias/actual`, registra el hook en `~/.codex/hooks.json` (conserva los hooks
ajenos y guarda una copia), activa el `pre-push` y deja los atajos en `shims/`. Para activar los atajos hay que
anteponer esa carpeta al PATH de usuario y reiniciar Orca y las terminales: el instalador imprime el comando y no
toca tu PATH. `--git-global` se niega a reemplazar un `core.hooksPath` global existente salvo con `--forzar`.

### Verificación

`node hooks/probar-guardias-universales.mjs` usa repositorios de git reales con un remoto temporal y comprueba los
hooks de git, los atajos (incluidos los `.cmd` de Windows), el instalador y el protocolo de hook de Codex.
Además se comprobó con Codex 0.166 (`approval: never`, `sandbox: danger-full-access`): el hook se dispara, bloquea
`git push origin develop` y, en modo estricto, también el push de una rama feature. Sin modo estricto, Codex
dejó pasar ese push.

[no comprobado] opencode, Qoder y Antigravity: no se verificó si admiten hooks propios. Quedan cubiertos por las
capas 3 y 4 mientras corran en una terminal con el PATH y git configurados.
