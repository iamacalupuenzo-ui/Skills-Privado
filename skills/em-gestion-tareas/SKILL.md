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
  version: "1.2.0"
  reemplaza: "flujo-tareas-gitlab 0.4.1 y recepcion-de-paquetes (respaldo en ~/.claude/skills-backup-2026-11-26)"
---

# Gestión de tareas: Notion, GitLab y ClickUp

Una tarea nace en **Notion**, el registro de Enzo. Si el equipo la sigue, pasa a **GitLab** como
issue y a **ClickUp** como tarea, con el mismo contenido de trabajo. Solo Notion agrega la capa de
lectura. Todo sale de un mapeo JSON que valida `scripts/armar-mapeo.mjs`; nadie escribe una tarea
a mano. Este skill **registra**: no decide qué se hace ni lo ejecuta.

## Verificación de arranque

1. Proyecto destino en GitLab (`cl2-flota/collaboration`, 622, o `svr-basico`) y **hito activo**; `publicar.mjs` se detiene si venció.
2. Etiquetas y listas leídas del proyecto, no de la memoria (B5).
3. Sistemas pedidos: Notion siempre; GitLab y ClickUp solo cuando se piden. Antes de la primera
   subida del día, preguntar una vez: «¿Intervienes en las subidas o las ejecuto yo?» (B1).
4. Antes de marcar algo como hecho, la **evidencia** (B9): commit, MR, artefacto en `develop` de la KB, comentario o reunión.
5. Tokens: `GITLAB_TOKEN`, `~/.clickup/token.txt` y `~/.notion/token.txt`. Nunca se imprimen (B6).
6. La KB se lee con `git show origin/develop:<ruta>` después de `git fetch`; el clon no se toca.

## Detección de modo

| Modo | Señales | Leer |
|---|---|---|
| `RECIBIR` | «recibimos el DSP», «mapea las tareas del paquete» | `references/recibir-un-paquete.md` |
| `PUBLICAR` | «súbelas a GitLab y ClickUp», «comprométe el día» | `references/api-issues.md` y `references/mapeo-notion-gitlab-clickup.md` |
| `AVANCE` | Un orquestador empieza o termina un paso; cambia la KB | `references/avance-y-cierre.md` |
| `AJUSTAR` | Aparece trabajo nuevo o una tarea mapeada pierde sentido | `references/avance-y-cierre.md` |
| `CERRAR` | Un orquestador termina; «cierra lo que ya hice» | `references/avance-y-cierre.md` |
| `TABLERO` | «inicia el día», «qué vence hoy» | `references/tablero-y-compromiso.md` |
| `PAUSAR` | «pon en pausa» | `references/mapeo-notion-gitlab-clickup.md` |
| `HORAS` | «carga las horas», «hoy trabajé 8 h» | `references/control-de-tiempos.md` |
| `ACTIVIDAD` | «registra la reunión», «la ayuda que di» | `references/reglas.md` (B12) |
| `ESTADO` | «¿cómo va el tablero?» | Leer y reportar por lista, con enlaces |

AJUSTAR edita el mapeo, lo valida con `armar-mapeo.mjs` y actualiza con `escribir-notion.mjs`.
PUBLICAR va en seco → tu confirmación o la delegación del día → `--ejecutar` → `Issue` y `ClickUp` en Notion → `armar-mapeo --ids`.
PAUSAR marca la
casilla «En pausa» sin cambiar el estado.

## Guías por paso

| Cuándo | Leer |
|---|---|
| Al crear o corregir una tarea | `references/estructura-de-la-tarea.md` y `references/trazabilidad.md` |
| Al recibir un paquete o si una página no sale en su vista | `references/pagina-del-paquete.md` y `references/proyecto-y-producto.md` |
| Antes de correr un script | `references/scripts.md` |
| Si cambia un orquestador | `references/llamados.md` |
| Si el hook bloquea | `references/guardia-de-tareas.md` |
| Al explicar qué evidencia deja quien ejecuta | `references/evidencia-de-avance.md` |
| Antes de crear, publicar, cerrar o cargar horas | `references/reglas.md` |

Plantillas en `templates/`, ejemplo real en `examples/mapeo-dsp-009.json`.

## Reglas de bloqueo

Detalle, excusas y señales de alerta en `references/reglas.md`.

- **B1** — GitLab y ClickUp: Enzo elige una vez al día si interviene o delega (`delegar.mjs`).
- **B2** — Un issue es un entregable; los pasos son casillas.
- **B3** — Horas con IA solo en Notion; `/spend` solo horas reales.
- **B4** — Se cierra el día de la fecha límite, de 17:00 a 18:00 de Lima.
- **B5** — Etiquetas y listas se leen del proyecto.
- **B6** — Nunca imprimir un token.
- **B7** — Todo issue enlaza a su historia y a su madre.
- **B8** — Tiempo por día, con fecha real y solo la diferencia.
- **B9** — Sin evidencia no hay cierre ni casilla.
- **B10** — Tareas nombradas completas: código, nombre e issue.
- **B11** — Pausa no es cierre.
- **B12** — Las actividades cortas también se registran.
- **B13** — Un dato que choca con lo registrado se muestra y se pregunta.
- **B14** — Ninguna tarea sin `armar-mapeo.mjs`.
- **B15** — La trazabilidad apunta a GitLab; GitLab y ClickUp no enlazan a Notion.
- **B16** — No sube capturas ni da por terminado el trabajo.
- **B17** — Siglas con su nombre completo.
- **B18 — Ciclo de retroalimentación obligatorio.** Aplica las escrituras del [protocolo](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/em-orquestador-ux/references/ciclo-retroalimentacion.md); no las decide.

## Cierre

Corto: qué se hizo en cada sistema, con enlaces, y qué necesita Enzo. Con varias tareas, una
tabla de tres columnas como máximo: tarea (código, nombre e issue), qué pasó en cada sistema y qué
falta confirmar.
