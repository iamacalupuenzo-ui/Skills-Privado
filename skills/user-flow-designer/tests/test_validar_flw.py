import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "scripts"))
import validar_flw  # noqa: E402

EJEMPLO = (RAIZ / "examples" / "FLW-052-resumido.md").read_text(encoding="utf-8")


def validar_texto(texto: str, nombre: str = "FLW-052-identidad.md"):
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / nombre
        p.write_text(texto, encoding="utf-8")
        return validar_flw.validar(p)


class ValidarFlw(unittest.TestCase):
    def test_ejemplo_pasa_sin_errores_ni_avisos(self):
        self.assertEqual(validar_texto(EJEMPLO), ([], []))

    def test_plantilla_tiene_las_secciones(self):
        plantilla = (RAIZ / "templates" / "FLW.plantilla.md").read_text(encoding="utf-8")
        texto = plantilla.replace("FLW-NNN", "FLW-052").replace("dsp-NNN", "dsp-009").replace("HU-NN-NN", "HU-01-14").replace("UXR-NNN", "UXR-140").replace("SCR-NNN", "SCR-092")
        errores, _ = validar_texto(texto)
        self.assertEqual(errores, [])

    def test_sin_etiqueta_dsp_es_error(self):
        errores, _ = validar_texto(EJEMPLO.replace(", dsp-009]", "]"))
        self.assertTrue(any("dsp-NNN" in e for e in errores))

    def test_requirements_sin_uxr_es_error(self):
        errores, _ = validar_texto(EJEMPLO.replace("requirements: [HU-01-14, UXR-140, UXR-010, UXR-012]", "requirements: [HU-01-14]"))
        self.assertTrue(any("ningún UXR" in e for e in errores))

    def test_requirements_en_lista_de_bloque(self):
        texto = EJEMPLO.replace("requirements: [HU-01-14, UXR-140, UXR-010, UXR-012]", "requirements:\n  - HU-01-14\n  - UXR-140")
        errores, _ = validar_texto(texto)
        self.assertEqual(errores, [])

    def test_sin_screens_es_error_y_vacio_es_aviso(self):
        errores, _ = validar_texto(EJEMPLO.replace("screens: [SCR-092, SCR-093, SCR-094]\n", ""))
        self.assertTrue(any("screens" in e for e in errores))
        errores, avisos = validar_texto(EJEMPLO.replace("[SCR-092, SCR-093, SCR-094]", "[]"))
        self.assertEqual(errores, [])
        self.assertTrue(any("vacío" in a for a in avisos))

    def test_screens_con_comentario_yaml(self):
        texto = EJEMPLO.replace("screens: [SCR-092, SCR-093, SCR-094]", "screens:\n  - SCR-092   # Editor (propuesto)")
        errores, _ = validar_texto(texto)
        self.assertEqual(errores, [])

    def test_pendiente_sin_id_es_error(self):
        errores, _ = validar_texto(EJEMPLO.replace("[PENDIENTE: UXR-140-Q1]", "[PENDIENTE]"))
        self.assertTrue(any("B4" in e for e in errores))

    def test_sin_mermaid_es_error(self):
        errores, _ = validar_texto(EJEMPLO.replace("```mermaid", "```text"))
        self.assertTrue(any("mermaid" in e for e in errores))

    def test_falta_camino_feliz_es_error(self):
        errores, _ = validar_texto(EJEMPLO.replace("## 5. Camino feliz", "## 5. Pasos"))
        self.assertTrue(any("Camino feliz" in e for e in errores))

    def test_layout_en_el_flujo_es_error(self):
        errores, _ = validar_texto(EJEMPLO.replace("## 3. Supuestos", "Botón #2563EB de 44px.\n\n## 3. Supuestos"))
        self.assertTrue(any("#2563EB" in e for e in errores))
        self.assertTrue(any("44px" in e for e in errores))

    def test_status_aprobado_es_error(self):
        errores, _ = validar_texto(EJEMPLO.replace("status: draft", "status: approved"))
        self.assertTrue(any("B10" in e for e in errores))

    def test_main_devuelve_1_con_errores(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "FLW-052-x.md"
            p.write_text(EJEMPLO.replace("status: draft", "status: approved"), encoding="utf-8")
            self.assertEqual(validar_flw.main([str(p)]), 1)


if __name__ == "__main__":
    unittest.main()
