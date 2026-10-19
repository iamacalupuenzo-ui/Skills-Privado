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
| Fusionar un MR (`/merge`, `glab mr merge`) | Bloquea | El agente no fusiona; revisa y fusiona César | César (o Enzo en GitLab) |
| Crear o borrar etiquetas (`git tag`, `--tags`, API de tags) | Bloquea | Una etiqueta `ds-vX.Y.Z` publica el paquete del sistema de diseño | César |
| `npm publish` | Bloquea | Publicar un paquete es irreversible | César, por etiqueta |
| `git push` a `develop`, `main` o `release` | Bloquea | Están protegidas: solo entran por MR | César, tras el MR |
| `git push --force`, `+rama`, `--delete` | Bloquea | Reescribe o borra historia remota | Enzo, en su terminal |
| Mostrar el token o escribirlo en un comando | Bloquea | Queda en el historial y la conversación | Nadie: usa la variable |
| `git push` de una rama `feature/*` | Pide confirmación | Regla B1: nada se sube sin tu visto bueno | Tú confirmas |
| Abrir un MR por la API | Pide confirmación | Debe ir a `develop`, asignado a César y enlazado a su pareja | Tú confirmas |
| Subir algo desde `ui-components` | Pide confirmación, con aviso | Un cambio en el DS afecta a todos los productos | Tú confirmas |

Pasan sin aviso: `git status`, `fetch`, `log`, `git push --dry-run`, `git tag --list` y las
consultas de lectura a la API.

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
- `hooks/probar-guardia.mjs` — 40 casos: lo que debe bloquear, confirmar y dejar pasar.
- `hooks/instalar-hooks.mjs` — lo instala en tu configuración de Claude Code.

## Instalar, probar y retirar

```
node skills/orquestador-desarrollo/hooks/probar-guardia.mjs
node skills/orquestador-desarrollo/hooks/instalar-hooks.mjs
node skills/orquestador-desarrollo/hooks/instalar-hooks.mjs --quitar
```

El instalador copia el guardia a `~/.claude/hooks/` (así `skils update` no lo borra), agrega un
solo hook `PreToolUse` para Bash y PowerShell, deja copia de respaldo de `settings.json` y no
toca los demás hooks. Ábrelo en una sesión nueva para que se cargue.

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
