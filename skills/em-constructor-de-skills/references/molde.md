# Molde de un skill

Leer en CREATE (Fase 1) y en AUDIT (Fase 2). Define qué piezas lleva un skill y qué
comprueba `scripts/validar_skill.py`. Fuentes: guía de Anthropic
(https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices),
especificación abierta (https://agentskills.io/specification) y el catálogo de Ilver
(`skillcatalog`, guía `plugin-skills-guideline.md`). Revisado el 2026-11-28.

## Índice

1. Qué es obligatorio y qué es convención
2. Nivel base: todo skill
3. Nivel entregable: skills que producen algo verificable
4. Estructura de carpetas
5. Nombres
6. Herramientas externas y MCP
7. Qué comprueba el validador

## 1. Qué es obligatorio y qué es convención

| Origen | Exige | Recomienda |
|---|---|---|
| Anthropic y la especificación | `SKILL.md` con `name` y `description` | Cuerpo de menos de 500 líneas, referencias a un nivel, índice en referencias largas, al menos 3 evals, scripts para lo determinista |
| Ilver | — | SKILL.md corto, contrato, compuertas, plantilla, ejemplo, validador por consola y pruebas |
| Este molde | Lo de Anthropic más evals y herramientas registradas | Lo de Ilver cuando el skill produce un entregable |

Ninguna fuente publica fecha de versión. Antes de cambiar este molde, volver a leer las
fuentes primarias y anotar aquí la fecha de la revisión.

## 2. Nivel base: todo skill

1. `SKILL.md` de 80 líneas o menos como objetivo (límite duro: 500). Contiene propósito,
   verificación de arranque, tabla de modos que apunta a su protocolo, reglas de bloqueo
   en una línea cada una y forma de cierre. Todo lo demás va a `references/`.
2. Referencias que se leen en el paso que las necesita. La tabla de modos o cada fase dice
   «Leer `references/x.md`». Nunca «leer todas las referencias al iniciar».
3. Referencias a un solo nivel: `SKILL.md` → `references/x.md`. Una referencia no manda a
   leer otra referencia como requisito.
4. Toda referencia de más de 100 líneas empieza con un índice.
5. `evals/evals.json` con al menos 5 casos (3 es el mínimo de Anthropic; el catálogo pide 5)
   y al menos uno de tipo `frena`.
6. Sus herramientas externas registradas en la base **Herramientas externas** de Notion y
   nombradas completas en el texto (`servidor:herramienta`).

## 3. Nivel entregable: skills que producen algo verificable

Aplica cuando el skill produce un archivo, una página, un MR, un handoff o un registro que
otra persona o un sistema van a usar. Se suma al nivel base:

| Pieza | Carpeta | Para qué |
|---|---|---|
| Plantilla del entregable | `templates/` | Que el resultado tenga siempre la misma forma |
| Ejemplo resuelto | `examples/` | Mostrar un resultado bueno, no solo describirlo |
| Validador por consola | `scripts/` | Comprobar el entregable; mensajes con archivo, línea y corrección |
| Pruebas | `tests/` | Probar el validador con un caso bueno y casos rotos |

No aplica a skills de referencia (guías de terceros) ni a skills conversacionales sin
entregable. Declarar en la arquitectura qué nivel aplica y por qué.

## 4. Estructura de carpetas

```text
<nombre>/
  SKILL.md
  references/     guías que se leen por paso (nombres de archivo en español)
  scripts/        validadores y operaciones deterministas
  templates/      plantillas del entregable
  examples/       ejemplos resueltos
  tests/          pruebas de los scripts
  evals/          evals.json
  agents/         metadatos por agente (openai.yaml para Codex)
```

Las carpetas van en inglés porque la especificación las define así (`references/`,
`scripts/`, `assets/`) y el catálogo de Ilver usa el mismo molde. Los archivos dentro van
en español.

## 5. Nombres

- Skill propio: prefijo `em-` y nombre en español, en minúsculas con guiones. Ejemplo:
  `em-constructor-de-skills`.
- `name` del frontmatter igual al nombre de la carpeta.
- Máximo 64 caracteres; sin las palabras `anthropic` ni `claude`.
- `description` de 1.024 caracteres como máximo, en tercera persona, con qué hace y cuándo
  usarlo.
- Skills de terceros: no se renombran ni se editan; se sincronizan desde su origen.

## 6. Herramientas externas y MCP

La guía de Anthropic no define cómo declarar dependencias. Este molde lo resuelve así:

1. En el texto, nombrar la herramienta completa: `notion:notion-fetch`, `playwright:browser_navigate`.
2. En la verificación de arranque, comprobar que la herramienta responde antes de usarla.
   Si no responde, detener solo la operación afectada y decir cuál falta.
3. En Notion, relacionar el skill con su fila de **Herramientas externas**.

## 7. Qué comprueba el validador

`python scripts/validar_skill.py <carpeta-del-skill>` revisa:

| Regla | Falla si |
|---|---|
| Nombre | `name` distinto de la carpeta, mayúsculas, más de 64 caracteres o palabra reservada |
| Descripción | Falta o pasa de 1.024 caracteres |
| Tamaño | Cuerpo de `SKILL.md` de 500 líneas o más (aviso desde 80) |
| Referencias | Una referencia citada no existe |
| Profundidad | Una referencia está en una subcarpeta de `references/` |
| Índice | Una referencia de más de 100 líneas no tiene `## Índice` |
| Lectura | `SKILL.md` ordena leer todas las referencias al iniciar |
| Evals | Falta `evals/evals.json`, tiene menos de 5 casos o ninguno de tipo `frena` |
| Nivel entregable | Con `--entregable`: falta `templates/`, `examples/`, un script en `scripts/` o `tests/` |

Sale con código 1 si hay errores y 0 si solo hay avisos. Cada mensaje dice archivo, regla
y qué corregir.
