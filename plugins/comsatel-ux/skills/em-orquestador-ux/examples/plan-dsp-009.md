# Ejemplo: plan del paquete DSP-009

Paquete real: DSP-009 (Identidad visual del Cliente y base del Producto), historias HU-01-14
(Web Cliente) y HU-01-16 (BackOffice). Las tareas salen de
`em-gestion-tareas/examples/mapeo-dsp-009.json`. Muestra cómo el orquestador ata cada fase a
su especialista, su tarea y su compuerta antes de ejecutar (paso 2 de `references/fases.md`).

## Diagnóstico

- **Escenario B, cambio sobre lo existente:** la identidad del Distribuidor (HU-01-09) ya tiene
  UXR-010 a 014, UXR-024, FLW-004 y SCR-011-013. El paquete la lleva a dos niveles nuevos.
- **Desarrollo ya avanzó:** HU-01-14 construida en #270. Manda el front construido; la
  exploración valida solo estructura y flujo.
- **Pregunta abierta que no bloquea:** HU-01-16-Q4 (aviso del conteo de Distribuidores),
  decide el PO. Se trabaja con la propuesta.

## Plan por fases

| Fase y especialista | Tarea | Compuerta |
|---|---|---|
| 0 · Paso 0 | IDV-UX · 01 — Mapa de reutilización (HU-01-14 y 16) | G0: tareas citadas y revisión de la KB registrada |
| 1–2 · `ux-requirements-analyzer` y `user-flow-designer` | IDV-UX · 02 — UXR y flujo de la herencia de identidad | G1 y G2: lineage a US y AC; FLW-004 declara sus pantallas |
| 3 · `ui-spec-writer` | IDV-UX · 03 (Web Cliente) y · 04 (BackOffice) | G3: SCR con estados, accesibilidad, INV y DEC |
| 3b · `ui-spec-writer` | IDV-UX · 05 — Componentes del DS por pantalla | Tabla pieza → componente, con brechas en GAPS.md |
| 4 · `claude-design-orchestrator` | Dentro de · 03 y · 04 (front ya construido) | G4: IB con capturas; solo estructura y flujo |
| 4b · `ux-context-builder` | IDV-UX · 06 — UXS-001 de la identidad visual | GU: `audit_ux.py --exigir-uxs` sin `PAQUETE_SIN_UXS` |
| 5 · `accessibility-reviewer` | IDV-FRONT · 03 y · 04 — Revisión de lo construido | G5: ARP sobre lo implementado, sin `pass` sin evaluar |
| 7 · `ux-development-handoff` | IDV-FRONT · 06 — Entrega a Desarrollo | G7: HOF y `DESIGN_READY_FOR_DEV` con todo validado |

Cada fase abre su tarea con AVANCE y la cierra con CERRAR en `em-gestion-tareas`. Una fase sin
tarea es trabajo nuevo: va a AJUSTAR antes de ejecutarse.

## Lo que no hace el orquestador

- No redacta los UXR ni las SCR: los pide a su especialista y verifica la compuerta.
- No cierra HU-01-16-Q4: es del PO. Queda en la UXS como pregunta abierta con responsable.
- No marca Validado sin la prueba de Enzo en el navegador, la captura y el ARP de esa versión.
