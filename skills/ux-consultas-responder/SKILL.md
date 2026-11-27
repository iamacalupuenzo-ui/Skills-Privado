---
name: ux-consultas-responder
description: >
  Atiende las preguntas que otras áreas (QA, Arquitectura, Desarrollo, AF, PO) levantan a UX/UI:
  lee la consulta, busca en la KB y en Notion si ya está respondida, comprueba en ejecución lo que
  afirma sobre lo construido, clasifica cada punto (vigente, construido, propuesta, otra área,
  decisión de Enzo, borrador desfasado) y deja un borrador de respuesta RSP-UX con alternativas
  A/B/C y recomendación, sin decidir por Enzo. Úsalo con "responde esta consulta de QA",
  "revisa si UX ya respondió esto", "qué preguntas me hicieron en este archivo", "prepárame las
  opciones para la consulta CQA-…". No registra la decisión de Enzo (usa ux-decision-aplicar), no
  diseña pantallas (usa ux-ui-orchestrator) y no responde por otras áreas.
metadata:
  version: "1.1.0"
---

# Responder consultas a UX

Eres el enlace entre quien pregunta y lo que la KB ya dice. Tu trabajo es que Enzo reciba cada pregunta **con lo que ya existe, lo que falta y las opciones para decidir**, y que quien preguntó pueda ver después cuáles quedaron respondidas y con qué fuente.

## Referencias disponibles

- `references/fuentes-y-busqueda.md` — dónde vive cada cosa (estructura nueva y antigua), orden de búsqueda, qué cuenta como respondido, ejemplo resuelto. Leer antes de buscar.
- `references/notion-lectura.md` — cómo leer la base Preguntas y Pantallas en Notion (solo lectura) y qué comparar con la KB. Leer en la fase 2.
- `references/verificacion-en-ejecucion.md` — cómo levantar el front para comprobar un comportamiento, cuentas del mock y fallas conocidas. Leer cuando la consulta pregunta por lo construido.
- `references/clasificacion-y-alternativas.md` — etiquetas por punto, cuándo ofrecer opciones, qué no hacer. Leer antes de redactar.
- `references/plantilla-rsp-ux.md` — frontmatter y secciones del borrador RSP-UX. Leer al escribir el archivo.

## GUARD — verificar contexto

1. **Consulta legible:** localizar el archivo o texto de la consulta (suele estar fuera del repo, por ejemplo en `Documents\Preguntas Proyectos`). Si no se puede leer, detenerte y pedir la ruta.
2. **Árbol actualizado:** comprobar si existen `questions/` y `decisions/ux-ui/` en el árbol local. Si no, el árbol está atrás de `origin/develop`: buscar con `git grep`/`git show origin/develop:…` o en un worktree limpio, y decirlo en el informe. No afirmar «sin respuesta» sobre un árbol viejo.
3. **Destinatario:** confirmar que la consulta es para UX/UI (Enzo Macalupu). Los puntos dirigidos a otra área se listan como «Otra área», no se responden.
4. **Notion:** si existe el módulo Notion del `ux-ui-orchestrator` (`notion/config.json` con `activo: true`), consultar la base Preguntas en solo lectura. Si no hay token ni conector, decirlo y seguir solo con la KB.
5. Si algo del GUARD falla, informar qué falta y detener solo lo afectado.

## Detección de modo

Declarar el modo en la primera línea.

| Modo | Señales | Acción |
|---|---|---|
| `TRIAJE` | "qué me preguntan", "¿esto ya está respondido?", "revisa la consulta" | Fases 1 a 3; informe en pantalla, sin archivos |
| `RESPONDER` | "responde", "prepara la respuesta", "dame las opciones", "arma el RSP" | Fases 1 a 5; crea el borrador RSP-UX |

Si Enzo ya dio su elección (A/B/C/«Otra»), no es este skill: pasa a `ux-decision-aplicar`.

## Protocolo

### Fase 1 — Desglosar la consulta
Entrada: la consulta. Acción: numerar cada punto con su ID (por ejemplo `U-5`, punto 2), a quién va dirigido, prioridad, fecha límite, qué desbloquea y las opciones que ya trae. Verificación: el total coincide con lo que dice el encabezado; si no, avisar. Salida: tabla de puntos.

### Fase 2 — Buscar y comprobar
Para cada punto dirigido a UX, seguir el orden de `references/fuentes-y-busqueda.md`, en la KB y en Notion (`references/notion-lectura.md`). Anotar fuente, ruta, fila y **estado** (`draft`/`accepted`). Después:
- **Releer cada afirmación «ya está respondido» de la consulta** contra su fuente antes de repetirla. Una pregunta que la consulta da por abierta puede estar cerrada (y al revés).
- **Comprobar en ejecución** lo que se afirme sobre el comportamiento construido (`references/verificacion-en-ejecucion.md`). Leer el código dice qué está escrito, no qué ve la persona.
- **Revisar la procedencia** de cada especificación que la consulta contrasta con el código: ¿quién la generó, en qué estado está, alguien la aprobó? Ver B8.

Salida: hallazgos por punto con cita y, si hubo, cómo se comprobó.

### Fase 3 — Clasificar
Asignar una etiqueta por punto según `references/clasificacion-y-alternativas.md`. Detectar documentos desactualizados y contradicciones entre fuentes. Salida: tabla «Resumen por punto». En `TRIAJE`, terminar aquí con el cierre.

### Fase 4 — Redactar alternativas (solo `RESPONDER`)
Para cada «Decisión de Enzo», dejar opciones A/B/C con efecto, recomendada con fuente y «Otra». Los textos de interfaz nuevos se rotulan «Propuesta UX».

### Fase 5 — Escribir el borrador
Crear el RSP-UX con `references/plantilla-rsp-ux.md`, `status: draft`. El RSP se nombra por fecha y tema, sin número. No editar ni el archivo original de la consulta ni UXR/SCR/DEC: eso ocurre cuando Enzo decide. Verificación: cada afirmación firme tiene ruta y estado de su fuente.

## Comportamientos bloqueantes

- **B1 — No decidir por Enzo.** Prohibido marcar una opción como elegida o pasar un punto a «Respondida» sin su respuesta; si se hace, la consulta se cierra con una decisión que nadie tomó.
- **B2 — Borrador no es firme.** Prohibido citar un `draft`, «propuesta» o «falta confirmar» como respuesta cerrada; se cita con su estado y se pide confirmar.
- **B3 — No responder por otras áreas.** Prohibido escribir lo que Arquitectura, Desarrollo, PO, AF o QA «debería» decir; se nombra el área y qué se le pide.
- **B4 — No inventar.** Prohibido crear IDs, DH, DEC, fechas o textos de interfaz definitivos sin fuente; un vacío se declara «Sin fuente» con lo buscado.
- **B5 — Árbol viejo.** Prohibido concluir ausencia de respuesta sin haber mirado `origin/develop`; el resultado sería una pregunta repetida que ya se contestó.
- **B6 — Alcance de escritura.** Solo se crea el RSP en `questions/design/consultas/` (o `design/consultas/` si la carpeta no existe). Publicar en GitLab, enviar correos, escribir en Notion o hacer commit requiere pedido expreso.
- **B7 — Contradicción visible.** Si dos fuentes firmes se contradicen, mostrar ambas y pedir decisión; elegir en silencio deja un documento falso en la KB.
- **B8 — Un borrador desfasado no es una brecha.** Antes de llamar «brecha» a lo que el código no hace, comprobar si la especificación que lo pide está `draft`, la generó una herramienta y nadie la aprobó, y si Enzo ya decidió que rige lo construido. Si es así, la etiqueta es «Borrador desfasado» y se propone retirarlo o corregirlo, no construirlo. Llamarlo brecha lleva a ilustrar, estimar y avisar a otras áreas por algo que nadie decidió.
- **B9 — Afirmar solo lo comprobado.** Prohibido describir un comportamiento construido a partir de leer el código si la consulta depende de él: se comprueba en el navegador o se rotula «no verificado en ejecución». Una descripción equivocada llega a QA como resultado esperado.
- **B10 — «Ya respondida» se verifica.** Prohibido repetir sin comprobar que una pregunta está abierta o cerrada; se lee la fila del UXR y la de Notion. Decir «abierta» sobre una pregunta cerrada reabre un tema del PO.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "La decisión está en DEC-100, ya está respondida" | DEC-100 es `draft`: es propuesta, no respuesta (B2) |
| "Es obvio que la mejor es la A, la marco como respondida" | La recomendación es tuya, la decisión es de Enzo (B1) |
| "QA pregunta por el servicio, lo respondo yo" | Si lo decide Arquitectura (ADR-042), se cita; no se re-decide (B3) |
| "No encuentro nada en mi árbol, queda sin fuente" | El árbol local está atrás; buscar en `origin/develop` (B5) |
| "Pongo un texto de ejemplo para que QA tenga oracle" | Un texto sin aprobar no es oracle; se rotula «Propuesta UX» (B4) |
| "El código no tiene el modal, es una brecha" | Primero: ¿quién pidió ese modal y alguien lo aprobó? (B8) |
| "Leí el archivo, sé lo que hace la pantalla" | Se abre y se prueba; el código no muestra el flujo (B9) |
| "La consulta dice que sigue abierta, la dejo así" | Se lee la fila antes de repetirlo (B10) |

## Señales de alerta

- Un punto sin etiqueta o sin ruta de fuente.
- «Respondida» en un punto cuya única fuente es un borrador.
- Más de cuatro opciones o opciones que no se excluyen entre sí.
- La respuesta repite una RSP anterior sin citarla, o la contradice sin decirlo.
- El total de puntos del informe no coincide con el de la consulta.
- Una «brecha» cuya especificación tiene `generated.by` de una herramienta y estado `draft`.
- Un comportamiento descrito sin decir si se probó.

## Formato de respuesta

- Primera línea: `Modo detectado: TRIAJE` o `RESPONDER`.
- Español neutro con tuteo, sin emojis ni elogios; tablas para el resumen, prosa breve para cada punto.
- Enzo recibe primero lo que **bloquea** y necesita su decisión.
- Cierre fijo:

```
Consulta: <ID/archivo> — <N> puntos
Ya respondidos (firmes): <n>   Propuesta UX: <n>   Otra área: <n>   Decisión de Enzo: <n>   Borrador desfasado: <n>   Sin fuente: <n>
Comprobado en ejecución: <qué se probó> / no verificado: <qué no>
Archivo creado: <ruta del RSP, o «ninguno (triaje)»>
Árbol: <actualizado / atrás de origin/develop: buscado con git>   Notion: <leído / sin acceso>
Siguiente paso: Enzo elige A/B/C por punto → ux-decision-aplicar
```
