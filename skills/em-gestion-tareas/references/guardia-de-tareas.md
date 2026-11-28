# Guardia de tareas (hook)

`~/.claude/hooks/comsatel-guardia-tareas.mjs`, registrado como `PreToolUse` para
`Bash|PowerShell|mcp__claude_ai_Notion__notion-create-pages|mcp__claude_ai_Notion__notion-update-page`
(2026-11-26). Responde con `permissionDecision` y salida 0, igual que la guardia de GitLab.

## Qué hace

| Acción | Decisión |
|---|---|
| Crear en la base Tareas una página con título de código (`XXX-UX`, `XXX-FRONT · NN`) sin alguna sección de la estructura, sin fecha límite o sin criterio de cierre | Bloquea |
| Reemplazar el contenido de una tarea (`replace_content`) dejando fuera una sección | Bloquea |
| `publicar.mjs --ejecutar` o `tablero-dia.mjs --ejecutar` | Pide confirmación, salvo delegación del día |
| `curl`, `fetch` o `Invoke-RestMethod` que escribe en `api.clickup.com` o en `/api/v4/projects/…/issues` | Pide confirmación, salvo delegación del día |
| Una actividad corta (título sin código), otra base, una lectura o una corrida en seco | Pasa |

## Delegación del día

Si Enzo dijo «ejecútalo tú», `scripts/delegar.mjs delegar` guarda la fecha en
`~/.claude/em-gestion-tareas/delegacion.json` y el hook deja de preguntar hasta el fin de ese día
(hora de Lima). Al día siguiente vuelve a preguntar. La revisión de estructura en Notion no se
apaga: no es una confirmación, solo bloquea una tarea mal formada.

## Probarlo

Los 8 casos se probaron el 2026-11-26 con el contenido real del DSP-009 (Identidad visual del
Cliente y base del Producto): una tarea sin estructura se bloquea, la generada por el script pasa,
la reunión pasa, `publicar` en seco pasa y con `--ejecutar` pregunta, un POST a un issue pregunta y
un GET pasa.

## Límites

- Revisa el texto, no el significado: una sección con contenido pobre pasa.
- `escribir-notion.mjs` escribe por la API REST y no pasa por este hook: por eso revisa las mismas secciones antes de escribir y vuelve a leer la página después.
- En otros perfiles de Orca hay que registrarlo en su `settings.json`.

## Instalarlo en otra computadora

El hook viaja dentro del skill (`hooks/guardia-tareas.mjs`). Al instalar el skill en otra computadora:

1. Copia `hooks/guardia-tareas.mjs` a `~/.claude/hooks/comsatel-guardia-tareas.mjs`.
2. Agrega en `~/.claude/settings.json` (o en el `settings.json` de cada perfil de Orca), dentro de `hooks.PreToolUse`:

   ```json
   { "matcher": "Bash|PowerShell|mcp__claude_ai_Notion__notion-create-pages|mcp__claude_ai_Notion__notion-update-page",
     "hooks": [{ "type": "command", "command": "node \"<home>/.claude/hooks/comsatel-guardia-tareas.mjs\"", "timeout": 10 }] }
   ```

3. Abre una sesión nueva y prueba un caso de «Probarlo».

Los scripts leen sus credenciales de variables de entorno o de archivos de la persona
(`GITLAB_TOKEN`, `~/.clickup/token.txt`, `NOTION_TOKEN` o `~/.notion/token.txt`): nunca viajan en el skill.
