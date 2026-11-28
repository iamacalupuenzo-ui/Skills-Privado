#!/usr/bin/env bash
# Prepara desde origin/develop, sube con notion-sync.js y verifica, una página por línea.
# Uso: bash subir-lote.sh <archivo-lista> <carpeta-salida>
# Cada línea de la lista:  ID|page_id|ruta/en/el/repo.md
D="$(cd "$(dirname "$0")" && pwd)"; MOD="$(cd "$D/.." && pwd)"; [ "$(basename "$D")" = historico ] && MOD="$(cd "$D/../.." && pwd)"
S="${NOTION_TRABAJO:-$MOD/trabajo}"
WT="${NOTION_WORKTREE:-$(grep -o '"worktree": *"[^"]*"' "$MOD/config.json" | sed 's/.*: *"//;s/"$//')}"
N="${NOTION_SYNC:-$(cd "$(dirname "$0")/.." && pwd)/notion-sync.js}"
LISTA="$1"; OUT="$2"
mkdir -p "$OUT"; : > "$OUT/resumen.txt"
FALLOS=0
while IFS='|' read -r ID PAGE RPATH <&3; do
  [ -z "$ID" ] && continue
  git -C "$WT" show "origin/develop:$RPATH" > "$OUT/$ID-origen.md" 2>"$OUT/$ID-err.txt" || { echo "$ID | FALLO git show" >> "$OUT/resumen.txt"; FALLOS=$((FALLOS+1)); continue; }
  node "$S/prepare-body.js" "$RPATH" "$OUT/$ID-origen.md" "$OUT/$ID-cuerpo.md" "$WT" "$ID" > "$OUT/$ID-prep.json" || { echo "$ID | FALLO prepare" >> "$OUT/resumen.txt"; FALLOS=$((FALLOS+1)); continue; }
  node "$N" push --page "$PAGE" --body "$OUT/$ID-cuerpo.md" --source "$RPATH" --loaded "$(date +%F)" > "$OUT/$ID-push.json" 2>&1 || { echo "$ID | FALLO push: $(head -c 200 "$OUT/$ID-push.json")" >> "$OUT/resumen.txt"; FALLOS=$((FALLOS+1)); continue; }
  V=$(node "$N" verify --page "$PAGE" --body "$OUT/$ID-cuerpo.md" 2>&1 | grep -v Assertion)
  echo "$ID | $V" >> "$OUT/resumen.txt"
  echo "$V" | grep -q '"ok":true' || FALLOS=$((FALLOS+1))
done 3< "$LISTA"
echo "FALLOS: $FALLOS" >> "$OUT/resumen.txt"
