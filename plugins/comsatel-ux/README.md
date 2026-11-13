# comsatel-ux

Documentación de UX/UI de CL2 Flotas para Claude Code. `ux-ui-orchestrator` coordina a los demás skills y delega en `ux-context-builder` la consolidación de la especificación de diseño (UXS), con un veredicto de preparación por etapa y por consumidor.

| Skill | Produce |
|---|---|
| `ux-ui-orchestrator` | Orquestador. Diagnóstico, plan por fases, auditoría y el control de cierre de paquete |
| `ux-requirements-analyzer` | Requisitos UX (UXR) y preguntas abiertas |
| `user-flow-designer` | Flujos (FLW) |
| `ui-spec-writer` | Pantallas (SCR), componentes y tokens |
| `web-atomic-component-designer` | Catálogo atómico Angular (opcional) |
| `ux-context-builder` | La UXS (UX Context Pack) de un paquete DSP-NNN: veredicto por consumidor, hallazgos y preguntas abiertas |
| `stitch-ui-generator` | Exploración en Google Stitch |
| `claude-design-orchestrator` | Exploración y alternativas en Claude Design |
| `accessibility-reviewer` | Informe WCAG 2.2 AA (ARP) |
| `figma-design-validator` | Diseño gobernado |
| `ux-development-handoff` | Paquete de entrega y puerta `DESIGN_READY_FOR_DEV` |

Son 1 orquestador y 10 especialistas. Supera los 6 del estándar a propósito: preparar toda la documentación de UX exige estas especialidades (ver `pack.yaml`).

## Controles que trae

| Control | Qué hace | Dónde está |
|---|---|---|
| **Auditoría de cierre** | `audit_ux.py --exigir-uxs` marca como error un paquete con pantallas especificadas y sin UXS (`PAQUETE_SIN_UXS`) y avisa de artefactos que la UXS no indexa (`UXS_NO_INDEXA`) | `ux-ui-orchestrator/scripts/audit_ux.py` |
| **Guardia de la UXS (hook)** | Frena el `git push` de una rama `ux/*` que toca un paquete sin UXS. Solo actúa en repositorios de diseño (con `design/specs` y `design/ux-requirements`) | `hooks/hooks.json` y `ux-ui-orchestrator/hooks/guardia-uxs.mjs` |
| **Compuerta GU** | La consolidación es una compuerta del pack, también en la vía directa a front end | `pack.yaml` |

El guardia necesita Node y Python 3. Se prueba con `node skills/ux-ui-orchestrator/hooks/probar-guardia-uxs.mjs`. Su modo lo fija la persona (no el agente) con la variable de entorno `COMSATEL_UX_GUARDIA`: `bloquea` (por defecto), `aviso` (pide confirmar) u `off`.

## Instalar

```
/plugin marketplace add <ruta o URL de este repositorio>
/plugin install comsatel-ux@comsatel-skills
```

Abre una sesión nueva para que cargue. Los skills se invocan como `comsatel-ux:<skill>`.

## Qué necesita en cada equipo

- **Python 3** en el PATH: `ux-development-handoff` trae validadores (`validators/cli.py`) y el orquestador usa `scripts/audit_ux.py`. En Windows suele ser `py -3`; si `python` no funciona, el agente debe usar ese.
- **Un repositorio `knowledge-base`** con la carpeta `knowledge-base/design/`: ahí se escriben los UXR, flujos y pantallas.
- **Entrada:** historias y reglas de `af-requirements-orchestrator` (otro grupo de skills, que no viaja en este plugin). Sin historias el orquestador no arranca.

## Qué no incluye

- El módulo personal de Notion de `ux-ui-orchestrator`: la copia se genera sin él.
- La etapa siguiente: `comsatel-desarrollo` (`orquestador-desarrollo` deriva aquí cuando falta documentación de UX).

## Si ya tenías estos skills en `.claude/skills`

El repositorio `knowledge-base` ya los trae en `.claude/skills`. No instales el plugin y esa carpeta a la vez en el mismo proyecto: podrían aparecer dos veces (`ux-ui-orchestrator` y `comsatel-ux:ux-ui-orchestrator`).

## Mantenimiento

La fuente de los skills es `skills/<nombre>/` en la raíz del repositorio. La carpeta `skills/` de este plugin es una copia generada: no se edita a mano. Tres ajustes se aplican al generarla (las rutas `.claude/skills/...` pasan a `${CLAUDE_SKILL_DIR}` y se corrige una verificación del worktree) y están listados en `scripts/construir-plugin.mjs`.

```
npm run construir-plugin -- ux   # regenera la copia
npm test                         # falla si la copia difiere de lo que genera la fuente
```
