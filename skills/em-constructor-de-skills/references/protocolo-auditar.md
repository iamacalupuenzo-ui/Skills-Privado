# Constructor de skills — Protocolo AUDIT

Protocolo completo para auditar un skill existente contra el checklist de calidad.
Se activa cuando el modo detectado es `AUDIT`. Leer este archivo entero antes de
actuar.

---

## Fase 0 — Localizar el skill

Si da un nombre → resolver primero la fuente `Skills-Privado/skills/<nombre>/`; si el skill
no está en el catálogo, buscar la instalación disponible. No asumir Claude ni Codex.
Si da una ruta → leer directamente.

```powershell
$nombre = "[nombre]"
$roots = @(
  (Join-Path $env:USERPROFILE ".codex\skills\$nombre"),
  (Join-Path $env:USERPROFILE ".claude\skills\$nombre")
)
$skillRoot = $roots | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $skillRoot) { throw "No se encontró el skill en Codex ni Claude Code." }
Get-ChildItem -LiteralPath $skillRoot -Recurse -File
```

---

## Fase 1 — Leer todo el skill

Leer SKILL.md y todos los archivos en references/ antes de auditar.

---

## Fase 2 — Correr validador y checklist

Primero las comprobaciones automáticas, desde la carpeta del constructor:

```bash
python scripts/validar_skill.py <carpeta-del-skill> [--entregable]
python scripts/medir_molde.py <carpeta-del-skill>
```

Después aplicar cada criterio de `references/checklist-calidad.md` verificando contra el
contenido real. No marcar ✅ por intuición — citar la línea o sección que lo cumple.

---

## Fase 3 — Reporte

```
Auditoría — /nombre-del-skill
-------------------------------
FRONTMATTER
  ✅ name coincide con nombre del directorio
  ❌ description no distingue capacidad y activación
  ✅ argument-hint presente y específico
  ...

ORQUESTACIÓN
  ✅ guard presente y verifica contexto real
  ⚠️  modo CREATE no tiene fase de confirmación antes de escribir
  ...

REFERENCIAS
  ✅ referencias citadas en SKILL.md existen en disco
  ❌ references/inventory.md citado pero no existe
  ...

BLOQUEANTES
  ✅ bloqueantes numerados y específicos
  ...

MOLDE (validar_skill.py y medir_molde.py)
  ❌ evals/evals.json no existe
  ⚠️  cuerpo de 140 líneas (objetivo 80)
  ...

RACIONALIZACIÓN Y ALERTA TEMPRANA
  ❌ no tiene tabla de Racionalizaciones comunes
  ❌ no tiene sección de Señales de alerta
  ...

Resultado: RECHAZADO — 2 issues críticos
Issues críticos:
  ❌ activación ambigua → riesgo de recorrido incorrecto
  ❌ references/inventory.md no existe → SKILL.md cita algo que no hay

Fixes recomendados:
  1. Reescribir description con frases reales de trigger
  2. Crear references/inventory.md con el contenido que SKILL.md espera

¿Aplico los fixes?
```
