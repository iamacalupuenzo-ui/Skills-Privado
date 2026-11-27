"""Pruebas de simular_fusion.py con repositorios de git temporales.

Correr desde la carpeta del skill:
    python -m unittest discover -s scripts/tests -v
"""

from __future__ import annotations

import io
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import simular_fusion as sf  # noqa: E402


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


class Simulacion(unittest.TestCase):
    def setUp(self) -> None:
        self.dir = Path(tempfile.mkdtemp(prefix="simular-fusion-"))
        self.repo = self.dir / "repo"
        self.repo.mkdir()
        git(self.repo, "init", "-q", "-b", "develop")
        self.commit({"a.txt": "uno\ndos\ntres\n", "b.txt": "base\n"}, "base")
        # integration: cambia a.txt y agrega c.txt
        git(self.repo, "checkout", "-q", "-b", "integration")
        self.commit({"a.txt": "UNO de integration\ndos\ntres\n", "c.txt": "integration\n"}, "integration")
        # CLF_121 desde develop: choca en a.txt y agrega c.txt distinto (add/add)
        git(self.repo, "checkout", "-q", "-b", "CLF_121", "develop")
        self.commit({"a.txt": "UNO de la 121\ndos\ntres\n", "c.txt": "121\n"}, "121")
        # CLF_123 apilada sobre CLF_121
        git(self.repo, "checkout", "-q", "-b", "CLF_123")
        self.commit({"d.txt": "123\n"}, "123")
        # CLF_116 desde develop: no choca
        git(self.repo, "checkout", "-q", "-b", "CLF_116", "develop")
        self.commit({"b.txt": "base\n116\n"}, "116")
        git(self.repo, "checkout", "-q", "develop")
        for rama in ("integration", "CLF_121", "CLF_123", "CLF_116"):
            git(self.repo, "update-ref", f"refs/remotes/origin/{rama}", rama)

    def tearDown(self) -> None:
        borrar(self.dir)

    def commit(self, archivos: dict[str, str], mensaje: str) -> None:
        for nombre, texto in archivos.items():
            (self.repo / nombre).write_text(texto, encoding="utf-8")
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-q", "-m", mensaje)

    def correr(self, *args: str) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            codigo = sf.main([str(self.repo), "--sin-fetch", *args])
        return codigo, out.getvalue(), err.getvalue()

    def test_detecta_choques_y_sale_1(self) -> None:
        informe = sf.simular(str(self.repo), ["CLF_121"], fetch=False)
        choques = dict(informe.resultados[0].choques)
        self.assertEqual(set(choques), {"a.txt", "c.txt"})
        self.assertEqual(choques["c.txt"], "add/add")
        self.assertEqual(informe.codigo, 1)

    def test_rama_sin_choques_sale_0(self) -> None:
        codigo, salida, _ = self.correr("CLF_116")
        self.assertEqual(codigo, 0, salida)
        self.assertIn("sin choques", salida)

    def test_cuenta_commits_propios_y_de_la_base(self) -> None:
        r = sf.simular(str(self.repo), ["CLF_123"], fetch=False).resultados[0]
        self.assertEqual((r.propios, r.base_adelante), (2, 1))

    def test_detecta_la_cadena_apilada(self) -> None:
        informe = sf.simular(str(self.repo), ["CLF_123", "CLF_116", "CLF_121"], fetch=False)
        self.assertEqual(informe.cadenas, [["CLF_121", "CLF_123"]])

    def test_avisa_si_la_local_difiere_de_la_remota(self) -> None:
        git(self.repo, "checkout", "-q", "CLF_116")
        self.commit({"e.txt": "local\n"}, "sin subir")
        git(self.repo, "checkout", "-q", "develop")
        r = sf.simular(str(self.repo), ["CLF_116"], fetch=False).resultados[0]
        self.assertEqual(r.ref, "origin/CLF_116")
        self.assertIn("local +1", r.aviso)

    def test_no_modifica_ramas_ni_arbol(self) -> None:
        antes = (git(self.repo, "for-each-ref"), git(self.repo, "status", "--porcelain"), git(self.repo, "rev-parse", "HEAD"))
        sf.simular(str(self.repo), ["CLF_121", "CLF_123", "CLF_116"], fetch=False)
        despues = (git(self.repo, "for-each-ref"), git(self.repo, "status", "--porcelain"), git(self.repo, "rev-parse", "HEAD"))
        self.assertEqual(antes, despues)

    def test_rama_inexistente_sale_2(self) -> None:
        codigo, _, err = self.correr("no-existe")
        self.assertEqual(codigo, 2)
        self.assertIn("no existe", err)

    def test_base_inexistente_sale_2(self) -> None:
        codigo, _, err = self.correr("--base", "origin/nada", "CLF_116")
        self.assertEqual(codigo, 2)

    def test_fetch_fallido_se_declara(self) -> None:
        informe = sf.simular(str(self.repo), ["CLF_116"], fetch=True)  # no hay remoto «origin» configurado
        self.assertTrue(any("fetch" in n for n in informe.notas))


if __name__ == "__main__":
    unittest.main()
