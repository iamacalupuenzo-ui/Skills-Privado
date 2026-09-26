# Notion Workspace — Flujos de registro por entidad

Cada tipo de item tiene su propio protocolo de preguntas y campos.
Nunca usar el flujo genérico — siempre el específico por tipo.

---

## Flujo 1 — Registrar o sincronizar un Skill

**BD destino:** Herramientas de IA → Skills (`collection://e0e1a7d0-6388-8289-a285-8778cc0a69a9`)
**Cuándo:** "registra el skill X", "agrega este skill a Notion", "guarda /nombre-skill"

### Paso 0 — Verificar fuente, schema y duplicado (obligatorio)

Antes de crear la fila, resolver la fuente canónica: el repositorio Skils (ver
`skill-builder/references/catalog-flow.md`). Comprobar que el skill está declarado:

```powershell
npx --yes github:iamacalupuenzo-ui/Skils#main list
```

Si el skill no está en el catálogo, no registrarlo; la ausencia no autoriza archivar una
fila histórica o de sistema.

Antes de escribir, leer `../../../docs/sistema-skills-notion.md` y hacer `notion_fetch` de
Skills y Capacidades. Buscar por `Skill`; si existe una fila, actualizarla.
Nunca crear un duplicado.

### Clasificación vigente

Extraer del `SKILL.md` todo lo verificable: `Skill`, `Qué hace`, `Tipo`, las frases que lo
activan (van al final de `Cuándo usarlo`), `Versión` (`metadata.version` publicada en
`main`), `Repositorio fuente` (`Skils`) y entornos instalados comprobados con `doctor`. Preguntar únicamente
por vacíos materiales, una pregunta por turno:

1. **Cuándo usarlo:** situación concreta y resultado esperado.
2. **Capacidad:** mostrar las capacidades relevantes y reutilizar una existente; crear una
   solo cuando ninguna represente fielmente el ámbito nuevo.
3. **Prioridad y estado:** `Activo` solo tras validación aplicable y disponibilidad
   comprobada en al menos un entorno; de lo contrario `En diseño` o `Por evaluar`.

Completar `Última revisión` con la fecha de la comprobación. Usar los valores de `Tipo`,
`Entornos compatibles` y `Repositorio fuente` del schema vivo; no inventar valores.

No usar `Skills & Marcos` de Process OS para skills nuevos: es una base histórica y no
prueba instalación, disponibilidad ni estado actual.

> El bloque que sigue conserva preguntas de la base histórica solo como antecedente. No se
> ejecuta para la base Skills y no prevalece sobre esta clasificación vigente.

### Preguntas históricas (no aplicar a la base Skills)

**P1 — Nombre y comando**
> ¿Cuál es el nombre del skill y su slash command?
> Ej: nombre = `/react-dev`, comando = `/react-dev`
→ Habilita: `Nombre`, `Comando`

**P2 — Tipo**
> ¿Es un Skill Claude, un Framework UX o una Metodología?
> - Skill Claude: orquesta comportamiento de Claude Code
> - Framework UX: metodología de diseño
> - Metodología: proceso de trabajo genérico
→ Habilita: `Tipo`

**P3 — Cuándo usar**
> ¿En qué momento concreto se usa este skill, y qué lo distingue de su alternativa más cercana?
→ Habilita: `Cuándo usar`

Es el campo más importante de la fila y el que más se olvida. `Descripción` dice **qué hace**;
`Cuándo usar` dice **cuándo lo eliges a él y no a otro**. Sin ese campo escrito, la BD es un
catálogo que no ayuda a decidir. Los mejores ejemplos cargados hoy lo redactan así:
*"FED F1 — cuando el proyecto arranca desde una reunión o idea verbal sin carpeta de archivos.
Alternativa a /project-prd-analyzer"*.

**P4 — Proceso asociado y Rol**
> ¿A qué fase pertenece y quién lo ejecuta? (ambos admiten más de un valor)
> Fase: Discovery · Sprint · Handoff · Cliente · Transversal
> Rol: Desarrollador · Diseñador · Analista · Revisor · Investigador · Gestor · Operativo
→ Habilita: `Proceso asociado`, `Rol`

**P5 — ¿En qué pasos se usa?**
> ¿Hay pasos concretos de algún flujo donde este skill se ejecute?
> Si sí → buscarlos en Sub-procesos & Pasos y crear la relación bidireccional
→ Habilita: relación `Sub-procesos` + `Skills & Marcos` en el Paso

**Vincula al paso, no al proceso.** El paso es donde ocurre el trabajo (`process-modeling.md` §3).
La relación `Procesos` se completa sola por herencia conceptual y solo se setea a mano cuando el
skill pertenece a un proceso entero sin paso concreto (ej: `/lyse-ds` → Sistema de Diseño).

**Un skill puede vivir en varios flujos con una sola fila.** `Sub-procesos` y `Procesos` son
relaciones muchos-a-muchos: `/pm` está en los 4 pasos de GP **y** en "Kick-off & Brief" de
FDPY con una única fila. **Nunca crees una segunda fila para vincular el skill a otro flujo** —
agrega el paso al array existente. Ese error produjo 15 pares de nombre idéntico en la BD.

### Campos opcionales (preguntar solo si el usuario los menciona)
- `MCPs` — servidores que el skill necesita: `figma-console` · `Notion` · `Web Search` · `drawio` · `WebFetch` · `Gmail` · `Google Drive` · `Excalidraw` · `figma-console-local`
- `Depende de` — auto-relación hacia otros skills que este invoca (inversa: `Usado por`)
- `Favorito` — `"__YES__"` / `"__NO__"`
- `Proyectos` — relación hacia Projects

### Campos con defaults
- `Status` = `"Activo"`
- `Descripción` = extraer del frontmatter del `SKILL.md`, no inventarla

### Cierre
```
Skill sincronizado — [nombre]
  BD:          Skills (Herramientas de IA)
  URL:         [URL]
  Cuándo usarlo: [texto]
  Capacidad:   [relación]
  Estado:      [valor]
  Entornos:    [lista o "no verificados"]
```

---

## Flujo 2 — Registrar un Proceso

**BD destino:** Procesos & SOPs (`collection://86266c47-dec5-47c4-81b1-2ed3467090ac`)
**Cuándo:** "crea el proceso de X", "registra el SOP de Y", "nuevo proceso"

> ⚠️ **Lee `process-modeling.md` antes de crear un proceso.** Desde el 2026-08-02 un Proceso ya
> **no es el padre de los pasos** — es un clasificador transversal. El padre real es el Flujo.
> Si lo que quieres es una ruta de trabajo con pasos ordenados, lo que necesitas es un **Flujo**,
> no un Proceso. Hay una decisión abierta sobre si esta BD sobrevive (`process-modeling.md` §5b):
> antes de agregar un proceso nuevo, confirma con Enzo que no está por eliminarse.

### Preguntas en orden

**P1 — Nombre**
> ¿Cómo se llama el proceso? Si pertenece a una ruta concreta, usa el sufijo de flujo
> (ej: `Handoff Dev - FDPY`), que es la convención de los 9 existentes.
→ Habilita: `Proceso`

**P2 — Fase**
> ¿Qué tipo de trabajo clasifica?
> Discovery · Sprint de Diseño · Handoff Dev · Gestión de Cliente · Transversal
→ Habilita: `Fase`

**P3 — Flujos**
> ¿Qué rutas atraviesan este proceso? (admite más de una)
> Flujo Diseño PRO 2026 (FDPY) · Flujo Diseño Rápido (FDR) ·
> Flujo Entendimiento y Definición (FED) · Flujo Desarrollo Rápido (FDER) ·
> Gestión de Proyectos (GP) · Transversal (TR)
→ Habilita: relación `Flujos` + `Procesos` en Flujos

**El select `Flujo` ya no existe** — fue eliminado el 2026-08-02 y el dato vive en la relación
`Flujos`. Escribirlo como select falla en silencio.

**P4 — ¿Skills relacionados?**
> ¿Hay skills que se usen en este proceso?
> Si sí → buscar y linkear bidireccional
→ Habilita: `Skills & Marcos`

Prefiere vincular el skill a sus **pasos**. Reserva la relación a nivel de proceso para skills
que cubren el proceso entero sin paso concreto.

**P5 — ¿Herramientas relacionadas?**
> ¿Qué herramientas se usan? (opcional)
→ Habilita: `Herramientas`

### Campos con defaults
- `Status` = `"Borrador"` (pasa a `"Activo"` cuando el proceso está documentado)
- `Descripción` = extraer del contexto o dejar vacío

### Cierre
```
Proceso registrado — [nombre]
  BD:      Procesos & SOPs (Process OS)
  URL:     [URL]
  Fase:    [valor]
  Flujos:  [lista]
  Skills:  [lista o "ninguno"]
```

---

## Flujo 3 — Registrar un Proyecto

**BD destino:** Projects (`collection://c18a01dc-169a-82c8-90d0-07edc4821769`)
**Cuándo:** "registra el proyecto X", "crea el proyecto de Y", "nuevo proyecto"

### Preguntas en orden

**P1 — Nombre**
> ¿Cuál es el nombre del proyecto?
→ Habilita: `Nombre`

**P2 — Tipo**
> ¿Es un producto propio o un proyecto de cliente?
→ Habilita: `Tipo`

**P3 — Estado inicial**
> ¿En qué estado arranca?
> Discovery → Definition → Design → Development → QA → Released
→ Habilita: `Estado`

**P4 — Prioridad y fechas**
> ¿Cuál es la prioridad (Alta/Media/Baja) y hay fecha de entrega estimada?
→ Habilita: `Prioridad`, `Fecha entrega`

**P5 — Stack** (solo para proyectos de desarrollo)
> ¿Qué tecnologías usa? (opcional, saltar si es proyecto de diseño puro)
> Next.js · React · Node.js · Supabase · PostgreSQL · TypeScript · Tailwind · React Native · Prisma · AWS · Vercel
→ Habilita: `Stack`

**P6 — Cliente / Owner**
> ¿Quién es el cliente o responsable? (nombre o empresa)
→ Habilita: `Cliente / Owner`

**P7 — ¿Proceso, sub-proceso o skill relacionado?** (opcional)
> ¿Este proyecto sigue algún proceso documentado? ¿Hay skills de Claude que se usen?
> - Proceso → linkear en campo `Procesos` (bidireccional con Procesos & SOPs)
> - Sub-procesos específicos → linkear en campo `Sub-procesos` (si el proyecto usa pasos concretos)
> - Skills → linkear en campo `Skills & Marcos` (clave para agentes)
→ Habilita relaciones bidireccionales en los tres campos

### Campos con defaults
- Campos opcionales (completar solo si hay información): `Problem Statement`, `Métricas de éxito`, `Non-goals`, `Figma`, `Repositorio`

### Cierre
```
Proyecto registrado — [nombre]
  BD:         Projects (Proyectos)
  URL:        [URL]
  Tipo:       [Producto propio / Cliente]
  Estado:     [valor]
  Stack:      [lista o "no especificado"]
  Procesos:   [vinculado o "ninguno"]
  Skills:     [vinculado o "ninguno"]
```

---

## Flujo 4 — Registrar una Herramienta

**BD destino:** Recursos y Herramientas (`collection://e92a01dc-169a-837a-b54a-87e90dbc6cd0`)
**Cuándo:** "registra la herramienta X", "agrega Figma/Slack/X a Notion", "nueva herramienta"

### Preguntas en orden

**P1 — Nombre**
> ¿Cómo se llama la herramienta?
→ Habilita: `Nombre`

**P2 — Propósito**
> ¿Para qué se usa en el flujo de trabajo? Una línea.
→ Habilita: `Propósito`

**P3 — Status**
> ¿En qué estado está?
> - Evaluando → estamos probando si vale la pena
> - Uso ocasional → se usa pero no todos los días
> - En uso activo → parte del flujo diario
> - Descartada → se probó y no sirvió
→ Habilita: `Status`

**P4 — Tipo de acceso**
> ¿Cómo se accede? (puede ser más de uno)
> Gratuito · Freemium · De Pago · Open Source
→ Habilita: `Tipo de acceso`

**P5 — ¿Relacionar con un proceso?**
> ¿Esta herramienta se usa en algún proceso específico?
> Si sí → buscar el proceso y linkear bidireccional
→ Habilita: `Procesos`

### Campos con defaults
- `Enlace`: preguntar solo si el usuario no lo proveyó
- `Favorito`: preguntar solo si el usuario lo menciona

### Cierre
```
Herramienta registrada — [nombre]
  BD:      Recursos y Herramientas (Herramientas)
  URL:     [URL]
  Status:  [valor]
  Proceso: [vinculado o "ninguno"]
```

---

## Flujo 5 — Registrar un Goal / Objetivo

**BD destino:** Goals (`collection://632a01dc-169a-82ca-a59f-870d38f2330b`)
**Cuándo:** "registra el objetivo de X", "crea una meta", "nuevo goal", "quiero lograr X"

### Preguntas en orden

**P1 — Goal**
> ¿Cuál es el objetivo? Una frase clara y accionable.
→ Habilita: `Goal`

**P2 — Prioridad**
> ¿Qué prioridad tiene?
> P1 (crítico) · P2 (importante) · P3 (nice to have)
→ Habilita: `Prioridad`

**P3 — Fecha límite** (opcional)
> ¿Hay una fecha límite? (opcional)
→ Habilita: `Fecha límite`

### Campos con defaults
- `Estado` = `"Sin iniciar"`
- `Progreso` = `0`

### Cierre
```
Goal registrado — [texto]
  BD:       Goals (LifeOS)
  URL:      [URL]
  Prioridad: [P1/P2/P3]
  Fecha:    [fecha o "sin fecha"]
```

---

## Flujo 6 — Registrar una Nota

**BD destino:** Notas (`collection://389a01dc-169a-82f7-b373-87d5275c7ee9`)
**Cuándo:** "guarda esta nota", "anota esto", "registra esta idea", "captura esto en LifeOS"

### Sin preguntas — crear directamente

La nota llega de lo que el usuario dice. No hacer preguntas.
- `Nota` = título extraído del contenido o lo que el usuario dicte
- `Estado` = `"Bandeja de entrada"` siempre
- El contenido detallado va en el body de la página

### Cierre
```
Nota guardada
  BD:     Notas (LifeOS)
  URL:    [URL]
  Estado: Bandeja de entrada
```

---

## Flujo 7 — Registrar una Plantilla o Entregable

**BD destino:** Templates & Entregables (`collection://fb45c89e-76bd-4c70-9d48-ab2a2194e7af`)
**Cuándo:** "crea la plantilla de X", "agrega este entregable", "necesito un formato para",
"documenta la estructura de", "qué preguntas van en el brief de"

> **Antes de empezar, lee `template-authoring.md`.** Tiene el proceso completo: cómo
> investigar la estructura, la anatomía de una plantilla que se usa, el patrón de variantes
> y el inventario actual. No improvises la estructura.

### Preguntas en orden (una por turno)

**P1 — Qué documento es y en qué paso se usa**
> ¿Qué plantilla necesitas y en qué momento del proyecto la usarías?
→ Habilita: `Nombre`, y la relación `Sub-proceso` (obligatoria)

**P2 — ¿Hay variantes?**
> ¿Este documento cambia según el tipo de proyecto?
> Si **una sección entera** cambia o desaparece → variantes separadas con sufijo
> Si cambian **preguntas sueltas** → un solo documento con nota
→ Habilita: decidir si es una plantilla o dos

**P3 — Tipo**
> `Brief` · `User Story` · `Checklist` · `Report` · `Guía` · `Canvas`
> Guiones, agendas y actas → `Guía` · Informes y análisis → `Report` · Mapas → `Canvas`
→ Habilita: `Tipo`

**P4 — ¿Investigo la estructura o ya la tienes?**
> Si no la tiene → investigar con las fuentes de `template-authoring.md` §2
> y presentar la estructura antes de construir
→ Habilita: el contenido

### Construcción

1. Investigar (si aplica) — marco primero, preguntas después, dos o tres fuentes cruzadas
2. Crear en Notion con `Sub-proceso` vinculado
3. Crear el archivo local en `D:\Investigacion - V4\04-plantillas\` con el encabezado
   de contexto y el enlace a Notion
4. Actualizar `plantillas/README.md`: tabla índice, secuencia de uso, patrón de variantes
5. Verificar que el paso muestre la plantilla en su propiedad `Templates`

### Cierre
```
Plantilla creada — [nombre]
  Tipo:        [tipo]
  Se usa en:   [flujo] · [fase] · [paso]
  Notion:      [URL]
  Local:       plantillas/[archivo].md
  Variantes:   [si aplica]
```

---

## Detección de tipo por contexto

| Señal de contexto | Tipo detectado |
|-------------------|---------------|
| "/comando", "skill de Claude", "skill para X" | Skill |
| "proceso de", "SOP", "flujo de trabajo de" | Proceso |
| "flujo", "ruta de trabajo", "FDPY/FDR/FDER/FED" | Flujo |
| "proyecto de", "aplicación", "producto", "cliente X" | Proyecto |
| "tarea", "actividad", "pendiente", "subtarea", "seguimiento" | Tarea |
| "herramienta", "app", "plataforma", "tool" | Herramienta |
| "meta", "objetivo", "goal", "quiero lograr" | Goal |
| "nota", "anota", "captura", "recuerda" | Nota |
| "plantilla", "template", "entregable", "formato", "qué preguntas van en" | Plantilla |
| Ambiguo → preguntar: "¿Esto es un proyecto, un proceso o un skill?" | — |

---

## Flujo 8 — Registrar una Tarea operativa

**BD destino:** Tareas de `Proyectos Enzo` (`collection://3bda01dc-169a-8345-a9a0-8727a8f95122`)

**Cuándo:** "registra estas actividades", "crea tareas", "haz seguimiento", "subtareas de X".

### Antes de crear

1. Buscar por nombre y proyecto para evitar duplicados.
2. Verificar el schema en vivo de la BD Tareas; el mapa es un apoyo, no sustituye la consulta.
3. Si el proyecto operativo no existe, crearlo o seleccionarlo en Projects de `Proyectos Enzo` (`collection://36aa01dc-169a-8248-82a1-07b97c2d2dd7`) con schema vivo. No usar Flujo 3 (`c18a...`).
4. Registrar el responsable como texto, respetando el nombre y las asignaciones compartidas de la fuente.

### Preguntas necesarias, una por turno

**P1 — Proyecto y tipo**
> ¿La actividad pertenece a un proyecto ya registrado? Si no existe, ¿es Cliente, Producto propio u Operación interna?

**P2 — Fecha y prioridad no explícitas**
> Para las actividades sin fecha o sin indicación de prioridad, ¿qué fecha de entrega y prioridad deben llevar?

**P3 — Descomposición (solo si aplica)**
> ¿Quieres una tarea única o subtareas? Si son subtareas, ¿bajo qué épica o user story existente deben vivir?

### Valores derivados permitidos

- Actividad marcada con estrella o descrita como crítica → `Prioridad = Alta`.
- Estado del material de origen se conserva en `Descripción` si no coincide exactamente con las opciones de `Estado` de Notion. Nunca rebajar, redondear o cambiar un porcentaje sin confirmación.
- Fase `PRE` / `POST` se conserva en el nombre como prefijo (`PRE —`, `POST —`) y también en la descripción hasta que haya un campo dedicado.

### Cierre

```
Tareas registradas — [proyecto]
  Creadas: [n]
  Prioridad alta: [n]
  Para hoy: [n]
  Pendientes de aclaración: [lista o "ninguna"]
  URLs: [lista]
```
