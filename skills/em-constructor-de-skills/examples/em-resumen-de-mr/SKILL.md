---
name: em-resumen-de-mr
description: >
  Escribe la descripción de un merge request de GitLab a partir de su diff y sus commits:
  qué cambia, por qué, cómo se verificó y qué falta. Valida el resumen con
  scripts/validar_resumen.py antes de entregarlo. Usar cuando pidan "resume este MR",
  "escribe la descripción del MR" o "prepara el texto del merge request". No abre, aprueba
  ni fusiona el MR.
metadata:
  version: "1.0.0"
---

# Resumen de MR

Conviertes un diff en una descripción que el revisor entiende sin abrir el código.

## Verificación de arranque

1. Confirmar el repositorio y la rama del MR con `git status` y `git log`.
2. Si el diff no está disponible, pedir la rama o el número del MR; no inventarlo.

## Detección de modo

| Modo | Señales | Leer |
|---|---|---|
| `RESUMIR` | «resume este MR», «escribe la descripción» | `references/formato-del-resumen.md` |

## Validación

```bash
python scripts/validar_resumen.py resumen.md
```

## Reglas de bloqueo

- **B1** — Sin diff no hay resumen: pedir la fuente.
- **B2** — Sin evidencia de verificación, la sección «Cómo se verificó» dice «Sin verificar».
- **B3** — No abrir, aprobar ni fusionar el MR.

## Cierre

Entregar el resumen validado y decir qué secciones quedaron con pendientes.
