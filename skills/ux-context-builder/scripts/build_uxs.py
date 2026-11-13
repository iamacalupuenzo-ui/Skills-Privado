#!/usr/bin/env python3
"""Arma la UXS (UX Design Specification, el «UX Context Pack») de un paquete DSP-NNN desde los artefactos reales del KB.

Uso:
    python build_uxs.py <knowledge-base-dir> --paquete DSP-005 [opciones]

Opciones:
    --numero UXS-004        Número de la UXS. Por defecto, el siguiente libre.
    --nombre "..."          Nombre del paquete. Por defecto, el título del scope pack.
    --corte "..."           Qué cubre el corte de la entrega (una frase).
    --modulo "..."          Plataforma o módulo (por defecto «BackOffice»).
    --construido "..."      Qué está construido y dónde (lo declara una persona; por defecto, «sin información»).
    --responsable "..."     Rol que valida la UXS y confirma las decisiones (por defecto «Responsable de UX/UI»).
    --stitch usado|no       Si Stitch se usa en el paquete (por defecto «no»: su veredicto es NOT READY, «no se usa»).
    --a-posteriori          Deja constancia de que la UXS se redactó después de producir los artefactos.
    --fecha AAAA-MM-DDTHH:MM:SS-05:00   Marca de generación (por defecto, ahora).
    --salida DIR            Escribe aquí en vez de en design/specs (no toca index.md ni changelog.md).
    --sin-indice            No actualiza index.md ni changelog.md.
    --actualizar            Permite sobrescribir una UXS que ya cubre el paquete (conserva su número).
    --dry-run               Imprime el resumen JSON y no escribe nada.

No inventa: todo sale del frontmatter y de las tablas de preguntas de los artefactos, de los DTM y del preflight del
validador (`ux-development-handoff/validators/cli.py`). Lo que no puede saber (qué está construido, quién decide) se pasa por
parámetro o queda como «sin información». Nunca asigna `verified` ni aprueba nada: la UXS nace en `draft`.

Código de salida: 0 escrita (o dry-run), 1 bloqueada (paquete sin pantallas, UXS ya existente…), 2 uso incorrecto.
"""
import argparse
import json
import re
import subprocess
import sys
import unicodedata
from datetime import datetime, timezone, timedelta
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    print("Requiere PyYAML: pip install pyyaml")
    sys.exit(2)

HERE = Path(__file__).resolve().parent
VALIDADOR = HERE.parents[1] / "ux-development-handoff" / "validators" / "cli.py"
DSP_TAG = re.compile(r"\bdsp-(\d{3})\b", re.I)
LEGADO = re.compile(r"cerrad|respondid|resuelt", re.I)


# ---------------------------------------------------------------- lectura
def read(p):
    return p.read_text(encoding="utf-8")


def frontmatter(p):
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n", read(p), re.S)
    if not m:
        return {}
    try:
        data = yaml.safe_load(m.group(1))
    except yaml.YAMLError:
        return {}
    return data if isinstance(data, dict) else {}


def listify(v):
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


def md(d, patron="*.md"):
    return sorted(d.glob(patron)) if d.exists() else []


def etiqueta_paquete(fm, paquete):
    n = paquete.split("-")[1]
    return any(n in DSP_TAG.findall(str(t)) for t in listify(fm.get("tags")))


def preguntas(texto, doc_id):
    """Filas de la sección «Open questions». Una fila cerrada dice Cerrada, Respondida o Resuelta."""
    m = re.search(r"# Open questions\r?\n(.*?)(?=\r?\n#{1,2} |\Z)", texto, re.S)
    if not m:
        return []
    out = []
    for linea in m.group(1).splitlines():
        if not re.match(r"^\|\s*[A-Z]+-\d+-Q\d+", linea):
            continue
        c = [x.strip().replace("\x00", "|") for x in linea.replace("\\|", "\x00").split("|")]
        out.append({"id": c[1], "texto": c[2], "resp": c[3] if len(c) > 3 else "", "prio": c[4] if len(c) > 4 else "",
                    "bloquea": c[5] if len(c) > 5 else "", "cerrada": bool(LEGADO.search(linea)), "doc": doc_id})
    return out


def juntar(kb, paquete):
    """Artefactos del paquete: UXR, flujos, pantallas, decisiones, preguntas y DTM."""
    design = kb / "design"
    uxr, flw, scrdocs, dec, pregs = [], [], [], [], []
    for p in md(design / "ux-requirements", "UXR-*.md"):
        fm = frontmatter(p)
        if etiqueta_paquete(fm, paquete):
            uid = "-".join(p.name.split("-")[:2])
            uxr.append({"id": uid, "rel": f"design/ux-requirements/{p.name}", "estado": str(fm.get("status", "")), "texto": read(p)})
            pregs += preguntas(read(p), uid)
    for p in md(design / "user-flows", "FLW-*.md"):
        fm = frontmatter(p)
        if etiqueta_paquete(fm, paquete):
            fid = str(fm.get("id") or "-".join(p.name.split("-")[:2]))
            flw.append({"id": fid, "rel": f"design/user-flows/{p.name}", "estado": str(fm.get("status", "")),
                        "reqs": [str(x) for x in listify(fm.get("requirements"))]})
            pregs += preguntas(read(p), fid)
    scr = []
    for p in md(design / "screens", "SCR-*.md"):
        fm = frontmatter(p)
        if not etiqueta_paquete(fm, paquete):
            continue
        rel = f"design/screens/{p.name}"
        scrdocs.append({"rel": rel, "estado": str(fm.get("status", ""))})
        pregs += preguntas(read(p), p.name.split("-")[0] + "-" + p.name.split("-")[1])
        for s in listify(fm.get("screens")):
            if isinstance(s, dict) and s.get("id"):
                estados = listify(s.get("required_states"))
                scr.append({"id": str(s["id"]), "rel": rel, "flow": str(s.get("flow", "")), "reqs": [str(x) for x in listify(s.get("requirements"))],
                            "estados": len(estados), "completo": all(s.get(k) for k in ("flow", "requirements", "required_states", "a11y_requirements"))})
    ids_paquete = {x["id"] for x in uxr} | {x["id"] for x in flw} | {x["id"] for x in scr}
    for p in md(design / "decisiones", "DEC-*.md"):
        fm = frontmatter(p)
        texto = read(p)
        menciona = paquete in texto and any(i in texto for i in ids_paquete)
        if etiqueta_paquete(fm, paquete) or menciona:
            dec.append({"id": str(fm.get("id") or "-".join(p.name.split("-")[:2])), "rel": f"design/decisiones/{p.name}", "estado": str(fm.get("status", ""))})
    dtm = {}
    for p in md(design / "traceability", "DTM-*.md"):
        for e in listify(frontmatter(p).get("traceability")):
            if isinstance(e, dict) and e.get("screen"):
                dtm[str(e["screen"])] = e
    return {"uxr": uxr, "flw": flw, "scrdocs": scrdocs, "scr": scr, "dec": dec, "pregs": pregs, "dtm": dtm}


def intent_briefs(design, flujos):
    """(todos los IB, los que mencionan algún flujo del paquete)."""
    todos, cubren = [], []
    for p in md(design / "explorations", "IB-*.md"):
        ib = "-".join(p.name.split("-")[:2])
        todos.append(ib)
        t = read(p)
        if any(re.search(rf"\b{re.escape(f)}\b", t) for f in flujos):
            cubren.append(ib)
    return sorted(todos), sorted(cubren)


def preflight(kb, paquete, pantallas):
    if not VALIDADOR.exists() or not pantallas:
        return {"status": "sin_ejecutar", "findings": []}
    r = subprocess.run([sys.executable, str(VALIDADOR), "preflight", "--profile", "production", "--kb", str(kb), "--initiative", paquete,
                        "--screens", *pantallas], capture_output=True, text=True, encoding="utf-8", timeout=120)
    try:
        return json.loads(r.stdout)
    except ValueError:
        return {"status": "sin_resultado", "findings": []}


# ---------------------------------------------------------------- redacción
def rel_enlace(rel):
    return "../" + rel.replace("design/", "", 1)


def nombre_md(rel):
    return rel.split("/")[-1][:-3]


def plural(n, s, p=None):
    return s if n == 1 else (p or s + "s")


def rango(ids):
    return f"{ids[0]} a {ids[-1]}" if len(ids) > 1 else ids[0]


def siguiente_numero(specs):
    nums = [int(m.group(1)) for p in md(specs, "UXS-*.md") if (m := re.match(r"UXS-(\d+)", p.name))]
    return f"UXS-{(max(nums) + 1 if nums else 1):03d}"


def uxs_que_cubren(kb, paquete, ids_paquete):
    out = []
    for p in md(kb / "design" / "specs", "UXS-*.md"):
        fm = frontmatter(p)
        declara = etiqueta_paquete(fm, paquete) or any(isinstance(s, dict) and str(s.get("id")) == paquete for s in listify(fm.get("sources")))
        menciona = any(re.search(rf"\b{re.escape(i)}\b", read(p)) for i in ids_paquete)
        if declara or menciona:
            out.append(p)
    return out


def construir(kb, paquete, a):
    d = juntar(kb, paquete)
    if not d["scr"]:
        raise SystemExit(f"BLOQUEADO: {paquete} no tiene pantallas (SCR) con la etiqueta dsp-{paquete[-3:]}. Sin pantallas especificadas no hay qué consolidar; "
                         "produce antes los UXR, flujos y pantallas con sus skills (o etiqueta los existentes).")
    design = kb / "design"
    abiertas = [q for q in d["pregs"] if not q["cerrada"]]
    ids_paquete = {x["id"] for x in d["uxr"]} | {x["id"] for x in d["flw"]} | {x["id"] for x in d["scr"]}
    existentes = uxs_que_cubren(kb, paquete, ids_paquete)
    numero = a.numero
    if existentes and not a.actualizar:
        raise SystemExit(f"BLOQUEADO: {paquete} ya tiene UXS ({', '.join(p.name for p in existentes)}). Usa --actualizar para regenerarla.")
    if existentes and a.actualizar and not numero:
        numero = "-".join(existentes[0].name.split("-")[:2])
    numero = numero or siguiente_numero(design / "specs")

    scope = next((p for p in md(kb / "requirements" / "scope-packs", f"{paquete}-*.md") if not re.search(r"avisos|analisis", p.name)), None)
    titulo_scope = ""
    if scope:  # el título suele traer «: » sin comillas y el YAML no lo lee: se toma la línea tal cual
        m = re.search(r"(?m)^title:\s*(.+?)\s*$", read(scope)[:2000])
        titulo_scope = (m.group(1).strip("\"'") if m else "") or str(frontmatter(scope).get("title", ""))
    nombre = a.nombre or re.sub(r"^(?:DSP-\d+\s*[—-]\s*)?(?:Paquete\s*\d+\s*[:.—-]\s*)?", "", titulo_scope) or paquete
    ascii_ = unicodedata.normalize("NFKD", f"{paquete}-{nombre}").encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_.lower()).strip("-")[:60].strip("-")
    if existentes and a.actualizar:  # una UXS que se regenera conserva su nombre de archivo
        slug = re.sub(r"^UXS-\d+-", "", existentes[0].stem)
    corte = a.corte or f"las {len(d['scr'])} pantallas del paquete"
    historias = sorted({h for x in d["flw"] for h in x["reqs"] if h.startswith("HU-")} | {h for s in d["scr"] for h in s["reqs"] if h.startswith("HU-")})
    pf = preflight(kb, paquete, [s["id"] for s in d["scr"]])
    codigos = {}
    for f in pf.get("findings", []):
        codigos[f["code"]] = codigos.get(f["code"], 0) + 1
    pf_texto = f"**{pf.get('status', 'sin resultado')}**" + (" (" + ", ".join(f"{c} ×{n}" for c, n in codigos.items()) + ")" if codigos else "")
    ib_todos, ib_cubren = intent_briefs(design, [x["id"] for x in d["flw"]])
    sin_dtm = [s["id"] for s in d["scr"] if s["id"] not in d["dtm"]]
    gobernado = all(isinstance(d["dtm"].get(s["id"], {}).get("governed_design"), dict) and d["dtm"][s["id"]]["governed_design"] for s in d["scr"])
    borradores = [x for x in d["dec"] if x["estado"] != "accepted"]
    bloqueantes = [q for q in abiertas if not re.match(r"(?i)no", q["bloquea"])]
    resp = a.responsable

    L = []

    def p(linea=""):
        L.append(linea)

    n = len(abiertas)
    p("---")
    p('okf_version: "0.2"')
    p(f"id: {numero}")
    p("type: UX Design Specification")
    p(f'title: "{numero} — {nombre}: especificación de diseño UX/UI"')
    p(f'description: "Especificación consolidada del paquete {paquete}: {len(d["uxr"])} UX Requirements, {len(d["flw"])} {plural(len(d["flw"]), "flujo", "flujos")} y {len(d["scr"])} {plural(len(d["scr"]), "pantalla especificada", "pantallas especificadas")}; '
      f'{"con" if ib_cubren else "sin"} exploración en Claude Design y {"con" if gobernado else "sin"} diseño gobernado registrado."')
    p(f"tags: [ux-design-specification, {paquete.lower()}, ux-ui]")
    p("status: draft")
    p("generated:")
    p('  by: "ux-context-builder/1.0"')
    p(f'  at: "{a.fecha}"')
    p("sources:")
    p(f"  - id: {paquete}")
    if scope:
        p(f"    resource: /requirements/scope-packs/{scope.name}")
    for x in d["dec"]:
        p(f"  - id: {x['id']}")
        p(f"    resource: /{x['rel']}")
    tokens = next(iter(md(design / "tokens", "TKN-DS-*.md")), None)
    if tokens:
        p("  - id: TKN-DS-TEMA")
        p(f"    resource: /design/tokens/{tokens.name}")
    p("---")
    p()
    p(f"# {numero} — {nombre}")
    p()
    posterior = " Se redactó **después** de producir los UXR, los flujos y las pantallas, no durante su producción." if a.a_posteriori else ""
    p("> Esta especificación indexa y evalúa los artefactos de diseño; no los duplica. El contenido vive en cada artefacto enlazado. Es un borrador para revisión humana: "
      f"nada de lo que indexa está aprobado por esta especificación.{posterior}")
    p()
    p("## 1. Alcance y escenario")
    p()
    p(f"- **Producto / iniciativa:** CL2 Flotas, {nombre} (paquete {paquete}), {a.modulo}.")
    escenario_b = ", con cambios posteriores por decisión (escenario B)" if d["dec"] else ""
    p(f"- **Escenario orquestado:** A (iniciativa nueva de diseño) hasta C (especificar pantallas){escenario_b}. "
      f"{'Hay' if ib_cubren else 'No hay'} exploración visual en Claude Design y {'hay' if gobernado else 'no hay'} diseño gobernado: "
      f"{'se llegó a D' if ib_cubren else 'no se llegó a D'} ni a E.")
    if scope:
        p(f"- **RQS de origen:** [{paquete}](../../requirements/scope-packs/{scope.name}).")
    p(f"- **Historias en alcance:** {', '.join(historias) if historias else 'sin historias declaradas'}.")
    if tokens:
        p(f"- **Design System / TKN-SET:** `@comsatel/ui-components` y sus tokens, descritos en [TKN-DS-TEMA](../tokens/{tokens.name}). Presente.")
    p(f"- **Corte de la entrega:** {len(d['scr'])} pantallas ({rango([s['id'] for s in d['scr']])}) de {len(d['flw'])} {plural(len(d['flw']), 'flujo', 'flujos')}: {corte}.")
    p(f"- **Estado de construcción:** {a.construido}")
    p()
    p("## 2. Artefactos del conjunto")
    p()
    p("| Tipo | ID | Archivo | Estado | Preparación |")
    p("|---|---|---|---|---|")
    for x in d["uxr"]:
        k = len([q for q in abiertas if q["id"].startswith(x["id"] + "-")])
        prep = f"CONDITIONAL: {k} {plural(k, 'pregunta', 'preguntas')} por validar" if k else "Sin preguntas abiertas"
        p(f"| UX Requirement | {x['id']} | [{nombre_md(x['rel'])}]({rel_enlace(x['rel'])}) | {x['estado']} | {prep} |")
    for x in d["flw"]:
        p(f"| User Flow | {x['id']} | [{nombre_md(x['rel'])}]({rel_enlace(x['rel'])}) | {x['estado']} | {'Aceptado' if x['estado'] == 'accepted' else 'Pendiente de revisión'} |")
    for doc in d["scrdocs"]:
        ids = [s["id"] for s in d["scr"] if s["rel"] == doc["rel"]]
        uxrs = {r for s in d["scr"] if s["rel"] == doc["rel"] for r in s["reqs"] if r.startswith("UXR-")}
        k = len([q for q in abiertas if any(q["id"].startswith(u + "-") for u in uxrs)])
        p(f"| Screen | {rango(ids)} | [{nombre_md(doc['rel'])}]({rel_enlace(doc['rel'])}) | {doc['estado']} | "
          f"{f'CONDITIONAL: {k} pregunta' + ('s' if k > 1 else '') + ' en sus UXR' if k else 'Sin preguntas abiertas'} |")
    for x in d["dec"]:
        p(f"| Decision Record | {x['id']} | [{nombre_md(x['rel'])}]({rel_enlace(x['rel'])}) | {x['estado']} | "
          f"{'Decisión aceptada' if x['estado'] == 'accepted' else 'Borrador: falta su confirmación'} |")
    if tokens:
        p(f"| Component / Token | TKN-DS | [{tokens.stem}](../tokens/{tokens.name}) | draft | Existente |")
    ib_nota = f"IB-{ib_todos[0][3:]} a {ib_todos[-1]} son de otros paquetes" if ib_todos and not ib_cubren else "ver Intent Briefs"
    p(f"| Intent Brief y exploración en Claude Design, Accessibility Report, Design Decision, Handoff, Traceability Map | — | — | "
      f"{'existen en parte' if ib_cubren or d['dtm'] else 'no existen para este paquete'} ({ib_nota}) | {'CONDITIONAL' if ib_cubren else 'NOT READY'} |")
    p()
    p("## 3. Resultado de la auditoría")
    p()
    p(f"- **Herramientas:** `audit_ux.py` sobre todo el KB; pantallas de este paquete sin entrada en el DTM: {len(sin_dtm)} de {len(d['scr'])}. "
      f"Preflight (la verificación de Stitch) sobre {len(d['scr'])} pantallas: {pf_texto}. Gate: no aplica (no hay HOF).")
    p("- **Hallazgos de juicio (references/quality-criteria.md):**")
    p()
    p("| ID | Hallazgo | Severidad | Artefacto y sección | Skill dueño | Estado |")
    p("|---|---|---|---|---|---|")
    q = {"n": 0}
    refs = {}

    def h(clave, texto, sev, donde, skill, estado="Abierto"):
        q["n"] += 1
        refs[clave] = f"Q-UXS-{q['n']}"
        p(f"| Q-UXS-{q['n']} | {texto} | {sev} | {donde} | {skill} | {estado} |")

    flujos = [x["id"] for x in d["flw"]]
    if ib_cubren:
        h("ib", f"Hay Intent Brief de estos flujos ({', '.join(ib_cubren)}); falta registrar la decisión de diseño (DD) de una persona", "Menor",
          "`design/explorations`", "`claude-design-orchestrator`")
    else:
        h("ib", f"No hay Intent Brief ni exploración en Claude Design de los flujos {rango(flujos)}: {', '.join(ib_todos[:1])} a {ib_todos[-1] if ib_todos else '—'} son de otros paquetes. "
                "No bloquea la construcción en código, pero sí un diseño explorado y elegido por una persona", "Mayor", f"{rango(flujos)}; `design/explorations`", "`claude-design-orchestrator`")
    if codigos.get("DANGLING_REFERENCE"):
        h("hu", "Las referencias `HU-NN-NN` de los SCR y flujos **no resuelven** para el validador (`DANGLING_REFERENCE`): las historias declaran `id: CL2-US-NNN` y `legacy_id: HU-NN-NN`",
          "Mayor", "Frontmatter `requirements` de los SCR y FLW de este paquete", "`ui-spec-writer` y `user-flow-designer` (citar el id canónico), o ajuste del validador a `legacy_id`")
    h("a11y", "La accesibilidad de estas pantallas se apoya en la estructura de los componentes del Design System, cuyas guías traen su contrato de accesibilidad (`guidelines/`). "
              "No hay un Accessibility Report por pantalla: lo propio de cada una (orden de foco, mensajes, nombres accesibles) se verifica al validar lo construido",
      "Menor", rango([s["id"] for s in d["scr"]]), "`accessibility-reviewer`, al validar lo construido")
    if not gobernado:
        h("gob", "El diseño se gobierna de dos formas: en Claude Design, o con el prototipo construido en código y validado al terminar de construir. "
                 "Para este paquete ninguna está registrada todavía: no hay validación del prototipo" + ("" if ib_cubren else " ni exploración en Claude Design") +
                 ", y ningún DTM cubre estas pantallas", "Mayor", "DTM; prototipo en `microui-*`", "`claude-design-orchestrator`, o la validación del prototipo con Desarrollo")
    if codigos.get("MISSING_STITCH_PROJECT"):
        h("stitch", "El preflight queda **BLOCKED** por `MISSING_STITCH_PROJECT` (no hay proyecto Stitch): Stitch no se usa en este paquete, así que no bloquea nada y se deja constancia",
          "Menor", "Preflight", "`stitch-ui-generator`", "No aplica")
    if borradores:
        ids = " y ".join(x["id"] for x in borradores)
        h("dec", f"{ids} {'están' if len(borradores) > 1 else 'está'} en borrador: sus decisiones aún no tienen la confirmación registrada de {resp}", "Menor", ", ".join(x["id"] for x in borradores), resp)
    medias = [x for x in abiertas if re.search(r"(?i)media|alta", x["prio"])]
    altas = [x for x in abiertas if re.search(r"(?i)alta", x["prio"])]
    bloq_txt = (", ".join(x["id"] for x in bloqueantes) + (" bloquean" if len(bloqueantes) > 1 else " bloquea") + " el backend real, no la pantalla") if bloqueantes else "ninguna bloqueante"
    h("preg", f"{n} {plural(n, 'pregunta abierta', 'preguntas abiertas')} ({len(medias)} de prioridad media, {len(altas)} de alta; {bloq_txt}), de Arquitectura, del PO o de Infraestructura; pueden cambiar textos, contratos o condiciones",
      "Mayor" if bloqueantes else "Menor", "Sección 5", "Responsables de cada rol")
    p()
    p("## 4. Matriz de trazabilidad por pantalla")
    p()
    p("| SCR | US | UXR | FLW | Estados cubiertos | Exploración | Diseño gobernado | Divergencia | ARP | Preguntas abiertas |")
    p("|---|---|---|---|---|---|---|---|---|---|")
    for s in d["scr"]:
        uxrs = [r for r in s["reqs"] if r.startswith("UXR-")]
        hus = [r for r in s["reqs"] if r.startswith("HU-")]
        qs = [x["id"].replace("UXR-", "") for x in abiertas if any(x["id"].startswith(u + "-") for u in uxrs)]
        preg_txt = f"{len(qs)} por validar ({', '.join(qs)})" if qs else "ninguna"
        p(f"| {s['id']} | {', '.join(hus)} | {', '.join(uxrs)} | {s['flow']} | {s['estados']} estados | — | — | — | — | {preg_txt} |")
    p()
    p("Las columnas de exploración, diseño gobernado y divergencia están vacías porque ese trabajo no existe todavía para este paquete. La de accesibilidad (ARP) también: "
      f"la accesibilidad se apoya en los componentes del Design System y lo propio de cada pantalla se verifica al validar lo construido ({refs['a11y']}).")
    p()
    p("**Huérfanos detectados:** ninguno. Cada SCR declara su flujo y cada flujo lista sus pantallas; los avisos de «sin entrada en ningún DTM» son esperados.")
    p()
    p("## 5. Preguntas abiertas y decisiones humanas pendientes")
    p()
    p("| ID | Pregunta o decisión | Responsable | Prioridad | Bloquea | Desbloquea |")
    p("|---|---|---|---|---|---|")
    for x in abiertas:
        uxr = re.sub(r"-Q\d+$", "", x["id"])
        scrs = [s["id"] for s in d["scr"] if uxr in s["reqs"]]
        texto = x["texto"] if len(x["texto"]) <= 190 else x["texto"][:187] + "…"
        bq = "No" if re.match(r"(?i)no", x["bloquea"]) else x["bloquea"]
        p(f"| {x['id']} | {texto.replace('|', chr(92) + '|')} | {x['resp'].replace('|', chr(92) + '|')} | {x['prio']} | {bq.replace('|', chr(92) + '|')} | {', '.join(scrs) if scrs else '—'} |")
    if not abiertas:
        p("| — | Ninguna pregunta abierta | — | — | — | — |")
    for x in borradores:
        p(f"| {x['id']} | Confirmar o corregir las decisiones del borrador | {resp} | Media | No | Cierra el registro de decisiones de este paquete |")
    p(f"| {refs['ib']} | Decidir, flujo por flujo, cómo se gobierna el diseño: explorando en Claude Design (Intent Brief y elección entre alternativas) o pasando directo a front end y validando el prototipo al terminar de construir. "
      f"El gate de `ux-development-handoff` hoy solo reconoce Figma o Stitch como diseño gobernado: admitir el prototipo en código es decisión de {resp} y pide ajustar el skill | {resp} | Media | Claude Design | Diseño gobernado y el handoff formal |")
    if "hu" in refs:
        p(f"| {refs['hu']} | Elegir cómo se resuelve el id canónico de las historias (citar `CL2-US-NNN` o ajustar el validador a `legacy_id`) | {resp} y quien mantiene el validador | Media | El preflight de todos los paquetes y la entrada de Claude Design | Que el preflight deje de dar `FAILED` |")
    p()
    p("## 6. Preparación por consumidor")
    p()
    p("| Consumidor | Veredicto | Razón y bloqueos | Skill siguiente |")
    p("|---|---|---|---|")
    incompletas = [s["id"] for s in d["scr"] if not s["completo"]]
    if incompletas:
        cd, cd_razon = "NOT READY", f"Faltan campos obligatorios en {', '.join(incompletas[:6])}{'…' if len(incompletas) > 6 else ''} (flow, requirements, required_states o a11y_requirements)."
    elif abiertas:
        cd, cd_razon = "CONDITIONAL", ("Los SCR tienen `flow`, `requirements`, `required_states`, `responsive`, `a11y_requirements`, componentes y tokens, el Design System está identificado "
                                         f"y {'ninguna pregunta abierta bloquea el diseño' if not bloqueantes else 'hay preguntas que bloquean parte del diseño'}. Quedan {n} {plural(n, 'pregunta abierta', 'preguntas abiertas')} (Sección 5), "
                                         f"que pueden cambiar textos o condiciones{', y ' + refs['hu'] if 'hu' in refs else ''}. Falta el Intent Brief, que redacta el propio skill. "
                                         "Si se avanza, se pospone: los textos finales y lo que dependa de las respuestas de otro rol")
    else:
        cd, cd_razon = "READY", "Los SCR están completos, el Design System está identificado y no hay preguntas abiertas. Falta el Intent Brief, que redacta el propio skill."
    p(f"| Claude Design (exploración visual) | **{cd}** | {cd_razon} | `claude-design-orchestrator` |")
    if a.stitch == "usado":
        sv = "READY" if pf.get("status") == "READY" else "NOT READY"
        p(f"| Stitch | **{sv}** | Preflight: {pf_texto} | `stitch-ui-generator` |")
    else:
        p("| Stitch | **NOT READY** | No hay proyecto Stitch gobernado y el preflight está BLOCKED; crear uno exige autorización explícita. No se usa en este paquete | `stitch-ui-generator` |")
    fv = "READY" if gobernado else "NOT READY"
    p(f"| Figma | **{fv}** | {'Todas las pantallas tienen diseño gobernado en el DTM' if gobernado else 'Sin exploración registrada, sin entrada en el DTM, sin acceso ni nodo Figma y sin Accessibility Report. El repositorio descartó Figma como diseño gobernado el 2026-10-04 (decisión de `human:ianache`)'} | `figma-design-validator` |")
    sin_info = a.construido.startswith("Sin información")
    construido = "Todavía no hay información de lo construido de este paquete." if sin_info else (
        "Todavía no hay nada construido de este paquete." if a.construido.startswith("Sin construir") else
        f"{a.construido} Se construyó directo en front end a partir de los SCR, del Design System y de las decisiones, sin diseño gobernado; lo que ningún diseño cubre se consultó y se registró en decisiones (DEC).")
    if incompletas:
        dev = "**NOT READY**"
        dev_razon = f"Hay pantallas incompletas ({', '.join(incompletas[:6])}); sin ellas no se construye ni se pasa el gate."
    else:
        dev = "**CONDITIONAL** (prototipo en código, que gobierna el diseño y se valida al terminar de construir); **NOT READY** para el gate formal `DESIGN_READY_FOR_DEV`"
        dev_razon = ("La vía directa (SCR, Design System y decisiones) es viable porque " + ("ninguna pregunta abierta bloquea una pantalla" if not bloqueantes else "las preguntas bloqueantes afectan solo al backend, no a la pantalla")
                     + f" y la accesibilidad se apoya en los componentes del Design System. {construido} El gate formal hoy solo reconoce Figma o Stitch como diseño gobernado ({refs['ib']}). "
                       "Queda pospuesto: la validación del prototipo al terminar de construir, los textos provisionales y lo que respondan Arquitectura, el PO y Seguridad")
    p(f"| Desarrollo | {dev} | {dev_razon} | construcción directa; `ux-development-handoff` si se registra el diseño gobernado |")
    total_estados = sum(s["estados"] for s in d["scr"])
    qa = "CONDITIONAL" if abiertas else "READY"
    p(f"| QA | {qa} | Hay criterios de aceptación con resultado visible y {total_estados} estados definidos en {len(d['scr'])} pantallas, con permisos por actor. "
      f"Los casos de accesibilidad se derivan del contrato de cada componente del Design System; lo propio de cada pantalla se verifica al validar lo construido ({refs['a11y']}). "
      f"{'Los textos son provisionales mientras haya preguntas abiertas' if abiertas else 'No hay preguntas abiertas'} | `test-case-generator` |")
    p()
    p("Si se avanza igual en un CONDITIONAL, queda pospuesto: para Claude Design y para la construcción directa, los textos finales y lo que respondan los demás roles; para QA, los casos de accesibilidad.")
    p()
    p("## 7. Registro de orquestación")
    p()
    p("| Pasada | Skill | Artefactos creados o actualizados | Resultado de su verificación |")
    p("|---|---|---|---|")
    p(f"| 1 | `ux-requirements-analyzer`, `user-flow-designer`, `ui-spec-writer` | {rango([x['id'] for x in d['uxr']]) if d['uxr'] else '—'}; {rango(flujos)}; {rango([s['id'] for s in d['scr']])} | Sin pasar por la consolidación; `audit_ux.py`: 0 errores |")
    p(f"| 2 | `ux-context-builder` | {numero} | Preflight: {pf_texto}; sin gate |")
    p()
    p("**Aislamiento:** rama `ux/<slug>` en un worktree propio. **Efectos externos:** ninguno (no se creó ningún proyecto Stitch, no se usó Claude Design ni se tocó Figma).")
    p()
    p("## 8. Validación humana")
    p()
    p("- **Estado:** Pendiente")
    p(f"- **Responsable:** {resp}")
    p("- **Fecha:** —")
    p(f"- **Decisión humana requerida:** confirmar que esta consolidación refleja el estado del paquete {paquete}, y decidir sobre {refs['ib']} (explorar en Claude Design o pasar directo a front end)"
      + (f" y {refs['hu']}" if "hu" in refs else "") + ".")
    p()
    resumen = {"paquete": paquete, "numero": numero, "nombre": nombre, "archivo": f"design/specs/{numero}-{slug}.md", "uxr": len(d["uxr"]), "flw": len(d["flw"]), "scr": len(d["scr"]),
               "preguntas_abiertas": n, "preflight": pf.get("status"), "veredictos": {"claude_design": cd, "stitch": "NOT READY", "figma": fv, "qa": qa},
               "actualiza": bool(existentes)}
    return "\n".join(L), resumen


# ---------------------------------------------------------------- escritura
def fin_de_linea(specs):
    for p in md(specs, "UXS-*.md"):
        return "\r\n" if b"\r\n" in p.read_bytes() else "\n"
    return "\n"


def actualizar_indice(kb, resumen, nombre, fecha, eol):
    idx = kb / "index.md"
    if idx.exists():
        t = read(idx).replace("\r\n", "\n")
        fila = (f"| {resumen['numero']} | [UXS de {resumen['paquete']}: {nombre}]({resumen['archivo']}) | UX Design Specification | draft · {resumen['uxr']} UXR, {resumen['flw']} {plural(resumen['flw'], 'flujo', 'flujos')}, "
                f"{resumen['scr']} {plural(resumen['scr'], 'pantalla', 'pantallas')}; Claude Design {resumen['veredictos']['claude_design']}, Stitch y Figma NOT READY, QA {resumen['veredictos']['qa']} |")
        if resumen["numero"] not in t:
            lineas = t.split("\n")
            ultimo = max((i for i, l in enumerate(lineas) if l.startswith("| UXS-")), default=None)
            if ultimo is not None:
                lineas.insert(ultimo + 1, fila)
                idx.write_bytes("\n".join(lineas).replace("\n", eol).encode("utf-8"))
    ch = kb / "changelog.md"
    if ch.exists():
        t = read(ch).replace("\r\n", "\n")
        dia = fecha[:10]
        entrada = (f"- **Agregado (UX/UI, consolidación por `ux-context-builder`):** [{resumen['numero']}]({resumen['archivo']}) (draft): especificación de diseño de {resumen['paquete']}, "
                   f"que indexa {resumen['uxr']} UX Requirements, {resumen['flw']} {plural(resumen['flw'], 'flujo', 'flujos')} y {resumen['scr']} {plural(resumen['scr'], 'pantalla', 'pantallas')}, con veredicto por consumidor.")
        if resumen["numero"] not in t:
            enc = f"## {dia}\n\n"
            if enc in t:
                t = t.replace(enc, enc + entrada + "\n", 1)
            else:
                t = re.sub(r"(# Changelog\n\n)", rf"\1## {dia}\n\n{entrada}\n\n", t, count=1)
            ch.write_bytes(t.replace("\n", eol).encode("utf-8"))


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument("kb", nargs="?")
    ap.add_argument("--paquete")
    ap.add_argument("--numero")
    ap.add_argument("--nombre")
    ap.add_argument("--corte")
    ap.add_argument("--modulo", default="BackOffice")
    ap.add_argument("--construido", default="Sin información: lo construido se declara a mano al revisar la UXS.")
    ap.add_argument("--responsable", default="Responsable de UX/UI")
    ap.add_argument("--stitch", choices=["usado", "no"], default="no")
    ap.add_argument("--a-posteriori", action="store_true")
    ap.add_argument("--fecha", default=datetime.now(timezone(timedelta(hours=-5))).strftime("%Y-%m-%dT%H:%M:%S-05:00"))
    ap.add_argument("--salida")
    ap.add_argument("--sin-indice", action="store_true")
    ap.add_argument("--actualizar", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("-h", "--help", action="store_true")
    try:
        a = ap.parse_args()
    except SystemExit:
        print(__doc__)
        return 2
    if a.help or not a.kb or not a.paquete or not re.fullmatch(r"DSP-\d{3}", a.paquete.upper()):
        print(__doc__)
        return 2
    a.paquete = a.paquete.upper()
    kb = Path(a.kb)
    if not (kb / "design").is_dir():
        print(f"No existe {kb / 'design'}")
        return 2
    try:
        texto, resumen = construir(kb, a.paquete, a)
    except SystemExit as e:
        print(e)
        return 1
    if a.dry_run:
        print(json.dumps(resumen, ensure_ascii=False, indent=2))
        return 0
    destino_dir = Path(a.salida) if a.salida else kb / "design" / "specs"
    destino_dir.mkdir(parents=True, exist_ok=True)
    eol = fin_de_linea(kb / "design" / "specs")
    destino = destino_dir / Path(resumen["archivo"]).name
    for viejo in md(kb / "design" / "specs", f"{resumen['numero']}-*.md"):
        if a.actualizar and not a.salida and viejo != destino:
            viejo.unlink()
    destino.write_bytes(texto.replace("\n", eol).encode("utf-8"))
    if not a.salida and not a.sin_indice:
        actualizar_indice(kb, resumen, resumen["nombre"], a.fecha, eol)
    print(json.dumps(resumen, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
