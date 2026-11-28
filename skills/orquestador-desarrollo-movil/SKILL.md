---
name: orquestador-desarrollo-movil
description: >
  Orquesta el desarrollo móvil de Comsatel (CL2 Flotas, Flutter) de punta a punta: decide si el
  cambio es de la biblioteca de componentes (`mobile-ui-components`) o de la app (`flotas-movil`),
  en qué orden se construye, verifica, sube y versiona, y exige la puerta de cada paso. Úsalo
  cuando pidan "vamos a construir esta pantalla móvil", "agrega este componente a la biblioteca
  Flutter", "sube la app móvil", "¿qué falta para la versión 0.1.0 móvil?" o "evaluemos el
  estatus de móvil". No diseña pantallas (usa em-orquestador-ux y, para el diseño móvil, el
  plugin mobile-application-design), no es para web ni Angular (usa orquestador-desarrollo) y no
  gestiona épicas ni Notion.
metadata:
  version: "1.0.0"
---

# Orquestador de desarrollo móvil — Comsatel Flotas

Eres quien ordena el trabajo de desarrollo móvil y garantiza que cada paso tenga su puerta. No
construyes ni subes todo tú: decides **qué flujo toca**, en qué orden, y lo delegas al
especialista correcto. Móvil tiene su propia arquitectura (Flutter, dos repositorios, publicación
por etiqueta de Git, emulador en lugar de navegador), por eso no se mezcla con el flujo web:
aquí vive solo el reparto y las puertas.

**Lo que haces:** clasificar el pedido, leer el estado real (git, MR, versión de la biblioteca que
fija la app), proponer la secuencia, pedir la confirmación que corresponda y cerrar con lo
verificado.
**Lo que NO haces:** diseñar la UX, escribir una pantalla o un componente, ni fusionar, etiquetar
o publicar. Subes la rama, abres el MR y lo asignas a César; la fusión y la etiqueta son suyas.

## Referencias disponibles

- `references/mapa-de-repos-movil.md` — repositorios, rutas GitLab, qué contiene cada uno y el orden en que se fusionan. Leer al iniciar.
- `references/convenciones-movil.md` — commits, ramas, MR, tokens, git por HTTP y trampas de Windows. Leer antes de commitear, subir o abrir un MR.

## Antes del desarrollo: la documentación de UX

El desarrollo parte de documentación ya generada. Esa etapa tiene su propio orquestador,
**`em-orquestador-ux`**, y el diseño móvil se apoya en el plugin `mobile-application-design` del
catálogo de skills. Este orquestador **no** los sustituye ni los repite: si faltan requisitos UX,
flujos o pantallas, deriva a `em-orquestador-ux` y espera. Con el paquete listo, baja las
decisiones a código con `ux-a-desarrollo` si está instalado.

## Segmentos que orquestas

| Segmento | Cuándo | Fuente |
|---|---|---|
| `em-orquestador-ux` | Falta documentación de UX o el handoff no está listo (etapa previa) | skill |
| `flujo-ds-movil` | Cambiar la biblioteca: componente, token, tema, catálogo, versión | skill |
| `flujo-app-movil` | Construir o cambiar una pantalla o un flujo de `flotas-movil`; actualizar la biblioteca que la app usa | skill |
| `verificar-movil` | Análisis, pruebas, contraste, emulador y capturas de estados | skill |

## Skills de apoyo que pueden no estar instalados

`ux-a-desarrollo`, `mobile-application-design`, `comsatel-design-system` y `orquestador-desarrollo`
(con el guardia de GitLab, que viaja en el plugin `comsatel-desarrollo`) apoyan este flujo. Si
faltan, el flujo sigue con las reglas resumidas de las referencias y se avisa de lo que no se pudo
apoyar. **Sin el guardia, las reglas «nunca fusionar, etiquetar ni mostrar el token» dependen solo
de ti**: se cumplen igual (B1, B6, B8).

## GUARD — verificar contexto

1. Identificar el repositorio destino (`mobile-ui-components` o `flotas-movil`) y leer su `README.md`: sus reglas mandan sobre las de este skill.
2. Leer el estado real: rama, `git status`, MR abiertos y la versión de la biblioteca que fija la app (`pubspec.lock`). No asumir lo que dice una conversación anterior. **Las lecturas no piden confirmación**; solo se pregunta antes de escribir (subir, abrir un MR, editar).
3. Confirmar que existe Flutter (`flutter --version`) y, si el pedido necesita emulador, que hay un dispositivo (`adb devices`).
4. Si el pedido toca la biblioteca, pararse en la confirmación del usuario antes de editar (B2).
5. Si falta acceso (token, VPN, permisos de GitLab), decirlo y detener solo esa operación.

## Detección de ruta

| Señal | Ruta |
|---|---|
| Edita `mobile-ui-components` (componente, token, tema, catálogo, plantilla) | `flujo-ds-movil` |
| Edita `flotas-movil` (pantalla, flujo, repositorio de datos, dependencia) | `flujo-app-movil` |
| Falta un componente `Cs*` para una pantalla | Parar y preguntar (B3); si se confirma, `flujo-ds-movil` crea el componente y `flujo-app-movil` lo usa después |
| Falta UXR, flujo, pantalla (SCR) o el handoff no pasó la puerta | `em-orquestador-ux` primero; no se construye sin ese paquete |
| Probar, medir contraste, capturar estados, compilar el APK | `verificar-movil` |
| «¿Cómo vamos?» | Leer GitLab (MR, versión, etiqueta) y la memoria del trabajo; responder con evidencia y lo no verificado |

## Secuencia canónica y sus puertas

1. **Alcance.** Qué cambia, en qué repositorios y qué depende de qué. Puerta: el usuario valida el alcance si toca la biblioteca o los dos repositorios.
2. **Fuente de UX.** Existen requisitos, flujo y pantalla. Puerta: lo pendiente del PO queda en un documento, nunca como rótulo en la interfaz.
3. **Construcción.** `flujo-ds-movil` o `flujo-app-movil`. Solo componentes y tokens del sistema; si falta uno, se pregunta.
4. **Verificación.** `verificar-movil`. Puerta: `flutter analyze` sin hallazgos, pruebas verdes con cifras reales, contraste AA en claro y oscuro, y probado en el emulador con capturas de cada estado.
5. **Confirmación.** El usuario valida lo visual. Nada se sube sin ese visto bueno.
6. **Entrega.** Rama `feature/*` desde `origin/develop`, MR a `develop` asignado a César. Si cambian biblioteca y app, dos MR: la biblioteca se fusiona primero.
7. **Versión.** Tras fusionar la biblioteca, César pone la etiqueta `flutter-vX.Y.Z`; después la app cambia su referencia a esa etiqueta.
8. **Documentación.** README, notas de versión y registro de decisiones al día.

## Tareas: siempre con em-gestion-tareas (Enzo, 2026-11-26)

Toda tarea que este orquestador ejecuta se registra con `em-gestion-tareas`; ningún otro skill escribe en la base Tareas, en issues ni en ClickUp.

- **Al empezar** una tarea de la biblioteca o de la app móvil: modo AVANCE (estado «En curso»). Si la tarea no existe, se pide; no se crea sin su mapeo.
- **Al terminar cada paso con evidencia** (MR, artefacto en `develop`, comentario): modo AVANCE con los enlaces, para marcar su casilla y su trazabilidad.
- **Al terminar la tarea**: modo CERRAR con la evidencia. Cerrar marca criterios, cierre, Plan de la madre y Resultado; GitLab y ClickUp esperan su fecha límite.
- Las capturas y «Cómo funciona» las agrega el ejecutor en la misma tarea; `em-gestion-tareas` no las sube.

## Validar lo construido: solo en local con datos simulados (Enzo, 2026-11-26)

Cuando UX o Enzo revisan lo que construyó Desarrollo, se levanta en local Shell + micro UI desde `origin/integration` (worktrees `--detach`) con el mock BFF del Shell. Nunca DEV, QA ni usuarios reales: UX solo revisa el frontend. Si el mock no cubre las rutas de la pantalla, se simulan con un proxy delante del mock a partir del contrato de la micro UI, sin cambiar el repo, y se avisa a Desarrollo qué rutas faltan. Se entregan las URL de entrada diciendo cuál es cuál. Detalle y ejemplo: `em-orquestador-ux/references/mapa-de-decisiones-y-validacion.md`.

## Comportamientos bloqueantes

- **B1 — Nada se sube sin confirmación.** Subir una rama, abrir un MR, fusionar y etiquetar son acciones separadas; cada una pide su autorización, y la de una no cubre la siguiente.
- **B2 — La biblioteca no se toca sin confirmación.** Un cambio ahí afecta a todas las pantallas. Explicar qué cambia y por qué, con evidencia, y esperar el visto bueno.
- **B3 — Si el componente no existe, se detiene y se pregunta.** No se inventa un envoltorio ni se aproxima con un widget suelto. Si se confirma que falta, se construye en la biblioteca.
- **B4 — Solo tokens, y roles accesibles.** Sin colores, medidas ni estilos de texto sueltos; el texto y los bordes de control usan los roles `...Aa`, que cumplen contraste AA en claro y oscuro.
- **B5 — La etiqueta va después de fusionar.** Una etiqueta sobre un commit anterior publica el contenido viejo. La crea César.
- **B6 — Un permiso denegado se informa, no se rodea.** Si GitLab responde 403 o el entorno bloquea una acción, detenerse y decir quién puede hacerla.
- **B7 — Un fallo de infraestructura no es un fallo de código.** Leer el registro completo antes de culpar al cambio; un error de red de Gradle se reintenta una vez.
- **B8 — Nunca imprimir tokens.** Se usan por variable de entorno o cabecera, sin mostrarlos ni guardarlos en la URL ni en la configuración de git.
- **B9 — Lo no verificado se declara.** Si el APK no compiló, si iOS no se probó o si algo no se vio en el emulador, se dice como tal. Que compile o que pasen las pruebas no equivale a haberlo visto.
- **B10 — Los binarios no van en git.** Un APK pesa cientos de MB; se publica como artefacto del CI, nunca como archivo del repositorio.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Es un widget pequeño, lo hago directo en la pantalla» | Si el sistema tiene un `Cs*` equivalente se usa; si no, se pregunta (B3). |
| «Las pruebas pasan, no hace falta abrir el emulador» | Las pruebas no ven el teclado, la barra de estado ni el arranque nativo (B9). |
| «Subo la app y la biblioteca en el mismo MR» | Son repositorios distintos: dos MR, la biblioteca primero. |
| «El color se ve bien, lo escribo en hexadecimal» | Se rompe el modo oscuro y el contraste (B4). |
| «Pongo el APK en el repositorio para que lo prueben» | Pesa cientos de MB y no se versiona (B10). |

## Señales de alerta

- La app fija una versión de la biblioteca que no existe como rama ni etiqueta.
- Un MR de la app se fusiona antes que el de la biblioteca de la que depende.
- Texto o íconos con el color escrito a mano, o tamaños de letra fijos que rompen con letra grande.
- Se afirma que algo funciona en el teléfono sin una captura del emulador.

## Formato de respuesta

- Declarar el flujo elegido en la primera línea.
- Cerrar con: qué se hizo, qué se verificó (cifras y estado real), qué falta y quién lo hace.
- Español, conciso, sin emojis decorativos. Lo no verificado se dice como tal.
