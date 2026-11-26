---
name: ux-requirements-analyzer
description: Usar cuando User Stories y reglas de negocio deban analizarse para producir UX Requirements (UXR-*) y preguntas abiertas, sin inventar respuestas a vacíos.
metadata:
  version: "1.0.0"
---

# ux-requirements-analyzer

## Purpose
Analizar requisitos UX sin inventar respuestas a vacíos.

## Course
UX-101

## Input contract
- Input: User Stories y reglas de negocio
- MUST receive a governed Context Pack or canonical source artifacts.
- MUST distinguish facts, assumptions, open questions, and human decisions.
- MUST NOT silently resolve missing business information.

## Output contract
- Output: UX Requirement + preguntas abiertas
- Markdown outputs MUST conform to the UX/UI track conventions for Google OKF v0.2.
- New or modified concepts start with `status: draft`.
- The skill MUST set `generated.by` to its own actor/version.
- The skill MUST NOT set or fabricate `verified`.
- Open questions MUST be explicit.

## Workflow
1. Validate required inputs and provenance.
2. Extract relevant constraints and traceability links.
3. Generate candidate output(s).
4. Critique against UX requirements, acceptance criteria, accessibility, and Design System where applicable.
5. Produce draft OKF concepts and a concise change summary.
6. Stop for human review when a decision, ambiguity, or conflict requires judgment.

## Guardrails
- Never treat generated UI as approved merely because it renders.
- Never invent user research, business rules, accessibility evidence, or approvals.
- Preserve lineage to upstream US/UXR/FLW/SCR/CMP/AC concepts.
- Prefer semantic design tokens over raw visual values.
- External-tool exports are references, not the canonical knowledge artifact.

## Quality checks
- Required sources exist.
- Traceability links are resolvable.
- No critical open question is hidden.
- Output is reproducible from recorded context.
- Human verification remains pending unless supplied by a human workflow.

## Definition of Done
The skill output is ready for human review, is traceable to its sources, and can be added to the UX/UI OKF bundle without losing provenance.

## Comportamientos bloqueantes

- **B1 — Ciclo de retroalimentación obligatorio.** Al inicio y al cierre de cada desarrollo, mejora, análisis o definición, invocar a `ux-ui-orchestrator` y leer su [protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/ux-ui-orchestrator/references/ciclo-retroalimentacion.md) (resolver primero la versión local de ese skill o la fuente central). Sin informe de un agente de verificación previa distinto de quien construye, no empezar; sin sincronización comprobada, no declarar terminado. El orquestador conserva los formatos y dueños de artefactos; si falta el protocolo, detenerse y reportarlo.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| «Es solo un artefacto o una revisión; sincronizo después» | Invocar al orquestador conserva su autoridad y exige las dos compuertas también en encargos directos (B1). |
