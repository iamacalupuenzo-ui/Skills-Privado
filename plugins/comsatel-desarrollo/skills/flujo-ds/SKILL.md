---
name: flujo-ds
description: >
  Flujo de trabajo dentro del Design System de Comsatel (`ui-components`, paquete
  `@comsatel/ui-components`): cambiar un componente o una guía, versionarlo con SemVer,
  publicarlo (cada rama publica su prerelease; main publica la estable con el job manual
  `publish`), registrar brechas en GAPS.md y planear cómo lo consumen los productos. Úsalo
  cuando pidan "cambia este componente del DS", "publica el DS 1.x", "lleva el DS a release",
  "registra esta brecha del sistema" o "sube el DS a los productos". No construye pantallas de
  producto (usa flujo-producto) ni audita tokens (usa comsatel-design-system).
metadata:
  version: "1.4.0"
---

# Flujo del Design System

Trabajas dentro de `ui-components`. El `AGENTS.md` de ese repositorio manda sobre este skill:
léelo antes de tocar nada. Aquí vive el orden de publicación y las trampas que ya costaron
tiempo.

## Referencias disponibles

- `references/publicar-el-ds.md` — qué publica cada rama (`-dev`, `-qa`, `-pre`, estable), quién hace cada paso y cómo verificarlo. Leer al publicar.
- `references/subir-ds-a-productos.md` — qué versión fija un producto según el momento (estable, `-pre` solo en la rama, copia local) y cómo se migra. Leer antes de cambiar el DS de un producto.
- `scripts/revisar_ds.py` — revisa la versión del DS que fija un producto (exacta, sin prerelease superada por una estable, lock, pareja) y si el código usa subpaths o valores que la versión publicada no tiene. Copia idéntica de la de `flujo-producto`; `npm test` del catálogo exige que coincidan. Pruebas: `python -m unittest discover -s scripts/tests`.
- `references/hooks-bloqueantes.md` — qué frena el guardia (etiquetas `ds-v*`, `npm publish`, push a ramas protegidas) y por qué: la estable la publica el pipeline de `main` y su etiqueta la crea el job `tag ds`, no el agente.
- `references/respuesta-de-cierre.md` — estructura única de la respuesta que cierra un paso (resultado, «Lo que hice», «Lo que necesito de ti», «Lo siguiente»). Leer antes de cerrar.

## GUARD — verificar contexto

1. Estás en `ui-components` (existe `projects/comsatel-ds/package.json` y `GAPS.md`). Si no, derivar a `flujo-producto`.
2. Leer `AGENTS.md` y `docs/versionado.md`; confirmar la versión actual en `develop`, `release` y `main`.
3. **Pedir confirmación antes de cambiar un componente**: explicar qué cambia y por qué, con evidencia (por ejemplo, reproducir el defecto en el navegador), y esperar el visto bueno.
4. Leer los MR abiertos: no abrir un cambio que se pise con otro.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `CAMBIO` | «cambia/arregla/agrega» un componente, token o guía | Rama `feature/` o `fix/` desde `origin/develop`, controles, MR a `develop` |
| `BRECHA` | «registra», «falta un componente», «anota esto para el DS» | `npm run gap:report -- "Qué falta" "Qué usar en su lugar" "Por qué o estado"` en una rama aparte |
| `PUBLICAR` | «publica», «lleva a release», «saca la estable», «etiqueta» | `references/publicar-el-ds.md`: el agente abre los MR; Enzo fusiona a `develop` y `release`; César fusiona a `main` y ejecuta `publish` |
| `CONSUMIR` | «sube el DS a los productos» | `references/subir-ds-a-productos.md` |

## Versionado (docs/versionado.md)

- Un paquete SemVer. **Función nueva = versión menor, nunca parche.** Un arreglo sin API nueva = parche.
- Cada guía declara «Disponible desde X.Y». Las marcas Nuevo/Actualizado solo cubren la versión actual y la anterior (`npm run check:versions` lo hace cumplir).
- Un cambio de API o de distribución exige `docs/releases/<versión>.md` con resumen, impacto para consumidores y verificación.
- Ramas que cambian la librería van en cadena, no en paralelo: cada una con su versión.
- **Retirar un componente es en dos pasos.** Primero se marca obsoleto en una versión menor (`@deprecated` en el código, aviso en su guía con la tabla de equivalencias, y en el catálogo la marca «Obsoleto» con `deprecated: true` en `nav.ts`, que no caduca como «Nuevo»). Se retira en la mayor siguiente, después de confirmar con el arquitecto qué productos lo usan. Ejemplo: `Tag` quedó obsoleto en la 1.16 a favor de `Badge`.

## Controles que deben pasar antes de dar un cambio por terminado

- `npm run check:docs` (guías, props, accesibilidad, imports de entrada, versiones).
- `npm run test:ci`.
- `npm run check:release-notes` antes de abrir el MR a `release`.
- Si cambias API o plantilla de un componente: `npm run docs` y completar las filas «Sin descripción» (`check:props` falla mientras quede alguna).

## Brechas del sistema

Si falta un componente o variante, no se inventa un envoltorio: se pregunta, y si se confirma, se registra en `GAPS.md` **en el mismo cambio**. Un componente se construye primero en el producto, con una API pensada para migrar (propiedades de entrada y evento de salida, solo tokens, sin dependencia del servicio de la pantalla), y entra al DS por olas cuando el diseño está validado.

## Comportamientos bloqueantes

- **B11 — Ciclo de retroalimentación obligatorio.** Al inicio y al cierre de cada desarrollo, mejora, análisis o definición, invocar a `ux-ui-orchestrator` y leer su [protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/ux-ui-orchestrator/references/ciclo-retroalimentacion.md) (resolver primero la versión local de ese skill o la fuente central). Sin informe de un agente de verificación previa distinto de quien construye, no empezar; sin sincronización comprobada, no declarar terminado. El orquestador conserva los formatos y dueños de artefactos; si falta el protocolo, detenerse y reportarlo.
- **B1 — Las etiquetas `ds-v*` no se crean a mano.** Desde la 1.15 la estable la publica el job manual `publish` de `main`, y el job `tag ds` crea la etiqueta. Los pipelines ignoran las etiquetas: una creada a mano no publica nada y ocupa la que el pipeline debe crear. (Hasta la 1.14 se publicaba por etiqueta; esa guía quedó obsoleta.)
- **B2 — No se abre el MR a `release` hasta que `check:release-notes` pase** y la versión base de `develop` tenga su nota.
- **B3 — Cada paso tiene su dueño.** El agente sube ramas y abre o actualiza MR. Enzo fusiona a `develop` y a `release`. César fusiona `release` → `main` y ejecuta `publish`. Si el entorno bloquea una fusión sin revisión, se informa (no se rodea).
- **B4 — La versión de los productos se fija exacta** (`"1.9.2"`, sin `^`): el DS es singleton compartido entre Shell y micro UIs.
- **B5 — Los cambios al DS no se publican sin confirmación del usuario.**
- **B6 — Un fallo de infraestructura del pipeline** (timeout al bajar una imagen de Docker Hub) se reintenta; no se interpreta como error del cambio.
- **B7 — Un MR apilado no se fusiona después de su base sin reapuntarlo.** Un MR apilado se fusiona en la rama de su base, no en `develop`. Hay dos órdenes seguros: (1) fusionar primero el de arriba (cae en la rama base) y después la base, que lleva ambos a `develop`; (2) fusionar la base y, **antes** de fusionar el de arriba, reapuntarlo a `develop` (`PUT /merge_requests/:iid` con `target_branch`), o borrar la rama de la base al fusionarla para que GitLab lo reapunte solo. Lo que falla es fusionar la base y luego el de arriba sin reapuntar: el cambio queda en una rama que ya se fusionó y no llega a `develop`. Se avisa a quien fusiona, y tras cada fusión se verifica por API que el cambio está en `develop` (un archivo nuevo con 200 en `ref=develop` y la versión en `package.json`). Ocurrió con !55 el 11-nov-2026: se fusionó en la rama de !54 cuando !54 ya estaba en `develop` y hubo que abrir !56.
- **B8 — Una versión sin publicar no se fija en un producto.** Para probarla se copia `dist/comsatel-ds` sobre `node_modules/@comsatel/ui-components` del producto y se reinicia su servidor; el `package.json` del producto sigue en la versión publicada hasta que exista la etiqueta. La copia no se versiona y un `npm ci` la borra. Antes de subir el producto, se listan las ramas del DS sin publicar de las que depende y se suben también (rama `feature/*`, sin MR), para que otra computadora pueda compilarlas; la verificación del producto se hace en un worktree aparte con `npm ci` y la copia del `dist` en **su** `node_modules`. Una prerelease ya publicada (por ejemplo `1.17.0-pre.157`) sí puede fijarse en la rama del producto para probar, pero ninguna prerelease llega a `integration`: antes del MR se cambia a `X.Y.Z`.
- **B9 — Otro agente en el mismo repositorio del DS se coordina, no se pisa.** Si dos ramas tocan el mismo archivo (por ejemplo, dos ramas de brechas sobre `GAPS.md`), se respalda la ajena (`respaldo/<rama>-<fecha>`), se apila sobre la tuya y el conflicto se resuelve conservando las filas de ambas. Los MR a `develop` llevan el orden en el título. Se le pide al usuario que avise al otro agente que su rama fue reescrita y que no vuelva a subir la versión anterior.

- **B10 — Una pieza de un producto que depende de una rama del DS sin publicar no va a MR.** Se documenta como bloqueada hasta la versión del DS que la publique (en la descripción de la rama y en el registro de brechas), y el producto queda fijado a la versión publicada. Se comprueba con `scripts/revisar_ds.py <producto> --ref <rama>`: un subpath o un valor (`variant="neutral"`, una escena de `cs-illustration`) que no existe en la versión publicada es la señal. Las ramas de DSP-006 en monitoring (121, 123, 119) usaban escenas, `variant="neutral"` y tipos de `unit-avatar` que solo existían en ramas del DS sin publicar; no compilaban contra la `1.17.0` y nadie lo vio porque se copiaba el `dist` en `node_modules`.
- **B12 — Un cambio del DS deja evidencia en Notion** (Enzo, 2026-11-15). Al terminar un cambio verificado: captura del componente en el catálogo (y en el producto que lo consume, si ya lo usa), revisada antes de subirla, con su URL del catálogo y una explicación breve de qué cambia para quien lo usa. Va en la tarea que lo pidió (o en la tarea FRONT que lo consume) y se marca en la sección «Design System» de la bitácora de construcción. Si cambia la versión que corre en local, se actualiza la página de servidores. Detalle: `flujo-producto/references/evidencia-de-avance.md`.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Es solo un cambio pequeño o un análisis; sincronizo después» | El inicio y el cierre del protocolo canónico son obligatorios; un pendiente de sincronización impide declarar terminado (B11). |
| «Es un cambio de estilo, no necesita nota de versión» | Si cambia lo que ven los consumidores, la nota explica el impacto (B2). |
| «Creo la etiqueta para que se publique» | Las etiquetas ya no publican; la estable sale con `publish` en `main` y la etiqueta la crea el pipeline (B1). |
| «César tarda; fijo la `-pre` y abro el MR a `integration`» | La `-pre` se queda en la rama; a `integration` solo llega la estable (B8). |
| «Sube la versión de los productos con `^`» | Con rangos, Shell y micro UI pueden quedar en versiones distintas y el remoto no carga (B4). |
| «La pieza del DS sale en la próxima versión, el MR del producto puede ir ya» | Sin la versión publicada el producto no compila en CI; la pieza queda bloqueada hasta entonces (B10). |
| «Lo registro en un ticket, no en GAPS.md» | El próximo agente lee GAPS.md, no tu bandeja. |
| «La captura ya está en el MR, no hace falta en Notion» | Enzo sigue el avance en la tarea y la bitácora, no en GitLab (B9). |

## Señales de alerta

- `check:release-notes` no encuentra la nota de la versión.
- Existe una etiqueta `ds-vX.Y.Z` sin que haya corrido `publish` en `main`: alguien la creó a mano.
- `publish` de `main` falla con «main no contiene la punta de release»: falta integrar `release`.
- `publish` falla con «sube la versión base»: la base de la rama ya salió como estable.
- Un producto fija un DS que no existe en el registro, o un MR a `integration` lleva una versión `-dev`, `-qa` o `-pre`.
- Un producto compila en local pero no en un worktree limpio con `npm ci`: usa algo que solo existe en una rama local del DS (B8).
- `revisar_ds.py` marca un subpath o un valor que la versión publicada no tiene: la pieza depende de una rama sin publicar (B10).
- La API de GitLab, `git fetch` o `git push` responden 503: es la VPN, no el cambio; se pide que la activen y no se reintenta en bucle.
- `npm run build:lib` falla con EBUSY: hay un `ng serve` del 4200 corriendo; detenerlo y reparar el enlace de `node_modules/@comsatel/ui-components`.

## Formato de respuesta

Declarar el modo al empezar. Al cerrar un paso, seguir `references/respuesta-de-cierre.md`: primera línea con el resultado, «Lo que hice:», «Lo que necesito de ti:» y «Lo siguiente…». En «Lo que hice» van los controles que corrieron (cifras) y en qué paso del camino está (`develop` con su `-qa`, `release` con su `-pre`, `main` con la estable y su etiqueta); lo que falta va en «Lo siguiente», con su responsable. Si el cambio se ve en pantalla, dejar la captura (ruta y enlace), la URL del componente en el catálogo y el enlace a la tarea de Notion donde quedó (B12).
