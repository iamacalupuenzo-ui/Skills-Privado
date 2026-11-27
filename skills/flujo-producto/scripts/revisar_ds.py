#!/usr/bin/env python3
"""Revisa la versión del Design System (@comsatel/ui-components) que fija un producto.

Contrato
--------
Entrada:
    python revisar_ds.py <repo> [--ref <rama>] [--pareja <repo>[@<ref>]] ...
                         [--sin-registro] [--sin-piezas] [--cache <carpeta>]

    - Sin --ref se leen los archivos en disco; con --ref, `git show <ref>:package.json` (sin
      checkout: sirve para revisar la rama de otro worktree o de otro agente).
    - --pareja: el otro lado de la pareja Shell + micro UI (puede repetirse). Formato
      `ruta` o `ruta@ref`.

Qué revisa (hallazgos, código 1):
    1. `@comsatel/ui-components` está declarado con versión exacta (`1.17.0`, no `^1.17.0`,
       `latest` ni `file:`), y el package-lock resuelve esa misma versión.
    2. Registro (`npm view @comsatel/ui-components dist-tags versions --json`, desde la carpeta
       del repo para usar su `.npmrc`): la versión existe y, si es una prerelease (`-pre.N`,
       `-dev.N`, `-qa.N`), no hay ya una estable igual o mayor publicada.
    3. Pareja: cada repo de --pareja fija exactamente la misma versión.
    4. Piezas (salvo --sin-piezas): se descarga el paquete de la versión que se debería usar
       (la fijada o, si es prerelease superada, la estable) y se comprueba que:
         - cada subpath importado (`@comsatel/ui-components/<x>`) está en su `exports`;
         - cada atributo estático de un `<cs-*>` con tipo de literales en el .d.ts
           (`variant="neutral"` en `cs-button`) es un valor de ese tipo.
       Aviso (no cuenta como hallazgo): un literal del mismo archivo que parece un valor de un
       input enlazado (`[name]="escena"`) y no está en el tipo. Lo dinámico solo lo prueba la
       compilación en un worktree limpio con `npm ci` (puertas.py de verificar-calidad).

    El paquete se baja con la URL de `npm view ... dist.tarball` y el token de la variable
    GITLAB_NPM_TOKEN (cabecera Authorization; nunca se imprime). Se guarda en --cache.

Salida: informe legible en stdout (UTF-8).
    Código 0: sin hallazgos. Código 1: hallazgos. Código 2: error de uso (sin package.json,
    ref inexistente, el DS no está declarado). Si el registro no responde, se declara
    «no verificado» y no se inventa el resultado.

Solo biblioteca estándar.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
from dataclasses import dataclass, field

PAQUETE = "@comsatel/ui-components"
EXACTA = re.compile(r"^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$")


class ErrorDeUso(Exception):
    pass


@dataclass
class Informe:
    repo: str
    ref: str | None
    version: str = ""
    objetivo: str = ""
    hallazgos: list[str] = field(default_factory=list)
    avisos: list[str] = field(default_factory=list)
    notas: list[str] = field(default_factory=list)

    @property
    def codigo(self) -> int:
        return 1 if self.hallazgos else 0


# ------------------------------------------------------------------- lectura


def git(repo: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True, encoding="utf-8", errors="replace")


def leer(repo: str, ref: str | None, ruta: str) -> str | None:
    if ref is None:
        try:
            with open(os.path.join(repo, ruta), encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return None
    proc = git(repo, "show", f"{ref}:{ruta}")
    return proc.stdout if proc.returncode == 0 else None


def fuentes(repo: str, ref: str | None) -> dict[str, str]:
    """Archivos .ts/.html de src/ (sin pruebas)."""
    rutas: list[str] = []
    if ref is None:
        for base, dirs, archivos in os.walk(os.path.join(repo, "src")):
            dirs[:] = [d for d in dirs if d not in {"node_modules", "dist", ".angular"}]
            rutas += [os.path.relpath(os.path.join(base, a), repo).replace(os.sep, "/") for a in archivos]
    else:
        rutas = git(repo, "ls-tree", "-r", "--name-only", ref, "--", "src").stdout.splitlines()
    rutas = [r for r in rutas if r.endswith((".ts", ".html")) and not r.endswith(".spec.ts")]
    return {r: leer(repo, ref, r) or "" for r in rutas}


def version_declarada(paquete: dict) -> str | None:
    for seccion in ("dependencies", "devDependencies", "peerDependencies"):
        v = paquete.get(seccion, {}).get(PAQUETE)
        if v:
            return v
    return None


def version_lock(lock: dict | None) -> str | None:
    if not lock:
        return None
    nodo = lock.get("packages", {}).get(f"node_modules/{PAQUETE}") or lock.get("dependencies", {}).get(PAQUETE)
    return nodo.get("version") if nodo else None


def separar_pareja(texto: str) -> tuple[str, str | None]:
    # «ruta@ref»; una ruta de Windows lleva «:» pero no «@».
    if "@" in texto:
        ruta, ref = texto.rsplit("@", 1)
        return ruta, ref or None
    return texto, None


# ------------------------------------------------------------------- versiones


def clave(v: str) -> tuple:
    base, _, pre = v.partition("-")
    numeros = tuple(int(x) for x in base.split("."))
    return numeros + ((1,) if not pre else (0, pre))


def es_prerelease(v: str) -> bool:
    return "-" in v


def estable_superior(version: str, versiones: list[str]) -> str | None:
    base = version.partition("-")[0]
    estables = [v for v in versiones if not es_prerelease(v) and EXACTA.match(v) and clave(v) >= clave(base)]
    return max(estables, key=clave) if estables else None


def consultar_registro(repo: str) -> dict:
    proc = subprocess.run(
        ["npm", "view", PAQUETE, "dist-tags", "versions", "--json"],
        cwd=repo, capture_output=True, text=True, encoding="utf-8", errors="replace", shell=os.name == "nt",
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip().splitlines()[-1] if proc.stderr.strip() else "npm view falló")
    return json.loads(proc.stdout)


# ------------------------------------------------------------------- paquete


def descargar_paquete(repo: str, version: str, cache: str) -> dict[str, str]:
    """Devuelve {ruta dentro del paquete: texto} de package.json, los .d.ts y los .mjs."""
    os.makedirs(cache, exist_ok=True)
    destino = os.path.join(cache, f"ui-components-{version}.tgz")
    if not os.path.exists(destino):
        proc = subprocess.run(
            ["npm", "view", f"{PAQUETE}@{version}", "dist.tarball"],
            cwd=repo, capture_output=True, text=True, shell=os.name == "nt",
        )
        url = proc.stdout.strip()
        if proc.returncode != 0 or not url.startswith("http"):
            raise RuntimeError(f"no se encontró el tarball de {version}")
        token = os.environ.get("GITLAB_NPM_TOKEN") or os.environ.get("GITLAB_TOKEN")
        cabeceras = {"Authorization": f"Bearer {token}"} if token else {}
        with urllib.request.urlopen(urllib.request.Request(url, headers=cabeceras), timeout=90) as r:
            datos = r.read()
        with open(destino, "wb") as f:
            f.write(datos)
    archivos: dict[str, str] = {}
    with tarfile.open(destino) as t:
        for m in t.getmembers():
            if m.name == "package/package.json" or m.name.endswith((".d.ts", ".mjs")):
                archivos[m.name] = t.extractfile(m).read().decode("utf-8", "replace")
    return archivos


def literales(tipo: str) -> set[str]:
    return set(re.findall(r"'([^']*)'", tipo)) | set(re.findall(r'"([^"]*)"', tipo))


def tipos_del_paquete(paquete: dict[str, str]) -> dict[str, str]:
    alias: dict[str, str] = {}
    for texto in paquete.values():
        for m in re.finditer(r"type\s+(\w+)\s*=\s*([^;]+);", texto):
            alias[m.group(1)] = m.group(2).strip()
    return alias


def partir_union(expr: str) -> list[str]:
    """Separa por `|` de primer nivel (no dentro de <...>)."""
    partes, nivel, actual = [], 0, ""
    for ch in expr:
        nivel += ch == "<"
        nivel -= ch == ">"
        if ch == "|" and nivel == 0:
            partes.append(actual.strip())
            actual = ""
        else:
            actual += ch
    partes.append(actual.strip())
    return [p for p in partes if p]


def resolver(expr: str, alias: dict[str, str], vistos: frozenset = frozenset()) -> set[str] | None:
    """Literales que admite un tipo, o None si no es un tipo de literales.
    `Exclude<A, …>` y `Extract<A, …>` se toman como A: un valor fuera de A seguro es inválido."""
    valores: set[str] = set()
    for parte in partir_union(expr):
        if re.fullmatch(r"'[^']*'|\"[^\"]*\"", parte):
            valores.add(parte[1:-1])
        elif parte in ("undefined", "null"):
            continue
        elif m := re.fullmatch(r"(?:Exclude|Extract)<\s*(\w+)\s*,.*>", parte, re.S):
            sub = resolver(m.group(1), alias, vistos)
            if sub is None:
                return None
            valores |= sub
        elif parte in alias and parte not in vistos:
            sub = resolver(alias[parte], alias, vistos | {parte})
            if sub is None:
                return None
            valores |= sub
        else:
            return None
    return valores or None


def indice_componentes(paquete: dict[str, str]) -> dict[str, dict[str, set[str]]]:
    """selector -> {input: valores literales permitidos}. Solo inputs con tipo de literales."""
    alias = tipos_del_paquete(paquete)
    indice: dict[str, dict[str, set[str]]] = {}
    for texto in paquete.values():
        for m in re.finditer(r"ComponentDeclaration<\s*(\w+)\s*,\s*\"([^\"]+)\"", texto):
            clase, selectores = m.group(1), m.group(2)
            cuerpo = re.search(rf"class\s+{clase}\b[^{{]*\{{(.*?)\n\}}", texto, re.S)
            if not cuerpo:
                continue
            entradas: dict[str, set[str]] = {}
            for e in re.finditer(r"(?:readonly\s+)?(\w+)\??\s*:\s*(?:[\w.]*Input(?:Signal)?(?:WithTransform)?<\s*)?([^;>,]+)", cuerpo.group(1)):
                vals = resolver(e.group(2).strip(), alias)
                if vals:
                    entradas[e.group(1)] = vals
            for sel in selectores.split(","):
                sel = sel.strip()
                if re.fullmatch(r"[a-z][\w-]*", sel):
                    indice.setdefault(sel, {}).update(entradas)
    return indice


ETIQUETA = re.compile(r"<(cs-[\w-]+)\b([^>]*)>", re.S)
ATRIBUTO = re.compile(r"(?<![\[\(\*#\w-])([a-zA-Z][\w-]*)=\"([^\"{}]*)\"")
IMPORTA_TIPOS = re.compile(r"import\s+(type\s+)?\{([^}]*)\}\s+from\s+['\"]" + re.escape(PAQUETE) + r"/[\w./-]+['\"]")
# Literales que salen como valor: `return 'x'`, `? 'x'`, `: 'x'` (no `selector: 'x'`).
VALOR_DEVUELTO = re.compile(r"(?:return\s+|\?\s*|(?<!selector)(?<!host)(?<!styleUrl):\s*)'([a-z0-9]+(?:-[a-z0-9]+)+)'")


def alias_de_literales(paquete: dict[str, str]) -> dict[str, set[str]]:
    alias = tipos_del_paquete(paquete)
    resueltos = {nombre: resolver(nombre, alias) for nombre in alias}
    return {n: v for n, v in resueltos.items() if v}


def revisar_piezas(codigo: dict[str, str], paquete: dict[str, str], informe: Informe, version: str) -> None:
    pj = json.loads(paquete.get("package/package.json", "{}"))
    exports = set(pj.get("exports", {}))
    usados: dict[str, list[str]] = {}
    for ruta, texto in codigo.items():
        for sub in re.findall(rf"['\"]{re.escape(PAQUETE)}/([\w./-]+)['\"]", texto):
            usados.setdefault(sub, []).append(ruta)
    for sub, rutas in sorted(usados.items()):
        if f"./{sub}" not in exports:
            informe.hallazgos.append(f"El subpath {PAQUETE}/{sub} no existe en la {version} ({rutas[0]})")

    indice = indice_componentes(paquete)
    tipos = alias_de_literales(paquete)
    conocidos = {lit for texto in paquete.values() for lit in re.findall(r"['\"`]([a-z0-9]+(?:-[a-z0-9]+)+)['\"`]", texto)}
    for ruta, texto in codigo.items():
        for etiqueta in ETIQUETA.finditer(texto):
            selector, attrs = etiqueta.group(1), etiqueta.group(2)
            permitidos = indice.get(selector, {})
            for nombre, valor in ATRIBUTO.findall(attrs):
                if nombre in permitidos and valor not in permitidos[nombre]:
                    informe.hallazgos.append(
                        f"<{selector} {nombre}=\"{valor}\"> no existe en la {version} "
                        f"(valores: {', '.join(sorted(permitidos[nombre]))}) — {ruta}"
                    )
        # Tipos de literales que el archivo importa del DS (IllustrationName, ButtonVariant...).
        importados = []
        for m in IMPORTA_TIPOS.finditer(texto):
            for nombre in re.split(r"\s*,\s*", m.group(2)):
                nombre = nombre.replace("type ", "").split(" as ")[0].strip()
                if nombre in tipos:
                    importados.append(nombre)
        if not importados:
            continue
        validos = set().union(*(tipos[n] for n in importados))
        for lit in sorted(set(VALOR_DEVUELTO.findall(texto))):
            # Si el literal aparece en algún lugar del paquete (un ícono, otra variante), no se avisa.
            if lit not in validos and lit not in conocidos:
                informe.avisos.append(
                    f"«{lit}» se usa como valor en un archivo que tipa con {', '.join(importados)} y no existe en la {version} — {ruta}"
                )


# ------------------------------------------------------------------- revisión


def revisar(repo: str, ref: str | None = None, parejas: list[str] | None = None, registro: bool = True,
            piezas: bool = True, cache: str | None = None, registro_json: dict | None = None,
            paquete: dict[str, str] | None = None) -> Informe:
    if ref is not None and git(repo, "rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}").returncode != 0:
        raise ErrorDeUso(f"La ref {ref} no existe en {repo}")
    nombre_ref = ref
    if ref is not None:  # por SHA: «rama:ruta» es ambiguo en Windows si la rama se llama como una unidad
        ref = git(repo, "rev-parse", f"{ref}^{{commit}}").stdout.strip()
    texto = leer(repo, ref, "package.json")
    if texto is None:
        raise ErrorDeUso(f"No hay package.json en {repo}{' @ ' + nombre_ref if nombre_ref else ''}")
    version = version_declarada(json.loads(texto))
    if not version:
        raise ErrorDeUso(f"{repo} no declara {PAQUETE}")
    informe = Informe(repo=repo, ref=nombre_ref, version=version, objetivo=version)

    if not EXACTA.match(version):
        informe.hallazgos.append(f"{PAQUETE} no tiene versión exacta: «{version}». El DS es singleton entre Shell y micro UI.")
    lock_texto = leer(repo, ref, "package-lock.json")
    en_lock = version_lock(json.loads(lock_texto)) if lock_texto else None
    if en_lock and EXACTA.match(version) and en_lock != version:
        informe.hallazgos.append(f"package-lock.json resuelve {en_lock}, pero package.json fija {version}: falta `npm install`.")

    for pareja in parejas or []:
        ruta, pref = separar_pareja(pareja)
        otro = leer(ruta, pref, "package.json")
        if otro is None:
            informe.hallazgos.append(f"No se pudo leer package.json de la pareja {pareja}")
            continue
        v2 = version_declarada(json.loads(otro))
        if v2 != version:
            informe.hallazgos.append(f"La pareja {pareja} fija {v2}; este repo fija {version}. Deben ser iguales.")
        else:
            informe.notas.append(f"Pareja {pareja}: misma versión ({v2}).")

    if registro and EXACTA.match(version):
        try:
            datos = registro_json if registro_json is not None else consultar_registro(repo)
        except (RuntimeError, json.JSONDecodeError, OSError) as e:
            informe.notas.append(f"Registro no verificado: {e}")
            datos = None
        if datos is not None:
            versiones = datos.get("versions", [])
            etiquetas = datos.get("dist-tags", {})
            if version not in versiones:
                informe.hallazgos.append(f"La {version} no está publicada en el registro (latest: {etiquetas.get('latest')}).")
            if es_prerelease(version):
                superior = estable_superior(version, versiones)
                if superior:
                    informe.objetivo = superior
                    informe.hallazgos.append(
                        f"{version} es una prerelease y ya está publicada la estable {superior} "
                        f"(latest: {etiquetas.get('latest')}). Fijar `npm install {PAQUETE}@{superior} --save-exact`."
                    )
    elif not registro:
        informe.notas.append("Registro no consultado (--sin-registro).")

    if piezas and EXACTA.match(informe.objetivo):
        try:
            contenido = paquete if paquete is not None else descargar_paquete(
                repo, informe.objetivo, cache or os.path.join(tempfile.gettempdir(), "revisar-ds-cache"))
            revisar_piezas(fuentes(repo, ref), contenido, informe, informe.objetivo)
        except Exception as e:  # red, token o tarball: se declara, no se inventa
            informe.notas.append(f"Piezas no verificadas contra la {informe.objetivo}: {type(e).__name__}: {str(e)[:160]}")
    return informe


def formatear(i: Informe) -> str:
    lineas = [
        f"Revisión del DS ({PAQUETE})",
        f"Repositorio: {i.repo}",
        f"Ref: {i.ref or 'archivos en disco'}",
        f"Versión fijada: {i.version}" + (f" · se revisa contra la {i.objetivo}" if i.objetivo != i.version else ""),
        "",
    ]
    if i.hallazgos:
        lineas.append(f"HALLAZGOS ({len(i.hallazgos)}):")
        lineas += [f"  - {h}" for h in i.hallazgos]
    else:
        lineas.append("Sin hallazgos.")
    if i.avisos:
        lineas.append("")
        lineas.append(f"AVISOS ({len(i.avisos)}): revisar; lo dinámico solo lo confirma compilar con `npm ci` en un worktree limpio")
        lineas += [f"  - {a}" for a in i.avisos]
    if i.notas:
        lineas.append("")
        lineas += i.notas
    lineas += ["", "Resultado: " + ("HAY HALLAZGOS (código 1)" if i.codigo else "sin hallazgos (código 0)")]
    return "\n".join(lineas)


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description="Revisa la versión del DS que fija un producto.")
    p.add_argument("repo")
    p.add_argument("--ref")
    p.add_argument("--pareja", action="append", default=[], help="otro repo de la pareja: ruta o ruta@ref")
    p.add_argument("--sin-registro", action="store_true")
    p.add_argument("--sin-piezas", action="store_true")
    p.add_argument("--cache", help="carpeta donde guardar los paquetes descargados")
    p.add_argument("--registro-json", help="archivo con la respuesta de npm view (sin red; para pruebas)")
    a = p.parse_args(argv)
    try:
        datos = None
        if a.registro_json:
            with open(a.registro_json, encoding="utf-8") as f:
                datos = json.load(f)
        informe = revisar(a.repo, a.ref, a.pareja, not a.sin_registro, not a.sin_piezas, a.cache, datos)
    except ErrorDeUso as e:
        print(f"Error: {e}", file=sys.stderr)
        return 2
    print(formatear(informe))
    return informe.codigo


if __name__ == "__main__":
    sys.exit(main())
