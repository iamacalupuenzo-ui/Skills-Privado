# Verificación en el navegador y accesibilidad

## Navegador (Playwright o equivalente)

- Ingresar con la cuenta de prueba, ir a la ruta, esperar la carga y medir; no fiarse solo de la captura.
- **Lectura de estilos:** `getComputedStyle` y `getBoundingClientRect` dan altura, ancho, relleno, fuente aplicada y `scrollbar-gutter`. Útil para responder «¿mide 24 px?».
- **Conducir Angular en desarrollo:** `window.ng.getComponent(elemento)` da acceso al componente y a sus servicios (por ejemplo, para fijar una tipografía sin abrir el selector).
- **Clic real en popovers:** un `click()` por script puede no abrir un popover que cierra al perder el foco; usar el clic del navegador.
- **Diálogo de salida:** con cambios sin guardar el navegador muestra `beforeunload`; aceptar y repetir.
- **Sesión:** reiniciar un mock cierra la sesión; limpiar cookies a propósito también.
- **Selector de archivos:** abrir un `<input type="file">` deja un modal pendiente en la herramienta; cerrarlo (cancelar) antes de seguir.
- **Consola:** distinguir errores nuevos de los de sesiones viejas (la red del equipo puede cortarse y llenar el log de `ERR_NAME_NOT_RESOLVED`); repetir con una carga limpia antes de concluir.

## Accesibilidad

- Teclado: Tab recorre en orden lógico; flechas en tabs, radios, sliders y listas; Escape cierra popovers y devuelve el foco al disparador.
- Nombres accesibles: botones de ícono con `aria-label`; sliders con `aria-valuetext` legible.
- Estado no solo por color: texto o ícono acompañan (por ejemplo, el contraste dice «Bien (AA)» y marca con ícono).
- Regiones vivas `polite` con espera de unos 800 ms, no un anuncio por tecla.
- Pestañas con error o advertencia: marca visible y nombre accesible («Colores y tipografía, con advertencia»).

## Contraste (WCAG 2.2)

- Texto: mínimo 4.5:1 (AA); texto grande y componentes: 3:1. Mostrar la relación obtenida y el mínimo.
- Umbral de linealización sRGB: 0.04045.
- Redondear **hacia abajo** a dos decimales al mostrar la relación, para no mostrar «4.50» junto a un «no cumple».
- Un color heredado no se evalúa hasta que se cambie (se dice con texto).

## Qué se reporta

Para cada verificación visual: ruta, cuenta, qué se midió y el resultado; una captura solo cuando aporta algo que los números no dicen.
