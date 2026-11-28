---
name: em-orquestador-ux
description: Orquesta el diseño UX/UI de Comsatel con siete especialistas (ux-requirements-analyzer, user-flow-designer, ui-spec-writer, claude-design-orchestrator, ux-context-builder, accessibility-reviewer y ux-development-handoff) para llevar historias validadas hasta la Especificación UX (UXS) del paquete y un handoff DESIGN_READY_FOR_DEV, con trazabilidad US→UXR→FLW→SCR→UXS→DTM y compuertas humanas. Es el dueño del ciclo obligatorio de retroalimentación. Úsalo cuando pidan gestionar, completar, auditar o retomar el diseño UX/UI de un paquete, preparar pantallas para Desarrollo, cerrar un paquete de diseño (la UXS), evaluar si una pantalla está lista o decidir qué skill UX/UI va y en qué orden, aunque no nombren ninguno. No redacta artefactos propios, no aprueba diseños y no escribe código.
metadata:
  version: "2.0.1"
  reemplaza: "ux-ui-orchestrator 1.2.0 (nació del catálogo de Ilver; el original sigue en skillcatalog)"
---

# Orquestador UX

Coordina a los especialistas de UX/UI para que sus artefactos queden completos, consistentes y
trazables entre sí, y los consolida en la **Especificación UX (UXS)** del paquete. Cierra las
costuras: un SCR que su FLW no lista, un UXR cuya pregunta nadie dirigió, un paquete sin UXS.
No redacta contenido propio: delega y verifica. Arranca donde termina
`af-requirements-orchestrator` (historias READY o CONDITIONAL).

## Especialistas que coordina

| Especialista | Produce (en `knowledge-base/design/`) |
|---|---|
| `ux-requirements-analyzer` | Requerimientos UX (UXR) y preguntas abiertas |
| `user-flow-designer` | Flujos (FLW) que declaran sus `screens` |
| `ui-spec-writer` | Pantallas (SCR), componentes (CMP), tokens y criterios de aceptación (AC) |
| `claude-design-orchestrator` | Exploración en baja fidelidad (IB) y decisión de diseño (DD); no se salta |
| `ux-context-builder` | La UXS del paquete, con veredicto por consumidor |
| `accessibility-reviewer` | Informe de accesibilidad (ARP) sobre lo implementado |
| `ux-development-handoff` | Handoff (HOF) y compuerta `DESIGN_READY_FOR_DEV`, con todo validado |

Son siete, uno más que el máximo de seis del catálogo: el handoff cierra el paquete cuando
todos los recursos están validados y no se fusiona con otro (Enzo, 2026-11-28; excepción en
`pack.yaml`). Fuera del flujo, sin retirarse: `web-atomic-component-designer` (es del Design
System), `stitch-ui-generator` y `figma-design-validator` (Figma está en pausa). Servicios que
llama sin ser especialistas: `em-gestion-tareas` y `paridad-diseno-desarrollo`.

## Verificación de arranque

1. Ciclo de retroalimentación, sección A, antes de todo (B1): informe de solo lectura de otro agente.
2. Paso 0: el paquete tiene sus tareas (`em-gestion-tareas`, modo ESTADO) y `cambios-kb.mjs` muestra qué cambió en la KB.
3. La KB se lee con `git show origin/develop:<ruta>`; si va a escribir, trabaja en un worktree `ux/<slug>`.
4. Si falta un acceso o un agente, declara el bloqueo de esa pieza y sigue con lo demás.

## Escenarios

| Escenario | Señal | Leer |
|---|---|---|
| A. Iniciativa nueva | Historias listas, sin UXR, FLW ni SCR | `references/scenarios.md` y `references/fases.md` |
| B. Cambio sobre lo existente | Cambia una historia, regla o decisión | `references/scenarios.md` y `references/estados-y-compuertas.md` |
| C. Especificar pantallas | Hay UXR y FLW; faltan SCR | `references/fases.md` (paso 3) |
| D. Exploración | SCR listos; falta explorar | `references/fases.md` (fase 4) |
| E. Diseño gobernado | Hay exploración; falta gobernarla | `references/estados-y-compuertas.md` |
| F. Auditoría y compuerta | ¿Está listo para Desarrollo o se puede cerrar? | `references/controles-de-cierre.md` y `references/role-readiness.md` |
| G. Decisión humana recibida | Un humano respondió o aprobó | `references/estados-y-compuertas.md` (sección 6) |
| H. Directo a front end | Se construye sin explorar | `references/fases.md`; cierra igual con UXS |

Si es ambiguo, pregunta una sola cosa concreta: el flujo o la historia de partida.

## Guías por paso

| Cuándo | Leer |
|---|---|
| Al iniciar y al cerrar todo trabajo | `references/ciclo-retroalimentacion.md` y `references/mejoras-del-proceso.md` |
| Al planificar y en cada fase | `references/fases.md` |
| Al pasar una compuerta, validar o cerrar | `references/estados-y-compuertas.md` y `references/controles-de-cierre.md` |
| Al evaluar la calidad de una pantalla | `references/quality-criteria.md` |
| Al leer decisiones del PO o validar con datos simulados | `references/mapa-de-decisiones-y-validacion.md` |
| Al registrar tareas o cargar en Notion | `references/tareas-y-notion.md` y `references/proyecto-y-producto.md` |
| Si va a escribir archivos | `references/worktree-protocol.md` |
| Antes de escribir en la KB o en Notion | `references/reglas.md` |

Plantilla de la UXS en `templates/`, ejemplo del DSP-009 en `examples/`.

## Validación obligatoria

```bash
python "${CLAUDE_SKILL_DIR}/scripts/audit_ux.py" knowledge-base --compuerta <G>
python "${CLAUDE_SKILL_DIR}/../ux-development-handoff/validators/cli.py" preflight --profile production --kb knowledge-base --initiative <ini> --screens <SCR…>
node scripts/decisiones-retiradas.mjs --paquete DSP-NNN   # desde la raíz de la KB
```

Un resultado con errores bloquea el avance. Antes de cerrar, `audit_ux.py --exigir-uxs`.

## Reglas de bloqueo

Detalle, excusas y lecciones en `references/reglas.md`.

- **B1 — Ciclo de retroalimentación obligatorio.** Inicio y cierre según el [protocolo](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/em-orquestador-ux/references/ciclo-retroalimentacion.md), del que este skill es dueño.
- **B2** — Sin sincronización comprobada no hay cierre: lo pendiente se reporta como BLOQUEADO.
- **B3** — Las tareas siguen al hecho, con `em-gestion-tareas` y evidencia.
- **B4 — Paridad KB-código obligatoria.** Antes de cerrar o abrir el MR, según su [protocolo](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/paridad-diseno-desarrollo/references/paridad-kb-codigo.md).
- **B5** — Sin UXS no se cierra un paquete ni se sube su rama de diseño (compuerta GU).
- **B6** — KB primero; Notion refleja la KB, con conciliación aprobada.
- **B7** — No inventar: un vacío es una pregunta abierta con su responsable.
- **B8** — Nunca registrar una aprobación o un Validado sin la prueba de Enzo y su evidencia.
- **B9** — La IA cierra solo preguntas UX estándar, con benchmarking, DEC y fuentes; nunca negocio, permisos, datos ni alcance.
- **B10** — La historia es del analista: se le propone un comentario, no se edita.
- **B11** — Actualizar, no reemplazar: los IDs son permanentes.
- **B12** — Contradicción entre fuentes: se preserva y se escala, no se elige.

## Cierre

Informe de inicio y matriz de sincronización del ciclo; escenario y ruta; artefactos tocados;
resultado de auditoría, preflight y compuerta; veredictos por consumidor; decisiones humanas
pendientes; tabla de MR con enlace y orden de merge; siguiente skill.
