# Skills de terceros sin licencia: no se copian aquí

Dos skills de diseño móvil que usamos no declaran ninguna licencia en su repositorio de origen. Sin licencia,
los derechos quedan reservados al autor: **no se copian a este repositorio** (a diferencia de `anatomy`,
`micro-interactions` y `m3-expressive`, que son MIT y viajan con su `LICENSE`). Cada persona los instala desde
su origen, en local, siguiendo esta nota.

Estado verificado el 25-nov-2026: ambos repositorios son públicos y no tienen archivo `LICENSE` en la raíz ni
licencia declarada en GitHub.

| Skill | Origen | Commit revisado | Qué es |
| --- | --- | --- | --- |
| `apple-design` | https://github.com/dickwu/apple-design-skill | `91e15664896f6f27e75dcf1414d1226cb95fa167` | Revisor de UI multiplataforma basado en las Human Interface Guidelines de Apple (123 páginas). Sirve también para Flutter y React Native |
| `mobile-app-ui-design` | https://github.com/ceorkm/mobile-app-ui-design | `0ad61f025fc647417d4b8fb0ca786cb493c5156a` | Diseño de pantallas, flujos y componentes móviles |

## Cómo instalarlos en local (sin ejecutar nada de terceros)

1. Descarga solo los archivos `.md` del commit indicado (no clones ni ejecutes `npx`, `npm` ni scripts del
   repositorio). En `apple-design` el repositorio trae además `scripts/pull-hig.mjs`: **no se copia ni se ejecuta**.
2. Copia `SKILL.md` y la carpeta `references/` a `~/.claude/skills/<nombre>/`.
3. Revisa el texto antes de usarlo. El 25-nov se buscaron comandos de descarga, `eval`, instrucciones ocultas y
   rutas de claves en los dos, y no apareció nada sospechoso.
4. No se republican en este repositorio, ni en knowledge-base, ni en ningún otro, mientras no declaren licencia.

Si el autor agrega una licencia que lo permita, se vendorizan como los demás (copia sin modificar, `LICENSE`
original, `LICENSE-UPSTREAM.md` y `UPSTREAM.json`).
