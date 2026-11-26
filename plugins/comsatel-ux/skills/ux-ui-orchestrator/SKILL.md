---
name: ux-ui-orchestrator
description: Orquesta los skills UX/UI (ux-requirements-analyzer, user-flow-designer, ui-spec-writer, stitch-ui-generator, claude-design-orchestrator, figma-design-validator, accessibility-reviewer, ux-context-builder, ux-development-handoff) para llevar User Stories validadas hasta un paquete de diseño consolidado (UXS), un diseño gobernado y un handoff DESIGN_READY_FOR_DEV, con trazabilidad US→UXR→FLW→SCR→UXS→DTM y compuertas humanas. Úsalo siempre que el usuario pida gestionar, completar, auditar o retomar el diseño UX/UI de punta a punta, preparar pantallas para Claude Design/Desarrollo, cerrar un paquete de diseño (la UXS), evaluar si un SCR está listo, resolver una divergencia Stitch↔Figma, o decida qué skill UX/UI ejecutar y en qué orden, aunque no nombre ningún skill.
metadata:
  version: "1.0.0"
---

# ux-ui-orchestrator

## Propósito

Coordinar los skills de la pista UX/UI para que sus artefactos queden **completos, consistentes y trazables entre sí**, y consolidarlos en una **Especificación de Diseño UX/UI (UXS)** con un veredicto de preparación por etapa y por consumidor. Cada skill produce un artefacto correcto por sí mismo; lo que falla en la práctica son las costuras: un SCR cuyo FLW no lo lista, una pantalla generada en Stitch sin DTM, un Figma aprobado con divergencia abierta, un UXR cuya pregunta abierta nadie dirigió al skill que puede cerrarla. Este orquestador cierra esas costuras.

Es el equivalente de `af-requirements-orchestrator` para la etapa siguiente: aquel termina con una RQS lista; este arranca de ella. No redacta contenido propio: delega en cada skill y verifica. No decide por humanos, no aprueba diseños y no escribe código; puede cerrar por delegación de Enzo solo preguntas UX de práctica estándar con benchmarking, DEC, fecha y fuentes; declara si el diseño está listo para Desarrollo y con qué skill continuar.

## Skills que orquesta

| Skill | Produce | Carpeta (`knowledge-base/design/`) |
|---|---|---|
| `ux-requirements-analyzer` | UX Requirements `UXR-*` + preguntas abiertas | `ux-requirements/` |
| `user-flow-designer` | User Flow `FLW-*` (declara `screens`) | `user-flows/` |
| `ui-spec-writer` | Screen `SCR-*`, Component `CMP-*`, Token `TKN-*`, AC | `screens/`, `components/`, `tokens/`, `acceptance-criteria/` |
| `web-atomic-component-designer` | Catálogo atómico Angular (opcional, cuando hay librería de componentes) | `components/` |
| `ux-context-builder` | UXS `UXS-*` (el UX Context Pack del paquete): indexa, mide y emite el veredicto por consumidor | `specs/` |
| `stitch-ui-generator` | `GEN-*`, `STP-*`, entrada `exploration_design` en el DTM | `generations/`, `projects/`, `traceability/` |
| `claude-design-orchestrator` | Intent Brief `IB-*`, alternativas, Design Decision `DD-*` | `explorations/` |
| `figma-design-validator` | Design Validation Report + `governed_design` en el DTM | `traceability/` |
| `accessibility-reviewer` | Accessibility Report `ARP-*` | `handoff/` o junto al SCR |
| `ux-development-handoff` | Handoff `HOF-*` y gate `DESIGN_READY_FOR_DEV` | `handoff/` |

Cada skill gobierna su formato y sus IDs; invócalo con la herramienta Skill y no reescribas su salida aquí.

**Un paquete de diseño no se cierra sin su UXS.** Es lo que leen Claude Design (como UX Context Pack), QA y Desarrollo, y también el paquete que se entrega cuando se construye directo en front end. La compuerta **GU** y sus controles duros están en «Control de cierre de paquete», más abajo.

**Entrada del flujo completo (el ciclo transversal no exige una RQS para coordinar su diagnóstico):** User Stories y reglas ya producidas por `af-requirements-orchestrator` (RQS con veredicto UX/UI READY o CONDITIONAL). Sin historias, el flujo completo no arranca: señala `af-requirements-orchestrator`.

## Cuándo no usarlo

- Para un único artefacto, invoca al especialista para producirlo; este orquestador mantiene únicamente las compuertas del ciclo obligatorio, sin desplegar todo el flujo.
- Gestionar requerimientos, historias o glosario: es `af-requirements-orchestrator`.
- Implementar el diseño en código: es `development-handoff-builder` y Superpowers, después del gate.

## Ciclo obligatorio de retroalimentación

Leer y ejecutar `references/ciclo-retroalimentacion.md` al inicio y al cierre de cada desarrollo, mejora, análisis o definición, también en la vía directa a front end y cuando se invoque un especialista aislado. Este orquestador es el único dueño: coordina la verificación previa independiente y la actualización por los especialistas de cada artefacto. Esta obligación no depende de la activación del módulo Notion ni de que el usuario diga «sesión finalizada».

## Comportamientos bloqueantes

- **B1 — Inicio sin verificación previa, bloqueado.** No iniciar sin el informe de solo lectura de un agente distinto de quien construye y la comprobación de fuentes que exige `references/ciclo-retroalimentacion.md`; si faltan acceso o agente, declarar el bloqueo.
- **B2 — Cierre sin sincronización, bloqueado.** No declarar terminado un desarrollo, mejora, análisis o definición sin ejecutar y comprobar el cierre de `references/ciclo-retroalimentacion.md`. Un destino pendiente se reporta como cierre BLOQUEADO, nunca como completado.
- **B3 — Estado de tareas atrasado respecto del hecho.** Al fusionarse un MR, entregarse un paquete (handoff y pase vivo) o descartarse un trabajo, actualizar la tarea de Notion en ese momento según la sección C de `references/ciclo-retroalimentacion.md`, con evidencia y sin dejar `Completada` con `Resultado = Pendiente`. Un paquete no se da por entregado sin sus dos recursos.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| «La KB local o mi memoria bastan para empezar» | La revisión independiente contrasta referencias remotas frescas, código y Notion antes de avanzar (B1). |
| «El build pasó; actualizaré los artefactos cuando termine la sesión» | Cada trabajo termina con sincronización comprobada; build o merge no sustituyen ese cierre (B2). |

## Flujo

0. **Validar tareas y cambios de la KB** antes de todo (paso 0). Se repite al iniciar cada sesión y antes de cerrar una tarea.
1. **Diagnosticar** el estado y el escenario (paso 1).
2. **Planificar** la ruta mínima atada a sus tareas y mostrarla antes de ejecutar (paso 2).
3. **Aislar** en un git worktree si va a escribir archivos (paso 2b).
4. **Ejecutar** por fases, con compuerta entre ellas (paso 3).
5. **Cerrar costuras**: enrutar preguntas y brechas entre skills (paso 4).
6. **Auditar** (paso 5).
7. **Consolidar** la UXS y emitir veredictos (paso 6).
8. **Integrar**: proponer incorporación y esperar la decisión (paso 7).

### 0. Validar tareas y cambios de la KB (Enzo, 2026-11-26)

Antes de diagnosticar o diseñar, dos comprobaciones, en este orden:

1. **¿El paquete tiene sus tareas?** `em-gestion-tareas` en modo ESTADO. Si no las tiene, modo RECIBIR (mapeo, validación con `armar-mapeo.mjs` y creación en Notion) y recién después se planifica. Lo hace el orquestador que empieza primero (UX o Desarrollo); el otro solo consulta ESTADO, para no duplicar tareas.
2. **¿Qué cambió en la KB desde la última revisión?**

   ```
   node .claude/skills/ux-ui-orchestrator/scripts/cambios-kb.mjs DSP-NNN --kb knowledge-base --informe cambios.md
   ```

   La primera vez se indica `--desde <AAAA-MM-DD>` (la fecha en que se recibió el paquete); después usa la revisión registrada. El informe trae: el inventario del paquete y sus historias (HU) con la fecha y el autor de su última actualización; lo que cambió (historias, avisos AVS, consultas QST/RSP, decisiones y artefactos de diseño) con la sección tocada, por ejemplo «AC-4»; las preguntas abiertas con su responsable; y el efecto en cadena sobre los Requerimientos UX (UXR), Flujos de usuario (FLW), Pantallas (SCR) y tareas.


   Lo demás del informe es propuesta. Muestra el informe y propón: AVANCE con nota o con bloqueo en cada tarea afectada (con `em-gestion-tareas`), «Revisar por cambio de fuente» en los artefactos de diseño (con la conciliación) y el comentario al analista si una decisión toca una HU. Con la aprobación de Enzo se aplica y se registra la revisión con `--registrar`. El commit revisado queda en `design/MEMORY.md` («Revisión de la KB: cambios-kb.mjs en <commit>»).

### Proyecto y producto: dos relaciones distintas (Enzo, 2026-11-26)

La jerarquía en Notion es **Proyecto → Producto → Paquete (DSP) → Historia (HU)**. Ejemplo: el proyecto «CL2 Flotas» tiene los productos «CL2 Flotas», «Piloto de CL2 Flotas», «CL2 SVR Captura y Recupero» y los dos Design System.

- **Paquetes e historias** llevan solo **Producto**; el proyecto les llega por el producto. Una historia lleva el producto de su paquete.
- **Tareas** llevan las dos relaciones, **Proyecto y Producto**, las del paquete que las origina.
- Si una página no aparece en una vista, lo primero que se revisa es su Producto (caso real: HU-01-14 seguía en el Piloto y no se veía junto a HU-01-16).
- **Si hay duda, no se adivina: se pregunta con opciones** (herramienta de preguntas, con las alternativas de la base Productos y su proyecto). Hay duda cuando el paquete no tiene producto o tiene más de uno, cuando el producto no tiene un único proyecto, o cuando la historia ya está en otro producto. `cargar-paquete.js` las devuelve en `dudas` (sale con código 3) y no cambia esa relación; con la respuesta se repite con `--producto <id>` o `--confirmar-producto`.
- **Documentos de diseño (UXR, FLW, SCR):** los carga `lote-doc.js`, que toma el producto de sus paquetes y levanta la misma duda. Un UXR que nombra su paquete en `sources` solo se relaciona con ese paquete y sus historias; las demás historias que cita son fuentes que reutiliza (UXR-139 cita HU-01-09 y no es del DSP-001).
- **Un UXR reutilizado por un paquete nuevo se mueve a ese paquete y a su producto,** conservando la relación con el paquete anterior como antecedente (Enzo, 2026-11-26: UXR-010 a 014 pasaron de DSP-001 al DSP-009). En la KB se agrega el paquete nuevo a `sources`; la carga va con `--confirmar-producto=nuevo`.
- **Las historias se resuelven por ID y Catálogo** («RCP-001 CL2 Flotas»): el mismo ID existe en el catálogo SVR, y sin el filtro la relación queda duplicada. La carga suma relaciones y no quita las que ya existen.

**Cuándo se repite:** al iniciar cada sesión de UX, antes de cerrar una tarea (para no cerrar sobre una historia que cambió) y en la rutina diaria. La compuerta G0 de `audit_ux.py` falla si `design/MEMORY.md` no cita las tareas ni registra la revisión de la KB.

### 1. Diagnosticar

Primero completar la compuerta B1; el informe independiente es la entrada de este diagnóstico. Para leer fuentes de la KB, usar `git show origin/develop:<ruta>` según el protocolo, nunca un worktree sucio.

Haz un inventario antes de decidir, porque la ruta depende de lo que ya existe:

```
python "${CLAUDE_SKILL_DIR}/scripts/audit_ux.py" knowledge-base
```

Lee además `knowledge-base/index.md`, `changelog.md`, `design/MEMORY.md` si existe, la RQS y las historias del alcance. Si el proyecto tiene `graphify-out/GRAPH_REPORT.md`, léelo primero (instrucción del repositorio). Clasifica el escenario con `references/scenarios.md`:

| Escenario | Señal |
|---|---|
| A. Iniciativa nueva de diseño | Hay historias READY/CONDITIONAL y no hay UXR/FLW/SCR |
| B. Cambio sobre diseño existente | Hay artefactos de diseño y cambia una historia, regla o decisión |
| C. Especificar pantallas | Hay UXR/FLW; faltan SCR/CMP/TKN o están incompletos |
| D. Exploración visual | SCR especificados y listos; falta explorar con la herramienta elegida (Claude Design, Figma, código u otra), con capturas |
| E. Diseño gobernado | Hay exploración; falta gobernar el diseño (Claude Design con DD humano, o el prototipo validado), o divergencia Stitch↔Figma si se usan |
| F. Auditoría y gate | Hay que saber si un SCR/flujo está listo para Desarrollo, o si un paquete puede cerrarse (UXS) |
| G. Decisión humana recibida | Un humano respondió preguntas, eligió alternativa o aprobó |
| H. Construcción directa en front end | Se construye desde los SCR, el Design System y las decisiones sin explorar antes: cierra igual con la UXS y se gobierna con el prototipo validado al terminar de construir |

Si es ambiguo, pregunta una sola cosa concreta (iniciativa/flujo o historia de partida); no adivines el alcance.

### 2. Planificar

Presenta un plan corto: escenario, skills en orden, **la tarea de cada fase** (p. ej. fase 2 → IDV-UX · 02), artefactos que se crearán o actualizarán, qué se paraleliza y qué decisiones humanas se esperan. Una fase sin tarea es trabajo nuevo: se agrega al mapeo (modo AJUSTAR de `em-gestion-tareas`) antes de ejecutarla. Espera confirmación si crea más de cinco archivos, toca artefactos `approved`, o va a **crear un proyecto Stitch** o escribir en Figma (acciones externas). Si el usuario ya pidió ejecutar sin preguntar, procede, salvo la creación de un `STP-*`, que exige autorización humana explícita (`human:<id>`).

### 2b. Aislar en un worktree

Si va a crear o modificar archivos, trabaja en un worktree `ux/<slug>` siguiendo `references/worktree-protocol.md` (extiende el de `af-requirements-orchestrator`). Las ejecuciones que solo leen no lo necesitan. Las llamadas a Stitch y Figma son efectos externos que **no** se aíslan: avisa de ello antes de ejecutarlas.

### 3. Ejecutar por fases

Orden canónico (omite lo que el escenario no necesite):

| Fase | Skill | Compuerta para pasar a la siguiente |
|---|---|---|
| 1 Requisitos UX | `ux-requirements-analyzer` | Cada UXR con lineage a US/AC; actor, permisos y estados; vacíos como preguntas |
| 2 Flujos | `user-flow-designer` | Happy path, excepciones, permisos y estados; `screens` declarado |
| 3 Especificación | `ui-spec-writer` (+ `web-atomic-component-designer` si hay librería) | `validators/cli.py preflight` sin `BLOCKED`; cada SCR con `flow`, `requirements`, `required_states`, `a11y_requirements`; investigación dentro de Pantallas con INV y DEC; `audit_ux.py --compuerta G3` sin error |
| 3b Consolidación (**GU**) | `ux-context-builder` | `audit_ux.py --exigir-uxs` sin `PAQUETE_SIN_UXS` para el paquete; veredicto por consumidor con su razón; preguntas abiertas con responsable; validación humana pendiente |
| 4 Exploración | Herramienta elegida: Claude Design, Figma, código u otra; registra el IB | SCR→FLW, alternativas, decisión y capturas guardadas; `audit_ux.py --compuerta G4` sin error; con Stitch conserva un solo STP por iniciativa |
| 5 Accesibilidad durante la construcción | `accessibility-reviewer`, sobre micro UI, shell y DS implementados | ARP creado y actualizado mientras se construye, con accesibilidad evaluada sobre lo implementado antes de Validado; ARP con versión evaluada, resultados y evidencia; ningún `pass` sin evaluar; `fail`/`inconclusive` visibles |
| 6 Diseño gobernado | Claude Design (DD humano), el prototipo validado al terminar de construir, o `figma-design-validator` | Figma es opcional; código validado con Enzo, captura y ARP permite pasar G6 sin Figma. Con Figma/Stitch, `governed_design` por SCR y divergencia `none` o `resolved` |
| 7 Handoff | `ux-development-handoff` | `validators/cli.py gate` sin `FAILED`/`BLOCKED`; revisión humana pendiente registrada (hoy el gate solo reconoce Figma o Stitch como diseño gobernado) |

Por qué este orden: el flujo necesita los UXR para listar pantallas; la especificación de pantalla es lo que consume la exploración y evita que invente; la UXS cierra el paquete antes de explorar o construir porque es lo que leen Claude Design, QA y Desarrollo; la accesibilidad se apoya en los componentes del Design System y lo propio de cada pantalla se verifica al validar lo construido. La **vía directa a front end** (escenario H) salta la exploración y el handoff formal, **pero no la fase 3b**. Pasa de fase solo cuando la compuerta se cumple o cuando la pregunta abierta no bloquea (queda registrada, no se esconde).

**Paralelización.** Las fases 1–3 se paralelizan por flujo/familia de UXR (p. ej. UXR-028/029/030 son independientes entre sí tras UXR-017). Las fases 4–6 se paralelizan por SCR, **excepto** que todos los SCR de una iniciativa viven en el mismo `STP` (invariante de `stitch-ui-generator`): serializa la creación/resolución del proyecto y paraleliza solo la generación de pantallas dentro de él.

Al delegar en un subagente, entrégale: skill a usar, ruta del worktree, flujo/SCR en alcance, fuentes autorizadas, artefactos existentes a actualizar (no reemplazar), y qué debe devolver (archivos tocados, estado de preflight/gate, preguntas nuevas). Si corren en paralelo, indícales que no editen `index.md`, `changelog.md` ni el DTM y que devuelvan las entradas: las aplicas tú una sola vez (en paralelo se pisarían). Verifica sus resultados con la herramienta correspondiente antes de darlos por buenos.

### 4. Cerrar costuras (ruteo de preguntas)

Enruta cada hallazgo al skill que puede resolverlo y repite hasta el punto fijo o hasta quedar solo lo que exige a un humano:

| Hallazgo | Lo resuelve |
|---|---|
| Historia sin UXR; UXR con lineage roto o sin actor/permisos | `ux-requirements-analyzer` |
| Pregunta sobre regla, término o comportamiento de negocio | Vuelve a `af-requirements-orchestrator` (no se responde en diseño) |
| UXR sin flujo; excepción, permiso o estado no cubierto | `user-flow-designer` |
| FLW lista un SCR que no existe, o SCR cuyo `flow` no coincide | `ui-spec-writer` (el FLW declara; el SCR confirma) |
| SCR sin `required_states`, `responsive` o `a11y_requirements` | `ui-spec-writer` |
| Componente repetido o no reutilizable; boundary de librería | `web-atomic-component-designer` |
| Pantalla sin exploración o con contenido inventado por Stitch | `stitch-ui-generator` |
| Hay que comparar alternativas o elegir entre Stitch y Figma | `claude-design-orchestrator` (el DD lo decide un humano) |
| Referencia Figma obsoleta (`STALE_FIGMA_REFERENCE`) o sin `governed_design` | `figma-design-validator` |
| Contraste, foco, teclado, nombres accesibles, objetivos táctiles | `accessibility-reviewer` |
| Gate `FAILED`/`BLOCKED` | El skill upstream dueño del código de error (ver `references/role-readiness.md`); nunca parchear en el HOF |
| Contradicción entre fuentes | No se resuelve: se preserva y se escala al Responsable |

Tope: tres pasadas. Si tras la tercera siguen apareciendo brechas, detente y repórtalas: es señal de un problema de alcance o de requisitos, no de diseño.

**Cada hallazgo también se refleja en su tarea** (con `em-gestion-tareas`), en el momento en que aparece y no al cierre:

| Lo que aparece a mitad del trabajo | Qué pasa con la tarea |
|---|---|
| Pregunta abierta que frena el trabajo (de PO, Arquitectura o el analista) | AVANCE con bloqueo: la pregunta, quién responde y qué desbloquea |
| Trabajo nuevo: un módulo, una pantalla o un flujo que no estaba mapeado | AJUSTAR: se agrega al mapeo, se valida con `armar-mapeo.mjs` y se crea la subtarea |
| Cambio en la KB que toca la tarea sin cambiar el alcance | AVANCE con nota y el enlace al cambio |
| Pregunta UX que la IA cierra por delegación | AVANCE con nota y el DEC |

### 5. Auditar calidad

1. Ejecuta `audit_ux.py` y corrige todo error imputable a un skill (re-invócalo; no edites a mano lo que genera una herramienta). Antes de cerrar, córrelo con `--exigir-uxs` (paso 6): un paquete con pantallas y sin UXS es un error, no un detalle.
2. Ejecuta el preflight (`python "${CLAUDE_SKILL_DIR}/../ux-development-handoff/validators/cli.py" preflight --profile production --kb knowledge-base --initiative <ini> --screens <SCR…>`) y, si ya hay HOF, el `gate`.
3. Evalúa los atributos de `references/quality-criteria.md` por SCR y a nivel conjunto, citando archivo y sección.
4. Revisa la trazabilidad cruzada: US → UXR → FLW → SCR → DTM → ARP → HOF, sin huérfanos en ninguna dirección.

### 6. Consolidar la UXS y emitir veredictos

**Delega en `ux-context-builder`:** crea o regenera `knowledge-base/design/specs/UXS-NNN-<slug>.md` (con `--actualizar` si el paquete ya tiene una), con su fila en `index.md` y su entrada en `changelog.md`. No la redactes a mano: un archivo a mano no pasa la auditoría ni lo lee el cargador de Notion. El formato es el de `templates/ux-design-spec-template.md`. La UXS no duplica los artefactos: los indexa, resume calidad, expone la matriz de trazabilidad por pantalla, lista bloqueos y emite veredicto por **etapa/consumidor** según `references/role-readiness.md`:

| Consumidor | Qué puede hacer cuando está READY | Skill siguiente |
|---|---|---|
| Claude Design (exploración visual) | Explorar y criticar alternativas sin inventar; la UXS es su UX Context Pack | `claude-design-orchestrator` |
| Stitch | Generar exploración sin inventar (hoy no se usa) | `stitch-ui-generator` |
| Figma | Validar y gobernar el diseño (descartado como diseño gobernado el 2026-10-04) | `figma-design-validator` |
| Desarrollo (Developer + agente IA) | Construir directo en front end desde los SCR, el Design System y las decisiones (CONDITIONAL), o pasar el gate formal con diseño gobernado (READY) | construcción directa; `ux-development-handoff` → `development-handoff-builder` |
| QA | Derivar casos de UI y accesibilidad | `test-case-generator` |

Cada veredicto es READY, CONDITIONAL o NOT READY, con razón y bloqueos.

## Control de cierre de paquete (compuerta GU)

Un paquete DSP-NNN con pantallas especificadas **no se cierra, ni se sube su rama de diseño, sin la UXS que lo indexa**. Esto no depende de que alguien lo recuerde: lo comprueban tres controles duros, además de este texto.

| Control | Qué hace | Cuándo corre |
|---|---|---|
| `scripts/audit_ux.py --exigir-uxs` | Error `PAQUETE_SIN_UXS` si el paquete tiene SCR y ninguna UXS; aviso `UXS_NO_INDEXA` si la UXS no menciona artefactos del paquete; aviso `ARTEFACTO_SIN_PAQUETE` si hay artefactos sin etiqueta `dsp-NNN`. `--paquetes` o `--desde-rama <base>` lo limitan a lo que toca la rama | En el paso 5, antes de proponer la integración |
| Hook `hooks/guardia-uxs.mjs` (plugin `comsatel-ux`) | Frena el `git push` de una rama `ux/*` que toca un paquete sin UXS | Al subir la rama, en cualquier sesión con el plugin |
| Compuerta GU del `pack.yaml` | La consolidación es una tarea y una compuerta del flujo (T-03b), también en la vía directa | Al planificar y al cerrar |

Si el hook frena: arma la UXS con `ux-context-builder`, commitéala en la rama y vuelve a subir. **No rodees el bloqueo** (ni lo apagues con `COMSATEL_UX_GUARDIA`: esa variable la fija una persona, no el agente). Detalle y pruebas en `references/controles-de-cierre.md`.

### 7. Integrar

Antes de emitir el cierre, completar B2 y reportar cada destino comprobado o pendiente. Integrar o publicar conserva sus permisos propios.

## Tareas: siempre con em-gestion-tareas (Enzo, 2026-11-26)

Toda tarea que este orquestador ejecuta se registra con `em-gestion-tareas`; ningún otro skill escribe en la base Tareas, en issues ni en ClickUp.

- **Antes de empezar** (paso 0): las tareas existen y la KB está revisada con `cambios-kb.mjs`.
- **Al empezar** una tarea UX (y al recibir un paquete: modo RECIBIR): modo AVANCE (estado «En curso»). Si la tarea no existe, se pide; no se crea sin su mapeo.
- **Al pasar cada compuerta** (G1 a G7, GU): modo AVANCE con la salida de `audit_ux.py --compuerta` como evidencia. Así cada avance deja su trazabilidad sin depender de la memoria.
- **Al terminar cada paso con evidencia** (MR, artefacto, comentario): modo AVANCE con los enlaces, para marcar su casilla. Mientras el trabajo vive en la rama `ux/*`, la rama y el commit son evidencia provisional; al fusionar se cambian por el enlace a `develop`.
- **A mitad del trabajo**: la tabla del paso 4 (bloqueo, AJUSTAR o nota).
- **Al terminar la tarea**: modo CERRAR con la evidencia. Cerrar marca criterios, cierre, Plan de la madre y Resultado; GitLab y ClickUp esperan su fecha límite.
- Las capturas y «Cómo funciona» las agrega el ejecutor en la misma tarea; `em-gestion-tareas` no las sube.

Con la auditoría limpia, o los errores restantes declarados, cierra según la sección 4 de `references/worktree-protocol.md`: `graphify update .`, resumen de cambios y decisiones pendientes, y propuesta de merge, PR, conservar o descartar. Espera la respuesta; no hagas commit, merge ni borres el worktree por iniciativa propia.

## Construcción y cierre de iteración (Enzo, 2026-11-14)

La investigación de la solución va dentro de Pantallas y deja un INV y un DEC enlazados al SCR antes de cerrarlo: benchmarking, componentes del DS disponibles o faltantes, micro UI de destino y ubicación en el shell. La exploración admite cualquier herramienta y guarda capturas. El ARP se crea y actualiza durante la construcción del prototipo, sobre lo implementado. En cada iteración que cambia lo construido, el agente propone los cambios a UXR, FLW, SCR y DEC, la captura y el estado; Enzo aprueba **antes de escribir**. El registro de evidencia se mantiene en la memoria del proyecto (`design/MEMORY.md`) y en el artefacto, con el contrato de `references/controles-de-cierre.md`.

Flujos, Pantallas y Exploraciones siguen **Borrador → En revisión → En construcción → Validado**. Validado exige prueba con Enzo en el navegador y captura de la versión probada, además de accesibilidad revisada sobre lo implementado. La vía directa a código conserva todos estos controles. `audit_ux.py --cerrar-paquete --conciliacion <informe.json>` bloquea un cierre sin estas evidencias; la auditoría ordinaria avisa de los documentos aún en preparación.

## Verificaciones automáticas antes de avanzar

Ejecuta `scripts/audit_ux.py <kb> --compuerta <G>` antes de dar paso a la siguiente fase. G0 exige la memoria con el plan; G1 UXR y lineage; G2 FLW y screens; G3/GR SCR e INV+DEC; GU UXS; G4 exploración y capturas; G5 ARP implementado; G6 diseño validado en código o gobernado aprobado; G7 HOF (además del gate formal si se usa); GI la propuesta y evidencia de iteración; GC la conciliación completa sin diferencias. El esquema y los códigos están en `references/controles-de-cierre.md`. Un resultado con errores bloquea el avance. La vía directa a código pasa por GU, G3, G5, G6, GI y GC; no depende de Figma ni de un HOF formal.

El hook guardia-uxs impide subir ramas de diseño con UXS faltante, SCR cerrado sin INV/DEC, iteración sin propuesta/captura/aprobación o Validado sin prueba y ARP implementado. La conciliación también advierte ARTEFACTO_BORRADOR_CON_CONSTRUCCION: lee los repositorios de producto autorizados, referencias HU/FLW/SCR en código, ramas CLF_Feature_<US> y merges locales con referencias de MR; propone En construcción, y solo propone Validado con prueba de Enzo, captura y ARP de esa versión. Nunca aplica estados automáticamente ni afirma un estado remoto de MR sin evidencia. Sin repositorios configurados informa el límite.

## Recalcular estados en cadena

Al conciliar, propón cambios en ambos sentidos: preguntas resueltas (Decidida/Diferida/Descartada) → UXR En revisión; si sus flujos ya están En construcción o Validado, UXR Aprobado, solo con aprobación de Enzo y approved_by. Una pantalla En construcción mueve su FLW/IB a En construcción; todas Validadas los llevan a Validado. Un IB con lienzo o capturas pasa a En revisión. La evidencia propia de Validado sigue siendo obligatoria.

Recalcula UXS y paquete desde preguntas, aprobación y validación: En curso → Diseño cerrado → Listo para desarrollo. Para Estado del alcance propone Borrador, En preparación, Listo para selección de sprint, En sprint o Cerrado según su preparación y construcción; la persona confirma el paso operativo. Una aprobación propuesta no cuenta como aprobación real.

Si cambia una fuente del KB, sin importar quién la editó, propón Vigencia = Revisar por cambio de fuente en preguntas, Resumen vigente = Desactualizado en UXR/FLW y retorno de Validado/Aprobado a En revisión. La invalidación se propaga por dependencias y prevalece sobre un avance. Sin huella se declara cobertura incompleta. La conciliación genera las propuestas; Enzo aprueba y primero se actualiza el KB. GC bloquea una cascada pendiente o incompleta.

## Compuertas humanas

Los artefactos nuevos comienzan en Borrador (`status: draft`). El orquestador solo transcribe cambios de estado aprobados y comprobables:

- Nunca inventes `verified`, `approved`, `human_review.status: approved` ni una validación en nombre de una persona. Registra Validado solo tras la prueba de Enzo, su aprobación, captura y revisión de accesibilidad implementada.
- **Elegir entre alternativas, resolver una divergencia Stitch↔Figma, aprobar `governed_design` y aprobar el gate son decisiones humanas.** Regístralas (quién, cuándo, qué, por qué) solo cuando el usuario las aporte con nombre y rol; sin autor identificable, queda como información del usuario.
- Crear un proyecto Stitch exige autorización explícita (`--authorized-by human:<id>`).
- Termina con una lista de **decisiones humanas pendientes**: pregunta, responsable, prioridad y qué desbloquea.

## Reglas de operación

- **Actualizar, no reemplazar.** IDs permanentes (UXR, FLW, SCR, CMP, TKN, GEN, STP, DD, ARP, HOF, DTM). Nunca renumeres ni dupliques.
- **Sin huérfanos.** Todo artefacto de diseño cuelga de FLW/SCR y estos de US/UXR. El DTM es la **única** fuente del vínculo SCR↔Stitch/Figma; no copies referencias externas al SCR.
- **Exploración ≠ diseño gobernado.** Claude Design (y Stitch, si se usa) exploran. El diseño se gobierna en Claude Design con un DD humano, o con el prototipo construido en código y validado al terminar de construir; Figma gobierna solo si se usa. Al desarrollo nunca se entrega un artefacto Stitch si existe Figma gobernado.
- **No inventar.** Ante un vacío (permiso, estado, contenido, token), abre pregunta. No aceptes contenido que Stitch inventó; anótalo.
- **Accesibilidad es evidencia, no una frase.** Se apoya en la estructura de los componentes del Design System (el contrato de accesibilidad de cada uno); lo propio de cada pantalla se verifica al validar lo construido. Que una herramienta diga "WCAG AA" no es evidencia; `pass` solo si se evaluó.
- **Preservar contradicciones** entre fuentes; no elijas por tu cuenta.
- **Verificar en vivo** las referencias Stitch y Figma antes de usarlas; si no se puede, es pregunta abierta, no un dato.
- **Fechas y autoría** en frontmatter OKF v0.2: `generated.by` del skill que produjo el archivo (el de la UXS es `ux-context-builder/1.0`), `generated.at` ISO 8601 con `-05:00`.
- **Solo diseño.** Coordinar la retroalimentación del desarrollo está incluido; escribir su código no. Si el pedido se desliza a negocio/requerimientos, arquitectura o código, detente y señala el skill de la etapa correspondiente.

## Comportamientos bloqueantes y lecciones de la sesión (2026-11-14)

- **KB primero y conciliación en ambos sentidos.** Notion refleja el KB. Toda respuesta, decisión y estado se registra primero en Open questions de UXR/FLW/SCR y en DEC cuando se decide; una diferencia se propone y se aprueba antes de aplicarla.
- **Delegación limitada a UX estándar.** La IA cierra textos, estados vacíos, mensajes, formatos o patrones con benchmarking, fecha, DEC y fuentes, como IA (delegado por Enzo). Nunca cierra negocio, permisos, datos ni alcance.
- **Propuesta UX es solo para Enzo.** Las propuestas ajenas no se remapean. Si intervienen PO y UX, decide el PO y UX propone. Diferida significa que la función no se construye en este paquete o piloto; se reabre al construirla.
- **Resumen y detalle tienen lugares distintos.** Respuesta tiene hasta 200 caracteres y [Confirma: X] si está pendiente; el detalle vive en Resolución, con sus cuatro heading_3. Nunca heading_1 en Notion.
- **Lo construido deja evidencia y mueve sus dependencias.** Nada permanece en Borrador con código detectado. Propón estado, captura y actualización en cadena; Validado requiere prueba con Enzo y ARP implementado. Una fuente modificada devuelve a revisión lo aprobado o validado.
- **Corrida en seco y aprobación de Enzo antes de escribir en Notion.** Muestra el plan concreto completo; no conviertas una propuesta ni el silencio en aprobación. La escritura masiva usa API REST, no MCP: el cupo del MCP se agota. La conciliación solo lee por REST.
- **Un plan, un registro por ID.** Deduplica antes de cargar. IDs repetidos con contenido distinto bloquean el plan; campos null, undefined o registros sin ID impiden darlo por completo. Los workers no escriben FIN hasta cubrir todos los registros; los pendientes se explican y nunca se esconden con nulls.
- **Los estados se retroalimentan, no bajan en una sola dirección.** Una pregunta mueve su UXR; una pantalla mueve su flujo y su exploración; flujos y UXR mueven la UXS y el paquete; un cambio en el KB vuelve a abrir lo que depende de él. Recalcula hasta que nada cambie. **El alcance del paquete lo decide el gestor de proyectos** con el sprint de GitLab: la cascada nunca hace retroceder un paquete, y la entrada a «En sprint» o «Cerrado» solo se propone para que él la confirme. UX puede cargar sus tareas en un sprint antes que Desarrollo.
- **La HU pertenece al analista funcional de su DSP.** Si una respuesta o decisión la afecta, no la edites. Propón un comentario para ese analista: ID de pregunta, qué cambió y AC o regla a revisar. El analista decide el cambio; Enzo aprueba el comentario. Si falta el DSP o el AC exacto, decláralo; no inventes destinatarios. El comentario no se envía automáticamente.

## Informe final al usuario

Incluye siempre el informe de inicio y la matriz de sincronización de `references/ciclo-retroalimentacion.md`. Cierra con un resumen breve, en este orden: escenario y ruta ejecutada; artefactos creados/actualizados; resultado de auditoría, preflight y gate (errores restantes); veredictos por consumidor; decisiones humanas pendientes; siguiente skill recomendado. Declara lo que no se pudo verificar u omitió (p. ej. Stitch/Figma inaccesibles).

## Referencias

- `references/ciclo-retroalimentacion.md` — obligatorio al inicio y al cierre de todo desarrollo, mejora, análisis o definición.

- `references/scenarios.md` — ruta, entradas y criterio de salida de cada escenario.
- `references/quality-criteria.md` — atributos de calidad del diseño y cómo evaluarlos.
- `references/role-readiness.md` — qué necesita cada etapa/consumidor y mapa de códigos de error → skill dueño.
- `references/controles-de-cierre.md` — los controles duros de cierre de paquete (auditoría, hook y compuerta GU): qué hacen, cómo se prueban y cómo se ajustan.
- `references/worktree-protocol.md` — aislamiento con git worktree (rama `ux/<slug>`), integración y limpieza.
- `scripts/cambios-kb.mjs` — qué cambió en la KB para un paquete desde la última revisión: inventario fechado de historias, cambios con su sección, preguntas abiertas y efecto en cadena sobre diseño y tareas (solo lee; `--registrar` guarda la revisión vista en `~/.comsatel/revision-kb.json`).
- `templates/ux-design-spec-template.md` — plantilla de la UXS.
- `scripts/audit_ux.py` — auditoría determinista (`--json` para salida estructurada; `--exigir-uxs` con `--paquetes` o `--desde-rama` para el control de cierre).
- `hooks/guardia-uxs.mjs` — hook del plugin que frena subir una rama `ux/*` sin la UXS de los paquetes que toca; se prueba con `hooks/probar-guardia-uxs.mjs`.
