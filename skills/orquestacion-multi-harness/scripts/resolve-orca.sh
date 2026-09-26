#!/usr/bin/env bash
# Contrato: imprime en stdout el nombre del ejecutable Orca correcto para esta sesión,
# y sale con código 0. Si el ejecutable resuelto no puede correr, imprime el error exacto
# en stderr y sale con código 1 — no cae a otro ejecutable en silencio.
#
# Misma lógica de resolución que el skill `orchestration` de Orca:
#   1. ORCA_CLI_COMMAND si está seteada
#   2. orca-dev si ORCA_DEV_REPO_ROOT está seteada (checkout de desarrollo)
#   3. orca-ide en Linux fuera de una terminal gestionada por Orca (nunca `orca` bare ahí:
#      resuelve al lector de pantalla GNOME Orca, no a este binario)
#   4. orca en cualquier otro caso

set -euo pipefail

resolve() {
  if [ -n "${ORCA_CLI_COMMAND:-}" ]; then
    echo "$ORCA_CLI_COMMAND"
    return 0
  fi
  if [ -n "${ORCA_DEV_REPO_ROOT:-}" ]; then
    echo "orca-dev"
    return 0
  fi
  if [ "$(uname -s 2>/dev/null)" = "Linux" ]; then
    echo "orca-ide"
    return 0
  fi
  echo "orca"
  return 0
}

CMD="$(resolve)"

if ! "$CMD" --version >/dev/null 2>&1; then
  echo "No se pudo ejecutar '$CMD --version'. No se cae a otro ejecutable — reportar este error exacto." >&2
  exit 1
fi

echo "$CMD"
