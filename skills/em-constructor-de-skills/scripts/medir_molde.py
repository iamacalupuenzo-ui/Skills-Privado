#!/usr/bin/env python3
"""Mide qué piezas del molde tiene cada skill, para las casillas de la base Skills en Notion.

Uso:
    python medir_molde.py <carpeta-del-skill> [<otra> ...]
    python medir_molde.py --todos <carpeta-skills>

Contrato:
    - Imprime un JSON con una entrada por skill y seis casillas booleanas, con los nombres
      exactos de las propiedades de Notion.
    - Solo lee archivos; nunca escribe en disco ni en Notion.
    - Sale 2 si una carpeta no tiene SKILL.md.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

LECTURA_TOTAL = re.compile(r"leer siempre al iniciar|leer todas las referencias", re.IGNORECASE)
EXT_SCRIPT = {".py", ".mjs", ".js", ".sh", ".ps1"}
MIN_EVALS = 3  # mínimo de Anthropic para marcar la casilla


def tiene_archivos(d: Path) -> bool:
    return d.is_dir() and any(p.is_file() for p in d.rglob("*"))


def medir(carpeta: Path) -> dict[str, bool]:
    skill = (carpeta / "SKILL.md").read_text(encoding="utf-8")
    scripts = carpeta / "scripts"
    evals = carpeta / "evals" / "evals.json"
    casos = 0
    if evals.is_file():
        try:
            casos = len(json.loads(evals.read_text(encoding="utf-8")).get("evals", []))
        except (json.JSONDecodeError, AttributeError):
            casos = 0
    return {
        "Referencias por paso": tiene_archivos(carpeta / "references") and not LECTURA_TOTAL.search(skill),
        "Validador": scripts.is_dir() and any(p.suffix in EXT_SCRIPT for p in scripts.rglob("*")),
        "Pruebas": tiene_archivos(carpeta / "tests"),
        "Plantillas": tiene_archivos(carpeta / "templates"),
        "Ejemplos": tiene_archivos(carpeta / "examples"),
        "Tiene evals": casos >= MIN_EVALS,
    }


def main(argv: list[str]) -> int:
    if argv[:1] == ["--todos"] and len(argv) == 2:
        carpetas = sorted(p for p in Path(argv[1]).iterdir() if (p / "SKILL.md").is_file())
    else:
        carpetas = [Path(a) for a in argv]
    if not carpetas:
        print("Uso: medir_molde.py <carpeta> [...] | --todos <carpeta-skills>", file=sys.stderr)
        return 2
    salida = {}
    for c in carpetas:
        if not (c / "SKILL.md").is_file():
            print(f"{c}: no tiene SKILL.md", file=sys.stderr)
            return 2
        salida[c.resolve().name] = medir(c)
    print(json.dumps(salida, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
