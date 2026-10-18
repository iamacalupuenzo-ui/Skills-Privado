# Skils

Repositorio central de los skills compartidos entre Codex y Claude Code.

## Fuente de verdad

Cada directorio dentro de `skills/` contiene el `SKILL.md` y sus referencias. La rama
principal es la fuente única de verdad: los cambios se revisan y publican aquí antes de
sincronizarlos con las instalaciones locales.

La CLI `skils` instala o actualiza el catálogo en Codex y Claude Code. Consulta la guía
completa en [docs/instalacion.md](docs/instalacion.md).

Para crear o actualizar un skill reutilizable, seguir el
[flujo canónico del catálogo](docs/sistema-skills-notion.md): fuente central, validación,
registro opcional en Notion, publicación explícita e instalación verificada.

La decisión y evidencia que justifican la CLI están documentadas en
[research/2026-09-cli-instalacion-directa-de-skills.md](research/2026-09-cli-instalacion-directa-de-skills.md).

## Skills publicados

| Skill | Estado | Entornos |
| --- | --- | --- |
| `angular-product-builder` | Activo | Codex, Claude Code |
| `product-orchestrator` | Activo | Codex, Claude Code |
| `comsatel-design-system` | Activo | Codex, Claude Code |
| `documentacion-handoff` | Activo | Codex, Claude Code |
| `epica-a-plan-desarrollo` | Activo | Codex, Claude Code |
| `gestion-proyectos` | Activo | Codex, Claude Code |
| `gestor-notion` | Activo | Codex, Claude Code |
| `investigador-de-producto` | Activo | Codex, Claude Code |
| `paridad-diseno-desarrollo` | Activo | Codex, Claude Code |
| `skill-builder` | Activo | Codex, Claude Code |
| `orquestador-desarrollo` | Activo | Claude Code |
| `flujo-ds` | Activo | Claude Code |
| `flujo-producto` | Activo | Claude Code |
| `ux-a-desarrollo` | Activo | Claude Code |
| `verificar-calidad` | Activo | Claude Code |
| `ux-ui-orchestrator` | Activo | Claude Code |
| `ux-requirements-analyzer` | Activo | Claude Code |
| `user-flow-designer` | Activo | Claude Code |
| `ui-spec-writer` | Activo | Claude Code |
| `web-atomic-component-designer` | Activo | Claude Code |
| `stitch-ui-generator` | Activo | Claude Code |
| `ux-development-handoff` | Activo | Claude Code |
| `claude-design-orchestrator` | Activo | Claude Code |
| `figma-design-validator` | Activo | Claude Code |
| `accessibility-reviewer` | Activo | Claude Code |
| `design-qa` | Activo | Claude Code |

### Skills de documentación de UX y desarrollo

- `orquestador-desarrollo` orquesta el desarrollo (flujo del DS y de los productos, verificación, publicación y despliegue). Su etapa previa es `ux-ui-orchestrator`, el orquestador de documentación, que coordina `ux-requirements-analyzer`, `user-flow-designer`, `ui-spec-writer`, `web-atomic-component-designer`, `stitch-ui-generator`, `claude-design-orchestrator`, `figma-design-validator`, `accessibility-reviewer` y `ux-development-handoff`.
- **Fuente única:** los skills de documentación de UX se editan **aquí**, en `skills/<nombre>/`. La carpeta `.claude/skills` del repositorio `kb-ux-uxr` no es una fuente: es una copia instalada y se pisa al actualizar con `skils`. Un cambio hecho solo allí se pierde. Para cambiar uno: editar en este repositorio, correr `npm test`, publicar y reinstalar.
- Los skills nuevos están instalados solo en Claude Code; Codex requiere autorización explícita.

La correspondencia entre los nombres vigentes y los registros históricos de Notion está
en [`notion-registry.md`](notion-registry.md).

## Convención de actualización

1. Actualizar el skill y sus `references/` en este repositorio.
2. Revisar los cambios y validar que toda referencia citada exista.
3. Publicar el commit en `main`.
4. Sincronizar la versión aprobada en `~/.codex/skills/` y `~/.claude/skills/`.

No mantener copias manuales con nombres alternos o respaldos dentro de los directorios
de skills: el repositorio y su historial Git son el respaldo.

Los directorios que no figuran en `skills-manifest.json` no se distribuyen. Pueden
conservarse temporalmente como material de evaluación, pero no representan una versión
activa ni sustituyen un skill publicado.
