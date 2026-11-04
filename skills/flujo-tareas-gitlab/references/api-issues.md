# API de GitLab para tareas

Siempre con el encabezado `PRIVATE-TOKEN: $GITLAB_TOKEN` (la variable de entorno, sin imprimirla). Base: `https://project.comsatel.com.pe/api/v4`. Proyecto de CL2 Flota: `622` (`collaboration`).

Las lecturas se verificaron el 2-nov-2026. Las escrituras (crear, enlazar, imputar) se probaron con un script al subir las tareas UX14 el 21-oct-2026; antes de repetirlas, hacer una corrida en seco que solo imprima lo que se enviaría.

## Leer

| Qué | Llamada |
|---|---|
| Listas del tablero | `GET /projects/622/boards/513` |
| Etiquetas y su descripción | `GET /projects/622/labels?per_page=100` |
| Hitos activos | `GET /projects/622/milestones?state=active` |
| Mis issues abiertos | `GET /projects/622/issues?state=opened&assignee_username=<usuario>&per_page=100` |
| Un issue con sus tiempos | `GET /projects/622/issues/<iid>` (`time_stats`) |

## Crear

`POST /projects/622/issues` con cuerpo JSON UTF-8 desde un archivo (`--data-binary @issue.json`):

```json
{ "title": "UX14 · CA3.x — Entregable", "description": "…", "labels": "Task,Task :: To Do",
  "milestone_id": 1752, "assignee_ids": [0], "due_date": "2026-11-04" }
```

`assignee_ids` lleva el id numérico de la persona responsable (el `0` del ejemplo es un marcador).

## Enlazar a la historia

`POST /projects/622/issues/<iid>/links?target_project_id=622&target_issue_iid=14&link_type=relates_to`

## Mover entre listas

`PUT /projects/622/issues/<iid>` con `{"add_labels": "Task :: In Progress", "remove_labels": "Task :: To Do"}`. Quitar siempre la etiqueta de la lista anterior: dos etiquetas de lista a la vez dejan el issue en dos columnas.

## Tiempos

`POST /projects/622/issues/<iid>/notes` con `{"body": "/estimate 1h30m"}` o `{"body": "/spend 1h30m 2026-10-29"}`. Un valor negativo resta: `{"body": "/spend -1h 2026-10-29"}`.

Lo imputado por día se lee con GraphQL (`POST /api/graphql`, ruta completa del proyecto `comsatel/development/products/clocator2/cl2-flota/collaboration`, campo `issue.timelogs`). Ver `control-de-tiempos.md`.

## Cerrar

`PUT /projects/622/issues/<iid>` con `{"state_event": "close", "remove_labels": "<etiqueta de lista>"}`. Solo con el MR fusionado (B4).

## Trampas

- Los títulos con tildes se envían desde un archivo UTF-8, no desde la línea de comandos de Windows.
- `labels` es una cadena separada por comas, no una lista.
- Un 403 se informa y se detiene la operación; no se reintenta con otro rol.
