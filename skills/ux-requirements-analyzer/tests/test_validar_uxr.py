import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "scripts"))
import validar_uxr  # noqa: E402

EJEMPLO = (RAIZ / "examples" / "UXR-140-resumido.md").read_text(encoding="utf-8")


def validar_texto(texto: str, nombre: str = "UXR-140-personalizar.md"):
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / nombre
        p.write_text(texto, encoding="utf-8")
        return validar_uxr.validar(p)


class ValidarUxr(unittest.TestCase):
    def test_ejemplo_pasa_sin_errores(self):
        errores, _ = validar_texto(EJEMPLO)
        self.assertEqual(errores, [])

    def test_plantilla_tiene_las_secciones(self):
        plantilla = (RAIZ / "templates" / "UXR.plantilla.md").read_text(encoding="utf-8")
        _, avisos = validar_texto(plantilla.replace("UXR-NNN", "UXR-140").replace("dsp-NNN", "dsp-009").replace("HU-NN-NN", "HU-01-14"))
        self.assertFalse([a for a in avisos if "sección" in a])

    def test_sin_etiqueta_dsp_es_error(self):
        errores, _ = validar_texto(EJEMPLO.replace(", dsp-009]", "]"))
        self.assertTrue(any("dsp-NNN" in e for e in errores))

    def test_status_aprobado_es_error(self):
        errores, _ = validar_texto(EJEMPLO.replace("status: draft", "status: approved"))
        self.assertTrue(any("B7" in e for e in errores))

    def test_id_distinto_del_archivo_es_error(self):
        errores, _ = validar_texto(EJEMPLO, nombre="UXR-141-otro.md")
        self.assertTrue(any("no coincide" in e for e in errores))

    def test_hex_y_px_son_error(self):
        texto = EJEMPLO.replace("## Requisito\n", "## Requisito\n\nBotón #2563EB de 44px.\n")
        errores, _ = validar_texto(texto)
        self.assertTrue(any("#2563EB" in e for e in errores))
        self.assertTrue(any("44px" in e for e in errores))

    def test_hex_dentro_de_bloque_de_codigo_no_cuenta(self):
        texto = EJEMPLO.replace("## Requisito\n", "## Requisito\n\n```\ncolor: #2563EB\n```\n")
        errores, _ = validar_texto(texto)
        self.assertFalse(any("#2563EB" in e for e in errores))

    def test_falta_seccion_obligatoria_es_error(self):
        errores, _ = validar_texto(EJEMPLO.replace("## Estados requeridos", "## Estados"))
        self.assertTrue(any("Estados requeridos" in e for e in errores))

    def test_sin_historia_en_sources_es_error(self):
        texto = EJEMPLO.replace("  - id: HU-01-14\n", "  - id: XX-01-14\n").replace("  - id: HU-01-09\n", "  - id: XX-01-09\n")
        errores, _ = validar_texto(texto)
        self.assertTrue(any("B2" in e for e in errores))

    def test_sigla_citada_fuera_de_sources_es_aviso(self):
        _, avisos = validar_texto(EJEMPLO.replace("(BR-241)", "(BR-241; DEC-099)"))
        self.assertTrue(any("DEC-099" in a for a in avisos))

    def test_pregunta_con_id_ajeno_es_aviso(self):
        _, avisos = validar_texto(EJEMPLO.replace("| UXR-140-Q2 |", "| Q2 |"))
        self.assertTrue(any("`Q2`" in a for a in avisos))

    def test_main_devuelve_1_con_errores(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "UXR-140-x.md"
            p.write_text(EJEMPLO.replace(", dsp-009]", "]"), encoding="utf-8")
            self.assertEqual(validar_uxr.main([str(p)]), 1)


if __name__ == "__main__":
    unittest.main()
