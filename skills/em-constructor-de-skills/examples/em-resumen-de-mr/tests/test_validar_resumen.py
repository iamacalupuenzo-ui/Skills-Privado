import sys
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "scripts"))
from validar_resumen import validar  # noqa: E402


class ValidarResumen(unittest.TestCase):
    def test_ejemplo_resuelto_pasa(self):
        texto = (RAIZ / "examples" / "resumen-ejemplo.md").read_text(encoding="utf-8")
        self.assertEqual(validar(texto), [])

    def test_falta_seccion(self):
        self.assertTrue(any("Pendiente" in e for e in validar("## Qué cambia\n## Por qué\n## Cómo se verificó\nSin verificar\n")))

    def test_verificacion_vaga(self):
        texto = "## Qué cambia\nx\n## Por qué\ny\n## Cómo se verificó\nprobado\n## Pendiente\nNada\n"
        self.assertTrue(any("comando ni cifra" in e for e in validar(texto)))

    def test_sin_verificar_es_valido(self):
        texto = "## Qué cambia\nx\n## Por qué\ny\n## Cómo se verificó\nSin verificar\n## Pendiente\nNada\n"
        self.assertEqual(validar(texto), [])


if __name__ == "__main__":
    unittest.main()
