# Problemas de entorno conocidos (Angular)

Leer este archivo SOLO cuando aparece uno de estos síntomas exactos — no es
lectura previa obligatoria para auditar o reconstruir un componente.

Contexto fijo: Angular CLI + Vite (dev server `ng serve`), puerto 4300,
proyecto `C:\Users\emacalupu\Documents\00 - Proyectos Enzo - V1\ui-components`. A diferencia del proyecto
React (Astro, puerto 4321, servidor manejado por el usuario en su propia
terminal), en Angular el servidor SÍ se maneja desde la sesión — ver punto 1.

## 0 — Assets públicos de una librería ESM y pre-bundling Vite

**Síntoma:** un componente de la librería compila y los PNG aparecen en
`npm pack --dry-run`, pero una aplicación Angular consumidora solicita la
imagen desde una carpeta de caché de Vite o recibe 404.

**Causa:** `new URL()` recibió una ruta dinámica, por ejemplo
``new URL(`../assets/${name}`, import.meta.url)``. Vite no puede descubrir y
reescribir un asset cuyo nombre se decide en runtime; `import.meta.url` pasa a
referir el módulo pre-empaquetado.

**Regla:** declarar una constante por asset con una ruta literal y seleccionar
las constantes después: `const ICON = new URL('../assets/icon.png',
import.meta.url).toString()`. No usar rutas absolutas `/assets/...`: rompen
`baseHref` y despliegues bajo subruta. Antes de publicar, instalar o empaquetar
la versión en una aplicación Angular consumidora y probar Vite con prebundle
activo. `ng serve --prebundle=false` solo sirve para diagnosticar, nunca como
instrucción permanente.

## 1 — La librería (`projects/comsatel-ds`) NO hace hot-reload

**Síntoma:** se edita cualquier archivo dentro de
`projects/comsatel-ds/src/lib/` (un componente `.ts/.html/.css`,
`public-api.ts`, `tokens.css`) y el navegador no refleja el cambio, o el
build falla con `TS2305: Module has no exported member` si se agregó un
export nuevo.

**Causa:** la app consume la librería vía el build compilado en
`dist/comsatel-ds` (path mapping `"comsatel-ds": ["./dist/comsatel-ds"]`),
no desde el código fuente directo — el watch normal de `ng serve` solo
vigila `src/app/`.

**Fix, en este orden exacto:**
```bash
cd "C:/Users/emacalupu/Documents/00 - Proyectos Enzo - V1/ui-components"
npx @angular/cli build comsatel-ds
```
Confirmar que termina con `✔ Built comsatel-ds` sin errores. Luego reiniciar
el dev server COMPLETO — no basta con que siga corriendo:
```bash
netstat -ano | grep ":4300" | grep LISTENING   # obtener el PID
taskkill //F //PID <pid>
cd "C:/Users/emacalupu/Documents/00 - Proyectos Enzo - V1/ui-components"
nohup npx ng serve --port 4300 > /tmp/ng-serve.log 2>&1 &
disown
```
Esperar a que el log muestre `Local: http://localhost:4300/` (o un `ERROR`
de compilación) antes de navegar a verificar — sondear el log en vez de
asumir que ya está listo.

## 2 — Cambios solo en `src/app/` (páginas, DemoShell, doc-page.css)

Estos SÍ hacen hot-reload normal — no hace falta build de librería ni
reinicio completo. Si el dev server sigue corriendo, el cambio llega solo
("Page reload sent to client(s)" o "Component update sent to client(s)" en
el log). Si el log muestra un `ERROR` de compilación (ej. `NG5002`, ver
`audit-checklist.md` C4), corregir el archivo y esperar el siguiente
rebuild automático — no reiniciar el servidor para esto.

## 3 — Puerto 4300 ocupado al relanzar (`Port 4300 is already in use`)

**Síntoma:** tras matar el proceso y relanzar `ng serve`, el log muestra
`An unhandled exception occurred: Port 4300 is already in use` — pero
INMEDIATAMENTE después puede aparecer un segundo bloque de compilación que
sí termina en `Local: http://localhost:4300/`, señal de que dos procesos
arrancaron casi al mismo tiempo (uno murió por el conflicto, el otro quedó
sirviendo).

**Fix:** no asumir que el servidor está roto solo por ver ese mensaje —
confirmar cuál PID quedó realmente escuchando:
```bash
netstat -ano | grep ":4300" | grep LISTENING
```
Si hay exactamente un PID, el servidor está sano; navegar a verificar
normalmente. Si no hay ninguno, recién ahí relanzar.

## 4 — El Browser pane no captura screenshot, o el pane está oculto

**Síntoma:** `computer.screenshot` falla con "Screenshot timed out — the
page did not finish rendering in time", o las acciones `hover`/`scroll`
fallan con "The Browser pane is currently hidden". No es un bug del código
del proyecto — el pane no está al frente en ese momento de la sesión del
usuario.

**Mitigación, en orden:**
1. Preferir verificación por texto/DOM en vez de insistir con screenshot:
   `get_page_text`, `read_console_messages`, y sobre todo
   `javascript_tool` ejecutando la interacción real:
   ```js
   const el = document.querySelector('cs-componente button');
   el.click();
   await new Promise(r => setTimeout(r, 100));
   el.getAttribute('aria-expanded'); // o getBoundingClientRect(), o className
   ```
   Esto verifica el comportamiento real (clicks, cambios de estado, cálculo
   de layout) sin depender de que el pane esté renderizando a pantalla
   completa — más confiable que un screenshot durante una sesión larga.
2. Si hace falta confirmación visual, pedir `tabs_select` para traer el tab
   al frente antes de reintentar el screenshot.
3. Los logs de consola de un tab REUSADO acumulan mensajes de recargas
   anteriores — un warning o error viejo (ya corregido hace varios cambios)
   puede seguir apareciendo en `read_console_messages`. Para descartar
   falsos positivos, abrir una pestaña nueva (`tabs_create`) y repetir la
   verificación ahí — un tab fresco no arrastra historial.

## 5 — Íconos nuevos: agregarlos también al registro antes de usarlos

**Síntoma:** un componente nuevo usa `<cs-icon name="algo-nuevo">` y el
ícono no aparece (SVG vacío, sin error de consola).

**Causa:** `name` no existe en `ICON_REGISTRY` — TypeScript no lo detecta en
tiempo de compilación si el tipo `IconName` no está lo bastante estricto, o
si se pasó como string suelto.

**Fix:** agregar el path del ícono a
`projects/comsatel-ds/src/lib/icons/icon-registry.ts` ANTES de usarlo. Para
obtener el path real de Lucide (no inventar un ícono aproximado):
```bash
curl -s "https://cdn.jsdelivr.net/npm/lucide-static/icons/<nombre-kebab>.svg"
```
Extraer el contenido entre `<svg ...>` y `</svg>` (paths/circles/etc.) y
agregarlo al `Record` del registro. Reconstruir la librería después (ver
punto 1).

## 6 — `getComputedStyle()` y el screenshot tras `computer.scroll` no son confiables en este Browser pane

**Síntoma A:** un selector CSS (`:has()`, `:hover`, etc.) confirmado
correcto por todos los medios posibles — `element.matches(selector)`
devuelve `true`, la regla aparece en `document.styleSheets` con la
especificidad esperada, el token resuelve a un color válido — y sin
embargo `getComputedStyle(el).<propiedad>` sigue devolviendo el valor
viejo. Prueba definitiva de que es el sandbox y no el CSS: forzar
`el.style.setProperty('propiedad', 'valor', 'important')` (máxima
prioridad posible, gana a cualquier hoja externa) y `getComputedStyle`
TAMPOCO refleja el cambio, aunque `el.getAttribute('style')` sí muestra el
`style` inline aplicado.

**Síntoma B:** después de `computer.scroll` (rueda del mouse) o
`element.scrollIntoView()`, el siguiente `computer.screenshot` devuelve la
página completamente en blanco — incluso el header/sidebar con
`position:sticky` que debería seguir visible en `top:0`. Ocurre igual en
páginas ya verificadas como correctas antes (ej. Button), así que no es un
bug de la página que se está probando.

**Causa:** limitación de lectura/composición del sandbox del Browser pane
— coherente con el problema ya conocido de foco (`document.hasFocus()`
puede dar `false` con el tab al frente). No es una limitación de escribir
(`.click()`, `.focus()`, cambiar `style`) — esas acciones sí surten efecto
real, solo que ciertas LECTURAS (computed style tras scroll/cambio de
estado, screenshot tras scroll) pueden quedar desincronizadas.

**Fix — verificar por otra vía en vez de descartar el CSS como roto:**
1. Nunca concluir "el CSS no aplica" solo por `getComputedStyle()` — cuando
   el resultado es sospechoso (contradice `matches()` + especificidad +
   token válido), confirmar con un screenshot tomado SIN haber scrolleado
   con `computer`/`scrollIntoView` justo antes (navegar directo a una URL
   que ya deje el elemento visible, o usar una pestaña nueva en la
   posición de scroll top).
2. Para verificar contenido que está más abajo en una página larga, preferir
   `get_page_text` (lee el DOM/texto real, no depende del compositor) y
   `javascript_tool` (clicks reales + lectura de atributos/clases/rects) en
   vez de encadenar scroll+screenshot.
3. Al testear un handler `(click)` de un componente con `:host{display:
   contents}` (ej. `InputGroupAddon`), no hacer `.click()` sobre el
   elemento host — el listener está en el `<div>` interno que arma el
   layout real; el host es un wrapper transparente sin listener propio.

**Síntoma C:** `window.innerWidth`/`innerHeight` devuelven `0`, y CUALQUIER
`getBoundingClientRect()` en la página da anchos absurdamente chicos (2px,
21px) con hijos que visualmente "se salen" de su contenedor padre (el hijo
tiene un `x`/`right` mayor que el padre). Esto se vio primero como un
supuesto bug de layout real (`.cs-input-group` colapsado) y llevó tiempo
de debugging hasta confirmar que el viewport mismo estaba en 0×0.

**Causa:** el pane quedó oculto o sin foco real (después de un
`resize_window` a un preset, o tras varias acciones sin `tabs_select`) —
en ese estado el tab reporta un viewport de 0×0, y CUALQUIER medición de
layout hecha ahí es basura, no un reflejo del CSS real.

**Fix:** antes de medir con `javascript_tool` después de tocar
`resize_window` o de una racha larga sin interacción visual, verificar
`window.innerWidth` primero. Si da `0`, hacer `tabs_select` y luego
`resize_window` con `width`/`height` EXPLÍCITOS (no basta con el preset
`"desktop"`, que solo limpia la emulación — si el pane seguía oculto, el
viewport puede seguir en 0×0 después). Recién con `innerWidth` > 0
confirmado, repetir la medición.
