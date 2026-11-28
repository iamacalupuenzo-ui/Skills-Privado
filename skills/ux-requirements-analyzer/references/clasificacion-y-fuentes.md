# Clasificación y fuentes

## Índice

1. Las cuatro clases
2. Dónde están las fuentes
3. Cómo citar
4. Contradicciones entre fuentes

## 1. Las cuatro clases

Cada frase del requisito, cada fila de estados y cada criterio lleva una de estas marcas.

| Clase | Cuándo | Cómo se escribe |
|---|---|---|
| **Fuente** | Lo dice una HU, su AC, una regla BR, una decisión DH, E o DEC | Cita entre paréntesis: `(BR-241; HU-01-09 AC-03)` |
| **Inferencia** | Se deduce de una fuente, pero ninguna lo dice | `**Inferencia** (de BR-244): …` y, si importa al negocio, una pregunta |
| **Buena práctica UX** | Lo exige la usabilidad o la accesibilidad, no el negocio | `**Buena práctica** (Nielsen #4)` o la pauta WCAG: `(WCAG 1.1.1)` |
| **Propuesta** | Alguien propone algo que aún no se decide | `**Propuesta de <quién>, <fecha>, pendiente de <responsable>**` |

Una inferencia que cambia permisos, datos, alcance o reglas no se queda como inferencia: pasa a
pregunta para el PO (B4). Una buena práctica nunca se presenta como regla de negocio.

## 2. Dónde están las fuentes

| Prefijo | Qué es | Dónde está en la KB |
|---|---|---|
| HU-NN-NN y AC-N | Historia y su criterio de aceptación | `requirements/context-packs/user-stories/` |
| DSP-NNN | Paquete de alcance | `requirements/scope-packs/` |
| BR-NNN | Regla de negocio | Catálogo `HUC-00-catalogo-reglas-y-backlog.md` |
| DH-NN, E-NN | Decisión histórica y estándar del producto | `requirements/context-packs/RCP-001-cl2-flotas-estandar.md` |
| DEC-NNN | Decisión de diseño | `design/decisiones/` |
| QST, RSP, AVS | Consulta, respuesta y aviso de otra área | `questions/` y `avisos/` |

Leer de `origin/develop`. Si la fuente cambió desde la última vez, `cambios-kb.mjs` del
orquestador lo muestra con la sección tocada.

## 3. Cómo citar

- En el cuerpo, la sigla entre paréntesis; en `# Traceability`, el enlace relativo desde
  `design/ux-requirements/` hasta la historia en `requirements/context-packs/user-stories/`,
  con los AC usados (la plantilla trae el formato).
- Toda sigla citada en el cuerpo está en `sources` del frontmatter.
- Citar el AC concreto, no solo la historia: `HU-01-14 AC-03`.
- Si la historia no menciona algo que el UXR necesita, decirlo: «HU-02-02 no menciona identidad:
  brecha». Es información para el analista, no un error del UXR.

## 4. Contradicciones entre fuentes

No se elige una (regla del orquestador, B12). Se escriben las dos con su cita, se abre una
pregunta con el responsable que decide y se marca si bloquea. Si una decisión posterior sustituye
a otra, se conserva la anterior tachada en prosa («sustituida el AAAA-MM-DD por DEC-NNN») y se
registra en `# Historial`.
