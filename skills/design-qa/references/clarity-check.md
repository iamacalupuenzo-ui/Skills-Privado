# Verificación de Claridad — TypeSafe (jev)

Chequeo automático, opcional y no bloqueante, que corre **después de Redactar y antes de
Crear** en modo REPORTE. Usa el modelo `jev` de TypeSafe (`score`) para puntuar si el texto
de la observación (Problema + Corrección) alcanza para que desarrollo actúe sin pedir más
contexto — antes de publicarla en Figma.

Validado en experimentos propios: separó con confianza ~1.0 una OBS completa (nodo, valor
exacto, impacto, prioridad) de una vaga ("no quedó como el diseño"), en ~250ms.

---

## Prerrequisito

Requiere `TYPESAFE_API_KEY` en el entorno de shell donde corre Claude Code (variable de
usuario de Windows, ya seteada — persiste en toda sesión nueva). Si por algún motivo no está:

**Skip silencioso.** No bloquear la creación de la OBS, no pedirle la key al usuario en medio
del flujo de QA. Mencionarlo una sola vez, al final del bloque de confirmación, como nota:
`(TypeSafe no configurado — chequeo de claridad omitido)`.

---

## Cuándo correrlo

Solo en modo REPORTE, sobre observaciones **Tipo: Problema mayor o Problema menor** —
una Nota no tiene Corrección, no aplica el mismo criterio de claridad.

## Cómo correrlo

Un único call con `Bash` (`curl`), usando el `Problema` + `Corrección` ya redactados
(paso 4, antes de crear el nodo en Figma):

```bash
curl -s https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<'JSON'
{
  "model": "jev-latest",
  "state": {
    "problema": "<texto exacto del campo Problema>",
    "correccion": "<texto exacto del campo Corrección>"
  },
  "questions": {
    "claridad": {
      "type": "score",
      "instructions": "¿Qué tan claro y accionable es `problema` + `correccion` para que un desarrollador lo resuelva sin pedir más contexto?",
      "criteria": [
        "No queda claro qué está mal ni qué se espera.",
        "Se entiende el problema pero falta referencia (componente, valor esperado).",
        "Se entiende el problema y hay alguna referencia, pero falta severidad o impacto.",
        "Problema, referencia e impacto claros; falta prioridad explícita.",
        "Problema, referencia, valor esperado, impacto y prioridad, todo explícito y verificable."
      ]
    }
  }
}
JSON
```

La respuesta trae `answers.claridad.score` (0–4) y `answers.claridad.confidence`.

---

## Interpretación

| Score | Significado | Acción |
|---|---|---|
| 0–1 | Falta referencia o el problema no queda claro | **No crear todavía.** Mostrar al usuario qué falta (valor exacto, estado, componente) y reescribir antes de continuar al paso 5 |
| 2 | Falta severidad o impacto | Crear, pero avisar en el bloque de confirmación qué se podría precisar |
| 3–4 | Accionable sin más contexto | Crear directo, sin nota adicional |

No tratar el score como bloqueante duro — es una segunda lectura, no un gate que impida al
usuario decidir. Si el usuario confirma que quiere crearla igual con score bajo, crearla y
seguir.

Si la llamada falla (network, 401, 429, etc.): **antes de dar el chequeo por omitido, intentar
el fallback de Vercel AI Gateway** (abajo). Si el fallback también falla, recién ahí tratarlo
igual que "TypeSafe no configurado" — skip silencioso, una línea de nota, seguir con la
creación normal. Nunca bloquear una OBS por un error de este chequeo secundario.

---

## Fallback — Vercel AI Gateway

Mismo chequeo, mismo modelo `jev`, pero vía el proxy de Vercel (`AI_GATEWAY_API_KEY`, ya
seteada como variable de usuario). Se usa **solo si la llamada directa a TypeSafe falló**, no
como ruta primaria.

```bash
node "C:\Users\emacalupu\.claude\skills\design-qa\scripts\vercel-clarity-fallback.mjs" \
  "<texto exacto del campo Problema>" \
  "<texto exacto del campo Corrección>"
```

Devuelve por stdout `{"score": N, "probabilities": {...}}` o `{"error": "..."}`. Puede
imprimir ruido adicional en stderr al cerrar el proceso (crash conocido de Node/libuv al
salir en Windows) — ignorarlo, lo único que importa es el JSON de stdout.

**Estado actual (2026-09-21): requiere tarjeta cargada en la cuenta de Vercel.** Sin eso, el
Gateway devuelve `"AI Gateway requires a valid credit card on file..."` incluso con key válida.
Mientras no esté resuelto, este fallback también termina en skip silencioso — es esperado, no
es un bug del script. Cargar la tarjeta es una acción financiera del usuario en
vercel.com/d/~/ai, no algo que el skill deba resolver.
