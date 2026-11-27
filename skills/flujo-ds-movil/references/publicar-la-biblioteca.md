# Entregar y versionar la biblioteca móvil

Hoy la biblioteca se publica como **dependencia de Git con etiqueta**. GitLab es 14.2 y no tiene registro de
paquetes Dart, y pub.dev es público; el paquete tiene `publish_to: none`.

## Pasos

1. **Rama.** `feature/<tema>` desde `origin/develop` (o `fix/`). No se trabaja en `develop`, `release` ni `main`.
2. **Controles.** Los de `SKILL.md`: formato, análisis, pruebas, `--check` de tokens y contraste, con cifras reales.
3. **Versión.** `pubspec.yaml` y `CHANGELOG.md`. SemVer: componente o API nueva = versión menor; arreglo sin API nueva = parche; cambio que rompe a quien la usa = versión mayor.
4. **MR.** A `develop`, con César de revisor. La descripción dice qué cambia, el impacto para la app, la verificación con cifras y lo no verificado.
5. **Fusión.** La hace César o el responsable del repositorio, nunca el agente.
6. **Etiqueta.** Después de fusionar, César crea `flutter-vX.Y.Z` sobre el commit fusionado, y solo cuando `CHANGELOG.md` tiene la nota de esa versión. Una etiqueta creada antes publicaría el contenido viejo.
7. **Consumo.** `flotas-movil` cambia el `ref` de su dependencia a la etiqueta y vuelve a resolver (`flutter pub get`); `pubspec.lock` fija el commit exacto.

## Cómo lo instala el equipo

En `pubspec.yaml` de la app:

```yaml
dependencies:
  comsatel_ui_flutter:
    git:
      url: https://project.comsatel.com.pe/comsatel/development/products/clocator2/apps/mobile-ui-components.git
      ref: flutter-v0.1.0
```

El repositorio es privado: quien resuelve la dependencia necesita acceso de lectura y credenciales de GitLab
(la primera vez, `git` las pide). En CI hará falta un permiso para leer ese repositorio.

## Qué no se hace

- No se crea la etiqueta antes de fusionar ni «para adelantar».
- No se fija la dependencia a una rama `feature/*` más allá del primer MR: esa rama se borra al fusionar.
- No se publica en pub.dev ni se sube un APK a este repositorio.
