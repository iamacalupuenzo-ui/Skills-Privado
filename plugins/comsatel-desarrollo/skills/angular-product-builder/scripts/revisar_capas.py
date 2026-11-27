#!/usr/bin/env python3
"""Revisor de capas y de trabajo duplicado en un repositorio Angular.

Contrato
--------
Entrada:
    python revisar_capas.py <ruta-del-repo> [--ref <ref-de-git>] [--remoto origin]
                            [--sin-duplicados]

    - Sin --ref se lee el árbol de trabajo (los archivos en disco). Los duplicados se
      comparan entonces desde HEAD.
    - Con --ref se lee esa ref con `git ls-tree` y `git show`, sin checkout: el árbol de
      trabajo, el índice y las ramas no se tocan. Sirve para revisar un repo donde otra
      persona u otro agente está trabajando.

Qué revisa:
    1. Capas. En `src/app/features/**` (cualquier ruta que contenga `src/app/features/`),
       cada `.ts` que no es `.spec.ts` y que contiene datos sin interfaz:
         - nombre de capa de datos: *.api.ts, *-api.service.ts, *.model.ts, *.dto.ts,
           *.validation.ts, *.validator(s).ts, *.adapter.ts, *.mapper.ts, *.client.ts,
           *.repository.ts;
         - `@Injectable` que usa `HttpClient`;
         - un literal de URL `/api/...` en un archivo que no es la página;
         - un archivo con tipos o interfaces exportados y sin componente, directiva,
           pipe ni servicio inyectable (si importa una librería de UI es solo un aviso:
           puede ser presentación que va en `shared/`).
       La regla viene de los README con capas `core/ → datos`, `shared/ → UI
       reutilizable`, `features/ → pantalla`. `core/` y `shared/` no se marcan.
    2. Duplicados. Contra cada ref `<remoto>/*` que no está ya contenida en la ref
       revisada, compara lo que cada lado agregó o cambió desde su merge-base:
         - el mismo nombre de archivo creado en ambos lados (sin contar pruebas; si
           ambos solo modificaron el mismo archivo es un conflicto, no un duplicado);
         - la misma URL `/api/...` que no existía en la historia común, comparada sin
           el segmento de versión (`/v1/`) ni parámetros.
       Así no se marcan los archivos que ambas ramas heredan de la historia común.

Salida:
    Informe legible en stdout (UTF-8).
    Código 0: sin hallazgos (puede haber avisos).
    Código 1: hay hallazgos de capas o duplicados.
    Código 2: error de uso (la ruta no es un repo de git, la ref no existe).

Solo biblioteca estándar. No escribe en el repositorio revisado: usa únicamente
`git rev-parse`, `git ls-tree`, `git show`, `git merge-base`, `git diff --name-only`,
`git for-each-ref` y `git grep`.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import PurePosixPath

FEATURES_RE = re.compile(r"(^|/)src/app/features/")

NOMBRES_DE_DATOS = re.compile(
    r"(\.api|-api|\.api\.service|-api\.service|\.model|\.models|\.dto|\.validation|"
    r"\.validators?|\.adapter|\.mapper|\.client|\.repository)\.ts$"
)
# Textos y rutas son de la pantalla aunque declaren un tipo auxiliar.
NOMBRES_DE_PANTALLA = re.compile(r"(\.copy|\.routes|-routes|\.page|\.component)\.ts$")

DECORADOR_UI = re.compile(r"@(Component|Directive|Pipe)\s*\(")
INYECTABLE = re.compile(r"@Injectable\s*\(")
HTTP_CLIENT = re.compile(r"\bHttpClient\b")
TIPOS_EXPORTADOS = re.compile(r"^\s*export\s+(declare\s+)?(interface|type|enum)\s+\w+", re.M)
IMPORTA_UI = re.compile(
    r"from\s+['\"](@comsatel/ui-components[^'\"]*|@angular/material[^'\"]*|@angular/cdk[^'\"]*|"
    r"[^'\"]*\.component)['\"]"
)
URL_API = re.compile(r"""['"`](/api/[^'"`\s]*)""")


@dataclass
class Hallazgo:
    ruta: str
    motivos: list[str]


@dataclass
class Duplicado:
    ref: str
    tipo: str  # "archivo" o "url"
    valor: str
    aqui: list[str]
    alla: list[str]


@dataclass
class Informe:
    repo: str
    ref: str | None
    revisados: int = 0
    hallazgos: list[Hallazgo] = field(default_factory=list)
    avisos: list[Hallazgo] = field(default_factory=list)
    duplicados: list[Duplicado] = field(default_factory=list)
    refs_comparadas: list[str] = field(default_factory=list)
    notas: list[str] = field(default_factory=list)

    @property
    def codigo(self) -> int:
        return 1 if (self.hallazgos or self.duplicados) else 0


class ErrorDeUso(Exception):
    pass


# --------------------------------------------------------------------------- git


def git(repo: str, *args: str, check: bool = True) -> str:
    proc = subprocess.run(
        ["git", "-C", repo, *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if check and proc.returncode != 0:
        raise ErrorDeUso(f"git {' '.join(args)}: {proc.stderr.strip()}")
    return proc.stdout


def ref_existe(repo: str, ref: str) -> bool:
    proc = subprocess.run(
        ["git", "-C", repo, "rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"],
        capture_output=True,
        text=True,
    )
    return proc.returncode == 0


# ----------------------------------------------------------------------- capas


def sin_comentarios(texto: str) -> str:
    texto = re.sub(r"/\*[\s\S]*?\*/", "", texto)
    return re.sub(r"(?m)(^|[^:'\"`])//.*$", r"\1", texto)


def urls_api(texto: str) -> set[str]:
    return {m.group(1) for m in URL_API.finditer(sin_comentarios(texto))}


def clasificar(ruta: str, texto: str) -> tuple[list[str], list[str]]:
    """Devuelve (motivos de hallazgo, motivos de aviso) para un .ts de features/."""
    nombre = PurePosixPath(ruta).name
    codigo = sin_comentarios(texto)
    motivos: list[str] = []
    avisos: list[str] = []

    if NOMBRES_DE_DATOS.search(nombre):
        motivos.append("nombre de capa de datos (modelo, cliente HTTP, validación o adaptador)")
    if INYECTABLE.search(codigo) and HTTP_CLIENT.search(codigo):
        motivos.append("@Injectable con HttpClient: es un cliente HTTP")
    urls = urls_api(texto)
    if urls and not nombre.endswith(".page.ts"):
        motivos.append("habla con la API: " + ", ".join(sorted(urls)))
    elif urls:
        motivos.append("la página llama directo a la API: " + ", ".join(sorted(urls)))

    es_pieza_angular = DECORADOR_UI.search(codigo) or INYECTABLE.search(codigo)
    if (
        TIPOS_EXPORTADOS.search(codigo)
        and not es_pieza_angular
        and not NOMBRES_DE_PANTALLA.search(nombre)
    ):
        if IMPORTA_UI.search(codigo):
            avisos.append(
                "tipos sin componente que importan una librería de UI: si es presentación "
                "que reutiliza otra pantalla, va en shared/"
            )
        else:
            motivos.append("tipos o interfaces exportados sin componente: son datos sin interfaz")
    return motivos, avisos


def archivos_features_ref(repo: str, ref: str) -> list[str]:
    salida = git(repo, "ls-tree", "-r", "--name-only", ref)
    return [r for r in salida.splitlines() if es_candidato(r)]


def archivos_features_disco(repo: str) -> list[str]:
    encontrados = []
    for base, dirs, archivos in os.walk(repo):
        dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "dist", ".angular"}]
        for a in archivos:
            rel = os.path.relpath(os.path.join(base, a), repo).replace(os.sep, "/")
            if es_candidato(rel):
                encontrados.append(rel)
    return sorted(encontrados)


def es_candidato(ruta: str) -> bool:
    return bool(FEATURES_RE.search(ruta)) and ruta.endswith(".ts") and not ruta.endswith(".spec.ts")


def leer(repo: str, ref: str | None, ruta: str) -> str:
    if ref is None:
        with open(os.path.join(repo, ruta), encoding="utf-8", errors="replace") as f:
            return f.read()
    return git(repo, "show", f"{ref}:{ruta}")


# ------------------------------------------------------------------ duplicados


def normalizar_url(url: str) -> str:
    url = url.split("?")[0].split("${")[0].lower().rstrip("/")
    url = re.sub(r"/v\d+(?=/|$)", "", url)
    url = re.sub(r"/:[^/]+", "/*", url)
    return url


def refs_remotas(repo: str, remoto: str) -> list[str]:
    salida = git(repo, "for-each-ref", "--format=%(refname)", f"refs/remotes/{remoto}/")
    refs = []
    for nombre in salida.splitlines():
        if nombre.endswith("/HEAD"):
            continue
        refs.append(nombre[len("refs/remotes/"):])
    return refs


def cambiados(repo: str, base: str, punta: str, filtro: str = "AM") -> list[str]:
    salida = git(repo, "diff", "--name-only", f"--diff-filter={filtro}", base, punta)
    return [r for r in salida.splitlines() if r.startswith("src/") or "/src/" in r]


def urls_de_la_base(repo: str, base: str) -> set[str]:
    """URLs normalizadas que ya existían en la historia común: no son trabajo nuevo de nadie."""
    salida = git(repo, "grep", "-h", "-F", "/api/", base, "--", "*.ts", check=False)
    return {normalizar_url(u) for u in urls_api(salida)}


def urls_en(repo: str, ref: str, rutas: list[str]) -> dict[str, list[str]]:
    """URL normalizada -> rutas que la usan (solo .ts que no son pruebas)."""
    mapa: dict[str, list[str]] = {}
    for ruta in rutas:
        if not ruta.endswith(".ts") or ruta.endswith(".spec.ts"):
            continue
        for url in urls_api(git(repo, "show", f"{ref}:{ruta}", check=False)):
            mapa.setdefault(normalizar_url(url), []).append(ruta)
    return mapa


def buscar_duplicados(repo: str, ref: str, remoto: str, informe: Informe) -> None:
    punta = git(repo, "rev-parse", ref).strip()
    for otra in refs_remotas(repo, remoto):
        otra_punta = git(repo, "rev-parse", otra).strip()
        if otra_punta == punta:
            continue
        base = git(repo, "merge-base", ref, otra, check=False).strip()
        if not base or base == otra_punta:  # sin historia común o ya contenida en la ref
            continue
        informe.refs_comparadas.append(otra)
        aqui = cambiados(repo, base, ref)
        alla = cambiados(repo, base, otra)
        if not aqui or not alla:
            continue
        # Un archivo que ambos lados solo modificaron es un posible conflicto, no trabajo
        # duplicado: el nombre cuenta solo si cada lado lo creó.
        nuevos_aqui = set(cambiados(repo, base, ref, "A"))
        nuevos_alla = set(cambiados(repo, base, otra, "A"))

        def por_nombre(rutas: list[str]) -> dict[str, list[str]]:
            mapa: dict[str, list[str]] = {}
            for r in rutas:
                if r.endswith(".ts") and not r.endswith(".spec.ts"):
                    mapa.setdefault(PurePosixPath(r).name, []).append(r)
            return mapa

        nombres_aqui = por_nombre([r for r in aqui if r in nuevos_aqui])
        nombres_alla = por_nombre([r for r in alla if r in nuevos_alla])
        for nombre in sorted(set(nombres_aqui) & set(nombres_alla)):
            informe.duplicados.append(
                Duplicado(otra, "archivo", nombre, nombres_aqui[nombre], nombres_alla[nombre])
            )
        # Se lee por SHA: en Windows `c:ruta` con una rama llamada «c» se confunde con una unidad.
        urls_aqui, urls_alla = urls_en(repo, punta, aqui), urls_en(repo, otra_punta, alla)
        comunes = set(urls_aqui) & set(urls_alla)
        if comunes:
            comunes -= urls_de_la_base(repo, base)
        for url in sorted(comunes):
            informe.duplicados.append(Duplicado(otra, "url", url, urls_aqui[url], urls_alla[url]))


# ---------------------------------------------------------------------- informe


def revisar(repo: str, ref: str | None = None, remoto: str = "origin", duplicados: bool = True) -> Informe:
    if not os.path.isdir(repo):
        raise ErrorDeUso(f"No existe la carpeta {repo}")
    if git(repo, "rev-parse", "--is-inside-work-tree", check=False).strip() != "true" and not ref:
        raise ErrorDeUso(f"{repo} no es un repositorio de git")
    if ref is not None and not ref_existe(repo, ref):
        raise ErrorDeUso(f"La ref {ref} no existe en {repo}")

    informe = Informe(repo=repo, ref=ref)
    # Se trabaja con el SHA y no con el nombre: `rama:ruta` es ambiguo en Windows si la rama
    # se llama como una unidad (c, d).
    commit = git(repo, "rev-parse", f"{ref}^{{commit}}").strip() if ref else None
    rutas = archivos_features_ref(repo, commit) if commit else archivos_features_disco(repo)
    informe.revisados = len(rutas)
    for ruta in rutas:
        motivos, avisos = clasificar(ruta, leer(repo, commit, ruta))
        if motivos:
            informe.hallazgos.append(Hallazgo(ruta, motivos))
        if avisos:
            informe.avisos.append(Hallazgo(ruta, avisos))

    if duplicados:
        base_ref = ref or "HEAD"
        if not ref_existe(repo, base_ref):
            informe.notas.append("Sin commits: no se buscaron duplicados.")
        elif not refs_remotas(repo, remoto):
            informe.notas.append(
                f"No hay refs {remoto}/*: corre `git fetch {remoto}` para comparar con el trabajo de otros."
            )
        else:
            buscar_duplicados(repo, base_ref, remoto, informe)
    return informe


def formatear(informe: Informe) -> str:
    lineas = [
        "Revisión de capas (core/ datos, shared/ UI reutilizable, features/ pantalla)",
        f"Repositorio: {informe.repo}",
        f"Ref: {informe.ref or 'árbol de trabajo'}",
        f"Archivos .ts de features/ revisados (sin pruebas): {informe.revisados}",
        "",
    ]
    if informe.hallazgos:
        lineas.append(f"HALLAZGOS DE CAPAS ({len(informe.hallazgos)}): datos sin interfaz dentro de features/")
        for h in informe.hallazgos:
            lineas.append(f"  - {h.ruta}")
            lineas.extend(f"      · {m}" for m in h.motivos)
        lineas.append("  Qué hacer: mover modelo, cliente HTTP, validación y adaptadores a core/<dominio>/.")
    else:
        lineas.append("Capas: sin datos sin interfaz dentro de features/.")
    if informe.avisos:
        lineas.append("")
        lineas.append(f"AVISOS ({len(informe.avisos)}): revisar a mano, no cuentan como hallazgo")
        for h in informe.avisos:
            lineas.append(f"  - {h.ruta}")
            lineas.extend(f"      · {m}" for m in h.motivos)

    if informe.duplicados or informe.refs_comparadas or informe.notas:
        lineas.append("")
    if informe.duplicados:
        lineas.append(f"POSIBLE TRABAJO DUPLICADO ({len(informe.duplicados)}):")
        for d in informe.duplicados:
            que = f"mismo nombre de archivo «{d.valor}»" if d.tipo == "archivo" else f"misma URL {d.valor}"
            lineas.append(f"  - {d.ref}: {que}")
            lineas.append(f"      aquí: {', '.join(d.aqui)}")
            lineas.append(f"      allá: {', '.join(d.alla)}")
        lineas.append(
            "  Qué hacer: leer esa rama antes de seguir; si ya tiene la capa de datos, basar la rama ahí "
            "o preguntar al usuario."
        )
    elif informe.refs_comparadas:
        lineas.append(f"Duplicados: ninguno en {len(informe.refs_comparadas)} ramas remotas comparadas.")
    lineas.extend(informe.notas)
    lineas.append("")
    lineas.append(
        "Resultado: " + ("HAY HALLAZGOS (código 1)" if informe.codigo else "sin hallazgos (código 0)")
    )
    return "\n".join(lineas)


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(
        description="Marca datos sin interfaz dentro de features/ y trabajo duplicado en otras ramas."
    )
    parser.add_argument("repo", help="ruta del repositorio Angular")
    parser.add_argument("--ref", help="ref de git a revisar sin checkout (por defecto, el árbol de trabajo)")
    parser.add_argument("--remoto", default="origin", help="remoto cuyas ramas se comparan (por defecto origin)")
    parser.add_argument("--sin-duplicados", action="store_true", help="revisar solo las capas")
    args = parser.parse_args(argv)
    try:
        informe = revisar(args.repo, args.ref, args.remoto, not args.sin_duplicados)
    except ErrorDeUso as e:
        print(f"Error: {e}", file=sys.stderr)
        return 2
    print(formatear(informe))
    return informe.codigo


if __name__ == "__main__":
    sys.exit(main())
