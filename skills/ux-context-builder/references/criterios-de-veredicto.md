# Criterios de veredicto de la UXS

La UXS emite un veredicto por consumidor para que se sepa si ya se puede ejecutar la etapa siguiente. El script `build_uxs.py` aplica estas reglas
con la evidencia del KB; quien revisa lo generado las comprueba y completa lo que el script no puede saber. El veredicto aplica a las pantallas del
**paquete**, no a todo el repositorio.

## Contenido
- Regla general
- Claude Design
- Stitch
- Figma
- Desarrollo
- QA
- Hallazgos (Q-UXS-n)
- Cómo redactar un CONDITIONAL

## Regla general

- **READY:** se cumplen los mínimos del consumidor y nada afecta su alcance.
- **CONDITIONAL:** los mínimos están, pero hay preguntas abiertas o decisiones en borrador que cambian parte del trabajo.
- **NOT READY:** falta un mínimo o hay un bloqueante en su alcance.

## Claude Design (exploración visual), skill `claude-design-orchestrator`

Mínimos: cada SCR con `flow`, `requirements`, `required_states` y `a11y_requirements`; el Design System identificado.
- **NOT READY** si algún SCR no los tiene.
- **CONDITIONAL** si hay preguntas abiertas (pueden cambiar textos o condiciones). Dice cuántas y de qué responsables.
- **READY** si no hay preguntas abiertas.
El Intent Brief lo redacta el propio skill: su ausencia no es un bloqueo.

## Stitch, skill `stitch-ui-generator`

Por defecto **NOT READY, «no se usa»** (el equipo explora en Claude Design). Con `--stitch usado`: READY solo si el preflight del validador está READY.
Un `MISSING_STITCH_PROJECT` en el preflight no bloquea nada cuando Stitch no se usa: se deja como hallazgo informativo.

## Figma, skill `figma-design-validator`

**READY** solo si todas las pantallas del paquete tienen `governed_design` en un DTM. Si no, **NOT READY**. El repositorio descartó Figma como diseño
gobernado el 2026-10-04 (decisión de `human:ianache`).

## Desarrollo

Hay dos formas de gobernar el diseño, y las dos se validan al terminar de construir:
1. **En Claude Design**: exploración registrada y elección entre alternativas por una persona (DD).
2. **Con el prototipo en código**: se construye directo desde los SCR, el Design System y las decisiones, y se valida al terminar.

El gate formal `DESIGN_READY_FOR_DEV` de `ux-development-handoff` hoy solo reconoce Figma o Stitch como `governed_design`: por eso el veredicto es
**NOT READY para el gate** y **CONDITIONAL para construir directo en front end** (si los SCR están completos y ninguna pregunta bloquea una pantalla).
**NOT READY** a secas si hay pantallas incompletas. Admitir el prototipo como diseño gobernado en el validador es una decisión humana pendiente.

## QA, skill `test-case-generator`

**CONDITIONAL** si hay preguntas abiertas (los textos son provisionales); **READY** si no las hay. Los casos de accesibilidad se derivan del contrato de
accesibilidad de cada componente del Design System; lo propio de cada pantalla (orden de foco, mensajes, nombres accesibles) se verifica al validar lo construido.

## Hallazgos (Q-UXS-n)

El script emite los que la evidencia sostiene y deja la decisión de qué hacer a la persona:

| Hallazgo | Cuándo aparece | Severidad |
|---|---|---|
| Sin Intent Brief ni exploración en Claude Design | Ningún IB menciona los flujos del paquete | Mayor |
| `HU-NN-NN` que no resuelven | El preflight devuelve `DANGLING_REFERENCE` (las historias declaran `id: CL2-US-NNN` y `legacy_id: HU-NN-NN`) | Mayor |
| Accesibilidad apoyada en el Design System | Siempre (no hay ARP por pantalla) | Menor |
| Diseño no gobernado (ni Claude Design ni prototipo validado) | Falta `governed_design` en el DTM | Mayor |
| Preflight BLOCKED por proyecto Stitch | `MISSING_STITCH_PROJECT` | Menor, informativo |
| Decisiones en borrador | Algún DEC del paquete no está `accepted` | Menor |
| Preguntas abiertas | Siempre que existan; Mayor si alguna bloquea el backend | Menor o Mayor |

## Cómo redactar un CONDITIONAL

No basta con la etiqueta. Cada CONDITIONAL lleva: qué mínimo no se cumple del todo, qué preguntas (con ID) lo causan, quién debe responder y qué
parte del trabajo del consumidor queda pospuesta si se avanza igual.
