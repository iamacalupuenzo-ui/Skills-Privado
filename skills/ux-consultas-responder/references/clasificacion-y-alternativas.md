# Clasificación de cada punto y cómo armar las alternativas

Leer al preparar la respuesta. Cada punto de la consulta recibe **una** etiqueta y, si la decisión es de Enzo, opciones.

## Etiquetas (vocabulario ya usado en los RSP-UX de la KB)

| Etiqueta | Cuándo | Qué se entrega |
|---|---|---|
| **Vigente** | Una fuente `accepted` o una DH responde exactamente | Cita con ruta y fila; sin opciones |
| **Construido** | Verificado leyendo el código, con rama y fecha | Qué hace el código; aclarar que no es decisión de diseño |
| **Propuesta UX** | La IA redacta una respuesta que ninguna fuente firme respalda | Texto propuesto, marcado por aprobar; nunca como hecho |
| **Otra área** | Lo decide o confirma Arquitectura, Desarrollo, PO, AF, QA, DBA, Seguridad o Infraestructura | Quién y qué se le pide; la IA no responde por esa área |
| **Decisión de Enzo** | Hay varias salidas válidas de diseño y ninguna fuente elige | Opciones A/B/C, recomendada y «Otra» |
| **Sin fuente** | Se buscó y no hay nada | Qué se buscó (fuentes y términos) y qué falta para decidir |
| **Borrador desfasado** | Lo que la consulta contrasta con el código es una especificación `draft` que nadie aprobó (o que Enzo ya decidió dejar a lo construido) | Qué decía, quién la generó, qué hace el código; se propone retirar o corregir el documento, no construir. Nunca se llama «brecha» |

Un mismo punto puede llevar dos etiquetas si tiene partes distintas (ejemplo en `fuentes-y-busqueda.md`, sección 4).

## Cuándo ofrecer opciones

- Ofrecer opciones solo en «Decisión de Enzo». Si hay una respuesta firme, darla; si es de otra área, nombrar al área.
- Entre 2 y 4 opciones **mutuamente excluyentes**, cada una con su efecto concreto (qué cambia en la pantalla, el UXR o el código; a quién afecta). Siempre «Otra» con espacio.
- Si la consulta ya trae opciones (formato A/B/C de QA), conservarlas con sus letras. Corregir una opción solo si contradice una fuente firme, y decirlo.
- **Recomendada:** una, con la razón en una frase que cite la fuente (no preferencia estética). Si dos opciones empatan, decirlo y no forzar.
- La recomendación es de la IA; la decisión es de Enzo. Escribirlo así.

## Qué no se hace

- No se responde a nombre de otra área ni se inventa un texto de interfaz «definitivo». Los textos nuevos son «Propuesta UX».
- No se pasa a respondida una pregunta cuya única fuente es `draft`.
- No se toma una DEC como firme solo porque la consulta la cite como si lo fuera: se mira su `status`.
- No se contradice un DEC/ADR/DH firme. Si la consulta lo contradice, se señala y se pregunta a Enzo.
- No se pide a Enzo lo que el código ya muestra: se lee el código primero (solo lectura).

## Prioridad y fecha

Heredar prioridad y fecha límite de la consulta («Bloquea el cierre», «Importante», «Informativa»). Ordenar la respuesta con lo que bloquea primero. Si la fecha ya pasó, decirlo.
