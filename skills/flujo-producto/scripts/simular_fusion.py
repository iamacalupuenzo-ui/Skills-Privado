#!/usr/bin/env python3
"""Simula la fusión de la rama de integración dentro de una o varias ramas, sin tocar nada.

Contrato
--------
Entrada:
    python simular_fusion.py <repo> [--base origin/integration] [--remoto origin]
                             [--sin-fetch] [--locales] <rama> [<rama> ...]

    - Primero `git fetch <remoto>` (salvo --sin-fetch), para no comparar contra una copia vieja.
    - Cada rama se resuelve como `<remoto>/<rama>` si existe (lo que irá al MR); con --locales,
      o si no existe en el remoto, se usa la rama local. Si la local y la remota difieren, se avisa.
    - Por rama: `git merge-tree --write-tree --name-only <base> <rama>`. No cambia el árbol de
      trabajo, el índice ni las ramas: solo escribe objetos sueltos en la base de datos de git.

Salida (stdout, UTF-8):
    Por rama: choques (archivo y tipo), commits propios que no están en la base y cuántos
    commits va adelante la base. Después, las cadenas apiladas (A es ancestro de B, según
    `git merge-base --is-ancestor`) con el orden en que se integran: primero la base de la
    cadena y luego se propaga a cada hija.
    Código 0: ninguna rama choca con la base.
    Código 1: al menos una rama choca.
    Código 2: error de uso (no es un repo, la base o una rama no existe, git sin merge-tree
              --write-tree, que pide git 2.38 o superior).

Solo biblioteca estándar.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass, field


class ErrorDeUso(Exception):
    pass


@dataclass
class Resultado:
    rama: str
    ref: str
    choques: list[tuple[str, str]] = field(default_factory=list)  # (archivo, tipo)
    propios: int = 0
    base_adelante: int = 0
    aviso: str = ""


@dataclass
class Informe:
    repo: str
    base: str
    resultados: list[Resultado] = field(default_factory=list)
    cadenas: list[list[str]] = field(default_factory=list)
    notas: list[str] = field(default_factory=list)

    @property
    def codigo(self) -> int:
        return 1 if any(r.choques for r in self.resultados) else 0


def git(repo: str, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    proc = subprocess.run(
        ["git", "-C", repo, *args], capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    if check and proc.returncode != 0:
        raise ErrorDeUso(f"git {' '.join(args)}: {proc.stderr.strip()}")
    return proc


def existe(repo: str, ref: str) -> bool:
    return git(repo, "rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}", check=False).returncode == 0


def sha(repo: str, ref: str) -> str:
    return git(repo, "rev-parse", f"{ref}^{{commit}}").stdout.strip()


def contar(repo: str, rango: str) -> int:
    return int(git(repo, "rev-list", "--count", rango).stdout.strip() or 0)


def choques(repo: str, base: str, rama: str) -> list[tuple[str, str]]:
    proc = git(repo, "merge-tree", "--write-tree", "--name-only", base, rama, check=False)
    if proc.returncode not in (0, 1):
        raise ErrorDeUso(f"git merge-tree falló ({proc.stderr.strip()}). Hace falta git 2.38 o superior.")
    if proc.returncode == 0:
        return []
    bloques = proc.stdout.split("\n\n", 1)
    nombres = [n for n in bloques[0].splitlines()[1:] if n.strip()]
    tipos: dict[str, str] = {}
    for linea in (bloques[1] if len(bloques) > 1 else "").splitlines():
        m = re.match(r"^CONFLICT \(([^)]+)\):", linea)
        if not m:
            continue
        for nombre in nombres:
            if nombre in linea:
                tipos.setdefault(nombre, m.group(1))
    vistos: list[str] = []
    for n in nombres:
        if n not in vistos:
            vistos.append(n)
    return [(n, tipos.get(n, "contenido")) for n in vistos]


def resolver(repo: str, rama: str, remoto: str, locales: bool) -> tuple[str, str]:
    remota = f"{remoto}/{rama}"
    if not locales and existe(repo, remota):
        aviso = ""
        if existe(repo, rama) and sha(repo, rama) != sha(repo, remota):
            adelante = contar(repo, f"{remota}..{rama}")
            atras = contar(repo, f"{rama}..{remota}")
            aviso = f"la rama local difiere de {remota} (local +{adelante} / -{atras}); se simuló la remota"
        return remota, aviso
    if existe(repo, rama):
        return rama, ("no existe en el remoto: se simuló la local" if not locales else "")
    raise ErrorDeUso(f"La rama {rama} no existe ni local ni en {remoto}")


def detectar_cadenas(repo: str, refs: dict[str, str]) -> list[list[str]]:
    """Agrupa las ramas apiladas: A antes que B si A es ancestro de B (y no son el mismo commit)."""
    nombres = list(refs)
    padre: dict[str, str] = {}
    for hija in nombres:
        candidatas = [
            a for a in nombres
            if a != hija
            and sha(repo, refs[a]) != sha(repo, refs[hija])
            and git(repo, "merge-base", "--is-ancestor", refs[a], refs[hija], check=False).returncode == 0
        ]
        if candidatas:
            # La más cercana: la que tiene más ancestros entre las candidatas.
            padre[hija] = max(candidatas, key=lambda a: contar(repo, refs[a]))
    raices = [n for n in nombres if n not in padre and any(padre.get(h) == n for h in nombres)]
    cadenas = []
    for raiz in raices:
        cadena, actual = [raiz], raiz
        while True:
            hijas = [h for h in nombres if padre.get(h) == actual]
            if not hijas:
                break
            actual = hijas[0]
            cadena.append(actual)
        cadenas.append(cadena)
    return cadenas


def simular(repo: str, ramas: list[str], base: str = "origin/integration", remoto: str = "origin",
            fetch: bool = True, locales: bool = False) -> Informe:
    if git(repo, "rev-parse", "--is-inside-work-tree", check=False).stdout.strip() != "true":
        raise ErrorDeUso(f"{repo} no es un repositorio de git")
    informe = Informe(repo=repo, base=base)
    if fetch:
        proc = git(repo, "fetch", "--quiet", remoto, check=False)
        if proc.returncode != 0:
            informe.notas.append(f"git fetch {remoto} falló ({proc.stderr.strip()[:120]}); se usan las refs que había.")
    else:
        informe.notas.append("Sin git fetch: se compara contra las refs remotas que ya había en el clon.")
    if not existe(repo, base):
        raise ErrorDeUso(f"La base {base} no existe en {repo}")
    refs: dict[str, str] = {}
    for rama in ramas:
        ref, aviso = resolver(repo, rama, remoto, locales)
        refs[rama] = ref
        r = Resultado(rama=rama, ref=ref, aviso=aviso)
        r.choques = choques(repo, base, ref)
        r.propios = contar(repo, f"{base}..{ref}")
        r.base_adelante = contar(repo, f"{ref}..{base}")
        informe.resultados.append(r)
    informe.cadenas = detectar_cadenas(repo, refs)
    return informe


def formatear(informe: Informe) -> str:
    lineas = [f"Simulación de fusión de {informe.base} dentro de cada rama", f"Repositorio: {informe.repo}", ""]
    for r in informe.resultados:
        estado = f"{len(r.choques)} choques" if r.choques else "sin choques"
        lineas.append(f"- {r.rama} ({r.ref}): {estado}; {r.propios} commits propios; la base va {r.base_adelante} adelante")
        if r.aviso:
            lineas.append(f"    aviso: {r.aviso}")
        for archivo, tipo in r.choques:
            lineas.append(f"    · {archivo} ({tipo})")
    if informe.cadenas:
        lineas.append("")
        lineas.append("Cadenas apiladas (se integra la base de la cadena y se propaga a cada hija, en este orden):")
        for cadena in informe.cadenas:
            lineas.append("  " + " → ".join(cadena))
    if informe.notas:
        lineas.append("")
        lineas.extend(informe.notas)
    lineas.append("")
    if informe.codigo:
        lineas.append("Resultado: HAY CHOQUES (código 1). Integrar con `git merge` en un worktree aparte, "
                      "conservando lo de ambos lados; nunca rebase ni push forzado.")
    else:
        lineas.append("Resultado: sin choques (código 0).")
    return "\n".join(lineas)


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description="Simula la fusión de la rama de integración en cada rama, sin tocar nada.")
    p.add_argument("repo")
    p.add_argument("ramas", nargs="+")
    p.add_argument("--base", default="origin/integration")
    p.add_argument("--remoto", default="origin")
    p.add_argument("--sin-fetch", action="store_true", help="no correr git fetch (usar las refs que ya hay)")
    p.add_argument("--locales", action="store_true", help="simular las ramas locales en vez de las remotas")
    a = p.parse_args(argv)
    try:
        informe = simular(a.repo, a.ramas, a.base, a.remoto, not a.sin_fetch, a.locales)
    except ErrorDeUso as e:
        print(f"Error: {e}", file=sys.stderr)
        return 2
    print(formatear(informe))
    return informe.codigo


if __name__ == "__main__":
    sys.exit(main())
