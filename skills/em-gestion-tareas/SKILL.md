---
name: em-gestion-tareas
description: >
  Registra y mantiene las tareas de Comsatel en Notion (principal), GitLab (issues del proyecto
  collaboration de CL2 Flota) y ClickUp (lista «Tareas del equipo»), con una sola estructura y su
  trazabilidad. Recibe un paquete (DSP): lee sus historias, estima, mapea las tareas madre y
  subtareas y las crea; las publica en GitLab y ClickUp dejando el tablero del día; marca el avance;
  cierra marcando los criterios con evidencia; pausa, carga horas y registra actividades cortas.
  Úsalo cuando pidan "recibimos el DSP-0NN", "mapea las tareas del paquete", "sube estas tareas a
  GitLab", "súbelas a ClickUp", "qué vence hoy", "cierra lo que ya hice", "pon en pausa",
  "carga las horas" o "¿cómo va el tablero?". Lo llaman los orquestadores al empezar y al terminar
  cada tarea. No decide qué trabajo se hace ni lo ejecuta, y no sube capturas: eso es de quien
  ejecuta (flujo-producto, flujo-ds, ux-a-desarrollo…).
metadata:
  version: "1.0.0"
  estado: borrador
  reemplaza: "flujo-tareas-gitlab 0.4.1 y recepcion-de-paquetes (respaldo en ~/.claude/skills-backup-2026-11-26)"
---

# Gestión de tareas: Notion, GitLab y ClickUp

Una tarea nace en **Notion**, que es el registro de Enzo. Si el equipo la sigue, pasa a **GitLab**
como issue y a **ClickUp** como tarea. Las tres plataformas llevan **el mismo contenido de
trabajo**: alcance, criterios de aceptación, condición de cierre y trazabilidad. Solo Notion
agrega la capa de lectura (pregunta inicial, 30 segundos, relato y comprobación). Todo sale de un
mapeo JSON que valida `scripts/armar-mapeo.mjs`; nadie escribe una tarea a mano.

Este skill **registra**: no decide qué se hace ni lo ejecuta. Los orquestadores lo llaman
(`references/llamados.md`) y quien ejecuta le entrega la evidencia.

## Referencias disponibles

- `references/estructura-de-la-tarea.md` — la estructura aprobada (2026-11-26), sus tres versiones y los títulos. Leer antes de crear o corregir una tarea.
- `references/trazabilidad.md` — qué enlaza cada tarea y por qué todo apunta a GitLab. Leer al crear y al cerrar.
- `references/recibir-un-paquete.md` — el modo Recibir paso a paso, con el lector de historias y la estimación. Leer al recibir un DSP.
- `references/avance-y-cierre.md` — qué marca Avance, qué marca Cerrar y con qué evidencia. Leer antes de cambiar un estado.
- `references/llamados.md` — el contrato con los orquestadores y los ejecutores. Leer si cambia un orquestador.
- `references/mapeo-notion-gitlab-clickup.md` — estados, niveles, formato de ClickUp y fechas entre los tres sistemas (aprobado 2026-11-14).
- `references/tablero-y-compromiso.md` — columnas del tablero y regla del compromiso del día.
- `references/control-de-tiempos.md` — horas por día y solo la diferencia.
- `references/api-issues.md` — llamadas a la API de GitLab.
- `references/guardia-de-tareas.md` — el hook que hace cumplir la estructura y la confirmación.
- `flujo-producto/references/evidencia-de-avance.md` — capturas y «Cómo funciona», que agrega quien ejecuta.

## Scripts

| Script | Qué hace | Escribe |
|---|---|---|
| `leer-paquete.mjs` | Lee el DSP y sus historias desde la KB (`git show`, sin tocar el clon), cuenta los criterios de aceptación (AC), busca qué ya existe y estima | No |
| `armar-mapeo.mjs` | Valida el mapeo y genera las tres versiones de cada tarea con su trazabilidad | No |
| `escribir-notion.mjs` | Reemplaza el contenido de tareas que ya existen por el que generó `armar-mapeo.mjs` (API de markdown de Notion) y comprueba lo guardado. Úsalo para actualizar varias tareas sin transcribir texto | Sí (Notion está aprobado); `--seco` solo muestra |
| `publicar.mjs` | Crea issues y tareas de ClickUp, enlaces `relates_to`, `/estimate` y la columna del día. Corrida en seco por defecto | Con `--ejecutar` |
| `tablero-dia.mjs` | Mueve cada mañana según la fecha límite y cierra a las 17:00–18:00 lo Completada que vence hoy | Con `--ejecutar` |
| `cu-formato.mjs` | Limpieza de ClickUp de una sola vez (2026-11-16); solo se usa si vuelve a desordenarse | Con `--ejecutar` |

`config/sistemas.json` guarda los identificadores (bases de Notion, proyecto 622, tablero 513,
lista de ClickUp). `config/modelo-estimacion.json` es la hipótesis de horas (calibrada con un dato).

## GUARD — verificar contexto

1. Proyecto destino en GitLab (`cl2-flota/collaboration`, 622, o `svr-basico`) y **hito activo**: `publicar.mjs` lo verifica y se detiene si venció.
2. Etiquetas y listas leídas del proyecto, no de la memoria (B5).
3. Qué sistemas pidió el usuario: Notion siempre; GitLab y ClickUp solo cuando lo pide.
4. Antes de marcar algo como hecho, la **evidencia** (B9): commit, MR, artefacto en `develop` de la KB, comentario o reunión.
5. Tokens: `GITLAB_TOKEN` en el entorno, `~/.clickup/token.txt` y `~/.notion/token.txt`. Nunca se imprimen.
6. La KB se lee con `git show origin/develop:<ruta>` después de un `git fetch`: el clon local no se modifica.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `RECIBIR` | «recibimos el DSP», «mapea las tareas del paquete» | `recibir-un-paquete.md`: leer, estimar, mapear, validar y crear en Notion el paquete, la historia que falte y las tareas |
| `PUBLICAR` | «súbelas a GitLab y ClickUp», «comprométe el día» | `publicar.mjs` en seco → confirmación → `--ejecutar` → `Issue` y `ClickUp` en Notion → `armar-mapeo --ids` para enlazar la trazabilidad de Notion |
| `AVANCE` | Lo llama un orquestador al empezar o al terminar un paso, al pasar una compuerta o cuando cambia la KB | `avance-y-cierre.md`: «En curso», casilla con evidencia, enlace en Trazabilidad. Tres variantes: **con evidencia** (marca la casilla), **con nota** (un cambio en la KB que no cambia el alcance: se anota con su enlace, sin marcar nada) y **con bloqueo** (pregunta abierta de otro responsable: se anota quién responde y qué desbloquea, y se marca «En pausa» si frena todo). Las capturas no |
| `AJUSTAR` | Aparece trabajo nuevo a mitad de la ejecución (un módulo, una pantalla, un flujo) o una tarea mapeada deja de tener sentido | Se edita el mapeo del paquete (agregar, mover o retirar), se valida con `armar-mapeo.mjs` y se crea o actualiza en Notion con `escribir-notion.mjs`. Nunca se escribe una tarea a mano (B14). Si ya está publicada, PUBLICAR la sube después con confirmación |
| `CERRAR` | Lo llama un orquestador al terminar; «cierra lo que ya hice» | Casillas de criterios y de cierre con su evidencia, línea del Plan en la madre, Resultado y estado. GitLab y ClickUp esperan su fecha (B4) |
| `TABLERO` | «inicia el día», «qué vence hoy» | `tablero-dia.mjs tablero` en seco y con confirmación; en la tarde, `cierre` |
| `PAUSAR` | «pon en pausa» | Casilla «En pausa» en Notion sin cambiar el estado; `Task :: Stand By / Blocked` y «en pausa» en ClickUp (B11) |
| `HORAS` | «carga las horas», «hoy trabajé 8 h» | `control-de-tiempos.md`: tabla, confirmación y `/spend <diferencia> <fecha>` |
| `ACTIVIDAD` | «registra la reunión», «la ayuda que di» | Tarea corta en su frente (B12); no sigue el patrón de código |
| `ESTADO` | «¿cómo va el tablero?» | Leer y reportar por lista, con enlaces |


## Proyecto y producto: dos relaciones distintas (Enzo, 2026-11-26)

La jerarquía en Notion es **Proyecto → Producto → Paquete (DSP) → Historia (HU)**. Ejemplo: el proyecto «CL2 Flotas» tiene los productos «CL2 Flotas», «Piloto de CL2 Flotas», «CL2 SVR Captura y Recupero» y los dos Design System.

- **Paquetes e historias** llevan solo **Producto**; el proyecto les llega por el producto. Una historia lleva el producto de su paquete.
- **Tareas** llevan las dos relaciones, **Proyecto y Producto**, las del paquete que las origina.
- Si una página no aparece en una vista, lo primero que se revisa es su Producto (caso real: HU-01-14 seguía en el Piloto y no se veía junto a HU-01-16).
- **Si hay duda, no se adivina: se pregunta con opciones** (herramienta de preguntas, con las alternativas de la base Productos y su proyecto). Hay duda cuando el paquete no tiene producto o tiene más de uno, cuando el producto no tiene un único proyecto, o cuando la historia ya está en otro producto. `cargar-paquete.js` las devuelve en `dudas` (sale con código 3) y no cambia esa relación; con la respuesta se repite con `--producto <id>` o `--confirmar-producto`.

## Comportamientos bloqueantes

- **B1 — Nada se crea, se mueve ni se cierra en GitLab o ClickUp sin la confirmación del usuario.** Primero la corrida en seco. En Notion la escritura está aprobada (Enzo, 2026-11-26). El hook pide confirmación aunque se olvide.
- **B2 — Un issue es un entregable**, no un paso. Los pasos son casillas.
- **B3 — Horas.** Las horas con IA solo en Notion. Las humanas estimadas van como `/estimate` y como estimación de ClickUp. `/spend` solo lleva las horas reales que dice el usuario.
- **B4 — Se cierra el día de su fecha límite**, entre las 17:00 y las 18:00 de Lima, ni antes ni después.
- **B5 — Etiquetas y listas se leen del proyecto.**
- **B6 — Nunca imprimir un token.**
- **B7 — Todo issue se enlaza a su historia y a su madre** (`relates_to`); `publicar.mjs` lo hace.
- **B8 — El tiempo se imputa por día, con la fecha real y solo la diferencia.**
- **B9 — Sin evidencia no hay cierre ni casilla marcada.** Si no se ejecutó, no se cierra aunque su fecha haya pasado: se propone una fecha nueva.
- **B10 — Las tareas se nombran completas**: código, nombre e issue.
- **B11 — Pausa no es cierre.**
- **B12 — Las actividades cortas también se registran**, después de buscar si ya existen.
- **B13 — Cuestionar antes de actuar**: un dato que choca con lo registrado se muestra y se pregunta.
- **B14 — Ninguna tarea se escribe sin `armar-mapeo.mjs`.** La estructura no se improvisa; el hook bloquea una tarea sin sus secciones.
- **B15 — La trazabilidad apunta a GitLab.** Issues, historias y artefactos con su enlace a `develop` de la KB; GitLab y ClickUp no enlazan a Notion.
- **B16 — Este skill no sube capturas ni da por terminado el trabajo.** Marca lo que el ejecutor demostró. Las capturas y «Cómo funciona» las agrega quien ejecuta, mientras avanza.
- **B17 — Siglas con su nombre**: criterio de aceptación (AC), Requerimiento UX (UXR), Flujo (FLW), Pantalla (SCR), Especificación UX (UXS), Informe de accesibilidad (ARP). Y el DSP con su nombre.
- **B18 — Ciclo de retroalimentación obligatorio.** El ciclo de inicio y cierre lo mantiene `ux-ui-orchestrator` ([protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/ux-ui-orchestrator/references/ciclo-retroalimentacion.md)). Este skill hace las escrituras de tareas que el ciclo pide: el estado vivo al empezar (A), el cierre continuo cuando ocurre el hecho (C) y las notas o bloqueos que salen de `cambios-kb.mjs`. No las decide: las aplica con la evidencia que le entrega el orquestador.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Es una tarea simple, la escribo directo en Notion» | Sin el script no lleva su estructura ni su trazabilidad (B14). |
| «Pongo el enlace de Notion en GitLab para que lo encuentren» | La trazabilidad apunta a GitLab (B15). |
| «Copio los criterios de la historia en la tarea» | Se cita qué AC cubre; los criterios viven en el issue de la historia. |
| «Ya terminé, marco todas las casillas» | Cada casilla con su evidencia (B9). |
| «Ya lo terminé en Notion, cierro el issue hoy» | Se cierra el día de su fecha límite (B4). |
| «Subo las capturas al cerrar» | Las sube quien ejecuta, mientras avanza (B16). |
| «Cargo las horas con IA en GitLab» | Solo en Notion (B3). |

## Señales de alerta

- Una tarea sin «Condición de cierre» o sin «Trazabilidad», o con «Artefactos que produce» vacío después de cerrada.
- Un issue sin hito, sin responsable o sin enlace a su historia.
- Una casilla marcada sin enlace de evidencia.
- Una tarea Completada en Notion con el issue abierto después de su fecha.
- Una tarea en ClickUp sin su enlace en el campo «ClickUp» de Notion.

## Formato de respuesta

Corto: qué se hizo en cada sistema, con enlaces, y qué necesita Enzo. Si hay varias tareas, una
tabla de tres columnas como máximo: la tarea (nombre completo con código e issue), lo que pasó en
cada sistema y lo pendiente de confirmar.
