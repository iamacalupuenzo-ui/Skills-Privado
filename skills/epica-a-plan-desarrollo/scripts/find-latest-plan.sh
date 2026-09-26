#!/usr/bin/env bash
# Contrato: recibe el nombre del proyecto ($1). Busca en
# "$PLANES_BASE/<proyecto>/" (por defecto "D:\Investigacion - V4\01-proyectos",
# override vía la variable de entorno PLANES_BASE para pruebas o portabilidad)
# archivos que coincidan con epica-a-plan-desarrollo-<proyecto>-v*.md.
#
# Si encuentra alguno: imprime en stdout la ruta completa del de mayor número de
# versión, sale 0 → modo ACTUALIZAR.
# Si no encuentra ninguno (o la carpeta del proyecto no existe): no imprime nada,
# sale 1 → modo ANALIZAR.
# Nunca crea la carpeta ni el archivo — solo lee.

set -euo pipefail

PROYECTO="${1:?Uso: find-latest-plan.sh <nombre-proyecto>}"
BASE="${PLANES_BASE:-/d/Investigacion - V4/01-proyectos}"
DIR="$BASE/$PROYECTO"

if [ ! -d "$DIR" ]; then
  exit 1
fi

LATEST=""
LATEST_N=-1

shopt -s nullglob
for f in "$DIR"/epica-a-plan-desarrollo-"$PROYECTO"-v*.md; do
  base_name="$(basename "$f")"
  n="$(echo "$base_name" | sed -E "s/^epica-a-plan-desarrollo-$PROYECTO-v([0-9]+).*/\1/")"
  case "$n" in
    ''|*[!0-9]*) continue ;;
  esac
  if [ "$n" -gt "$LATEST_N" ]; then
    LATEST_N="$n"
    LATEST="$f"
  fi
done

if [ -z "$LATEST" ]; then
  exit 1
fi

echo "$LATEST"
exit 0
