"""Pruebas de puertos_libres.py.

Correr desde la carpeta del skill:
    python -m unittest discover -s scripts/tests -v
"""

from __future__ import annotations

import io
import os
import socket
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import puertos_libres as pl  # noqa: E402

NETSTAT = """
Conexiones activas

  Proto  Dirección local          Dirección remota        Estado           PID
  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       33472
  TCP    [::]:4202              [::]:0                 LISTENING       100
  TCP    127.0.0.1:4202         0.0.0.0:0              LISTENING       100
  TCP    127.0.0.1:52000        127.0.0.1:4202         ESTABLISHED     200
  UDP    0.0.0.0:4400           *:*                                    300
"""

TASKLIST = '"node.exe","33472","Console","1","80,000 K"\n"ng.exe","100","Console","1","1 K"\n'

LSOF = """COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    4242 enzo   21u  IPv4 0x1      0t0  TCP *:8082 (LISTEN)
"""


class Lectura(unittest.TestCase):
    def test_netstat_solo_cuenta_tcp_en_escucha(self) -> None:
        self.assertEqual(pl.leer_netstat(NETSTAT), {3000: {33472}, 4202: {100}})

    def test_tasklist(self) -> None:
        self.assertEqual(pl.leer_tasklist(TASKLIST), {33472: "node.exe", 100: "ng.exe"})

    def test_lsof(self) -> None:
        ocupados, nombres = pl.leer_lsof(LSOF)
        self.assertEqual((ocupados, nombres), ({8082: {4242}}, {4242: "node"}))

    def test_tapa_tokens_del_comando(self) -> None:
        self.assertNotIn("glpat-abc", pl.TOKEN.sub("[oculto]", "node x --token=glpat-abc123"))

    def test_trampas_en_el_informe(self) -> None:
        filas = [{"puerto": 3000, "uso": pl.PUERTOS[3000], "procesos": [{"pid": 1, "nombre": "node.exe", "comando": ""}]}]
        self.assertIn("MOCK_PORT=3001", pl.formatear(filas, 1))


class Real(unittest.TestCase):
    def test_detecta_un_puerto_ocupado_de_verdad_y_uno_libre(self) -> None:
        servidor = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        servidor.bind(("127.0.0.1", 0))
        servidor.listen(1)
        ocupado = servidor.getsockname()[1]
        libre_sock = socket.socket()
        libre_sock.bind(("127.0.0.1", 0))
        libre = libre_sock.getsockname()[1]
        libre_sock.close()
        try:
            filas, codigo = pl.revisar([ocupado, libre], con_comando=False)
        finally:
            servidor.close()
        self.assertEqual(codigo, 1)
        por_puerto = {f["puerto"]: f for f in filas}
        self.assertEqual([p["pid"] for p in por_puerto[ocupado]["procesos"]], [os.getpid()])
        self.assertEqual(por_puerto[libre]["procesos"], [])

    def test_lista_invalida_sale_2(self) -> None:
        err = io.StringIO()
        with redirect_stdout(io.StringIO()), redirect_stderr(err):
            self.assertEqual(pl.main(["--puertos", "4200,abc"]), 2)


if __name__ == "__main__":
    unittest.main()
