# Flujo por fases

Leer al diagnosticar y antes de cada fase. Es el recorrido completo del orquestador, del
paso 0 al 7, con la compuerta de cada fase y el ruteo de hallazgos entre especialistas.

## Índice

1. Resumen del flujo
2. Paso 0: validar tareas y cambios de la KB
3. Paso 1: diagnosticar
4. Paso 2: planificar y aislar
5. Paso 3: ejecutar por fases
6. Paso 4: cerrar costuras
7. Paso 5: auditar calidad
8. Paso 6: consolidar la UXS
9. Paso 7: integrar

## 1. Resumen del flujo

0. **Validar tareas y cambios de la KB** antes de todo (paso 0). Se repite al iniciar cada sesión y antes de cerrar una tarea.
1. **Diagnosticar** el estado y el escenario (paso 1).
2. **Planificar** la ruta mínima atada a sus tareas y mostrarla antes de ejecutar (paso 2).
3. **Aislar** en un git worktree si va a escribir archivos (paso 2b).
4. **Ejecutar** por fases, con compuerta entre ellas (paso 3).
5. **Cerrar costuras**: enrutar preguntas y brechas entre skills (paso 4).
6. **Auditar** (paso 5).
7. **Consolidar** la UXS y emitir veredictos (paso 6).
8. **Integrar**: proponer incorporación y esperar la decisión (paso 7).

## 2. Paso 0: validar tareas y cambios de la KB

Antes de diagnosticar o diseñar, dos comprobaciones, en este orden:

1. **¿El paquete tiene sus tareas?** `em-gestion-tareas` en modo ESTADO. Si no las tiene, modo RECIBIR (mapeo, validación con `armar-mapeo.mjs` y creación en Notion) y recién después se planifica. Lo hace el orquestador que empieza primero (UX o Desarrollo); el otro solo consulta ESTADO, para no duplicar tareas.
2. **¿Qué cambió en la KB desde la última revisión?**

   ```
   node .claude/skills/em-orquestador-ux/scripts/cambios-kb.mjs DSP-NNN --kb knowledge-base --informe cambios.md
   ```

   La primera vez se indica `--desde <AAAA-MM-DD>` (la fecha en que se recibió el paquete); después usa la revisión registrada. El informe trae: el inventario del paquete y sus historias (HU) con la fecha y el autor de su última actualización; lo que cambió (historias, avisos AVS, consultas QST/RSP, decisiones y artefactos de diseño) con la sección tocada, por ejemplo «AC-4»; las preguntas abiertas con su responsable; y el efecto en cadena sobre los Requerimientos UX (UXR), Flujos de usuario (FLW), Pantallas (SCR) y tareas.


   Lo demás del informe es propuesta. Muestra el informe y propón: AVANCE con nota o con bloqueo en cada tarea afectada (con `em-gestion-tareas`), «Revisar por cambio de fuente» en los artefactos de diseño (con la conciliación) y el comentario al analista si una decisión toca una HU. Con la aprobación de Enzo se aplica y se registra la revisión con `--registrar`. El commit revisado queda en `design/MEMORY.md` («Revisión de la KB: cambios-kb.mjs en <commit>»).

**Cuándo se repite:** al iniciar cada sesión de UX, antes de cerrar una tarea (para no cerrar sobre una historia que cambió) y en la rutina diaria. La compuerta G0 de `audit_ux.py` falla si `design/MEMORY.md` no cita las tareas ni registra la revisión de la KB.

## 3. Paso 1: diagnosticar

Primero completar la compuerta B1; el informe independiente es la entrada de este diagnóstico. Para leer fuentes de la KB, usar `git show origin/develop:<ruta>` según el protocolo, nunca un worktree sucio.

Haz un inventario antes de decidir, porque la ruta depende de lo que ya existe:

```
python <carpeta de este skill>/scripts/audit_ux.py knowledge-base
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

## 4. Paso 2: planificar y aislar

Presenta un plan corto: escenario, skills en orden, **la tarea de cada fase** (p. ej. fase 2 → IDV-UX · 02), artefactos que se crearán o actualizarán, qué se paraleliza y qué decisiones humanas se esperan. Una fase sin tarea es trabajo nuevo: se agrega al mapeo (modo AJUSTAR de `em-gestion-tareas`) antes de ejecutarla. Espera confirmación si crea más de cinco archivos, toca artefactos `approved`, o va a **crear un proyecto Stitch** o escribir en Figma (acciones externas). Si el usuario ya pidió ejecutar sin preguntar, procede, salvo la creación de un `STP-*`, que exige autorización humana explícita (`human:<id>`).

**Aislar en un worktree.** Si va a crear o modificar archivos, trabaja en un worktree `ux/<slug>` siguiendo `references/worktree-protocol.md` (extiende el de `af-requirements-orchestrator`). Las ejecuciones que solo leen no lo necesitan. Las llamadas a Stitch y Figma son efectos externos que **no** se aíslan: avisa de ello antes de ejecutarlas.

## 5. Paso 3: ejecutar por fases

Orden canónico (omite lo que el escenario no necesite):

| Fase | Skill | Compuerta para pasar a la siguiente |
|---|---|---|
| 1 Requisitos UX | `ux-requirements-analyzer` | Cada UXR con lineage a US/AC; actor, permisos y estados; vacíos como preguntas |
| 2 Flujos | `user-flow-designer` | Happy path, excepciones, permisos y estados; `screens` declarado |
| 3 Especificación | `ui-spec-writer` (+ `web-atomic-component-designer` si hay librería) | `validators/cli.py preflight` sin `BLOCKED`; cada SCR con `flow`, `requirements`, `required_states`, `a11y_requirements`; investigación dentro de Pantallas con INV y DEC; `audit_ux.py --compuerta G3` sin error |
| 3b Componentes preliminares | `ui-spec-writer` | Cada SCR con su tabla pieza → componente del Design System (existe o brecha con su código de GAPS.md) |
| 4 Exploración en baja fidelidad (**obligatoria**, Enzo 2026-11-26) | `claude-design-orchestrator` (Claude Design, Figma, código u otra); registra el IB | Lee las SCR y su lista preliminar, no la UXS; valida estructura y flujo; brechas nuevas a la SCR y a GAPS.md (`npm run gap:report` en ui-components); capturas guardadas; `audit_ux.py --compuerta G4` sin error |
| 4b Consolidación (**GU**): la UXS agrupa todo, exploración incluida | `ux-context-builder` | `audit_ux.py --exigir-uxs` sin `PAQUETE_SIN_UXS` para el paquete; veredicto por consumidor con su razón; preguntas abiertas con responsable; validación humana pendiente |
| 5 Accesibilidad durante la construcción | `accessibility-reviewer`, sobre micro UI, shell y DS implementados | ARP creado y actualizado mientras se construye, con accesibilidad evaluada sobre lo implementado antes de Validado; ARP con versión evaluada, resultados y evidencia; ningún `pass` sin evaluar; `fail`/`inconclusive` visibles |
| 6 Diseño gobernado | Claude Design (DD humano), el prototipo validado al terminar de construir, o `figma-design-validator` | Figma es opcional; código validado con Enzo, captura y ARP permite pasar G6 sin Figma. Con Figma/Stitch, `governed_design` por SCR y divergencia `none` o `resolved` |
| 7 Handoff | `ux-development-handoff` | `validators/cli.py gate` sin `FAILED`/`BLOCKED`; revisión humana pendiente registrada (Claude Design/prototipo requieren DD humana y evidencia de la versión exacta; ver ux-development-handoff) |

Por qué este orden: el flujo necesita los UXR para listar pantallas; la especificación de pantalla es lo que consume la exploración y evita que invente; la exploración lee las pantallas y su lista preliminar de componentes, no la UXS (Enzo, 2026-11-26); la UXS va después porque agrupa todo el paquete, exploración y brechas incluidas, y es lo que leen QA y Desarrollo; las brechas que salen en desarrollo vuelven a la SCR y a GAPS.md; la accesibilidad se apoya en los componentes del Design System y lo propio de cada pantalla se verifica al validar lo construido. La **vía directa a front end** (escenario H) salta la exploración y el handoff formal, **pero no la fase 3b**. Pasa de fase solo cuando la compuerta se cumple o cuando la pregunta abierta no bloquea (queda registrada, no se esconde).

**Paralelización.** Las fases 1–3 se paralelizan por flujo/familia de UXR (p. ej. UXR-028/029/030 son independientes entre sí tras UXR-017). Las fases 4–6 se paralelizan por SCR, **excepto** que todos los SCR de una iniciativa viven en el mismo `STP` (invariante de `stitch-ui-generator`): serializa la creación/resolución del proyecto y paraleliza solo la generación de pantallas dentro de él.

Al delegar en un subagente, entrégale: skill a usar, ruta del worktree, flujo/SCR en alcance, fuentes autorizadas, artefactos existentes a actualizar (no reemplazar), y qué debe devolver (archivos tocados, estado de preflight/gate, preguntas nuevas). Si corren en paralelo, indícales que no editen `index.md`, `changelog.md` ni el DTM y que devuelvan las entradas: las aplicas tú una sola vez (en paralelo se pisarían). Verifica sus resultados con la herramienta correspondiente antes de darlos por buenos.

## 6. Paso 4: cerrar costuras

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

## 7. Paso 5: auditar calidad

1. Ejecuta `audit_ux.py` y corrige todo error imputable a un skill (re-invócalo; no edites a mano lo que genera una herramienta). Antes de cerrar, córrelo con `--exigir-uxs` (paso 6): un paquete con pantallas y sin UXS es un error, no un detalle.
2. Ejecuta el preflight (`python <carpeta hermana ux-development-handoff>/validators/cli.py preflight --profile production --kb knowledge-base --initiative <ini> --screens <SCR…>`) y, si ya hay HOF, el `gate`.
3. Evalúa los atributos de `references/quality-criteria.md` por SCR y a nivel conjunto, citando archivo y sección.
4. Revisa la trazabilidad cruzada: US → UXR → FLW → SCR → DTM → ARP → HOF, sin huérfanos en ninguna dirección.

## 8. Paso 6: consolidar la UXS

**Delega en `ux-context-builder`:** crea o regenera `knowledge-base/design/specs/UXS-NNN-<slug>.md` (con `--actualizar` si el paquete ya tiene una), con su fila en `index.md` y su entrada en `changelog.md`. No la redactes a mano: un archivo a mano no pasa la auditoría ni lo lee el cargador de Notion. El formato es el de `templates/ux-design-spec-template.md`. La UXS no duplica los artefactos: los indexa, resume calidad, expone la matriz de trazabilidad por pantalla, lista bloqueos y emite veredicto por **etapa/consumidor** según `references/role-readiness.md`:

| Consumidor | Qué puede hacer cuando está READY | Skill siguiente |
|---|---|---|
| Claude Design (exploración visual) | Revisar la exploración contra el paquete completo; la exploración en sí se hace antes de la UXS, desde las SCR | `claude-design-orchestrator` |
| Stitch | Generar exploración sin inventar (hoy no se usa) | `stitch-ui-generator` |
| Figma | Validar y gobernar el diseño (descartado como diseño gobernado el 2026-10-04) | `figma-design-validator` |
| Desarrollo (Developer + agente IA) | Construir directo en front end desde los SCR, el Design System y las decisiones (CONDITIONAL), o pasar el gate formal con diseño gobernado (READY) | construcción directa; `ux-development-handoff` → `development-handoff-builder` |
| QA | Derivar casos de UI y accesibilidad | `test-case-generator` |

Cada veredicto es READY, CONDITIONAL o NOT READY, con razón y bloqueos.

## 9. Paso 7: integrar

Antes de emitir el cierre, completar B2 y reportar cada destino comprobado o pendiente. Integrar o publicar conserva sus permisos propios.
