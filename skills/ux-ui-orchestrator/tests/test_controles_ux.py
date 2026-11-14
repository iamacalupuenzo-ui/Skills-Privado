"""Pruebas de comportamiento de compuertas; no usan Notion ni repositorios de producto reales."""
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

import yaml

spec = importlib.util.spec_from_file_location("audit_ux", Path(__file__).parents[1] / "scripts" / "audit_ux.py")
audit_ux = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_ux)


class ControlesUX(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="compuertas-ux-")
        self.kb = Path(self.tmp.name)
        self.write("design/screens/SCR-901.md", "")
        self.fm = {"id": "SCR-901", "status": "draft", "tags": ["dsp-901"], "screens": [{"id": "SCR-901"}]}

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, ruta, texto):
        p = self.kb / ruta
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(texto, encoding="utf-8")

    def guardar(self):
        self.write("design/screens/SCR-901.md", "---\n" + yaml.safe_dump(self.fm, allow_unicode=True) + "---\n# SCR-901\n")

    def controles(self, **kwargs):
        self.guardar()
        return audit_ux.controlar_iteracion(self.kb, **kwargs)

    def codigos(self, **kwargs):
        return {c["codigo"] for c in self.controles(**kwargs) if c["nivel"] == "error"}

    def investigacion(self):
        self.fm["research"] = {"investigation": "INV-901", "decision": "DEC-901"}
        self.write("design/investigations/INV-901.md", "# Investigación SCR-901\n")
        self.write("design/decisiones/DEC-901.md", "# Decisión SCR-901\n")

    def implementacion(self):
        self.investigacion()
        self.fm["iteration"] = {"implementation_changed": True, "version": "version-901", "proposal": "design/propuesta.md",
                                "screenshot": "design/captura.png", "approved_by": "Enzo", "approved_at": "2026-11-14",
                                "documents": {k: f"design/{k}-901.md" for k in ("UXR", "FLW", "SCR", "DEC")}}
        for k, f in self.fm["iteration"]["documents"].items():
            self.write(f, f"# {k}-901\n")
        self.write("design/propuesta.md", "# Propuesta de cambios UXR-901 FLW-901 SCR-901 DEC-901\n")
        self.write("design/captura.png", "Captura de prueba")
        self.fm["validation"] = {"by": "Enzo", "date": "2026-11-14", "browser": "http://localhost", "version": "version-901",
                                 "screenshot": "design/captura.png", "accessibility": {"target": "implemented", "status": "pass",
                                 "report": "design/accessibility/ARP-901.md", "version": "version-901"}}
        self.write("design/accessibility/ARP-901.md", "---\na11y_review: {screen: SCR-901, target: implemented, result: pass, version: version-901}\n---\nSCR-901 version-901\n")

    def test_borrador_sin_investigacion_avisa(self):
        self.assertTrue(self.controles())
        self.assertEqual(self.codigos(), set())

    def test_g3_sin_inv_dec_bloquea(self):
        self.assertIn("SCR_SIN_INV_DEC", self.codigos(compuerta="G3"))

    def test_inv_dec_de_otra_pantalla_no_pasa(self):
        self.investigacion()
        self.write("design/investigations/INV-901.md", "# SCR-902\n")
        self.assertIn("SCR_SIN_INV_DEC", self.codigos(compuerta="G3"))

    def test_g3_con_investigacion_pasa(self):
        self.investigacion()
        self.assertEqual(self.codigos(compuerta="G3"), set())

    def test_validado_sin_captura_bloquea(self):
        self.implementacion()
        self.fm["status"] = "validated"
        del self.fm["validation"]["screenshot"]
        self.assertIn("VALIDADO_SIN_PRUEBA", self.codigos())

    def test_validado_sin_enzo_bloquea(self):
        self.implementacion()
        self.fm["status"] = "validated"
        self.fm["validation"]["by"] = "IA"
        self.assertIn("VALIDADO_SIN_PRUEBA", self.codigos())

    def test_validado_con_arp_de_figma_bloquea(self):
        self.implementacion()
        self.fm["status"] = "validated"
        self.fm["validation"]["accessibility"]["target"] = "figma-node"
        self.assertIn("VALIDADO_SIN_A11Y_IMPLEMENTADA", self.codigos())

    def test_validado_con_arp_de_otra_version_bloquea(self):
        self.implementacion()
        self.fm["status"] = "validated"
        self.fm["validation"]["accessibility"]["version"] = "version-900"
        self.assertIn("VALIDADO_SIN_A11Y_IMPLEMENTADA", self.codigos())

    def test_arp_declarado_pass_pero_informe_fallido_bloquea(self):
        self.implementacion()
        self.fm["status"] = "validated"
        self.write("design/accessibility/ARP-901.md", "---\na11y_review: {screen: SCR-901, target: implemented, result: fail, version: version-901}\n---\nSCR-901 version-901\n")
        self.assertIn("VALIDADO_SIN_A11Y_IMPLEMENTADA", self.codigos())

    def test_validado_con_evidencia_pasa_sin_figma(self):
        self.implementacion()
        self.fm["status"] = "validated"
        self.assertEqual(self.codigos(), set())
        self.assertEqual(audit_ux.controlar_compuerta(self.kb, "G6"), [])

    def test_iteracion_sin_propuesta_bloquea(self):
        self.implementacion()
        del self.fm["iteration"]["proposal"]
        self.assertIn("ITERACION_SIN_PROPUESTA_CAPTURA", self.codigos())

    def test_iteracion_sin_uxr_flw_scr_dec_bloquea(self):
        self.implementacion()
        del self.fm["iteration"]["documents"]["DEC"]
        self.assertIn("ITERACION_SIN_PROPUESTA_CAPTURA", self.codigos())

    def test_iteracion_sin_aprobacion_bloquea(self):
        self.implementacion()
        del self.fm["iteration"]["approved_by"]
        self.assertIn("ITERACION_SIN_APROBACION", self.codigos())

    def test_g5_exige_arp_durante_construccion(self):
        self.investigacion()
        self.fm["status"] = "in_construction"
        self.assertIn("CONSTRUCCION_SIN_ARP", self.codigos(compuerta="G5"))

    def test_g4_exige_capturas_de_cualquier_herramienta(self):
        self.write("design/explorations/IB-901.md", "---\nid: IB-901\ntool: codigo\nstatus: draft\n---\n")
        self.assertIn("EXPLORACION_SIN_CAPTURA", self.codigos(compuerta="G4"))
        self.write("design/explorations/captura.png", "Captura")
        self.write("design/explorations/IB-901.md", "---\nid: IB-901\ntool: Figma\ncaptures: [design/explorations/captura.png]\n---\n")
        self.assertNotIn("EXPLORACION_SIN_CAPTURA", self.codigos(compuerta="G4"))

    def test_cierre_sin_conciliacion_bloquea(self):
        self.assertIn("CONCILIACION_INCOMPLETA", self.codigos(cerrar=True))

    def test_cierre_con_diferencias_bloquea(self):
        self.write("conciliacion.json", json.dumps({"soloLectura": True, "completo": True, "abiertas": 1, "diferencias": [{"tipo": "a"}]}))
        self.assertIn("CONCILIACION_PENDIENTE", self.codigos(cerrar=True, conciliacion=self.kb / "conciliacion.json"))

    def test_conciliacion_obsoleta_bloquea(self):
        self.write("conciliacion.json", json.dumps({"soloLectura": True, "completo": True, "abiertas": 0, "diferencias": [], "kb": {"commit": "anterior"}}))
        self.assertIn("CONCILIACION_DESACTUALIZADA", self.codigos(cerrar=True, conciliacion=self.kb / "conciliacion.json"))

    def test_archivo_fuera_del_kb_no_sirve_como_captura(self):
        self.implementacion()
        self.fm["status"] = "validated"
        self.fm["validation"]["screenshot"] = "../captura.png"
        self.assertIn("VALIDADO_SIN_PRUEBA", self.codigos())

    def test_advertencia_borrador_con_construccion(self):
        self.write("conciliacion.json", json.dumps({"construccion": {"advertencias": [{"id": "FLW-901", "mensaje": "Hay código"}]}}))
        controles = self.controles(conciliacion=self.kb / "conciliacion.json")
        self.assertTrue(any(c["codigo"] == "ARTEFACTO_BORRADOR_CON_CONSTRUCCION" and c["nivel"] == "aviso" for c in controles))

    def test_cascada_pendiente_bloquea_el_cierre(self):
        self.write("conciliacion.json", json.dumps({"cascada": {"propuestas": [{"id": "UXR-901", "propuesto": "Aprobado"}]}}))
        self.assertIn("CASCADA_PENDIENTE", self.codigos(cerrar=True, conciliacion=self.kb / "conciliacion.json"))

    def test_g0_y_g7_no_avanzan_sin_artefactos(self):
        self.assertTrue(audit_ux.controlar_compuerta(self.kb, "G0"))
        self.assertTrue(audit_ux.controlar_compuerta(self.kb, "G7"))


if __name__ == "__main__":
    unittest.main()
