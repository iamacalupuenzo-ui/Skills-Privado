# Instalación y actualización

`skils` instala el catálogo aprobado del repositorio en los directorios globales de
Codex y Claude Code. No usa modelos de IA: descarga/copia archivos, valida su estructura
y reemplaza cada skill de forma atómica.

## Requisitos

- Node.js 20 o superior (`node --version`).
- Git instalado y disponible en la terminal (`git --version`).
- Acceso a Internet para usar el comando mediante `npx`.
- Permisos de escritura en el directorio de usuario.
- Codex y/o Claude Code instalados si se quiere utilizar el destino correspondiente.

Git permite que `npx` resuelva el repositorio GitHub y también es necesario para contribuir
al repositorio o fijar una revisión concreta.

## Instalación inicial

El comando instala los siete skills publicados en ambos ambientes:

```sh
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main install --target all
```

Destinos utilizados por defecto:

| Sistema operativo | Codex | Claude Code |
| --- | --- | --- |
| Windows | `%USERPROFILE%\\.codex\\skills` | `%USERPROFILE%\\.claude\\skills` |
| macOS / Linux | `~/.codex/skills` | `~/.claude/skills` |

Para instalar en un solo ambiente:

```sh
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main install --target codex
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main install --target claude
```

Para instalar una selección:

```sh
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main install --target all --skill investigador-de-producto,skill-builder
```

## Actualización

Cuando exista una versión aprobada en `main`, ejecutar:

```sh
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main update --target all
```

`update` reemplaza únicamente el directorio de cada skill declarado en el catálogo. No
crea copias de respaldo persistentes: el historial de Git es el respaldo de la versión.
Antes de modificar archivos, construye una copia temporal y valida que cada fuente tenga
`SKILL.md`; si el reemplazo falla, intenta restaurar el directorio anterior.

## Verificación y simulación

```sh
# Ver qué instalaría, sin modificar el equipo
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main install --target all --dry-run

# Verificar los skills instalados
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main doctor --target all

# Listar el catálogo aprobado
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main list
```

Codex suele detectar los cambios locales automáticamente. Si un skill no aparece tras la
instalación, reiniciar Codex. Claude Code leerá los skills en su siguiente sesión.

## Directorios no estándar

En automatizaciones o equipos con perfiles no convencionales se puede indicar el destino:

```sh
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main install --target codex --codex-dir "D:\\Agentes\\codex-skills"
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main install --target claude --claude-dir "/opt/agent/claude-skills"
```

También se aceptan las variables `CODEX_SKILLS_DIR` y `CLAUDE_SKILLS_DIR`.

## Contribución y publicación

1. Modificar el directorio correspondiente dentro de `skills/`.
2. Mantener actualizadas sus referencias y `skills-manifest.json` si cambia el catálogo.
3. Ejecutar `npm test` y `node bin/skils.js doctor --target all --dry-run`.
4. Revisar, confirmar y publicar el cambio en `main`.
5. Cada equipo ejecuta `skils update --target all` cuando decide adoptar esa versión.

No se debe editar directamente una copia instalada como versión definitiva. El cambio se
hace en este repositorio, se revisa y luego se instala desde aquí.
