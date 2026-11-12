# Axe, móvil y teclado: medir en el navegador con números

Esta referencia sale de la verificación del Design System 1.14.0 en los cuatro productos (octubre de 2026). Sirve para decir «no hay violaciones de contraste» o «el teclado funciona» con una medida y no con una impresión.

## Cómo se ejecuta

- **Navegador propio, visible.** `playwright-core` con el Chrome instalado (`executablePath`) y `headless: false`, para que quien pide la verificación vea lo que ocurre. Nunca el perfil compartido de otras sesiones: puede estar bloqueado y no se cierra.
- **axe-core inyectado.** Se lee `axe.min.js` del `node_modules` de cualquier repo que lo tenga (el del DS lo trae) y se inyecta con `page.evaluate(código)`; después `axe.run(document, { runOnly: [...] })`.
- **Reglas que se miden:** `color-contrast`, `aria-required-attr` y `aria-valid-attr-value`. Se informa por regla: cuántos nodos y dos selectores de ejemplo. «0 violaciones» solo se dice de las reglas y las pantallas medidas.
- **Los dos temas.** El tema se cambia con `document.documentElement.setAttribute('data-theme', 'dark' | 'light')`; se mide en cada uno y se confirma que el token cambió (`getComputedStyle(document.documentElement).getPropertyValue('--color-text-base-subtle')`). Si el token no cambia, el tema no se aplicó y la medida no vale.
- **Qué se mide:** la pantalla en reposo y los estados que importan (cajón o modal abierto, lista desplegada, errores de validación visibles). Un estado no medido se declara como no medido.
- **Sin bloques de código del catálogo** cuando se mide el catálogo del DS: se excluyen del recorrido porque sus colores son los del resaltado, no los de los componentes.

## Móvil

- **Ventana de 390 × 844** con `deviceScaleFactor: 2`, `isMobile: true` y `hasTouch: true`.
- **Desborde horizontal:** `document.documentElement.scrollWidth` contra `clientWidth`. Deben ser iguales (por ejemplo 390 de 390). Una tabla que se desplaza **dentro de su contenedor** no cuenta como desborde de la página.
- **Menú colapsado:** en móvil el menú del Shell es un cajón inerte. Un clic sobre su texto expira por «element is inert». Se navega por el elemento visible del contenido (la tarjeta de inicio) o se abre antes el botón de menú.
- Capturar al menos el inicio, la lista, el cajón o formulario y, si hay, un estado de error. Guardarlas, no borrarlas.

## Teclado en un combobox o autocompletado

Qué se comprueba y cómo se lee:

1. **Un solo combobox por campo**, con nombre accesible (etiqueta asociada, p. ej. «País *»).
2. **Cerrado:** `aria-expanded="false"`. El `aria-controls` puede apuntar a un `id` que aún no existe; axe lo acepta.
3. **Se abre al teclear** (el `Autocomplete` del DS no se abre con Flecha abajo estando cerrado): `aria-expanded="true"`, el `listbox` de `aria-controls` **existe en el DOM**, hay opciones y `aria-activedescendant` apunta a una opción que existe.
4. **Flecha abajo y arriba** cambian la opción activa (el `id` de `aria-activedescendant` cambia).
5. **Enter** elige, cierra la lista (`aria-expanded` vuelve a `false`) y el foco queda en el campo.
6. **Escape con la lista abierta** cierra solo la lista: el foco sigue en el campo y el diálogo contenedor sigue abierto. Con la lista cerrada, Escape sí cierra el diálogo.
7. **Con un valor ya elegido:** Retroceso y volver a teclear reabre la lista; seleccionar todo (`Ctrl+A`) y teclear una letra también debe abrirla y conservar esa letra. (En el DS 1.14.0 esa última pierde la primera letra: está registrado como brecha.)
8. **Tab** sale del último campo hacia el siguiente elemento enfocable, sin atraparse.

Se lee el estado con `document.activeElement` y sus atributos tras cada tecla, con una espera corta (unos 300 a 500 ms) para que Angular pinte. Se reporta una línea por campo.

## Qué se reporta

Para cada pantalla: ancho, tema, regla de axe, cuántos nodos y el resultado. Para el teclado: el campo, la tecla y lo que cambió. Después, una línea de «No verificado» con lo que quedó fuera (otras pantallas, QA, el backend real). Una captura se agrega cuando muestra algo que los números no dicen.

## Trampas

- Un guion con la tecla equivocada da un falso fallo: antes de concluir que algo no funciona, leer cómo se diseñó el componente (`onKeydown`) y repetir la prueba.
- `ng test` o `ng build` con `ng serve` activo rompen los servidores (chunks 404): reiniciarlos antes de medir.
- Si la consola muestra 401 o 404 antes del inicio de sesión, no es un hallazgo de la pantalla; confirmar con una carga limpia.
