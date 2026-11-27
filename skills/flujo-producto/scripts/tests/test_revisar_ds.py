"""Pruebas de revisar_ds.py sin red: el registro y el paquete se inyectan.

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

import revisar_ds as rd  # noqa: E402

REGISTRO = {
    "dist-tags": {"latest": "1.17.0", "pre": "1.17.0-pre.157"},
    "versions": ["1.16.0", "1.17.0-pre.157", "1.17.0", "1.18.0-pre.3"],
}

PAQUETE = {
    "package/package.json": json.dumps({"exports": {"./button": {}, "./illustrations": {}, "./icons": {}}}),
    "package/types/comsatel-ui-components-button.d.ts": (
        "type ButtonVariant = 'primary' | 'secondary' | 'default';\n"
        "declare class Button {\n"
        "    readonly variant: _angular_core.InputSignal<ButtonVariant>;\n"
        "    readonly size: _angular_core.InputSignal<'sm' | 'md'>;\n"
        "    static ɵcmp: i0.ɵɵComponentDeclaration<Button, \"cs-button\", never, {}, {}, never, never, true, never>;\n"
        "}\n"
    ),
    "package/types/comsatel-ui-components-illustrations.d.ts": (
        "type IllustrationName = 'no-access' | 'load-error';\n"
        "declare class Illustration {\n"
        "    name: IllustrationName;\n"
        "    static ɵcmp: i0.ɵɵComponentDeclaration<Illustration, \"cs-illustration\", never, {}, {}, never, never, true, never>;\n"
        "}\n"
    ),
    "package/types/comsatel-ui-components-empty-state.d.ts": (
        "type IndicatorIllustrationName = Extract<IllustrationName, `documents-${string}`>;\n"
        "type StateIllustrationName = Exclude<IllustrationName, IndicatorIllustrationName>;\n"
        "declare class EmptyState {\n"
        "    illustration?: StateIllustrationName;\n"
        "    static ɵcmp: i0.ɵɵComponentDeclaration<EmptyState, \"cs-empty-state\", never, {}, {}, never, never, true, never>;\n"
        "}\n"
    ),
    "package/fesm2022/comsatel-ui-components-icons.mjs": "const ICONS = { 'rotate-ccw': 1, 'map-pin': 2 };\n",
}

PAGINA = """import { Button } from '@comsatel/ui-components/button';
import { Illustration, type IllustrationName } from '@comsatel/ui-components/illustrations';
@Component({ selector: 'mon-x', template: `<cs-button variant="%s" size="sm">x</cs-button><cs-illustration [name]="art()" />` })
export class X {
  art(): IllustrationName { return this.ok ? 'load-error' : 'fleet-load-error'; }
  icono = this.a ? 'rotate-ccw' : 'map-pin';
}
"""


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


class RevisarDS(unittest.TestCase):
    def setUp(self) -> None:
        self.dir = Path(tempfile.mkdtemp(prefix="revisar-ds-"))
        self.repo = self.crear("micro", "1.17.0", variante="primary")

    def tearDown(self) -> None:
        borrar(self.dir)

    def crear(self, nombre: str, version: str, variante: str = "primary", lock: str | None = None) -> Path:
        repo = self.dir / nombre
        (repo / "src/app").mkdir(parents=True)
        (repo / "package.json").write_text(json.dumps({"dependencies": {"@comsatel/ui-components": version}}), encoding="utf-8")
        (repo / "package-lock.json").write_text(json.dumps(
            {"packages": {"node_modules/@comsatel/ui-components": {"version": lock or version.lstrip("^~")}}}), encoding="utf-8")
        (repo / "src/app/x.page.ts").write_text(PAGINA % variante, encoding="utf-8")
        git(repo, "init", "-q", "-b", "main")
        git(repo, "add", "-A")
        git(repo, "commit", "-q", "-m", "base")
        return repo

    def revisar(self, repo: Path, **kw) -> rd.Informe:
        kw.setdefault("registro_json", REGISTRO)
        kw.setdefault("paquete", PAQUETE)
        return rd.revisar(str(repo), **kw)

    def test_version_estable_exacta_sin_hallazgos(self) -> None:
        informe = self.revisar(self.repo)
        self.assertEqual(informe.hallazgos, [], informe.hallazgos)
        self.assertEqual(informe.codigo, 0)

    def test_rango_no_exacto_es_hallazgo(self) -> None:
        repo = self.crear("rango", "^1.17.0")
        informe = self.revisar(repo)
        self.assertTrue(any("versión exacta" in h for h in informe.hallazgos))

    def test_prerelease_superada_por_estable(self) -> None:
        repo = self.crear("pre", "1.17.0-pre.157")
        informe = self.revisar(repo)
        self.assertTrue(any("ya está publicada la estable 1.17.0" in h for h in informe.hallazgos))
        self.assertEqual(informe.objetivo, "1.17.0")

    def test_prerelease_sin_estable_no_es_hallazgo(self) -> None:
        repo = self.crear("pre18", "1.18.0-pre.3")
        informe = self.revisar(repo, piezas=False)
        self.assertEqual(informe.hallazgos, [])

    def test_version_no_publicada(self) -> None:
        repo = self.crear("fantasma", "1.19.0")
        informe = self.revisar(repo, piezas=False)
        self.assertTrue(any("no está publicada" in h for h in informe.hallazgos))

    def test_lock_desalineado(self) -> None:
        repo = self.crear("lock", "1.17.0", lock="1.16.0")
        self.assertTrue(any("package-lock.json resuelve 1.16.0" in h for h in self.revisar(repo, piezas=False).hallazgos))

    def test_pareja_con_otra_version(self) -> None:
        shell = self.crear("shell", "1.16.0")
        informe = self.revisar(self.repo, parejas=[str(shell)], piezas=False)
        self.assertTrue(any("Deben ser iguales" in h for h in informe.hallazgos))

    def test_pareja_en_una_ref(self) -> None:
        shell = self.crear("shell2", "1.17.0")
        git(shell, "checkout", "-q", "-b", "vieja")
        (shell / "package.json").write_text(json.dumps({"dependencies": {"@comsatel/ui-components": "1.16.0"}}), encoding="utf-8")
        git(shell, "commit", "-q", "-am", "vieja")
        git(shell, "checkout", "-q", "main")
        self.assertEqual(self.revisar(self.repo, parejas=[f"{shell}@main"], piezas=False).hallazgos, [])
        self.assertTrue(self.revisar(self.repo, parejas=[f"{shell}@vieja"], piezas=False).hallazgos)

    def test_variante_que_no_existe_en_la_version(self) -> None:
        repo = self.crear("neutral", "1.17.0", variante="neutral")
        informe = self.revisar(repo)
        self.assertTrue(any('variant="neutral"' in h for h in informe.hallazgos), informe.hallazgos)

    def test_input_opcional_con_exclude(self) -> None:
        (self.repo / "src/app/v.ts").write_text(
            "@Component({ template: `<cs-empty-state illustration=\"fleet-no-results\" /><cs-empty-state illustration=\"load-error\" />` })\n",
            encoding="utf-8")
        hallazgos = self.revisar(self.repo).hallazgos
        self.assertEqual(len([h for h in hallazgos if "cs-empty-state" in h]), 1, hallazgos)
        self.assertTrue(any("fleet-no-results" in h for h in hallazgos))

    def test_escena_dinamica_es_aviso_y_los_iconos_no(self) -> None:
        informe = self.revisar(self.repo)
        self.assertEqual(len(informe.avisos), 1, informe.avisos)
        self.assertIn("fleet-load-error", informe.avisos[0])

    def test_subpath_inexistente(self) -> None:
        (self.repo / "src/app/y.ts").write_text("import { Z } from '@comsatel/ui-components/unit-scene';\n", encoding="utf-8")
        informe = self.revisar(self.repo)
        self.assertTrue(any("unit-scene" in h for h in informe.hallazgos))

    def test_lee_una_ref_sin_checkout(self) -> None:
        git(self.repo, "checkout", "-q", "-b", "otra")
        (self.repo / "package.json").write_text(json.dumps({"dependencies": {"@comsatel/ui-components": "1.17.0-pre.157"}}), encoding="utf-8")
        git(self.repo, "commit", "-q", "-am", "pre")
        git(self.repo, "checkout", "-q", "main")
        antes = git(self.repo, "status", "--porcelain") + git(self.repo, "rev-parse", "HEAD")
        informe = self.revisar(self.repo, ref="otra", piezas=False)
        self.assertEqual(informe.version, "1.17.0-pre.157")
        self.assertEqual(antes, git(self.repo, "status", "--porcelain") + git(self.repo, "rev-parse", "HEAD"))

    def test_registro_caido_se_declara_no_verificado(self) -> None:
        def falla(_repo):
            raise RuntimeError("503 Service Unavailable")

        original = rd.consultar_registro
        rd.consultar_registro = falla
        try:
            informe = rd.revisar(str(self.repo), piezas=False)
        finally:
            rd.consultar_registro = original
        self.assertTrue(any("no verificado" in n for n in informe.notas))
        self.assertEqual(informe.codigo, 0)

    def test_errores_de_uso_salen_2(self) -> None:
        sin_ds = self.dir / "sin-ds"
        sin_ds.mkdir()
        (sin_ds / "package.json").write_text("{}", encoding="utf-8")
        for args in ([str(sin_ds), "--sin-registro"], [str(self.repo), "--ref", "no-existe"]):
            out, err = io.StringIO(), io.StringIO()
            with redirect_stdout(out), redirect_stderr(err):
                self.assertEqual(rd.main(args), 2)

    def test_registro_json_por_archivo(self) -> None:
        archivo = self.dir / "registro.json"
        archivo.write_text(json.dumps(REGISTRO), encoding="utf-8")
        out = io.StringIO()
        with redirect_stdout(out):
            codigo = rd.main([str(self.repo), "--registro-json", str(archivo), "--sin-piezas"])
        self.assertEqual(codigo, 0, out.getvalue())


if __name__ == "__main__":
    unittest.main()
