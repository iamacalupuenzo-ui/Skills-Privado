"""Pruebas de scripts/validar_skill.py y scripts/medir_molde.py.

Correr desde la carpeta del skill: python -m unittest discover -s tests -v
Cada prueba copia el ejemplo resuelto a una carpeta temporal, lo rompe de una forma y
comprueba que el validador lo detecta con la regla correcta. No toca el repositorio.
"""
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "scripts"))
from medir_molde import medir  # noqa: E402
from validar_skill import main, validar  # noqa: E402

EJEMPLO = RAIZ / "examples" / "em-resumen-de-mr"


def reglas(hallazgos, nivel="ERROR"):
    return {h.regla for h in hallazgos if h.nivel == nivel}


class ConCopia(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.skill = self.tmp / "em-resumen-de-mr"
        shutil.copytree(EJEMPLO, self.skill)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def editar(self, relativo, viejo, nuevo):
        archivo = self.skill / relativo
        archivo.write_text(archivo.read_text(encoding="utf-8").replace(viejo, nuevo), encoding="utf-8")


class SkillBueno(ConCopia):
    def test_ejemplo_pasa_nivel_entregable(self):
        self.assertEqual(reglas(validar(self.skill, entregable=True)), set())

    def test_el_propio_constructor_pasa_nivel_entregable(self):
        self.assertEqual(reglas(validar(RAIZ, entregable=True)), set())

    def test_codigo_de_salida_cero(self):
        self.assertEqual(main([str(self.skill), "--entregable"]), 0)


class SkillRoto(ConCopia):
    def test_nombre_distinto_de_la_carpeta(self):
        self.editar("SKILL.md", "name: em-resumen-de-mr", "name: resumen-mr")
        self.assertIn("nombre", reglas(validar(self.skill, False)))

    def test_nombre_con_palabra_reservada(self):
        destino = self.tmp / "claude-resumen"
        self.skill.rename(destino)
        self.skill = destino
        self.editar("SKILL.md", "name: em-resumen-de-mr", "name: claude-resumen")
        self.editar("evals/evals.json", '"em-resumen-de-mr"', '"claude-resumen"')
        self.assertIn("nombre", reglas(validar(self.skill, False)))

    def test_descripcion_larga(self):
        self.editar("SKILL.md", "No abre, aprueba", "x" * 1100 + " No abre, aprueba")
        self.assertIn("descripcion", reglas(validar(self.skill, False)))

    def test_cuerpo_de_500_lineas(self):
        with (self.skill / "SKILL.md").open("a", encoding="utf-8") as f:
            f.write("línea\n" * 500)
        self.assertIn("tamano", reglas(validar(self.skill, False)))

    def test_cuerpo_largo_solo_avisa(self):
        with (self.skill / "SKILL.md").open("a", encoding="utf-8") as f:
            f.write("línea\n" * 60)
        hallazgos = validar(self.skill, False)
        self.assertNotIn("tamano", reglas(hallazgos))
        self.assertIn("tamano", reglas(hallazgos, "AVISO"))

    def test_referencia_inexistente(self):
        self.editar("SKILL.md", "references/formato-del-resumen.md", "references/no-existe.md")
        self.assertIn("referencias", reglas(validar(self.skill, False)))

    def test_referencia_en_subcarpeta(self):
        sub = self.skill / "references" / "extra"
        sub.mkdir()
        (sub / "detalle.md").write_text("# Detalle\n", encoding="utf-8")
        self.assertIn("profundidad", reglas(validar(self.skill, False)))

    def test_referencia_larga_sin_indice(self):
        (self.skill / "references" / "larga.md").write_text("# Larga\n" + "texto\n" * 120, encoding="utf-8")
        self.assertIn("indice", reglas(validar(self.skill, False)))

    def test_referencia_larga_con_indice_pasa(self):
        (self.skill / "references" / "larga.md").write_text("# Larga\n\n## Índice\n" + "texto\n" * 120, encoding="utf-8")
        self.assertNotIn("indice", reglas(validar(self.skill, False)))

    def test_lectura_total_al_iniciar(self):
        self.editar("SKILL.md", "## Detección de modo", "**LEER SIEMPRE AL INICIAR:** todo.\n\n## Detección de modo")
        self.assertIn("lectura", reglas(validar(self.skill, False)))

    def test_sin_evals(self):
        shutil.rmtree(self.skill / "evals")
        self.assertIn("evals", reglas(validar(self.skill, False)))

    def test_pocos_evals_y_sin_freno(self):
        archivo = self.skill / "evals" / "evals.json"
        datos = json.loads(archivo.read_text(encoding="utf-8"))
        datos["evals"] = [e for e in datos["evals"] if e["tipo"] == "ruta"]
        archivo.write_text(json.dumps(datos), encoding="utf-8")
        mensajes = [h.mensaje for h in validar(self.skill, False) if h.regla == "evals"]
        self.assertTrue(any("mínimo" in m for m in mensajes))
        self.assertTrue(any("frena" in m for m in mensajes))

    def test_evals_json_invalido(self):
        (self.skill / "evals" / "evals.json").write_text("{ roto", encoding="utf-8")
        self.assertIn("evals", reglas(validar(self.skill, False)))

    def test_entregable_sin_plantillas(self):
        shutil.rmtree(self.skill / "templates")
        self.assertNotIn("entregable", reglas(validar(self.skill, False)))
        self.assertIn("entregable", reglas(validar(self.skill, True)))

    def test_carpeta_sin_skill_md_sale_2(self):
        (self.skill / "SKILL.md").unlink()
        self.assertEqual(main([str(self.skill)]), 2)

    def test_errores_salen_1(self):
        self.editar("SKILL.md", "name: em-resumen-de-mr", "name: otro")
        self.assertEqual(main([str(self.skill)]), 1)


class MedirMolde(ConCopia):
    def test_ejemplo_tiene_las_seis_piezas(self):
        self.assertTrue(all(medir(self.skill).values()))

    def test_lectura_total_desmarca_referencias(self):
        self.editar("SKILL.md", "## Detección de modo", "LEER SIEMPRE AL INICIAR\n## Detección de modo")
        self.assertFalse(medir(self.skill)["Referencias por paso"])


if __name__ == "__main__":
    unittest.main()
