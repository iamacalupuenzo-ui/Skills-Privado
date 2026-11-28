#!/usr/bin/env bash
# Lote de contenido: prepara el cuerpo desde origin/develop y delega la subida a opencode, una página por vez.
WT="${NOTION_WORKTREE:-$(grep -o '"worktree": *"[^"]*"' "$MOD/config.json" | sed 's/.*: *"//;s/"$//')}"
D="$(cd "$(dirname "$0")" && pwd)"; MOD="$(cd "$D/.." && pwd)"; [ "$(basename "$D")" = historico ] && MOD="$(cd "$D/../.." && pwd)"
S="${NOTION_TRABAJO:-$MOD/trabajo}"
WTROOT="$WT"
mkdir -p "$S/lote1"
: > "$S/lote1/esperado.jsonl"

# id | título | ruta en el repo | page_id
while IFS='|' read -r ID TITLE RPATH PAGE; do
  [ -z "$ID" ] && continue
  F="$(basename "$RPATH")"
  git -C "$WTROOT" show "origin/develop:$RPATH" > "$S/lote1/$ID-origen.md" || { echo "FALLO git show $ID" >> "$S/lote1/errores.txt"; continue; }
  STATS=$(node "$S/prepare-body.js" "$RPATH" "$S/lote1/$ID-origen.md" "$S/lote1/$ID-cuerpo.md" "$WTROOT" "$ID")
  node -e '
    const fs=require("fs");const t=fs.readFileSync(process.argv[1],"utf8").split("\n");
    const h=t.filter(l=>/^#{1,6}\s/.test(l)).length; let tb=0,p=false; for(const l of t){const i=/^\|/.test(l); if(i&&!p)tb++; p=i;}
    const links=(fs.readFileSync(process.argv[1],"utf8").match(/\]\([^)\s]+\)/g)||[]).length;
    console.log(JSON.stringify({id:process.argv[2],page:process.argv[3],encabezados:h,tablas:tb,enlaces:links}));
  ' "$S/lote1/$ID-cuerpo.md" "$ID" "$PAGE" >> "$S/lote1/esperado.jsonl"

  cat > "$S/lote1/$ID-instruccion.md" <<EOF
Eres el ejecutor de subida a Notion. Usa SOLO el servidor MCP de Notion. Modifica ÚNICAMENTE el CUERPO de una página; no cambies sus propiedades, no toques otras páginas y no borres nada fuera de ese cuerpo. Si algo falla, anota el error exacto y detente.

Página destino: «$TITLE», id $PAGE. Si ya tiene cuerpo, REEMPLÁZALO POR COMPLETO (sin restos).

Fuente: el archivo adjunto \`$ID-cuerpo.md\`. Cópialo FIEL: no resumas, no reescribas, no traduzcas, no reordenes ni omitas nada. Convierte solo la sintaxis: encabezados, listas (incluidas casillas), negritas, citas, bloques de código y tablas (las tablas Markdown deben quedar como tablas nativas de Notion con fila de encabezado). Los enlaces [texto](url) deben quedar como enlaces con su URL tal cual. Los nombres de archivo .md escritos en texto plano o en código NO deben quedar como enlaces; si Notion los autoenlaza, corrígelo.

Orden del cuerpo:
1. Un callout con exactamente este texto: «Contenido generado desde el repositorio (GitLab). No se edita aquí: los cambios se hacen en el archivo del repo y se vuelven a cargar. Última carga: 2026-10-16. Fuente: ${RPATH%/*}/\`$F\`» (el nombre del archivo va en código en línea).
2. Después, todo el contenido del archivo adjunto, de principio a fin.

Si el contenido no cabe en una llamada, divídelo en varias en orden estricto, sin repetir ni saltar líneas.

Al terminar, lee la página de vuelta y compara el número de encabezados, tablas y enlaces con el archivo.
Informe final (SOLO esto): encabezados, tablas y enlaces del archivo vs. los de Notion; lista exacta de lo que no se convirtió fielmente; errores exactos.
EOF

  ( cd "$S/lote1" && opencode run "Ejecuta al pie de la letra las instrucciones del primer archivo adjunto, usando el segundo como contenido. Responde solo con el informe final que pide." \
    -f "$S/lote1/$ID-instruccion.md" -f "$S/lote1/$ID-cuerpo.md" --title "Notion contenido $ID" > "$S/lote1/$ID-resultado.md" 2>&1 < /dev/null )
  echo "$ID terminado ($?) stats: $STATS" >> "$S/lote1/progreso.txt"
done <<'LISTA'
HU-01-01|HU-01-01 — Registrar un Distribuidor|requirements/context-packs/user-stories/HU-01-01-registrar-distribuidor.md|3fb1a7d0-6388-81cf-9c88-fa9f56807e9e
HU-02-01|HU-02-01 — Iniciar sesión en BackOffice|requirements/context-packs/user-stories/HU-02-01-iniciar-sesion-backoffice.md|3fb1a7d0-6388-8188-a5c1-fac4009cba8f
HU-02-02|HU-02-02 — Iniciar sesión en Web Cliente y Móvil Cliente con las mismas credenciales|requirements/context-packs/user-stories/HU-02-02-iniciar-sesion-web-y-movil-cliente.md|3fb1a7d0-6388-811e-89d0-fce08c745c0c
HU-07-02|HU-07-02 — Visualizar el Home y el mapa como ESAC con las Unidades de mis Grupos|requirements/context-packs/user-stories/HU-07-02-visualizar-home-mapa-cliente-soporte.md|3fb1a7d0-6388-819f-838f-d8a49ff0d001
HU-01-14|HU-01-14 — Personalizar la identidad visual del Cliente|requirements/context-packs/user-stories/HU-01-14-personalizar-identidad-visual-cliente.md|3fb1a7d0-6388-81c1-bc60-dae88883f733
DSP-001|DSP-001 — Alta del Distribuidor, identidad visual, inicio de sesión y Home de ESAC|requirements/scope-packs/DSP-001-alta-distribuidor-acceso-esac.md|3fb1a7d0-6388-8163-912a-c88b9bb9653d
LISTA
echo "LOTE COMPLETO" >> "$S/lote1/progreso.txt"
