#!/usr/bin/env bash
# Contrato: recibe el ejecutable Orca resuelto como $1 (opcional; si se omite, corre
# resolve-orca.sh). Imprime un resumen de una línea por proveedor (claude/codex) con el
# % de uso de sesión y semanal, y sale con código 1 si algún proveedor supera el umbral
# de aviso (80%) para que el llamador decida avisar al usuario. Nunca cambia de cuenta:
# solo lee y reporta.

set -euo pipefail
WARN_THRESHOLD=80

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CMD="${1:-$("$SCRIPT_DIR/resolve-orca.sh")}"

JSON="$("$CMD" account list --json)"

over_threshold=0

extract_and_report() {
  local provider="$1"
  local label="$2"
  # Extracción best-effort sin dependencia de jq: toma el bloque del proveedor y sus
  # dos usedPercent (session, weekly) en orden de aparición.
  local block
  block="$(echo "$JSON" | tr -d '\n' | grep -oE "\"$provider\"[[:space:]]*:[[:space:]]*\{[^}]*\"session\"[[:space:]]*:[[:space:]]*\{[^}]*\}[^}]*\"weekly\"[[:space:]]*:[[:space:]]*\{[^}]*\}" || true)"
  if [ -z "$block" ]; then
    echo "$label: sin datos de rateLimits (¿cuenta no configurada?)"
    return
  fi
  local session_pct weekly_pct
  session_pct="$(echo "$block" | grep -oE '"session"[[:space:]]*:[[:space:]]*\{[^}]*"usedPercent"[[:space:]]*:[[:space:]]*[0-9]+' | grep -oE '[0-9]+$' || echo "?")"
  weekly_pct="$(echo "$block" | grep -oE '"weekly"[[:space:]]*:[[:space:]]*\{[^}]*"usedPercent"[[:space:]]*:[[:space:]]*[0-9]+' | grep -oE '[0-9]+$' || echo "?")"
  echo "$label: sesión ${session_pct}% · semanal ${weekly_pct}%"
  if [ "$session_pct" != "?" ] && [ "$session_pct" -ge "$WARN_THRESHOLD" ]; then
    over_threshold=1
  fi
  if [ "$weekly_pct" != "?" ] && [ "$weekly_pct" -ge "$WARN_THRESHOLD" ]; then
    over_threshold=1
  fi
}

extract_and_report "claude" "Claude"
extract_and_report "codex" "Codex"

if [ "$over_threshold" -eq 1 ]; then
  echo "AVISO: al menos una cuenta supera ${WARN_THRESHOLD}% de uso — avisar a Enzo antes de despachar. No cambiar de cuenta automáticamente." >&2
  exit 1
fi

exit 0
