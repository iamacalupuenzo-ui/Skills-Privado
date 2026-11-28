# Seguimiento de cambios de diseño

## Índice

1. Las dos direcciones
2. Lo construido cambia: actualizar la documentación
3. La documentación cambia: el aviso al iniciar la sesión
4. Instalar el hook

## 1. Las dos direcciones

| Qué cambió | Quién lo detecta | Qué se hace |
|---|---|---|
| Lo construido se aparta del UXR, FLW o SCR | Este skill, al validar en el navegador (B8) | Se actualiza la documentación con el skill dueño de cada artefacto |
| Otro cambió el UXR, FLW, SCR o DEC del paquete | El hook `avisar-cambios-ux.mjs` al empezar la sesión | Se revisa qué cambia en el código y se marca como visto |

## 2. Lo construido cambia: actualizar la documentación

Cada diferencia entre lo construido y la especificación se documenta en el momento, en la misma
rama de la KB, con el skill dueño del artefacto, no a mano:

| Artefacto | Skill | Modo y control |
|---|---|---|
| UXR | `ux-requirements-analyzer` | `ACTUALIZAR` (o `CONTRASTAR` si es una pantalla entera); `scripts/validar_uxr.py` sin errores |
| FLW | `user-flow-designer` | `ACTUALIZAR` (pasos, ramas y `screens`, sin renumerar IDs); `scripts/validar_flw.py` sin errores |
| SCR | `ui-spec-writer` | Actualiza estados, componentes y criterios de la pantalla |
| Desvío de la fuente | Este skill | DEC en `registro-de-decisiones.md` |

El paso no se da por cerrado hasta que `validar_flw.py` y `validar_uxr.py` pasan sobre los
flujos y UXR tocados y ningún ID cambió. Si la diferencia toca negocio, permisos, datos o alcance, queda como pregunta abierta
para el PO; lo demás lo valida y lo escribe el agente.

## 3. La documentación cambia: el aviso al iniciar la sesión

Al empezar a construir un paquete (modo `BAJAR`), se registra:

```bash
node scripts/seguir-paquete.mjs registrar --kb <ruta-de-la-kb> --paquete DSP-009
```

Desde ahí, cada sesión de Claude Code arranca con el hook, que hace fetch de `origin/develop` y
lista los UXR, FLW, SCR y DEC con la etiqueta `dsp-009` que cambiaron desde la última revisión.
Cuando el aviso aparece:

1. Contárselo a Enzo en la primera respuesta: qué artefactos y quién los cambió.
2. Leer cada cambio (`git -C <kb> diff <revisión>..origin/develop -- <ruta>`) y compararlo con el
   código: ¿cambia un estado, un texto, una regla o una pantalla ya construida?
3. Si cambia lo construido, ajustarlo en la rama del front (o registrar el desvío si no se aplica).
4. Marcar como revisado: `node scripts/seguir-paquete.mjs visto --paquete DSP-009`.

Al cerrar el paquete: `seguir-paquete.mjs quitar --paquete DSP-009`. Sin VPN, el hook compara con
la copia local y lo dice; no bloquea nunca.

## 4. Instalar el hook

En la configuración de Claude Code (`settings.json`), evento `SessionStart`:

```json
{ "hooks": { "SessionStart": [ { "hooks": [ { "type": "command",
  "command": "node \"<home>/.claude/skills/ux-a-desarrollo/hooks/avisar-cambios-ux.mjs\"" } ] } ] } }
```

Pruebas: `node --test tests/*.test.mjs`. Codex no tiene un evento equivalente: ahí se corre
`seguir-paquete.mjs revisar --fetch` al empezar.
