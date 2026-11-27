#!/usr/bin/env python3
"""Calcula el siguiente ID libre de un prefijo de la KB (DEC, UXR, SCR, FLW, AVS-DSP-005, ...).

Contrato
  uso:   py -3 siguiente_id.py <PREFIJO> [--repo RUTA]
  salida: una línea «PREFIJO-NNN» (el máximo visto + 1) y, en stderr, dónde se vio el máximo.
  código 0: calculado; 2: argumentos inválidos; 3: no es un repositorio git.

Por qué mira más que el árbol local: el árbol de trabajo suele ir atrás de origin/develop y otras
ramas ya reservaron números. Se consultan el árbol local, todas las ramas locales y las remotas.
Si `git fetch` no se hizo, avisa en stderr: el resultado es entonces un mínimo, no un hecho.
"""
import re
import subprocess
import sys


def git(repo, *args):
    r = subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True, encoding="utf-8")
    return r.returncode, r.stdout


def main(argv):
    if len(argv) < 2 or argv[1].startswith("-"):
        print("uso: siguiente_id.py <PREFIJO> [--repo RUTA]", file=sys.stderr)
        return 2
    prefijo = argv[1].rstrip("-")
    repo = argv[argv.index("--repo") + 1] if "--repo" in argv else "."
    if git(repo, "rev-parse", "--git-dir")[0] != 0:
        print(f"{repo} no es un repositorio git", file=sys.stderr)
        return 3

    # El prefijo va seguido de 3 o más dígitos (DEC-103, UXR-129). Los sufijos de fecha no cuentan.
    patron = re.compile(r"(?:^|[/\\])" + re.escape(prefijo) + r"-(\d{3,})(?!\d)")
    visto = {}  # origen -> máximo

    def registrar(origen, nombres):
        for n in nombres.splitlines():
            m = patron.search(n)
            if m:
                visto[origen] = max(visto.get(origen, 0), int(m.group(1)))

    rc, out = git(repo, "ls-files", "--cached", "--others", "--exclude-standard")
    if rc == 0:
        registrar("árbol local", out)
    # Con cientos de ramas, recorrerlas todas tarda minutos. Por defecto: develop y las ramas con
    # actividad de los últimos 14 días (donde se reservan los números); --todas las recorre todas.
    rc, refs = git(repo, "for-each-ref", "--format=%(refname:short) %(committerdate:unix)",
                   "refs/heads", "refs/remotes")
    import time
    corte = time.time() - 14 * 86400
    elegidas = []
    for linea in refs.splitlines():
        ref, _, fecha = linea.rpartition(" ")
        if "--todas" in argv or ref.endswith("/develop") or ref == "develop" or float(fecha or 0) >= corte:
            elegidas.append(ref)
    for ref in elegidas:
        rc, out = git(repo, "ls-tree", "-r", "--name-only", ref)
        if rc == 0:
            registrar(ref, out)

    if not visto:
        print(f"{prefijo}-001")
        print(f"sin coincidencias para {prefijo}; ¿el prefijo es correcto?", file=sys.stderr)
        return 0
    origen, maximo = max(visto.items(), key=lambda kv: kv[1])
    print(f"{prefijo}-{maximo + 1:03d}")
    print(f"máximo visto: {prefijo}-{maximo:03d} en {origen}", file=sys.stderr)
    local = visto.get("árbol local", 0)
    if local < maximo:
        print(f"aviso: el árbol local llega a {local:03d}; haz `git fetch` y revisa antes de crear.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.stderr.reconfigure(encoding="utf-8")
    sys.exit(main(sys.argv))
