# Anatomía del flujo (FLW)

## Índice

1. Dónde vive y cómo se llama
2. Frontmatter
3. Secciones, en orden
4. Qué no va en un flujo

## 1. Dónde vive y cómo se llama

`design/user-flows/FLW-NNN-<slug-en-español>.md`. El número es el siguiente libre en
`origin/develop` y en las ramas `ux/*` abiertas. El slug nombra la tarea del usuario con un verbo:
`FLW-043-otorgar-una-autorizacion-temporal`, no `FLW-043-modal`. Un flujo cubre una tarea completa
de un actor; si dos actores hacen cosas distintas con la misma información, son dos flujos.

## 2. Frontmatter

```yaml
okf_version: "0.2"
id: FLW-NNN
type: User Flow
title: "FLW-NNN — <verbo + qué logra el usuario>"
description: "<actor> <hace qué> <en qué plataforma>; <rama clave>."
tags: [ux-ui, user-flow, <tema>, <plataforma>, dsp-NNN]
status: draft
generated:
  by: "user-flow-designer/2.0"
  at: "AAAA-MM-DDTHH:MM:SS-05:00"
requirements: [HU-NN-NN, UXR-NNN]
screens: [SCR-NNN]
sources:
  - id: UXR-NNN
    resource: /design/ux-requirements/UXR-NNN-<slug>.md
```

- `requirements` es lo que lee `audit_ux.py` para saber qué UXR tienen flujo. Un UXR que el flujo
  recorre y no está aquí queda como «UXR sin flujo».
- `screens` es la lista FLW → SCR (ver `pantallas-del-flujo.md`).

## 3. Secciones, en orden

| Sección | Qué lleva |
|---|---|
| `> Leyenda` | Las marcas que usa el flujo (`ramas-y-marcas.md`) y que el layout es de `ui-spec-writer` |
| `## En 30 segundos` | El recorrido en un párrafo y la rama que más importa |
| `## 1. Propósito y alcance` | Qué logra el actor y qué queda fuera (y en qué otro flujo vive) |
| `## 2. Actor, plataformas y permisos` | Tabla `Dato · Valor · Fuente`: actor, plataforma, ruta de entrada, permiso, flujo base reutilizado |
| `## 3. Supuestos y decisiones que condicionan el flujo` | Decisiones vigentes (DEC, DH) y propuestas pendientes, con su fuente |
| `## 4. Pantallas declaradas (FLW → SCR)` | Tabla `SCR · Nombre · Qué cubre · Base` |
| `## 5. Camino feliz` | Tabla `Paso · Actor o sistema · Acción · Resultado · Fuente`, pasos P1…Pn; caminos alternos como `###` con prefijo propio (R1…) |
| `## 6. Ramas, excepciones y permisos` | Tabla `ID · Condición · Tratamiento · Fuente o estado`; las reutilizadas en una subsección aparte |
| `## 7. Estados del flujo` | Tabla de estados (cargando, vacío, error, sin permiso, éxito, y los del dominio) |
| `## 8. Diagrama` | Un bloque `mermaid` `flowchart TD` con decisiones como rombos y las ramas de error |
| `## 9. Trazabilidad` | HU con AC, UXR, flujos relacionados, lo construido (repo y ruta) y la tarea |
| `## 10. Accesibilidad` | Lo transversal del recorrido (foco, avisos, teclado); remite al UXR de accesibilidad |
| `## 11. Preguntas abiertas que afectan al flujo` | Tabla `ID · Rama · Responsable · Bloquea`; los IDs son los del UXR |
| `# Historial` | Tabla `Fecha · Cambio`, la más reciente arriba |

## 4. Qué no va en un flujo

- Disposición, tamaños, colores o componentes del DS: es de la SCR (B7). «Se abre un diálogo de
  confirmación» sí; «un `cs-modal` de 480 px» no.
- Textos finales de interfaz: se escribe la intención («avisa que se descartan los cambios») y el
  texto provisional va marcado como tal.
- Preguntas nuevas sin dueño: toda pregunta vive en su UXR; el flujo solo la referencia.
