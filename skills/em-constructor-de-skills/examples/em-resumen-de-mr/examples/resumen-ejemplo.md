## Qué cambia

- El borde de `cs-input-dropdown` en estado de error tiene el mismo grosor que `cs-input`.

## Por qué

En la pantalla de Recuperos el campo con error se veía más fino que los demás (OBS-12).

## Cómo se verificó

- `npm run test:ci`: 412 pruebas en verde.
- Captura en el navegador a 1440 px y a 390 px con el estado de error.

## Pendiente

Nada.
