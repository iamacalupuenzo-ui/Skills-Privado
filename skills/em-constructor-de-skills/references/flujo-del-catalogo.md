# Flujo canónico del catálogo de skills

Este documento define cómo se crea, actualiza, publica e instala un skill reutilizable.
El repositorio [Skills-Privado](https://github.com/iamacalupuenzo-ui/Skills-Privado) es la fuente única de
verdad. Las carpetas de `~/.codex/skills` y `~/.claude/skills` son destinos instalados,
no lugares donde se mantiene la versión canónica.

## Índice

1. Resolver la fuente
2. Ciclo de creación o actualización
3. Publicación e instalación
4. Registro en Notion

## Resolver la fuente

1. Si existe `SKILS_REPOSITORY`, usar esa ruta.
2. En otro caso, localizar el repositorio Git que contiene `skills-manifest.json` y cuyo
   remoto `origin` es `https://github.com/iamacalupuenzo-ui/Skills-Privado.git`.
3. Si no se puede resolver, detener la edición reutilizable e informar la ruta que falta.

Estructura esperada:

```text
Skills-Privado/
  skills/
    nombre-del-skill/
      SKILL.md
      references/
  skills-manifest.json
  bin/skils.js
```

## Ciclo de creación o actualización

1. Leer el skill y referencias afectadas; para uno nuevo, diseñar su arquitectura.
2. Escribir o editar exclusivamente en `Skills-Privado/skills/<nombre>/`.
3. Para un skill nuevo, agregar su nombre exacto a `skills-manifest.json`.
4. Validar el contenido y ejecutar `npm test` desde la raíz de `Skills-Privado`.
5. Probar el instalador sin escribir destinos reales:

   ```powershell
   node bin/skils.js install --target all --skill <nombre> --dry-run
   ```

6. Publicar: commit, push de la rama, PR y merge en Skills-Privado (Enzo delegó el merge;
   se deja el PR abierto solo si dice que lo fusiona él).
7. Instalar en Claude y Codex desde `main` y correr `doctor`.
8. Registrar en Notion (sección «Registro en Notion»): propiedades, casillas y página
   completa. Es obligatorio; se omite solo si Enzo lo pide.
9. Informar con el enlace del PR y el de la página.

## Publicación e instalación

Se ejecutan al cerrar un cambio validado (B10), en este orden, y cada una se verifica:

| Operación | Comando o acción | Resultado verificable |
| --- | --- | --- |
| Publicar | Rama, commit, `git push`, `gh pr create` y `gh pr merge --merge --delete-branch` | PR fusionado y commit en `origin/main` |
| Instalar por primera vez | `npx --yes github:iamacalupuenzo-ui/Skills-Privado#main install --target all` | `doctor` informa `OK` |
| Actualizar instalaciones | `npx --yes github:iamacalupuenzo-ui/Skills-Privado#main update --target all` | `doctor` informa `OK` |
| Validar sin escribir | Agregar `--dry-run` a install o update | Lista de cambios previstos |

Después de instalar, ejecutar:

```powershell
npx --yes github:iamacalupuenzo-ui/Skills-Privado#main doctor --target all
```

Codex puede requerir reinicio si no redescubre el skill; Claude Code lo leerá al iniciar
una sesión nueva.

## Registro en Notion

Destino: página **Agentes y skills** (antes Herramientas de IA) → base
[Skills](https://app.notion.com/p/baa1a7d0638883f3b83d81e8697cc2b7). Bases relacionadas:
Controles, Evals, Automatizaciones y Herramientas externas.

Propiedades que se mantienen para un skill reutilizable:

- `Skill`: nombre exacto de la carpeta (`em-...` para skills propios).
- `Versión`: la de `metadata.version` del `SKILL.md` **publicado en `main`**. Se actualiza
  en el mismo cierre en que se publica; un cambio local sin publicar no cambia la versión
  en Notion. Para ver qué versión tiene instalada un equipo, leer `metadata.version` en
  su carpeta de skills: `doctor` solo confirma que el skill existe, no su versión.
- `Estado`: `Activo`, `En revisión` o `Retirado`. `Activo` solo tras validar (B13).
- `Rol`: Orquestador, Especialista, Independiente o Referencia; `Coordinado por` si es
  especialista de un orquestador.
- `Origen` y `Autor`: quién lo escribió y quién lo mantiene.
- `Qué hace`: una o dos frases tomadas del frontmatter del `SKILL.md`.
- `Cuándo usarlo`: situación concreta y, al final, `Frases que lo activan: …`.
- `Entornos compatibles`: declarar únicamente ambientes verificados.
- `Líneas`: líneas del `SKILL.md`.
- Casillas del molde: `Referencias por paso`, `Validador`, `Pruebas`, `Plantillas`,
  `Ejemplos` y `Tiene evals`, con el resultado de `python scripts/medir_molde.py <carpeta>`.
- `Herramientas externas`: relación con cada MCP o API que el skill usa.
- `Capacidades` si corresponde y `Última revisión`.

`Uso`, `Sesiones` y `Último uso` se miden contando sesiones; no se editan al registrar.

No existe `Ruta local`: cambia en cada computador. La fuente es siempre
`Skills-Privado/skills/<nombre>/` y se enlaza en el contenido de la página.

La página nunca queda vacía: se escribe en el mismo cierre que las propiedades, partiendo
de `templates/pagina-notion.plantilla.md`. Al actualizar un skill se revisan también la
página (diagrama, guías, versión operativa) y no solo la propiedad `Versión`.

Contenido de la página del skill: una guía de uso que se lee en menos de 5 minutos,
escrita para la persona que lo va a usar, no para el agente. En este orden, con
encabezado 2:

1. Pregunta previa en una cita (`>`), con la respuesta en la página.
2. `## En 30 segundos`: qué hace, cómo trabaja y qué **no** hace, en tres líneas.
3. `## Cuándo usarlo y para qué`: tabla de hasta tres columnas (si necesitas… / pídelo
   así / obtienes), un renglón por modo, y a qué skill derivar lo que no le corresponde.
4. `## Cómo llamarlo`: en Claude Code, `/<nombre>` o una frase que lo active; en Codex,
   mencionarlo por su nombre o con una de sus frases. Dónde abrir la sesión y los
   requisitos previos (tokens, accesos), sin pedir nunca un secreto en el chat.
5. `## Cómo funciona por dentro`: un diagrama `mermaid` con el recorrido real del skill
   (guard, modos, fases y cierre) y un paso a paso en palabras simples.
6. `## Sus guías internas`: tabla de sus referencias (guía / cuándo la lee / para qué).
7. `## Cómo no perder el contexto`: prácticas concretas para sesiones largas o que se
   retoman: alcance por pedido, dónde queda guardado el plan o el estado, cómo retomarlo.
8. `## Recursos operativos`: fuente canónica enlazada a GitHub y dependencias con otros
   skills.
9. `## Versión operativa`: qué cambió en la versión actual y la última verificación (por
   ejemplo, `doctor` con OK y su fecha). El número vive en la propiedad `Versión`; no
   repetirlo aquí, porque dos copias del número terminan contradiciéndose.
10. `## Comprueba`: una pregunta de comprobación.

Todo lo que la página afirma sale del `SKILL.md` y sus referencias. Una recomendación de
uso que el skill no ejecuta por sí mismo (por ejemplo, guardar un plan en un archivo) se
escribe como práctica para la persona, no como comportamiento del skill. Ejemplo de
referencia: la página de `angular-product-builder`.

Ícono: nativo de Notion, `icons/code_blue` para skills y `icons/tag_blue` para
capacidades. Nunca emojis. Encabezados 2 y 3; nunca encabezado 1.

No registrar una instalación como si fuera una creación y no crear una fila duplicada por
cambiar de computador. El repositorio conserva el historial; Notion conserva el índice
operativo y las relaciones.
