# Entorno y entrega (app móvil Flutter)

Leer cuando haya que compilar, mostrar el resultado al diseñador o delegar trabajo a otro agente. Las rutas son de la
computadora de origen del 25-nov-2026; en otra computadora verificar cada una.

## 1. Cómo se muestra el trabajo

El diseñador prueba en su propio celular. Entrega: un APK de **release arm64** y su ruta local; **no** levantar el
emulador salvo que lo pida. Las capturas y los APK se dejan en una carpeta local y no se suben (no se borran).

```
flutter analyze lib
flutter build apk --release -t lib/main_preview.dart --target-platform android-arm64
```

La vista previa (`lib/main_preview.dart` y `lib/preview/`) abre la pantalla con Unidades de ejemplo, sin sesión ni
BFF. **No se commitea**; su código está en la página de traspaso de Notion del frente móvil.

## 2. Ajustes locales que no se commitean

| Archivo | Ajuste | Para qué |
|---|---|---|
| `android/app/build.gradle.kts` | `packaging { jniLibs { keepDebugSymbols += "**/*.so" } }` | El NDK de relleno no trae `llvm-strip` |
| `android/gradle.properties` | `org.gradle.jvmargs=-Xmx3G -XX:MaxMetaspaceSize=1G` y `org.gradle.workers.max=2` | Poca memoria |
| `pubspec.yaml` | `dependency_overrides: path_provider_android: 2.2.23` | La 2.3 trae `jni` con CMake y exige el NDK real |
| `pubspec.lock` | Regenerado | Consecuencia |

Con un NDK real y memoria suficiente nada de esto hace falta.

## 3. Emulador

- AVD `cs_pixel7` (1080×2400, 420 dpi); el APK de release arm64 no se instala en él (es x86).
- Si se llena: `adb uninstall <paquete>`. Un APK de depuración universal puede pesar 1,4 GB.
- En Git Bash usar `MSYS_NO_PATHCONV=1` con las rutas de `adb shell` y `screencap`.
- Los ajustes `wm size` y `wm density` quedan en el AVD aunque se cierre: restaurar con `adb shell wm size reset` y
  `adb shell wm density reset`.

## 4. Ramas y MR

- Rama de trabajo propia, nunca la de otra persona. Una rama nueva se sube con
  `git push --set-upstream origin <rama>:<rama>` para que su upstream no apunte a la rama de origen.
- Un MR provisional lleva «Draft:» y «NO FUSIONAR» en el título, la descripción y un comentario. César (id 91) es
  revisor de todo MR. Nada se sube ni se abre sin orden expresa.

## 5. Delegar en Codex por Orca

Útil para ilustraciones y trabajo acotado. Trampas:

1. `--worktree current` abre el worker en el espacio de Orca, que puede ser otro repositorio (el Angular): el encargo
   debe traer la **ruta absoluta** del proyecto Flutter y pedir que verifique la rama.
2. El texto del encargo se pasa desde un archivo (`--spec "$(cat archivo)"`): las comillas invertidas dentro de comillas
   dobles en Git Bash se ejecutan como comandos y mutilan el texto.
3. Puede detenerse en «Update available»: se responde la opción «Skip» y no se actualiza nada global.
4. No pedirle APK ni emulador; que verifique con renders headless (`flutter test` temporal con `RepaintBoundary` y
   `toImage`) y borre esa prueba al terminar.
5. Revisar sus capturas uno mismo antes de darlas por buenas; su informe no es la evidencia.
6. Los workers abiertos no viajan a otra computadora.

## 6. Mosaicos del mapa

El respaldo (`FallbackBaseMap`) usa mosaicos de CARTO, que ahora piden clave (marca «API KEY REQUIRED»). La licencia
y la fuente definitiva están por confirmar con Arquitectura (DH-1239). La vista previa pasa `tileUrl` de OSM estándar.
