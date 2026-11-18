---
name: ux-context-builder
description: >
  Arma la UXS (UX Design Specification, el «UX Context Pack») de un paquete DSP-NNN desde los artefactos reales del KB:
  indexa sus UXR, flujos, pantallas y decisiones, calcula con evidencia el veredicto por consumidor (Claude Design, Stitch,
  Figma, Desarrollo, QA), lista las preguntas abiertas con su responsable y deja la validación humana pendiente. Úsalo cuando
  pidan «arma la UXS», «consolida el paquete», «el UX context pack», «cierra el paquete de diseño», cuando `audit_ux.py` avise
  PAQUETE_SIN_UXS o UXS_NO_INDEXA, o cuando el hook de la UXS frene el push de una rama `ux/*`. No redacta UXR, flujos ni
  pantallas (usa ux-requirements-analyzer, user-flow-designer y ui-spec-writer), no explora diseño (usa claude-design-orchestrator)
  ni aprueba nada: la UXS nace en draft.
metadata:
  version: "1.2.0"
---

# ux-context-builder

Es el especialista de `ux-ui-orchestrator` que **cierra un paquete de diseño**. Los demás skills producen artefactos sueltos
(UXR, flujos, pantallas); este los consolida en una UXS que es lo que leen Claude Design, QA y Desarrollo. Hace lo mismo que
`af-requirement-context-builder` en requisitos y `architecture-context-builder` en arquitectura, pero para UX.

**Lo que haces:** reunir lo que el paquete ya tiene, medirlo con las herramientas (validador y auditoría), redactar la UXS con lo que
la evidencia permite afirmar y dejar a la vista lo que falta.
**Lo que NO haces:** inventar lo que no está en los artefactos, producir los artefactos que faltan, aprobar, ni subir la rama.

## Cuándo se necesita (gatilladores)

| Señal | Qué hacer |
|---|---|
| Un paquete DSP-NNN ya tiene pantallas especificadas y ninguna UXS lo indexa | Armar la UXS (este skill) |
| `audit_ux.py` avisa `PAQUETE_SIN_UXS` o `UXS_NO_INDEXA` | Armarla o regenerarla (`--actualizar`) |
| El hook de la UXS frenó el push de una rama `ux/*` | Armarla, commitearla en esa rama y volver a subir |
| Cambiaron artefactos del paquete (nuevas pantallas, preguntas cerradas, decisiones) | Regenerarla con `--actualizar` |
| El paquete se construyó directo en front end sin pasar por Claude Design | Armarla igual: es el cierre de la vía directa |
| Se pide el «UX Context Pack» para `claude-design-orchestrator` | Es esta UXS |

## GUARD — verificar contexto

1. Estás en un worktree de la knowledge-base (`design/` y `requirements/`). Si trabajas escribiendo archivos, la rama es `ux/<slug>`.
2. El paquete existe: tiene scope pack en `requirements/scope-packs/` y artefactos con la etiqueta `dsp-NNN` en su frontmatter.
3. Usar la fuente fresca comprobada por el ciclo canónico (B8); no asumir el estado de una conversación anterior.

## Cómo se arma

```
python "${CLAUDE_SKILL_DIR}/scripts/build_uxs.py" <knowledge-base> --paquete DSP-005 \
  --construido "SCR-075 a SCR-079 construidos en microui-bo-tenants (rama X, MR !N)" \
  --responsable "<rol que valida>" [--corte "..."] [--modulo "..."] [--a-posteriori] [--dry-run]
```

1. **Primero en seco** (`--dry-run`): muestra paquete, número, conteos, preflight y veredictos sin escribir nada.
2. **Pasa por parámetro lo que el script no puede saber:** qué está construido y dónde (`--construido`), quién valida (`--responsable`),
   el corte de la entrega. Si no lo sabes, no lo inventes: queda «sin información» y se pregunta a quien sabe.
3. **Escribe** `design/specs/UXS-NNN-<slug>.md`, agrega su fila a `index.md` y su entrada a `changelog.md` (`--sin-indice` lo omite).
4. **Verifica**: `python "${CLAUDE_SKILL_DIR}/../ux-ui-orchestrator/scripts/audit_ux.py" <kb> --exigir-uxs --paquetes DSP-005` debe dejar de marcar el paquete.
5. **Revisa lo redactado** contra `references/criterios-de-veredicto.md`: cada veredicto necesita su razón; las preguntas abiertas, su responsable.
6. **Detente para la revisión humana.** No subas la rama ni abras el MR sin confirmación (ver B6).

Si el paquete ya tiene UXS, el script se bloquea; `--actualizar` la regenera conservando su número y su archivo.

## Qué contiene la UXS que arma

Las ocho secciones de la plantilla de `ux-ui-orchestrator`: alcance y escenario, artefactos del conjunto, resultado de la auditoría con hallazgos
(Q-UXS-n), matriz de trazabilidad por pantalla, preguntas abiertas y decisiones humanas, preparación por consumidor, registro de orquestación y
validación humana. Es el formato que lee el cargador de Notion del orquestador (base «Especificaciones UX»).

## Referencias disponibles

- `references/criterios-de-veredicto.md` — cómo se decide READY / CONDITIONAL / NOT READY por consumidor y qué hace cada hallazgo. **Leer antes de revisar lo generado.**

## Comportamientos bloqueantes

- **B8 — Ciclo de retroalimentación obligatorio.** Al inicio y al cierre de cada desarrollo, mejora, análisis o definición, invocar a `ux-ui-orchestrator` y leer su [protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/ux-ui-orchestrator/references/ciclo-retroalimentacion.md) (resolver primero la versión local de ese skill o la fuente central). Sin informe de un agente de verificación previa distinto de quien construye, no empezar; sin sincronización comprobada, no declarar terminado. El orquestador conserva los formatos y dueños de artefactos; si falta el protocolo, detenerse y reportarlo.
- **B1 — Sin pantallas no hay UXS.** Un paquete sin SCR con su etiqueta `dsp-NNN` no se consolida: el script se detiene y dice qué producir antes. No se rellena con UXR sueltos.
- **B2 — No se inventa lo que no está en los artefactos.** Lo construido, quién decide y el corte de la entrega los dice una persona; sin ese dato queda «sin información». Los veredictos salen de la evidencia, no de la impresión.
- **B3 — Una UXS existente no se pisa.** Regenerar exige `--actualizar` y conserva número y archivo; nunca se crea una segunda UXS para el mismo paquete.
- **B4 — La UXS nace en `draft` y con la validación humana pendiente.** Nunca `verified` ni `approved`: aprobar es de una persona con nombre y rol.
- **B5 — Los artefactos sin etiqueta de paquete no se adivinan.** Si faltan las etiquetas `dsp-NNN`, se avisa y se pide etiquetarlos; el script no asigna un paquete por semejanza de historias (las historias se comparten entre paquetes).
- **B6 — Armar la UXS no autoriza subirla.** Commitear en la rama de diseño es del skill; subir la rama, abrir el MR y cargar Notion son acciones separadas que piden confirmación.
- **B7 — No se esconde un hallazgo para que el veredicto quede mejor.** Si el preflight está BLOCKED, si hay preguntas bloqueantes o decisiones en borrador, la UXS lo dice.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Es solo un artefacto o una revisión; sincronizo después» | Invocar al orquestador conserva su autoridad y exige las dos compuertas también en encargos directos (B8). |
| «Ya lo construimos y funciona, la UXS sobra» | La UXS es lo que lee Claude Design, QA y quien continúe el paquete; la vía directa también se cierra con ella (B1 y gatillador). |
| «Los UXR y flujos ya dicen todo» | Sin matriz por pantalla ni veredicto por consumidor nadie sabe qué falta ni quién responde. |
| «Pongo CONDITIONAL y listo» | Un CONDITIONAL sin la pregunta, el responsable y lo pospuesto no sirve (B7). |
| «Armo la UXS a mano, es más rápido» | Un archivo a mano no pasa la auditoría ni el cargador de Notion; usa el script y edita después. |
| «Lo construido lo sé yo, no hace falta preguntar» | Pregúntalo: la UXS afirma estados de construcción que otros leerán (B2). |

## Formato de respuesta

- Declarar el paquete y el modo (en seco o escritura) en la primera línea.
- Cerrar con: archivo creado, conteos, veredictos por consumidor, hallazgos abiertos (Q-UXS), resultado de la auditoría, y lo que queda por decidir y quién lo decide.
- Español, conciso. Lo no verificado se dice como tal.
