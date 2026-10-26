---
name: verificar-calidad
description: >
  Decide y ejecuta la verificación de un cambio de Comsatel con evidencia: qué pruebas correr
  según el alcance (módulo o suite completa), cómo comprobar en el navegador, accesibilidad y
  contraste, cómo levantar y reiniciar los servidores locales y cómo reportar cifras reales sin
  inundar el contexto. Úsalo cuando pidan "valida esto", "corre las pruebas", "levanta los
  servidores", "revisa en el navegador", "¿pasa todo?" o antes de publicar. No escribe el
  cambio (usa angular-product-builder) ni lo publica (usa flujo-producto o flujo-ds).
metadata:
  version: "1.0.0"
---

# Verificar la calidad

Verificar es observar, no suponer. Cada afirmación de «funciona» lleva su evidencia: una cifra
de pruebas, una medida del navegador o una respuesta de QA. Lo que no se pudo observar se dice.

## Referencias disponibles

- `references/servidores-locales.md` — levantar, reiniciar y comprobar los servidores. Leer al iniciar y después de `ng test` o `ng build`.
- `references/navegador-y-accesibilidad.md` — verificación en navegador, accesibilidad y contraste. Leer al verificar UI.

## GUARD — verificar contexto

1. Saber qué cambió (rama, archivos) y qué repos toca.
2. Elegir el alcance de la prueba (tabla siguiente) según quién ejecuta y con qué fin.
3. Confirmar qué scripts existen en `package.json` (`test:ci`, `test:mock`, `test:rules`, `check:docs`, …): no todos los repos los tienen.
4. Respetar el `CLAUDE.md` del repo: el piloto `capturas-recuperos` prohíbe `ng test` y `ng build` salvo que el usuario lo pida.

## Alcance de las pruebas

| Quién / cuándo | Qué corre | Qué no |
|---|---|---|
| Un agente delegado (Codex) durante el desarrollo | Los specs del módulo tocado y el test del mock correspondiente; reporta conteos y fallos | Nunca la suite completa ni `ng build` |
| Quien construye, tras cada iteración | Specs del módulo (`ng test --watch=false --include <ruta>`) y lint de lo cambiado | — |
| Quien **publica**, antes de subir | Suite completa: `lint`, `test:ci`, `test:mock`, `test:rules` si existen y `build` | — |
| El DS | `check:docs`, `test:ci`, `check:release-notes` si va a etiquetarse | — |

Salida siempre **filtrada**: solo conteos (`Test Files`, `Tests`, `pass`, `fail`) y los fallos.

## Comportamientos bloqueantes

- **B1 — Se reporta lo observado**, con cifras. «Pasa» sin número no es un reporte.
- **B2 — Después de `ng test` o `ng build` se reinician los servidores locales** (se rompen: chunks 404 o `ngDevMode is not defined`).
- **B3 — La suite completa se corre antes de publicar**, aunque el módulo esté en verde.
- **B4 — Lo visual se verifica en el navegador** y se compara con el piloto o con la captura del responsable de diseño.
- **B5 — Lo no verificado se declara** (por ejemplo: no hay `helm` ni Docker, el BFF real no ofrece el contrato).
- **B6 — Un fallo se diagnostica antes de reintentar**: leer el mensaje; un spec que dependía de algo que cambió se actualiza, no se borra.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Pasó el módulo, publico» | La suite completa puede romperse en otro lugar (B3). |
| «Los servidores siguen arriba» | Un puerto que escucha no prueba que sirva el código nuevo (B2). |
| «El test falla por un cambio mío, lo borro» | Se actualiza al nuevo comportamiento (B6). |
| «La captura se ve bien» | Medir con estilos computados (B4). |

## Señales de alerta

- Un reporte de pruebas sin números.
- Un 404 de un chunk del DS en el navegador local.
- Un spec que espera un texto ya eliminado.
- Un servidor con el puerto ocupado por un proceso ajeno (el 3000 no se toca).

## Formato de respuesta

Cerrar con una línea por verificación: qué se corrió, cifra (`N de N`), y si quedó algo sin verificar.
