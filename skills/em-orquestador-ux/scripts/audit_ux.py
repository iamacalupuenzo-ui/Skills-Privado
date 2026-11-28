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


def controlar_iteracion(kb, cerrar=False, paquetes=None, conciliacion=None, compuerta=None):
    """Comprueba evidencia declarada; no asigna aprobaciones ni valida en nombre de Enzo."""
    controles = []

    def add(codigo, mensaje, bloqueo=False, paquete=""):
        controles.append({"codigo": codigo, "paquete": paquete,
                          "nivel": "error" if bloqueo else "aviso", "mensaje": mensaje})

    def existe(ruta):
        if not isinstance(ruta, str) or not ruta:
            return False
        p = (kb / ruta).resolve()
        return p.is_relative_to(kb.resolve()) and p.is_file()

    if conciliacion:
        try:
            lectura = json.loads(Path(conciliacion).read_text(encoding="utf-8"))
            for a in lectura.get("construccion", {}).get("advertencias", []):
                add("ARTEFACTO_BORRADOR_CON_CONSTRUCCION", f"{a.get('id')}: {a.get('mensaje')}")
            if lectura.get("cascada", {}).get("propuestas"):
                add("CASCADA_PENDIENTE", "Hay propuestas de actualización de estados dependientes sin resolver", cerrar or compuerta == "GC")
            if lectura.get("cascada", {}).get("avisos"):
                add("CASCADA_INCOMPLETA", "La cascada no alcanzó una conciliación verificable", cerrar or compuerta == "GC")
        except (OSError, ValueError, TypeError):
            pass
    modulo_notion = (Path(__file__).resolve().parent.parent / "notion").is_dir()
    if (cerrar or compuerta == "GC") and not conciliacion and not modulo_notion:
        add("CONCILIACION_NO_DISPONIBLE", "Esta copia no trae el módulo de Notion; la conciliación KB↔Notion la ejecuta el responsable de UX antes del cierre")
    elif cerrar or compuerta == "GC":
        try:
            r = json.loads(Path(conciliacion).read_text(encoding="utf-8")) if conciliacion else None
        except (OSError, ValueError, TypeError):
            r = None
        if not isinstance(r, dict) or r.get("soloLectura") is not True or r.get("completo") is not True:
            add("CONCILIACION_INCOMPLETA", "Falta una conciliación KB↔Notion completa con huellas de última carga", True)
        elif r.get("abiertas") != 0 or r.get("diferencias") != []:
            add("CONCILIACION_PENDIENTE", "Hay diferencias KB↔Notion abiertas; una persona debe resolverlas antes del cierre", True)
        else:
            try:
                commit = subprocess.run(["git", "-C", str(kb), "rev-parse", "HEAD"], check=True,
                                        capture_output=True, text=True, timeout=15).stdout.strip()
                sucio = subprocess.run(["git", "-C", str(kb), "status", "--porcelain"], check=True,
                                       capture_output=True, text=True, timeout=15).stdout.strip()
            except (OSError, subprocess.SubprocessError):
                commit, sucio = None, "sin revisión verificable"
            if not commit or r.get("kb", {}).get("commit") != commit or sucio:
                add("CONCILIACION_DESACTUALIZADA", "La conciliación no corresponde al HEAD limpio del KB; repítela sobre la revisión de cierre", True)

    def estado(s):
        return str(s).strip().lower().replace(" ", "_")

    def revisar(ident, p, fm, pantalla=False):
        if paquetes is not None and not (paquetes_de(fm) & paquetes):
            return
        st = estado(fm.get("status", "draft"))
        validado = st in ("validado", "validated")
        cerrado = validado or st in ("approved", "closed", "cerrado") or cerrar or compuerta in ("G3", "GR")
        investigacion = fm.get("research") or {}
        if pantalla:
            inv_dict = investigacion if isinstance(investigacion, dict) else {}
            # Regla de Enzo (2026-11-26): no toda pantalla lleva investigación o decisión nueva.
            # - investigation: no-aplica, con research.motivo, cuando la historia o una decisión vigente ya resuelve lo que se ve.
            # - decision_reused: true cuando la pantalla reutiliza una DEC vigente de otra pantalla (no tiene que citarla), con motivo.
            motivo = str(inv_dict.get("motivo") or inv_dict.get("reason") or "").strip()
            for campo, prefijo in (("investigation", "INV"), ("decision", "DEC")):
                ref = str(inv_dict.get(campo, "") or "")
                if ref.lower() in ("no-aplica", "no aplica", "n/a"):
                    if campo == "investigation" and len(motivo) >= 20:
                        continue
                    add("SCR_SIN_INV_DEC", f"{ident}: research.{campo} «no-aplica» exige research.motivo (al menos una frase)" if campo == "investigation"
                        else f"{ident}: research.decision no admite «no-aplica»; usa una DEC nueva o una reutilizada con decision_reused", cerrado)
                    continue
                if not re.fullmatch(rf"{prefijo}-\d+", ref):
                    candidatas = []
                else:
                    # Las DEC viven en decisions/ y las INV en design/: se busca en los dos.
                    candidatas = [f for base in ("design", "decisions") if (kb / base).is_dir() for f in (kb / base).rglob(f"{ref}*.md")]
                reutilizada = campo == "decision" and bool(inv_dict.get("decision_reused")) and candidatas
                if reutilizada:
                    if len(motivo) >= 20:
                        continue
                    add("SCR_SIN_INV_DEC", f"{ident}: decisión reutilizada {ref} sin research.motivo", cerrado)
                    continue
                # El documento debe citar la pantalla, no basta un ID de otro módulo.
                if not any(ident in read(f) for f in candidatas):
                    add("SCR_SIN_INV_DEC", f"{ident}: falta {prefijo} enlazado en research.{campo} que cite la pantalla", cerrado)
        it = fm.get("iteration") or {}
        if not isinstance(it, dict):
            add("ITERACION_INVALIDA", f"{ident}: iteration debe ser un objeto", True)
            it = {}
        if it.get("implementation_changed") is True:
            docs = it.get("documents") or {}
            faltan = [tipo for tipo in ("UXR", "FLW", "SCR", "DEC") if not isinstance(docs, dict) or not existe(docs.get(tipo))]
            if not existe(it.get("proposal")) or faltan or not existe(it.get("screenshot")) or not it.get("version"):
                add("ITERACION_SIN_PROPUESTA_CAPTURA", f"{ident}: cambió lo construido; exige propuesta, UXR/FLW/SCR/DEC, versión y captura existentes", True)
            if "enzo" not in str(it.get("approved_by", "")).lower() or not it.get("approved_at"):
                add("ITERACION_SIN_APROBACION", f"{ident}: falta aprobación de Enzo antes de escribir los cambios propuestos", True)
        if validado:
            val = fm.get("validation") or {}
            if not isinstance(val, dict):
                val = {}
            version = it.get("version")
            if ("enzo" not in str(val.get("by", "")).lower() or not val.get("date") or not val.get("browser")
                    or not existe(val.get("screenshot")) or not version or val.get("version") != version):
                add("VALIDADO_SIN_PRUEBA", f"{ident}: Validado exige prueba con Enzo en navegador y captura de la misma versión", True)
            a11y = val.get("accessibility") or {}
            if not isinstance(a11y, dict):
                a11y = {}
            report = a11y.get("report")
            reporte_fm = (frontmatter(kb / report) or {}) if existe(report) else {}
            revision = reporte_fm.get("a11y_review") or {}
            if not isinstance(revision, dict):
                revision = {}
            if (a11y.get("target") != "implemented" or a11y.get("status") != "pass" or not existe(report)
                    or not version or a11y.get("version") != version
                    or revision.get("target") != "implemented" or revision.get("result") != "pass"
                    or revision.get("screen") != ident or revision.get("version") != version
                    or (existe(report) and (ident not in read(kb / report) or str(version) not in read(kb / report)))):
                add("VALIDADO_SIN_A11Y_IMPLEMENTADA", f"{ident}: falta accesibilidad evaluada sobre lo implementado, con informe y versión coincidentes", True)
        elif st in ("en_construcción", "en_construccion", "in_construction") or compuerta == "G5":
            val = fm.get("validation") or {}
            a11y = val.get("accessibility") or {} if isinstance(val, dict) else {}
            if not isinstance(a11y, dict):
                a11y = {}
            if a11y.get("target") != "implemented" or not existe(a11y.get("report")):
                add("CONSTRUCCION_SIN_ARP", f"{ident}: crea y actualiza el ARP durante la construcción sobre micro UI, shell y DS implementados", compuerta == "G5")
            elif compuerta == "G5" and a11y.get("status") != "pass":
                add("A11Y_SIN_PASS", f"{ident}: el ARP implementado tiene hallazgos o no concluyó", True)

    design = kb / "design"
    for p in md_files(design / "screens", "SCR-*.md"):
        fm = frontmatter(p) or {}
        for s in listify(fm.get("screens")):
            if isinstance(s, dict) and s.get("id"):
                revisar(s["id"], p, {**fm, **s}, pantalla=True)
    for carpeta, patron in (("user-flows", "FLW-*.md"), ("explorations", "*.md")):
        for p in md_files(design / carpeta, patron):
            fm = frontmatter(p) or {}
            revisar(str(fm.get("id") or p.stem), p, fm)
            if carpeta == "explorations" and (compuerta == "G4" or str(fm.get("status")) in ("validated", "Validado")):
                capturas = listify(fm.get("captures"))
                if not capturas or not all(existe(c) for c in capturas):
                    add("EXPLORACION_SIN_CAPTURA", f"{p.name}: toda exploración, en cualquier herramienta, exige captures existentes", True)
    return controles


def controlar_compuerta(kb, compuerta):
    """Comprueba artefactos de entrada de cada transición; el juicio humano sigue explícito."""
    if not compuerta:
        return []
    d = kb / "design"
    carpetas = {"G1": ("ux-requirements", "UXR-*.md"), "G2": ("user-flows", "FLW-*.md"),
                "G3": ("screens", "SCR-*.md"), "GR": ("screens", "SCR-*.md"),
                "GU": ("specs", "UXS-*.md"), "G4": ("explorations", "*.md"), "G7": ("handoff", "HOF-*.md")}
    faltas = []
    if compuerta in carpetas and not md_files(d / carpetas[compuerta][0], carpetas[compuerta][1]):
        faltas.append(f"{compuerta}: falta el artefacto requerido en {carpetas[compuerta][0]}")
    if compuerta == "G0" and not (d / "MEMORY.md").is_file():
        faltas.append("G0: falta design/MEMORY.md con escenario, plan y registro de aprobación")
    if compuerta == "G0" and (d / "MEMORY.md").is_file():
        # Enzo, 2026-11-26: antes de diseñar, las tareas están mapeadas y la KB revisada.
        plan = (d / "MEMORY.md").read_text(encoding="utf-8")
        if not re.search(r"\b[A-Z]{3}-(UX|FRONT)\b", plan):
            faltas.append("G0: el plan de design/MEMORY.md no cita sus tareas (p. ej. IDV-UX · 02); mapéalas con em-gestion-tareas antes de diseñar")
        if not re.search(r"cambios-kb|Revisión de la KB", plan):
            faltas.append("G0: el plan no registra la revisión de cambios de la KB (scripts/cambios-kb.mjs) con su commit")
    if compuerta == "G1":
        for p in md_files(d / "ux-requirements", "UXR-*.md"):
            fm = frontmatter(p) or {}
            if not any(isinstance(s, dict) and str(s.get("id", "")).startswith("HU-") for s in listify(fm.get("sources"))):
                faltas.append(f"{p.name}: falta lineage a historias HU en sources")
    if compuerta == "G2":
        for p in md_files(d / "user-flows", "FLW-*.md"):
            if not (frontmatter(p) or {}).get("screens"):
                faltas.append(f"{p.name}: no se pasa G2 con screens vacío")
    if compuerta in ("G5", "G6"):
        screens, _ = load_screens(d)
        estados = [str((frontmatter(d / "screens" / f) or {}).get("status", s.get("status", ""))).lower() for f, s in screens.values()]
        if compuerta == "G5" and not any(s in ("in_construction", "validated", "en construcción", "validado") for s in estados):
            faltas.append("G5: no hay implementación declarada para evaluar accesibilidad")
        if compuerta == "G6":
            codigo = bool(estados) and all(s in ("validated", "validado") for s in estados)
            dtm = [frontmatter(p) or {} for p in md_files(d / "traceability", "DTM-*.md")]
            gobernadas = {e.get("screen") for fm in dtm for e in listify(fm.get("traceability")) if isinstance(e, dict)
                          and isinstance(e.get("governed_design"), dict) and e["governed_design"].get("status") == "approved"
                          and e["governed_design"].get("approved_by")}
            if not codigo and not (screens and set(screens) <= gobernadas):
                faltas.append("G6: falta código validado con evidencia o diseño gobernado aprobado; Figma es opcional")
    return [{"codigo": "COMPUERTA_SIN_ARTEFACTO", "paquete": "", "nivel": "error", "mensaje": m} for m in faltas]


def audit(kb, exigir_uxs=False, paquetes=None, avisos_uxs=None, cerrar_paquete=False, conciliacion=None, compuerta=None):
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
    controles.extend(controlar_iteracion(kb, cerrar=cerrar_paquete, paquetes=paquetes, conciliacion=conciliacion, compuerta=compuerta))
    controles.extend(controlar_compuerta(kb, compuerta))
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
    parser.add_argument("--cerrar-paquete", action="store_true")
    parser.add_argument("--conciliacion")
    parser.add_argument("--compuerta", choices=["G0", "G1", "G2", "G3", "GU", "G4", "G5", "G6", "G7", "GC", "GI", "GR"])
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
    report = audit(kb, exigir_uxs=opts.exigir_uxs or opts.cerrar_paquete or opts.compuerta == "GU", paquetes=paquetes, avisos_uxs=avisos_uxs,
                   cerrar_paquete=opts.cerrar_paquete, conciliacion=opts.conciliacion, compuerta=opts.compuerta)
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
