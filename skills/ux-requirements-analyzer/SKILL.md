---
name: ux-requirements-analyzer
description: Escribe y mantiene los Requerimientos UX (UXR) de la KB de Comsatel a partir de historias (HU), reglas de negocio y decisiones: qué debe permitir la interfaz, para qué actor, plataforma y permiso, con qué estados y criterios observables, clasificando cada afirmación (fuente, inferencia, buena práctica o propuesta) y dejando cada vacío como pregunta abierta con su responsable. Úsalo cuando pidan "saca los UXR del DSP-0NN", "analiza esta historia para UX", "qué requisitos de UX tiene esto", "actualiza el UXR porque cambió la HU", "contrasta el UXR con lo construido" o cuando el orquestador UX lo llame en la fase 1. No diseña flujos ni pantallas (usa user-flow-designer y ui-spec-writer) ni decide negocio.
metadata:
  version: "2.0.0"
  origen: "Nació del catálogo de Ilver (1.0.0); adaptado a la KB de Comsatel el 2026-11-28"
---

# Analista de requerimientos UX

Convierte historias validadas en Requerimientos UX (UXR) trazables: lo que la interfaz debe
permitir, mostrar y evitar, sin diseñar la pantalla. Es la fase 1 de `em-orquestador-ux`; su
salida la leen `user-flow-designer` (FLW) y `ui-spec-writer` (SCR). Cada afirmación lleva su
fuente o su clasificación, y lo que nadie decidió queda como pregunta con responsable.

## Verificación de arranque

1. Ciclo de retroalimentación (B1): informe de inicio de otro agente antes de escribir.
2. La KB se lee de `origin/develop` (`git show origin/develop:<ruta>`); se escribe en un worktree `ux/<slug>`.
3. Existen las historias (HU) del paquete y su DSP en `requirements/`. Sin historia, no hay UXR (B2).
4. Buscar UXR existentes del mismo tema antes de crear uno (`design/ux-requirements/`, por HU y por etiqueta `dsp-NNN`).

## Modos

| Modo | Señales | Leer |
|---|---|---|
| `CREAR` | Paquete o historia sin UXR | `references/anatomia-del-uxr.md` y `references/clasificacion-y-fuentes.md` |
| `ACTUALIZAR` | Cambió una HU, regla, decisión o respuesta del PO | `references/reutilizar-y-actualizar.md` |
| `CONTRASTAR` | El front ya está construido | `references/reutilizar-y-actualizar.md` (sección 3): manda lo construido; el UXR registra la diferencia |

Declarar el modo en la primera línea. Si el pedido es ambiguo, preguntar una sola cosa: la historia o el paquete de partida.

## Guías por paso

| Cuándo | Leer |
|---|---|
| Al escribir o revisar las secciones | `references/anatomia-del-uxr.md` |
| Al afirmar algo (con fuente o sin ella) | `references/clasificacion-y-fuentes.md` |
| Al encontrar un vacío o una contradicción | `references/preguntas-abiertas.md` |
| Si ya hay UXR del tema o algo cambió | `references/reutilizar-y-actualizar.md` |
| Antes de escribir en la KB | `references/reglas.md` |

Plantilla en `templates/UXR.plantilla.md`; ejemplo resuelto en `examples/UXR-140-resumido.md`.

## Validación obligatoria

```bash
python scripts/validar_uxr.py <kb>/design/ux-requirements/UXR-NNN-*.md   # forma del UXR
python <em-orquestador-ux>/scripts/audit_ux.py <kb> --compuerta G1      # HU existentes y lineage
```

Un error bloquea la entrega. Un aviso «ningún FLW lo lista» es normal hasta la fase 2.

## Reglas de bloqueo

Detalle, excusas comunes y señales de alerta en `references/reglas.md`.

- **B1 — Ciclo de retroalimentación obligatorio.** Inicio y cierre según el [protocolo](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/em-orquestador-ux/references/ciclo-retroalimentacion.md) de `em-orquestador-ux`.
- **B2** — Sin historia (HU) existente no hay UXR; cada UXR cita sus HU y AC.
- **B3** — Toda afirmación lleva fuente (HU, AC, BR, DH, E, DEC) o su clasificación: inferencia, buena práctica o propuesta.
- **B4** — No inventar negocio: un vacío de reglas, permisos, datos o alcance es pregunta para el PO, no un requisito.
- **B5** — Actualizar, no reemplazar: los IDs son permanentes; lo sustituido se marca y se fecha.
- **B6** — Describe qué permite la interfaz, no cómo se ve: sin colores, medidas ni componentes concretos.
- **B7** — `status: draft` siempre; nunca `approved` ni `verified` por su cuenta.
- **B8** — Etiqueta `dsp-NNN` del paquete; sin ella el UXR no entra en la UXS.
- **B9** — La historia es del analista: se le propone un comentario, no se edita.
- **B10** — Un cambio que afecta a otra área deja su aviso de impacto en `avisos/`.

## Cierre

Modo; UXR creados o actualizados con su ruta; resultado de `validar_uxr.py` y de la compuerta
G1; preguntas abiertas nuevas con responsable y si bloquean; avisos emitidos; siguiente skill
(`user-flow-designer`).
