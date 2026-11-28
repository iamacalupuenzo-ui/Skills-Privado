#!/usr/bin/env python3
"""Valida un skill contra el molde del catálogo (references/molde.md).

Uso:
    python validar_skill.py <carpeta-del-skill> [--entregable] [--json]

Contrato:
    - Sale 0 si no hay errores (puede haber avisos) y 1 si hay al menos un error.
    - Sale 2 si la carpeta no existe o no tiene SKILL.md.
    - Cada hallazgo dice nivel, regla, archivo, línea (si aplica) y qué corregir.
    - Solo lee archivos; nunca escribe.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

LIMITE_CUERPO = 500
OBJETIVO_CUERPO = 80
LIMITE_DESCRIPCION = 1024
LIMITE_NOMBRE = 64
LIMITE_SIN_INDICE = 100
MIN_EVALS = 5
RESERVADAS = ("anthropic", "claude")
NOMBRE_VALIDO = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CITA_REFERENCIA = re.compile(r"references/([A-Za-z0-9_./-]+\.md)")
LECTURA_TOTAL = re.compile(r"leer siempre al iniciar|leer todas las referencias", re.IGNORECASE)
INDICE = re.compile(r"^#{2,3}\s+(Índice|Indice|Contenido)\b", re.MULTILINE)
EXT_SCRIPT = {".py", ".mjs", ".js", ".sh", ".ps1"}


@dataclass
class Hallazgo:
    nivel: str  # ERROR o AVISO
    regla: str
    archivo: str
    linea: int | None
    mensaje: str
    corrige: str

    def texto(self) -> str:
        donde = f"{self.archivo}:{self.linea}" if self.linea else self.archivo
        return f"{self.nivel} [{self.regla}] {donde} — {self.mensaje}. Corrige: {self.corrige}"


def leer_frontmatter(texto: str) -> tuple[dict[str, str], int]:
    """Devuelve los campos del frontmatter y la línea donde empieza el cuerpo."""
    lineas = texto.replace("\r\n", "\n").split("\n")
    if not lineas or lineas[0].strip() != "---":
        return {}, 0
    campos: dict[str, str] = {}
    i = 1
    while i < len(lineas) and lineas[i].strip() != "---":
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", lineas[i])
        if m:
            valor = m.group(2).strip()
            if valor in (">", "|", ">-", "|-"):
                partes = []
                while i + 1 < len(lineas) and re.match(r"^\s+\S", lineas[i + 1]):
                    i += 1
                    partes.append(lineas[i].strip())
                valor = " ".join(partes)
            campos[m.group(1)] = valor.strip('"').strip("'")
        i += 1
    return campos, i + 1


def validar(carpeta: Path, entregable: bool) -> list[Hallazgo]:
    h: list[Hallazgo] = []
    skill_md = carpeta / "SKILL.md"
    texto = skill_md.read_text(encoding="utf-8")
    campos, inicio_cuerpo = leer_frontmatter(texto)
    lineas = texto.replace("\r\n", "\n").split("\n")

    # Nombre
    nombre = campos.get("name", "")
    if not nombre:
        h.append(Hallazgo("ERROR", "nombre", "SKILL.md", 1, "falta `name` en el frontmatter", "agrega `name: <carpeta>`"))
    else:
        if nombre != carpeta.name:
            h.append(Hallazgo("ERROR", "nombre", "SKILL.md", 2, f"`name: {nombre}` no coincide con la carpeta `{carpeta.name}`", "usa el mismo nombre en los dos"))
        if not NOMBRE_VALIDO.match(nombre) or len(nombre) > LIMITE_NOMBRE:
            h.append(Hallazgo("ERROR", "nombre", "SKILL.md", 2, f"`{nombre}` no es minúsculas con guiones de hasta {LIMITE_NOMBRE} caracteres", "renómbralo, por ejemplo `em-mi-skill`"))
        if any(r in nombre for r in RESERVADAS):
            h.append(Hallazgo("ERROR", "nombre", "SKILL.md", 2, f"`{nombre}` contiene una palabra reservada", "quita `anthropic` o `claude` del nombre"))

    # Descripción
    descripcion = campos.get("description", "")
    if not descripcion:
        h.append(Hallazgo("ERROR", "descripcion", "SKILL.md", 1, "falta `description`", "di qué hace y cuándo usarlo"))
    elif len(descripcion) > LIMITE_DESCRIPCION:
        h.append(Hallazgo("ERROR", "descripcion", "SKILL.md", 3, f"la descripción tiene {len(descripcion)} caracteres (máximo {LIMITE_DESCRIPCION})", "recórtala y mueve el detalle al cuerpo"))

    # Tamaño del cuerpo
    cuerpo = [l for l in lineas[inicio_cuerpo:]]
    while cuerpo and not cuerpo[-1].strip():
        cuerpo.pop()
    if len(cuerpo) >= LIMITE_CUERPO:
        h.append(Hallazgo("ERROR", "tamano", "SKILL.md", None, f"el cuerpo tiene {len(cuerpo)} líneas (límite {LIMITE_CUERPO})", "mueve protocolos y detalle a references/"))
    elif len(cuerpo) > OBJETIVO_CUERPO:
        h.append(Hallazgo("AVISO", "tamano", "SKILL.md", None, f"el cuerpo tiene {len(cuerpo)} líneas (objetivo {OBJETIVO_CUERPO})", "evalúa mover detalle condicional a references/"))

    # Lectura total al iniciar
    for n, linea in enumerate(lineas, 1):
        if LECTURA_TOTAL.search(linea):
            h.append(Hallazgo("ERROR", "lectura", "SKILL.md", n, "ordena leer todas las referencias al iniciar", "indica qué referencia se lee en cada paso"))

    # Referencias citadas
    for n, linea in enumerate(lineas, 1):
        for ref in CITA_REFERENCIA.findall(linea):
            if not (carpeta / "references" / ref).is_file():
                h.append(Hallazgo("ERROR", "referencias", "SKILL.md", n, f"cita `references/{ref}`, que no existe", "crea el archivo o corrige la ruta"))

    # Profundidad e índice
    refs = carpeta / "references"
    if refs.is_dir():
        for archivo in sorted(refs.rglob("*.md")):
            rel = archivo.relative_to(carpeta).as_posix()
            if archivo.parent != refs:
                h.append(Hallazgo("ERROR", "profundidad", rel, None, "la referencia está en una subcarpeta", "muévela directo a references/"))
            contenido = archivo.read_text(encoding="utf-8")
            total = contenido.count("\n") + 1
            if total > LIMITE_SIN_INDICE and not INDICE.search(contenido):
                h.append(Hallazgo("ERROR", "indice", rel, 1, f"tiene {total} líneas y no empieza con un índice", "agrega `## Índice` con sus secciones"))

    # Evals
    evals_json = carpeta / "evals" / "evals.json"
    if not evals_json.is_file():
        h.append(Hallazgo("ERROR", "evals", "evals/evals.json", None, "no existe", f"escribe al menos {MIN_EVALS} casos con templates/evals.plantilla.json"))
    else:
        try:
            datos = json.loads(evals_json.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            h.append(Hallazgo("ERROR", "evals", "evals/evals.json", e.lineno, f"JSON inválido: {e.msg}", "corrige la sintaxis"))
            datos = None
        if datos is not None:
            if datos.get("skill_name") != carpeta.name:
                h.append(Hallazgo("ERROR", "evals", "evals/evals.json", None, f"`skill_name` es `{datos.get('skill_name')}`", f"usa `{carpeta.name}`"))
            casos = datos.get("evals") if isinstance(datos.get("evals"), list) else []
            if len(casos) < MIN_EVALS:
                h.append(Hallazgo("ERROR", "evals", "evals/evals.json", None, f"tiene {len(casos)} casos (mínimo {MIN_EVALS})", "agrega casos de ruta y de freno"))
            if casos and not any(c.get("tipo") == "frena" for c in casos):
                h.append(Hallazgo("ERROR", "evals", "evals/evals.json", None, "ningún caso es de tipo `frena`", "agrega un caso donde el skill debe detenerse"))
            for c in casos:
                faltan = [k for k in ("name", "tipo", "prompt", "expected_output") if not str(c.get(k, "")).strip()]
                if faltan or not isinstance(c.get("assertions"), list) or len(c["assertions"]) < 2:
                    h.append(Hallazgo("ERROR", "evals", "evals/evals.json", None, f"el caso {c.get('id', '?')} está incompleto", "llena name, tipo, prompt, expected_output y 2 assertions"))

    # Nivel entregable
    if entregable:
        for carpeta_req, para in (("templates", "la plantilla del entregable"), ("examples", "un ejemplo resuelto"), ("tests", "las pruebas de los scripts")):
            d = carpeta / carpeta_req
            if not d.is_dir() or not any(d.rglob("*")):
                h.append(Hallazgo("ERROR", "entregable", f"{carpeta_req}/", None, "falta o está vacía", f"agrega {para}"))
        scripts = carpeta / "scripts"
        if not scripts.is_dir() or not any(p.suffix in EXT_SCRIPT for p in scripts.rglob("*")):
            h.append(Hallazgo("ERROR", "entregable", "scripts/", None, "no hay validador por consola", "agrega un script que compruebe el entregable"))
    return h


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Valida un skill contra el molde del catálogo.")
    p.add_argument("carpeta", type=Path)
    p.add_argument("--entregable", action="store_true", help="exige plantillas, ejemplos, validador y pruebas")
    p.add_argument("--json", action="store_true", help="salida en JSON")
    a = p.parse_args(argv)
    carpeta = a.carpeta.resolve()
    if not (carpeta / "SKILL.md").is_file():
        print(f"ERROR [carpeta] {a.carpeta} — no existe o no tiene SKILL.md", file=sys.stderr)
        return 2
    hallazgos = validar(carpeta, a.entregable)
    errores = [x for x in hallazgos if x.nivel == "ERROR"]
    if a.json:
        print(json.dumps({"skill": carpeta.name, "errores": len(errores), "hallazgos": [asdict(x) for x in hallazgos]}, ensure_ascii=False, indent=2))
    else:
        for x in hallazgos:
            print(x.texto())
        nivel = "entregable" if a.entregable else "base"
        print(f"{carpeta.name}: {len(errores)} errores, {len(hallazgos) - len(errores)} avisos (nivel {nivel})")
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main())
