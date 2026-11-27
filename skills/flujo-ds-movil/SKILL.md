---
name: flujo-ds-movil
description: >
  Flujo de trabajo dentro de la biblioteca de componentes móvil de Comsatel (`mobile-ui-components`,
  paquete Dart `comsatel_ui_flutter`): agregar o cambiar un componente `Cs*`, regenerar los tokens
  desde Angular, mantener el tema claro y oscuro con contraste AA, actualizar el catálogo en
  Widgetbook, versionarla con SemVer y entregarla por MR. Úsalo cuando pidan "agrega este
  componente a la biblioteca Flutter", "cambia este widget Cs", "regenera los tokens de Dart",
  "actualiza el catálogo móvil" o "prepara la versión 0.2.0 de la biblioteca móvil". No construye
  pantallas de la app (usa flujo-app-movil), no cambia el Design System de Angular (usa flujo-ds)
  y no verifica en el emulador (usa verificar-movil).
metadata:
  version: "1.0.0"
---

# Flujo de la biblioteca de componentes móvil

Trabajas dentro de `mobile-ui-components`. Su `README.md` manda sobre este skill: léelo antes de
tocar nada. Aquí vive el orden de trabajo y las trampas que ya costaron tiempo.

## Referencias disponibles

- `references/tokens-y-roles.md` — cómo se generan los tokens desde Angular, los roles de color accesibles `...Aa` y la regla de contraste que hace fallar el generador. Leer al tocar colores, texto o un componente nuevo.
- `references/publicar-la-biblioteca.md` — versión, notas, MR, etiqueta `flutter-vX.Y.Z` y cómo la consume la app. Leer al entregar.

## GUARD — verificar contexto

1. Estás en `mobile-ui-components` (existen `pubspec.yaml` con el paquete `comsatel_ui_flutter`, `tool/generar_tokens.mjs` y `catalog/`). Si no, derivar a `flujo-app-movil`.
2. Leer `README.md` y `CHANGELOG.md`; confirmar la versión de `pubspec.yaml` y las etiquetas existentes.
3. **Pedir confirmación antes de cambiar un componente**: explicar qué cambia y por qué, con evidencia, y esperar el visto bueno (B2).
4. Leer los MR abiertos: no abrir un cambio que se pise con otro.
5. Confirmar que la fuente de tokens es `develop` de `ui-components` y no una rama vieja (el generador imprime de qué commit lee).

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `COMPONENTE` | «agrega/cambia/arregla» un widget `Cs*` o una plantilla | Rama `feature/` o `fix/` desde `origin/develop`; construir, probar, catálogo, MR |
| `TOKENS` | «regenera los tokens», cambió el paquete de Angular | `node tool/generar_tokens.mjs`, y `--check` para comprobar que coincide |
| `TEMA` | color, contraste, modo oscuro, un texto que no se lee | Roles `...Aa` y `test/contraste_test.dart`; ver `references/tokens-y-roles.md` |
| `CATALOGO` | «muestra este estado», «agrega la pantalla al catálogo» | Casos de uso en `catalog/lib` (componentes y pantallas) |
| `ENTREGAR` | «versiona», «sube», «prepara la 0.x» | `references/publicar-la-biblioteca.md` |

## Cómo se construye un componente

- **Estructura, estados y variantes salen de Angular; los valores, nunca.** Se lee el componente de `ui-components` para saber qué props, estados y variantes tiene, y todo valor sale de los tokens. Si el componente no existe en Angular, se pregunta antes de inventarlo.
- Nombre con prefijo `Cs` (`CsButton`), un archivo en `lib/src/` y su export en `lib/comsatel_ui_flutter.dart`.
- **Solo tokens:** colores con `context.cs.<rol>`, medidas con `CsPadding`, `CsGap`, `CsSize`, `CsRadius`, texto con `CsTextStyles`, movimiento con `CsDuration`. Ningún hexadecimal ni píxel suelto.
- **Roles accesibles:** texto de apoyo, texto de marca y bordes de control usan `textSubtleAa`, `textBrandAa`, `borderControlAa`, `fill*Aa` y `onFillAa`. Los tokens de Angular no llegan a AA en oscuro; los roles sí.
- **Estados:** reposo, hover, presionado, foco visible, deshabilitado y, donde aplique, cargando, error y seleccionado. Foco visible con teclado (Enter y Espacio) además del toque.
- **Accesibilidad:** nombre accesible (`Semantics`), encabezados anunciados como tales, decorativos excluidos, y que nada se corte con letra al doble de tamaño.
- **Movimiento:** una animación que no comunica información se detiene si la persona pidió reducir el movimiento (`MediaQuery.disableAnimationsOf`).
- **Área táctil:** los tamaños de Angular quedan por debajo de 44 a 48 px; en móvil se usa el tamaño `lg` para lo que se toca. Registrar la decisión si un componente nuevo necesita otra medida.
- **Íconos:** hasta que haya un set de íconos de Comsatel se usan los de Material; está pendiente de decisión y se declara.
- **Logo:** dos versiones del mismo dibujo, oscura y blanca (tema oscuro). El vectorial oficial y su versión para fondo oscuro están pendientes de marca; la blanca actual es derivada.

## Controles que deben pasar antes de dar un cambio por terminado

- `dart format` sin cambios, `flutter analyze` sin hallazgos y `flutter test` en verde, en la biblioteca y en `catalog/`.
- `node tool/generar_tokens.mjs --check`: el archivo generado coincide con Angular.
- Prueba de contraste (`test/contraste_test.dart`) para todo componente nuevo, en claro y oscuro.
- Caso en el catálogo para cada estado, y revisado en el emulador o en el catálogo web (`verificar-movil`).
- Actualizar `CHANGELOG.md` y, si cambia el alcance, el `README.md`.

## Trampas que ya costaron tiempo

1. Un `Container` con `alignment` se expande a todo el espacio: usar `Center(widthFactor: 1, heightFactor: 1)`.
2. `CircularProgressIndicator` trae 4 px de relleno: poner `padding: EdgeInsets.zero`.
3. Los nombres de token que empiezan con número llevan una `x` (`x2xl`).
4. Una animación infinita impide `pumpAndSettle` en las pruebas: usar `pump` con duración o apagarla con `disableAnimations`.
5. Las fuentes se declaran en el paquete (`packages/comsatel_ui_flutter/Manrope`); la app que lo usa no las copia.
6. El texto de un SVG no se dibuja en Flutter: el logo se rasteriza (PNG a 4×) desde el SVG de Angular.
7. En Windows, los scripts de generación con acentos o `$` en `node -e` se corrompen: usar archivos.

## Comportamientos bloqueantes

- **B1 — La etiqueta `flutter-vX.Y.Z` va después de fusionar a `develop`.** La crea César, no el agente.
- **B2 — La biblioteca no se cambia sin confirmación.** Un cambio aquí afecta a todas las pantallas de la app.
- **B3 — Un componente nuevo se confirma antes de construirse.** No se inventa para tapar un hueco de una pantalla.
- **B4 — El archivo de tokens generado no se edita a mano.** Se regenera; si un valor tiene un formato desconocido, el generador falla en vez de adivinar.
- **B5 — Un contrato de contraste que no se cumple no se rodea.** Se corrige el rol, no se excluye el componente de la prueba.
- **B6 — Función nueva = versión menor, nunca parche.** Un arreglo sin API nueva = parche.
- **B7 — Un fallo de infraestructura no es un fallo del cambio.** Un error de red de Gradle o de `pub get` se reintenta una vez antes de culpar al código.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «El gris de Angular se ve bien en claro» | En oscuro no llega a 4,5:1; se usa el rol `...Aa` (B5). |
| «El componente es solo para esta pantalla, lo dejo en la app» | Se pregunta; si falta en el sistema, se construye aquí (B3). |
| «Edito el archivo de tokens para ajustar un valor» | Se rehace en el generador o en Angular (B4). |
| «Es una función nueva pero chica, va como parche» | Función nueva = versión menor (B6). |

## Señales de alerta

- El generador de tokens lee de una copia de `ui-components` en una rama que no es `develop`.
- Una prueba de contraste que antes detectaba hallazgos y ahora pasa sin que cambiara el componente.
- Un `Text` con `color:` en hexadecimal o un `SizedBox` con un número suelto.
- El catálogo no muestra el estado deshabilitado, con error o cargando de un componente nuevo.

## Formato de respuesta

Declarar el modo. Cerrar con: qué cambió, qué controles corrieron (cifras reales), qué se vio en el emulador o en el catálogo, y qué falta.
