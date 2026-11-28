#!/usr/bin/env python3
"""Valida que un resumen de MR tenga las cuatro secciones y una verificación concreta.

Uso: python validar_resumen.py <resumen.md>
Contrato: sale 0 si cumple, 1 si falta algo (cada error dice sección y corrección), 2 si
el archivo no existe. Solo lee.
"""
import re
import sys
from pathlib import Path

SECCIONES = ("## Qué cambia", "## Por qué", "## Cómo se verificó", "## Pendiente")


def validar(texto: str) -> list[str]:
    errores = [f"falta la sección «{s}»: agrégala con la plantilla" for s in SECCIONES if s not in texto]
    m = re.search(r"## Cómo se verificó\n(.*?)(\n## |\Z)", texto, re.S)
    if m:
        cuerpo = m.group(1).strip()
        if cuerpo != "Sin verificar" and not re.search(r"`[^`]+`|\d", cuerpo):
            errores.append("«Cómo se verificó» no tiene comando ni cifra: escribe qué corriste y el resultado, o «Sin verificar»")
    return errores


def main() -> int:
    if len(sys.argv) != 2 or not Path(sys.argv[1]).is_file():
        print("Uso: validar_resumen.py <resumen.md>", file=sys.stderr)
        return 2
    errores = validar(Path(sys.argv[1]).read_text(encoding="utf-8"))
    for e in errores:
        print(f"ERROR {e}")
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main())
