#!/usr/bin/env python3
"""Valida la forma de uno o más Requerimientos UX (UXR) de la KB.

Uso: python validar_uxr.py <UXR-NNN-*.md> [...]

Errores (código 1): frontmatter ilegible, id distinto del archivo, sin etiqueta dsp-NNN,
status aprobado por su cuenta, secciones obligatorias que faltan y valores visuales sueltos
(hex o px).
Avisos: secciones nuevas que los UXR antiguos no tienen, IDs de preguntas fuera de UXR-NNN-Qn
y siglas citadas que no están en sources.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

OBLIGATORIAS = ["## Requisito", "## Actor", "## Estados requeridos", "## Criterios de aceptación", "# Traceability", "# Open questions"]
RECOMENDADAS = ["## En 30 segundos", "# Historial"]
STATUS_HUMANOS = {"approved", "verified", "aprobado", "validado"}
HEX = re.compile(r"(?<![\w&/-])#[0-9A-Fa-f]{6}\b|(?<![\w&/-])#[0-9A-Fa-f]{3}\b")
PX = re.compile(r"\b\d+(?:\.\d+)?px\b")
SIGLA = re.compile(r"\b(HU-\d{2}-\d{2}|DEC-\d{3}|DSP-\d{3})\b")


def frontmatter(texto: str) -> tuple[dict[str, str], list[str], str] | None:
    lineas = texto.replace("\r\n", "\n").split("\n")
    if not lineas or lineas[0].strip() != "---":
        return None
    try:
        fin = lineas[1:].index("---") + 1
    except ValueError:
        return None
    campos: dict[str, str] = {}
    fuentes: list[str] = []
    for l in lineas[1:fin]:
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", l)
        if m:
            campos[m.group(1)] = m.group(2).strip().strip('"').strip("'")
        f = re.match(r"^\s*-\s*id:\s*(\S+)", l)
        if f:
            fuentes.append(f.group(1).strip('"'))
    return campos, fuentes, "\n".join(lineas[fin + 1:])


def sin_codigo(cuerpo: str) -> str:
    return re.sub(r"```.*?```", "", cuerpo, flags=re.S)


def validar(ruta: Path) -> tuple[list[str], list[str]]:
    errores: list[str] = []
    avisos: list[str] = []
    fm = frontmatter(ruta.read_text(encoding="utf-8"))
    if fm is None:
        return [f"{ruta.name}: sin frontmatter legible"], []
    campos, fuentes, cuerpo = fm
    esperado = "-".join(ruta.stem.split("-")[:2])

    if campos.get("id") and campos["id"] != esperado:
        errores.append(f"id `{campos['id']}` no coincide con el archivo ({esperado})")
    if not campos.get("id"):
        avisos.append("sin `id` en el frontmatter")
    if campos.get("type") != "UX Requirement":
        errores.append("`type` debe ser `UX Requirement`")
    if not campos.get("title", "").startswith(esperado):
        errores.append(f"`title` debe empezar con {esperado}")
    if campos.get("status", "").lower() in STATUS_HUMANOS:
        errores.append(f"`status: {campos['status']}` solo lo pone una persona (B7); usa draft")
    if not re.search(r"\bdsp-\d{3}\b", campos.get("tags", "")):
        errores.append("falta la etiqueta `dsp-NNN` en tags (B8)")
    if not fuentes:
        errores.append("`sources` vacío: el UXR no cita su historia (B2)")
    elif not any(f.startswith("HU-") for f in fuentes):
        errores.append("`sources` no incluye ninguna historia HU (B2)")

    for s in OBLIGATORIAS:
        if not re.search(rf"^{re.escape(s)}", cuerpo, flags=re.M):
            errores.append(f"falta la sección «{s}»")
    for s in RECOMENDADAS:
        if not re.search(rf"^{re.escape(s)}", cuerpo, flags=re.M):
            avisos.append(f"falta la sección «{s}» (obligatoria en UXR nuevos)")

    limpio = sin_codigo(cuerpo)
    for m in HEX.finditer(limpio):
        errores.append(f"valor de color suelto {m.group(0)} (B6: eso es de la SCR)")
    for m in PX.finditer(limpio):
        errores.append(f"medida suelta {m.group(0)} (B6: eso es de la SCR)")

    preguntas = re.search(r"^# Open questions\s*$(.*?)(?=^# |\Z)", cuerpo, flags=re.M | re.S)
    if preguntas:
        for fila in re.findall(r"^\|\s*([^|]+?)\s*\|", preguntas.group(1), flags=re.M):
            if fila in ("ID", "Pregunta") or set(fila) <= set("-: "):
                continue
            if not re.match(esperado + r"-Q[0-9]+(?![0-9])", fila):
                avisos.append(f"fila de preguntas con ID `{fila[:40]}`: las nuevas usan {esperado}-Qn")

    citadas = set(SIGLA.findall(limpio))
    faltan = sorted(c for c in citadas if c not in fuentes)
    if faltan:
        avisos.append("siglas citadas que no están en sources: " + ", ".join(faltan))
    return errores, avisos


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    total = 0
    for a in argv:
        ruta = Path(a)
        if not ruta.is_file():
            print(f"ERROR  {a}: no existe")
            total += 1
            continue
        errores, avisos = validar(ruta)
        for e in errores:
            print(f"ERROR  {ruta.name}: {e}")
        for w in avisos:
            print(f"AVISO  {ruta.name}: {w}")
        total += len(errores)
        if not errores:
            print(f"OK     {ruta.name} ({len(avisos)} avisos)")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
