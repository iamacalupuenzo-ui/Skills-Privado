#!/usr/bin/env python3
"""Compare declared KB/code projections. Read only, Python standard library.

Exit 0: declared coverage equal; 1: differences; 2: invalid/incomplete evidence.
This is a static contract checker, not a semantic or browser approval engine.
"""
from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import asdict, dataclass
from hashlib import sha256
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import unicodedata


DIMENSIONS = {"components", "fields", "navigation", "texts"}
ARTIFACT_TYPES = {"SCR", "FLW", "UXR", "UXS", "DEC"}


class EvidenceError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise EvidenceError(message)


def git(root, *args):
    result = subprocess.run(["git", "-C", str(root), *args], capture_output=True)
    if result.returncode:
        raise EvidenceError(f"git {args[0]}: operación fallida en {root}")
    return result.stdout


def normalize(value):
    return " ".join(unicodedata.normalize("NFC", value).split()).casefold()


def safe_relative(value):
    require(isinstance(value, str) and value, "Ruta vacía")
    path = PurePosixPath(value)
    require(not path.is_absolute() and not path.drive and ".." not in path.parts
            and "\\" not in value and ":" not in value, f"Ruta no relativa: {value}")
    return path.as_posix()


def mask_comments(text):
    """Mask JS comments without removing strings; keep exact line offsets."""
    chars = list(text)
    index, quote = 0, None
    while index < len(text):
        char = text[index]
        if quote:
            if char == "\\":
                index += 2
                continue
            if char == quote:
                quote = None
        elif char in "'\"`":
            quote = char
        elif text.startswith("//", index) or text.startswith("/*", index):
            end = text.find("\n", index) if text[index + 1] == "/" else text.find("*/", index + 2)
            end = len(text) if end < 0 else end + (0 if text[index + 1] == "/" else 2)
            for offset in range(index, end):
                if chars[offset] not in "\r\n":
                    chars[offset] = " "
            index = end
            continue
        index += 1
    return "".join(chars)


@dataclass
class Location:
    source: str
    file: str
    line: int
    ref: str
    excerpt: str


@dataclass
class Item:
    value: str
    location: Location


class Source:
    def __init__(self, name, spec, base):
        self.name = name
        self.root = (base / spec["root"]).resolve()
        self.role = spec["role"]
        require(self.role in {"kb", "code"}, f"Rol inválido: {name}")
        require(self.root.is_dir(), f"Fuente inexistente: {name}")
        requested_ref = spec["ref"]
        require(isinstance(requested_ref, str) and requested_ref and not requested_ref.startswith("-"),
                f"Ref inválida: {name}")
        require(not (self.role == "kb" and requested_ref == "WORKTREE"),
                "La KB exige un commit Git; no se lee un worktree sucio")
        self.ref = ("WORKTREE@" if requested_ref == "WORKTREE" else "") + git(
            self.root, "rev-parse", "--verify", ("HEAD" if requested_ref == "WORKTREE" else requested_ref) + "^{commit}"
        ).decode().strip()
        self.worktree = requested_ref == "WORKTREE"
        self.files = {}

    def read(self, filename):
        filename = safe_relative(filename)
        if filename not in self.files:
            if self.worktree:
                path = (self.root / filename).resolve()
                require(path.is_relative_to(self.root), f"Archivo fuera de la fuente: {filename}")
                raw = path.read_bytes()
            else:
                # Reject symlinks/submodules; never interpret repository entries as paths.
                entry = git(self.root, "ls-tree", self.ref, "--", filename).decode()
                require(entry.startswith(("100644 ", "100755 ")), f"No es archivo regular: {filename}")
                raw = git(self.root, "show", f"{self.ref}:{filename}")
            text = raw.decode("utf-8-sig").replace("\r\n", "\n")
            require("\x00" not in text, f"NUL en {filename}")
            self.files[filename] = (text, sha256(raw).hexdigest())
        return self.files[filename][0]

    def location(self, filename, text, offset):
        line = text.count("\n", 0, offset) + 1
        lines = text.splitlines()
        return Location(self.name, filename, line, self.ref,
                        lines[line - 1].strip()[:240] if lines else "")


def extract(selector, sources):
    source = sources[selector["source"]]
    filename = safe_relative(selector["file"])
    original = source.read(filename)
    view, start = original, 0
    fmt = selector.get("format", "text")
    require(fmt in {"text", "typescript", "angular-template"}, "Formato desconocido")
    if fmt in {"typescript", "angular-template"}:
        view = mask_comments(view)
    if fmt == "angular-template":
        if not filename.endswith(".html"):
            templates = list(re.finditer(r"\btemplate\s*:\s*`(?P<body>(?:\\.|[^`])*)`", view))
            require(len(templates) == 1, f"Se esperaba un template Angular literal: {filename}")
            start = templates[0].start("body")
            view = templates[0].group("body")
        view = re.sub(r"<!--[\s\S]*?-->", lambda m: re.sub(r"[^\r\n]", " ", m[0]), view)
    # Mandatory, unique scope: zero matches must never mean successful parity.
    regions = list(re.finditer(selector["region"], view, re.MULTILINE))
    require(len(regions) == 1 and "body" in regions[0].groupdict(),
            f"Región no única o sin grupo body: {filename} ({len(regions)})")
    region = regions[0]
    start += region.start("body")
    view = region.group("body")
    require(view is not None, f"Región body vacía: {filename}")
    pattern = re.compile(selector["pattern"], re.MULTILINE)
    require("value" in pattern.groupindex, f"Falta grupo value: {filename}")
    aliases = {normalize(k): normalize(v) for k, v in selector.get("aliases", {}).items()}
    items = []
    for match in pattern.finditer(view):
        raw = match.group("value")
        require(raw is not None and normalize(raw), f"Captura vacía: {filename}")
        value = normalize(raw)
        items.append(Item(aliases.get(value, value), source.location(filename, original,
                                                                     start + match.start("value"))))
    require(items or selector.get("allow_empty") is True, f"Selector sin resultados: {filename}")
    anchor = source.location(filename, original, start)
    return items, anchor


def validate_config(config):
    require(isinstance(config, dict), "La configuración debe ser un objeto JSON")
    require(config.get("schema_version") == 1, "schema_version debe ser 1")
    require(isinstance(config.get("package"), str) and config["package"], "Falta package")
    require(isinstance(config.get("sources"), dict) and config["sources"], "Faltan sources")
    require(isinstance(config.get("screens"), list) and config["screens"], "Faltan screens")
    require(len(set(config["screens"])) == len(config["screens"]), "Pantallas duplicadas")
    checks = config.get("checks")
    require(isinstance(checks, list) and checks, "No hay comprobaciones")
    ids, coverage, artifact_types = set(), set(), set()
    for check in checks:
        require(isinstance(check.get("id"), str) and check["id"] not in ids, "ID repetido o ausente")
        ids.add(check["id"])
        require(check.get("screen") in config["screens"], "Pantalla no declarada")
        require(check.get("dimension") in DIMENSIONS, "Dimensión desconocida")
        coverage.add((check["screen"], check["dimension"]))
        require(check.get("comparison", "set") in {"set", "sequence", "multiset"}, "Comparación desconocida")
        for side in ("kb", "code"):
            require(isinstance(check.get(side), list) and check[side], f"Lado vacío: {check['id']}/{side}")
            for selector in check[side]:
                require(selector.get("source") in config["sources"], "Fuente no declarada")
                require(config["sources"][selector["source"]].get("role") == side,
                        f"Rol del selector incorrecto: {check['id']}/{side}")
                for key in ("file", "region", "pattern"):
                    require(isinstance(selector.get(key), str) and selector[key], f"Falta {key}")
                if side == "kb":
                    require(selector.get("artifact_type") in ARTIFACT_TYPES, "Tipo de artefacto KB inválido")
                    require(re.search(r"\b" + selector["artifact_type"] + r"-\d+", selector["file"]),
                            "El tipo de artefacto no corresponde al archivo")
                    artifact_types.add(selector["artifact_type"])
    missing = {(screen, dimension) for screen in config["screens"] for dimension in DIMENSIONS} - coverage
    require(not missing, f"Cobertura incompleta de pantallas/dimensiones: {sorted(missing)}")
    require(artifact_types == ARTIFACT_TYPES, f"Faltan artefactos KB comparados: {sorted(ARTIFACT_TYPES - artifact_types)}")


def compare(config, sources):
    differences = []
    for check in config["checks"]:
        sides, anchors = {}, {}
        for side in ("kb", "code"):
            sides[side], anchors[side] = [], []
            for selector in check[side]:
                items, anchor = extract(selector, sources)
                sides[side].extend(items)
                anchors[side].append(anchor)
        mode = check.get("comparison", "set")
        values = {side: [item.value for item in items] for side, items in sides.items()}
        equal = (values["kb"] == values["code"] if mode == "sequence" else
                 Counter(values["kb"]) == Counter(values["code"]) if mode == "multiset" else
                 set(values["kb"]) == set(values["code"]))
        if equal:
            continue
        missing = Counter(values["kb"]) - Counter(values["code"])
        extra = Counter(values["code"]) - Counter(values["kb"])
        if mode == "set":
            missing = Counter({v: 1 for v in set(values["kb"]) - set(values["code"])})
            extra = Counter({v: 1 for v in set(values["code"]) - set(values["kb"])})
        differences.append({"check": check["id"], "screen": check["screen"],
                            "dimension": check["dimension"], "comparison": mode,
                            "missing_in_code": dict(missing), "extra_in_code": dict(extra),
                            "kb_values": values["kb"], "code_values": values["code"],
                            "kb": [asdict(x.location) for x in sides["kb"]] or [asdict(anchors["kb"][0])],
                            "code": [asdict(x.location) for x in sides["code"]] or [asdict(anchors["code"][0])]})
    return differences


def overrides(entries):
    result = {}
    for entry in entries:
        name, sep, value = entry.partition("=")
        require(sep and name and value, "Override debe ser fuente=valor")
        require(name not in result, f"Override duplicado: {name}")
        result[name] = value
    return result


def run(config_path, roots=None, refs=None):
    path = Path(config_path).resolve()
    # The contract itself must travel in Git with the skill/package, not be an ad-hoc allowlist.
    git(path.parent, "ls-files", "--error-unmatch", "--", path.name)
    raw = path.read_bytes()
    config = json.loads(raw.decode("utf-8-sig"))
    validate_config(config)
    for key, entries in (("root", roots or {}), ("ref", refs or {})):
        for name, value in entries.items():
            require(name in config["sources"], f"Fuente de override desconocida: {name}")
            config["sources"][name][key] = value
    sources = {name: Source(name, spec, path.parent) for name, spec in config["sources"].items()}
    differences = compare(config, sources)
    report = {"status": "DIVERGENT" if differences else "MATCH", "package": config["package"],
              "config_sha256": sha256(raw).hexdigest(), "checks": len(config["checks"]),
              "screens": config["screens"], "differences": differences,
              "coverage": "Solo proyecciones declaradas; no certifica semántica, render ni aprobación humana",
              "sources": {name: {"root": str(src.root), "ref": src.ref,
                                  "files": {file: digest for file, (_, digest) in src.files.items()}}
                          for name, src in sources.items()}}
    # Detect edits while scanning WORKTREE sources. A report describes exactly the bytes read.
    for src in sources.values():
        if src.worktree:
            for filename, (_, digest) in src.files.items():
                require(sha256((src.root / filename).read_bytes()).hexdigest() == digest,
                        f"Fuente cambió durante la comprobación: {src.name}/{filename}")
    return report


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True)
    parser.add_argument("--root", action="append", default=[], help="fuente=ruta; repetible")
    parser.add_argument("--ref", action="append", default=[], help="fuente=commit/ref o WORKTREE (solo código)")
    parser.add_argument("--json", action="store_true", help="JSON en stdout, sin crear archivos")
    args = parser.parse_args(argv)
    try:
        report = run(args.config, overrides(args.root), overrides(args.ref))
    except (EvidenceError, OSError, UnicodeError, json.JSONDecodeError, re.error, KeyError, TypeError) as error:
        print(json.dumps({"status": "BLOCKED", "error": str(error)}, ensure_ascii=False))
        return 2
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f"{report['status']}: {report['package']}; {report['checks']} comprobaciones; "
              f"{len(report['differences'])} divergencias")
        for difference in report["differences"]:
            print(f"{difference['screen']}/{difference['check']}: "
                  f"KB={difference['kb_values']} CÓDIGO={difference['code_values']}")
            for side in ("kb", "code"):
                for loc in difference[side]:
                    print(f"  {side} {loc['source']}@{loc['ref']}:{loc['file']}:{loc['line']} {loc['excerpt']}")
        print(report["coverage"])
    return 1 if report["differences"] else 0


if __name__ == "__main__":
    sys.exit(main())
