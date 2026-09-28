# Protocolo MULTI-HARNESS

Se activa cuando el entorno tiene Orca corriendo con Codex, Claude y OpenCode
disponibles, y el usuario pidió explícitamente repartir el trabajo entre agentes. Este
protocolo es una capa de política sobre la mecánica cruda de Orca — para el detalle de
cada comando (`worker-start`, `check`, recuperación), carga el skill `orchestration`
propio de Orca (`ORCA skills get orchestration`); no lo reproduzcas de memoria aquí.

## Fase 0 — Resolver ejecutable y cargar la guía

1. Ejecutar `scripts/resolve-orca.sh` para obtener el ejecutable correcto de esta sesión.
2. `ORCA skills get orchestration --json` (una vez por sesión) — el kernel de la mecánica
   cruda. Releer solo si el binario reporta una versión distinta a la ya cargada.

## Fase 1 — Verificar capacidad de cuentas antes de despachar

Ejecutar `scripts/check-capacity.sh`. Si alguna cuenta (Claude o Codex) que este DAG va a
usar aparece con uso de sesión o semanal por encima de ~80%, avisar a Enzo con el dato
concreto (cuenta, % usado, cuándo resetea) **antes** de despachar — nunca intentar
cambiar de cuenta por tu cuenta (ver bloqueante B5 del SKILL.md principal). Si Enzo no
responde a la advertencia, continuar solo si el DAG es corto o él ya confirmó tolerar el
riesgo.

## Fase 2 — Asignar modelo por tier

Leer `references/model-tiers.md`. Para cada fase del DAG, mapear la capacidad requerida
(alta/media/baja) al slug correcto del agente asignado. Para `opencode`, no pasar
`--model` — el modelo se rige por su propio config (ver model-tiers.md).

## Fase 3 — Crear el Run y despachar

```text
ORCA orchestration run-create --objective "<objetivo del DAG>" --json
ORCA orchestration worker-start --run <run_id> --spec "<Target/Change/Constraints/
  Ownership/Observable acceptance — ver el Task-spec contract de orchestration>" \
  --task-title "<fase>" --worktree current --agent <codex|claude|opencode> \
  [--model <slug> --effort <level>] --json
```

- `--worktree` **nunca** apunta a `D:\Investigacion - V4\...` — ver
  `references/artifact-locations.md`. El código/harness corre en el repo del proyecto.
- **Despacha con `scripts/dispatch-worker.sh`**, no con `worker-start` suelto: garantiza que el prompt llegue aunque la pestaña del agente esté cerrada (ver `references/known-issues.md`, «Prompt no entregado»).
- Si `worker-start` falla en `agent_readiness` por timeout, seguir la recuperación
  estándar de `orchestration`: `worker-release` del residual, luego `worker-start
  --retry-of <dispatch_id> --task <task_id>` con `--timeout-ms` más alto (referencia:
  180000). No asumas que el agente no llegó a estar listo — revisa el `preview` de la
  terminal en `worker-show` antes de descartar el intento.

## Fase 4 — Monitorear

```text
ORCA orchestration check --wait --types "worker_done,escalation,question" --timeout-ms 900000 --json
```

Para cada mensaje recibido:
- `worker_done` limpio (sin `_orcaLifecycleRejection`): validar contra el dispatch activo,
  decidir reuse/retain/release, `check --ack`.
- `worker_done` con `_orcaLifecycleRejection` (`dispatch_capability_invalid` de
  `opencode`): seguir `references/known-issues.md` — no es fallo definitivo, ack y seguir
  esperando antes de considerar override manual.
- `question`/`escalation`: responder o resolver antes de hacer ack.

Si una fase del DAG tiene dependencia real en el output de otra (ej. la fase 3 necesita
el archivo que escribió la fase 2), no despaches la fase dependiente hasta confirmar
`worker_done` válido de la fase previa — no uses la oleada paralela de `orchestration`
para pasos con dependencia real.

## Fase 5 — Cierre

Verificar `worker-list --run <run_id> --terminal-state reclaimable --json` devuelve
vacío antes de reportar. Reportar por fase: estado en Orca, archivo generado (ruta
completa), y cualquier anomalía (rechazos, overrides manuales, cuentas cerca del
límite) con su resolución.
