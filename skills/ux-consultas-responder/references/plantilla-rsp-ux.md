# Plantilla del RSP-UX (borrador de respuesta a una consulta)

Leer al escribir el archivo. Se crea en `questions/design/consultas/` con el nombre
`RSP-UX-<DSP>-<ORIGEN>-<AAAA-MM-DD>-<tema>.md` (ejemplo real: `RSP-UX-DSP-007-QA-2026-11-24-pantallas-auditoria.md`). Si la carpeta no existe en el árbol local, no inventarla: avisar y dejar el archivo en `design/consultas/`.

Los archivos de la KB (salvo `.agents/skills` y el `README.md` raíz) llevan frontmatter Google OKF v0.2.

```markdown
---
okf_version: "0.2"
id: RSP-UX-<DSP>-<ORIGEN>-<AAAA-MM-DD>
type: QA Consulta
title: "<DSP>: respuesta de UX a <consulta ID> de <área>"
description: "<una frase: qué se preguntó y cómo queda: respondido, propuesto o pendiente>"
version: "0.1.0"
status: draft
owner: team:ux-ui
classification: internal
tags: [ux-ui, consulta, <origen>, <dsp>]
generated: {by: "<modelo>", at: "<fecha ISO>"}
date: "<AAAA-MM-DD>"
sources:
  - {id: consulta, resource: "<archivo de la consulta; «fuera de la KB» si no está en el repo>"}
  - {id: <id>, resource: /<ruta de cada fuente usada>}
related: [<DSP>, <UXR/SCR/DEC/DH citados>]
---

**Pregunta antes de leer:** <la pregunta que esta respuesta permite contestar>

## En 30 segundos

<3 a 5 líneas: cuántos puntos hay, cuántos ya estaban respondidos, cuántos son propuesta, cuántos esperan a otra área y cuántos esperan a Enzo.>

De: Enzo Macalupu (UX/UI). Para: <quien preguntó>, con copia a <los de la consulta>.

## Resumen por punto

| Punto | Estado | Fuente | Qué hace falta |
|---|---|---|---|
| 1 | Vigente / Propuesta UX / Otra área / Decisión de Enzo / Sin fuente | DEC-NNN D#, UXR-NNN-Qn | <nada / confirmar / decidir> |

## Punto N · <título de la consulta>

- **Respuesta (etiqueta):** <texto; con la ruta de la fuente y su estado>
- **Qué desbloquea:** <los casos o pantallas que lo necesitan, como lo dice la consulta>
- **Opciones** (solo si es «Decisión de Enzo»): A, B, C como en la consulta, con efecto de cada una.
- **Recomendada (IA):** <opción y razón con fuente>. La decisión es de Enzo.

## Para tu conocimiento

<Desajustes hallados en documentos de la KB, sin corregirlos aquí.>

## Pendientes ajenos

<Área, persona, qué se le pide y fecha, tomados de la consulta o de la fuente.>

**Pregunta de comprobación:** <una pregunta cuya respuesta confirme que se entendió lo esencial.>
```

Reglas: `status: draft` siempre (solo Enzo lo pasa a `accepted`); `human-reviewed` nunca `true`; cada respuesta firme lleva ruta y fila de su fuente; lo propuesto se rotula «Propuesta UX» en la misma línea.
