# Página del paquete en Notion

**¿Qué va arriba en la página de un DSP y qué sale de la KB?**

**En 30 segundos:** arriba van dos vistas vivas, «Historias del paquete» y «Tareas del paquete». Debajo va el resumen («Qué se logra», «Alcance»…) y, después del aviso «Contenido generado desde el repositorio», el paquete tal como está en la KB. Las vistas no salen de la KB. Las crea el agente una vez, y `cargar-paquete.js` las conserva y las deja arriba en cada carga.

## Estructura (Enzo, 2026-11-26)

| Orden | Bloque | De dónde sale |
|---|---|---|
| 1 | Vista **Historias del paquete** | Base Historias, filtrada por el paquete |
| 2 | Vista **Tareas del paquete** | Base Tareas, filtrada por el paquete |
| 3 | Resumen: Qué se logra, Alcance… | La página (se conserva al cargar) |
| 4 | Aviso y contenido del paquete | KB (`origin/develop`), con `cargar-paquete.js` |

Es la misma estructura del DSP-004 al DSP-007; el DSP-009 se completó así el 2026-11-26.

## Crear las vistas (una vez por paquete, en RECIBIR)

La API REST no crea vistas vinculadas, así que el agente las crea con la herramienta de vistas de Notion (`notion-create-view`), con `parent_page_id` = la página del paquete:

1. **Historias del paquete**: data source `collection://4951a7d0-6388-820e-8c76-87b77818bc9f`, tabla.
   `FILTER "Paquetes de alcance" = "<id del paquete>"; SORT BY "ID" ASC; SHOW "ID", "Nombre", "Estado de bloqueo", "Resumen de preguntas", "Enlace GitLab"`
2. **Tareas del paquete**: data source `collection://87a1a7d0-6388-82a0-82c0-8709ea959111`, tabla.
   `FILTER "Paquetes de alcance" = "<id del paquete>"; GROUP BY "Estado" BY OPTION HIDE EMPTY; SORT BY "Inicio" ASC; SHOW "Nombre", "Estado", "Inicio", "Fecha límite", "Horas humano estimadas", "Horas con IA", "Issue"; WIDTH "Nombre" 454`

La herramienta las agrega al final de la página. Después se corre `cargar-paquete.js`, que las sube arriba.

## Qué controla el script

- Si la página del paquete no tiene las dos vistas, el resultado trae `faltanVistas` y el informe de `cambios-kb.mjs` lo muestra. El agente las crea antes de seguir.
- Una página con contenido largo escrito a mano y sin el aviso generado no se reemplaza (caso real: DSP-001, HU-02-01 y HU-07-02). Se le pregunta a Enzo qué hacer.

**Comprueba:** si alguien borra la vista «Tareas del paquete» del DSP-009, ¿qué pasa en la próxima carga?
