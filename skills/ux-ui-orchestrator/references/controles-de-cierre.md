# Controles de cierre de paquete

Un paquete de diseño DSP-NNN con pantallas especificadas no se cierra, ni se sube su rama de diseño, sin la UXS que lo indexa. Para que eso no dependa de que alguien
lo recuerde, hay controles **duros** (código que comprueba y bloquea) además del texto del `SKILL.md`.

## Contenido
- Los controles y qué tan fuertes son
- Auditoría de cierre (`audit_ux.py --exigir-uxs`)
- Guardia de la UXS (hook)
- Cómo se ajusta el guardia
- Cómo se prueba
- Límites que conviene conocer
- Qué hacer cuando frena

## Los controles y qué tan fuertes son

| Control | Tipo | Fuerza | Dónde |
|---|---|---|---|
| Texto del `SKILL.md` (compuerta GU, escenario H, paso 6) | Instrucción al modelo | Blanda: depende de que el modelo la siga | `SKILL.md` |
| Compuerta GU y tarea T-03b | Definición del flujo | Orienta quién hace qué; no bloquea por sí sola | `packs/ux/pack.yaml` |
| `audit_ux.py --exigir-uxs` | Validador (Python) | Dura al ejecutarse: devuelve error y código de salida 1 | `scripts/audit_ux.py` |
| `guardia-uxs.mjs` | Hook `PreToolUse` | Dura: Claude Code lo ejecuta solo y puede negar la acción | `hooks/guardia-uxs.mjs` y `hooks/hooks.json` del plugin |

## Auditoría de cierre (`audit_ux.py --exigir-uxs`)

Detecta el paquete de cada artefacto por la etiqueta `dsp-NNN` de su frontmatter (`tags: [..., dsp-005]`). Para cada paquete:

| Código | Nivel | Cuándo |
|---|---|---|
| `PAQUETE_SIN_UXS` | Error con `--exigir-uxs` si hay pantallas (SCR); aviso si no | Ninguna UXS indexa el paquete (ni lo declara en `tags` o `sources`, ni menciona alguno de sus artefactos) |
| `UXS_NO_INDEXA` | Aviso | La UXS existe pero no menciona artefactos del paquete (UXR, FLW o SCR); se regenera |
| `ARTEFACTO_SIN_PAQUETE` | Aviso | Hay UXR, flujos o pantallas sin etiqueta `dsp-NNN`: el control no los ve. Etiquétalos |
| `SIN_BASE` | Aviso | Con `--desde-rama` no se pudo comparar con la base; el control no se limita a la rama |

Opciones: `--paquetes DSP-005,DSP-006` limita el control a esos paquetes; `--desde-rama origin/develop` lo limita a los paquetes cuyos UXR, flujos, pantallas o decisiones
cambia la rama actual. La UXS se reconoce también por rangos («SCR-016 a SCR-022», «SCR-051-054»).

## Guardia de la UXS (hook)

Es un hook `PreToolUse` del plugin `comsatel-ux` (`hooks/hooks.json`). Evalúa cada comando `Bash` o `PowerShell` y solo actúa si **todo** esto se cumple:

1. Es un `git push` (o el envoltorio `node git-auth.mjs <repo> push …` del equipo), sin `--dry-run`, `--delete`, `--tags` ni `--mirror`.
2. El repositorio es de diseño: tiene `design/ux-requirements` y `design/specs`.
3. La rama que se sube empieza por `ux/` y es la rama actual (o su origen es `HEAD`).
4. `audit_ux.py --exigir-uxs --desde-rama origin/develop` devuelve `PAQUETE_SIN_UXS` como error para algún paquete que toca la rama.

Entonces niega el comando con un mensaje que dice qué paquetes faltan y qué hacer. Si no puede comprobar (no hay Python, falta `origin/develop`, la auditoría no responde),
**pide confirmar** en vez de callar. Responde con un JSON `permissionDecision` por stdout y sale con código 0: en Windows el código 2 no bloquea.

## Cómo se ajusta el guardia

La variable de entorno `COMSATEL_UX_GUARDIA` la fija **la persona**, en su propio entorno, nunca el agente:

| Valor | Efecto |
|---|---|
| `bloquea` (por defecto) | Niega el push |
| `aviso` | Pide confirmar en vez de negar |
| `off` | No hace nada |

## Cómo se prueba

```
node hooks/probar-guardia-uxs.mjs
```

Arma repositorios temporales de verdad (un remoto, `develop` y una rama `ux/prueba`) y comprueba 19 casos: los que niegan (push de `ux/*` sin UXS, con `-u`, sin argumentos, con refspec,
con `git -C`, tras un `cd`, con el envoltorio `git-auth`), el modo `aviso`, y los que pasan (con UXS, rama que no es `ux/*`, artefactos sin etiqueta, dry-run, borrar rama,
fuera de un repositorio de diseño, modo `off`, texto de un commit que dice «git push»). Sale con código 1 si alguno falla.

## Límites que conviene conocer

- Un hook solo existe en las sesiones que tienen el plugin instalado. No sustituye a un job de CI en el repositorio (hoy el KB no tiene pipeline).
- Solo ve comandos `git push` escritos en el comando. No ve un push hecho desde un script propio ni una llamada directa a la API.
- Solo conoce los paquetes que llevan la etiqueta `dsp-NNN`; los artefactos sin etiqueta salen como aviso `ARTEFACTO_SIN_PAQUETE`.
- Compara con `origin/develop` (o `origin/main`): hace falta `git fetch origin` reciente para que «lo que toca la rama» sea exacto.

## Qué hacer cuando frena

1. Lee el mensaje: dice qué paquetes no tienen UXS.
2. Arma la UXS con `ux-context-builder` (`--dry-run` primero), commitéala en la misma rama.
3. Vuelve a subir. **No apagues ni rodees el guardia**: si es una excepción real, la persona decide y cambia su entorno.
