# Anatomía del UXR

## Índice

1. Dónde vive y cómo se llama
2. Frontmatter
3. Secciones, en orden
4. Qué no va en un UXR

## 1. Dónde vive y cómo se llama

`design/ux-requirements/UXR-NNN-<slug-en-español>.md` en la KB. El número es el siguiente libre
en `origin/develop` (revisar también las ramas `ux/*` abiertas para no chocar). El slug describe
lo que se permite, no la pantalla: `UXR-043-otorgar-una-autorizacion-temporal`, no
`UXR-043-modal-autorizacion`. Un UXR cubre una capacidad; si una historia trae varias
(alta, edición, retiro), se separan o se agrupan por lo que un flujo recorre junto.

## 2. Frontmatter

```yaml
okf_version: "0.2"
id: UXR-NNN
type: UX Requirement
title: "UXR-NNN — <frase que dice qué permite la interfaz>"
description: "<una o dos frases: actor, qué hace, condición clave>"
tags: [ux-ui, <tema>, <plataforma>, <actor>, dsp-NNN]
status: draft
generated:
  by: "ux-requirements-analyzer/2.0"
  at: "AAAA-MM-DDTHH:MM:SS-05:00"
sources:
  - id: HU-NN-NN
    resource: /requirements/context-packs/user-stories/HU-NN-NN-<slug>.md
  - id: DSP-NNN
    resource: /requirements/scope-packs/DSP-NNN-<slug>.md
```

- `sources` lista todo lo que se cita en el cuerpo: HU, DSP, catálogo HUC-00 (reglas BR), RCP-001
  (DH y E), DEC y otros UXR reutilizados.
- `status` nace y sigue en `draft`. Solo una persona lo cambia (B7).
- La etiqueta `dsp-NNN` es obligatoria (B8): `audit_ux.py` arma el inventario de la UXS con ella.

## 3. Secciones, en orden

| Sección | Qué lleva | Cuándo es obligatoria |
|---|---|---|
| `# UXR-NNN — Título` | Igual al `title` | Siempre |
| `## En 30 segundos` | Qué cambia para el usuario en 3–5 viñetas; si ya está construido, qué difiere | Siempre |
| `## Requisito` | La capacidad en prosa, con fuente en cada frase | Siempre |
| `## Actor, plataforma y permisos` | Quién, en qué producto (Web Cliente, Móvil Cliente, BackOffice) y qué permiso; si no requiere, decirlo | Siempre |
| `## Estados requeridos` | Tabla `Momento · Qué ve o puede hacer · Clasificación`: inicial, vacío, carga, error, éxito, sin permiso, bloqueos | Siempre |
| `## Vista desde la UI (sin diseñar la pantalla)` | Tabla `Elemento · Visible · Ubicación y jerarquía propuesta · Clasificación` | Si hay información que mostrar u ocultar |
| `## Criterios de aceptación de UX (observables)` | Viñetas verificables por QA, agrupadas: funcionales (con fuente), accesibilidad y respaldo, seguridad | Siempre |
| `# Traceability` | Enlaces relativos a HU (con AC), reglas, decisiones y UXR relacionados | Siempre |
| `# Open questions` | Tabla de preguntas (ver `preguntas-abiertas.md`) o «Ninguna abierta» | Siempre |
| `# Historial` | Tabla `Fecha · Cambio`, la más reciente arriba | Siempre |

Un criterio observable se puede comprobar mirando la interfaz o su resultado: «tras ingresar, el
usuario de un Cliente sin identidad propia ve la del Distribuidor». No lo es «la experiencia es
clara».

## 4. Qué no va en un UXR

- Colores, medidas, tipografías, componentes del DS o disposición exacta: eso es de la SCR (B6).
  La columna «Ubicación y jerarquía propuesta» sí admite jerarquía («encabezado del formulario»).
- La lista de pantallas o el orden de pasos: eso es del FLW.
- Decisiones de negocio tomadas por el agente: van como pregunta (B4).
- Texto copiado de la HU sin análisis: el UXR dice qué implica para la interfaz y qué falta.
