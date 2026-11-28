# Esquema actual de las bases de Notion (workspace «Gestión Operativa»)

Solo propiedades; sin filas. Leído por API el 2026-10-16. Páginas: «Bases» (contiene una página por base) y «Gestión de proyectos» (tablero con 3 vistas en línea sin título: Proyectos, Notas, Reuniones; no se inspeccionó su filtro).

## Proyectos
- Nombre (título)
- Estado (status): Bandeja | Planificación | En curso | Completado
- Salud (select): En curso | En riesgo | Bloqueado | En pausa
- Ámbito (select): Comsatel | Personal
- Prioridad (select): Baja | Media | Alta
- Objetivo (texto), Criterio de cierre (texto)
- Inicio, Fin objetivo, Fecha real de cierre (fechas)
- Tareas (relación ↔ Tareas.Proyecto)
- Notas (relación ↔ Notas.Proyecto)
- Recursos (relación ↔ Recursos.Proyecto)
- Avance (rollup de Tareas.Estado, función show_original)

## Tareas
- Nombre (título)
- Estado (status): Bandeja | Por hacer | En curso | Completada
- Prioridad (select): Baja | Media | Alta
- Proyecto (relación ↔ Proyectos.Tareas)
- Ámbito (rollup de Proyecto.Ámbito)
- Bloqueada por / Bloquea a (relaciones consigo misma)
- Inicio, Fecha límite, Fecha real de cierre (fechas). Descripción de Inicio: «La Fecha límite es obligatoria; el Inicio se pregunta siempre.»
- Horas estimadas, Horas reales (números)
- Criterio de cierre (texto), Solicitado por (texto), Issue (url)
- Resultado (select): Pendiente | Listo. Descripción: «Listo solo cuando la sección Resultado de la página tiene el entregable o su enlace.»
- Alerta de cierre (fórmula): si Estado = Completada y Resultado ≠ Listo → «Cerrada sin resultado»

## Reuniones
- Nombre (título), Fecha (fecha)
- Notas (relación ↔ Notas.Reunión)

## Notas
- Nombre (título)
- Estado (status): Fijada | Bandeja | En revisión | Guardada
- Etiquetas (multi-select): Finanzas | Proyecto | Reunión | Equipo | Cliente | Marketing
- Proyecto (relación ↔ Proyectos.Notas)
- Reunión (relación ↔ Reuniones.Notas)

## Recursos
- Nombre (título)
- Estado (status): Fijado | Bandeja | Sin revisar | En revisión | Revisado
- Tipo (select): Artículo | Video tutorial | Presentación | Informe técnico | Documentación de API
- Fecha (fecha)
- Proyecto (relación ↔ Proyectos.Recursos)

## Revisiones (base de pantalla completa, generada sola los lunes; solo lee Tareas)
- Nombre (título), Fecha, Tipo (select: Semanal), Leída (casilla)
- Contadores (números): En Bandeja, Vencidas, Vencen esta semana, Sin fecha límite, Cerradas sin resultado

## Relaciones
Proyectos ↔ Tareas, Notas, Recursos. Notas ↔ Reuniones. Tareas ↔ Tareas (bloqueos). Revisiones no tiene relaciones.
