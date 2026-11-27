"""Pruebas de revisar_capas.py con repositorios de git temporales.

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

import revisar_capas as rc  # noqa: E402

API_EN_FEATURES = """import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
export const URL = '/api/v1/customer/visual-state-settings';
@Injectable({ providedIn: 'root' })
export class VisualStateSettingsApi {
  private readonly http = inject(HttpClient);
  get() { return this.http.get(URL); }
}
"""

API_EN_CORE = """import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
export const VISUAL_STATE_URL = '/api/customer/visual-state-settings';
@Injectable({ providedIn: 'root' })
export class VisualStateApiService {
  private readonly http = inject(HttpClient);
}
"""

PAGINA = """import { Component, inject } from '@angular/core';
import { ScreenService } from './screen.service';
export type Vista = 'lista' | 'mapa';
@Component({ selector: 'mon-x', template: '<p>x</p>' })
export class XPage { readonly s = inject(ScreenService); }
"""

SERVICIO_DE_PANTALLA = """import { Injectable, signal } from '@angular/core';
export interface Filtro { texto: string }
@Injectable()
export class ScreenService { readonly filtro = signal<Filtro>({ texto: '' }); }
"""


def git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), "-c", "user.name=prueba", "-c", "user.email=prueba@example.com", *args],
        check=True,
        capture_output=True,
        text=True,
    ).stdout


def escribir(repo: Path, archivos: dict[str, str]) -> None:
    for ruta, texto in archivos.items():
        destino = repo / ruta
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(texto, encoding="utf-8")


def commit(repo: Path, archivos: dict[str, str], mensaje: str) -> None:
    escribir(repo, archivos)
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", mensaje)


class RepoTemporal(unittest.TestCase):
    def setUp(self) -> None:
        self.dir = Path(tempfile.mkdtemp(prefix="revisar-capas-"))
        self.repo = self.dir / "repo"
        self.repo.mkdir()
        git(self.repo, "init", "-q", "-b", "main")
        commit(
            self.repo,
            {
                "src/app/core/units/unit.model.ts": "export interface Unit { id: string }\n",
                "src/app/core/units/units-api.service.ts": API_EN_CORE.replace(
                    "customer/visual-state-settings", "units"
                ),
                "src/app/features/home/home.page.ts": PAGINA,
                "src/app/features/home/screen.service.ts": SERVICIO_DE_PANTALLA,
                "src/app/features/home/home.copy.ts": "export const COPY = { t: 'Hola' };\nexport type CopyKey = keyof typeof COPY;\n",
            },
            "base",
        )

    def tearDown(self) -> None:
        def forzar(funcion, ruta, _error):
            os.chmod(ruta, 0o700)
            funcion(ruta)

        if sys.version_info >= (3, 12):
            shutil.rmtree(self.dir, onexc=forzar)
        else:
            shutil.rmtree(self.dir, onerror=forzar)

    def rama(self, nombre: str, archivos: dict[str, str], remota: bool = True) -> None:
        git(self.repo, "checkout", "-q", "-b", nombre, "main")
        commit(self.repo, archivos, nombre)
        if remota:
            git(self.repo, "update-ref", f"refs/remotes/origin/{nombre}", nombre)
        git(self.repo, "checkout", "-q", "main")

    def correr(self, *args: str) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            codigo = rc.main([str(self.repo), *args])
        return codigo, out.getvalue(), err.getvalue()


class Capas(RepoTemporal):
    def test_base_limpia_sale_0(self) -> None:
        codigo, salida, _ = self.correr("--ref", "main", "--sin-duplicados")
        self.assertEqual(codigo, 0, salida)
        self.assertIn("sin datos sin interfaz", salida)

    def test_marca_api_modelo_y_validacion_en_features(self) -> None:
        self.rama(
            "CLF_Feature_119",
            {
                "src/app/features/vs/vs.api.ts": API_EN_FEATURES,
                "src/app/features/vs/vs.model.ts": "export interface VS { model: 'A' | 'B' }\n",
                "src/app/features/vs/vs.validation.ts": "export type Key = 'u1';\nexport function validar() { return {}; }\n",
                "src/app/features/vs/vs.validation.spec.ts": "export type Prueba = 1;\n",
                "src/app/features/vs/vs.page.ts": PAGINA,
            },
            remota=False,
        )
        informe = rc.revisar(str(self.repo), "CLF_Feature_119", duplicados=False)
        marcadas = {Path(h.ruta).name for h in informe.hallazgos}
        self.assertEqual(marcadas, {"vs.api.ts", "vs.model.ts", "vs.validation.ts"})
        self.assertEqual(informe.codigo, 1)

    def test_servicio_que_habla_con_la_api_se_marca(self) -> None:
        self.rama(
            "x",
            {
                "src/app/features/vs/vs.service.ts": "import { Injectable } from '@angular/core';\n"
                "@Injectable()\nexport class S { url = `/api/units/${1}`; }\n",
            },
            remota=False,
        )
        informe = rc.revisar(str(self.repo), "x", duplicados=False)
        self.assertEqual([Path(h.ruta).name for h in informe.hallazgos], ["vs.service.ts"])
        self.assertIn("habla con la API", informe.hallazgos[0].motivos[0])

    def test_inyectable_con_httpclient_sin_nombre_de_datos(self) -> None:
        self.rama("y", {"src/app/features/vs/cargador.ts": API_EN_FEATURES.replace("'/api/v1/customer/visual-state-settings'", "base")}, remota=False)
        informe = rc.revisar(str(self.repo), "y", duplicados=False)
        self.assertEqual(len(informe.hallazgos), 1)
        self.assertTrue(any("HttpClient" in m for m in informe.hallazgos[0].motivos))

    def test_tipos_de_presentacion_son_aviso_y_no_fallan(self) -> None:
        self.rama(
            "z",
            {
                "src/app/features/vs/vs-preview.ts": "import type { BadgeVariant } from '@comsatel/ui-components/badge';\n"
                "export interface PreviewState { variant: BadgeVariant }\nexport const P: PreviewState[] = [];\n",
            },
            remota=False,
        )
        informe = rc.revisar(str(self.repo), "z", duplicados=False)
        self.assertEqual(informe.hallazgos, [])
        self.assertEqual([Path(a.ruta).name for a in informe.avisos], ["vs-preview.ts"])
        self.assertEqual(informe.codigo, 0)

    def test_url_en_un_comentario_no_cuenta(self) -> None:
        self.rama("c", {"src/app/features/vs/vs.helpers.ts": "// GET /api/v1/x\n/* '/api/v2/y' */\nexport const n = 1;\n"}, remota=False)
        self.assertEqual(rc.revisar(str(self.repo), "c", duplicados=False).hallazgos, [])

    def test_arbol_de_trabajo_sin_ref(self) -> None:
        escribir(self.repo, {"src/app/features/home/home.model.ts": "export interface M { a: number }\n"})
        codigo, salida, _ = self.correr("--sin-duplicados")
        self.assertEqual(codigo, 1)
        self.assertIn("home.model.ts", salida)
        self.assertIn("árbol de trabajo", salida)


class Duplicados(RepoTemporal):
    def setUp(self) -> None:
        super().setUp()
        self.rama(
            "integration",
            {
                "src/app/core/settings/visual-state-api.service.ts": API_EN_CORE,
                "src/app/features/vs/vs.page.ts": PAGINA,
                "src/app/core/units/unit.model.ts": "export interface Unit { id: string; nombre: string }\n",
            },
        )
        self.rama(
            "CLF_Feature_119",
            {
                "src/app/features/vs/vs.api.ts": API_EN_FEATURES,
                "src/app/features/vs/vs.page.ts": PAGINA + "\n",
                "src/app/core/units/unit.model.ts": "export interface Unit { id: string; tipo: string }\n",
            },
        )

    def test_avisa_misma_url_sin_version_y_mismo_archivo_creado(self) -> None:
        informe = rc.revisar(str(self.repo), "CLF_Feature_119")
        con_integration = [d for d in informe.duplicados if d.ref == "origin/integration"]
        tipos = {(d.tipo, d.valor) for d in con_integration}
        self.assertIn(("url", "/api/customer/visual-state-settings"), tipos)
        self.assertIn(("archivo", "vs.page.ts"), tipos)
        self.assertEqual(informe.codigo, 1)

    def test_archivo_que_ambos_solo_modificaron_no_es_duplicado(self) -> None:
        informe = rc.revisar(str(self.repo), "CLF_Feature_119")
        self.assertNotIn("unit.model.ts", {d.valor for d in informe.duplicados})

    def test_url_de_la_historia_comun_no_es_duplicado(self) -> None:
        # '/api/units' ya está en core/units de main: dos ramas que la vuelven a usar no duplican nada.
        uso = "import { Injectable } from '@angular/core';\n@Injectable()\nexport class S { u = '/api/units'; }\n"
        self.rama("uno", {"src/app/core/units/lector-a.ts": uso})
        self.rama("dos", {"src/app/core/units/lector-b.ts": uso})
        informe = rc.revisar(str(self.repo), "uno")
        self.assertIn("origin/dos", informe.refs_comparadas)
        self.assertNotIn("/api/units", {d.valor for d in informe.duplicados})

    def test_la_misma_rama_en_el_remoto_no_se_compara(self) -> None:
        informe = rc.revisar(str(self.repo), "CLF_Feature_119")
        self.assertNotIn("origin/CLF_Feature_119", informe.refs_comparadas)
        self.assertIn("origin/integration", informe.refs_comparadas)

    def test_integration_no_marca_su_core(self) -> None:
        informe = rc.revisar(str(self.repo), "origin/integration", duplicados=False)
        self.assertEqual(informe.hallazgos, [])
        self.assertEqual(informe.codigo, 0)

    def test_sin_remotos_avisa_que_falta_fetch(self) -> None:
        for ref in ("integration", "CLF_Feature_119"):
            git(self.repo, "update-ref", "-d", f"refs/remotes/origin/{ref}")
        informe = rc.revisar(str(self.repo), "main")
        self.assertTrue(any("git fetch" in n for n in informe.notas))

    def test_no_modifica_el_repositorio(self) -> None:
        escribir(self.repo, {"pendiente.txt": "cambio sin commit de otro agente\n"})
        antes = (git(self.repo, "rev-parse", "HEAD"), git(self.repo, "status", "--porcelain"), git(self.repo, "branch", "--show-current"))
        rc.revisar(str(self.repo), "CLF_Feature_119")
        despues = (git(self.repo, "rev-parse", "HEAD"), git(self.repo, "status", "--porcelain"), git(self.repo, "branch", "--show-current"))
        self.assertEqual(antes, despues)


class ErroresDeUso(RepoTemporal):
    def test_ref_inexistente_sale_2(self) -> None:
        codigo, _, err = self.correr("--ref", "no-existe")
        self.assertEqual(codigo, 2)
        self.assertIn("no existe", err)

    def test_carpeta_que_no_es_repo_sale_2(self) -> None:
        vacia = self.dir / "vacia"
        vacia.mkdir()
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            codigo = rc.main([str(vacia)])
        self.assertEqual(codigo, 2)

    def test_normalizar_url(self) -> None:
        self.assertEqual(rc.normalizar_url("/api/v1/Customer/visual/"), "/api/customer/visual")
        self.assertEqual(rc.normalizar_url("/api/units/:id?x=1"), "/api/units/*")
        self.assertEqual(rc.normalizar_url("/api/units/${id}"), "/api/units")


if __name__ == "__main__":
    unittest.main()
