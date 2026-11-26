"""Prueba de scripts/decisiones-retiradas.mjs con una KB mínima (caso DH-659, 2026-11-26)."""
import pathlib, subprocess, tempfile, unittest

SCRIPT = pathlib.Path(__file__).resolve().parent.parent / "scripts" / "decisiones-retiradas.mjs"
DH = "| DH-900 | (2026-10-28) El isotipo se quita de la micro UI; su ampliación sería en otra versión (DEC-005-Q1) | BR-240; HU-01-09 |\n"


def kb(tmp, pregunta=None, aviso=None):
    r = pathlib.Path(tmp)
    (r / "requirements/context-packs").mkdir(parents=True)
    (r / "requirements/context-packs/RCP-001-cl2-flotas-estandar.md").write_text("| ID | Decisión | Fuente |\n" + DH, encoding="utf-8")
    (r / "design/ux-requirements").mkdir(parents=True)
    fila = pregunta or "| UXR-010-Q1 | Otra cosa | PO | Media | No | Abierta | - |\n"
    (r / "design/ux-requirements/UXR-010-x.md").write_text(fila, encoding="utf-8")
    (r / "avisos/management").mkdir(parents=True)
    if aviso:
        (r / "avisos/management/AVS-x.md").write_text(aviso, encoding="utf-8")
    return subprocess.run(["node", str(SCRIPT), "--kb", str(r)], capture_output=True, text=True, encoding="utf-8")


class DecisionesRetiradas(unittest.TestCase):
    def test_sin_pregunta_falla(self):
        with tempfile.TemporaryDirectory() as t:
            res = kb(t)
            self.assertEqual(res.returncode, 1, res.stdout)
            self.assertIn("[FALTA] DH-900", res.stdout)

    def test_diferida_sin_aviso_falla(self):
        with tempfile.TemporaryDirectory() as t:
            res = kb(t, pregunta="| UXR-010-Q8 | Isotipo | PO | Media | No | Diferida | DH-900 |\n")
            self.assertEqual(res.returncode, 1, res.stdout)
            self.assertIn("ningún aviso publicado", res.stdout)

    def test_diferida_con_aviso_publicado_pasa(self):
        with tempfile.TemporaryDirectory() as t:
            res = kb(t, pregunta="| UXR-010-Q8 | Isotipo | PO | Media | No | Diferida | DH-900 |\n", aviso='---\nstatus: "SENT"\n---\nDH-900\n')
            self.assertEqual(res.returncode, 0, res.stdout)

    def test_cerrada_pasa_sin_aviso(self):
        with tempfile.TemporaryDirectory() as t:
            res = kb(t, pregunta="| UXR-010-Q7 | Tipografías | PO | Media | No | Cerrada | DH-900 |\n")
            self.assertEqual(res.returncode, 0, res.stdout)


if __name__ == "__main__":
    unittest.main()
