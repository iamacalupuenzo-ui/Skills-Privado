# Formato del resumen

Leer en el modo RESUMIR, antes de escribir. Plantilla en `templates/resumen.plantilla.md`.

## Secciones obligatorias

| Sección | Qué lleva |
|---|---|
| `## Qué cambia` | Una frase por cambio visible, sin nombres de archivo salvo que sean el cambio |
| `## Por qué` | El problema o la historia que lo motiva |
| `## Cómo se verificó` | Comandos y resultado con cifras; si no hubo prueba, «Sin verificar» |
| `## Pendiente` | Lo que no entra en este MR; «Nada» si no hay |

✅ «Cómo se verificó: `npm run test:ci` con 412 pruebas en verde.»
❌ «Cómo se verificó: probado.» No dice qué ni con qué resultado.
