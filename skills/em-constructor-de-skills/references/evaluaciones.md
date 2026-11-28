# Evaluaciones

Leer al escribir o cambiar las evals de un skill y antes de distribuirlo. Los casos de este
skill están en `evals/evals.json`; la plantilla, en `templates/evals.plantilla.json`.

## Cuándo se escriben

Antes de la documentación extensa, como pide la guía de Anthropic: primero se observa qué
hace el agente sin el skill, se anotan los fallos y se escriben los casos que los cubren.
Luego se escribe lo mínimo del skill que los hace pasar.

## Cómo es un caso

| Campo | Qué lleva |
|---|---|
| `tipo` | `ruta` si el skill debe completar el trabajo; `frena` si debe detenerse |
| `prompt` | El pedido tal como lo escribiría la persona |
| `expected_output` | Qué hace el skill, paso a paso |
| `assertions` | Al menos 2 comportamientos observables |
| `cubre` | Las reglas de bloqueo (`B#`) que prueba; deben existir en el SKILL.md |
| `referencias` | Las guías que el caso obliga a leer; deben existir |
| `contexto` | Estado de partida: repositorio, rama, datos disponibles |

Mínimo 5 casos y al menos uno de tipo `frena`. `scripts/validar_skill.py` y `npm test`
lo comprueban.

## Registro de ejecución

No existe un ejecutor integrado de evals. Para cada corrida guardar petición, agente y
versión, resultado observado, evidencia y estado: aprobado, falló o no ejecutado. Anotar el
resultado en la base **Evals** de Notion. No marcar aprobado por encontrar palabras del
propio skill en la respuesta.

Para código: incluir entrada válida, inválida y repetida, y aislar el sistema de archivos y
la red. Si falta una dependencia, informar el comando no ejecutado; no simular el resultado.

Referentes:
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- https://agentskills.io/skill-creation/evaluating-skills
