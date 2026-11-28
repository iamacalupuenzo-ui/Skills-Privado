#!/usr/bin/env python3
"""Valida la forma de uno o más flujos de usuario (FLW) de la KB.

Uso: python validar_flw.py <FLW-NNN-*.md> [...]

Errores (código 1): frontmatter ilegible, id distinto del archivo, sin etiqueta dsp-NNN, status
aprobado por su cuenta, `requirements` sin HU o sin UXR, sin `screens`, secciones obligatorias que
faltan, diagrama sin bloque mermaid, `[PENDIENTE]` sin el ID de su pregunta y valores visuales
sueltos (hex o px).
Avisos: secciones que los flujos antiguos no tienen y `screens` vacío.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Encabezados por palabra clave: los flujos numeran sus secciones de formas distintas.
OBLIGATORIAS = {
    "Actor y permisos": r"Actor|Ficha",
    "Pantallas declaradas": r"Pantallas",
    "Camino feliz": r"Camino feliz",
    "Ramas y excepciones": r"Ramas|Excepciones",
    "Estados del flujo": r"Estados",
    "Diagrama": r"Diagrama",
    "Trazabilidad": r"Trazabilidad|Traceability",
    "Preguntas abiertas": r"Preguntas abiertas|Open questions",
}
RECOMENDADAS = {"En 30 segundos": r"En 30 segundos", "Accesibilidad": r"Accesibilidad", "Historial": r"Historial"}
STATUS_HUMANOS = {"approved", "verified", "aprobado", "validado"}
HEX = re.compile(r"(?<![\w&/-])#[0-9A-Fa-f]{6}\b|(?<![\w&/-])#[0-9A-Fa-f]{3}\b")
PX = re.compile(r"\b\d+(?:\.\d+)?px\b")


def leer(texto: str):
    lineas = texto.replace("\r\n", "\n").split("\n")
    if not lineas or lineas[0].strip() != "---":
        return None
    try:
        fin = lineas[1:].index("---") + 1
    except ValueError:
        return None
    campos: dict[str, str] = {}
    listas: dict[str, list[str]] = {}
    actual = None
    for l in lineas[1:fin]:
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", l)
        if m:
            actual = m.group(1)
            valor = m.group(2).strip()
            campos[actual] = valor.strip('"').strip("'")
            if valor.startswith("["):
                listas[actual] = [x.strip().strip('"\'') for x in valor.strip("[]").split(",") if x.strip()]
            elif valor == "":
                listas[actual] = []
            continue
        item = re.match(r"^\s+-\s+(.+)$", l)
        if item and actual in listas and not item.group(1).startswith("id:"):
            listas[actual].append(item.group(1).split(" #")[0].strip().strip('"\''))
    return campos, listas, "\n".join(lineas[fin + 1:])


def encabezados(cuerpo: str) -> list[str]:
    return re.findall(r"^#{1,3} +(.+)$", cuerpo, flags=re.M)


def validar(ruta: Path) -> tuple[list[str], list[str]]:
    errores: list[str] = []
    avisos: list[str] = []
    datos = leer(ruta.read_text(encoding="utf-8"))
    if datos is None:
        return [f"sin frontmatter legible"], []
    campos, listas, cuerpo = datos
    esperado = "-".join(ruta.stem.split("-")[:2])

    if campos.get("id") and campos["id"] != esperado:
        errores.append(f"id `{campos['id']}` no coincide con el archivo ({esperado})")
    if campos.get("type") != "User Flow":
        errores.append("`type` debe ser `User Flow`")
    if not campos.get("title", "").startswith(esperado):
        errores.append(f"`title` debe empezar con {esperado}")
    if campos.get("status", "").lower() in STATUS_HUMANOS:
        errores.append(f"`status: {campos['status']}` solo lo pone una persona (B10); usa draft")
    if not re.search(r"\bdsp-\d{3}\b", campos.get("tags", "")):
        errores.append("falta la etiqueta `dsp-NNN` en tags (B10)")

    req = listas.get("requirements", [])
    if not any(r.startswith("HU-") for r in req):
        errores.append("`requirements` no lista ninguna historia HU (B2)")
    if not any(r.startswith("UXR-") for r in req):
        errores.append("`requirements` no lista ningún UXR (B2)")
    if "screens" not in campos:
        errores.append("falta `screens` en el frontmatter (B5)")
    elif not listas.get("screens"):
        avisos.append("`screens` vacío: exige una pregunta abierta que lo justifique (B5)")
    for s in listas.get("screens", []):
        if not re.fullmatch(r"SCR-\d{3}", s):
            errores.append(f"`screens` tiene `{s}`: lista cada pantalla como SCR-NNN")

    titulos = encabezados(cuerpo)
    for nombre, patron in OBLIGATORIAS.items():
        if not any(re.search(patron, t, flags=re.I) for t in titulos):
            errores.append(f"falta la sección «{nombre}»")
    for nombre, patron in RECOMENDADAS.items():
        if not any(re.search(patron, t, flags=re.I) for t in titulos):
            avisos.append(f"falta la sección «{nombre}» (obligatoria en flujos nuevos)")
    if "```mermaid" not in cuerpo:
        errores.append("el diagrama no tiene un bloque ```mermaid")

    for m in re.finditer(r"\[PENDIENTE\]", cuerpo):
        errores.append("`[PENDIENTE]` sin el ID de su pregunta (B4): usa [PENDIENTE: UXR-NNN-Qn]")

    sin_codigo = re.sub(r"```.*?```", "", cuerpo, flags=re.S)
    for m in HEX.finditer(sin_codigo):
        errores.append(f"valor de color suelto {m.group(0)} (B7: eso es de la SCR)")
    for m in PX.finditer(sin_codigo):
        errores.append(f"medida suelta {m.group(0)} (B7: eso es de la SCR)")
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
