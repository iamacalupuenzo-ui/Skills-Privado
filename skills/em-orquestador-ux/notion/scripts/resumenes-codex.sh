#!/usr/bin/env bash
# Pide a Codex (solo lectura) un resumen "En 30 segundos" por cada UXR, en lotes de 5. No escribe en el repo.
D="$(cd "$(dirname "$0")" && pwd)"; MOD="$(cd "$D/.." && pwd)"; [ "$(basename "$D")" = historico ] && MOD="$(cd "$D/../.." && pwd)"
S="${NOTION_TRABAJO:-$MOD/trabajo}"
WT="${NOTION_WORKTREE:-$(grep -o '"worktree": *"[^"]*"' "$MOD/config.json" | sed 's/.*: *"//;s/"$//')}"
OUT="$S/resumenes"; mkdir -p "$OUT"
cd "$WT" || exit 1
mapfile -t FILES < <(ls design/ux-requirements/UXR-*.md | sort)
N=${#FILES[@]}; B=5; i=0; lote=1
while [ $i -lt $N ]; do
  LISTA=""
  for ((k=i; k<i+B && k<N; k++)); do LISTA+="- ${FILES[$k]}"$'\n'; done
  cat > "$OUT/prompt-$lote.md" <<EOF
Eres redactor técnico de UX. Solo lectura: no modifiques ningún archivo del repositorio.

Lee estos documentos (UX Requirements) de la carpeta actual:
$LISTA
Para CADA documento escribe un resumen "En 30 segundos" para alguien que NO lo ha leído, con estos cuatro campos, en español, sin Markdown, sin saltos de línea dentro de un campo:
- "permite": qué consigue la persona usuaria o qué garantiza este requisito (una frase, máximo 200 caracteres).
- "para": actor y plataforma o contexto (máximo 120 caracteres).
- "ve": el cambio concreto que se ve o se hace en la pantalla (máximo 220 caracteres).
- "estado": qué está confirmado por una fuente (historia, regla BR/DH, decisión) y qué es propuesta o pregunta pendiente (por ejemplo «propuesta de Enzo pendiente del PO»), citando el ID de la pregunta si existe, como UXR-014-Q1 (máximo 260 caracteres).

Reglas estrictas:
1. Usa SOLO lo que dice el propio documento. No añadas afirmaciones, reglas ni decisiones nuevas. Si algo es una inferencia o propuesta pendiente, dilo en "estado"; nunca lo presentes como confirmado.
2. Respeta las actualizaciones vigentes al final del documento (por ejemplo "Actualización vigente DEC-005"): prevalecen sobre el texto anterior.
3. Sin jerga innecesaria; una persona de producto debe entenderlo.

Responde SOLO con un arreglo JSON válido (sin texto antes ni después, sin bloque de código), un objeto por documento:
[{"id":"UXR-001","permite":"...","para":"...","ve":"...","estado":"..."}, ...]
EOF
  cat "$OUT/prompt-$lote.md" | codex exec -C "$WT" -m gpt-5.6-terra -s read-only -o "$OUT/lote-$lote.json" - > "$OUT/log-$lote.txt" 2>&1
  echo "lote $lote ok ($?)" >> "$OUT/progreso.txt"
  i=$((i+B)); lote=$((lote+1))
done
echo "TODOS LOS LOTES" >> "$OUT/progreso.txt"
