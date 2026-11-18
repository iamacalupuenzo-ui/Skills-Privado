"""Claude Design/prototype: recorded human approval, exact artifact and immutable evidence."""
import copy
import hashlib
import pytest

from validators import codes as C, registry, dev_context
from validators.design_ready_for_dev import evaluate
from validators.okf import load_kb, dump_concept

DTM = "DTM-CL2-TENANT-001"
HOF = "HOF-CL2-TENANT-001"
SCREEN = "SCR-021"
STAMP = "2026-11-18T12:00:00-05:00"
STATES = ["default", "loading", "empty", "error", "disabled"]


def setup(model, make_kb, tool):
    kb = make_kb(model)
    evidence = kb / "design/evidence/capture.bin"
    evidence.parent.mkdir(parents=True)
    evidence.write_bytes(b"validated build capture")
    gov = {"tool": tool, "artifact_ref": "https://example.test/settings", "version": "build-1",
           "decision_ref": "DD-001", "approved_by": "human:enzo", "approved_at": STAMP,
           "evidence_refs": [{"resource": "/design/evidence/capture.bin", "sha256": hashlib.sha256(evidence.read_bytes()).hexdigest()}],
           "states_covered": STATES, "responsive_covered": ["mobile", "desktop"],
           "latest_known_version": "build-1", "status": "approved"}
    if tool == "prototype":
        gov["build_commit"] = "a" * 40
    k = load_kb(kb)
    dd = k.get("DD-001")
    dd.fm.update({"screens": [SCREEN], "decided_by": "human:enzo", "decided_at": STAMP,
                  "decides": tool + "-governed", "governed_design": copy.deepcopy(gov)})
    dump_concept(dd.path, dd.fm, dd.body)
    put(kb, gov)
    return kb, gov, evidence


def put(kb, gov):
    dtm = load_kb(kb).get(DTM)
    next(e for e in dtm.fm["traceability"] if e["screen"] == SCREEN)["governed_design"] = gov
    dump_concept(dtm.path, dtm.fm, dtm.body)


@pytest.mark.parametrize("tool", ["claude-design", "prototype"])
def test_recorded_approval_passes_and_produces_context(model, make_kb, tool):
    kb, gov, _ = setup(model, make_kb, tool)
    assert evaluate(kb, HOF, profile="example").result == C.PASSED
    context = dev_context.build(kb, SCREEN, profile="example")
    assert context["status"] == "READY"
    assert context["governed_design"]["decision_ref"] == "DD-001"
    assert context["governed_design"]["evidence_refs"] == gov["evidence_refs"]
    assert context["human_review"]["status"] == "pending"


@pytest.mark.parametrize("tool", ["claude-design", "prototype"])
@pytest.mark.parametrize("field,value", [("approved_by", "agent:claude"), ("approved_by", None),
    ("approved_at", "2026-11-18"), ("decision_ref", "DD-999"), ("version", "build-2"),
    ("states_covered", ["default"]), ("evidence_refs", []), ("latest_known_version", "build-2")])
def test_missing_or_changed_approval_blocks(model, make_kb, tool, field, value):
    kb, gov, _ = setup(model, make_kb, tool)
    gov[field] = value
    put(kb, gov)
    assert evaluate(kb, HOF, profile="example").result != C.PASSED


@pytest.mark.parametrize("tool", ["claude-design", "prototype"])
def test_changed_evidence_fails(model, make_kb, tool):
    kb, _, evidence = setup(model, make_kb, tool)
    evidence.write_bytes(b"different build")
    result = evaluate(kb, HOF, profile="example")
    assert result.result == C.FAILED
    assert C.STALE_GOVERNED_REFERENCE in result.codes


@pytest.mark.parametrize("resource", ["../outside.bin", "https://example.test/capture.png", "C:/secret.txt"])
def test_evidence_outside_kb_rejected(model, make_kb, resource):
    kb, gov, _ = setup(model, make_kb, "prototype")
    gov["evidence_refs"][0]["resource"] = resource
    put(kb, gov)
    assert evaluate(kb, HOF, profile="example").result != C.PASSED


def test_unknown_tool_cannot_impersonate_figma(model, make_kb):
    kb = make_kb(model)
    k = load_kb(kb)
    dtm = k.get(DTM)
    dtm.fm["traceability"][0]["governed_design"]["tool"] = "unknown"
    dump_concept(dtm.path, dtm.fm, dtm.body)
    assert C.MISSING_GOVERNED_DESIGN in evaluate(kb, HOF, profile="example").codes


def test_prototype_without_full_commit_rejected(model, make_kb):
    kb, gov, _ = setup(model, make_kb, "prototype")
    gov["build_commit"] = "abc123"
    put(kb, gov)
    assert evaluate(kb, HOF, profile="example").result != C.PASSED


@pytest.mark.parametrize("tool", ["claude-design", "prototype"])
def test_registration_transcribes_existing_dd_only(model, make_kb, tool):
    kb, gov, _ = setup(model, make_kb, tool)
    registry.register_governed_artifact(kb, DTM, SCREEN, tool, gov["artifact_ref"], gov["version"],
        gov["decision_ref"], gov["approved_by"], gov["approved_at"], gov["evidence_refs"],
        gov["states_covered"], gov["responsive_covered"], gov.get("build_commit"))
    assert evaluate(kb, HOF, profile="example").result == C.PASSED
    with pytest.raises(registry.RegistryError):
        registry.register_governed_artifact(kb, DTM, SCREEN, tool, gov["artifact_ref"], "other-version",
            gov["decision_ref"], gov["approved_by"], gov["approved_at"], gov["evidence_refs"],
            gov["states_covered"], gov["responsive_covered"], gov.get("build_commit"))
