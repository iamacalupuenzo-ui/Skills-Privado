# Dónde viven los artefactos

Dos espacios con roles distintos. No se sustituyen entre sí.

| Espacio | Qué va | Qué NUNCA va |
|---|---|---|
| `D:\Proyectos - V4\<proyecto>\` | Código, repos, ejecución de harness/agentes | Documentos sueltos de planificación |
| `D:\Investigacion - V4\01-proyectos\<proyecto>\` | Documentos: épicas, HU, casos de uso, planes de desarrollo (versionados, `-v1`, `-v2`, ...) | Código, `node_modules`, cualquier cosa que un worker de Orca deba ejecutar |

`D:\Investigacion - V4` se sincroniza a Google Drive (`.tmp.driveupload/` es la prueba).
Su propio `LEEME.md` es explícito: "nada de código ni `node_modules` aquí: Drive
intentaría subir miles de archivos". Un `worker-start --worktree` **nunca** debe apuntar
ahí — el harness (Codex/Claude/OpenCode ejecutando tareas de desarrollo) siempre corre
en `D:\Proyectos - V4\<proyecto>\` o el repositorio que corresponda.

## Antes de asumir estas rutas

Estas rutas son las vigentes al 2026-09-26 en la máquina de Enzo. Si el skill corre en
otra máquina o Enzo cambia la convención:

1. Leer `D:\Investigacion - V4\LEEME.md` si existe — es la fuente viva de la convención
   de documentación, más autoritativa que este archivo si difieren.
2. Si no existe esa ruta en la máquina actual, preguntar a Enzo dónde vive el equivalente
   en vez de crear una carpeta nueva por asunción.

## Relación con `epica-a-plan-desarrollo`

Ese skill ya tiene esta convención escrita en su propio `SKILL.md` y en sus protocolos
(`protocolo-definir.md`, `protocolo-actualizar.md`, `protocolo-analizar.md`) — apuntan a
`D:\Investigacion - V4\01-proyectos\<proyecto>\`. Este archivo documenta la misma
convención para el resto de los modos de este skill (no solo el de épica/HU/CU), para
que un DAG genérico con salida de documentación también la respete.
