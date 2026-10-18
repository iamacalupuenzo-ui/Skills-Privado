# Arquitectura de preguntas y respuestas — Notion «Gestión Operativa» (CL2 Flotas)

Especificación para el agente o skill que trabaje esta información. Uso personal de Enzo Macalupu: **no se sube al repositorio**. Los otros diseñadores pueden trabajar solo con el repo. Fecha de la especificación: 2026-10-18.

## 1. Principio
El repo `knowledge-base` es la fuente de los artefactos de diseño (UXR, FLW, SCR, IB, DEC). Notion es la capa de gestión operativa: relaciones, estados, bloqueos, propuestas y seguimiento. Nada de lo que decide una persona lo decide el agente.

## 2. Base Preguntas (data source 9811a7d0-6388-829a-82b4-0735e973e46b)
Una fila por pregunta (clave: propiedad **ID**, p. ej. `UXR-010-Q5`, `ARQ-12`, `HU-07-02-Q6`). Título = `ID · pregunta completa` (≤130 caracteres).
- Origen: DUD-001, DUD-002, UXR, CPO-001, HU, Otro. Ruta en el repo, Enlace GitLab, Última carga, Producto.
- **Estado**: Abierta, Propuesta, Decidida, Descartada.
- **Bloquea**: No, Diseño, Desarrollo. **Nivel de bloqueo**: Flujo, Pantalla, Entrega, Documental. **Prioridad**: Alta, Media, Baja. **Responsable** (múltiple): PO, UX, Arquitectura, Seguridad, Desarrollo, Analista funcional, UX Writing.
- **Quién puede responder**: Diseño, Negocio, Arquitectura o Seguridad, Mixta.
- Respuesta, Decidido por, Fecha de decisión, Propuesta de diseño (texto), **Duplicada** (casilla), **Equivale a** (relación a Preguntas).
- Relaciones: Producto, Paquetes de alcance, Historias, Requerimientos UX, Flujos, Pantallas, Exploraciones, Reglas.
- Fórmulas: Bloqueo vigente, Bloqueante (ID), Bloqueante Flujo/Pantalla/Entrega (ID), Pendiente de confirmar (ID), Abierta sin bloqueo (ID), Situación.

## 3. Estados (significado)
- **Abierta**: sin respuesta registrada. **Propuesta**: hay respuesta o propuesta de una persona, pendiente de quien debe confirmar. **Decidida**: cerrada por una decisión vigente del repo (DH/ARQ) o por una persona autorizada. **Descartada**: reemplazada por otra pregunta.
- El agente transcribe estados que declara la fuente; nunca marca Decidida por su cuenta. Las respuestas tomadas de DEC-001…005 entran como Propuesta («pendiente del PO»).
- El repo usa el término «cerrada»; en Notion se mantuvo «Decidida». Al volver al repo se usa el vocabulario del repo.

## 4. Regla de bloqueo (acordada con Enzo)
- Bloquea el diseño: Estado Abierta (o vacío) con Bloquea Diseño/Desarrollo y no Duplicada.
- **Propuesta no bloquea el diseño**: cuenta como «por confirmar» y frena el paso a Desarrollo.
- Criterio de DEC-004 §7: UXR-015-Q6, UXR-017-Q3, ARQ-10.1(-A/-B) y DOM-CLIENTE-01 → Bloquea No.
- Cascada: Flujos cuentan preguntas de nivel Flujo; Pantallas cuentan las suyas y heredan el bloqueo de su flujo; Exploraciones heredan de sus pantallas; Historias, UXR y paquetes cuentan todo. Cada una tiene «Preguntas que bloquean», «Pendientes de confirmar», «Abiertas sin bloqueo», listas de IDs, «Resumen de preguntas» y «Estado de bloqueo».
- Notion no permite un rollup de otro rollup: se usa una fórmula intermedia (p. ej. «Bloqueos propios» en Flujos).

## 5. Estructura de la página de una pregunta
1. Título: la pregunta completa (no se repite en el cuerpo).
2. Contexto de la necesidad. 3. Qué se evalúa. 4. Alternativas posibles (las propuestas por la IA van marcadas «(IA)»; cada una con su efecto en el diseño).
5. Propuesta o resolución: si la pregunta es de diseño, respuesta directa (IA), por qué, **cómo funcionaría** (pasos), diagrama Mermaid si es un flujo, evidencia con grado (D documentado, I inferido) y límites. Si la decide Negocio, Seguridad o Arquitectura: «Sin propuesta de diseño», con el efecto de cada alternativa.
6. Debajo: texto original del repo, datos de la fuente, respuestas registradas (historial por fecha, la vigente primero) y enlaces al repo.
- Las referencias BR/DH/ARQ/HU se enlazan al repo. **Diferido por decisión de Enzo (2026-10-18)**: añadir entre paréntesis un resumen corto de cada regla citada (sale del catálogo HUC-00 / RCP-001 en `prepare-body.js`); se aplicará a las preguntas nuevas, no se recarga lo ya cargado.
- Texto de IA: se rotula «(IA)», sin nombrar el modelo (pueden intervenir varios).

## 6. Duplicadas y equivalentes
Solo se marca Duplicada la pregunta que el repo convierte en un puntero («Ver X») o declara absorbida; la principal conserva la respuesta. La misma duda en otro login o pantalla NO es duplicada (conserva su vínculo al flujo). «Equivale a» enlaza al par.

## 7. Flujo de trabajo repo ↔ Notion
- Artefactos (UXR/FLW/SCR/IB/DEC): se crean en el repo (worktree `ux/<slug>`, skill ux-ui-orchestrator), luego se cargan a Notion.
- Preguntas: nacen en las tablas «Open questions» de los UXR; se cargan a Notion; ahí se gestionan (estado, propuestas, validaciones).
- Al terminar de organizar el modelo y cuando Enzo diga «sesión finalizada»: devolver al repo las decisiones tomadas (DEC nuevo + tablas «Open questions» actualizadas) con la estructura y el vocabulario del repo, por MR. Lo que es solo gestión de Notion (propuestas de IA, contexto, diagramas, resúmenes, duplicadas, niveles, fórmulas) NO vuelve al repo.
- Antes de cada carga: `git fetch origin develop` y comparar con las decisiones de RCP-001 (ARQ/DH) y las historias; el worktree puede estar atrasado (ya pasó con ARQ-08/11.5/12).

## 8. Scripts (carpeta `scripts/`, ver LEEME.md) y orden
`extraer-preguntas` → `lote-preguntas` → `preguntas-refs niveles|relaciones|estados` → `respuestas-dec` → `subir-respuestas` → `marcar-duplicadas` → `contexto-entradas` → `contexto-codex.sh` (redacción en lotes de 4) → `contexto-validar` → `contexto-lote` (carga). Fichas ya redactadas: `~/.claude/notion/preguntas-fichas/`.
- La subida a Notion la ejecuta opencode (instrucciones en `opencode-*.md`); la redacción en lotes la hace Codex en solo lectura; Claude diseña, valida y verifica.
- Para filas ya editadas usar solo `--solo-props` (con `ifEmpty`/`ifValues`) y `--solo-relaciones [--reemplazar]`; nunca el `upsert` completo.

## 9. Límites conocidos
- La API no renombra opciones de select ni oculta propiedades vacías ni crea vistas; el clasificador bloquea borrados (archivar bases lo hace Enzo).
- Las sesiones limpias de `claude -p` con el MCP `notion` a veces no conectan a tiempo: reintentar una vez.
- No usar `node -e` ni reemplazos con barras invertidas; editar con archivos.
- **Decisión de Enzo (2026-10-18): no se cargan las bases Reglas ni Referencias** (quedan vacías). Los enlaces a reglas y los referentes de evidencia viven como texto dentro de cada pregunta; relacionarlos obligaría a modificar todo lo ya hecho. Si se retoma, Referencias tendría más valor que Reglas (referentes reutilizables entre preguntas).
- El MCP no es más rápido para volcar contenido: el script con REST tarda ~6 s por página; un modelo con el MCP, 1–3 min.

## 10. Decisiones de diseño del skill (se van registrando con Enzo, 2026-10-18)
- El skill es personal, no se sube al repo, y el orquestador debe actuar desde el primer momento («tenemos este paquete de historias» → sabe por dónde empezar, con Notion en cuenta).
- **Orden de guardado por fase: primero Notion y luego el repo.** Notion es el espacio de refinamiento (leer, entender, mapear, evaluar si se puede construir y comprobar después que se construyó bien); el repo recibe el módulo ya refinado, con su estructura. (Sustituye la recomendación anterior de repo primero.)
- **Módulo = un flujo** (sus historias de experiencia, pantallas, exploraciones y preguntas). Se da por cerrado cuando está completo; luego puede desglosarse en tareas (aún sin definir).
- **Sincronización de un solo sentido (opción A):** en Notion solo se editan preguntas, estados, respuestas y comentarios; las páginas de documentos son espejo de lectura. Cualquier cambio de texto se pide al agente, que regenera el archivo local y lo vuelve a subir.
- Proceso de Enzo: paquete de alcance → historias de experiencia (UXR) → flujos → pantallas planificadas (con un skill que consulta el sistema de diseño) → dos caminos de construcción (baja fidelidad con un skill y un MCP, o construir con los componentes del sistema de diseño en estructura microUI) → handoff opcional (puede sobrar si ya entrega los flujos y las historias de experiencia).
- **Base «Especificaciones UX»** (data source 23c1a7d0-6388-8293-bac3-871f76aac85e, database b771a7d0-6388-83af-a729-010019c5bd73, icono nativo `checklist`): una fila por UXS (hoy UXS-001, cargada con `cargar-uxs.js`). Es el lugar del *conjunto* de lo que se va a desarrollar. Propiedades: Estado del documento, Aprobado por, Fecha de aprobación, Fecha de la especificación, Veredicto Stitch/Figma/Desarrollo/QA (READY, CONDITIONAL, NOT READY; los transcribe del propio UXS), **Nivel de cierre** (En curso, Diseño cerrado, Listo para desarrollo; lo fija una persona), relaciones bidireccionales a Paquetes de alcance, Historias, Requerimientos UX, Flujos, Pantallas, Exploraciones, Preguntas y Producto (propiedad espejo «Especificaciones UX»), y los mismos rollups y fórmulas de bloqueo que las demás bases. Su veredicto del UXS-001 (2026-10-14): Stitch, Figma y Desarrollo NOT READY; QA CONDITIONAL.
- **Posición en el proceso:** UXR → flujos → pantallas (SCR, especificación) → **UXS (conjunto y preparación por consumidor)** → exploración (IB, versión visual) → diseño gobernado/Figma → handoff opcional. El UXS se emite tras las especificaciones de pantalla y antes de explorar (su veredicto para Stitch/exploración es la puerta), y es un documento vivo que se actualiza en cada etapa posterior.
- Límites de la API: una relación admite como máximo 100 elementos por petición (para más, enlazar desde el lado de la pregunta, como `uxs-preguntas.js`), y al leer una página Notion recorta cada relación a 25 elementos (usar `/pages/{id}/properties/{pid}` paginado; ya corregido en `--solo-relaciones`).
- **Alcance del skill (Enzo, 2026-10-18):** solo el orquestador de UX/UI (`ux-ui-orchestrator`), que genera la información y sabe cómo, dónde y con qué estructura subirla a Notion para dejarla lista. Quedan fuera el skill de documentación, el orquestador de desarrollo y el skill `centro-operativo-uxui` (otro ambiente de Notion; no le corresponde al flujo UX/UI). El orquestador existe también en el repo (`.claude/skills/ux-ui-orchestrator`, compartido con el equipo): la capacidad de Notion va **solo en la copia local** (`~/.claude/skills/ux-ui-orchestrator/notion/`), nunca en la del repo.
- **Activación (opción A):** el módulo Notion se activa solo cuando existe la carpeta `notion/` en la copia local; si Enzo dice «sin Notion» en una sesión, se omite. El módulo contiene LEEME, arquitectura de preguntas, esquema de bases, reglas de carga, `config.json` (IDs, sin token) y los scripts. La subida sigue delegada a opencode.
- Skills que llama el orquestador: ux-requirements-analyzer (UXR), user-flow-designer (FLW), ui-spec-writer (+ web-atomic-component-designer) (SCR/CMP/TKN), stitch-ui-generator y/o claude-design-orchestrator (exploración IB), accessibility-reviewer (ARP), figma-design-validator (diseño gobernado), ux-development-handoff (HOF); el propio orquestador consolida el UXS. Los lienzos de Claude Design están en el campo «Enlace del lienzo» de Exploraciones (uno por flujo).
- **Cambios en las historias (Enzo, 2026-10-18):** las historias se actualizan constantemente. Antes de cada carga y de cada fase el skill compara el contenido de `origin/develop` con la huella guardada de la última carga (archivo auxiliar fuera del repo, como los resúmenes). La propiedad **Vigencia** de Preguntas (Vigente, Revisar por cambio de fuente; ya creada, las 123 actuales en «Vigente») la rellena el skill; el *Estado* nunca se toca automáticamente: la persona decide si la pregunta sigue aplicando. Filtrar la vista por «Revisar por cambio de fuente» para repasarlas.
- **Si Notion u opencode no están disponibles (Enzo, 2026-10-18, opción A):** el orquestador sigue generando en el repo y guarda una **lista de subidas pendientes** (archivo `notion/pendientes.json` del módulo local). Al empezar la siguiente sesión avisa de lo que falta y lo sube en orden, o cuando Enzo lo pida. Excepción: no avanza al paso siguiente si ese paso depende de que las preguntas del anterior ya estén en Notion.
- **Fases del módulo que se usan (Enzo, 2026-10-18):** inicio (paquete e historias), historias de experiencia (UXR), flujos, pantallas, UXS, exploración y cierre de módulo. **Se omiten** el diseño gobernado en Figma (`figma-design-validator`) y el handoff (`ux-development-handoff`): Enzo entrega a desarrollo el paquete completo (historias de experiencia, flujos, pantallas y UXS). Por eso se quitaron de «Especificaciones UX» los veredictos de Figma y Desarrollo (quedan Stitch y QA); «Listo para desarrollo» sale de «Nivel de cierre».
- **Accesibilidad opcional:** `accessibility-reviewer` es una revisión (informe ARP por pantalla, WCAG 2.2 AA; no construye ni corrige), no una fase obligatoria y no se exige para cerrar un módulo. Si se desarrolla directamente en código se pueden ejecutar pruebas de accesibilidad y generar un documento de accesibilidad.
- **Resúmenes «En 30 segundos»:** se redactan para todos los documentos (UXR, flujos, pantallas, exploraciones…) de las historias NUEVAS, solo en Notion; no se aplican retroactivamente a lo ya cargado (los flujos, pantallas y exploraciones actuales no los tienen).
- Las preguntas bloquean el diseño o solo la arquitectura/procesos internos (que la UI no muestra); estas últimas no deben frenar el diseño.
- **Cierre de módulo en dos niveles (Enzo, 2026-10-18).** *Diseño cerrado* = (1) sin preguntas que bloqueen el diseño en el flujo ni sus pantallas, (3) documentos del módulo en Estado del documento «Aprobado» por una persona y (4) exploración de alta fidelidad con «Decisión humana» resuelta; con esto se puede construir y llevar el módulo al repo. *Listo para desarrollo* = lo anterior más (2) preguntas «Propuesta» del módulo confirmadas y (5) lo construido verificado contra lo diseñado. El agente comprueba los indicadores pero nunca aprueba ni confirma por una persona.
