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
  version: "1.4.0"
---

# Verificar la calidad

Verificar es observar, no suponer. Cada afirmación de «funciona» lleva su evidencia: una cifra
de pruebas, una medida del navegador o una respuesta de QA. Lo que no se pudo observar se dice.

## Referencias disponibles

- `references/servidores-locales.md` — levantar, reiniciar y comprobar los servidores. Leer al iniciar y después de `ng test` o `ng build`.
- `references/navegador-y-accesibilidad.md` — verificación en navegador, accesibilidad y contraste. Leer al verificar UI.
- `scripts/puertas.py` — corre en orden `lint`, `test:rules` (si existe), `test:ci` y `build` sobre cada punta (exportada con `git archive` e instalada con `npm ci`, sin tocar el repo), resume con cifras y umbral de cobertura, repite sola la prueba que falla para marcar las inestables y separa lo que ya fallaba en la base de lo nuevo. Puerta obligatoria antes del push y del MR (B8).
- `scripts/puertos_libres.py` — revisa que estén libres los puertos del levantamiento (8082, 4400, 4401, 4202, 3000, 4200, 4201, 4203) y dice qué proceso ocupa cada uno. Antes de levantar servidores (B10). Pruebas de ambos: `python -m unittest discover -s scripts/tests`.
- `references/axe-movil-y-teclado.md` — cómo medir con axe, en móvil a 390 px y con el teclado en un combobox, con navegador visible y cifras. Leer antes de afirmar «sin violaciones» o «el teclado funciona».
- `references/respuesta-de-cierre.md` — estructura única de la respuesta que cierra un paso (resultado, «Lo que hice», «Lo que necesito de ti», «Lo siguiente»). Leer antes de cerrar.

## GUARD — verificar contexto

1. Saber qué cambió (rama, archivos) y qué repos toca.
2. Elegir el alcance de la prueba (tabla siguiente) según quién ejecuta y con qué fin.
3. Confirmar qué scripts existen en `package.json` (`test:ci`, `test:mock`, `test:rules`, `check:docs`, …): no todos los repos los tienen.
4. Antes de levantar servidores, correr `scripts/puertos_libres.py`; antes de un push o un MR, `scripts/puertas.py <repo> --refs <ramas>`.
5. Respetar el `CLAUDE.md` del repo: el piloto `capturas-recuperos` prohíbe `ng test` y `ng build` salvo que el usuario lo pida.

## Alcance de las pruebas

| Quién / cuándo | Qué corre | Qué no |
|---|---|---|
| Un agente delegado (Codex) durante el desarrollo | Los specs del módulo tocado y el test del mock correspondiente; reporta conteos y fallos | Nunca la suite completa ni `ng build` |
| Quien construye, tras cada iteración | Specs del módulo (`ng test --watch=false --include <ruta>`), `lint` y `test:rules` si existe | Dejar `lint` y `test:rules` para el final |
| Quien **publica**, antes de subir | Suite completa: `lint`, `test:ci`, `test:mock`, `test:rules` si existen y `build`, en un worktree aparte con `npm ci` | `ng build` en el worktree del `ng serve` |
| El DS | `check:docs`, `test:ci`, `check:release-notes` si va a etiquetarse | — |

Salida siempre **filtrada**: solo conteos (`Test Files`, `Tests`, `pass`, `fail`) y los fallos.

## Comportamientos bloqueantes

- **B1 — Se reporta lo observado**, con cifras. «Pasa» sin número no es un reporte.
- **B2 — Después de `ng test` o `ng build` se reinician los servidores locales** (se rompen: chunks 404 o `ngDevMode is not defined`).
- **B3 — La suite completa se corre antes de publicar**, aunque el módulo esté en verde.
- **B4 — Lo visual se verifica en el navegador** y se compara con el piloto o con la captura del responsable de diseño.
- **B5 — Lo no verificado se declara** (por ejemplo: no hay `helm` ni Docker, el BFF real no ofrece el contrato).
- **B6 — Un fallo se diagnostica antes de reintentar**: leer el mensaje; un spec que dependía de algo que cambió se actualiza, no se borra.
- **B7 — «Sin violaciones» y «el teclado funciona» llevan su medida**: axe por regla y por tema, ancho de ventana, y la tecla y el efecto observado (`axe-movil-y-teclado.md`). Lo no medido se declara.

- **B8 — `scripts/puertas.py` pasa antes del push y del MR.** Se muestra su tabla real por punta (cifras y umbral de cobertura). Un fallo que ya existía en la base también frena el MR: se corrige o se declara al revisor, separado de lo nuevo. En bo-tenants, `lint` fallaba por `@angular-eslint/no-input-rename` y `test:ci` de la 105 tenía 78,86 % de funciones con umbral 80 %: ambos frenaban el MR aunque no los hubiera causado el cambio.
- **B9 — No se verifican en paralelo los mismos recursos.** Dos suites a la vez (varios repos, o la suite con el `ng serve` y un build) compiten por CPU y disco y producen fallos falsos. Si una prueba falla en una corrida con carga, se repite sola antes de diagnosticar; si sola pasa, se reporta como inestable, no como arreglada. Una corrida de `test:ci` falló dos pruebas mientras se verificaban cuatro repos a la vez y sola pasó tres veces seguidas.
- **B10 — Los puertos se revisan antes de levantar.** `scripts/puertos_libres.py` dice qué proceso ocupa cada puerto; no se mata nada sin preguntar y el 3000 es del servidor MCP de draw.io (el mock del Backoffice va en el 3001 con `MOCK_PORT=3001` y `proxy.conf.json` cambiado solo en local, sin commit). Tabla y trampas en `servidores-locales.md`.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «`test:ci` está en verde, terminé la iteración» | Pasaron 227 pruebas con 2 errores de lint y 9 incumplimientos de `test:rules` (px sueltos, `::ng-deep`, `100vw`). Se corren en cada iteración. |
| «Ese fallo de lint ya estaba, no es mío» | Igual frena el MR; `puertas.py` lo separa como «ya fallaba» y se corrige o se declara (B8). |
| «Falló con los cuatro repos corriendo, pero ya sé qué es» | Primero se repite sola; si pasa, es inestable por carga (B9). |
| «Mato lo que esté en el 3000» | Es el servidor MCP de draw.io; el mock va en el 3001 (B10). |
| «Pasó el módulo, publico» | La suite completa puede romperse en otro lugar (B3). |
| «Los servidores siguen arriba» | Un puerto que escucha no prueba que sirva el código nuevo (B2). |
| «El test falla por un cambio mío, lo borro» | Se actualiza al nuevo comportamiento (B6). |
| «La captura se ve bien» | Medir con estilos computados (B4). |
| «En escritorio se ve bien, en móvil será igual» | Medir a 390 px: desborde del documento y axe (B7). |
| «La tecla no hizo nada, el componente falla» | Leer cómo se diseñó el componente antes de concluir; el `Autocomplete` abre al teclear, no con la flecha (B7). |

## Señales de alerta

- Un reporte de pruebas sin números.
- Un 404 de un chunk del DS en el navegador local.
- Un spec que espera un texto ya eliminado.
- Un servidor con el puerto ocupado por un proceso ajeno (el 3000 no se toca).
- Dos Shells apuntan al 4202: el de Flotas (monitoring) y el proxy del Backoffice para `/mfe/microui-bo-feature-flags`.
- Un reporte de MR sin la tabla de `puertas.py`, o con un fallo «que ya estaba» sin evidencia de la base.

## Formato de respuesta

Al cerrar un paso, seguir `references/respuesta-de-cierre.md`: primera línea con el resultado, «Lo que hice:», «Lo que necesito de ti:» y «Lo siguiente…». En «Lo que hice» va una línea por verificación: qué se corrió, cifra (`N de N`) y si quedó algo sin verificar.
