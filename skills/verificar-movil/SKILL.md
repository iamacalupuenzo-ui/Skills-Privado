---
name: verificar-movil
description: >
  Verifica con evidencia un cambio móvil de Comsatel (Flutter): análisis estático, pruebas,
  auditoría de contraste, compilación del APK, instalación en un emulador o teléfono Android y
  capturas de cada estado en claro, oscuro y letra grande. Úsalo cuando pidan "verifica esto en
  el teléfono", "pruébalo en el emulador", "compila el APK", "revisa el contraste de la
  biblioteca móvil", "muéstrame cada estado" o antes de entregar un MR móvil. No construye
  pantallas ni componentes (usa flujo-app-movil o flujo-ds-movil) y no verifica web ni Angular
  (usa verificar-calidad).
metadata:
  version: "1.0.0"
---

# Verificación móvil con evidencia

Verificar es **observar**, no suponer: que compile o que pasen las pruebas no equivale a haberlo
visto en el teléfono. Este skill ordena qué se corre, qué se mira y cómo se informa lo que se vio y
lo que no.

## Referencias disponibles

- `references/emulador-android.md` — emulador, `adb`, capturas, cambio de tema y de tamaño de letra, compilación del APK y las trampas que ya costaron horas. Leer antes de la primera compilación o captura.

## GUARD — verificar contexto

1. Identificar el repositorio (`mobile-ui-components` o `flotas-movil`) y la rama; leer `git status` y qué cambió.
2. Confirmar que existe Flutter (`flutter --version`) y, si hay que probar en el teléfono, un dispositivo (`adb devices` con el estado `device`, no `offline`).
3. Confirmar el dispositivo y el tema de partida antes de capturar; el tema del sistema decide el de la app.
4. Declarar de antemano qué se va a verificar y con qué: así lo no verificado queda a la vista.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `ESTATICO` | «analiza», «corre las pruebas», «¿pasa el contraste?» | `dart format`, `flutter analyze`, `flutter test`, `node tool/generar_tokens.mjs --check` (biblioteca) |
| `COMPILAR` | «compila el APK» | `references/emulador-android.md`, sección de compilación; revisar el código de salida |
| `EMULADOR` | «pruébalo en el teléfono», «muéstrame el flujo» | Instalar, abrir, interactuar, capturar cada estado |
| `CATALOGO` | «revisa el catálogo» | Widgetbook en web (`flutter run -d web-server`), con tema y escala de texto |
| `ENTREGA` | antes de abrir un MR | Cifras reales de todo lo anterior y lista de lo no verificado |

## Qué se corre y qué cifras se reportan

- **Formato y análisis:** `dart format` sin cambios y `flutter analyze` sin hallazgos, en la biblioteca y en `catalog/` (o en la app).
- **Pruebas:** `flutter test` con el conteo real (por ejemplo «53 pasan»). Una prueba que falla se lee completa antes de tocar nada.
- **Contraste (biblioteca):** `test/contraste_test.dart` recorre los componentes en claro y oscuro y en reposo, hover, presionado y foco. No se silencia ni se excluye un componente para que pase.
- **Tokens (biblioteca):** `node tool/generar_tokens.mjs --check`.
- **Compilación:** `flutter build apk --debug` (la app) o con `-t lib/main_login.dart` (la app de prueba del catálogo). Se lee el **código de salida**, no solo el final de la salida.

## Qué se mira en el emulador

Para cada pantalla o flujo, una captura por estado, y se **mira cada captura** antes de decir que está bien:

- Inicio, con errores de validación, con error del servidor, enviando y éxito (en los formularios).
- Claro y oscuro: texto legible, barra de estado con íconos visibles, ningún color que se pierda.
- Letra grande: nada se corta ni se solapa; la pantalla se desplaza.
- Teclado abierto: el campo activo queda visible y la pantalla se desplaza.
- Reducir movimiento: las animaciones se detienen.
- Arranque en frío: la pantalla de arranque y su paso a la siguiente.

Las capturas llevan nombre con el flujo, el orden y el estado (`movil-acceso-3-login-claro.png`), se guardan en
una carpeta propia y **nunca se borran ni se reutilizan capturas viejas** de otra versión.

## Comportamientos bloqueantes

- **B1 — Lo no verificado se declara.** Si el APK no compiló, si iOS no se probó o si un estado no se vio, el informe lo dice con esas palabras.
- **B2 — Una captura vacía, o igual a la de arranque nativo, no es evidencia.** Se repite.
- **B3 — El código de salida manda.** Un `| tail` o un `&&` mal encadenado puede instalar un APK viejo tras una compilación fallida: se guarda la salida en un archivo y se lee el código.
- **B4 — Un fallo de infraestructura no es un fallo del código.** Un error de red de Gradle («downloading artifacts from the network») se reintenta una vez; un fallo de memoria se resuelve cerrando programas.
- **B5 — No se modifica el proyecto para que pase la verificación.** Los ajustes de entorno (por ejemplo, de Gradle) se hacen en la copia local y no se commitean.
- **B6 — Nada de configuración global del equipo sin pedirla.** Scripts de Gradle en la carpeta de usuario, variables permanentes o cambios del sistema los autoriza quien es dueño del equipo.
- **B7 — Un token nunca se imprime** durante una verificación (`pub get`, `clone`, llamadas a la API).

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Las pruebas pasan, el teléfono tiene que verse igual» | Las pruebas no ven el teclado, la barra de estado ni el arranque nativo (B1). |
| «La captura se ve casi igual a la de antes» | Es evidencia solo si es del build actual y se miró (B2). |
| «Compiló, instalo» | Compiló si el código de salida es 0; si no, se instaló lo anterior (B3). |
| «Agrego esta línea al `build.gradle` y la subo, así compila en mi equipo» | Es un ajuste de entorno: va en la copia local (B5). |

## Señales de alerta

- Un conjunto de capturas con el mismo tamaño de archivo: probablemente la pantalla de arranque nativa.
- `adb devices` con el estado `offline`: el emulador se está reiniciando o se quedó sin memoria.
- `BUILD FAILED` seguido de «Success» de una instalación: se instaló un APK viejo.
- Un informe sin lista de lo no verificado.

## Formato de respuesta

Declarar el modo. Cerrar con: qué se corrió (cifras reales), qué se vio (con las capturas y su estado), qué **no** se verificó y por qué, y qué sigue.
