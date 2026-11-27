# Mapa de repositorios móviles

Estado verificado el 2026-10-29. Releer GitLab antes de afirmar versiones: cambian a diario.

Raíz GitLab: `comsatel/development/products/clocator2/apps/` (servidor `project.comsatel.com.pe`, solo por VPN).

## Repositorios

- **`mobile-ui-components`** — la biblioteca de componentes Flutter (paquete Dart `comsatel_ui_flutter`). Contiene los tokens generados desde la biblioteca de Angular, el tema claro y oscuro, los componentes `Cs*`, las plantillas móviles, el catálogo en Widgetbook (`catalog/`) y una app de prueba del acceso. Es de diseño y desarrollo, sin lógica de negocio.
- **`flotas-movil`** — la app de producto (Móvil Cliente de CL2 Flotas, Android e iOS). Usa la biblioteca como dependencia de Git. Su primera versión es una base para que el equipo de desarrollo la refactorice: lo de demostración está marcado en su README.
- **`flotas-movil-bff`** — el backend de esa app. Al 2026-10-29 solo tiene README; la autenticación real irá detrás del contrato `AuthRepository` de la app.
- **`ui-components`** (web, Angular) — fuente de los tokens y referencia de estructura, estados y variantes de cada componente. Nunca de valores sueltos. Su flujo es `orquestador-desarrollo`, no este.

## Cómo se relacionan

- Los tokens salen de `ui-components` y se convierten a Dart con `tool/generar_tokens.mjs` de la biblioteca. La fuente correcta es la rama `develop` de `ui-components` (en una copia con una rama vieja los colores y la tipografía salen distintos).
- La app depende de la biblioteca por Git (`pubspec.yaml`, `ref`), fijada por commit en `pubspec.lock`. GitLab 14.2 no tiene registro de paquetes Dart y pub.dev es público, por eso se publica como dependencia de Git con etiqueta `flutter-vX.Y.Z`.
- La biblioteca y la app van en dos repositorios y dos MR. **La biblioteca se fusiona primero**; después la app cambia su `ref` a la etiqueta de esa versión.

## Ramas y quién fusiona

- Trabajo: `feature/*` desde `origin/develop`; MR a `develop`.
- Las fusiones y las etiquetas las hace César (`cquevedo`) o el responsable del repositorio. **El agente no fusiona ni etiqueta.** Sube la rama `feature/*`, abre el MR a `develop` y lo asigna a César.
- `develop`, `main` y `release` están protegidas: nadie empuja directo.

## Entorno de desarrollo

- Flutter 3.47 o superior (Dart 3.13). Para web, el catálogo se abre con `flutter run -d web-server`. Para Android, un emulador (por ejemplo Pixel 7 con Android 15) o un teléfono con depuración USB. iOS no se compila en Windows.
- Al 2026-10-29 ninguno de los dos repositorios tiene CI (`.gitlab-ci.yml`): la verificación es local. El CI de Angular usa una imagen réplica corporativa porque el runner no descarga imágenes oficiales de Docker Hub; con Flutter pasará lo mismo y hay que pedir la imagen a infraestructura.
- El APK no va en git. Su lugar es `flotas-movil`, como artefacto o paquete de GitLab cuando exista el CI.
