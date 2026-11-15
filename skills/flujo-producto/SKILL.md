---
name: flujo-producto
description: >
  Flujo de trabajo dentro de los productos de Comsatel (web-backoffice, web-flotas, micro UIs
  y el BFF de prueba): aplicar una mejora usando el Design System sin salirse de él, nombrar la
  rama por historia (CLF_Feature_<n>), subir la versión, publicar con MR a `integration` (DEV)
  en parejas Shell + micro UI, verificar el despliegue y diagnosticar DEV o QA. Úsalo cuando
  pidan "aplica esta mejora en el producto", "sube esto", "abre los MR", "súbelo a DEV",
  "separa la rama por historia", "¿por qué no carga QA?" o "sube el DS a los productos". No cambia el DS (usa flujo-ds) ni construye la pantalla desde
  cero (usa angular-product-builder).
metadata:
  version: "1.3.0"
---

# Flujo de producto

Trabajas en un repositorio de producto. Su `AGENTS.md` o `CLAUDE.md` manda sobre este skill.
Aquí vive qué hacer **después** de construir: usar el DS correctamente, versionar, publicar,
desplegar y comprobar.

**Nuestro rol y hasta dónde llegamos.** Enzo es UX Engineering y apoya en el frontend.
Construimos las pantallas de cada historia en el shell y la micro UI, con el mock como contrato
propuesto, y las llevamos a **DEV** por `integration`. No subimos a QA: desarrollo toma nuestra
rama, conecta el backend real y lleva la historia a `develop`. Si una micro UI existe solo con
README (sin código), la empezamos nosotros siguiendo el estándar de César de las otras micro UI.

## Referencias disponibles

- `references/uso-del-ds.md` — reglas de uso del DS en el producto. Leer antes de escribir UI.
- `references/version-en-cinco-sitios.md` — dónde sube la versión y por qué. Leer antes de publicar.
- `references/publicar-con-mr.md` — flujo de ramas de CL2 (`CLF_Feature_<n>` → `integration` → DEV; nunca `integration` → `develop`), suite, push y MR en pareja. Leer al publicar o al crear una rama.
- `references/diagnostico-qa.md` — cómo saber qué falta cuando QA no carga. Leer ante un error en QA.
- `references/bff-de-prueba.md` — el BFF de prueba de flotas y sus cuentas. Leer al tocar Web Cliente en QA.
- `references/evidencia-de-avance.md` — capturas y descripción de cómo funciona en la tarea FRONT, la bitácora de construcción y la página de servidores. Leer al terminar cada paso verificado (B12).
- `references/hooks-bloqueantes.md` — qué frena el guardia (fusionar, etiquetar, push a `develop` o `integration`, MR de `integration` a `develop`, token) y qué pide confirmar (subir la rama, abrir el MR). El agente sube la rama y abre el MR; fusiona quien revisa (Luis en productos, César en el DS).

## GUARD — verificar contexto

1. Identificar el repo y su pareja, si tiene (`references/mapa-de-repos.md`: repos, rutas, puertos y parejas).
2. Leer `AGENTS.md`/`CLAUDE.md`, la rama actual y `git status`. Si hay cambios sin commit que no son tuyos, decirlo.
3. Confirmar la versión del DS que fija `package.json` (exacta) y que Shell y micro UI coinciden.
4. Ver los MR abiertos y el estado de `develop` e `integration` (último commit, versión del producto y del DS).
5. Identificar la historia (issue de collaboration) de lo que se construye: de ahí sale el nombre de la rama.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `MEJORA` | «aplica», «cambia», «mejora» una pantalla | UI con el DS (`uso-del-ds.md`); pequeñas directas, grandes delegadas; verificar en el navegador |
| `RAMAS` | «separa la rama», «¿cómo se llama la rama?» | Una rama `CLF_Feature_<n>` por historia, apiladas si comparten código; respaldo local antes de separar (`publicar-con-mr.md`) |
| `PUBLICAR` | «sube», «abre el MR», «publica», «súbelo a DEV» | `version-en-cinco-sitios.md` y `publicar-con-mr.md`: MR a `integration`, revisor Luis; solo con confirmación |
| `DS` | «sube el DS a los productos» | Primer commit (`chore(ds)`) de la rama de la historia que lo necesita; `npm install` con el token, suite, MR en pareja (detalle en `flujo-ds`). Una `-pre` del DS se fija solo para probar en la rama: a `integration` llega la estable |
| `ENTORNO` | «no carga», «verifica DEV o QA», «despliega» | `diagnostico-qa.md` (DEV sale de `integration`; QA, de `develop`) |

## Reglas de trabajo con el DS (resumen; detalle en `references/uso-del-ds.md`)

- Imports por subpath: `import { Button } from '@comsatel/ui-components/button'`; nunca desde rutas internas del DS.
- Sin colores, píxeles ni `z-index` sueltos: todo sale de tokens (`--layout-*`, `--color-*`, `--radius-*`, `--font-*`).
- Sin `<select>` nativo: `cs-input-dropdown` o `cs-select`. Las propiedades booleanas y numéricas van con binding (`[disabled]="true"`).
- Si falta un componente: detenerse y preguntar; si se confirma, construirlo en el producto con una API migrable y registrar la brecha (`flujo-ds`, modo `BRECHA`).
- Los avisos de éxito o error no se dibujan en la micro UI: se piden al Shell por el bus (`notification.show`, contrato `NotificationV1`).
- El mock del BFF es el contrato propuesto: lo que el BFF real aún no ofrece se escribe en el mock y se registra como propuesta, no como hecho.

## Comportamientos bloqueantes

- **B1 — Nada se sube sin confirmación del usuario**, ni siquiera una rama.
- **B2 — Lo desplegable sube de versión en los cinco sitios** en el mismo MR (o en su commit propio): sin versión nueva DEV y QA conservan la imagen vieja. Cada rama apilada lleva su propia versión.
- **B3 — La suite completa del repo corre antes de publicar** (lint, `test:ci`, mock y reglas si existen, `build`) con salida filtrada; se reportan cifras reales.
- **B4 — Shell y micro UI en pareja, mismo DS, fusionados y desplegados juntos.** Un MR sin su pareja se avisa.
- **B5 — Un permiso denegado se informa y se detiene la operación** (fusionar sin revisión, reintentar un despliegue con 403).
- **B6 — Tras fusionar se comprueba el despliegue**: jobs del pipeline de `integration` y DEV en vivo, no solo «MR fusionado».
- **B7 — Un fallo de infraestructura se distingue de uno de código** leyendo el registro del job. Solo el de infraestructura se reintenta, con confirmación; el de código se corrige, no se reintenta.
- **B8 — Nunca imprimir tokens.**
- **B9 — El estado de `develop` e `integration` se lee de la API, no de la copia local.** Antes de ramificar, de versionar o de escribir en un MR, se compara su último commit con el de la API; antes de subir se hace una mezcla de prueba contra `integration`, y tras abrir el MR se comprueba `has_conflicts` (`publicar-con-mr.md`).
- **B10 — Una rama por historia, con el nombre del equipo.** `CLF_Feature_<n>`, con `n` = IID del issue de la historia en collaboration. Una rama con dos historias se separa antes de subir.
- **B11 — Nuestros MR de producto van a `integration`, nunca a `develop`, e `integration` nunca va a `develop`.** Llevar la historia a QA es de desarrollo.
- **B12 — Cada paso verificado deja evidencia en Notion** (Enzo, 2026-11-15). Al terminar un paso (construido, probado y visto en el navegador): capturas a 1440 px (y 390 px si cambia en el celular) de cada estado, revisadas antes de subirlas, y en la tarea FRONT lo completado y cómo funciona. Después se marca el paquete en la bitácora de construcción y, si cambió un servidor, una rama o un usuario de prueba, se actualiza la página de servidores. Detalle: `flujo-producto/references/evidencia-de-avance.md`. Un paso sin evidencia no se reporta como terminado.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «El MR se fusionó, ya está en DEV» | El despliegue de `integration` puede haber fallado; comprobar (B6). |
| «Abro el MR directo a `develop`, es más rápido» | `develop` es QA y no es nuestro tramo; el MR va a `integration` (B11). |
| «Subo las dos historias juntas, comparten archivos» | Se separan y se apilan: cada historia se revisa y llega a `develop` por su lado (B10). |
| «Cambia un color, no hace falta versión» | Sin versión el entorno conserva la imagen (B2). |
| «Subo solo la micro UI, el Shell después» | Con DS distinto el remoto no carga (B4). |
| «La suite del módulo basta para publicar» | La completa corre antes de publicar (B3). |
| «Las capturas las subo cuando abra el MR» | Se suben al terminar cada paso; al final no se recuerda cada estado (B12). |
| «Pongo el hex aquí y lo cambio luego» | Los hex sueltos no pasan la revisión; usar el token. |
| «Hice `git fetch`, `develop` está al día» | En algunos clones el `fetch` trae una sola rama y `origin/develop` queda viejo; traerlo explícito y compararlo con la API (B9). |

## Señales de alerta

- Aparece `__Host-` o `Secure` en una cookie en un servidor local sin HTTPS: usar el nombre sin prefijo en local.
- Un MR de pareja se abre sin enlazar al otro.
- `grep` encuentra la versión vieja del DS en README, docs o specs.
- El servidor local muestra 404 de chunks del DS: reiniciar tras `ng test` o `ng build`.
- Un MR recién abierto con `has_conflicts: true`: la rama partió de un `develop` viejo o choca con lo integrado por otros.
- Una rama `feature/*` en un repo de producto, o una rama con cambios de dos historias.
- Un MR con origen `integration` y destino `develop`.

## Formato de respuesta

Declarar el modo. Cerrar con: historia y rama, qué cambió, versión, MR (con pareja y revisor), suites con cifras, estado del despliegue en DEV, el enlace a la tarea FRONT con sus capturas (B12) y lo pendiente por responsable.
