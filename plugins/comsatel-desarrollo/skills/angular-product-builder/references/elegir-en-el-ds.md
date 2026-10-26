# Elegir en el Design System: plantilla, patrón y componentes

**Pregunta antes de leer:** voy a construir una pantalla con el Design System de Comsatel, ¿qué leo y en qué orden antes de escribir una línea de UI?

**En 30 segundos:** los componentes dicen qué existe; los **patrones** dicen qué construir. Se decide en este orden: qué tipo de pantalla es → qué **patrón** y qué **plantilla** le corresponden → qué **componentes** lleva (buscados con `adsa-cli`, y leída su guía) → qué **tokens** usa. Si falta algo, se detiene y se pregunta: no se inventa un contenedor ni se aproxima con un `div`.

Aplica solo cuando el sistema elegido es Comsatel DS (`design-systems/comsatel-ds.md`). Para otro sistema rige `design-system-contract.md`.

## Dónde están las guías

| Desde dónde trabajas | Ruta de las guías |
|---|---|
| Repositorio `ui-components` | `guidelines/` y `guidelines/patterns/` |
| Un producto (Shell, micro UI) | `node_modules/@comsatel/ui-components/guidelines/` (viajan en el paquete desde la 1.6.0) |

Cada guía trae la tabla de props y el contrato de accesibilidad generados desde el código, y las trampas conocidas. **Se leen; no se deducen de los tipos ni de lo que se recuerde de otras librerías.** La versión del paquete instalado manda: si una guía dice «Disponible desde 1.12» y el producto fija la 1.11, esa pieza no existe todavía.

## El orden, paso a paso

1. **Nombra la tarea del usuario en una frase** («encontrar un vehículo», «ver y operar un registro», «cambiar la configuración»). Si no puedes, falta especificación: vuelve a `especificacion-producto.md`.
2. **Lee `guidelines/patterns/index.md`** y busca la tarea. Abre el patrón: trae el esqueleto con componentes reales, los estados que hay que cubrir y las trampas encontradas.
3. **Elige la plantilla** con la tabla de abajo y lee su guía (zonas, obligatorias, espaciado).
4. **Busca los componentes** (ver «Cómo buscar») y lee la guía de cada uno antes de usarlo.
5. **Colores, espaciado, radios, sombras, z-index y motion salen de `guidelines/design-tokens.md`.** Nunca un hex, un píxel suelto ni un `z-index` numérico.
6. **Si algo falta, detente** (ver «Cuando no existe»).
7. **Antes de dar por terminada la pantalla**, cubre los estados y la accesibilidad del patrón (ver «Reglas comunes»).

## Qué tipo de pantalla es

| La pantalla sirve para… | Patrón | Plantilla | Guías a leer |
|---|---|---|---|
| Encontrar un registro entre muchos | `patterns/list-page.md` | `cs-list-template` | `list-template`, `filter-bar`, `table`, `table-footer`, `pagination` |
| Ver y operar sobre un registro concreto | `patterns/detail-page.md` | `cs-page-template` | `page-template`, `page-header`, `description-list`, `tabs` |
| Cambiar la configuración y guardarla | `patterns/settings-form.md` | `cs-page-template` | `page-template`, `form-field`, `input`, `banner` |
| Inicio u otra pantalla que no es un listado | (compón los existentes) | `cs-page-template` | `page-template`, `page-header`, `list-item`, `card` |
| Iniciar sesión, recuperar o activar una cuenta | `patterns/auth-page.md` | `cs-auth-template` | `auth-template`, `form-field`, `input` (incluye `cs-password-input`) |
| Mostrar que no hay datos, que falló la carga o que falta permiso | `patterns/empty-states.md` | (dentro de la plantilla de la página) | `empty-state`, `banner`, `skeleton`, `illustrations` |
| Despejar un lienzo y retomar la búsqueda | `patterns/collapsible-panel.md` | (panel sobre el mapa) | `fleet-unit-list`, `popover` |

`patterns/detail-page.md` y `patterns/settings-form.md` todavía **no nombran** `cs-page-template` (son anteriores a la 1.12); la plantilla se elige porque su propia guía (`page-template.md`, «Cuándo usarla») la define para «inicio, detalle de un registro o configuración». Si el producto fija una versión anterior a la 1.12, esa plantilla no existe y se pregunta antes de improvisar.

Si la tarea no está en `patterns/index.md`, **no inventes un patrón nuevo en silencio**: combina los existentes y, si no alcanzan, pregunta.

## Cómo está hecha una plantilla (para elegirla y para proponer otra)

Las plantillas del DS son del nivel 5 de Atomic Design. **Ordenan zonas y espaciado; no dibujan contenido.** El producto proyecta sus componentes en zonas marcadas con un atributo:

| Plantilla | Zonas | Obligatorias | Notas |
|---|---|---|---|
| `cs-list-template` (1.3) | `[breadcrumb]`, `[header]`, `[alert]`, `[filters]`, (contenido), `[footer]` | `[header]` y el contenido | Envuelve el contenido en tarjeta |
| `cs-page-template` (1.12) | `[breadcrumb]`, `[header]`, `[alert]`, (contenido) | `[header]` y el contenido | Sin tarjeta: cada pantalla agrupa lo suyo. `[centerContent]` para pantallas de un solo estado |
| `cs-auth-template` (1.7) | `[brand]`, (contenido), `[footer]`, `[visual]` | El contenido | Variantes `centered` y `split` |

Reglas que comparten:
- El orden en pantalla es fijo y no depende del orden en que escribas los elementos.
- Una zona sin contenido no ocupa espacio.
- Van dentro de `cs-app-layout`, que aporta el `<main>` y la navegación. No se arma otro shell.
- El margen y la separación se reacomodan por ancho (40/24 px desde 1024, 24/24 de 768 a 1023, 16/16 hasta 767); no se reescriben a mano.

**Si crees que falta una plantilla:** una práctica que se repite en dos pantallas es candidata a plantilla (así nació `cs-list-template`). Se propone al mantenedor del DS con las dos pantallas como evidencia; no se crea una local. Para decidir si es átomo, molécula o plantilla, usa `web-atomic-component-designer`.

## Cómo buscar un componente

```
npx adsa-cli search "<lo que necesitas, en lenguaje de tarea>"
npx adsa-cli docs <componente>
```

- `search` devuelve guías candidatas, ordenadas por relevancia; `docs` imprime la guía de una (usa `--full` para conservar la prosa).
- **El orden de `search` es una pista, no la respuesta.** Ejemplo observado: «pantalla de inicio con tarjetas» devuelve `auth-page`, `app-layout` y `settings-form` antes que `page-template`, que es la que corresponde. Por eso el paso 2 y 3 (patrón y plantilla) van **antes** de buscar, y `search` sirve para completar los componentes de cada zona.
- Busca con varias formulaciones («filtros», «buscador», «paginación») y compara con la tabla de `patterns/index.md`.
- Importa por componente: `import { Button } from '@comsatel/ui-components'` (o su subpath ligero). Nunca desde `projects/comsatel-ds/src/...`.
- Los iconos salen del registro del sistema; no hay segunda librería ni carpeta `components/ui` copiada.
- Una prop `boolean` o `number` va con binding (`[disabled]="true"`); como atributo, Angular pasa texto y se ignora.
- Casi todos los componentes son **controlados**: los eventos (`closed`, `dismiss`, `valueChange`) solo avisan. Cerrar, ocultar o actualizar el valor lo haces tú.
- Nunca un `<select>` nativo: `cs-input-dropdown` o `cs-select`.

## Cuando no existe

1. Confirma que de verdad no existe: busca con otras palabras, abre el patrón y revisa `GAPS.md` (puede estar registrada ya, con qué usar en su lugar).
2. **Detente y pregunta.** No inventes un envoltorio, no lo aproximes con un `div`, no elijas «lo más parecido» en silencio.
3. Si se confirma, regístralo: `npm run gap:report -- "Qué falta" "Qué usar en su lugar" "Por qué o estado"` (en el repositorio del DS). Mientras se resuelve, compón con una API migrable y deja el rótulo `PENDIENTE`.

## Reglas comunes a toda página

- La página vive dentro de `cs-app-layout` (`cs-header` en `[topnav]`, `cs-menu` en `[sidenav]`).
- Un solo `<h1>` (el de `cs-page-header`) y un solo `cs-button variant="primary"` por pantalla.
- La carga se dibuja con `cs-skeleton` (o `isLoading` del componente), nunca con un spinner.
- Textos visibles en español; los datos de ejemplo de una demo se rotulan como tales.
- Los landmarks los da el layout: no los dupliques.
- El orden de lectura sigue el visual: título y acción principal, filtros, contenido, paginación.
- Tras una acción que cambia lo visible (filtrar, guardar, borrar), anuncia el resultado en una región `aria-live` o con `cs-toast` y deja el foco en un lugar predecible.

## Comprobación al terminar

- ¿Puedo señalar en qué patrón y en qué plantilla se apoya la pantalla?
- ¿Leí la guía de cada componente que usé (no solo su nombre)?
- ¿No hay hex, píxeles sueltos, `z-index` numéricos ni estilos locales que reemplacen a un componente?
- ¿Cubrí carga, vacío, error y permiso? ¿Y el móvil?
- ¿Alguna pieza que no existe quedó registrada como brecha en vez de resuelta con un invento?
- En el repositorio del DS: `npm run check:docs` y `npm run test:ci`. En un producto: la suite del repositorio.

## Pregunta de comprobación

Piden «una pantalla de inicio con accesos a Distribuidores y Feature flags». `adsa-cli search` devuelve primero `auth-page`. ¿Qué plantilla usas y por qué?
(Respuesta: `cs-page-template`, porque no es un listado ni un acceso; el resultado de `search` no la decide, la decide el tipo de pantalla en `patterns/index.md`.)
