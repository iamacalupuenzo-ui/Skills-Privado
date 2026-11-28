---
okf_version: "0.2"
id: UXR-140
type: UX Requirement
title: "UXR-140 — Personalizar la identidad visual del Cliente en Web Cliente"
description: "El Administrador del Cliente personaliza en Web Cliente la identidad de su Cliente por elemento, viendo de quién hereda cada uno, con al menos un elemento propio para guardar; sus usuarios la ven después de ingresar."
tags: [ux-ui, identidad-visual, cliente, web-cliente, herencia, administrador-del-cliente, dsp-009]
status: draft
generated:
  by: "ux-requirements-analyzer/2.0"
  at: "2026-11-26T16:30:00-05:00"
sources:
  - id: HU-01-14
    resource: /requirements/context-packs/user-stories/HU-01-14-personalizar-identidad-visual-cliente.md
  - id: HU-01-09
    resource: /requirements/context-packs/user-stories/HU-01-09-configurar-identidad-visual-distribuidor.md
  - id: DSP-009
    resource: /requirements/scope-packs/DSP-009-paquete-identidad-visual-cliente-producto.md
  - id: HUC-00
    resource: /requirements/context-packs/user-stories/HUC-00-catalogo-reglas-y-backlog.md
  - id: UXR-010
    resource: /design/ux-requirements/UXR-010-editar-identidad-visual-distribuidor-por-elemento.md
---

<!-- Ejemplo resumido de un UXR real del DSP-009 (Identidad visual del Cliente y base del
Producto). Muestra el modo CONTRASTAR: el front ya estaba construido (US268) y el UXR reutiliza
los del Distribuidor (UXR-010 a 014) en vez de repetirlos. -->

# UXR-140 — Personalizar la identidad visual del Cliente en Web Cliente

## En 30 segundos

Es el editor de la identidad del Distribuidor llevado al tercer nivel. Lo propio del Cliente:

- se configura en **Web Cliente**;
- cada elemento dice **de quién lo hereda**: del Distribuidor o del Producto;
- para guardar hace falta **al menos un elemento propio**; para volver a lo heredado se usa **Retirar**;
- sus usuarios la ven **después de ingresar**; el formulario de ingreso sigue con la marca del Distribuidor.

Desarrollo ya lo construyó (US268); el diálogo de retirar no avisa que lo propio se pierde.

## Requisito

El Administrador del Cliente personaliza la identidad de su Cliente por elemento (HU-01-14
AC-01). Cada elemento sin valor propio usa el del Distribuidor y, si este tampoco lo tiene, el del
Producto (BR-241). El editor, la vista previa y los estados son los del Distribuidor (UXR-010 a
UXR-014); este UXR solo agrega lo propio del nivel Cliente.

## Actor, plataforma y permisos

Administrador del Cliente, en Web Cliente, con el permiso de configurar la identidad (HU-01-14).
Los demás usuarios del Cliente solo la ven.

## Estados requeridos

| Momento | Qué ve o puede hacer | Clasificación |
|---|---|---|
| Sin identidad propia | Cada elemento muestra el valor heredado y de quién viene | Fuente (HU-01-14 AC-01; BR-241) |
| Guardar sin ningún elemento propio | No se permite; se explica por qué | Fuente (HU-01-14 AC-02) |
| Retirar | Pide confirmación y vuelve a lo heredado | Fuente (HU-01-14 AC-04); el aviso de pérdida es pregunta (Q1) |

## Criterios de aceptación de UX (observables)

**Funcionales (con fuente):**

- Junto a cada elemento heredado se lee si viene del Distribuidor o del Producto (HU-01-14 AC-01).
- Tras guardar, los usuarios del Cliente ven la identidad nueva después de ingresar (HU-01-14 AC-03).

**Accesibilidad y respaldo:**

- El origen de cada valor se comunica con texto, no solo con color (WCAG 1.4.1).

# Traceability

- Historia: [HU-01-14](../../requirements/context-packs/user-stories/HU-01-14-personalizar-identidad-visual-cliente.md) AC-01 a AC-04.
- Reutiliza: [UXR-010](UXR-010-editar-identidad-visual-distribuidor-por-elemento.md).

# Open questions

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
| --- | --- | --- | --- | --- | --- |
| UXR-140-Q1 | El diálogo de retirar construido no avisa que los valores propios se pierden. ¿Se confirma que se descartan, y el diálogo lo dice? | Product Owner | Media | No a Desarrollo; sí al texto del diálogo | Abierta |
| UXR-140-Q2 | Los textos de la pantalla son provisionales; falta redacción UX | UX | Baja | No | Abierta |

# Historial

| Fecha | Cambio |
|---|---|
| 2026-11-26 | Versión inicial (DSP-009, IDV-UX · 02): HU-01-14 contrastada con lo construido en US268 |
