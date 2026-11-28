---
name: flujo-producto
description: >
  Flujo de trabajo dentro de los productos de Comsatel (web-backoffice, web-flotas, micro UIs
  y el BFF de prueba): aplicar una mejora usando el Design System sin salirse de él, nombrar la
  rama por historia (CLF_Feature_<n>), subir la versión, publicar con MR a `integration` (DEV)
  en parejas Shell + micro UI, verificar el despliegue y diagnosticar DEV o QA. Úsalo cuando
  pidan "aplica esta mejora en el producto", "sube esto", "abre los MR", "súbelo a DEV",
  "separa la rama por historia", "¿por qué no carga QA?", "sube el DS a los productos" o "integra con integration". No cambia el DS (usa flujo-ds) ni construye la pantalla desde
  cero (usa angular-product-builder).
metadata:
  version: "1.6.1"
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
- `references/subir-sin-fusionar.md` — verificar en un worktree limpio, subir sin MR con `-o ci.skip`, nota «NO FUSIONAR», estructura de ramas `feature/ds-<versión>` y reescritura sin push forzado. Leer cuando el trabajo depende de un DS sin publicar o piden subir sin fusionar.
- `references/orden-de-fusion-ds-sin-publicar.md` — las tres fases (DS, productos en pareja a `integration`, DEV) y cómo verificar que la versión está en el registro. Leer antes de planear la fusión de ese trabajo.
- `references/diagnostico-qa.md` — cómo saber qué falta cuando QA no carga. Leer ante un error en QA.
- `references/bff-de-prueba.md` — el BFF de prueba de flotas y sus cuentas. Leer al tocar Web Cliente en QA.
- `references/evidencia-de-avance.md` — capturas y descripción de cómo funciona en la tarea FRONT, la bitácora de construcción y la página de servidores. Leer al terminar cada paso verificado (B19).
- `references/integrar-con-integration.md` — simular la fusión con `integration`, integrarla con `git merge` en el worktree `fusion-integration` (nunca rebase ni push forzado), cadenas apiladas, push por avance rápido y MR con Luis. Leer antes de construir sobre una rama, antes de cada MR a `integration` y en el modo `INTEGRAR`.
- `scripts/simular_fusion.py` — `git merge-tree` de la base contra cada rama, sin tocar nada: choques, commits propios, cuánto va adelante la base y cadenas apiladas. Código 1 si hay choques.
- `scripts/revisar_ds.py` — versión exacta del DS, prerelease superada por una estable, lock, pareja y piezas (subpaths y valores) que la versión publicada no tiene. Código 1 si hay hallazgos. Pruebas de ambos: `python -m unittest discover -s scripts/tests`.
- `references/hooks-bloqueantes.md` — qué frena el guardia (fusionar, etiquetar, push a `develop` o `integration`, MR de `integration` a `develop`, token) y qué pide confirmar (subir la rama, abrir el MR). El agente sube la rama y abre el MR; fusiona quien revisa (Luis en productos, César en el DS).
- `references/respuesta-de-cierre.md` — estructura única de la respuesta que cierra un paso (resultado, «Lo que hice», «Lo que necesito de ti», «Lo siguiente»). Leer antes de cerrar.

## GUARD — verificar contexto

1. Identificar el repo y su pareja, si tiene (`references/mapa-de-repos.md`: repos, rutas, puertos y parejas).
2. Leer `AGENTS.md`/`CLAUDE.md`, la rama actual y `git status`. Si hay cambios sin commit que no son tuyos, decirlo.
3. Confirmar la versión del DS que fija `package.json` (exacta) y que Shell y micro UI coinciden.
4. Ver los MR abiertos y el estado de `develop` e `integration` (último commit, versión del producto y del DS).
5. Identificar la historia (issue de collaboration) de lo que se construye: de ahí sale el nombre de la rama. Si el equipo trabaja en `integration`, correr `scripts/simular_fusion.py <repo> <ramas>` antes de construir y antes de cada MR; con choques, pasar al modo `INTEGRAR` (B12).

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `MEJORA` | «aplica», «cambia», «mejora» una pantalla | UI con el DS (`uso-del-ds.md`); pequeñas directas, grandes delegadas; verificar en el navegador |
| `RAMAS` | «separa la rama», «¿cómo se llama la rama?» | Una rama `CLF_Feature_<n>` por historia, apiladas si comparten código; respaldo local antes de separar (`publicar-con-mr.md`) |
| `PUBLICAR` | «sube», «abre el MR», «publica», «súbelo a DEV» | `version-en-cinco-sitios.md` y `publicar-con-mr.md`: MR a `integration`, revisor Luis; solo con confirmación |
| `SUBIR SIN FUSIONAR` | «súbelo sin fusionar», «deja las ramas arriba», el código usa un DS sin publicar | `subir-sin-fusionar.md`; el orden posterior, `orden-de-fusion-ds-sin-publicar.md` |
| `INTEGRAR` | «integra con integration», «fusiona integration», `simular_fusion.py` da choques | `integrar-con-integration.md`: `git merge` en el worktree `fusion-integration`, puertas, push por avance rápido y MR a `integration` con Luis |
| `DS` | «sube el DS a los productos» | Primer commit (`chore(ds)`) de la rama de la historia que lo necesita; `npm install` con el token, suite, MR en pareja (detalle en `flujo-ds`). Una `-pre` del DS se fija solo para probar en la rama: a `integration` llega la estable |
| `ENTORNO` | «no carga», «verifica DEV o QA», «despliega» | `diagnostico-qa.md` (DEV sale de `integration`; QA, de `develop`) |

## Reglas de trabajo con el DS (resumen; detalle en `references/uso-del-ds.md`)

- Imports por subpath: `import { Button } from '@comsatel/ui-components/button'`; nunca desde rutas internas del DS.
- Sin colores, píxeles ni `z-index` sueltos: todo sale de tokens (`--layout-*`, `--color-*`, `--radius-*`, `--font-*`).
- Sin `<select>` nativo: `cs-input-dropdown` o `cs-select`. Las propiedades booleanas y numéricas van con binding (`[disabled]="true"`).
- Si falta un componente: detenerse y preguntar; si se confirma, construirlo en el producto con una API migrable y registrar la brecha (`flujo-ds`, modo `BRECHA`).
- Los avisos de éxito o error no se dibujan en la micro UI: se piden al Shell por el bus (`notification.show`, contrato `NotificationV1`).
- El mock del BFF es el contrato propuesto: lo que el BFF real aún no ofrece se escribe en el mock y se registra como propuesta, no como hecho.

## Validar lo construido: solo en local con datos simulados (Enzo, 2026-11-26)

Cuando UX o Enzo revisan lo que construyó Desarrollo, se levanta en local Shell + micro UI desde `origin/integration` (worktrees `--detach`) con el mock BFF del Shell. Nunca DEV, QA ni usuarios reales: UX solo revisa el frontend. Si el mock no cubre las rutas de la pantalla, se simulan con un proxy delante del mock a partir del contrato de la micro UI, sin cambiar el repo, y se avisa a Desarrollo qué rutas faltan. Se entregan las URL de entrada diciendo cuál es cuál. Detalle y ejemplo: `em-orquestador-ux/references/mapa-de-decisiones-y-validacion.md`.

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
- **B10 — Antes de subir o abrir un MR, cada rama se verifica en un worktree aparte con `npm ci`** (`lint`, `test:rules`, `test:ci`, `build`), sin tocar el worktree del `ng serve`. Una copia local del DS en `node_modules` oculta lo que no está publicado: las ramas del DS de las que depende se listan y se suben también (`subir-sin-fusionar.md`).
- **B11 — Una rama ya subida no se reescribe con push forzado ni borrándola y volviéndola a subir**, aunque el usuario lo autorice: el guardia lo bloquea y rodearlo cuenta como violarlo. Se verifica el SHA remoto con `git ls-remote` y se le da al usuario el comando `--force-with-lease` para que lo ejecute él con `!`.

- **B12 — Se simula la fusión con `integration` antes de construir y antes de cada MR.** `scripts/simular_fusion.py` sobre las ramas del trabajo; con choques se integra primero o se pregunta. Sin simular, el 17-nov-2026 se construyó en paralelo con el equipo la misma página y aparecieron 6, 7 y 13 choques en monitoring y 6 en web-flotas.
- **B13 — Se integra con `git merge`, nunca con rebase ni push forzado.** En el worktree `fusion-integration` (nunca en el del `ng serve`), con refs locales `fusion/<rama>`, conservando lo de ambos lados; en una cadena apilada se fusiona la base y se propaga de base a hija; se sube por avance rápido (`git push origin HEAD:refs/heads/<rama>`) y va por MR a `integration` con Luis de revisor. Un rebase reescribe una rama que otros ya leen y obliga a forzar el push, que el guardia bloquea.
- **B14 — `scripts/revisar_ds.py` pasa antes de cada commit que toca dependencias o UI.** Versión exacta, sin prerelease superada por una estable, lock alineado, pareja con la misma versión y sin piezas que la versión publicada no tiene. Las ramas de DSP-006 fijaban `1.17.0-pre.157` con la `1.17.0` publicada y usaban `variant="neutral"` y escenas que solo existían en una rama del DS: compilaban en local porque se copiaba el `dist` en `node_modules`.
- **B15 — Ciclo de retroalimentación obligatorio.** Al inicio y al cierre de cada desarrollo, mejora, análisis o definición, invocar a `em-orquestador-ux` y leer su [protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/em-orquestador-ux/references/ciclo-retroalimentacion.md) (resolver primero la versión local de ese skill o la fuente central). Sin informe de un agente de verificación previa distinto de quien construye, no empezar; sin sincronización comprobada, no declarar terminado. El orquestador conserva los formatos y dueños de artefactos; si falta el protocolo, detenerse y reportarlo.

- **B16 — Paridad KB-código obligatoria.** Antes de abrir el MR y al cerrar tareas de
  front/documentación, invocar `paridad-diseno-desarrollo`, modo KB-CODIGO, siguiendo su
  [protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/paridad-diseno-desarrollo/references/paridad-kb-codigo.md).
  Configuración/cobertura incompleta, falta de ejecución final, exit distinto de cero
  o contradicciones pendientes bloquean cierre y apertura; no usar un informe antiguo.
- **B17 — Una rama por historia, con el nombre del equipo.** `CLF_Feature_<n>`, con `n` = IID del issue de la historia en collaboration. Una rama con dos historias se separa antes de subir.
- **B18 — Nuestros MR de producto van a `integration`, nunca a `develop`, e `integration` nunca va a `develop`.** Llevar la historia a QA es de desarrollo.
- **B19 — Cada paso verificado deja evidencia en Notion** (Enzo, 2026-11-15). Al terminar un paso (construido, probado y visto en el navegador): capturas a 1440 px (y 390 px si cambia en el celular) de cada estado, revisadas antes de subirlas, y en la tarea FRONT lo completado y cómo funciona. Después se marca el paquete en la bitácora de construcción y, si cambió un servidor, una rama o un usuario de prueba, se actualiza la página de servidores. Detalle: `flujo-producto/references/evidencia-de-avance.md`. Un paso sin evidencia no se reporta como terminado.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «El MR solo publica lo ya probado» | Antes de abrirlo se repite KB-CODIGO con los commits finales de KB, Shell y micro UI; las pruebas funcionales no sustituyen paridad (B16). |
| «Es solo un cambio pequeño o un análisis; sincronizo después» | El inicio y el cierre del protocolo canónico son obligatorios; un pendiente de sincronización impide declarar terminado (B15). |
| «El MR se fusionó, ya está en DEV» | El despliegue de `integration` puede haber fallado; comprobar (B6). |
| «Abro el MR directo a `develop`, es más rápido» | `develop` es QA y no es nuestro tramo; el MR va a `integration` (B18). |
| «Subo las dos historias juntas, comparten archivos» | Se separan y se apilan: cada historia se revisa y llega a `develop` por su lado (B17). |
| «Cambia un color, no hace falta versión» | Sin versión el entorno conserva la imagen (B2). |
| «Subo solo la micro UI, el Shell después» | Con DS distinto el remoto no carga (B4). |
| «La suite del módulo basta para publicar» | La completa corre antes de publicar (B3). |
| «Las capturas las subo cuando abra el MR» | Se suben al terminar cada paso; al final no se recuerda cada estado (B19). |
| «Pongo el hex aquí y lo cambio luego» | Los hex sueltos no pasan la revisión; usar el token. |
| «Pasaron las 227 pruebas de `test:ci`, está listo» | Había 2 errores de lint y 9 incumplimientos de `test:rules`; se corren en cada iteración (B3, B10). |
| «Compila en mi máquina» | Compilaba porque el DS estaba copiado sobre `node_modules`; en un worktree limpio con `npm ci` falló (B10). |
| «El usuario autorizó el push forzado» | El guardia lo bloquea igual; se le da el comando para que lo ejecute él (B11). |
| «Hago rebase sobre `integration`, queda más limpio» | La rama ya está subida: reescribirla exige push forzado y rompe a quien la lee; se integra con `git merge` (B13). |
| «Resuelvo el choque quedándome con mi versión» | Se conserva lo de ambos lados; si se contradicen, se pregunta (B13). |
| «La prerelease es la misma 1.17.0» | Si la estable ya está publicada, se fija la estable; la prerelease puede traer piezas que la estable no tiene (B14). |
| «Compila en local, así que el DS publicado lo tiene» | Una copia del `dist` en `node_modules` lo oculta; `revisar_ds.py` y la compilación con `npm ci` en limpio lo muestran (B14). |
| «Hice `git fetch`, `develop` está al día» | En algunos clones el `fetch` trae una sola rama y `origin/develop` queda viejo; traerlo explícito y compararlo con la API (B9). |

## Señales de alerta

- Aparece `__Host-` o `Secure` en una cookie en un servidor local sin HTTPS: usar el nombre sin prefijo en local.
- Un MR de pareja se abre sin enlazar al otro.
- `grep` encuentra la versión vieja del DS en README, docs o specs.
- El servidor local muestra 404 de chunks del DS: reiniciar tras `ng test` o `ng build`.
- `git checkout <sha> -- package.json` cambió la `version` de la app: compararla con `origin/develop`.
- Un MR recién abierto con `has_conflicts: true`: la rama partió de un `develop` viejo o choca con lo integrado por otros.
- `simular_fusion.py` da choques con `integration` y se sigue construyendo sin integrar ni preguntar.
- Aparece `git rebase` o `--force` en el plan de integración.
- `package.json` fija `-pre.`, `-dev.` o `-qa.` del DS.
- Una rama de trabajo que no se llama `CLF_Feature_<n>` (salvo `feature/ds-*` o `chore/ds-*` del DS), o una rama con cambios de dos historias.
- Un MR con origen `integration` y destino `develop`.

## Formato de respuesta

Declarar el modo al empezar. Al cerrar un paso, seguir `references/respuesta-de-cierre.md`: primera línea con el resultado, «Lo que hice:», «Lo que necesito de ti:» y «Lo siguiente…». En «Lo que hice» van la historia y la rama, la versión, el MR (con su pareja y revisor), las suites con cifras, el estado del despliegue en DEV y el enlace a la tarea FRONT con sus capturas (B19); lo pendiente va por responsable en «Lo que necesito de ti» o «Lo siguiente».
