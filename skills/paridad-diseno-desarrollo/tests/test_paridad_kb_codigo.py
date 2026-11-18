"""Deterministic fixtures, real historical excerpts, no network/model calls."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SKILL = Path(__file__).resolve().parents[1]
SCRIPT = SKILL / "scripts/paridad_kb_codigo.py"
spec = importlib.util.spec_from_file_location("paridad_kb_codigo", SCRIPT)
parity = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = parity
spec.loader.exec_module(parity)


class ParityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in ("kb", "code"):
            (self.root / name).mkdir()
            self.git(name, "init", "-q")
            self.git(name, "config", "user.email", "fixture@example.invalid")
            self.git(name, "config", "user.name", "Parity fixture")
            self.git(name, "config", "core.autocrlf", "false")
        self.config = json.loads((SKILL / "examples/paquete.json").read_text(encoding="utf-8"))
        self.config["sources"] = {name: {"root": str(self.root / name), "role": name, "ref": "HEAD"}
                                  for name in ("kb", "code")}
        for kind in ("SCR", "FLW", "UXR", "UXS", "DEC"):
            self.write("kb", f"{kind}-001.md", "BEGIN\ncs-input\nname\n/details\nGuardar\nEND\n")
        self.write("code", "screen.html", "<!-- cs-ghost -->\n<cs-input name=\"name\">Guardar</cs-input>\n")
        self.write("code", "routes.ts", "const routes = ['/details'];\n")
        self.commit_all()

    def git(self, name, *args):
        return subprocess.check_output(["git", "-C", str(self.root / name), *args], stderr=subprocess.PIPE)

    def write(self, name, file, text):
        path = self.root / name / file
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def commit_all(self):
        for name in ("kb", "code"):
            self.git(name, "add", ".")
            self.git(name, "commit", "-qm", "fixture", "--allow-empty")

    def config_path(self):
        path = self.root / "code/package.json"
        path.write_text(json.dumps(self.config), encoding="utf-8")
        self.git("code", "add", "package.json")
        return path

    def run_report(self):
        return parity.run(self.config_path())

    def assert_blocked(self):
        with self.assertRaises((parity.EvidenceError, KeyError, TypeError)):
            self.run_report()

    def test_complete_package_matches(self):
        result = self.run_report()
        self.assertEqual(result["status"], "MATCH")
        self.assertEqual(result["checks"], 5)
        self.assertEqual(len(result["sources"]["kb"]["files"]), 5)

    def test_extra_component_has_both_locations(self):
        self.write("code", "screen.html", '<cs-input name="name">Guardar</cs-input>\n<cs-button />\n')
        self.commit_all()
        result = self.run_report()
        diff = result["differences"][0]
        self.assertEqual(diff["extra_in_code"], {"cs-button": 1})
        self.assertEqual(diff["code"][-1]["line"], 2)
        self.assertEqual(diff["kb"][0]["line"], 2)

    def test_missing_field(self):
        self.write("code", "screen.html", '<cs-input name="other">Guardar</cs-input>')
        self.commit_all()
        diff = next(x for x in self.run_report()["differences"] if x["dimension"] == "fields")
        self.assertEqual(diff["missing_in_code"], {"name": 1})
        self.assertEqual(diff["extra_in_code"], {"other": 1})

    def test_missing_literal_is_not_success(self):
        self.write("code", "screen.html", '<cs-input name="name">Enviar</cs-input>')
        self.commit_all()
        self.assert_blocked()

    def test_empty_checks_blocked(self):
        self.config["checks"] = []
        self.assert_blocked()

    def test_missing_dimension_blocked(self):
        self.config["checks"] = [x for x in self.config["checks"] if x["dimension"] != "fields"]
        self.assert_blocked()

    def test_new_screen_requires_all_dimensions(self):
        self.config["screens"].append("SCR-002")
        self.assert_blocked()

    def test_missing_artifact_type_blocked(self):
        self.config["checks"].pop()
        self.assert_blocked()

    def test_invalid_regex_blocked(self):
        self.config["checks"][0]["kb"][0]["pattern"] = "["
        with self.assertRaises(parity.re.error):
            self.run_report()

    def test_unknown_ref_blocked(self):
        self.config["sources"]["kb"]["ref"] = "no-such-ref"
        self.assert_blocked()

    def test_kb_worktree_forbidden(self):
        self.config["sources"]["kb"]["ref"] = "WORKTREE"
        self.assert_blocked()

    def test_code_worktree_detects_uncommitted_change(self):
        self.write("code", "routes.ts", "const routes = ['/elsewhere'];")
        self.config["sources"]["code"]["ref"] = "WORKTREE"
        self.assertEqual(self.run_report()["status"], "DIVERGENT")

    def test_kb_ignores_dirty_worktree(self):
        self.write("kb", "SCR-001.md", "wrong")
        self.assertEqual(self.run_report()["status"], "MATCH")

    def test_path_traversal_blocked(self):
        self.config["checks"][0]["code"][0]["file"] = "../private"
        self.assert_blocked()

    def test_missing_file_blocked(self):
        self.config["checks"][0]["code"][0]["file"] = "missing.html"
        self.assert_blocked()

    def test_duplicate_region_blocked(self):
        self.write("kb", "SCR-001.md", "BEGIN\ncs-input\nEND\nBEGIN\ncs-input\nEND")
        self.commit_all()
        self.assert_blocked()

    def test_missing_region_blocked(self):
        self.config["checks"][0]["code"][0]["region"] = "ABSENT(?P<body>.*)"
        self.assert_blocked()

    def test_duplicate_check_blocked(self):
        self.config["checks"].append(copy.deepcopy(self.config["checks"][0]))
        self.assert_blocked()

    def test_wrong_side_blocked(self):
        self.config["checks"][0]["code"][0]["source"] = "kb"
        self.assert_blocked()

    def test_sequence_detects_order(self):
        self.write("kb", "FLW-001.md", "BEGIN\n/a\n/b\nEND\n")
        self.write("code", "routes.ts", "const routes = ['/b', '/a'];")
        self.commit_all()
        self.config["checks"][2]["comparison"] = "sequence"
        diff = next(x for x in self.run_report()["differences"] if x["dimension"] == "navigation")
        self.assertEqual(diff["missing_in_code"], {})
        self.assertNotEqual(diff["kb_values"], diff["code_values"])

    def test_multiset_detects_duplicates(self):
        self.write("code", "screen.html", '<cs-input name="name">Guardar</cs-input><cs-input />')
        self.commit_all()
        self.config["checks"][0]["comparison"] = "multiset"
        self.assertEqual(self.run_report()["differences"][0]["extra_in_code"], {"cs-input": 1})

    def test_comments_are_not_components(self):
        self.assertEqual(self.run_report()["status"], "MATCH")

    def test_angular_template_ignores_imports_and_comments(self):
        self.write("code", "page.ts", '// template: `cs-ghost`\n@Component({template: `<cs-input /> <!-- <cs-ghost/> -->`})')
        self.commit_all()
        selector = {"source": "code", "file": "page.ts", "format": "angular-template",
                    "region": r"\A(?P<body>[\s\S]*)\Z", "pattern": r"<(?P<value>cs-[\w-]+)\b"}
        source = parity.Source("code", self.config["sources"]["code"], self.root)
        items, _ = parity.extract(selector, {"code": source})
        self.assertEqual([x.value for x in items], ["cs-input"])
        self.assertEqual(items[0].location.line, 2)

    def test_new_package_without_script_changes(self):
        self.config["package"] = "another-package"
        for check in self.config["checks"]:
            check["screen"] = "SCR-999"
        self.config["screens"] = ["SCR-999"]
        self.assertEqual(self.run_report()["package"], "another-package")

    def test_untracked_config_blocked(self):
        path = self.config_path()
        self.git("code", "reset", "-q", "HEAD", "--", "package.json")
        with self.assertRaises(parity.EvidenceError):
            parity.run(path)

    def test_cli_zero_one_two(self):
        def cli():
            return subprocess.run([sys.executable, str(SCRIPT), "--config", str(self.config_path()), "--json"],
                                  capture_output=True, encoding="utf-8")
        self.assertEqual(cli().returncode, 0)
        self.write("code", "routes.ts", "const routes = ['/other'];")
        self.commit_all()
        result = cli()
        self.assertEqual(result.returncode, 1)
        self.assertEqual(json.loads(result.stdout)["status"], "DIVERGENT")
        self.config["checks"] = []
        result = cli()
        self.assertEqual(result.returncode, 2)
        self.assertEqual(json.loads(result.stdout)["status"], "BLOCKED")

    def historical(self, index, updated=False, navigation=False):
        cases = json.loads((SKILL / "tests/fixtures/regresiones-2026-11-18.json").read_text(encoding="utf-8"))
        case = cases[index]
        kb_selector = case["updated_kb_selector"] if updated else case["kb_selector"]
        if navigation:
            kb_selector = {**kb_selector, "pattern": r"(?P<value>Misma página, pestañas|Dos vistas en maestro-detalle)",
                           "aliases": {"Misma página, pestañas": "tabs", "Dos vistas en maestro-detalle": "master-detail"},
                           "allow_empty": False}
            case["code_selector"] = {**case["code_selector"], "pattern": r"@if \((?P<value>routeMagnitude)\(\)\)",
                                     "aliases": {"routeMagnitude": "master-detail"}, "allow_empty": False}
        excerpt = case["updated_kb_excerpt"] if updated else case["kb_excerpt"]
        self.write("kb", kb_selector["file"], excerpt["text"])
        self.write("code", case["code_selector"]["file"], case["code_excerpt"]["text"])
        self.commit_all()
        sources = {name: parity.Source(name, self.config["sources"][name], self.root) for name in ("kb", "code")}
        return parity.compare({"checks": [{"id": case["id"], "screen": case["id"],
                                          "dimension": "fields", "kb": [kb_selector],
                                          "code": [case["code_selector"]]}]}, sources)

    def test_real_scr055_detects_weight(self):
        self.assertEqual(self.historical(0)[0]["extra_in_code"], {"weightunit": 1})

    def test_real_scr053_detects_absent_accordion(self):
        self.assertEqual(self.historical(1)[0]["missing_in_code"], {"cs-accordion": 1})

    def test_real_uxr111_detects_two_menu_children(self):
        self.assertEqual(set(self.historical(2)[0]["extra_in_code"]), {"idiomas y monedas", "unidades de medida"})

    def test_real_scr053_tabs_versus_master_detail(self):
        result = self.historical(1, navigation=True)[0]
        self.assertEqual(result["missing_in_code"], {"tabs": 1})
        self.assertEqual(result["extra_in_code"], {"master-detail": 1})

    def test_updated_scr053_matches_declared_master_detail_branch(self):
        self.assertEqual(self.historical(1, True, navigation=True), [])

    def test_updated_scr055_matches_six_fields(self):
        self.assertEqual(self.historical(0, True), [])

    def test_updated_scr053_no_longer_requires_accordion(self):
        self.assertEqual(self.historical(1, True), [])

    def test_updated_uxr111_matches_menu_children(self):
        self.assertEqual(self.historical(2, True), [])


if __name__ == "__main__":
    unittest.main()
