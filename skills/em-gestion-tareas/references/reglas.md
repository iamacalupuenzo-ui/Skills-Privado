# Reglas de bloqueo: detalle, excusas y señales

Leer antes de crear, publicar, cerrar o cargar horas, y cuando una regla de SKILL.md no
alcance para decidir. SKILL.md trae cada regla en una línea; aquí está el porqué.

## Índice

1. Reglas B1 a B18
2. Racionalizaciones comunes
3. Señales de alerta

## 1. Reglas B1 a B18

- **B1 — Enzo decide si interviene en las subidas.** Antes de la primera escritura del día en
  GitLab o ClickUp se le pregunta una sola vez: «¿Intervienes en las subidas o las ejecuto yo?»
  (Enzo, 2026-11-28: no quiere una confirmación por cada subida).
  - **Intervengo:** cada subida muestra su corrida en seco y espera su confirmación. Es el valor
    por defecto si no respondió o si no se preguntó.
  - **Ejecútalo tú:** se corre `node scripts/delegar.mjs delegar`. Hasta el fin del día (hora de
    Lima) el agente corre la corrida en seco, ejecuta sin pedir confirmación y al final informa
    qué subió, con enlaces. `delegar.mjs intervenir` lo revierte; `estado` lo muestra.
  - En Notion la escritura está aprobada siempre (Enzo, 2026-11-26).
  - La delegación no apaga el resto de reglas: la estructura (B14), la evidencia (B9) y la fecha
    de cierre (B4) se siguen cumpliendo. Si algo choca con lo registrado (B13), se pregunta igual.
- **B2 — Un issue es un entregable**, no un paso. Los pasos son casillas.
- **B3 — Horas.** Las horas con IA van solo en Notion. Las humanas estimadas van como
  `/estimate` y como estimación de ClickUp. `/spend` lleva solo las horas reales que dice el
  usuario.
- **B4 — Se cierra el día de su fecha límite**, entre las 17:00 y las 18:00 de Lima, ni antes
  ni después. Terminar antes en Notion no adelanta el cierre en GitLab ni en ClickUp.
- **B5 — Etiquetas y listas se leen del proyecto**, nunca de la memoria.
- **B6 — Nunca imprimir un token.**
- **B7 — Todo issue se enlaza a su historia y a su madre** (`relates_to`); `publicar.mjs` lo hace.
- **B8 — El tiempo se imputa por día**, con la fecha real y solo la diferencia con lo ya cargado.
- **B9 — Sin evidencia no hay cierre ni casilla marcada.** Si no se ejecutó, no se cierra
  aunque su fecha haya pasado: se propone una fecha nueva.
- **B10 — Las tareas se nombran completas**: código, nombre e issue.
- **B11 — Pausa no es cierre.** «En pausa» es una casilla; el estado no cambia.
- **B12 — Las actividades cortas también se registran** (reuniones, ayudas), después de buscar
  si ya existen. No siguen el patrón de código.
- **B13 — Cuestionar antes de actuar**: un dato que choca con lo registrado se muestra y se pregunta.
- **B14 — Ninguna tarea se escribe sin `armar-mapeo.mjs`.** La estructura no se improvisa; el
  hook bloquea una tarea sin sus secciones.
- **B15 — La trazabilidad apunta a GitLab.** Issues, historias y artefactos con su enlace a
  `develop` de la KB. GitLab y ClickUp no enlazan a Notion.
- **B16 — Este skill no sube capturas ni da por terminado el trabajo.** Marca lo que el
  ejecutor demostró. Las capturas y «Cómo funciona» las agrega quien ejecuta, mientras avanza
  (`evidencia-de-avance.md`).
- **B17 — Siglas con su nombre**: criterio de aceptación (AC), Requerimiento UX (UXR), Flujo
  (FLW), Pantalla (SCR), Especificación UX (UXS), Informe de accesibilidad (ARP). Y el DSP con
  su nombre.
- **B18 — Ciclo de retroalimentación.** El ciclo de inicio y cierre lo mantiene
  `ux-ui-orchestrator` ([protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/ux-ui-orchestrator/references/ciclo-retroalimentacion.md)).
  Este skill hace las escrituras que el ciclo pide: el estado vivo al empezar (A), el cierre
  continuo cuando ocurre el hecho (C) y las notas o bloqueos que salen de `cambios-kb.mjs`. No
  las decide: las aplica con la evidencia que le entrega el orquestador.

## 2. Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Es una tarea simple, la escribo directo en Notion» | Sin el script no lleva su estructura ni su trazabilidad (B14). |
| «Pongo el enlace de Notion en GitLab para que lo encuentren» | La trazabilidad apunta a GitLab (B15). |
| «Copio los criterios de la historia en la tarea» | Se cita qué AC cubre; los criterios viven en el issue de la historia. |
| «Ya terminé, marco todas las casillas» | Cada casilla con su evidencia (B9). |
| «Ya lo terminé en Notion, cierro el issue hoy» | Se cierra el día de su fecha límite (B4). |
| «Subo las capturas al cerrar» | Las sube quien ejecuta, mientras avanza (B16). |
| «Cargo las horas con IA en GitLab» | Solo en Notion (B3). |

## 3. Señales de alerta

- Una tarea sin «Condición de cierre» o sin «Trazabilidad», o con «Artefactos que produce»
  vacío después de cerrada.
- Un issue sin hito, sin responsable o sin enlace a su historia.
- Una casilla marcada sin enlace de evidencia.
- Una tarea Completada en Notion con el issue abierto después de su fecha.
- Una tarea en ClickUp sin su enlace en el campo «ClickUp» de Notion.
