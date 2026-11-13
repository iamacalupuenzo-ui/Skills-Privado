#!/usr/bin/env python3
"""Audita la consistencia y trazabilidad de los artefactos de diseño UX/UI de una knowledge-base.

Uso:
    python audit_ux.py <knowledge-base-dir> [--json] [--exigir-uxs [--paquetes DSP-005,DSP-006 | --desde-rama origin/develop]]

Comprueba, de forma determinista, lo que no requiere juicio:
  - UXS (control de cierre de paquete): un paquete DSP-NNN con UXR, flujos o pantallas (etiqueta dsp-NNN en el
    frontmatter) debe tener una UXS que lo indexe. Sin --exigir-uxs, la falta es un aviso (PAQUETE_SIN_UXS). Con
    --exigir-uxs es un error si el paquete ya tiene pantallas especificadas; --paquetes o --desde-rama limitan el
    control a los paquetes pedidos o a los que toca la rama actual frente a una base. UXS_NO_INDEXA avisa de los
    artefactos del paquete que ninguna UXS menciona.
  - UXR: frontmatter, historias HU-* referenciadas que existen, UXR sin flujo.
  - FLW: pantallas SCR-* declaradas y coincidencia FLW <-> SCR en ambos sentidos.
  - SCR: campos obligatorios (flow, requirements, required_states, a11y_requirements),
    FLW existente, sin referencias externas (project_ref/artifact_ref) en el SCR.
  - DTM: una entrada por SCR; exploration_design/governed_design y divergencia sin resolver.
  - ARP: SCR sin informe de accesibilidad.
  - Enlaces markdown rotos y 'verified' fabricado.
Lo que requiere juicio (ver references/quality-criteria.md) lo evalúa el orquestador.
El preflight y el gate de ux-development-handoff/validators/cli.py son complementarios.

Código de salida: 0 sin errores, 1 con errores, 2 uso incorrecto.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    print("Requiere PyYAML: pip install pyyaml")
    sys.exit(2)

LINK = re.compile(r"\]\(([^)#\s]+\.md)(?:#[^)]*)?\)")
SCR_ID = re.compile(r"\bSCR-\d+(?:-\d+)?\b")
DSP_TAG = re.compile(r"\bdsp-(\d{3})\b", re.I)
# «SCR-016 a SCR-022», «UXR-026 a UXR-035» y «SCR-051-054» (archivo que agrupa varias pantallas).
RANGO = re.compile(r"\b(UXR|FLW|SCR)-(\d+)\s*(?:a|al|–|—)\s*(?:(?:UXR|FLW|SCR)-)?(\d+)\b")
ID_UXS = re.compile(r"\b(UXR|FLW|SCR)-(\d+)(?:-(\d+))?\b")
EXTERNAL_REFS = ("project_ref", "artifact_ref", "node_ref", "file_ref")


def read(path):
    return path.read_text(encoding="utf-8")


def frontmatter(path):
    text = read(path)
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n", text, re.S)
    if not m:
        return None
    try:
        data = yaml.safe_load(m.group(1))
    except yaml.YAMLError:
        return None
    return data if isinstance(data, dict) else None


def listify(value):
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def broken_links(path):
    out = []
    text = re.sub(r"```.*?```", "", read(path), flags=re.S)
    for target in LINK.findall(text):
        if target.startswith(("http", "/")):
            continue
        if not (path.parent / target).resolve().exists():
            out.append(target)
    return out


def md_files(d, pattern="*.md"):
    return sorted(d.glob(pattern)) if d.exists() else []


def load_screens(design):
    """Devuelve {scr_id: (archivo, dict)} de todos los SCR declarados, un archivo puede declarar varios."""
    screens, errors = {}, []
    for p in md_files(design / "screens"):
        fm = frontmatter(p)
        if fm is None:
            errors.append(f"{p.name}: sin frontmatter OKF legible")
            continue
        if re.search(r"^verified:", read(p), re.M):
            errors.append(f"{p.name}: tiene 'verified' (solo un flujo humano debe asignarlo)")
        for s in listify(fm.get("screens")):
            if isinstance(s, dict) and s.get("id"):
                screens[s["id"]] = (p.name, s)
    return screens, errors


def paquetes_de(fm):
    """Paquetes DSP-NNN que declara el frontmatter con la etiqueta dsp-NNN."""
    if not fm:
        return set()
    return {f"DSP-{n}" for tag in listify(fm.get("tags")) for n in DSP_TAG.findall(str(tag))}


def ids_mencionados(texto):
    """IDs UXR/FLW/SCR que un texto menciona, con rangos («SCR-016 a SCR-022», «SCR-051-054») expandidos."""
    ids = set()
    for tipo, a, b in RANGO.findall(texto):
        for n in range(int(a), int(b) + 1):
            ids.add(f"{tipo}-{n:0{len(a)}d}")
    for tipo, a, b in ID_UXS.findall(texto):
        ids.add(f"{tipo}-{a}")
        if b and int(b) >= int(a):
            for n in range(int(a), int(b) + 1):
                ids.add(f"{tipo}-{n:0{len(a)}d}")
    return ids


def inventario_por_paquete(design):
    """{paquete: {"UXR": {ids}, "FLW": {ids}, "SCR": {ids}}} según la etiqueta dsp-NNN de cada artefacto."""
    inv, sin_paquete = {}, {"UXR": [], "FLW": [], "SCR": []}

    def add(paquete, tipo, ident):
        inv.setdefault(paquete, {"UXR": set(), "FLW": set(), "SCR": set()})[tipo].add(ident)

    for p in md_files(design / "ux-requirements", "UXR-*.md"):
        uid = "-".join(p.name.split("-")[:2])
        pks = paquetes_de(frontmatter(p))
        for pk in pks:
            add(pk, "UXR", uid)
        if not pks:
            sin_paquete["UXR"].append(uid)
    for p in md_files(design / "user-flows", "FLW-*.md"):
        fm = frontmatter(p)
        fid = str((fm or {}).get("id") or "-".join(p.name.split("-")[:2]))
        pks = paquetes_de(fm)
        for pk in pks:
            add(pk, "FLW", fid)
        if not pks:
            sin_paquete["FLW"].append(fid)
    for p in md_files(design / "screens", "SCR-*.md"):
        fm = frontmatter(p)
        pks = paquetes_de(fm)
        ids = [str(s["id"]) for s in listify((fm or {}).get("screens")) if isinstance(s, dict) and s.get("id")]
        for pk in pks:
            for sid in ids:
                add(pk, "SCR", sid)
        if not pks:
            sin_paquete["SCR"].extend(ids)
    return inv, sin_paquete


def uxs_existentes(design):
    """{uxs_id: {"archivo", "paquetes" (declarados), "ids" (artefactos que menciona)}}."""
    uxs = {}
    for p in md_files(design / "specs", "UXS-*.md"):
        fm = frontmatter(p) or {}
        texto = read(p)
        declarados = paquetes_de(fm)
        for src in listify(fm.get("sources")):
            if isinstance(src, dict) and re.fullmatch(r"DSP-\d{3}", str(src.get("id", ""))):
                declarados.add(str(src["id"]))
        uxs[str(fm.get("id") or "-".join(p.name.split("-")[:2]))] = {"archivo": p.name, "paquetes": declarados, "ids": ids_mencionados(texto)}
    return uxs


def paquetes_tocados(kb, base):
    """Paquetes cuyos UXR, flujos, pantallas o decisiones cambia la rama actual frente a `base`. None si git no responde."""
    try:
        out = subprocess.run(
            ["git", "-C", str(kb), "diff", "--name-only", f"{base}...HEAD"],
            capture_output=True, text=True, encoding="utf-8", timeout=30, check=True,
        ).stdout
    except (OSError, subprocess.SubprocessError):
        return None
    tocados = set()
    for rel in out.splitlines():
        if rel.startswith("design/") and rel.endswith(".md") and any(s in rel for s in ("/ux-requirements/", "/user-flows/", "/screens/", "/decisiones/")):
            f = kb / rel
            if f.exists():
                tocados |= paquetes_de(frontmatter(f))
    return tocados


def controlar_uxs(design, inventario, exigir, paquetes, avisos_extra):
    """Control de cierre de paquete: todo paquete con diseño debe tener una UXS que lo indexe.

    Devuelve (controles, resumen). Cada control: {"codigo", "paquete", "nivel" (error|aviso), "mensaje"}.
    """
    inv, sin_paquete = inventario
    uxs = uxs_existentes(design)
    controles, resumen = [], {}
    huerfanos = {t: v for t, v in sin_paquete.items() if v}
    if huerfanos:
        partes = ", ".join(f"{len(v)} {t}" for t, v in huerfanos.items())
        controles.append({"codigo": "ARTEFACTO_SIN_PAQUETE", "paquete": "", "nivel": "aviso",
                          "mensaje": f"{partes} no llevan la etiqueta dsp-NNN en su frontmatter: el control de UXS no los ve. "
                                     f"Etiquétalos con su paquete (p. ej. tags: [..., dsp-003]) para que cuenten"})
    for pk in sorted(inv):
        art = inv[pk]
        todos = art["UXR"] | art["FLW"] | art["SCR"]
        cubren = {u: d for u, d in uxs.items() if pk in d["paquetes"] or (d["ids"] & todos)}
        indexados = set().union(*[d["ids"] for d in cubren.values()]) if cubren else set()
        no_indexados = sorted(todos - indexados) if cubren else []
        resumen[pk] = {"uxs": sorted(cubren), "sin_uxs": not cubren, "no_indexados": no_indexados,
                       "artefactos": {k: len(v) for k, v in art.items()}}
        en_alcance = paquetes is None or pk in paquetes
        if not cubren:
            partes = ", ".join(f"{len(art[t])} {t}" for t in ("UXR", "FLW", "SCR") if art[t])
            msg = (f"{pk}: tiene {partes} y ninguna UXS lo indexa. Falta consolidarlo: la UXS (con el veredicto por consumidor) "
                   f"es el paquete que lee Claude Design, QA y Desarrollo. Constrúyela con el skill ux-context-builder")
            nivel = "error" if (exigir and en_alcance and art["SCR"]) else "aviso"
            controles.append({"codigo": "PAQUETE_SIN_UXS", "paquete": pk, "nivel": nivel, "mensaje": msg})
        elif no_indexados and en_alcance:
            muestra = ", ".join(no_indexados[:8]) + ("…" if len(no_indexados) > 8 else "")
            controles.append({"codigo": "UXS_NO_INDEXA", "paquete": pk, "nivel": "aviso",
                              "mensaje": f"{pk}: {', '.join(sorted(cubren))} no menciona {len(no_indexados)} artefacto(s) del paquete ({muestra}); regenera la UXS"})
    controles.extend(avisos_extra)
    return controles, resumen


def audit(kb, exigir_uxs=False, paquetes=None, avisos_uxs=None):
    design = kb / "design"
    errors, warnings = [], []

    def err(msg):
        errors.append(msg)

    def warn(msg):
        warnings.append(msg)

    stories = {"-".join(p.name.split("-")[:3]) for p in md_files(kb / "requirements" / "context-packs" / "user-stories", "HU-*.md")}
    # Historias candidatas: se definen dentro del catálogo (HUC-*), como encabezado o fila de backlog, sin archivo propio.
    for catalog in md_files(kb / "requirements" / "context-packs" / "user-stories", "HUC-*.md"):
        stories |= set(re.findall(r"(?m)^(?:#{2,6}\s*|\|\s*\[?)(HU-\d+-\d+)\b", read(catalog)))
    screens, screen_errors = load_screens(design)
    errors.extend(screen_errors)

    # --- FLW
    flows = {}
    for p in md_files(design / "user-flows", "FLW-*.md"):
        fm = frontmatter(p)
        if fm is None:
            err(f"{p.name}: sin frontmatter OKF legible")
            continue
        fid = fm.get("id") or p.name.split("-")[0] + "-" + p.name.split("-")[1]
        flows[fid] = {"file": p.name, "screens": listify(fm.get("screens")), "reqs": listify(fm.get("requirements"))}
        if not flows[fid]["screens"]:
            warn(f"{p.name}: screens vacío (¿hay pregunta abierta que lo justifique?)")
        for bl in broken_links(p):
            err(f"{p.name}: enlace roto: {bl}")

    # --- UXR
    uxr_ids, flow_reqs = set(), set()
    for f in flows.values():
        flow_reqs |= {str(r) for r in f["reqs"]}
    for p in md_files(design / "ux-requirements", "UXR-*.md"):
        uid = "-".join(p.name.split("-")[:2])
        uxr_ids.add(uid)
        fm = frontmatter(p)
        if fm is None:
            err(f"{p.name}: sin frontmatter OKF legible")
            continue
        for bl in broken_links(p):
            err(f"{p.name}: enlace roto: {bl}")
        text = read(p)
        for us in sorted(set(re.findall(r"\bHU-\d+-\d+\b", text))):
            if stories and us not in stories:
                err(f"{p.name}: referencia {us} que no existe en requirements/context-packs/user-stories (ni como archivo HU-* ni en un catálogo HUC-*)")
        if uid != "UXR-000" and uid not in flow_reqs:
            warn(f"{p.name}: ningún FLW lo lista en requirements (¿falta flujo?)")

    # --- FLW <-> SCR
    for fid, f in flows.items():
        for sid in f["screens"]:
            if sid not in screens:
                err(f"{f['file']}: lista {sid} pero no existe en design/screens")
            elif screens[sid][1].get("flow") != fid:
                err(f"{f['file']}: lista {sid} pero su flow es {screens[sid][1].get('flow')}")
    for sid, (fname, s) in screens.items():
        flow = s.get("flow")
        if not flow:
            err(f"{fname}: {sid} sin flow")
        elif flow not in flows:
            err(f"{fname}: {sid} apunta a {flow}, que no existe")
        elif sid not in [str(x) for x in flows[flow]["screens"]]:
            err(f"{fname}: {sid} declara flow {flow}, pero el FLW no lo lista en screens")
        for field in ("requirements", "required_states", "a11y_requirements"):
            if not s.get(field):
                err(f"{fname}: {sid} sin {field}")
        if not s.get("responsive"):
            warn(f"{fname}: {sid} sin responsive")
        leaked = [k for k in EXTERNAL_REFS if k in s]
        if leaked:
            err(f"{fname}: {sid} guarda referencias externas {leaked} (viven solo en el DTM)")

    # --- DTM
    dtm_screens, divergences = {}, []
    for p in md_files(design / "traceability", "DTM-*.md"):
        fm = frontmatter(p)
        if fm is None:
            err(f"{p.name}: sin frontmatter OKF legible")
            continue
        for e in listify(fm.get("traceability")):
            if isinstance(e, dict) and e.get("screen"):
                dtm_screens[e["screen"]] = e
                sf = e.get("stitch_figma") or {}
                if isinstance(sf, dict) and sf.get("divergence") == "open":
                    divergences.append(e["screen"])
                gd = e.get("governed_design") or {}
                if isinstance(gd, dict) and gd.get("status") == "approved" and not gd.get("approved_by"):
                    err(f"{p.name}: {e['screen']} governed_design approved sin approved_by")
    for sid in screens:
        if sid not in dtm_screens:
            warn(f"{sid}: sin entrada en ningún DTM (aún sin exploración ni diseño gobernado)")
    for sid in dtm_screens:
        if sid not in screens:
            err(f"DTM: {sid} no existe en design/screens")
    for sid in divergences:
        err(f"DTM: {sid} con divergencia Stitch<->Figma abierta (STITCH_FIGMA_DIVERGENCE)")

    # --- ARP (accesibilidad)
    arp_text = " ".join(read(p) for p in md_files(design / "handoff", "ARP-*.md")) + " ".join(
        read(p) for p in md_files(design / "screens", "ARP-*.md")
    )
    arp_screens = set(SCR_ID.findall(arp_text))
    for sid, e in dtm_screens.items():
        if (e.get("governed_design") or e.get("exploration_design")) and sid not in arp_screens:
            warn(f"{sid}: tiene diseño pero no se halla Accessibility Report (ARP)")

    # --- UXS: control de cierre de paquete
    controles, resumen_uxs = controlar_uxs(design, inventario_por_paquete(design), exigir_uxs, paquetes, avisos_uxs or [])
    for c in controles:
        (errors if c["nivel"] == "error" else warnings).append(f"[{c['codigo']}] {c['mensaje']}")

    return {
        "controles": controles,
        "uxs_por_paquete": resumen_uxs,
        "inventory": {
            "ux_requirements": len(uxr_ids),
            "user_flows": len(flows),
            "screens": len(screens),
            "components": len(md_files(design / "components", "CMP-*.md")),
            "tokens": len(md_files(design / "tokens")),
            "explorations": len(md_files(design / "explorations")) + len(md_files(design / "generations")),
            "design_projects": len(md_files(design / "projects")),
            "traceability_maps": len(md_files(design / "traceability")),
            "handoffs": len(md_files(design / "handoff", "HOF-*.md")),
            "specs": len(md_files(design / "specs")),
        },
        "errors": errors,
        "warnings": warnings,
    }


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("kb", nargs="?")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--exigir-uxs", action="store_true")
    parser.add_argument("--paquetes")
    parser.add_argument("--desde-rama")
    parser.add_argument("-h", "--help", action="store_true")
    try:
        opts = parser.parse_args()
    except SystemExit:
        print(__doc__)
        return 2
    if opts.help or not opts.kb:
        print(__doc__)
        return 2
    kb = Path(opts.kb)
    if not (kb / "design").is_dir():
        print(f"No existe {kb / 'design'}")
        return 2
    paquetes, avisos_uxs = None, []
    if opts.paquetes:
        paquetes = {p.strip().upper() for p in opts.paquetes.split(",") if p.strip()}
    if opts.desde_rama:
        tocados = paquetes_tocados(kb, opts.desde_rama)
        if tocados is None:
            avisos_uxs.append({"codigo": "SIN_BASE", "paquete": "", "nivel": "aviso",
                               "mensaje": f"No pude comparar con {opts.desde_rama}: no se limita el control a los paquetes de la rama"})
        else:
            paquetes = (paquetes or set()) | tocados if paquetes else tocados
    report = audit(kb, exigir_uxs=opts.exigir_uxs, paquetes=paquetes, avisos_uxs=avisos_uxs)
    if opts.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print("Inventario:", ", ".join(f"{k}={v}" for k, v in report["inventory"].items()))
        for e in report["errors"]:
            print(f"[ERR] {e}")
        for w in report["warnings"]:
            print(f"[aviso] {w}")
        print(f"Resumen: {len(report['errors'])} errores, {len(report['warnings'])} avisos")
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
