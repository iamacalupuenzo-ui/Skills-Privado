---
name: em-constructor-de-skills
description: >
  Diseña, construye, migra, audita y actualiza skills para Claude Code y Codex con el molde
  del catálogo: SKILL.md corto, referencias que se leen por paso, evals, validador por
  consola, pruebas, plantillas y ejemplos cuando el skill produce un entregable. Valida con
  scripts/validar_skill.py antes de cerrar. Usar cuando pidan "crea un skill para X",
  "convierte esto en un skill", "audita el skill de Y", "qué le falta al skill de Z",
  "actualiza el skill de W" o "renombra este skill". Al cerrar una creación o actualización
  validada la publica, la instala y deja su fila y su página completas en Notion.
metadata:
  version: "2.1.0"
---

# Constructor de skills

Diseñas sistemas de comportamiento para el agente, no código de producto. Entrevistas el
dominio, decides qué va en SKILL.md y qué en referencias, escribes los archivos, los
validas contra el molde y sincronizas el catálogo cuando el alcance lo autoriza.

## Verificación de arranque

1. Resolver la fuente: el repositorio Skills-Privado (`SKILS_REPOSITORY` o el clon cuyo
   `origin` es `iamacalupuenzo-ui/Skills-Privado`). Las carpetas de `~/.claude/skills` y
   `~/.codex/skills` son destinos instalados, nunca la fuente.
2. Leer AGENTS.md o CLAUDE.md del repositorio y el skill afectado completo.
3. Trabajar en una rama; publicar solo con la validación en verde (B10).
4. Si falta acceso, detener solo la operación afectada e informar qué falta.

## Detección de modo

Declarar el modo en la primera línea. Leer su protocolo completo antes de actuar.

| Modo | Señales | Leer |
|---|---|---|
| `CREATE` | «crea un skill», «nuevo skill», «skill para X» | `references/protocolo-crear.md` |
| `MIGRATE` | «convierte esto en skill», ruta a `.claude/commands/*.md` | `references/protocolo-migrar.md` |
| `AUDIT` | «audita el skill», «qué le falta a», «revisa el skill de» | `references/protocolo-auditar.md` |
| `UPDATE` | «actualiza el skill de», «agrega el modo X», «renombra el skill» | `references/protocolo-actualizar.md` |

## Guías por paso

| Cuándo | Leer |
|---|---|
| Al entrevistar (CREATE, MIGRATE) | `references/preguntas-de-entrevista.md` |
| Al diseñar la arquitectura o auditar | `references/molde.md` y `references/anatomia.md` |
| Al buscar cómo resolver una sección | `references/catalogo-de-patrones.md` |
| Antes de escribir o editar archivos | `references/reglas.md` |
| Al validar | `references/checklist-calidad.md` y `references/evaluaciones.md` |
| Al registrar, publicar o instalar | `references/flujo-del-catalogo.md` |

Plantillas en `templates/` (incluida la página de Notion), ejemplo en `examples/em-resumen-de-mr/`.

## Validación obligatoria

```bash
python scripts/validar_skill.py skills/<nombre>               # nivel base
python scripts/validar_skill.py skills/<nombre> --entregable  # nivel entregable
python scripts/medir_molde.py skills/<nombre>                 # casillas para Notion
npm test                                                      # catálogo completo
```

En Windows, `py -3` en lugar de `python`. Pruebas del validador: `py -3 -m unittest discover -s tests`.

## Reglas de bloqueo

Detalle y atajos previsibles en `references/reglas.md`.

- **B1** — Contexto suficiente; preguntar solo vacíos materiales.
- **B2** — Conservar conocimiento y ejemplos; mover, no borrar.
- **B3** — Toda referencia citada existe antes del cierre.
- **B4** — Correr el checklist de calidad antes de cerrar.
- **B5** — La descripción dice qué hace y cuándo usarlo.
- **B6** — No repetir preguntas ya respondidas.
- **B7** — Mostrar la arquitectura antes de escribir; consultar solo ampliaciones.
- **B8** — AUDIT no edita sin aprobación.
- **B9** — Verificar soporte real por agente.
- **B10** — Al cerrar CREATE, MIGRATE o UPDATE: PR, merge, instalación y Notion, cada uno verificado.
- **B11** — Referencias que se leen por paso.
- **B12** — Fila de Notion con propiedades, casillas y página completa; nunca vacía ni duplicada.
- **B13** — `Activo` solo con validación comprobada.
- **B14** — Recursos externos con ruta de lectura verificable.
- **B15** — No cerrar con `validar_skill.py` en rojo.
- **B16** — Skill propio: `em-` y nombre en español; renombrar actualiza toda referencia.

## Cierre

Modo, archivos cambiados, resultado del validador y de `npm test`, nivel del molde
(base o entregable), PR fusionado, instalación y enlace a la página de Notion. AUDIT no
escribe nada. Formato de respuesta en `references/reglas.md`, sección 4.
