# Escenarios de gestión del diseño UX/UI

Cada escenario indica la ruta mínima. "Mínima" importa: ejecutar fases que no aportan cuesta tiempo, llama a herramientas externas sin necesidad y arriesga tocar diseño ya gobernado. Todas las rutas terminan en los pasos 5 (auditar) y 6 (UXS y veredicto) de `SKILL.md`, salvo que se indique.

## Contenido
- A. Iniciativa nueva de diseño
- B. Cambio sobre diseño existente
- C. Especificar pantallas
- D. Exploración visual
- E. Diseño gobernado
- F. Auditoría y gate
- G. Decisión humana recibida
- H. Construcción directa en front end
- Combinaciones y conflictos

## A. Iniciativa nueva de diseño

**Señal:** hay historias READY/CONDITIONAL (RQS con veredicto UX/UI) y no existen UXR, FLW ni SCR de la iniciativa.

**Entradas mínimas:** historias del alcance, reglas y glosario vigentes, y el Design System o `TKN-SET-*` disponible (si no existe, es pregunta abierta, no se inventa). Si el veredicto UX/UI de la RQS es NOT READY, no arranques: vuelve a `af-requirements-orchestrator`.

**Ruta:** UXR → FLW → SCR/CMP/TKN → (a11y de la spec) → **UXS (compuerta GU)** → exploración en Claude Design → diseño gobernado (Claude Design con DD humano, o el prototipo validado al terminar de construir) → handoff → auditoría.

**Salida:** ciclo completo. Es normal que la primera pasada deje CONDITIONAL: prioriza que las preguntas abiertas estén bien dirigidas, no que todo pase el gate. Las fases 4–7 solo se ejecutan para los SCR cuya especificación pasó el preflight.

## B. Cambio sobre diseño existente

**Señal:** hay artefactos de diseño y cambia una historia, una regla, un término o una decisión.

**Entradas mínimas:** el cambio y su fuente; UXR/FLW/SCR/DTM vigentes.

**Ruta:** análisis de impacto (qué UXR, flujos, pantallas, componentes y diseños toca) → actualizar solo lo afectado en el orden canónico → re-explorar y re-validar solo los SCR cambiados. Recorre el DTM: toda entrada `governed_design` de un SCR cambiado queda **en duda** hasta revalidar.

**Atención:** un SCR con `governed_design.status: approved` no se edita en silencio. Un cambio puede invalidar un gate previo (`PASSED`) o un ARP `pass`: dilo explícitamente. En Stitch, la regeneración actualiza dentro del mismo `STP` y pasa la exploración anterior a `superseded`; nunca crea proyecto nuevo.

## C. Especificar pantallas

**Señal:** hay UXR/FLW; faltan SCR, CMP o TKN, o están incompletos (sin `required_states`, `responsive`, `a11y_requirements`).

**Ruta:** verificar que FLW y SCR coinciden en ambos sentidos → `ui-spec-writer` (reutilizando CMP/TKN existentes antes de crear nuevos) → `web-atomic-component-designer` si hay librería de componentes → preflight → auditoría → UXS.

**Atención:** los estados omitidos se justifican o son pregunta abierta; no los inventes. Tokens semánticos, no valores crudos.

## D. Exploración visual

**Señal:** SCR e investigación INV/DEC preparados, con UXS consolidada; falta explorar.

**Ruta:** elige Claude Design, Figma, código u otra herramienta → registra IB, alternativas y decisión → guarda capturas → verifica G4 con audit_ux.py. No se exige una herramienta específica. Con Stitch conserva su STP autorizado y su registro; no crees un proyecto sin autorización.

## E. Diseño gobernado o validado en código

**Señal:** existe exploración y falta evidencia de aprobación o validación.

**Ruta en código:** construye micro UI + shell + DS, crea y actualiza ARP mientras se implementa, prueba con Enzo en navegador, guarda captura y registra versión y aprobación → G5/G6. Figma es opcional cuando esta vía está validada.

**Si se usa Figma:** verifica acceso autorizado, resuelve divergencia con DD humano y conserva governed_design aprobado en el DTM. No inventes approved_by ni supongas el contenido de un nodo inaccesible. La revisión de Figma no reemplaza el ARP implementado para Validado.

## F. Auditoría y gate

**Señal:** "¿está listo el diseño?", "revisa la calidad", antes de entregar a Desarrollo.

**Ruta:** auditoría (paso 5) primero: `audit_ux.py`, preflight y `gate`. Con los hallazgos, enruta cada brecha al skill dueño con la tabla del paso 4 y vuelve a auditar. No reescribas artefactos desde aquí. Si el gate pasa, `ux-development-handoff` redacta el HOF y deja la revisión humana pendiente.

**Salida:** informe de calidad, UXS actualizada y, si no hay nada que corregir, dilo.

## G. Decisión humana recibida

**Señal:** el usuario trae respuestas a preguntas abiertas, una alternativa elegida, una aprobación de Figma o del gate, o un rechazo.

**Entradas mínimas:** qué se decidió, quién (nombre y rol) y cuándo. Sin autor identificable, regístralo como información del usuario, no como decisión de un Responsable.

**Ruta:** localizar las preguntas que cierra (por ID: UXR-NNN-Qn, FLW-Qn, SCR-Qn, ARP-Qn) → registrar la decisión con el skill dueño (DD vía `claude-design-orchestrator`; `governed_design` vía `figma-design-validator`; gate vía `ux-development-handoff`) → propagar a los artefactos afectados → re-evaluar los veredictos. Si la respuesta cambia una regla o un término de negocio, escálala a `af-requirements-orchestrator`.

**Atención:** cerrar una pregunta deja la fila con estado `Cerrada — <fuente>`; no la borres. La aprobación solo se marca si el usuario la nombra explícitamente.

## H. Construcción directa en front end

**Señal:** se construye la pantalla directo en el micro UI o el producto, a partir de los SCR, el Design System y las decisiones, sin exploración previa en Claude Design.

**Entradas mínimas:** SCR completos del paquete (con `flow`, `requirements`, `required_states` y `a11y_requirements`) y las decisiones (DEC) que los corrigen.

**Ruta:** SCR con INV/DEC y G3 → **UXS (compuerta GU)** → construcción (`orquestador-desarrollo`) → ARP actualizado durante la implementación → propuesta documental/captura/estado aprobada por Enzo → validación del prototipo y conciliación/cascada sin diferencias. La vía directa **salta la exploración y el handoff formal, no la UXS**: el paquete se consolida igual, con `ux-context-builder`, antes de subir la rama de diseño.

**Atención:** el diseño se gobierna con el prototipo validado (capturas de cada estado, URL y MR), y el gate `DESIGN_READY_FOR_DEV` admite esa vía con la DD humana y evidencia de la versión exacta según ux-development-handoff. Sin un PASSED real de producción, Desarrollo sigue CONDITIONAL para la vía directa y no READY formal. Lo que ningún diseño cubre se consulta y se registra en una decisión (DEC), no se improvisa.

## Combinaciones y conflictos

- **Dos escenarios a la vez** (p. ej. B y G): resuelve primero G, porque las decisiones cambian el insumo del cambio.
- **Pedido fuera de diseño** (reglas de negocio, arquitectura, código): fuera de alcance; señala el skill siguiente o anterior.
- **Fuentes que se contradicen** (US vs UXR, Stitch vs Figma): preserva ambas, abre pregunta al Responsable y marca el artefacto CONDITIONAL como máximo.
- **Herramienta externa caída** (Stitch o Figma): registra el bloqueo (`BLOCKED`), continúa con lo que no depende de ella y dilo en el informe.
