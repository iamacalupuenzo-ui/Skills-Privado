---
name: flujo-tareas-gitlab
description: >
  Crea, actualiza, mueve, pausa y cierra las tareas de Comsatel en los tres sistemas: Notion
  (el principal), GitLab (issues del proyecto collaboration de CL2 Flota o de svr-basico) y
  ClickUp (la lista «Tareas del equipo» que ve el equipo). Cubre cómo se construye el issue y la
  tarea de ClickUp, la carga del día, la pausa, el cierre en la fecha del plan y las actividades
  cortas (reuniones, entregas, ayudas). Úsalo cuando pidan "sube estas tareas a GitLab",
  "súbelas a ClickUp", "crea el issue de esto", "pon en pausa", "qué vence hoy", "cierra lo que
  ya hice", "carga las horas" o "¿cómo va el tablero?". No decide qué trabajo hacer (usa
  orquestador-desarrollo) ni publica el código (usa flujo-producto o flujo-ds).
metadata:
  version: "0.4.1"
  estado: borrador
---

# Flujo de tareas: Notion, GitLab y ClickUp

Una tarea nace en **Notion**, que es el registro principal de Enzo. Si lleva código o un
entregable que el equipo sigue, pasa a **GitLab** como issue. Si el equipo y los líderes deben
verla, pasa a **ClickUp**. Una tarea que le asignan a Enzo en ClickUp entra a la Bandeja de
Notion. No toda tarea sube a GitLab ni a ClickUp: lo elige Enzo. El mapeo completo, con estados,
niveles, etiquetas, horas y pausa, está en `gestion-proyectos/references/mapeo-notion-gitlab-clickup.md`
(aprobado el 2026-11-14).

**Estado: borrador.** La estructura del issue y las etiquetas están verificadas contra el
proyecto real. La regla del compromiso la confirmó Enzo el 4-nov-2026. Lo que sigue sin
confirmar está en `references/tablero-y-compromiso.md`, sección «Sigue por confirmar».

## Referencias disponibles

- `references/estructura-del-issue.md` — título, descripción, etiquetas, hito, enlace a la historia y tiempos. Leer antes de crear un issue.
- `references/tablero-y-compromiso.md` — listas del tablero, etiquetas de carga del día y qué falta confirmar. Leer antes de mover un issue.
- `references/control-de-tiempos.md` — cómo se imputa el tiempo por día y solo la diferencia. Leer antes de cargar horas.
- `references/api-issues.md` — llamadas a la API de GitLab para crear, enlazar, mover, imputar tiempo y cerrar. Leer antes de escribir.
- `gestion-proyectos/references/mapeo-notion-gitlab-clickup.md` — el mapeo entre los tres sistemas. Leer antes de tocar ClickUp.
- `flujo-producto/references/evidencia-de-avance.md` — capturas y descripción de cómo funciona en la tarea FRONT, la bitácora y la página de servidores. Leer cada vez que se termina un paso de construcción.

## GUARD — verificar contexto

1. Confirmar el proyecto destino en GitLab: `cl2-flota/collaboration` (id 622) o `svr-basico/collaboration`, donde viven Restricción por IP y Captura y Recupero. Confirmar también el hito activo. Si venció, preguntar cuál usar.
2. Leer el tablero y las etiquetas reales con la API antes de crear o mover (B5).
3. Confirmar qué sistema pidió el usuario. Notion siempre; GitLab y ClickUp solo cuando lo pide.
4. **Buscar la evidencia antes de marcar una tarea como hecha (B9):** commits y MR del repo, artefactos del knowledge-base, issues y reuniones. Lo que no tiene evidencia se pregunta, no se supone.
5. ClickUp: el token se lee de `~/.clickup/token.txt` y nunca se imprime. Lista «Tareas del equipo» (901714403439), usuario de Enzo 101231538.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `CREAR` | «sube estas tareas», «crea el issue» | Construir cada issue con `estructura-del-issue.md`; corrida en seco y confirmación |
| `CLICKUP` | «súbelas a ClickUp» | Padre de ClickUp = tarea padre; subtarea = tarea. Descripción con la estructura del issue y solo su enlace de GitLab, sin mencionar Notion. Corrida en seco, confirmación y enlace guardado en el campo «ClickUp» de Notion |
| `ACTIVIDAD` | «registra la reunión», «la entrega», «la ayuda que di» | Tareas cortas también se registran (B12): en GitLab con `Actividad :: Reuniones` u otra lista de Recurrentes; en ClickUp como subtarea del frente o como padre si no tiene frente |
| `COMPROMETER` | «inicia el día», «¿qué toca hoy?» | Proponer lo de hoy, confirmar y mover a `Task :: In Compromise` |
| `MOVER` | «pasa a En progreso», «mueve a revisión» | Cambiar etiquetas por la API; solo las que el usuario indica |
| `PAUSAR` | «pon en pausa», «este proyecto está detenido» | En Notion se marca la casilla «En pausa», sin cambiar el estado (una terminada queda Completada y en pausa). En GitLab, `Task :: Stand By / Blocked`, sin cerrar. En ClickUp, «en pausa» (B11) |
| `TIEMPOS` | «carga las horas», «hoy trabajé 8 h» | Leer lo ya imputado por día, calcular la diferencia, mostrar la tabla y, con confirmación, `/spend <diferencia> <fecha>` |
| `CERRAR` | «qué vence hoy», «cierra lo que ya hice» | Solo lo **ejecutado** (B9) y **en su fecha** (B4). Lo que venció sin hacerse no se cierra: se le propone una fecha nueva |
| `ESTADO` | «¿cómo va el tablero?» | Leer, agrupar por lista y reportar con enlaces |
| `EVIDENCIA` | Se terminó un paso de construcción; «sube las capturas», «actualiza la bitácora», «actualiza los servidores» | `flujo-producto/references/evidencia-de-avance.md`: captura y «Cómo funciona» en la tarea; la bitácora y la página de servidores solo marcan y enlazan |

## Comportamientos bloqueantes

- **B1 — Nada se crea, se mueve ni se cierra en GitLab o ClickUp sin la confirmación del usuario.** Lo ven todos.
- **B2 — Un issue es un entregable**, no un paso. Subir, publicar o abrir un MR son pasos dentro del issue.
- **B3 — Horas.** Las horas con IA viven solo en Notion. Las horas humanas estimadas van a GitLab como `/estimate` y a ClickUp como estimación. Con `/spend` solo van las horas reales que indica el usuario.
- **B4 — Se cierra el día de su fecha límite** (Enzo, 2026-11-14): ni antes, aunque en Notion ya esté terminada, ni después. No hace falta tener horas registradas. Las fechas se cumplen en GitLab y en ClickUp.
- **B5 — Los nombres de etiquetas y listas se leen del proyecto**, no de la memoria.
- **B6 — Nunca imprimir un token** (GitLab, Notion o ClickUp).
- **B7 — Se enlaza cada issue a su historia** (`relates_to`); un issue sin historia se avisa.
- **B8 — El tiempo se imputa por día, con la fecha real y solo la diferencia.**
- **B9 — Sin ejecución no hay cierre.** Antes de cerrar o de marcar como hecha una tarea, se busca la evidencia (commit, MR, artefacto, reunión). Si no se ejecutó, no se cierra aunque su fecha haya pasado: se propone una fecha nueva.
- **B10 — Las tareas se nombran completas.** Al preguntar o reportar, se escribe el nombre de la tarea además de su código y su issue: «AUD-UX · 04 — Pantallas de Consulta y extracción de auditoría (#206)», nunca solo «AUD-UX 04».
- **B11 — Pausa no es cierre.** Una tarea en pausa conserva su estado en Notion con la casilla «En pausa» y no se cierra en GitLab ni en ClickUp.
- **B12 — Las actividades cortas también se registran** (reuniones, entregas, ayudas a otro equipo) en el frente al que pertenecen. Antes de crearlas se busca si ya existen (por ejemplo, la reunión que registró otra persona en GitLab) y se pregunta lo que no esté claro: fecha, horas y a qué frente pertenecen.
- **B13 — Cuestionar antes de actuar.** Si un dato del usuario choca con lo registrado (por ejemplo, una fecha distinta), se muestra la diferencia y se pregunta. No se corrige en silencio ni se sigue a ciegas.

- **B14 — Lo construido deja evidencia en su tarea** (Enzo, 2026-11-15): lo completado, capturas revisadas antes de subirlas y una explicación breve de cómo funciona, al terminar cada paso. Las capturas viven solo en la tarea; la bitácora de construcción y la página de servidores marcan y enlazan (`flujo-producto/references/evidencia-de-avance.md`).

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Abro un issue por cada paso para que se vea el avance» | Un paso no es un entregable (B2). |
| «Ya lo terminé en Notion, cierro el issue hoy» | Se cierra el día de su fecha límite, no antes (B4). |
| «Su fecha pasó, lo cierro igual» | Si no se ejecutó, no se cierra: fecha nueva (B9). |
| «Está en pausa, lo cierro para limpiar el tablero» | Pausa no es cierre (B11). |
| «Es una reunión corta, no hace falta registrarla» | También se registra (B12). |
| «Pongo el enlace de Notion en ClickUp para que lo encuentren» | En ClickUp va solo el enlace de GitLab. |
| «Cargo las horas con IA en GitLab también» | Solo en Notion (B3). |
| «Subo las capturas al final, cuando cierre la tarea» | Se suben al terminar cada paso; al cierre ya no se recuerda cada estado (B14). |
| «Pego la captura también en la bitácora para que se vea» | La captura vive en la tarea; la bitácora enlaza (B14). |

## Señales de alerta

- Un issue sin hito, sin responsable o sin enlace a su historia.
- Una tarea vencida y abierta: o se cierra con evidencia, o lleva fecha nueva.
- Una tarea Completada en Notion cuyo issue sigue abierto después de su fecha.
- Una tarea en ClickUp sin su enlace en el campo «ClickUp» de Notion.
- Un `/spend` con una fecha que no es la del día trabajado.
- Una tarea «En curso» o «Finalizada» con la página en blanco o sin capturas (B14).

## Formato de respuesta

Cerrar con una tabla de tres columnas como máximo: la tarea (nombre completo, con código e issue), lo que pasó en cada sistema y lo que quedó pendiente de confirmar.
