#!/usr/bin/env python3
"""Revisa que estén libres los puertos de un levantamiento local y dice quién ocupa cada uno.

Contrato
--------
Entrada:
    python puertos_libres.py [--puertos 8082,4400,...] [--sin-comando]

    Por defecto revisa los puertos del levantamiento de Flotas y Backoffice (tabla PUERTOS).
    Lee `netstat -ano -p TCP` y `tasklist` en Windows, o `lsof -nP -iTCP -sTCP:LISTEN` en
    Linux y macOS. En Windows agrega la línea de comandos del proceso (PowerShell,
    Get-CimInstance), recortada y con los tokens tapados; --sin-comando la omite.

Salida (stdout, UTF-8): una línea por puerto, libre u ocupado (PID, proceso y comando), y
    las trampas conocidas de ese puerto.
    Código 0: todos libres. Código 1: al menos uno ocupado. Código 2: no se pudo leer la
    tabla de puertos (sin netstat ni lsof).

No mata procesos: solo informa. Matar es una decisión del usuario, por PID y nunca el 3000
sin preguntar (lo usa el servidor MCP de draw.io).
Solo biblioteca estándar.
"""

from __future__ import annotations

import argparse
import csv
import io
import os
import re
import subprocess
import sys

PUERTOS: dict[int, str] = {
    8082: "Mock del BFF de Web Cliente (`npm run mock` en web-flotas)",
    4400: "Shell de Web Cliente (web-flotas, `npm start`)",
    4401: "Shell de Web Cliente, segunda copia (otro worktree)",
    4202: "Micro UI de Monitoreo (microui-monitoring)",
    3000: "Mock del BFF de Backoffice por defecto; lo ocupa el servidor MCP de draw.io",
    4200: "Shell de Backoffice (web-backoffice)",
    4201: "Micro UI de Distribuidores (microui-bo-tenants)",
    4203: "Puerto libre para otra micro UI del Backoffice (microui-bo-feature-flags)",
}

TRAMPAS: dict[int, str] = {
    3000: "El servidor MCP de draw.io usa el 3000. Levanta el mock con MOCK_PORT=3001 y apunta "
          "proxy.conf.json al 3001 solo en local, sin commit (el Shell no acepta --proxy-config).",
    4202: "El proxy del Shell de Backoffice manda /mfe/microui-bo-feature-flags al 4202, el mismo "
          "puerto de microui-monitoring: no levantes los dos Shells contra el 4202 a la vez.",
}

TOKEN = re.compile(r"(glpat-[\w-]+|_authToken=\S+|(?i:token)[=:]\S+)")


def leer_netstat(texto: str) -> dict[int, set[int]]:
    """Puerto -> PIDs que escuchan, a partir de `netstat -ano`."""
    ocupados: dict[int, set[int]] = {}
    for linea in texto.splitlines():
        partes = linea.split()
        if len(partes) < 5 or partes[0].upper() != "TCP" or partes[3].upper() not in ("LISTENING", "ESCUCHANDO"):
            continue
        m = re.search(r":(\d+)$", partes[1])
        if m and partes[4].isdigit():
            ocupados.setdefault(int(m.group(1)), set()).add(int(partes[4]))
    return ocupados


def leer_lsof(texto: str) -> tuple[dict[int, set[int]], dict[int, str]]:
    ocupados: dict[int, set[int]] = {}
    nombres: dict[int, str] = {}
    for linea in texto.splitlines()[1:]:
        partes = linea.split()
        if len(partes) < 9:
            continue
        m = re.search(r":(\d+)$", partes[8])
        if m and partes[1].isdigit():
            pid = int(partes[1])
            ocupados.setdefault(int(m.group(1)), set()).add(pid)
            nombres[pid] = partes[0]
    return ocupados, nombres


def leer_tasklist(texto: str) -> dict[int, str]:
    nombres: dict[int, str] = {}
    for fila in csv.reader(io.StringIO(texto)):
        if len(fila) >= 2 and fila[1].strip().isdigit():
            nombres[int(fila[1])] = fila[0]
    return nombres


def ejecutar(*cmd: str) -> str:
    proc = subprocess.run(list(cmd), capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        raise OSError(proc.stderr.strip() or f"{cmd[0]} falló")
    return proc.stdout


def comando_de(pid: int) -> str:
    try:
        salida = ejecutar(
            "powershell", "-NoProfile", "-Command",
            f"(Get-CimInstance Win32_Process -Filter 'ProcessId={pid}').CommandLine",
        ).strip()
    except OSError:
        return ""
    return TOKEN.sub("[oculto]", salida)[:160]


def revisar(puertos: list[int], con_comando: bool = True) -> tuple[list[dict], int]:
    if os.name == "nt":
        ocupados = leer_netstat(ejecutar("netstat", "-ano", "-p", "TCP"))
        nombres = leer_tasklist(ejecutar("tasklist", "/FO", "CSV", "/NH"))
    else:
        try:
            ocupados, nombres = leer_lsof(ejecutar("lsof", "-nP", "-iTCP", "-sTCP:LISTEN"))
        except (OSError, FileNotFoundError):
            ocupados, nombres = leer_netstat(ejecutar("netstat", "-anp", "tcp")), {}
    filas = []
    for puerto in puertos:
        pids = sorted(ocupados.get(puerto, set()))
        filas.append({
            "puerto": puerto,
            "uso": PUERTOS.get(puerto, ""),
            "procesos": [
                {"pid": pid, "nombre": nombres.get(pid, "?"), "comando": comando_de(pid) if con_comando and os.name == "nt" else ""}
                for pid in pids
            ],
        })
    return filas, (1 if any(f["procesos"] for f in filas) else 0)


def formatear(filas: list[dict], codigo: int) -> str:
    lineas = ["Puertos del levantamiento local", ""]
    for f in filas:
        estado = "OCUPADO" if f["procesos"] else "libre"
        lineas.append(f"{f['puerto']:>5}  {estado:<8} {f['uso']}")
        for p in f["procesos"]:
            lineas.append(f"         PID {p['pid']} · {p['nombre']}" + (f" · {p['comando']}" if p["comando"] else ""))
        if f["procesos"] and f["puerto"] in TRAMPAS:
            lineas.append(f"         trampa conocida: {TRAMPAS[f['puerto']]}")
    lineas.append("")
    lineas.append("Resultado: " + ("hay puertos ocupados (código 1). No mates nada sin preguntar; "
                                   "si es tuyo, detenlo por PID." if codigo else "todos libres (código 0)."))
    return "\n".join(lineas)


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description="Revisa que los puertos del levantamiento local estén libres.")
    p.add_argument("--puertos", help="lista separada por comas (por defecto, la tabla de Flotas y Backoffice)")
    p.add_argument("--sin-comando", action="store_true", help="no mostrar la línea de comandos de cada proceso")
    a = p.parse_args(argv)
    try:
        puertos = [int(x) for x in a.puertos.split(",")] if a.puertos else list(PUERTOS)
    except ValueError:
        print("Error: --puertos debe ser una lista de números separados por comas", file=sys.stderr)
        return 2
    try:
        filas, codigo = revisar(puertos, not a.sin_comando)
    except (OSError, FileNotFoundError) as e:
        print(f"Error: no se pudo leer la tabla de puertos ({e})", file=sys.stderr)
        return 2
    print(formatear(filas, codigo))
    return codigo


if __name__ == "__main__":
    sys.exit(main())
