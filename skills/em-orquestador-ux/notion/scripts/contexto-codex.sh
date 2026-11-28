#!/usr/bin/env bash
# Pide a Codex (solo lectura) la ficha de contexto de cada pregunta, en lotes de 4. Uso: bash contexto-codex.sh <inicio> <paso>  (lotes inicio, inicio+paso, …)
D="$(cd "$(dirname "$0")" && pwd)"; MOD="$(cd "$D/.." && pwd)"; [ "$(basename "$D")" = historico ] && MOD="$(cd "$D/../.." && pwd)"
S="${NOTION_TRABAJO:-$MOD/trabajo}"
WT="${NOTION_WORKTREE:-$(grep -o '"worktree": *"[^"]*"' "$MOD/config.json" | sed 's/.*: *"//;s/"$//')}"
OUT="$S/preguntas/ctx"
INI=${1:-1}; PASO=${2:-1}
N=$(ls "$OUT"/prompt-*.md | wc -l)
cd "$WT" || exit 1
for ((lote=INI; lote<=N; lote+=PASO)); do
  [ -s "$OUT/salida-$lote.json" ] && continue
  codex exec -C "$WT" -m gpt-5.6-terra -s read-only -o "$OUT/salida-$lote.json" - < "$OUT/prompt-$lote.md" > "$OUT/log-$lote.txt" 2>&1
  echo "lote $lote terminado ($?) $(date +%H:%M:%S)" >> "$OUT/progreso.txt"
done
echo "fin turno $INI/$PASO $(date +%H:%M:%S)" >> "$OUT/progreso.txt"
