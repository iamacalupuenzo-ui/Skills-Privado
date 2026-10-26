# Governed vs exploration design

```
SCR-021
 ├─ exploration_design  (Stitch)  project_ref → STP, artifact_ref, version      ← lineage
 └─ governed_design     (Figma)   file_ref, node_ref, version, approved_by     ← what Dev builds
```

| Situation | `governed_design.status` | `exploration_design.status` | Divergence |
|---|---|---|---|
| Only Stitch exists | absent / `candidate` | `current` | n/a → gate `MISSING_GOVERNED_DESIGN` |
| Figma exists, no human approval | `candidate` | `current` | any |
| Figma approved, matches Stitch intent | `approved` | `superseded` | `none` |
| Figma approved, differs from Stitch, decision recorded | `approved` | `superseded` | `resolved` + `decision_ref` (DD-*) |
| Figma differs from Stitch, no decision | `candidate` | `current` | `open` → gate `STITCH_FIGMA_DIVERGENCE` (BLOCKED) |
| Figma changed after approval | `stale` | — | → `STALE_FIGMA_REFERENCE` (FAILED) until re-validated |

Compare: states, layout structure, components, tokens, copy. A divergence is a *design* difference, not a rendering one. Record each in the Design Validation Report with its SCR.
