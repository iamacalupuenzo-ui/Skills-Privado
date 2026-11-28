# Ciclo de retroalimentación — revisión y cambios del 18-nov-2026

[verificado] Fuente: Skills-Privado; base origin/main y HEAD inicial 6f6e6ab73b59758a75321e486bc3d9f0985f55ce. Se ejecutó git fetch origin main y se usó el worktree limpio asignado por Orca, renombrando su rama a feature/ciclo-de-retroalimentacion. No se creó otro checkout.

## Dónde estaba definido

[verificado] Había reglas parciales en em-orquestador-ux: devolución de decisiones al repo al decir «sesión finalizada», sincronización de preguntas y cotejo de vigencia. El antecedente histórico es el commit 9b4990d (módulo Notion opcional); 6f6e6ab incorporó el módulo personal al catálogo. La búsqueda de contenido en el historial accesible no encontró un protocolo completo y obligatorio de inicio/cierre con revisión independiente, KB, Preguntas, Tareas y capturas.

Referencias **anteriores al cambio**, numeradas contra origin/main:

- `skills/em-orquestador-ux/SKILL.md:168`: 2. Lee el paquete y sus historias de `origin/develop`, compáralos con la huella de la última carga y marca *Vigencia = Revisar por cambio de fuente* en las preguntas afectadas. Nunca cambies su *Estado*.
- `skills/em-orquestador-ux/SKILL.md:186`: **Cierre de módulo.** *Diseño cerrado*: sin preguntas que bloqueen el diseño, documentos del módulo aprobados por una persona y exploración con decisión humana resuelta. *Listo para desarrollo*: lo anterior más las preguntas «Propuesta» confirmadas y lo construido verificado contra lo diseñado. El agente comprueba los indicadores; no aprueba ni confirma por nadie. Cuando el usuario diga «sesión finalizada», devuelve las decisiones al repo (registro nuevo y tablas «Open questions» actualizadas) por MR, sin llevar al repo el contexto, las propuestas de IA, los resúmenes ni los indicadores de Notion.
- `skills/em-orquestador-ux/notion/arquitectura-preguntas.md:44`: - Al terminar de organizar el modelo y cuando Enzo diga «sesión finalizada»: devolver al repo las decisiones tomadas (DEC nuevo + tablas «Open questions» actualizadas) con la estructura y el vocabulario del repo, por MR. Lo que es solo gestión de Notion (propuestas de IA, contexto, diagramas, resúmenes, duplicadas, niveles, fórmulas) NO vuelve al repo.
- `skills/em-orquestador-ux/notion/arquitectura-preguntas.md:71`: - **Cambios en las historias (Enzo, 2026-10-18):** las historias se actualizan constantemente. Antes de cada carga y de cada fase el skill compara el contenido de `origin/develop` con la huella guardada de la última carga (archivo auxiliar fuera del repo, como los resúmenes). La propiedad **Vigencia** de Preguntas (Vigente, Revisar por cambio de fuente; ya creada, las 123 actuales en «Vigente») la rellena el skill; el *Estado* nunca se toca automáticamente: la persona decide si la pregunta sigue aplicando. Filtrar la vista por «Revisar por cambio de fuente» para repasarlas.
- `skills/ux-a-desarrollo/references/registro-de-decisiones.md:19`: ## Impacto en la base de conocimiento
- `skills/ux-a-desarrollo/references/registro-de-decisiones.md:21`: Cada decisión que puede obligar a cambiar una historia, UXR o flujo se anota en la tabla inicial del registro («decisiones que pueden obligar a actualizar la base de conocimiento»), para cruzarla cuando el PO valide.
- `skills/angular-product-builder/SKILL.md:193`: "Solicitud de ajuste de producto" a `epica-a-plan-desarrollo`.
- `skills/epica-a-plan-desarrollo/SKILL.md:85`: | `AJUSTAR` | Durante el desarrollo cambia un flujo: llega una "Solicitud de ajuste de producto" del builder o el usuario pide cambiar cómo funciona algo ya especificado | Leer `references/protocolo-ajustar.md` completo y seguirlo |
- `skills/epica-a-plan-desarrollo/SKILL.md:124`: - **B12 — Un solo dueño de la especificación**: épicas, historias y casos de uso solo
- `skills/gestion-proyectos/SKILL.md:91`: ### Cierre de una tarea: pedir el resultado
- `skills/gestion-proyectos/SKILL.md:96`: 2. Confirmar la fecha real de cierre (por defecto, hoy) y, si se usan, las horas reales.

[inferido] El cumplimiento se podía omitir porque dependía del módulo Notion, de una frase de cierre y de derivaciones parciales; no existía una compuerta común para todos los puntos de entrada. No se atribuye esta inferencia a Enzo como una decisión nueva.

## Dueño y cobertura

[verificado] Se eligió em-orquestador-ux porque ya coordina los productores de UXR, FLW, SCR y UXS, cierra costuras, preserva contradicciones y gestiona Preguntas. Orquestador-desarrollo conserva la entrega de software; gestion-proyectos conserva Tareas y epica-a-plan-desarrollo la especificación de producto. El detalle vive solo en [el protocolo canónico](../skills/em-orquestador-ux/references/ciclo-retroalimentacion.md); cada consumidor lleva únicamente la invocación bloqueante y su racionalización, con ajustes puntuales donde una regla anterior lo contradecía.

V = agente independiente de verificación previa, solo lectura; C = quien construye o produce el artefacto; O = orquestador. «Ambos» significa inicio y cierre en cada trabajo, también análisis/definiciones y llamadas directas; no se duplica un ciclo vigente ni se invoca recursivamente al trabajar dentro de él.

| Skill | Archivos tocados (relativos a su carpeta) | Qué se agregó | Cuándo | Quién | Versión nueva |
|---|---|---|---|---|---|
| orquestador-desarrollo | `SKILL.md`, `evals/evals.json` | B9 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.3.0 |
| flujo-producto | `SKILL.md`, `evals/evals.json` | B10 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.1.0 |
| flujo-ds | `SKILL.md`, `evals/evals.json` | B9 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.1.0 |
| ux-a-desarrollo | `SKILL.md`, `references/registro-de-decisiones.md` | B7 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.1.0 |
| verificar-calidad | `SKILL.md` | B8 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.2.0 |
| angular-product-builder | `SKILL.md` | B20 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 2.10.0 |
| ux-development-handoff | `SKILL.md` | B1 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.0.0 |
| paridad-diseno-desarrollo | `SKILL.md` | B43 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.2.0 |
| documentacion-handoff | `SKILL.md` | B22 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 3.2.0 |
| gestion-proyectos | `SKILL.md`, `references/bitacora-seguimiento.md`, `references/dependencias-bloqueos.md`, `references/modelo-notion.md` | B19 + racionalización y ajuste de rutinas incompatibles | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.10.0 |
| gestor-notion | `SKILL.md` | B16 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.3.0 |
| traspaso-entre-computadoras | `SKILL.md` | B8 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.1.0 |
| flujo-tareas-gitlab | `SKILL.md` | B10 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 0.3.0 |
| product-orchestrator | `SKILL.md` | B10 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 2.1.0 |
| comsatel-design-system | `SKILL.md` | B20 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 2.11.0 |
| epica-a-plan-desarrollo | `SKILL.md` | B13 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.8.0 |
| em-orquestador-ux | `SKILL.md`, `notion/LEEME.md`, `notion/arquitectura-preguntas.md`, `notion/reglas-de-carga.md`, `references/ciclo-retroalimentacion.md` | Protocolo único, B1/B2 y coherencia del módulo Notion | Ambos | O coordina; V inicio; C evidencia de cierre | 1.0.0 |
| ux-requirements-analyzer | `SKILL.md` | B1 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.0.0 |
| user-flow-designer | `SKILL.md` | B1 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.0.0 |
| ui-spec-writer | `SKILL.md` | B1 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.0.0 |
| web-atomic-component-designer | `SKILL.md` | B1 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 0.3.0 |
| ux-context-builder | `SKILL.md`, `evals/evals.json` | B8 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.1.0 |
| stitch-ui-generator | `SKILL.md` | B1 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.0.0 |
| claude-design-orchestrator | `SKILL.md` | B1 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.0.0 |
| figma-design-validator | `SKILL.md` | B1 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.0.0 |
| accessibility-reviewer | `SKILL.md` | B1 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 1.0.0 |
| design-qa | `SKILL.md` | B22 + racionalización | Ambos | V inicio; C entrega evidencia; O sincroniza | 3.1.0 |


[verificado] Las versiones existentes suben el componente menor por la nueva conducta obligatoria. Donde no había metadata.version se establece 1.0.0 por primera vez, sin deducir una versión desde generated.by; design-qa conserva coherente también su campo version histórico.

Otros archivos: README.md, skills-manifest.json (registro de dueño/consumidores, sin instalar dependencias), scripts/validate-skills.mjs (falla ante dueño/ruta/consumidor inválido), copias de plugins regeneradas con construir-plugin.mjs. Plugins: comsatel-desarrollo 1.1.0 y comsatel-ux 1.2.0. No existe un changelog global vigente; este informe registra el cambio y su evidencia.

## Revisados y no modificados

- centro-operativo-uxui: ausente en la fuente central; se leyó la instalación de Claude y sus referencias de estados. Opera otro ambiente (Historias, Trabajos, Revisiones, Conformidades), sin el estado Finalizada - falta merge de Tareas. No se editó ni importó la instalación.
- notion-workspace: ausente como nombre vigente en el catálogo; se leyó la instalación y el historial. La responsabilidad vigente de workspace se cubre en gestor-notion, que sí se actualiza; no se crean copias alternativas.
- comsatel-product-orchestrator: nombre histórico renombrado a product-orchestrator por 3d5ebef; se cambia el dueño vigente.
- project-context y ruta: no existen en la fuente central; se consultaron las instalaciones disponibles para su alcance de contexto/ruteo. No se editó una instalación ni se añadió al catálogo sin migración autorizada.
- skill-builder: estándar aplicado en UPDATE; no es ejecutor de producto/diseño y su ciclo de catálogo es distinto.
- investigador-de-producto: investigación de herramientas/métodos y adopción; no ejecuta la pista de artefactos UX de CL2. Si su resultado se convierte en definición de producto, entra por product-orchestrator/epica-a-plan-desarrollo, cubiertos.
- orquestacion-multi-harness: administra delegación/runtime; los ejecutores despachados conservan las compuertas. No es dueño de los artefactos.
- angular-developer, angular-new-app y anatomy: dependencias de terceros; se verificó su condición en el catálogo y no se modificaron sus contenidos vendorizados.
- design-handoff: coincidencia de búsqueda en una carpeta fuera del manifiesto; no se distribuye ni sustituye al dueño vigente documentacion-handoff.
- correo-diario: excluido de la búsqueda y de cualquier edición por instrucción explícita.

## Estados comprobados en vivo

[verificado] Se consultó mediante el conector Notion, solo lectura, collection://87a1a7d0-6388-82a0-82c0-8709ea959111 (Tareas). Estado contiene Bandeja, Por hacer, En curso, Finalizada - falta merge y Completada. Resultado contiene Pendiente/Listo. Los mapas de gestion-proyectos/gestor-notion y el esquema histórico del módulo UX estaban incompletos respecto a ese estado intermedio: el protocolo exige releer el esquema vivo, no inventar opciones. No se modificó Notion.

## Validación real y límites

~~~text
Antes: npm test — exit 0
33 skills revisados: 0 errores, 18 avisos
Después: npm test — exit 0
33 skills revisados: 0 errores, 18 avisos
Caso negativo: ruta canónica alterada temporalmente — exit 1
33 skills revisados: 1 errores, 18 avisos
ERROR  manifest: falta el dueño/ruta canónicos del ciclo de retroalimentación
~~~

[verificado] Se restauró el manifiesto antes de la prueba final. No hubo fallos preexistentes; los 18 avisos ya estaban en la línea base (enlaces entre skills y design-handoff fuera del manifiesto). git diff --check no detectó errores de espacios. Las copias de plugins se regeneraron y npm test comprobó su igualdad con las fuentes.

[verificado] Se añadieron seis casos de conducta (inicio sin agente y cierre con Notion/artefactos pendientes en los tres evals de desarrollo). npm test valida su estructura y referencias; **no ejecuta un modelo** sobre esos prompts.

Criterios afectados de skill-builder: C2/C3 alcance y entradas (GUARD del protocolo); C4/C7 capacidades y destinos (GUARD, A y B); C10/C20 autorización y distribución (B1/B2 de la KB y permisos de publicación separados); C11/C18 salida (plantillas de informe y sincronización); C12/C14 recursos (enlace canónico y registro validado); C13 conservación (cambios puntuales y precedencia explícita en antecedentes); C15-C17 bloqueantes (B1/B2 del dueño y B# por consumidor); C19 portabilidad (destinos descubiertos y schema vivo); C21/C22 casos positivos/negativos escritos, ejecución conductual pendiente; C23 pruebas locales descritas; C24 extracción a script evaluada en el protocolo, validación determinista del catálogo incorporada. El resto del formato de los skills se conserva; no se afirma que una actualización puntual corrija toda su calidad histórica.

[no comprobado] La ejecución futura de las compuertas por modelos/agentes, la carga efectiva de imágenes y la sincronización real KB/Notion no se ensayaron: este encargo modifica skills, no datos de CL2. El validador impide perder el contrato del catálogo; no certifica acciones externas ni reemplaza el informe por ejecución. No se probó instalación ni siquiera en dry-run, por la prohibición explícita de skils install; no se tocó ~/.claude/skills ni ~/.codex/skills. No hubo push, merge ni PR. Preguntas para Enzo: ninguna necesaria para este cambio.

## Búsqueda inicial completa (archivo y línea)

Salida reconstruida desde el commit anterior a la mejora, 6f6e6ab, mediante git grep de los términos originales; correo-diario excluido. Codificación UTF-8 corregida sin bytes NUL.

~~~text
6f6e6ab:skills/angular-product-builder/references/angular-moderno.md:52:  sincronizadas, es un error (ciclos y `ExpressionChangedAfterItHasBeenChecked`).
6f6e6ab:skills/angular-product-builder/references/angular-moderno.md:105:  efectos), esta sección se corrige en el mismo cambio que la sincronización.
6f6e6ab:skills/angular-product-builder/references/arquitectura-proyecto.md:194:6. **Estado sincronizado entre pestañas o vistas.** Si un componente reutilizado
6f6e6ab:skills/comsatel-design-system/SKILL.md:48:se desincroniza el día que el token cambie. Ese tipo de diferencia no se ve
6f6e6ab:skills/comsatel-design-system/SKILL.md:645:| "C-Locater ya tiene tokens de Comsatel-DS copiados, puedo tomarlos de ahí directo" | Esa copia (`comsatel-tokens.css`) es local y se desincroniza el día que el token real cambie — ir siempre a `tokens.css`/`typography.mjs` de `Sistema-de-dise-o-Comsatel` (B12). |
6f6e6ab:skills/comsatel-design-system/references/audit-checklist.md:207:generado y resolverlo en un getter (o sincronizarlo en `ngOnChanges`), nunca en
6f6e6ab:skills/comsatel-design-system/references/clocater-extraction.md:13:Es una copia local que se desincroniza el día que el token real cambie en
6f6e6ab:skills/comsatel-design-system/references/clocater-extraction.md:35:- `src/App.tsx` — sincronización de tema global (`isDark` prop-driven, sin
6f6e6ab:skills/comsatel-design-system/references/component-inventory.md:309:  sincronización automática entre `tokens.css` y ningún archivo de diseño
6f6e6ab:skills/comsatel-design-system/references/component-inventory.md:423:archivo al empezar una sesión ahí, no asumir que están sincronizadas.
6f6e6ab:skills/comsatel-design-system/references/component-inventory.md:1154:  con `role="region"` y `aria-hidden` sincronizado, foco visible por tokens,
6f6e6ab:skills/comsatel-design-system/references/component-inventory.md:1610:| Tabs | C1-C3/C13: variantes line/pill, geometría y tipografía con line-height; C4: estado activo con signals; C8: compound component `Tabs` + `Tab`; C9-C10: paneles sincronizados y IDs únicos por instancia; C11-C12: selección, disabled y foco conservan semántica. `role=tablist`, tabs y paneles enlazados con `aria-controls`/`aria-labelledby`, roving tabindex y navegación Arrow/Home/End. | Build de librería y app, reinicio del servidor, ruta `/components/tab`, árbol ARIA, click y navegación real con ArrowRight (Overview → Specs), foco restaurado en el tab activo, paneles asociados y consola sin errores; build de Storybook con Default/Pill/Disabled. | Cerrado — 2026-09-10 |
6f6e6ab:skills/comsatel-design-system/references/component-inventory.md:1620:| Radio + RadioGroup | C1: gap de 10px y separación label/description de 1px documentados como huecos ópticos; C2-C3/C13: label y descripción escalan por tamaño con line-height correspondiente; C4: `id`/`name` se resuelven después de aplicar inputs y el grupo sincroniza estado con `signal()`; C7: íconos de documentación usan el registro curado; C8/C11: anillo y punto consumen glyph compartido con Dropdown y mantienen paridad de centrado; C9: input radio nativo, label visible o `aria-label`, flechas/Espacio y estados disabled; C12: estados required/invalid/error conservan semántica además del color. Grupo con `role="radiogroup"`, `aria-labelledby`, `aria-describedby`, `aria-errormessage`, `aria-required` y `aria-invalid`; documentación de accesibilidad, lineamientos en dos columnas y API de ambos componentes. | Build de librería y app, build de Storybook, reinicio del servidor, ruta local `/components/radio`, árbol de accesibilidad, clic + flecha abajo (Rojo → Azul), radios disabled, error enlazado y revisión visual de centrado en sm/md/lg. | Cerrado — 2026-09-10 |
6f6e6ab:skills/comsatel-design-system/references/component-inventory.md:1626:| Modal | C1: overlay, superficie, sombra, bordes y foco atados a tokens; C2-C3/C13: título `content/highlight` (18/27px), cuerpo `content/ui` (13/19.5px) y acciones `Button sm` conservan jerarquía; C4: portal, signals y transición; C9-C10: panel con scroll de body/viewport sin recorte; C12: apariencia warning/danger sincroniza título y acción principal. Motor con `role="dialog"`, `aria-modal`, `aria-labelledby`, foco inicial configurable, trampa de foco, Escape, cierre por overlay, restauración de foco y scroll lock; `closeLabel` configurable; accesibilidad y lineamientos en pares de dos columnas con modales reales, estados anunciables y registro de íconos compartido. | Build de librería y app, build de Storybook con historias Default/Warning/Danger/WithoutCloseButton/LongContent, ruta local `/components/modal`, árbol ARIA, apertura real, foco visible, Escape, cierre y restauración, acciones de footer, overlay y revisión visual tipográfica. | Cerrado — 2026-09-10 |
6f6e6ab:skills/comsatel-design-system/references/component-inventory.md:1672:| Cerrado | Menu | Reconstrucción y verificación individual completadas; se sincronizó la matriz. | Ninguno; reabrir solo ante cambio. |
6f6e6ab:skills/comsatel-design-system/references/environment-issues.md:160:estado, screenshot tras scroll) pueden quedar desincronizadas.
6f6e6ab:skills/design-handoff/SKILL.md:317:del mismo dato** — se desincronizan igual que cualquier valor duplicado.
6f6e6ab:skills/design-handoff/references/annotation.md:369:> que para entonces ya suele estar sincronizado.
6f6e6ab:skills/design-handoff/references/doc-page.md:394:desincroniza al primer cambio.
6f6e6ab:skills/epica-a-plan-desarrollo/references/trazabilidad-notion.md:23:una segunda relación se desincroniza.
6f6e6ab:skills/gestion-proyectos/SKILL.md:34:cambia, `skill-builder` sincroniza su registro; este skill no inventa relaciones ni campos
6f6e6ab:skills/gestion-proyectos/SKILL.md:121:3. No sincronizar, crear, reasignar, actualizar estados ni comentar en ClickUp por iniciativa
6f6e6ab:skills/gestion-proyectos/SKILL.md:130:5. Cuando el usuario autorice una sincronización, finalizar primero el registro y las
6f6e6ab:skills/gestion-proyectos/SKILL.md:282:  instrucción explícita y el mapeo de sincronización aprobado.
6f6e6ab:skills/gestion-proyectos/references/modelo-notion.md:162:sincronización y fuente que prevalece por cada dato. No propagar automáticamente avances,
6f6e6ab:skills/gestor-notion/SKILL.md:69:- `../../docs/sistema-skills-notion.md` — catálogo canónico de Skills: schema, capacidades y reglas de sincronización.
6f6e6ab:skills/gestor-notion/SKILL.md:134:- Skill → Flujo 1 (clasificación y sincronización)
6f6e6ab:skills/gestor-notion/SKILL.md:320:- `../../docs/sistema-skills-notion.md` — catálogo canónico de Skills, capacidades, estados y sincronización
6f6e6ab:skills/gestor-notion/references/registration-flows.md:8:## Flujo 1 — Registrar o sincronizar un Skill
6f6e6ab:skills/gestor-notion/references/registration-flows.md:107:Skill sincronizado — [nombre]
6f6e6ab:skills/gestor-notion/references/workspace-map.md:249:sincronizarlas contra el disco ni darlas de baja por no encontrarlas ahí.
6f6e6ab:skills/investigador-de-producto/SKILL.md:248:- **B13 — Capacidades verificadas antes de actuar**: no asumir conectores de Notion, búsqueda web ni permisos por el frontmatter. Confirmar la capacidad disponible antes de usarla; si falta, conservar el caso local y declarar la sincronización como pendiente.
6f6e6ab:skills/orquestacion-multi-harness/SKILL.md:77:- **B4 — Nunca despachar un worker con worktree en carpeta de documentos sincronizada**:
6f6e6ab:skills/orquestacion-multi-harness/SKILL.md:94:| "Ya reparti HU/CU/Plan una vez, puedo repetirlo" | Esa vez desincronizó exactamente lo que `epica-a-plan-desarrollo` existe para evitar — no es un patrón a repetir (B1). |
6f6e6ab:skills/orquestacion-multi-harness/SKILL.md:97:| "Total, es solo una carpeta de documentos" | Un worker de Orca ejecutando ahí puede disparar la sincronización de Drive de miles de archivos (B4). |
6f6e6ab:skills/orquestacion-multi-harness/references/artifact-locations.md:10:`D:\Investigacion - V4` se sincroniza a Google Drive (`.tmp.driveupload/` es la prueba).
6f6e6ab:skills/paridad-diseno-desarrollo/references/engine.md:275:`~/.claude/skills` está sincronizado entre dos laptops. El servidor de Figma se llama
6f6e6ab:skills/paridad-diseno-desarrollo/references/verdicts.md:142:secciones divide la responsabilidad en cero y las dos copias se desincronizan al primer cambio.
6f6e6ab:skills/skill-builder/SKILL.md:24:sincronizas el catálogo de Skills cuando la creación o actualización material queda cerrada.
6f6e6ab:skills/skill-builder/SKILL.md:64:4. Sincronizar el índice de Notion cuando el alcance autorice el registro.
6f6e6ab:skills/skill-builder/SKILL.md:116:  buscar la fila existente en la base Skills de Herramientas de IA y crearla o sincronizarla en la misma fila.
6f6e6ab:skills/skill-builder/SKILL.md:121:  con el registro señalado como pendiente de sincronización, no como realizado.
6f6e6ab:skills/skill-builder/SKILL.md:124:  sincronizar el índice `## Recursos operativos` en su página de Notion. No crear una relación
6f6e6ab:skills/skill-builder/references/catalog-flow.md:39:6. Sincronizar la fila correspondiente de la base **Skills** de Notion con estado,
6f6e6ab:skills/em-orquestador-ux/notion/arquitectura-preguntas.md:63:- **Sincronización de un solo sentido (opción A):** en Notion solo se editan preguntas, estados, respuestas y comentarios; las páginas de documentos son espejo de lectura. Cualquier cambio de texto se pide al agente, que regenera el archivo local y lo vuelve a subir.
~~~
