"""Pruebas de puertas.py con un repo de git temporal cuyas puertas son scripts de Node.

Correr desde la carpeta del skill:
    python -m unittest discover -s scripts/tests -v
"""

from __future__ import annotations

import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import puertas as pu  # noqa: E402

LOCK = {"name": "demo", "version": "1.0.0", "lockfileVersion": 3, "requires": True,
        "packages": {"": {"name": "demo", "version": "1.0.0"}}}

PASA_LINT = "console.log('All files pass linting.');\n"
FALLA_LINT = "console.log('\\u2716 2 problems (2 errors, 0 warnings)'); process.exit(1);\n"
PRUEBAS_OK = "console.log(' Test Files  4 passed (4)'); console.log('      Tests  12 passed (12)');\n"
# Falla la primera vez en cada carpeta y pasa la segunda: una prueba inestable.
PRUEBAS_INESTABLES = (
    "const fs = require('fs'); const f = 'contador.txt';\n"
    "const n = fs.existsSync(f) ? Number(fs.readFileSync(f, 'utf8')) : 0; fs.writeFileSync(f, String(n + 1));\n"
    "if (n === 0) { console.log('      Tests  1 failed | 11 passed (12)'); process.exit(1); }\n"
    "console.log('      Tests  12 passed (12)');\n"
)
COBERTURA_BAJA = (
    "console.log('All files |   85.1 |    70.2 |   78.86 |   85.3 |');\n"
    "console.log('ERROR: Coverage for functions (78.86%) does not meet global threshold (80%)'); process.exit(1);\n"
)
BUILD_OK = "console.log('Application bundle generation complete. [3.1 seconds]');\n"
BUILD_FALLA = "console.log('\\u2718 [ERROR] TS2322: Type x is not assignable'); process.exit(1);\n"


def git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), "-c", "user.name=prueba", "-c", "user.email=prueba@example.com", *args],
        check=True, capture_output=True, text=True,
    ).stdout


def borrar(ruta: Path) -> None:
    def forzar(funcion, destino, _error):
        os.chmod(destino, 0o700)
        funcion(destino)

    if sys.version_info >= (3, 12):
        shutil.rmtree(ruta, onexc=forzar)
    else:
        shutil.rmtree(ruta, onerror=forzar)


class Cifras(unittest.TestCase):
    def test_vitest_lint_cobertura_y_build(self) -> None:
        texto = (" Test Files  3 passed (3)\n      Tests  2 failed | 225 passed (227)\n"
                 "✖ 3 problems (2 errors, 1 warning)\n"
                 "All files |   85.1 |    70.2 |   78.86 |   85.3 |\n"
                 "ERROR: Coverage for functions (78.86%) does not meet global threshold (80%)\n")
        r = pu.cifras(texto)
        for esperado in ("Tests: 2 failed | 225 passed (227)", "lint: 2 errores, 1 avisos",
                         "funciones 78.86 %", "cobertura de functions 78.86 % < umbral 80 %"):
            self.assertIn(esperado, r)

    def test_karma_y_node_test(self) -> None:
        self.assertIn("Karma: 120 de 120 SUCCESS", pu.cifras("Executed 120 of 120 SUCCESS (1.2 secs / 1 sec)"))
        self.assertIn("pass 10", pu.cifras("# pass 10\n# fail 0\n"))

    def test_sin_cifras(self) -> None:
        self.assertIn("sin cifras", pu.cifras("hola"))

    def test_error_de_esbuild_en_windows(self) -> None:
        texto = "X [ERROR] TS2322: Type '\"neutral\"' is not assignable to type 'ButtonVariant'.\n" \
                "X [ERROR] TS2345: Argument of type x\n"
        self.assertIn("2 errores de compilación (TS2322, TS2345)", pu.cifras(texto))

    def test_umbral_de_angular_json(self) -> None:
        carpeta = Path(tempfile.mkdtemp(prefix="umbral-"))
        try:
            (carpeta / "angular.json").write_text(json.dumps({"projects": {"x": {"architect": {"test": {
                "options": {"coverageThresholds": {"functions": 80}}}}}}}), encoding="utf-8")
            self.assertEqual(pu.umbrales(str(carpeta)), {"functions": 80})
        finally:
            borrar(carpeta)


class Puertas(unittest.TestCase):
    def setUp(self) -> None:
        self.dir = Path(tempfile.mkdtemp(prefix="puertas-"))
        self.repo = self.dir / "repo"
        self.repo.mkdir()
        git(self.repo, "init", "-q", "-b", "develop")
        self.commit({"lint.js": FALLA_LINT, "test.js": PRUEBAS_OK, "build.js": BUILD_OK}, "base")
        git(self.repo, "branch", "integration")
        git(self.repo, "update-ref", "refs/remotes/origin/integration", "integration")
        git(self.repo, "checkout", "-q", "-b", "CLF_1")
        self.commit({"test.js": PRUEBAS_INESTABLES, "build.js": BUILD_FALLA}, "rama")
        git(self.repo, "checkout", "-q", "develop")
        self.trabajo = self.dir / "trabajo"

    def tearDown(self) -> None:
        borrar(self.dir)

    def commit(self, scripts: dict[str, str], mensaje: str, sin_build: bool = False) -> None:
        paquete = {"name": "demo", "version": "1.0.0", "scripts": {
            "lint": "node lint.js", "test:ci": "node test.js", "build": "node build.js"}}
        (self.repo / "package.json").write_text(json.dumps(paquete), encoding="utf-8")
        (self.repo / "package-lock.json").write_text(json.dumps(LOCK), encoding="utf-8")
        for nombre, texto in scripts.items():
            (self.repo / nombre).write_text(texto, encoding="utf-8")
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-q", "-m", mensaje)

    def test_separa_previas_nuevas_e_inestables(self) -> None:
        antes = git(self.repo, "status", "--porcelain") + git(self.repo, "rev-parse", "HEAD")
        resultados = pu.puertas(str(self.repo), ["CLF_1"], "origin/integration", trabajo=str(self.trabajo))
        estados = {c.puerta: c.estado for c in resultados[0].corridas}
        self.assertEqual(estados, {"lint": "ya-fallaba", "test:ci": "inestable", "build": "falla-nueva"})
        self.assertEqual(pu.codigo(resultados), 1)
        self.assertEqual(antes, git(self.repo, "status", "--porcelain") + git(self.repo, "rev-parse", "HEAD"))
        informe = pu.formatear(resultados, str(self.repo))
        self.assertIn("ya fallaba en la base", informe)
        self.assertIn("1 errores de compilación", informe)

    def test_todo_verde_sale_0_y_omite_puertas_ausentes(self) -> None:
        git(self.repo, "checkout", "-q", "-b", "verde", "develop")
        self.commit({"lint.js": PASA_LINT}, "verde")
        git(self.repo, "checkout", "-q", "develop")
        resultados = pu.puertas(str(self.repo), ["verde"], "origin/integration",
                                lista=["lint", "test:rules", "test:ci"], trabajo=str(self.trabajo))
        self.assertEqual(pu.codigo(resultados), 0)
        self.assertTrue(any("test:rules" in n for n in resultados[0].notas))

    def test_cobertura_bajo_el_umbral(self) -> None:
        git(self.repo, "checkout", "-q", "-b", "cobertura", "develop")
        self.commit({"lint.js": PASA_LINT, "test.js": COBERTURA_BAJA}, "cobertura")
        git(self.repo, "checkout", "-q", "develop")
        resultados = pu.puertas(str(self.repo), ["cobertura"], None, lista=["test:ci"], trabajo=str(self.trabajo))
        c = resultados[0].corridas[0]
        self.assertEqual(c.estado, "falla")
        self.assertIn("< umbral 80 %", c.cifras)

    def test_plan_no_ejecuta(self) -> None:
        out = io.StringIO()
        with redirect_stdout(out):
            self.assertEqual(pu.main([str(self.repo), "--refs", "CLF_1", "--plan"]), 0)
        self.assertIn("lint, test:ci, build", out.getvalue())
        self.assertFalse(self.trabajo.exists())

    def test_ref_inexistente_sale_2(self) -> None:
        err = io.StringIO()
        with redirect_stdout(io.StringIO()), redirect_stderr(err):
            self.assertEqual(pu.main([str(self.repo), "--refs", "no-existe", "--plan"]), 2)


if __name__ == "__main__":
    unittest.main()
