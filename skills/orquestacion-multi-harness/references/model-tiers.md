# Mapa de modelos por capacidad

Vigencia: confirmado en la sesión del 2026-09-26. Los slugs de modelo cambian con el
tiempo — antes de usar un id de esta tabla en producción, verifica que siga existiendo
(ver "Cómo comprobar vigencia" al final).

## Codex (familia 5.6, vía `--model` en `orca orchestration worker-start`)

| Tier | Slug | Descripción oficial (`~/.codex/models_cache.json`) |
|---|---|---|
| Alta capacidad | `gpt-5.6-sol` | "Older coding model for complex work" |
| Capacidad media | `gpt-5.6-terra` | "Older balanced model for straightforward work" |
| Capacidad baja / rápida | `gpt-5.6-luna` | "Older fast and efficient model" |

No asumas que "Luna" es la capacidad media solo porque suena a punto intermedio entre
Sol y Terra — su propia descripción dice "fast and efficient", que es el escalón bajo.
Terra es el que dice "balanced ... straightforward work".

## Claude (vía `--model`, requiere `--effort`)

| Tier | Model ID |
|---|---|
| Alta capacidad | `claude-opus-5-5` |
| Capacidad media | `claude-sonnet-5` |
| Capacidad baja / rápida | `claude-haiku-4-5-20251001` |

`claude-fable-5-1` existe como variante de "fast mode" (ver system reminder de la
sesión), no como parte de esta escalera de capacidad — no lo asignes a un tier sin que
el usuario lo pida explícitamente.

## OpenCode

El modelo **no se controla desde Orca**. `worker-start --agent opencode` no acepta
`--model` con efecto real (la nota de `worker-start --help` dice: "Other agents,
including opencode, launch with the model from their own config"). Si el usuario pide
"un modelo gratuito en OpenCode", ese ajuste va en la configuración propia de OpenCode,
no en este skill ni en el comando de Orca. No prometas control de modelo ahí.

## Cómo comprobar vigencia

1. Codex: leer `~/.codex/models_cache.json`, buscar el campo `slug` y `description` de
   cada modelo (`grep -i "slug\|display_name\|description" ~/.codex/models_cache.json`).
   Si un slug de esta tabla ya no aparece, está retirado — no lo uses sin confirmar
   reemplazo con el usuario.
2. Claude: los model IDs vigentes están en el system reminder de la sesión activa
   ("Assistant knowdledge..." / "Model IDs —"). Si no coincide con esta tabla, prevalece
   el system reminder de la sesión, no este archivo.
3. OpenCode: no hay un `models_cache.json` equivalente conocido; si el usuario necesita
   saber qué modelo está activo, es una pregunta para la configuración de OpenCode, no
   para Orca.
