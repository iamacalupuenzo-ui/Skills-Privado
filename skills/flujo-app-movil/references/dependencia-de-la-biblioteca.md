# La biblioteca como dependencia de la app

## Cómo está declarada

En `pubspec.yaml` de `flotas-movil`:

```yaml
dependencies:
  comsatel_ui_flutter:
    git:
      url: https://project.comsatel.com.pe/comsatel/development/products/clocator2/apps/mobile-ui-components.git
      ref: <etiqueta o rama>
```

`pubspec.lock` fija el commit exacto (`resolved-ref`). Se versiona, porque es una app.

Mientras la biblioteca no tenga versión publicada, el `ref` apunta a la rama de su primer MR. Esa rama se
borra al fusionar: **al fusionar, cambiar el `ref` a la etiqueta `flutter-vX.Y.Z`** (o a `develop`) y volver
a resolver.

## Actualizar a una versión nueva

1. Confirmar que la etiqueta existe en GitLab (la crea César después de fusionar la biblioteca).
2. Cambiar el `ref` en `pubspec.yaml`.
3. `flutter pub get` (ver abajo) y revisar el cambio de `pubspec.lock`: `resolved-ref` debe ser el commit de la etiqueta.
4. `flutter analyze` y `flutter test`: si la biblioteca cambió una API, aparece aquí.
5. Probar el recorrido en el emulador (`verificar-movil`).
6. MR a `develop` con César; la descripción nombra la versión anterior y la nueva.

## Resolver `pub get` con credenciales sin escribirlas

El repositorio de la biblioteca es privado. `flutter pub get` llama a `git` por dentro, y `git` por HTTP no acepta
la cabecera `PRIVATE-TOKEN` (solo autenticación básica). Para pasarle la cabecera **sin guardarla** en ningún
archivo, define variables de entorno solo para ese comando:

- `GIT_CONFIG_COUNT=1`
- `GIT_CONFIG_KEY_0=http.extraHeader`
- `GIT_CONFIG_VALUE_0=Authorization: Basic <base64 de oauth2:TOKEN>`

El token sale de la variable de usuario `GITLAB_TOKEN`; no se imprime ni se escribe en la URL. Si tu equipo ya
tiene un gestor de credenciales de git, `flutter pub get` las usa y no hace falta nada más. Sin la VPN, el
servidor no responde.

## Errores frecuentes

- `Could not resolve host` o tiempo agotado: sin VPN.
- `Authentication failed` o 403: el token no tiene acceso de lectura al repositorio.
- `Git error ... couldn't find remote ref`: el `ref` apunta a una rama borrada; usar la etiqueta.
- El cambio no aparece tras actualizar el `ref`: se olvidó volver a resolver, o `pubspec.lock` sigue en el commit anterior.
