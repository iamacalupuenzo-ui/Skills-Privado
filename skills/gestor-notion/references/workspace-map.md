# Notion Workspace — Mapa de ambientes y bases de datos

6 ambientes principales. Cada uno es un hub page que contiene una o más BDs.
Este archivo es una instantánea para routing; el schema vivo es la fuente de verdad.

> Para el registro de skills nuevos, el destino canónico es la base Skills de **Herramientas de IA**,
> documentado en `../../../docs/sistema-skills-notion.md`. `Skills & Marcos` de Process OS
> se conserva como base histórica y no recibe nuevos registros.

> Para proyectos y tareas (de Comsatel y personales, separados por `Ámbito`), el destino
> vigente es **Minimalist Project Manager**. **Gestión de producto** guarda solo Épicas →
> Historias de usuario → Casos de uso, relacionados con Project y Tasks Manager (desde
> 2026-09-24). Consultar el schema vivo y la sección correspondiente de
> `../../gestion-proyectos/references/modelo-notion.md` antes de modificarlos.

---

## Ambiente 1 — Proyectos

**Hub:** https://app.notion.com/p/38ca01dc169a80dbae6adeef81d8e7d7
**Propósito:** Gestión de proyectos activos (propios y de cliente)

### Espacio operativo — Proyectos Enzo

**Hub:** https://app.notion.com/p/3c1a01dc169a80f78116e8bba817abd2

Este espacio es la fuente de verdad para el seguimiento operativo de encargos, con proyectos y tareas vinculadas. No confundirlo con una base compartida externa.

| BD | Collection ID | Uso |
|----|---------------|-----|
| Projects | `collection://36aa01dc-169a-8248-82a1-07b97c2d2dd7` | Proyecto, estado, fechas y relaciones |
| Tareas | `collection://3bda01dc-169a-8345-a9a0-8727a8f95122` | Actividades operativas vinculadas al proyecto |

**Tareas — campos de gestión:** `Nombre`, `Fase de lanzamiento`, `Estado`, `Avance (%)`, `Progreso`, `Prioridad`, `Responsable`, `Fecha compromiso`, `Proyecto`, `Descripción`, `Criterio de cierre`, `Tarea padre`, `Subtareas` y `Referencias`.

**Reglas operativas:**
- Para seguimiento pre/post lanzamiento, conservar la fase en el título o descripción hasta que exista un campo específico aprobado; no inventar un select nuevo.
- Una estrella o una indicación explícita de criticidad equivale a `Prioridad = Alta`; las demás actividades se registran con la prioridad que el usuario confirme o como `Media` si se autoriza ese default.
- `Responsable` es texto en este espacio operativo. Conservar el nombre exactamente como lo entregue el usuario, incluidos responsables compartidos; no intentar convertirlo en una mención de Notion.
- Las anotaciones, cantidades, dependencias y criterios incluidos con la actividad van en `Descripción`; los resultados concretos van en `Output` y `Definición de terminado` solo si se proporcionan.
- `Avance (%)` recibe un número entero de 0 a 100. `Progreso` se calcula solo como barra textual; nunca escribir ni actualizar esa fórmula en una tarea. Rangos: 0-24 rojo, 25-49 naranja, 50-74 amarillo, 75-99 azul y 100 verde.
- No crear subtareas simuladas. Usar la relación `Épica` o `User Story` solo si el usuario pide descomponer una actividad y confirma el contenedor correspondiente.

### BD principal: Projects

**Collection ID:** `collection://c18a01dc-169a-82c8-90d0-07edc4821769`
**Título (campo):** `Nombre`

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Nombre` | title | Nombre del proyecto |
| `Tipo` | select | `"Producto propio"` · `"Cliente"` |
| `Estado` | select | `"Discovery"` · `"Definition"` · `"Design"` · `"Development"` · `"QA"` · `"Released"` · `"Archivado"` |
| `Prioridad` | select | `"Alta"` · `"Media"` · `"Baja"` |
| `Cliente / Owner` | text | Nombre de la empresa o persona responsable |
| `Problem Statement` | text | El problema real que resuelve, 2-3 líneas |
| `Fase actual` | text | En qué se está trabajando ahora mismo |
| `Métricas de éxito` | text | Cómo sabremos que el proyecto funcionó |
| `Non-goals` | text | Qué NO entra (evitar scope creep) |
| `Stack` | multi_select | `"Next.js"` · `"React"` · `"Node.js"` · `"Supabase"` · `"PostgreSQL"` · `"TypeScript"` · `"Tailwind"` · `"React Native"` · `"Prisma"` · `"AWS"` · `"Vercel"` |
| `Figma` | url | URL del archivo de diseño |
| `Repositorio` | url | URL del repositorio |
| `Fecha inicio` | date | ISO-8601 |
| `Fecha entrega` | date | ISO-8601 |
| `Notas` | relation → `collection://77fa01dc-169a-83b9-8412-87ab2b9282ad` | |
| `Tareas` | relation → `collection://33ca01dc-169a-8342-a7c8-077193d91790` | |
| `Épicas` | relation → `collection://e3181a0a-58f9-4967-8cb2-f17cbed24b2b` | |
| `Recursos` | relation → `collection://f42a01dc-169a-82a4-b9fc-8776cb1dc6e4` | |

**Relaciones de Projects con otros ambientes (creadas 2026-07-26):**

| Campo en Projects | Tipo | Hacia | Campo inverso |
|-------------------|------|-------|--------------|
| `Procesos` | relation | Procesos & SOPs (`86266c47`) | `Proyectos` en Procesos & SOPs |
| `Sub-procesos` | relation | Sub-procesos & Pasos (`786b6518`) | `Proyectos` en Sub-procesos |
| `Skills & Marcos` | relation | Skills & Marcos (`0f912612`) | `Proyectos` en Skills & Marcos |

---

## Ambiente 2 — Process OS

**Hub:** https://app.notion.com/p/3a4a01dc169a8027b9b5d5e0bd0eb7e0
**Propósito:** Sistema operativo de trabajo — procesos, skills y marcos documentados

> ⚠️ **Reestructurado el 2026-08-02.** Flujo y Proceso son dos ejes distintos, no una
> jerarquía. **Antes de tocar estas BDs, lee `process-modeling.md`** — explica el modelo,
> cómo diagnosticar, qué duplicación es intencional y los límites de la API.
>
> ```
> Flujo  →  Paso        (jerarquía real: el flujo es el padre de los pasos)
> Proceso                (clasificador transversal: "¿de qué tipo de trabajo es?")
> ```

### BD 2a: Procesos & SOPs

**Collection ID:** `collection://86266c47-dec5-47c4-81b1-2ed3467090ac`
**Título (campo):** `Proceso`
**Rol:** clasificador transversal. **Ya no es el padre de los pasos.**

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Proceso` | title | Nombre del proceso |
| `Descripción` | text | Qué hace este proceso |
| `Fase` | select | `"Discovery"` · `"Sprint de Diseño"` · `"Handoff Dev"` · `"Gestión de Cliente"` · `"Transversal"` |
| `Status` | select | `"Activo"` · `"En revisión"` · `"Borrador"` |
| `Flujos` | relation → Flujos | Rutas que atraviesan este proceso |
| `Skills & Marcos` | relation → Skills & Marcos | Skills que usa este proceso |
| `Sub-procesos` | relation → Sub-procesos & Pasos | Pasos clasificados como este proceso |
| `Herramientas` | relation → Recursos y Herramientas | Herramientas del proceso |

> El select `Flujo` fue eliminado el 2026-08-02 — el dato vive ahora en la relación `Flujos`.

**Los 9 procesos:** Discovery & Research - FDPY · Sprint de Diseño - FDPY · Handoff Dev - FDPY ·
Sprint de Diseño - FDR · Handoff Dev - FDR · Sprint de Desarrollo - FDER ·
Análisis y Definición - FED · Gestión de Cliente · Sistema de Diseño

### BD 2c: Flujos

**Collection ID:** `collection://bbe77287-00eb-438f-bceb-24d4d791a4ee`
**Título (campo):** `Flujo`
**Rol:** la ruta que se recorre según el tipo de encargo. **Padre real de los pasos.**

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Flujo` | title | Nombre de la ruta |
| `Abreviatura` | text | `FDPY` · `FDR` · `FDER` · `FED` · `GP` · `TR` |
| `Descripción` | text | Qué cubre la ruta |
| `Cuándo usarlo` | text | **Campo clave** — el criterio para elegir esta ruta y no otra |
| `Status` | select | `"Activo"` · `"En revisión"` · `"Borrador"` |
| `Pasos` | relation → Sub-procesos & Pasos | Los pasos de la ruta |
| `Procesos` | relation → Procesos & SOPs | Los procesos que atraviesa |

**Los 6 flujos:**

| Flujo | Abrev. | Pasos | Cuándo |
|---|---|---|---|
| Flujo Diseño PRO 2026 | FDPY | 12 | Problema sin definir, hay usuarios que entrevistar y plazo |
| Flujo Diseño Rápido | FDR | 8 | Problema ya definido o plazo corto — se entra al brief |
| Flujo Entendimiento y Definición | FED | 6 | Llega requerimiento de negocio o transcripción de reunión |
| Flujo Desarrollo Rápido | FDER | 5 | Ya hay diseño aprobado o el encargo es solo desarrollo |
| Gestión de Proyectos | GP | 4 | Siempre que haya cliente externo — corre en paralelo |
| Transversal | TR | 0 | Trabajo que sostiene a todos: design system, infraestructura |

### BD 2d: Sub-procesos & Pasos

**Collection ID:** `collection://786b6518-9d98-46cc-beff-997a1dd19598`
**Título (campo):** `Paso`

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Paso` | title | Nombre del paso |
| `Descripción` · `Input` · `Output` | text | Qué hace, qué recibe, qué produce |
| `Orden` | number | Posición global dentro del flujo (1..N corrido) |
| `Fase` | select | Prefijada por flujo — ver abajo |
| `Tiempo estimado` | select | `"< 30 min"` · `"30-60 min"` · `"1-2 hs"` · `"+ 2 hs"` |
| `Status` | select | `"Activo"` · `"Borrador"` |
| `Flujo` | relation → Flujos | **El padre.** Una ruta por paso |
| `Proceso` | relation → Procesos & SOPs | Clasificador. Era `Proceso padre` hasta 2026-08-02 |
| `Skills & Marcos` · `Herramientas` · `Templates` · `Proyectos` | relation | |

`Fase` (16 opciones, prefijadas con la abreviatura del flujo):
`FDPY · Discovery` · `FDPY · Sprint de Diseño` · `FDPY · Handoff` ·
`FDR · Brief` · `FDR · Exploración` · `FDR · Alta Fidelidad` · `FDR · Handoff` ·
`FDER · Setup` · `FDER · Arquitectura` · `FDER · Construcción` · `FDER · QA Automático` ·
`FED · Análisis` · `FED · Definición` · `FED · Especificación` · `FED · Validación` ·
`GP · Ciclo de cliente`

> El prefijo no es decorativo: el DSL de vistas **no puede filtrar por relación**, así que
> las vistas por flujo filtran por este select. Si agregas un flujo, agrégale sus fases
> prefijadas o no vas a poder construirle una vista.

**Vistas de la página Procesos** (linked db `3a4a01dc169a80229615dcf962e78925`):
`FDPY · Diseño PRO` · `FDR · Diseño Rápido` · `FDER · Desarrollo Rápido` ·
`FED · Entendimiento y Definición` · `GP · Gestión de Proyectos`
Todas: board agrupado por `Fase`, ordenado por `Orden`, filtrado por las fases de su flujo.

**Página de archivo:** `https://app.notion.com/p/3b0a01dc169a814da35adb29d7232693` — pasos
retirados de la BD sin borrar.

### BD 2e: Templates & Entregables

**Collection ID:** `collection://fb45c89e-76bd-4c70-9d48-ab2a2194e7af`
**DB URL:** https://app.notion.com/p/114d68bf938c43d1a75869ca589c661c
**Título (campo):** `Nombre`

> **Para crear una plantilla nueva, lee `template-authoring.md`** — proceso de investigación,
> anatomía de una plantilla que se usa, patrón de variantes e inventario actual.

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Nombre` | title | Con sufijo de variante si aplica: `— Producto Nuevo`, `— Evaluativa` |
| `Tipo` | select | `"Brief"` · `"User Story"` · `"Checklist"` · `"Report"` · `"Guía"` · `"Canvas"` |
| `Status` | select | `"Activo"` · `"En revisión"` · `"Borrador"` |
| `Archivo` | url | Hoy vacío en todas — es tipo URL y las rutas locales no aplican |
| `Sub-proceso` | relation → Sub-procesos & Pasos | **Obligatorio.** El paso donde se usa |

Criterio de `Tipo`: guiones, agendas y actas → `Guía`. Informes y análisis → `Report`.
Mapas y lienzos → `Canvas`. *(Faltan `Acta` y `Plan`; el select se queda corto.)*

**18 plantillas cargadas** (17 de la fase de entendimiento + Checklist Handoff Dev preexistente).
Espejo local en `D:\Investigacion - V4\04-plantillas\` con README índice.

Cadena de la fase de entendimiento:
`Brief → Supuestos → Plan → Guion → Registro → Síntesis → Problem Statement`

### BD 2b: Skills & Marcos

**Collection ID:** `collection://0f912612-f1e0-4b3e-9fee-85bd790359c9`
**Título (campo):** `Nombre`

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Nombre` | title | Nombre del skill, ej: `/react-dev` |
| `Comando` | text | El slash command |
| `Descripción` | text | Qué hace. Sacarla del frontmatter del `SKILL.md` |
| `Cuándo usar` | text | **El campo que más se olvida.** Cuándo eliges este y no su alternativa |
| `Tipo` | select | `"Skill Claude"` · `"Framework UX"` · `"Metodología"` |
| `Status` | select | `"Activo"` · `"En evaluación"` |
| `Proceso asociado` | multi_select | `"Discovery"` · `"Sprint"` · `"Handoff"` · `"Cliente"` · `"Transversal"` |
| `Rol` | multi_select | `"Desarrollador"` · `"Diseñador"` · `"Analista"` · `"Revisor"` · `"Investigador"` · `"Gestor"` · `"Operativo"` |
| `MCPs` | multi_select | `"figma-console"` · `"figma-console-local"` · `"Notion"` · `"Web Search"` · `"WebFetch"` · `"drawio"` · `"Excalidraw"` · `"Gmail"` · `"Google Drive"` |
| `Favorito` | checkbox | `"__YES__"` o `"__NO__"` |
| `Procesos` | relation → Procesos & SOPs | Solo si cubre el proceso entero sin paso concreto |
| `Sub-procesos` | relation → Sub-procesos & Pasos | **La vinculación principal** — el paso es donde ocurre el trabajo |
| `Depende de` | relation → Skills & Marcos (self) | Skills que este invoca. Inversa: `Usado por` |
| `Usado por` | relation → Skills & Marcos (self) | Inversa de `Depende de` |
| `Proyectos` | relation → Projects | |

**Un skill vive en varios flujos con UNA sola fila.** `Sub-procesos` y `Procesos` son
muchos-a-muchos: `/pm` cubre los 4 pasos de GP **y** "Kick-off & Brief" de FDPY sin duplicarse,
igual que `/react-dev` cubre FDPY y FDER. Nunca crear una segunda fila para vincular un skill a
otro flujo — agregar el paso al array existente.

> ⚠️ **Deuda conocida (2026-08-06):** 15 skills tienen dos filas con nombre idéntico
> (`/audit-a11y`, `/audit-copy`, `/audit-security`, `/audit-spacing`, `/design-qa`,
> `/analista-rf`, `/functional-analyst`, `/functional-requirements-spec`, `/prd-assistant`,
> `/project-prd-analyzer`, `/nielsen-heuristic-evaluator`, `/usability-test`, `/ux-discovery`,
> `/ux-writer-evaluator`, `/ui-ux-pro-max`) — una por flujo, producto de carga repetida.
> Otros 7 tienen una copia huérfana sin procesos (`case-study`, `clickup-reporter`,
> `design-director`, `finanzas`, `notion-workspace`, `pm`, `skill-builder`).
> **Decisión pendiente de Enzo:** dejarlos, renombrar con sufijo de flujo, o consolidar.
> No tocar sin su aprobación explícita.

**Fuente observada el 2026-09-03:** `D:/Investigacion/Skills/e-skills/skills`; Codex y Claude usan enlaces individuales y `.agents/skills` estaba vacío. Verificar en otra laptop. Fuente, instalación, catálogo y archivo son estados distintos; no archivar ni borrar por ausencia.

12 filas corresponden a **skills built-in de Claude Code** (`/code-review`, `/loop`, `/review`,
`/run`, `/schedule`, `/security-review`, `/simplify`, `/update-config`, `/keybindings-help`,
`/fewer-permission-prompts`, `/claude-api`, `/verify`). No vienen del repositorio — no
sincronizarlas contra el disco ni darlas de baja por no encontrarlas ahí.

---

## Ambiente 3 — LifeOS Dashboard

**Hub:** https://app.notion.com/p/080a01dc169a839b9a52019f457935e5
**Propósito:** Sistema de vida personal — metas, notas, hábitos, rutinas

### BD 3a: Goals

**Collection ID:** `collection://632a01dc-169a-82ca-a59f-870d38f2330b`
**Título (campo):** `Goal`

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Goal` | title | Descripción del objetivo |
| `Estado` | status | `"Sin iniciar"` · `"En progreso"` · `"Completado"` |
| `Prioridad` | select | `"P1"` · `"P2"` · `"P3"` |
| `Progreso` | number | 0-100, mostrado como barra |
| `Fecha límite` | date | ISO-8601 |
| `Etiquetas` | multi_select | Libre |

| `Área` | select | `"Carrera / Product Design"` · `"Aprendizaje"` · `"Negocio"` · `"Finanzas"` · `"Salud & Fitness"` · `"Relaciones"` · `"Personal"` |
| `Cursos` | relation → Cursos & Certificaciones | |
| `Recursos` | relation → Resources | |
| `Notas` | relation → Notas | |
| `Proyectos` | relation → Projects | |

`Etiquetas` (multi_select): `"Portfolio"` · `"Certificacion"` · `"Lectura"` · `"Habito"` · `"Largo plazo"` · `"Este trimestre"`

**Meta raíz:** `Mejorar mi perfil como diseñador de producto`
(`3aaa01dc-169a-8196-beee-f4ad282a67a0`) — todo lo de carrera se relaciona ahí.

### BD 3b: Notas

**Collection ID:** `collection://389a01dc-169a-82f7-b373-87d5275c7ee9`
**Título (campo):** `Nota`

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Nota` | title | Título de la nota |
| `Tipo` | select | `"Idea"` · `"Investigacion"` · `"Propuesta"` · `"Insight / Aprendizaje"` · `"Referencia"` · `"Nota suelta"` |
| `Estado` | select | `"Bandeja de entrada"` · `"Por revisar"` · `"Archivado"` |
| `Etiquetas` | multi_select | `"Product Design"` · `"UX Research"` · `"UI / Visual"` · `"Design Systems"` · `"Estrategia"` · `"Proceso"` · `"IA"` · `"Carrera"` · `"Personal"` |
| `Objetivo` | relation → Goals | |
| `Proyecto` | relation → Projects | |

Default al crear: `Estado = "Bandeja de entrada"` + `Tipo` según contexto

### BD 3c: Cursos & Certificaciones

**Collection ID:** `collection://00fa0606-da20-4598-880a-abcff9b583d5`
**Título (campo):** `Curso`

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Curso` | title | |
| `Estado` | select | `"Por empezar"` · `"En progreso"` · `"En pausa"` · `"Completado"` · `"Abandonado"` |
| `Progreso` | number (percent) | Ojo: formato percent, `0.5` = 50% |
| `Tipo` | select | `"Curso"` · `"Certificacion"` · `"Bootcamp"` · `"Workshop"` · `"Serie / Playlist"` |
| `Foco` | multi_select | `"Product Design"` · `"UX Research"` · `"UI / Visual"` · `"Design Systems"` · `"Estrategia de producto"` · `"Prototipado"` · `"Frontend"` · `"Data / Metricas"` · `"IA"` · `"Soft skills"` |
| `Plataforma` | select | `"Coursera"` · `"Udemy"` · `"Domestika"` · `"Platzi"` · `"Interaction Design Foundation"` · `"NNGroup"` · `"YouTube"` · `"Figma Learn"` · `"Otra"` |
| `Prioridad` | select | `"P1"` · `"P2"` · `"P3"` |
| `Fecha inicio` · `Fecha objetivo` | date | |
| `Horas estimadas` | number | |
| `Instructor` | text | |
| `URL` | url | Usar como `userDefined:URL` |
| `Certificado obtenido` | checkbox | |
| `Aprendizaje clave` | text | |
| `Objetivo` | relation → Goals | |

### BD 3d: Por Probar

**Collection ID:** `collection://dcddc9a8-baf6-4124-85b6-6692a233ff76`
**Título (campo):** `Qué probar`

Backlog de exploración. NO son tareas — tienen conclusión, no fecha de vencimiento.

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Qué probar` | title | |
| `Estado` | select | `"Por probar"` · `"Probando"` · `"Sirve"` · `"Descartado"` |
| `Tipo` | select | `"Herramienta"` · `"Tecnica"` · `"Patron UX"` · `"Libreria / Plugin"` · `"Workflow"` · `"Modelo / IA"` · `"Metodologia"` · `"Otro"` |
| `Prioridad` | select | `"P1"` · `"P2"` · `"P3"` |
| `Por qué me interesa` | text | El motivo — se llena al crear |
| `Conclusión` | text | Se llena al cerrar |
| `URL` | url | Usar como `userDefined:URL` |
| `Objetivo` | relation → Goals | |
| `Proyecto` | relation → Projects | |

### BD 3e: Resources

**Collection ID:** `collection://e01a01dc-169a-821d-a0eb-870b81a1fab7`
**Título (campo):** `Título`

Libros, artículos, videos, podcasts. Formación **no** estructurada (para cursos usar 3c).

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Título` | title | |
| `Tipo` | multi_select | `"Libro"` · `"Podcast"` · `"Artículo"` · `"Video"` · `"Newsletter"` · `"Serie de TV"` · `"Película"` · `"Revista académica"` · `"Otros"` |
| `Estado` | select | `"Mi lista"` · `"En progreso"` · `"En pausa"` · `"Terminado"` |
| `Progreso` | number (percent) | |
| `Autor/Creador` | text | Era select con 41 opciones fijas; convertido a texto |
| `Categoría` | multi_select | 19 opciones — incluye `"Producto"`, `"Aprendizaje"`, `"Negocios"`, `"Psicología"` |
| `Calificación` | select | `"⭐"` a `"⭐⭐⭐⭐⭐"` |
| `Notas` | text | |
| `URL` | url | Usar como `userDefined:URL` |
| `Objetivo` | relation → Goals | |

### BD 3f: Habits

**Collection ID:** `collection://efaa01dc-169a-83a8-8910-877b94fc11c6`
**Título (campo):** `Día`

Tracker diario con checkboxes fijas por hábito (no es una BD de hábitos configurable —
cada hábito es una columna). Agregar un hábito = agregar una columna checkbox.

---

## Ambiente 4 — Herramientas

**Hub:** https://app.notion.com/p/c1da01dc169a83ee84a6019e82c0f30b
**Propósito:** Biblioteca de herramientas, apps y recursos del flujo de trabajo

### BD principal: Recursos y Herramientas

**Collection ID:** `collection://e92a01dc-169a-837a-b54a-87e90dbc6cd0`
**Título (campo):** `Nombre`

| Campo | Tipo | Opciones / Notas |
|-------|------|-----------------|
| `Nombre` | title | Nombre de la herramienta |
| `Propósito` | text | Para qué se usa |
| `Enlace` | url | URL de la herramienta |
| `Status` | select | `"Evaluando"` · `"Uso ocasional"` · `"En uso activo"` · `"Descartada"` |
| `Tipo de acceso` | multi_select | `"Gratuito"` · `"Freemium"` · `"De Pago"` · `"Open Source"` |
| `Favorito` | checkbox | `"__YES__"` o `"__NO__"` |
| `Categoría` | relation → Category Herramientas | Clasificación |
| `Procesos` | relation → Procesos & SOPs | Procesos donde se usa |
| `Sub-procesos` | relation → Sub-procesos & Pasos | |

---

## Tabla de routing rápido

| El usuario quiere guardar... | Ambiente | BD | Collection ID |
|------------------------------|----------|----|--------------|
| Un proyecto nuevo | Proyectos | Projects | `c18a01dc-169a-82c8-90d0-07edc4821769` |
| Un skill reutilizable nuevo o actualizado | Herramientas de IA | Skills | `e0e1a7d0-6388-8289-a285-8778cc0a69a9` |
| Un proceso / SOP | Process OS | Procesos & SOPs | `86266c47-dec5-47c4-81b1-2ed3467090ac` |
| Un flujo / ruta de trabajo | Process OS | Flujos | `bbe77287-00eb-438f-bceb-24d4d791a4ee` |
| Un paso dentro de un flujo | Process OS | Sub-procesos & Pasos | `786b6518-9d98-46cc-beff-997a1dd19598` |
| Una plantilla o entregable | Process OS | Templates & Entregables | `fb45c89e-76bd-4c70-9d48-ab2a2194e7af` |
| Un objetivo / meta | LifeOS | Goals | `632a01dc-169a-82ca-a59f-870d38f2330b` |
| Una nota, idea, investigación o propuesta | LifeOS | Notas | `389a01dc-169a-82f7-b373-87d5275c7ee9` |
| Un curso o certificación | LifeOS | Cursos & Certificaciones | `00fa0606-da20-4598-880a-abcff9b583d5` |
| Algo que quiere probar / explorar | LifeOS | Por Probar | `dcddc9a8-baf6-4124-85b6-6692a233ff76` |
| Un libro, artículo, podcast o video | LifeOS | Resources | `e01a01dc-169a-821d-a0eb-870b81a1fab7` |
| Una herramienta / app | Herramientas | Recursos y Herramientas | `e92a01dc-169a-837a-b54a-87e90dbc6cd0` |

## Grafo completo de relaciones entre ambientes

| Desde | Campo | Hacia | Bidireccional |
|-------|-------|-------|--------------|
| Projects | `Procesos` | Procesos & SOPs | ✅ (`Proyectos` en Procesos) |
| Projects | `Sub-procesos` | Sub-procesos & Pasos | ✅ (`Proyectos` en Sub-procesos) |
| Projects | `Skills & Marcos` | Skills & Marcos | ✅ (`Proyectos` en Skills) |
| Flujos | `Pasos` | Sub-procesos & Pasos | ✅ (`Flujo` en Pasos) — **jerarquía real** |
| Flujos | `Procesos` | Procesos & SOPs | ✅ (`Flujos` en Procesos) |
| Skills & Marcos | `Procesos` | Procesos & SOPs | ✅ (`Skills & Marcos` en Procesos) |
| Skills & Marcos | `Depende de` | Skills & Marcos (self) | ✅ (`Usado por` — auto-relación) |
| Procesos & SOPs | `Sub-procesos` | Sub-procesos & Pasos | ✅ (`Proceso` en Sub-procesos) |
| Templates & Entregables | `Sub-proceso` | Sub-procesos & Pasos | ✅ (`Templates` en Pasos) |
| Herramientas | `Procesos` | Procesos & SOPs | ✅ (`Herramientas` en Procesos) |
| Goals | `Cursos` | Cursos & Certificaciones | ✅ (`Objetivo` en Cursos) |
| Goals | `Recursos` | Resources | ✅ (`Objetivo` en Resources) |
| Goals | `Notas` | Notas | ✅ (`Objetivo` en Notas) |
| Goals | `Por Probar` | Por Probar | ✅ (`Objetivo` en Por Probar) |
| Goals | `Proyectos` | Projects | ✅ (`Objetivos LifeOS` en Projects) |
| Notas | `Proyecto` | Projects | ✅ (`Notas LifeOS` en Projects) |
| Por Probar | `Proyecto` | Projects | ✅ (`Por Probar` en Projects) |
