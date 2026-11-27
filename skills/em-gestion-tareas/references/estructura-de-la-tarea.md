# Estructura de la tarea

Aprobada por Enzo el 2026-11-26. Combina lo mejor del issue #183 del equipo de Desarrollo (tabla de
contenido, alcance, criterios con casillas y condición de cierre) y del #204 de UX (cabecera con
origen, bloqueo y plazo, y trazabilidad con enlaces reales). Vale para UX y para Desarrollo.

**Un contenido, tres versiones.** El mapeo JSON es la única fuente. `armar-mapeo.mjs` genera la
versión de Notion, la de GitLab y la de ClickUp, y rechaza el mapeo si falta una sección.

## Títulos

| Nivel | Patrón | Ejemplo |
|---|---|---|
| Madre | `XXX-UX — <qué> (DSP-NNN)` o `XXX-FRONT — …` | IDV-UX — Diseño UX/UI de la identidad visual del Cliente y del Producto (DSP-009) |
| Subtarea | `XXX-UX · NN — <entregable> (HU-xx-yy y zz)` | IDV-UX · 03 — Pantallas de la identidad del Cliente en Web Cliente, con accesibilidad (HU-01-14) |
| ClickUp | `CL2: ` + el mismo título | CL2: IDV-UX · 03 — … |

El código de tres letras nombra el tema del paquete (HOM, ALT, AUD, IDV). Las subtareas agrupan
las historias por su relación, no una por historia.

## Secciones

| Sección | Notion | GitLab y ClickUp | Qué lleva |
|---|---|---|---|
| Antes de leer (callout) | Sí | No | Una pregunta cuya respuesta está en la página |
| Responsable / Construyó | Sí | En la cabecera | Quién responde y, en una revisión, quién construyó y en qué issue |
| Cabecera | No | Sí | Origen (madre o paquete), Responsable `@usuario`, Construyó, Bloqueada por, Plazo con horas |
| Tabla de contenido | Notion la arma sola | `[[_TOC_]]` en GitLab | — |
| En 30 segundos | Sí | No | Qué es, horas y fecha; máximo 3 líneas |
| El relato | Sí | No | El problema, dónde encaja y lo no decidido |
| **Alcance** | Sí | Sí | Qué se hace, qué incluye, qué no incluye y qué entrega |
| **Criterios de aceptación** | Sí | Sí | Qué AC de la historia cubre (sin copiarlos) y las casillas propias de la tarea |
| **Plan** (solo madres) | Sí | Sí | Una casilla por subtarea; se marca cuando la subtarea se cierra |
| **Condición de cierre** | Sí | Sí | Casillas de cuándo se puede cerrar; las fijas por tipo las agrega el script |
| **Trazabilidad** | Sí | Sí | Ver `trazabilidad.md` |
| Resultado | Sí | No | Lo llena Cerrar; la propiedad Resultado pasa a Listo |
| Capturas | Revisión, DS, entrega y construcción | No | Las agrega quien ejecuta |
| Comprueba | Sí | No | Una pregunta de comprobación |

En una tarea de construcción, cuando pasa a «En curso», el ejecutor agrega «Cómo funciona» y
«Cómo probarlo» (`flujo-producto/references/evidencia-de-avance.md`). Una página planificada no
las lleva vacías.

## Tipos de subtarea y lo que el script agrega

| Tipo | Criterios fijos | Condición de cierre fija |
|---|---|---|
| `ux` | — | Lo producido está en `develop` de la KB por un MR revisado · la trazabilidad enlaza cada artefacto |
| `ubicacion` | — | La tabla quedó en la tarea, con el enlace de cada rama e issue |
| `ds` | — | Cada brecha nueva está en GAPS.md por MR, o descartada con su motivo |
| `revision` | Lo construido coincide con sus pantallas y estados · brechas y desvíos con su dueño | Hallazgos comentados en el issue de la historia, con captura · lo que cambia el alcance se elevó como solicitud de cambio |
| `acompanamiento` | Preguntas respondidas · ajustes aplicados o registrados | Cada ajuste tiene su comentario o issue |
| `entrega` | ARP de cada pantalla construida (WCAG 2.2 AA) · paquete de entrega en Recursos · documento de pase con cada MR verificado · enviado a Desarrollo | Desarrollo confirmó la recepción en el issue de la historia |
| `construccion` | — | Integrado en `develop` con el pipeline en verde · listo para Calidad |
| madre | — | Las N subtareas cerradas · preguntas y cambios de alcance elevados, no supuestos |

El informe de accesibilidad (ARP) va en la entrega, no en el acompañamiento (Enzo, 2026-11-26).

## Propiedades de Notion

Estado «Por hacer», Resultado «Pendiente», Prioridad, Horas estimadas y Horas humano estimadas,
Inicio y Fecha límite, Criterio de cierre (una frase), Solicitado por, Producto, Proyecto,
Paquetes de alcance, Tarea padre, Bloqueada por, Issue y ClickUp. La base no tiene propiedad de
responsable: va en el cuerpo. Las horas de una madre son la suma de sus subtareas, y su criterio
lo dice para que no se sumen dos veces.

## El mapeo JSON (resumen)

```json
{ "paquete": { "id": "DSP-009", "nombre": "…", "ruta": "requirements/scope-packs/….md", "issue": 267 },
  "responsable": { "nombre": "Enzo Macalupu", "usuario": "emacalupu" },
  "historias": { "HU-01-14": { "issue": 268, "ruta": "…", "desarrollo": [270], "calidad": [271] } },
  "referencias": [ { "texto": "Decisión de Arquitectura", "ruta": "questions/…md", "en": ["IDV-FRONT · 01"] } ],
  "madres": [ { "codigo": "IDV-UX", "titulo": "… (DSP-009)", "antesDeLeer": "…", "en30": "…",
      "relato": { "problema": "…", "queSeHace": "…", "queEntrega": "…", "dondeEncaja": "…", "noDecidido": "…" },
      "alcance": { "incluye": ["…"], "noIncluye": ["…"] }, "cubre": [ { "historia": "HU-01-14", "ac": "AC-1 a AC-10" } ],
      "criterios": ["…"], "cierre": [], "artefactos": ["UXR-010"], "criterio": "… {n} … {horas} …", "comprueba": "…",
      "subtareas": [ { "n": "01", "tipo": "ux", "historias": ["HU-01-14"], "horas": 1.5, "inicio": "…", "limite": "…",
          "bloqueadaPor": ["IDV-UX · 01", "#272"], "construyo": { "nombre": "…", "usuario": "fbaltazar", "issue": 270 }, "…": "…" } ] } ] }
```

Ejemplo completo: el mapeo del DSP-009 (Identidad visual del Cliente y base del Producto), en
`ejemplos/mapeo-dsp-009.json`.
