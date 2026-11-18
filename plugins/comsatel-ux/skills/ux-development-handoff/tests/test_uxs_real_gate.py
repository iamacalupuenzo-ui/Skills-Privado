"""The UXS must reflect the production gate, not the mere presence of a DTM."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import pytest
from validators.okf import load_kb, dump_concept


def builder():
    path = Path(__file__).resolve().parents[2] / "ux-context-builder/scripts/build_uxs.py"
    spec = importlib.util.spec_from_file_location("uxs_builder", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize("approved", [True, False])
def test_uxs_uses_real_gate_and_does_not_invent_readiness(model, make_kb, approved):
    model["stp"][0]["external_ref"] = "projects/fixture"
    for entry in model["dtm"]["traceability"]:
        entry.pop("exploration_design", None)
        gov = entry["governed_design"]
        gov.update(file_ref="real-file", node_ref=entry["screen"], version="v1", latest_known_version="v1")
    model["hof"]["gate"]["human_review"] = {"status": "approved" if approved else "pending", "reviewer": "human:enzo", "at": "2026-11-18T10:00:00-05:00"}
    kb = make_kb(model)
    for concept in load_kb(kb).concepts:
        if concept.type in {"Screen", "User Flow", "Requirement"}:
            concept.fm["tags"] = ["dsp-999"]
            if concept.type == "Screen":
                concept.fm["screens"] = [{key: concept.fm[key] for key in ("id", "flow", "requirements", "required_states", "responsive", "a11y_requirements", "components", "tokens")} ]
            dump_concept(concept.path, concept.fm, concept.body)
    args = SimpleNamespace(numero=None, actualizar=False, nombre="Prueba", corte=None,
        responsable="UX", fecha="2026-11-18T10:00:00-05:00", modulo="Prueba", a_posteriori=False,
        stitch="no", construido="Construido en rama, no fusionado")
    text, _ = builder().construir(kb, "DSP-999", args)
    assert ("| Desarrollo | **READY** |" in text) is approved, builder().gate_del_paquete(kb, ["SCR-021", "SCR-022", "SCR-023"])
    assert "hoy solo reconoce Figma o Stitch" not in text
    assert "status: draft" in text
    assert "sin fusionar" not in text or "fusionado" in text
