#!/usr/bin/env python3
"""Corre las puertas de un repo de producto (lint, test:rules, test:ci, build) y resume con cifras.

Contrato
--------
Entrada:
    python puertas.py <repo> [--refs <rama> ...] [--base origin/integration]
                      [--puertas lint,test:rules,test:ci,build] [--sin-build]
                      [--reusar-node-modules] [--sin-base] [--plan] [--trabajo <carpeta>]

    - Sin --refs: corre en la carpeta del repo tal como está (el árbol de trabajo actual), sin
      comparar con la base. Escribe lo que escriban las puertas (coverage/, dist/): para un repo
      donde trabaja otro agente o corre `ng serve`, usar --refs.
    - Con --refs: cada ref se exporta con `git archive` a una carpeta temporal (sin checkout,
      sin worktree: el repo no se toca) y se instala con `npm ci`, como en CI. Así una copia
      del DS dentro de `node_modules` no oculta nada. --reusar-node-modules enlaza el
      `node_modules` del repo en lugar de instalar (más rápido, pero ya no prueba la
      instalación limpia; el informe lo dice).
    - Solo corre las puertas que existen en `package.json` de esa ref, en el orden dado.
    - Una puerta de pruebas (`test*`) que falla se repite una vez, sola. Si la segunda pasa,
      se marca «inestable».
    - Una puerta que falla se corre también en el merge-base con --base (la punta de la que
      salió la rama). Si allí también falla, se marca «ya fallaba»; si no, «nueva». --sin-base
      lo omite.
    - --plan: solo muestra qué correría en cada ref (lectura pura).

Salida (stdout, UTF-8): una tabla por punta con puerta, resultado y cifras (pruebas, archivos,
    problemas de lint, cobertura y su umbral). El registro completo de cada corrida queda en
    la carpeta de trabajo y se indica su ruta.
    Código 0: todas las puertas pasaron (puede haber inestables, que se avisan).
    Código 1: alguna puerta falla, nueva o previa (las previas también frenan el MR).
    Código 2: error de uso (no es repo, ref inexistente, sin package.json).

Solo biblioteca estándar. No imprime variables de entorno ni tokens: npm los lee del `.npmrc`.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tarfile
import tempfile
from dataclasses import dataclass, field

PUERTAS = ["lint", "test:rules", "test:ci", "build"]


class ErrorDeUso(Exception):
    pass


@dataclass
class Corrida:
    puerta: str
    ok: bool
    cifras: str
    registro: str
    estado: str = ""  # pasa, falla-nueva, ya-fallaba, inestable, falla


@dataclass
class Punta:
    nombre: str
    sha: str
    carpeta: str
    corridas: list[Corrida] = field(default_factory=list)
    notas: list[str] = field(default_factory=list)


# ------------------------------------------------------------------- cifras


def cifras(salida: str) -> str:
    """Resume la salida de una puerta en una línea con números."""
    limpia = re.sub(r"\x1b\[[0-9;]*m", "", salida)
    partes: list[str] = []
    for etiqueta in ("Test Files", "Tests"):
        m = re.findall(rf"^\s*{etiqueta}\s+(.+?)$", limpia, re.M)
        if m:
            partes.append(f"{etiqueta}: {m[-1].strip()}")
    m = re.findall(r"Executed (\d+) of (\d+)(.*?)(?:\(|$)", limpia, re.M)
    if m:
        hechos, total, resto = m[-1]
        partes.append(f"Karma: {hechos} de {total}{' ' + resto.strip() if resto.strip() else ''}")
    for etiqueta in ("pass", "fail"):
        m = re.findall(rf"^[#ℹ]\s*{etiqueta}\s+(\d+)", limpia, re.M)
        if m:
            partes.append(f"{etiqueta} {m[-1]}")
    m = re.search(r"✖\s*(\d+) problems? \((\d+) errors?, (\d+) warnings?\)", limpia)
    if m:
        partes.append(f"lint: {m.group(2)} errores, {m.group(3)} avisos")
    elif re.search(r"All files pass linting", limpia):
        partes.append("lint: 0 problemas")
    m = re.search(r"All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)", limpia)
    if m:
        partes.append(f"cobertura: sentencias {m.group(1)} %, ramas {m.group(2)} %, funciones {m.group(3)} %, líneas {m.group(4)} %")
    for tipo, valor, umbral in re.findall(r"Coverage for (\w+) \(([\d.]+)%\) does not meet (?:global )?threshold \(([\d.]+)%\)", limpia):
        partes.append(f"cobertura de {tipo} {valor} % < umbral {umbral} %")
    # esbuild marca cada error con «✘ [ERROR]» (en la consola de Windows sale «X [ERROR]»).
    errores = re.findall(r"^\s*[✘X] \[ERROR\] (TS\d+|NG\d+)?", limpia, re.M) or re.findall(r"error (TS\d+)", limpia)
    if errores:
        codigos = sorted({c for c in errores if c})
        partes.append(f"{len(errores)} errores de compilación" + (f" ({', '.join(codigos)})" if codigos else ""))
    if not partes and re.search(r"Application bundle generation complete", limpia):
        partes.append("build completo")
    return "; ".join(partes) or "(sin cifras reconocibles: ver registro)"


# ------------------------------------------------------------------- git y npm


def git(repo: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", repo, *args], capture_output=True, text=False)


def sha_de(repo: str, ref: str) -> str:
    proc = git(repo, "rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}")
    if proc.returncode != 0:
        raise ErrorDeUso(f"La ref {ref} no existe en {repo}")
    return proc.stdout.decode().strip()


def scripts_de(repo: str, sha: str | None) -> dict[str, str]:
    if sha is None:
        ruta = os.path.join(repo, "package.json")
        if not os.path.exists(ruta):
            raise ErrorDeUso(f"No hay package.json en {repo}")
        with open(ruta, encoding="utf-8") as f:
            return json.load(f).get("scripts", {})
    proc = git(repo, "show", f"{sha}:package.json")
    if proc.returncode != 0:
        raise ErrorDeUso(f"No hay package.json en {sha[:10]}")
    return json.loads(proc.stdout.decode("utf-8")).get("scripts", {})


def exportar(repo: str, sha: str, destino: str) -> None:
    os.makedirs(destino, exist_ok=True)
    archivo = os.path.join(destino, "..", f"{sha[:12]}.tar")
    with open(archivo, "wb") as f:
        proc = subprocess.run(["git", "-C", repo, "archive", "--format=tar", sha], stdout=f, stderr=subprocess.PIPE)
    if proc.returncode != 0:
        raise ErrorDeUso(f"git archive {sha[:10]} falló: {proc.stderr.decode(errors='replace').strip()}")
    with tarfile.open(archivo) as t:
        if sys.version_info >= (3, 12):
            t.extractall(destino, filter="data")
        else:
            t.extractall(destino)
    os.remove(archivo)


def enlazar_node_modules(origen: str, destino: str) -> None:
    fuente = os.path.join(origen, "node_modules")
    if not os.path.isdir(fuente):
        raise ErrorDeUso(f"{origen} no tiene node_modules para reutilizar")
    enlace = os.path.join(destino, "node_modules")
    if os.name == "nt":
        subprocess.run(["cmd", "/c", "mklink", "/J", enlace, fuente], capture_output=True, check=True)
    else:
        os.symlink(fuente, enlace, target_is_directory=True)


def npm(carpeta: str, *args: str, registro: str) -> tuple[bool, str]:
    env = dict(os.environ, CI="true", NG_CLI_ANALYTICS="false", FORCE_COLOR="0")
    proc = subprocess.run(
        ["npm", *args], cwd=carpeta, capture_output=True, text=True, encoding="utf-8", errors="replace",
        env=env, shell=os.name == "nt",
    )
    salida = proc.stdout + "\n" + proc.stderr
    with open(registro, "w", encoding="utf-8") as f:
        f.write(salida)
    return proc.returncode == 0, salida


# ------------------------------------------------------------------- puertas


def preparar(repo: str, ref: str | None, trabajo: str, reusar: bool) -> Punta:
    if ref is None:
        return Punta(nombre="árbol de trabajo", sha="", carpeta=repo)
    sha = sha_de(repo, ref)
    carpeta = os.path.join(trabajo, sha[:12])
    punta = Punta(nombre=ref, sha=sha, carpeta=carpeta)
    if not os.path.exists(os.path.join(carpeta, "package.json")):
        exportar(repo, sha, carpeta)
    if not os.path.exists(os.path.join(carpeta, "node_modules")):
        if reusar:
            enlazar_node_modules(repo, carpeta)
            punta.notas.append("node_modules reutilizado del repo: no prueba una instalación limpia.")
        else:
            ok, salida = npm(carpeta, "ci", "--no-audit", "--no-fund", registro=os.path.join(carpeta, "npm-ci.log"))
            if not ok:
                ultima = [l for l in salida.splitlines() if "ERR" in l][-1:] or ["ver npm-ci.log"]
                raise ErrorDeUso(f"npm ci falló en {ref}: {ultima[0][:200]}")
    return punta


def umbrales(carpeta: str) -> dict:
    """`coverageThresholds` de angular.json (builder de pruebas de Angular), si existe."""
    try:
        with open(os.path.join(carpeta, "angular.json"), encoding="utf-8") as f:
            datos = json.load(f)
    except (OSError, ValueError):
        return {}
    pendientes = [datos]
    while pendientes:
        nodo = pendientes.pop()
        if isinstance(nodo, dict):
            if isinstance(nodo.get("coverageThresholds"), dict):
                return nodo["coverageThresholds"]
            pendientes.extend(nodo.values())
        elif isinstance(nodo, list):
            pendientes.extend(nodo)
    return {}


def correr(punta: Punta, puerta: str, sufijo: str = "") -> Corrida:
    registro = os.path.join(punta.carpeta, f"puerta-{puerta.replace(':', '-')}{sufijo}.log")
    ok, salida = npm(punta.carpeta, "run", puerta, registro=registro)
    resumen = cifras(salida)
    if "cobertura:" in resumen and (u := umbrales(punta.carpeta)):
        resumen += "; umbral " + ", ".join(f"{k} {v} %" for k, v in u.items())
    return Corrida(puerta=puerta, ok=ok, cifras=resumen, registro=registro)


def puertas(repo: str, refs: list[str] | None, base: str | None = "origin/integration",
            lista: list[str] | None = None, trabajo: str | None = None, reusar: bool = False) -> list[Punta]:
    if git(repo, "rev-parse", "--is-inside-work-tree").stdout.decode().strip() != "true":
        raise ErrorDeUso(f"{repo} no es un repositorio de git")
    trabajo = trabajo or tempfile.mkdtemp(prefix="puertas-")
    lista = lista or PUERTAS
    resultados: list[Punta] = []
    bases: dict[str, Punta] = {}
    for ref in refs or [None]:
        punta = preparar(repo, ref, trabajo, reusar)
        disponibles = scripts_de(repo, punta.sha or None)
        faltan = [p for p in lista if p not in disponibles]
        if faltan:
            punta.notas.append(f"No existen en package.json: {', '.join(faltan)}.")
        for puerta in [p for p in lista if p in disponibles]:
            c = correr(punta, puerta)
            if c.ok:
                c.estado = "pasa"
            elif puerta.startswith("test"):
                repetida = correr(punta, puerta, "-repetida")
                if repetida.ok:
                    c.estado = "inestable"
                    c.cifras += f" · al repetirla sola pasó ({repetida.cifras})"
            if not c.ok and not c.estado and base and punta.sha:
                c.estado = estado_en_base(repo, punta, base, puerta, trabajo, reusar, bases)
            c.estado = c.estado or "falla"
            punta.corridas.append(c)
        resultados.append(punta)
    return resultados


def estado_en_base(repo: str, punta: Punta, base: str, puerta: str, trabajo: str, reusar: bool,
                   bases: dict[str, Punta]) -> str:
    mb = git(repo, "merge-base", punta.sha, base)
    if mb.returncode != 0:
        punta.notas.append(f"Sin merge-base con {base}: no se pudo separar lo previo de lo nuevo.")
        return "falla"
    sha = mb.stdout.decode().strip()
    if sha not in bases:
        try:
            bases[sha] = preparar(repo, sha, trabajo, reusar)
        except ErrorDeUso as e:
            punta.notas.append(f"No se pudo preparar la base {sha[:10]}: {e}")
            return "falla"
    if puerta not in scripts_de(repo, sha):
        return "falla-nueva"
    en_base = correr(bases[sha], puerta, "-base")
    punta.notas.append(f"{puerta} en la base {sha[:10]} ({base}): {'pasa' if en_base.ok else 'falla'} · {en_base.cifras}")
    return "falla-nueva" if en_base.ok else "ya-fallaba"


# ------------------------------------------------------------------- informe

ETIQUETAS = {
    "pasa": "pasa",
    "inestable": "INESTABLE (pasó sola)",
    "ya-fallaba": "FALLA, ya fallaba en la base",
    "falla-nueva": "FALLA, nueva",
    "falla": "FALLA",
}


def codigo(resultados: list[Punta]) -> int:
    return 1 if any(c.estado in ("falla", "falla-nueva", "ya-fallaba") for p in resultados for c in p.corridas) else 0


def formatear(resultados: list[Punta], repo: str) -> str:
    lineas = [f"Puertas de {repo}", ""]
    for p in resultados:
        lineas.append(f"## {p.nombre}" + (f" ({p.sha[:10]})" if p.sha else ""))
        for c in p.corridas:
            lineas.append(f"  {c.puerta:<11} {ETIQUETAS.get(c.estado, c.estado):<30} {c.cifras}")
            if c.estado != "pasa":
                lineas.append(f"  {'':<11} registro: {c.registro}")
        for n in p.notas:
            lineas.append(f"  nota: {n}")
        lineas.append("")
    inestables = sum(c.estado == "inestable" for p in resultados for c in p.corridas)
    if codigo(resultados):
        lineas.append("Resultado: HAY PUERTAS EN ROJO (código 1). Las que ya fallaban también frenan el MR: "
                      "se corrigen o se declaran al revisor.")
    else:
        lineas.append("Resultado: todas las puertas pasan (código 0)."
                      + (f" {inestables} inestables: repetirlas solas y no verificar en paralelo." if inestables else ""))
    return "\n".join(lineas)


def plan(repo: str, refs: list[str] | None, base: str | None, lista: list[str]) -> str:
    lineas = [f"Plan de puertas en {repo} (no se ejecuta nada)", ""]
    for ref in refs or [None]:
        sha = sha_de(repo, ref) if ref else None
        disponibles = scripts_de(repo, sha)
        corre = [p for p in lista if p in disponibles]
        lineas.append(f"- {ref or 'árbol de trabajo'}{' (' + sha[:10] + ')' if sha else ''}: {', '.join(corre) or 'ninguna'}")
        faltan = [p for p in lista if p not in disponibles]
        if faltan:
            lineas.append(f"    no existen: {', '.join(faltan)}")
        for p in corre:
            lineas.append(f"    {p}: {disponibles[p]}")
        if sha and base:
            mb = git(repo, "merge-base", sha, base)
            if mb.returncode == 0:
                lineas.append(f"    base para separar lo previo: {mb.stdout.decode().strip()[:10]} (merge-base con {base})")
    return "\n".join(lineas)


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    a = argparse.ArgumentParser(description="Corre las puertas de un repo de producto y resume con cifras.")
    a.add_argument("repo")
    a.add_argument("--refs", nargs="+")
    a.add_argument("--base", default="origin/integration")
    a.add_argument("--sin-base", action="store_true")
    a.add_argument("--puertas", default=",".join(PUERTAS))
    a.add_argument("--sin-build", action="store_true")
    a.add_argument("--reusar-node-modules", action="store_true")
    a.add_argument("--trabajo", help="carpeta para las exportaciones y los registros")
    a.add_argument("--plan", action="store_true")
    args = a.parse_args(argv)
    lista = [p for p in args.puertas.split(",") if p and not (args.sin_build and p == "build")]
    base = None if args.sin_base else args.base
    try:
        if args.plan:
            print(plan(args.repo, args.refs, base, lista))
            return 0
        resultados = puertas(args.repo, args.refs, base, lista, args.trabajo, args.reusar_node_modules)
    except ErrorDeUso as e:
        print(f"Error: {e}", file=sys.stderr)
        return 2
    print(formatear(resultados, args.repo))
    return codigo(resultados)


if __name__ == "__main__":
    sys.exit(main())
