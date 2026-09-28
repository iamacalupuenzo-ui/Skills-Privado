# Fallas conocidas de la mecánica de Orca

## `dispatch_capability_invalid` en worker_done de `opencode`

**Síntoma:** un worker despachado con `--agent opencode` termina su trabajo, intenta
reportar `worker_done`, y el mensaje que llega al coordinador (`orca orchestration
check --wait`) es un rechazo con este formato:

```json
{
  "type": "worker_done",
  "subject": "Rejected worker_done: ...",
  "payload": {
    "outcome": "succeeded",
    "_orcaLifecycleRejection": {
      "code": "dispatch_capability_invalid",
      "reason": "The Dispatch capability is missing. Pass --dispatch-capability <token> from your dispatch preamble."
    }
  }
}
```

**Confirmado en sesión 2026-09-26:** el mismo dispatch (`ctx_28fedcdad44e`, run
`run_2ac51359c093`) fue rechazado dos veces seguidas (14:39:51Z y 14:53:53Z) con
contenido idéntico y el archivo de salida sin cambios entre intentos (mismo tamaño y
mtime) — descarta que sea un problema de contenido. Un tercer intento (14:56:14Z) llegó
limpio, sin la anotación de rechazo, y el dispatch se asentó correctamente
(`status: completed`, `outcome: succeeded`, `capabilityRevokedAt` coincide con
`completedAt`). Parece un problema intermitente del adaptador `opencode` al propagar el
token de capability inyectado en el preámbulo — no ocurrió con `codex` ni `claude` en la
misma corrida.

## Manejo obligatorio

1. **No tratar el primer rechazo como fallo definitivo.** Reconocer (`check --ack`) el
   mensaje y volver a `check --wait` un ciclo más — el propio agente puede reintentar y
   tener éxito sin que cambie el contenido.
2. Verificar con `worker-show --dispatch <id>` que el `dispatch.status` siga en
   `dispatched`/`in_progress` (no `failed`, no `exited`). Mientras la liveness sea `live`,
   no hay prueba positiva de que el worker se haya detenido — seguir esperando, per la
   regla general de `orchestration` de nunca actuar sobre ausencia.
3. Si el archivo objetivo ya existe y su contenido no cambia entre reintentos (mismo
   tamaño/mtime) tras un tiempo razonable (referencia: ~15-20 minutos, 2-3 rechazos
   idénticos), esto es evidencia de que el trabajo está terminado y el problema es solo
   de la capa de mensajería.
4. **Nunca asentar manualmente sin confirmación explícita del usuario.** Si se decide
   forzar el cierre (`worker-stop` + `task-update --status completed`), eso es un
   override de la capa de seguridad de Orca (el token de capability existe para probar
   que quien reporta éxito es realmente el dispatch activo) — preguntar primero vía
   `AskUserQuestion`, nunca decidirlo solo.
5. Si tras el override manual llega igual un `worker_done` limpio más tarde (puede pasar,
   como en la sesión de referencia), no hay conflicto: reconocer el mensaje igual y
   verificar que el estado final del dispatch sea consistente (`worker-show`) — no repetir
   el `task-update`.

## Terminal bajo control manual (`user_takeover`)

Si `worker-show`/`worker-list` reporta `resource.state: user_owned` con
`retainedReason: user_takeover`, un humano tomó control de esa terminal en la app de
escritorio de Orca. No enviar comandos a esa terminal ni intentar liberarla — solo
seguir monitoreando con `check --wait`.

## Prompt no entregado al lanzar un worker (modo terminal)

**Síntomas** (sesión FleetOperations del 2026-09-27, se repitió en casi la mitad de los despachos):
- `worker-start` devuelve `state: failed` o `outcome_unknown` y el `preview` de `worker-show` muestra `› Ask Codex to do anything`: el agente arrancó, pero el prompt nunca llegó.
- El `preview` muestra `[Pasted Content N chars]`: el prompt quedó pegado sin enviar.
- Pasa sobre todo cuando Enzo no tiene abierta la pestaña del agente en Orca.

**Manejo obligatorio:** despacha siempre con `scripts/dispatch-worker.sh`, no con `worker-start` suelto. El script espera 15 s y lee la terminal. Si ve el prompt pegado, envía Enter; si el agente está vacío, reenvía el spec con `orca terminal send --text ... --enter`; si ve que el agente ya trabaja, no toca nada. Para lanzar varios workers en paralelo: `dispatch-worker.sh ... & dispatch-worker.sh ... & wait`.

**Consecuencia:** si el spec se reenvió a mano, el dispatch ya quedó asentado como fallido y Orca rechaza el `worker_done` («inactive dispatch … already settled»). En ese caso no esperes el `worker_done`: confirma el resultado leyendo el archivo de reporte del spec (por ejemplo, con un bucle que espere a que aparezca la sección pedida) y después haz `check --ack` del rechazo.
