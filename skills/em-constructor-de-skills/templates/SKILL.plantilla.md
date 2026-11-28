---
name: em-<nombre-en-espanol>
description: >
  <Qué hace, en una o dos frases, en tercera persona.> Usar cuando pidan "<frase real 1>",
  "<frase real 2>" o "<frase real 3>". No <lo que no hace> (usa <otro skill>).
metadata:
  version: "1.0.0"
---

# <Nombre legible>

<Rol y resultado en dos o tres líneas: qué produce y para quién.>

## Verificación de arranque

1. <Comprobar que el contexto es el correcto: repositorio, rama, proyecto.>
2. <Comprobar que cada herramienta externa responde: `servidor:herramienta`.>
3. Si falta algo, detener solo la operación afectada y decir qué falta.

## Detección de modo

Declarar el modo en la primera línea. Leer su protocolo antes de actuar.

| Modo | Señales | Leer |
|---|---|---|
| `<MODO>` | «<frase>», «<frase>» | `references/protocolo-<modo>.md` |

## Guías por paso

| Cuándo | Leer |
|---|---|
| <Paso> | `references/<archivo>.md` |

## Validación

```bash
python scripts/<validador>.py <entregable>
```

## Reglas de bloqueo

Detalle en `references/reglas.md`.

- **B1** — <Acción prohibida concreta y su consecuencia.>
- **B2** — <...>

## Cierre

<Qué se informa al terminar: resultado, evidencia, pendientes y qué se necesita del usuario.>
