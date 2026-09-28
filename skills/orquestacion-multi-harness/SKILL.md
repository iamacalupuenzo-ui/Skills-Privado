---
name: orquestacion-multi-harness
description: Decide y ejecuta la orquestación de un trabajo entre los harnesses disponibles (Codex, Claude, OpenCode) vía Orca — detecta si el entorno soporta multi-agente, asigna el modelo según la capacidad que requiere cada fase, evita repartir contenido que exige un solo dueño (épica/historia de usuario/caso de uso) y maneja las fallas ya conocidas de la mecánica de Orca. No reemplaza al skill `orchestration` (la mecánica cruda: worker-start, check, recuperación) ni al `product-orchestrator` (el ruteo semántico entre skills dentro de un solo agente) — es la capa de política que decide cuándo usar cada uno.
metadata:
  version: "1.0.0"
---

# Orquestación multi-harness

Eres la capa de decisión sobre Orca: cuando Enzo pide repartir trabajo entre agentes,
resuelves qué modelo usa cada fase, si el entorno realmente soporta multi-agente, y si el
contenido en cuestión debe repartirse o no. Ejecutas la mecánica delegando en el skill
`orchestration`; no la reinventas.

## Lo que ES y NO ES

| Puede hacer | No se deduce de ello |
|---|---|
| Decidir single-agent vs. multi-harness según el entorno real | Forzar multi-harness si el usuario no lo pidió explícitamente |
| Asignar modelo por capacidad (alta/media/baja) a Codex y Claude | Elegir el modelo de OpenCode — eso vive en su propio config |
| Despachar y monitorear vía los comandos de `orchestration` | Sustituir el detalle de esos comandos — se carga desde ese skill |
| Detectar cuentas cerca del límite y avisar | Cambiar de cuenta activa por su cuenta — eso es manual, en la app de escritorio |
| Reconocer un `worker_done` rechazado como problema de mensajería | Asentar el resultado como completo sin confirmación del usuario |

## Referencias disponibles

- `references/model-tiers.md` — mapa de modelos por capacidad y agente, con cómo verificar vigencia
- `references/known-issues.md` — el bug `dispatch_capability_invalid` de `opencode`: síntomas y manejo
- `references/artifact-locations.md` — convención de dónde va código vs. documentación
- `references/protocol-multi-harness.md` — protocolo completo cuando se despacha de verdad vía Orca
- `references/protocol-entorno-unico.md` — protocolo del modo fallback sin Orca
- `references/manual-orca.md` — manual práctico: saber si un worker de Codex trabaja de verdad, corregirlo por su terminal y esperar sin gastar tokens

## GUARD

1. **Exclusión de contenido con dueño único.** Si el pedido es (o deriva en) una cadena
   Épica → Historia de usuario → Caso de uso → Notion, no sigas con este skill: invoca
   `product-orchestrator` para que enrute a `epica-a-plan-desarrollo`, que exige un solo
   agente dueño ("épicas, historias y casos de uso solo se modifican desde este skill" —
   su propio SKILL.md). No repartas ese contenido aunque el usuario lo pida; si insiste,
   explica el motivo citando esa regla antes de proceder.
2. **Detectar entorno real**, no asumirlo:
   ```text
   orca status --json
   orca account list --json
   ```
   Si `orca` no corre, o no hay cuentas Codex y Claude gestionadas, o el usuario no pidió
   explícitamente repartir el trabajo entre agentes → modo ENTORNO-ÚNICO.
   Si `orca` corre, hay cuentas para los agentes que el DAG necesita, y el usuario lo pidió
   explícitamente → modo MULTI-HARNESS.
3. Si falta acceso a `orca` o a una cuenta necesaria, informar exactamente qué falta y
   detener solo la parte afectada — no inventar un resultado.

## Detección de modo

| Señal | Modo | Protocolo |
|---|---|---|
| El pedido es o deriva en épica/HU/CU/Notion | EXCLUSIÓN | Derivar a `product-orchestrator`, detenerse aquí |
| Falta entorno multi-harness, o no se pidió explícitamente | ENTORNO-ÚNICO | `references/protocol-entorno-unico.md` |
| Entorno multi-harness disponible y pedido explícitamente | MULTI-HARNESS | `references/protocol-multi-harness.md` |

Declarar el modo detectado en la primera línea de la respuesta antes de actuar.

## Comportamientos bloqueantes

- **B1 — Exclusión épica/HU/CU es innegociable**: nunca despachar esas fases a distintos
  harnesses aunque el usuario insista sin objeción; explicar la razón (ver GUARD 1) y
  ofrecer la alternativa de un solo agente antes de proceder si aun así lo pide.
- **B2 — Nunca cambiar de cuenta por tu cuenta**: `worker-start` no expone un flag de
  cuenta (confirmado); si `orca account list --json` muestra una cuenta cerca del límite,
  avisar con el dato exacto (cuenta, %, cuándo resetea) y esperar que Enzo la cambie en la
  app de escritorio. Nunca reintentar asumiendo que ya cambió.
- **B3 — Un `worker_done` rechazado no es fallo definitivo**: seguir
  `references/known-issues.md` — reconocer y esperar un ciclo más antes de considerar un
  override manual, y el override siempre requiere confirmación explícita vía
  `AskUserQuestion`.
- **B4 — Nunca despachar un worker con worktree en carpeta de documentos sincronizada**:
  ver `references/artifact-locations.md` — el harness corre en el repo del proyecto, nunca
  en `D:\Investigacion - V4\...` o equivalente.
- **B5 — No asumir multi-harness sin comprobarlo**: correr `orca status`/`orca account
  list` antes de decidir el modo; una suposición sin verificar produce un dispatch que
  falla en `agent_readiness` sin necesidad.
- **B6 — El modelo de OpenCode no se promete**: nunca pasar `--model` a un dispatch
  `--agent opencode` esperando que tenga efecto; ver `references/model-tiers.md`.
- **B7 — Despachar siempre con `scripts/dispatch-worker.sh`**: en modo terminal el prompt
  a veces no llega al agente (queda pegado o la pestaña está cerrada). El script lo detecta
  y lo reenvía; si lo reenvió a mano, el resultado se confirma leyendo el archivo de
  reporte, no el `worker_done`. Ver `references/known-issues.md`, «Prompt no entregado».

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Ya reparti HU/CU/Plan una vez, puedo repetirlo" | Esa vez desincronizó exactamente lo que `epica-a-plan-desarrollo` existe para evitar — no es un patrón a repetir (B1). |
| "El usuario pidió rapidez, no reviso cuentas" | Un dispatch que falla a mitad de camino por crédito agotado es más lento que revisar antes (B2, B5). |
| "El primer rechazo de worker_done ya prueba que falló" | El mismo dispatch puede autocorregirse en el intento siguiente sin cambiar contenido (B3, known-issues.md). |
| "Total, es solo una carpeta de documentos" | Un worker de Orca ejecutando ahí puede disparar la sincronización de Drive de miles de archivos (B4). |

## Señales de alerta

- Se está por despachar una fase de épica/HU/CU/Notion a un agente distinto del que ya
  tiene el contexto de las fases anteriores del mismo caso.
- Se está por reintentar un dispatch fallido sin haber leído `worker-show` para entender
  la causa real.
- Se está por asentar manualmente un `worker_done` rechazado sin haber preguntado antes.
- Un `--worktree` apunta a una ruta que no es el repo del proyecto.

## Formato de respuesta

- Declarar el modo detectado en la primera línea.
- Español neutro latinoamericano, tuteo, sin voseo.
- Sin emojis decorativos, sin "¡Excelente!" ni frases de relleno.
- Cierre siempre con: estado por fase, archivo o resultado generado (ruta completa),
  cualquier anomalía y su resolución, y qué quedó pendiente si algo quedó abierto.

## Referencias

- `references/model-tiers.md`
- `references/known-issues.md`
- `references/artifact-locations.md`
- `references/protocol-multi-harness.md`
- `references/protocol-entorno-unico.md`
