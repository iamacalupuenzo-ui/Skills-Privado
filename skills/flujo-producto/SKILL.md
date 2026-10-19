---
name: flujo-producto
description: >
  Flujo de trabajo dentro de los productos de Comsatel (web-backoffice, web-flotas, micro UIs
  y el BFF de prueba): aplicar una mejora usando el Design System sin salirse de él, subir la
  versión para que QA despliegue, publicar con MR a `develop` en parejas Shell + micro UI,
  verificar el despliegue y diagnosticar QA. Úsalo cuando pidan "aplica esta mejora en el
  producto", "sube esto a develop", "abre los MR", "¿por qué no carga QA?", "sube el DS a los
  productos" o "despliega a QA". No cambia el DS (usa flujo-ds) ni construye la pantalla desde
  cero (usa angular-product-builder).
metadata:
  version: "1.0.0"
---

# Flujo de producto

Trabajas en un repositorio de producto. Su `AGENTS.md` o `CLAUDE.md` manda sobre este skill.
Aquí vive qué hacer **después** de construir: usar el DS correctamente, versionar, publicar,
desplegar y comprobar.

## Referencias disponibles

- `references/uso-del-ds.md` — reglas de uso del DS en el producto. Leer antes de escribir UI.
- `references/version-en-cinco-sitios.md` — dónde sube la versión y por qué. Leer antes de publicar.
- `references/publicar-con-mr.md` — pasos de rama, suite, commit, push y MR en pareja. Leer al publicar.
- `references/diagnostico-qa.md` — cómo saber qué falta cuando QA no carga. Leer ante un error en QA.
- `references/bff-de-prueba.md` — el BFF de prueba de flotas y sus cuentas. Leer al tocar Web Cliente en QA.
- `../orquestador-desarrollo/references/hooks-bloqueantes.md` — qué frena el guardia (fusionar, etiquetar, push a `develop`, token) y qué pide confirmar (subir la rama, abrir el MR). El agente sube la rama, abre el MR y lo asigna a César; la fusión es de él.

## GUARD — verificar contexto

1. Identificar el repo y su pareja, si tiene (mapa de repos del skill `orquestador-desarrollo`).
2. Leer `AGENTS.md`/`CLAUDE.md`, la rama actual y `git status`. Si hay cambios sin commit que no son tuyos, decirlo.
3. Confirmar la versión del DS que fija `package.json` (exacta) y que Shell y micro UI coinciden.
4. Ver los MR abiertos y el estado del pipeline de `develop`.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `MEJORA` | «aplica», «cambia», «mejora» una pantalla | UI con el DS (`uso-del-ds.md`); pequeñas directas, grandes delegadas; verificar en el navegador |
| `PUBLICAR` | «sube», «abre el MR», «publica» | `version-en-cinco-sitios.md` y `publicar-con-mr.md`; solo con confirmación |
| `DS` | «sube el DS a los productos» | Rama `feature/ds-*`, `npm install` con el token, suite, MR en pareja (detalle en `flujo-ds`) |
| `QA` | «no carga», «verifica QA», «despliega» | `diagnostico-qa.md` |

## Reglas de trabajo con el DS (resumen; detalle en `references/uso-del-ds.md`)

- Imports por subpath: `import { Button } from '@comsatel/ui-components/button'`; nunca desde rutas internas del DS.
- Sin colores, píxeles ni `z-index` sueltos: todo sale de tokens (`--layout-*`, `--color-*`, `--radius-*`, `--font-*`).
- Sin `<select>` nativo: `cs-input-dropdown` o `cs-select`. Las propiedades booleanas y numéricas van con binding (`[disabled]="true"`).
- Si falta un componente: detenerse y preguntar; si se confirma, construirlo en el producto con una API migrable y registrar la brecha (`flujo-ds`, modo `BRECHA`).
- Los avisos de éxito o error no se dibujan en la micro UI: se piden al Shell por el bus (`notification.show`, contrato `NotificationV1`).
- El mock del BFF es el contrato propuesto: lo que el BFF real aún no ofrece se escribe en el mock y se registra como propuesta, no como hecho.

## Comportamientos bloqueantes

- **B1 — Nada se sube sin confirmación del usuario**, ni siquiera una rama.
- **B2 — Lo desplegable sube de versión en los cinco sitios** en el mismo MR (o en su commit propio): sin versión nueva QA no despliega.
- **B3 — La suite completa del repo corre antes de publicar** (lint, `test:ci`, mock y reglas si existen, `build`) con salida filtrada; se reportan cifras reales.
- **B4 — Shell y micro UI en pareja, mismo DS, fusionados y desplegados juntos.** Un MR sin su pareja se avisa.
- **B5 — Un permiso denegado se informa y se detiene la operación** (fusionar sin revisión, reintentar un despliegue con 403).
- **B6 — Tras fusionar se comprueba el despliegue**: jobs del pipeline de `develop` y QA en vivo, no solo «MR fusionado».
- **B7 — Un fallo de infraestructura se distingue de uno de código** leyendo el registro del job.
- **B8 — Nunca imprimir tokens.**

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «El MR se fusionó, ya está en QA» | El job `deploy to qa` puede haber fallado; comprobar (B6). |
| «Cambia un color, no hace falta versión» | Sin versión QA conserva la imagen (B2). |
| «Subo solo la micro UI, el Shell después» | Con DS distinto el remoto no carga (B4). |
| «La suite del módulo basta para publicar» | La completa corre antes de publicar (B3). |
| «Pongo el hex aquí y lo cambio luego» | Los hex sueltos no pasan la revisión; usar el token. |

## Señales de alerta

- Aparece `__Host-` o `Secure` en una cookie en un servidor local sin HTTPS: usar el nombre sin prefijo en local.
- Un MR de pareja se abre sin enlazar al otro.
- `grep` encuentra la versión vieja del DS en README, docs o specs.
- El servidor local muestra 404 de chunks del DS: reiniciar tras `ng test` o `ng build`.

## Formato de respuesta

Declarar el modo. Cerrar con: qué cambió, versión, MR (con pareja), suites con cifras, estado del despliegue en QA y lo pendiente por responsable.
