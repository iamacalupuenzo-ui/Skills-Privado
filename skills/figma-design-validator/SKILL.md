---
name: figma-design-validator
description: Usar cuando un diseño en Figma deba validarse contra el bundle OKF y registrarse como diseño gobernado de un SCR-*, o cuando Stitch y Figma difieran para una misma pantalla.
---

# figma-design-validator

## Purpose
Validar Variables, componentes, estados, naming y correspondencia con conceptos OKF, y **declarar cuál es el `governed_design`** de cada SCR. Figma es la fuente gobernada del diseño final una vez refinado y aprobado; Stitch queda como `exploration_design` (lineage).

## Course
UX-105

## Input contract
- Figma (archivo/nodo por SCR) + bundle OKF: SCR, FLW, CMP, TKN, DTM, `exploration_design` de Stitch si existe.
- Lectura de Figma con las herramientas Figma MCP; si no hay acceso autorizado, el resultado es `BLOCKED` (no se asume el contenido).
- MUST receive a governed Context Pack or canonical source artifacts.

## Output contract
- Design Validation Report (`type: Design Validation Report`, OKF v0.2, `status: draft`, `generated.by: figma-design-validator/2.0`, nunca `verified`).
- Entrada `governed_design` y `stitch_figma` en el Design Traceability Map (DTM), escrita con `validators/cli.py register-governed` (ver `references/governed-design.md`).
- Divergencias Stitch↔Figma listadas con su SCR; sin DD humano quedan `open`.

## Preconditions
El SCR existe con `flow`, requisitos, `required_states`, `responsive`, componentes y tokens. Cada nodo Figma corresponde a un SCR; un nodo sin SCR es huérfano y no se registra.

## Invariants
- `governed_design.status: approved` solo si hay `approved_by: human:<id>` y la divergencia con Stitch no está `open`.
- Registrar `states_covered` y `responsive_covered` solo con lo que se observó en Figma.
- Al aprobar Figma, `exploration_design` pasa a `superseded` y se conserva.
- Referencias Figma: `file_ref`, `node_ref` y `version` reales. Si Figma no expone versión, documentar la limitación; no inventar.
- Al verificar en vivo, fijar `latest_known_version`; si difiere de `version`, la referencia queda obsoleta (`STALE_FIGMA_REFERENCE`).

## Workflow
1. Leer el SCR y su entrada DTM; leer el nodo Figma.
2. Comparar con el SCR (estados, responsive, CMP, TKN, naming) y con el artefacto Stitch si existe; listar diferencias.
3. Si Stitch y Figma divergen: pedir una decisión humana (`DD-*`; puede producirla `claude-design-orchestrator`). Sin decisión: `divergence: open`.
4. Registrar: `python ../ux-development-handoff/validators/cli.py register-governed --kb knowledge-base --dtm <DTM> --screen <SCR> --file-ref … --node-ref … --version … --divergence none|resolved|open [--approved-by human:<id> --decision-ref DD-…] --states … --breakpoints …`.
5. Emitir el reporte, actualizar `index.md` y `changelog.md`, y detenerse para revisión humana.

## Quality gates
- Cada SCR del alcance tiene `governed_design` identificable o un `BLOCKED` explícito.
- Sin `STITCH_FIGMA_DIVERGENCE` sin resolver ni referencias obsoletas.
- Tokens vinculados a Variables Figma, no a valores crudos.

## Failure / blocking behavior
`BLOCKED`: sin acceso a Figma, divergencia sin decisión, nodo sin SCR, aprobación humana ausente. No aprobar por el agente: `register-governed` rechaza `approved_by` no humano.

## Downstream consumers
`ux-development-handoff` (DTM, gate `DESIGN_READY_FOR_DEV`), `accessibility-reviewer` (nodo Figma), Development Context Pack.

## Must NOT
- DO NOT INVENT MISSING INFORMATION.
- DO NOT TREAT EXPLORATION DESIGN AS GOVERNED DESIGN.
- DO NOT CREATE ORPHAN DESIGN ARTIFACTS. DO NOT BYPASS FLW/SCR TRACEABILITY.
- PRESERVE IDS AND PROVENANCE. HUMAN DECISIONS MUST REMAIN EXPLICIT.
- No resolver divergencias por su cuenta; no fabricar aprobaciones ni evidencia.

## Definition of Done
Reporte de validación y entradas DTM `governed_design`/`stitch_figma` por SCR, con referencias Figma reales, divergencias resueltas por decisión humana o declaradas `open`, y revisión humana pendiente.
