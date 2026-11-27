#!/usr/bin/env bash
# Fusión de tres vías: skills vivos -> repo Skills-Privado.
L="${L:-$HOME/.claude/skills}"
R="${R:-$(cd "$(dirname "$0")/.." && pwd)}"
T="$(mktemp -d)"
cd "$R/skills"
norm() { tr -d '\r' < "$1"; }
diff -rq --strip-trailing-cr -x node_modules -x trabajo -x '*.bak*' -x __pycache__ -x .gitignore . "$L" 2>/dev/null | grep '^Files' | awk '{print $2}' | sed 's#^\./##' | while read -r f; do
  norm "$L/$f" > "$T/live"
  best=""; bestn=999999
  lm=$(date -r "$L/$f" +%F); for c in $(git log --format=%H --until="$lm 23:59" -- "$f"); do
    git show "$c:skills/$f" 2>/dev/null | tr -d '\r' > "$T/cand" || continue
    n=$(diff "$T/cand" "$T/live" | grep -c '^[<>]')
    if [ "$n" -lt "$bestn" ]; then bestn=$n; best=$c; fi
    [ "$n" = 0 ] && break
  done
  if [ "$bestn" = 0 ]; then echo "REPO-NEWER $f"; continue; fi
  git show "$best:skills/$f" | tr -d '\r' > "$T/base"
  norm "$f" > "$T/ours"
  cp "$T/ours" "$T/merged"
  if git merge-file -L repo -L base -L vivo "$T/merged" "$T/base" "$T/live"; then st=MERGED; else st=CONFLICT; fi
  # conservar CRLF si el archivo del repo lo usaba
  if grep -q $'\r' "$f"; then sed 's/$/\r/' "$T/merged" > "$f"; else cp "$T/merged" "$f"; fi
  echo "$st $f (base ${best:0:7}, dif $bestn)"
done
