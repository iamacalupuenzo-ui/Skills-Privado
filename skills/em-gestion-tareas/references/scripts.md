# Scripts, configuración y pruebas

Leer antes de correr un script por primera vez en la sesión. Todos están en `scripts/` y se
corren con `node`. Ninguno imprime tokens (B6).

## Scripts

| Script | Qué hace | Escribe |
|---|---|---|
| `leer-paquete.mjs` | Lee el DSP y sus historias desde la KB (`git show`, sin tocar el clon), cuenta los criterios de aceptación (AC), busca qué ya existe y estima | No |
| `armar-mapeo.mjs` | Valida el mapeo y genera las tres versiones de cada tarea con su trazabilidad. Si una regla falla, no genera nada y sale con 1 | No |
| `escribir-notion.mjs` | Reemplaza el contenido de tareas que ya existen por el que generó `armar-mapeo.mjs` y comprueba lo guardado | Sí (Notion aprobado); `--seco` solo muestra |
| `notas-kb.mjs` | Pasa los cambios de la KB del informe de `cambios-kb.mjs` al mapeo (`cambiosKb`), para que una regeneración no los borre | Solo el mapeo; `--seco` muestra |
| `publicar.mjs` | Crea issues y tareas de ClickUp, enlaces `relates_to`, `/estimate` y la columna del día. Corrida en seco por defecto | Con `--ejecutar` |
| `tablero-dia.mjs` | Mueve cada mañana según la fecha límite y cierra a las 17:00–18:00 lo Completada que vence hoy | Con `--ejecutar` |
| `delegar.mjs` | Guarda si Enzo interviene en las subidas o las delega por el día (B1): `delegar`, `intervenir`, `estado` | Solo el archivo de delegación |
| `cu-formato.mjs` | Limpieza de ClickUp de una sola vez (2026-11-16); solo si vuelve a desordenarse | Con `--ejecutar` |

## Configuración

- `config/sistemas.json`: identificadores (bases de Notion, proyecto 622, tablero 513, lista de ClickUp).
- `config/modelo-estimacion.json`: hipótesis de horas, calibrada con un dato. Se ajusta al cerrar.

## Plantillas y ejemplo

- `templates/mapeo.plantilla.json`: punto de partida de un mapeo nuevo.
- `templates/tarea-notion.plantilla.md`, `issue-gitlab.plantilla.md` y `tarea-clickup.plantilla.md`:
  la forma que genera `armar-mapeo.mjs` en cada sistema. Sirven para revisar, no para escribir a mano (B14).
- `examples/mapeo-dsp-009.json`: mapeo real del DSP-009 (Identidad visual del Cliente y base del Producto) que pasa.

## Pruebas

```bash
node --test tests/*.test.mjs
```

Prueban `armar-mapeo.mjs` (el ejemplo pasa; un mapeo roto sale con 1 y dice qué falta) y el hook
`hooks/guardia-tareas.mjs` (bloquea una tarea sin estructura, deja pasar la generada y pide
confirmación al escribir en GitLab o ClickUp).
