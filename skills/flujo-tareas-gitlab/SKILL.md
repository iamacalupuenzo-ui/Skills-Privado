---
name: flujo-tareas-gitlab
description: >
  Crea, actualiza y mueve las tareas de desarrollo en GitLab de Comsatel (proyecto
  collaboration de CL2 Flota): cómo se construye el issue (título, descripción, etiquetas,
  hito, enlace a su historia, tiempos), cómo se mueve en el tablero y cómo se compromete en la
  carga del día en que se asigna. Úsalo cuando pidan "sube estas tareas a GitLab", "crea el
  issue de esto", "mueve la tarea a En compromiso", "carga las horas en GitLab", "cierra el
  issue" o "¿cómo va el tablero?". No decide qué trabajo hacer (usa orquestador-desarrollo), no
  registra el trabajo personal en Notion (usa el skill de Notion) ni publica el código (usa
  flujo-producto o flujo-ds).
metadata:
  version: "0.2.0"
  estado: borrador
---

# Flujo de tareas en GitLab

Una tarea en GitLab es un **issue** con etiquetas, hito, responsable y un enlace a su historia.
Aquí vive cómo se construye y cómo se mueve. El criterio de qué es una tarea y qué horas lleva
vive en el registro de Notion; GitLab recibe solo lo que el equipo ve.

**Estado: borrador.** La estructura del issue y las etiquetas están verificadas contra el
proyecto real. La regla del compromiso (validar cuáles tareas corresponden a hoy, moverlas a la
columna `Task :: In Compromise` y reevaluar al día siguiente lo no cerrado) la confirmó Enzo el
4-nov-2026. Lo que sigue sin confirmar está
en `references/tablero-y-compromiso.md`, sección «Sigue por confirmar», y no se aplica como regla.

## Referencias disponibles

- `references/estructura-del-issue.md` — título, descripción, etiquetas, hito, enlace a la historia y tiempos. Leer antes de crear un issue.
- `references/tablero-y-compromiso.md` — listas del tablero, etiquetas de carga del día y qué falta confirmar. Leer antes de mover un issue.
- `references/control-de-tiempos.md` — cómo se imputa el tiempo por día y solo la diferencia. Leer antes de cargar horas.
- `references/api-issues.md` — llamadas a la API de GitLab para crear, enlazar, mover, imputar tiempo y cerrar. Leer antes de escribir.

## GUARD — verificar contexto

1. Confirmar el proyecto destino (`collaboration`, id 622 en CL2 Flota) y el hito activo. Si el hito venció o no hay uno activo, decirlo y preguntar cuál usar: no inventarlo.
2. Leer el tablero y las etiquetas reales con la API antes de crear o mover (`api-issues.md`); no asumir los nombres de otra conversación.
3. Confirmar que el usuario pidió GitLab. El registro individual de tareas es Notion; a GitLab se sube solo cuando el usuario lo pide.
4. Confirmar quién es el responsable del issue y a qué historia pertenece.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `CREAR` | «sube estas tareas», «crea el issue» | Construir cada issue con `estructura-del-issue.md`; mostrar el borrador y esperar confirmación; corrida en seco primero |
| `COMPROMETER` | «inicia el día», «¿qué toca hoy?», «revisa las tareas de hoy» | Leer las tareas abiertas, proponer cuáles corresponden a hoy, esperar confirmación y moverlas a `Task :: In Compromise` (regla en `tablero-y-compromiso.md`) |
| `MOVER` | «pasa a En progreso», «mueve a revisión» | Cambiar etiquetas por la API según `tablero-y-compromiso.md`; solo las que el usuario indica |
| `TIEMPOS` | «carga las horas», «imputa», «hoy trabajé 8 h en esto» | Leer lo ya imputado por día (GraphQL), calcular la diferencia con lo que el usuario indica, mostrar la tabla y, con confirmación, enviar `/spend <diferencia> <fecha>`; ver `control-de-tiempos.md` |
| `CERRAR` | «cierra el issue» | Solo con el MR fusionado y el criterio cumplido; si no, dejar el estado y decir qué falta |
| `ESTADO` | «¿cómo va el tablero?» | Leer, agrupar por lista y reportar con enlaces |

## Comportamientos bloqueantes

- **B1 — Nada se crea, mueve ni cierra sin la confirmación del usuario.** Un issue es visible para todo el equipo.
- **B2 — Un issue es un entregable**, no un paso. Subir, publicar, abrir un MR o esperar un pipeline son pasos dentro del issue, nunca issues aparte.
- **B3 — Las horas con IA y las horas humanas estimadas viven solo en Notion**, nunca en GitLab. En GitLab se imputan únicamente las horas que el usuario indica.
- **B8 — El tiempo se imputa por día, con la fecha real de ejecución y solo la diferencia.** Antes de un `/spend` se lee lo ya registrado esa fecha; repetir la orden no duplica horas, los días no se juntan en una sola nota y nunca se usa la fecha del cronograma como si fuera la real.
- **B4 — Se cierra solo con el criterio cumplido y el MR fusionado.** «Falta fusionar» no es cerrado: se deja abierto con ese comentario.
- **B5 — Los nombres de etiquetas y listas se leen del proyecto**, no de la memoria: cambian entre equipos.
- **B6 — Nunca imprimir el token.** Se usa el encabezado `PRIVATE-TOKEN` desde la variable de entorno.
- **B7 — Se enlaza cada issue a su historia** (`relates_to`); un issue sin historia se avisa.
- **B9 — Un issue se cierra en su fecha límite, no cuando termina el esfuerzo.** La fecha límite es la misma en Notion y en GitLab (la planificada). Lo que difiere es el cierre: en Notion se cierra cuando se termina el trabajo, aunque sea antes; en GitLab se respeta la fecha planificada (Enzo, 11-nov-2026). Que una tarea esté «Completada» en Notion no es motivo para cerrar su issue antes de tiempo ni una discrepancia que corregir. Para decidir qué comprometer o mover cuenta la fecha límite y la lista, no el estado de Notion; Notion se consulta solo para informar.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Abro un issue por cada paso para que se vea el avance» | El avance se ve en el estado del issue; un paso no es un entregable (B2). |
| «Las etiquetas son las de la última vez» | Se leen del proyecto (B5). |
| «El MR está listo, cierro el issue» | Cierra al fusionarse (B4). |
| «Cargo las horas con IA en GitLab también» | Esas horas son solo de Notion (B3). |
| «En Notion ya está completada, cierro el issue» | Se cierra en su fecha límite (B9). |
| «El hito anterior sirve» | Un hito vencido se confirma o se reemplaza, no se reutiliza en silencio. |

## Señales de alerta

- Un issue sin hito, sin responsable o sin enlace a su historia.
- Etiquetas de estado de familias distintas a la vez (`Task ::` y `Status ::`).
- Un issue cerrado cuyo MR sigue abierto.
- Un `/spend` con una fecha que no es la del día trabajado.

## Formato de respuesta

Cerrar con una tabla: issue (enlace), lista o etiqueta resultante, tiempo imputado si lo hay y lo que quedó pendiente de confirmar.
