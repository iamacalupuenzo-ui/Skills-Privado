#!/bin/bash
# Despacha un worker de Orca y garantiza que el prompt llegue al agente.
#
# Por qué existe: en modo terminal, `worker-start` a veces deja el prompt pegado sin enviar
# ("[Pasted Content N chars]") o devuelve `state: failed` sin entregarlo, sobre todo cuando
# Enzo no tiene abierta la pestaña del agente. Este script revisa la terminal 15 s después
# y, según lo que vea, envía Enter o reenvía el spec completo con `orca terminal send`.
# Ver references/known-issues.md, sección "Prompt no entregado".
#
# Uso:
#   dispatch-worker.sh <run_id> <archivo_spec> <titulo> <agente> <modelo> <esfuerzo> [repo]
# Ejemplo:
#   dispatch-worker.sh run_0163... spec.txt "Validador - Bitácora" codex gpt-6-luna low "/d/Proyectos - V4/Proyecto-Comsatel-v1"
# Para lanzar varios en paralelo: `dispatch-worker.sh ... & dispatch-worker.sh ... & wait`.
#
# Salida: una línea "<titulo>: D=<dispatch_id> <trabajando|+enter|+enviado a mano>".
# Si fue "+enviado a mano", Orca puede rechazar luego el worker_done por "inactive dispatch":
# en ese caso, confirma el resultado leyendo el archivo de reporte (no esperes el worker_done).

RUN="$1"; SPEC="$2"; TITLE="$3"; AGENT="$4"; MODEL="$5"; EFFORT="$6"; REPO="${7:-$PWD}"
ORCA="${ORCA_CLI_COMMAND:-orca}"
cd "$REPO" || exit 1

MODEL_ARGS=()
[ -n "$MODEL" ] && [ "$AGENT" != "opencode" ] && MODEL_ARGS+=(--model "$MODEL")
[ -n "$EFFORT" ] && MODEL_ARGS+=(--effort "$EFFORT")

R=$(timeout 200 "$ORCA" orchestration worker-start --run "$RUN" --spec "$(cat "$SPEC")" --task-title "$TITLE" \
  --worktree current --agent "$AGENT" "${MODEL_ARGS[@]}" --timeout-ms 150000 --json 2>&1)
D=$(echo "$R" | grep -oE '"dispatchId": *"[^"]+"' | head -1 | sed 's/.*"\(ctx_[^"]*\)"/\1/')
[ -z "$D" ] && { echo "$TITLE: SIN DISPATCH: $(echo "$R" | head -c 300)"; exit 1; }

sleep 15
W=$("$ORCA" orchestration worker-show --dispatch "$D" --json 2>&1)
H=$(echo "$W" | grep -oE 'term_[a-f0-9-]{36}' | head -1)
P=$(echo "$W" | grep -oE '"preview": *"[^"]{0,600}' | head -1)

if echo "$P" | grep -q "Pasted Content"; then
  "$ORCA" terminal send --terminal "$H" --enter --json >/dev/null 2>&1
  echo "$TITLE: D=$D +enter"
elif echo "$P" | grep -qE "esc to interrupt|Working"; then
  echo "$TITLE: D=$D trabajando"
else
  TXT="$(tr '\n' ' ' < "$SPEC") AL TERMINAR reporta con orca orchestration worker-done (dispatch $D; revisa --help para los flags)."
  "$ORCA" terminal send --terminal "$H" --text "$TXT" --enter --json >/dev/null 2>&1
  echo "$TITLE: D=$D +enviado a mano"
fi
