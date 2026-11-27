# Emulador Android, capturas y compilación

Datos verificados en Windows 11 con Flutter 3.47 (octubre de 2026). Lo que no se probó está marcado.

## Emulador

- Un AVD de ejemplo: Pixel 7 con Android 15 (API 35, `x86_64`, `google_apis`). Se arranca con el ejecutable `emulator` del SDK (`emulator -avd <nombre>`). `adb devices` debe mostrar el estado `device`; `offline` es transitorio mientras reinicia.
- **Memoria:** emulador, Chrome y Gradle juntos saturan la memoria del equipo. Cerrar programas antes de compilar; limitar Gradle en `android/gradle.properties` (por ejemplo `org.gradle.jvmargs=-Xmx3G` y `org.gradle.workers.max=2`).
- iOS no se compila ni se prueba en Windows.

## Compilar e instalar

1. Compilar con la salida a un archivo y leer el código de salida:
   `flutter build apk --debug > build.log 2>&1; echo "salida=$?"` (la app) o con `-t lib/main_login.dart` (la app de prueba del catálogo).
2. Solo si la salida es 0: `adb install -r build/app/outputs/flutter-apk/app-debug.apk` y comprobar `Success`.
3. Abrir: `adb shell am start -n <applicationId>/.MainActivity`. Parar antes con `adb shell am force-stop <applicationId>` para un arranque en frío.

La primera compilación tarda unos 6 minutos; las siguientes, de 3 a 5. El APK de depuración pesa unos 430 MB: no va en git ni cabe en el límite de artefactos por defecto de GitLab (100 MB).

## Capturas

- `adb shell screencap -p /sdcard/x.png` y luego `adb pull /sdcard/x.png <destino>`. **No** usar `adb exec-out screencap` por una tubería de PowerShell 5.1: corrompe el PNG.
- En Git Bash, anteponer `MSYS_NO_PATHCONV=1` a los comandos con rutas del teléfono (`/sdcard/...`); sin eso se convierten en rutas de Windows y fallan.
- En depuración el arranque es lento: las primeras capturas muestran la pantalla nativa de Flutter. Esperar y repetir hasta ver la app. Una captura de 0 bytes es un fallo de `adb`; se repite.
- Tocar un punto: `adb shell input tap <x> <y>` (coordenadas del tamaño real de la pantalla, por ejemplo 1080×2400, no las de la imagen reducida). Atrás: `adb shell input keyevent 4`.

## Cambiar el tema, la letra y el movimiento

- Tema oscuro o claro: `adb shell cmd uimode night yes` o `no` (verificado). La app sigue al sistema.
- Letra grande: `adb shell settings put system font_scale 2.0` (no verificado en este equipo; la prueba automática cubre el doble de tamaño con `TextScaler.linear(2)`).
- Reducir movimiento: `adb shell settings put global animator_duration_scale 0` (no verificado en este equipo; la prueba automática lo cubre con `disableAnimations`).

## Trampas de la compilación

1. **NDK.** Gradle exige la versión de NDK que fija Flutter (`flutter.ndkVersion`; con Flutter 3.47, 28.2.13676358). Si el `sdkmanager` no puede instalarla, una carpeta de relleno la satisface pero no trae `llvm-strip`: falla la tarea `stripDebugDebugSymbols`. La solución limpia es instalar el NDK real. Mientras tanto, solo en la copia local y sin commitear: `packaging { jniLibs { keepDebugSymbols += setOf("**/*.so") } }` en `android/app/build.gradle.kts`.
2. **Red de Gradle.** «Gradle threw an error while downloading artifacts from the network» puede ser pasajero (la compilación tarda 7 minutos y falla): comprobar que `dl.google.com` y Maven Central responden y reintentar una vez.
3. **Tuberías.** `flutter build ... | tail` seguido de `&& adb install` instala un APK viejo si la compilación falló: usar el código de salida (B3 de `SKILL.md`).
4. Gradle instala por sí solo Build-Tools y la plataforma que necesite; aceptar las licencias una vez (`flutter doctor --android-licenses`).

## Catálogo en web (Widgetbook)

- Se abre con `flutter run -d web-server --web-port 6010 --web-hostname localhost` desde `catalog/`; la primera carga tarda unos 20 s.
- Flutter web pinta en un lienzo, no en el DOM: para clicar en una prueba automatizada se usan coordenadas del ratón, no selectores.
- La navegación va por el `hash` de la URL con guiones (`componentes/csavatar/con-estado`, `pantallas/acceso/inicio`); el tema se cambia con `&theme={name:Oscuro}`.
- Se verifica con selector de tema claro y oscuro, tamaño de teléfono y escala de texto de 1 a 2.
