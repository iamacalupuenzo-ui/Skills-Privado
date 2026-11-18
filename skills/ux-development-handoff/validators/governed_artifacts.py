"""Explicit, evidence-bound governance for Claude Design and validated prototypes.

Checks recorded human provenance and immutable local evidence; does not authenticate
that a person actually approved it or claim to have opened an external artifact.
"""
from __future__ import annotations

import hashlib
import re
from datetime import datetime
from pathlib import Path

from . import codes as C
from .codes import Finding

TOOLS = {"claude-design", "prototype"}


def _human(value):
    return bool(re.fullmatch(r"human:[A-Za-z0-9_.-]+", str(value or "")))


def evidence_path(kb, resource):
    if not isinstance(resource, str) or not resource or ":" in resource or "\\" in resource:
        return None
    rel = resource.lstrip("/")
    if rel.startswith(kb.root.name + "/"):
        rel = rel[len(kb.root.name) + 1:]
    path = (kb.root / rel).resolve()
    if not path.is_relative_to(kb.root.resolve()) or not path.is_file():
        return None
    return path


def check(kb, screen, gov):
    out = []
    fail = lambda message, code=C.MISSING_GOVERNED_DESIGN: out.append(Finding(code, screen, message))
    tool = gov.get("tool")
    if tool not in TOOLS:
        fail("unsupported governed_design tool")
        return out
    required = ("artifact_ref", "version", "decision_ref", "approved_at", "approved_by", "evidence_refs")
    if any(not gov.get(key) for key in required) or not _human(gov.get("approved_by")):
        fail("governed artifact needs reference, version, DD, timestamp, named human and evidence")
    try:
        stamp = datetime.fromisoformat(str(gov.get("approved_at")))
        if stamp.utcoffset() is None:
            raise ValueError("timezone required")
    except (ValueError, TypeError):
        fail("approval needs an ISO timestamp with timezone")
    if tool == "prototype" and not re.fullmatch(r"[0-9a-fA-F]{40}", str(gov.get("build_commit", ""))):
        fail("validated prototype needs its full build commit")
    dd = kb.get(gov.get("decision_ref") or "")
    if dd is None or dd.type != "Design Decision":
        fail("human Design Decision does not resolve", C.DANGLING_REFERENCE)
    else:
        if (dd.fm.get("decided_by") != gov.get("approved_by") or
                dd.fm.get("decided_at") != gov.get("approved_at") or screen not in (dd.fm.get("screens") or [])):
            fail("DD does not record this screen's human approval and timestamp")
        if dd.fm.get("decides") != tool + "-governed":
            fail("DD does not explicitly choose this governed design kind")
        approved = dd.fm.get("governed_design") or {}
        keys = ("tool", "artifact_ref", "version", "evidence_refs", "states_covered", "responsive_covered")
        if tool == "prototype":
            keys += ("build_commit",)
        if any(approved.get(key) != gov.get(key) for key in keys):
            fail("governed artifact differs from the version, evidence or coverage approved in DD")
    evidence = gov.get("evidence_refs")
    if not isinstance(evidence, list) or not evidence:
        fail("missing evidence manifest")
    else:
        for item in evidence:
            if not isinstance(item, dict):
                fail("evidence entry must contain resource and SHA-256")
                continue
            path = evidence_path(kb, item.get("resource"))
            digest = str(item.get("sha256", ""))
            if path is None or not re.fullmatch(r"[0-9a-fA-F]{64}", digest):
                fail("evidence must resolve inside KB and have a SHA-256", C.UNVERIFIED_ARTIFACT_REF)
            elif hashlib.sha256(path.read_bytes()).hexdigest() != digest.lower():
                fail("evidence changed after the recorded approval", C.STALE_GOVERNED_REFERENCE)
    if gov.get("latest_known_version") != gov.get("version") or gov.get("status") == "stale":
        fail("governed artifact version is stale or was not checked", C.STALE_GOVERNED_REFERENCE)
    return out
