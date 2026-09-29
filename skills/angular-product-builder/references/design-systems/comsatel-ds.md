# Sistema de diseño: Comsatel DS

Leer después de `../design-system-contract.md` cuando el sistema elegido para el
proyecto es Comsatel DS. Aquí están los datos exactos de este sistema: paquete,
registro, estilos, tipografía y recetas de composición. Su mantenedor es el skill
`comsatel-design-system`.

## Límite de responsabilidad

La aplicación es dueña de sus dominios, datos, rutas, autenticación, reglas de
negocio y composiciones. La librería es dueña de sus componentes, tokens y
contrato público. Nunca se copia `projects/comsatel-ds/`, `src/app/`, demos,
Storybook ni CSS interno hacia una aplicación consumidora.

Antes de elegir componentes, leer el `README.md` instalado en
`node_modules/@iamacalupuenzo-ui/comsatel-ds/` o su fuente pública en
`https://github.com/iamacalupuenzo-ui/Comsatel-DS`. Esa es la API vigente; no
inventar imports ni mantener una lista duplicada dentro de este skill. El
consumidor se guía por esa superficie pública y sus tipos: no consulta fuentes
privadas ni solicita un token con alcance `repo` para inferir una composición.

## Proyecto existente o nuevo

1. Si el usuario da un repositorio destino, leer su `package.json`, rutas,
   scripts, arquitectura y cambios pendientes antes de editar.
2. Si no existe un destino y pidió una pantalla o flujo durable, crear una
   aplicación Angular limpia en la ruta aprobada:

   ```sh
   npx @angular/cli@22 new nombre-de-la-aplicacion --routing --style css --standalone --strict --skip-git
   ```

3. Una pantalla aislada sigue siendo una aplicación consumidora: no se crea
   dentro del repositorio del Design System ni se convierte una demo en base de
   producto. Si la ruta de creación cambia el alcance del usuario, pedirla.

## Instalación permitida

El repositorio consumidor solo declara qué scope usa GitHub Packages. Este
archivo se versiona porque no contiene secretos:

```ini
@iamacalupuenzo-ui:registry=https://npm.pkg.github.com
```

La credencial se configura una vez por usuario de Windows en `~/.npmrc` y
referencia una variable de entorno, sin guardar el valor del token en ningún
repositorio:

```ini
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Si el usuario aún no creó la variable persistente, indicarle este único comando
con un placeholder, sin pedir ni repetir el secreto. `"User"` es literal; no
se reemplaza por el nombre de Windows:

```powershell
[Environment]::SetEnvironmentVariable("GITHUB_PACKAGES_TOKEN", "<token>", "User")
```

Una terminal, Codex u otra aplicación que ya estuviera abierta conserva el
valor anterior. Tras cambiar la variable, reiniciar el proceso que ejecutará
`npm` y verificar la cuenta sin imprimir el token:

```powershell
npm whoami --registry=https://npm.pkg.github.com
```

Instalar una versión explícita, nunca `latest` ni un rango automático en la
primera adopción:

```sh
npm install @iamacalupuenzo-ui/comsatel-ds@<version>
```

El token clásico de instalación requiere únicamente `read:packages`. Si el
paquete no expone una API, estilo o ejemplo necesario, es un contrato faltante
del DS: se registra la mejora; no se elevan permisos a `repo` ni se copian
archivos internos.

Importar los estilos oficiales una vez desde `src/styles.css` y establecer la
base tipográfica global. El punto de entrada aporta las fuentes oficiales y los
tokens, pero intencionalmente no resetea el `body` de la aplicación consumidora:

```css
@import '@iamacalupuenzo-ui/comsatel-ds/styles.css';

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--font-family-content);
  font-size: var(--font-size-content-body);
  line-height: var(--font-line-height-content-body);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--font-letter-spacing-content);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

El punto de entrada incluye fuentes y tokens. No instala un reset, los estilos
de demos ni una interfaz de producto. Los estilos encapsulados de cada
componente viajan con el componente; la aplicación no los replica. Nunca
agregar `@font-face`, una URL de fuentes ni una familia tipográfica propia para
reemplazar los tokens: el consumidor solo usa la tipografía publicada por el DS.

## Imports por subpath (desde 0.6.0)

Desde la versión 0.6.0, cada componente de Comsatel DS tiene su propio punto de
entrada. En un producto, **cada** import del DS va por subpath; nunca desde la raíz
`@iamacalupuenzo-ui/comsatel-ds`:

```ts
import { Button } from '@iamacalupuenzo-ui/comsatel-ds/button';
import { Icon } from '@iamacalupuenzo-ui/comsatel-ds/icons';
import { InputGroup, PasswordInput } from '@iamacalupuenzo-ui/comsatel-ds/input';
import { Menu, type MenuGroupData } from '@iamacalupuenzo-ui/comsatel-ds/menu';
import { formatDateTime } from '@iamacalupuenzo-ui/comsatel-ds/format';
```

- **Dónde está el subpath de cada símbolo:** en la línea «Import liviano» de la guía
  del componente, o en `exports` de
  `node_modules/@iamacalupuenzo-ui/comsatel-ds/package.json` y el `.d.ts` de cada
  entrada. El subpath es el nombre de la carpeta del componente; excepciones
  conocidas: `PressScale` está en `/motion`, `Collapse` en `/directives` y los
  tokens de TypeScript en `/tokens`.
- **No importar `/shared`**: es apoyo interno del DS.
- **Versiones anteriores:** hasta la 0.3.x solo existe la raíz; en 0.4.0 y 0.5.0 solo
  algunos subpaths. Comprobar `exports` de la versión instalada antes de usar uno.
- **Efecto medido en FleetOperations** (DS 0.6.0, mismo código y lockfile): con
  imports desde la raíz cada pantalla descargaba 390 kB del DS; por subpath, de
  133 kB (tablero) a 289 kB (mapa). En 0.5.0, un solo import desde la raíz traía la
  librería entera; desde 0.6.0 la raíz solo reexporta, pero sigue juntando en un
  chunk todo lo que se importa desde ella.
- **Migrar un repositorio existente:** reemplazar cada
  `import { … } from '@iamacalupuenzo-ui/comsatel-ds'` por un import por subpath
  según el mapa símbolo → subpath de los `.d.ts` instalados; al terminar, no debe
  quedar ningún import desde la raíz (`grep -rn "comsatel-ds'" src`).

## Tipografía en formularios

Clasificar cada texto antes de aplicar estilos: título de pantalla,
introducción, etiqueta de campo, etiqueta de control de elección, ayuda y
estado. La jerarquía intencional no se elimina haciendo que todos usen el mismo
tamaño.

Los labels de campos equivalentes compuestos por la aplicación —por ejemplo un
`<label>` para `cs-input` y el label de un `cs-select`— deben compartir el rol
de etiqueta de campo. No asumir una escala por costumbre: medir en el navegador
el label encapsulado del componente publicado en la versión instalada y usar
ese mismo rol en la etiqueta externa.

En la versión `0.2.0`, las etiquetas encapsuladas de Select, InputDropdown y
los selectores de fecha siguen la escala pública `fieldLabelTypography`:
`sm` y `md` usan `content/note` con peso `accent` (12px/18px/500), mientras
`lg` usa `content/caption` con peso `accent` (14px/21px/500). `cs-input` y
`cs-password-input` mantienen la etiqueta externa; cuando una aplicación
necesita una, debe derivarla del tamaño del campo y aplicarla de forma acotada:

```css
.form-field[data-size='sm'] > label,
.form-field[data-size='md'] > label {
  color: var(--color-text-base-default);
  font-family: var(--font-family-content);
  font-size: var(--font-size-content-note);
  line-height: var(--font-line-height-content-note);
  font-weight: var(--font-weight-accent);
  letter-spacing: var(--font-letter-spacing-content);
}

.form-field[data-size='lg'] > label {
  color: var(--color-text-base-default);
  font-family: var(--font-family-content);
  font-size: var(--font-size-content-caption);
  line-height: var(--font-line-height-content-caption);
  font-weight: var(--font-weight-accent);
  letter-spacing: var(--font-letter-spacing-content);
}
```

No declarar una regla global para `label`: afectaría la etiqueta interna de
Checkbox y otros componentes. Un Checkbox usa una etiqueta de opción y ayuda
propias; esa anatomía encapsulada se conserva. Verificar en el navegador la
familia, tamaño, interlineado y peso computados de labels equivalentes, no solo
su apariencia en una captura.

Evaluar también el texto dentro del control. En `0.2.0`, `cs-input` y
`cs-select` `md` usan una altura de 32px y texto `content/ui`
(13px/19.5px); `lg` usa 40px y `content/body` (16px/24px). Para una pantalla
con menor densidad o mayor exigencia de legibilidad, usar `fieldSize="lg"` en
`cs-input` y `size="lg"` en `cs-select` de manera consistente. Si la
investigación concluye que la escala pública no resuelve una necesidad, es una
decisión de Comsatel DS: se cambia el patrón y se verifica transversalmente, no
se crea una excepción visual en una sola aplicación.

## Receta de composición: contraseña con visibilidad

Al construir autenticación, no asumir que todo control interactivo es un
`cs-button`. Comsatel DS exporta `cs-password-input`, que ya compone el campo,
el ícono `lock` opcional y el botón nativo eye/eye-off con sus etiquetas y
`aria-pressed`. Importarlo desde el paquete público; no reconstruir el grupo ni
copiar sus estilos.

El formulario consumidor mantiene el valor, validación, error y etiqueta del
campo. `PasswordInput` solo controla la revelación. No se envuelve en
`cs-button`, pues ese componente está destinado a acciones generales y altera
la geometría del control integrado.

Usar `autocomplete="current-password"` para inicio de sesión o
`autocomplete="new-password"` para alta/cambio. El correo no es un componente
especializado: usar `cs-input type="email"` y `autocomplete="email"`.

## Hallazgos verificados en la versión 0.2.2 (2026-09-25)

Comprobados en el repositorio consumidor FleetOperations contra el paquete
instalado. Son hechos de esa versión; si la versión instalada cambia, volver a
verificarlos en lugar de darlos por vigentes.

- **Dónde viven los tokens.** El paquete publica tres archivos CSS:
  `styles.css`, `tokens.css` y `typography-tokens.css`. Los tokens de color,
  espaciado, radios y sombras están en `tokens.css`; los de tipografía
  (`--font-size-*`, `--font-line-height-*`, `--font-letter-spacing-*`) están en
  `typography-tokens.css`. Verificar un token buscándolo en **ambos**; buscar
  solo en `tokens.css` lo declara inexistente por error. Además, el código
  compilado del propio DS usa tokens que no existen en ninguno de los dos: un
  token visto solo en el JS compilado no cuenta como público.
- **Íconos.** `cs-icon` y `DropdownItem.icon` aceptan solo los nombres del tipo
  `IconName`. Nombres que parecen razonables y no existen: `crosshair`,
  `map-pin-off`, `shield`, `building`, `target`. Confirmar el nombre en el tipo
  antes de usarlo; existen, entre otros, `locate-fixed`, `eye`, `map-pin`,
  `pencil`, `file-text`, `satellite`, `copy`.
- **Tooltip.** `cs-tooltip` (import `Tooltip`) recibe `content` (obligatorio),
  `side` y `arrow`, y envuelve al elemento disparador. Es el único tooltip del
  sistema: un atributo `title` nativo o el tooltip por defecto de Leaflet no
  son el del DS y se ven distintos. Se muestra con `:hover` (con retardo de
  0,4 s) y con `:focus-within`; por eso, tras un clic, el botón conserva el
  foco y el tooltip queda pegado. Si el disparador es un botón que cambia de
  estado con el clic, quitar el foco tras el clic (`event.currentTarget.blur()`).
- **Tooltip dentro de una librería de mapas.** Leaflet inyecta su DOM fuera de
  Angular y no se puede montar `cs-tooltip` ahí. Se restilizan `.leaflet-tooltip`
  y sus flechas en `styles.css` global con los mismos tokens que usa el DS:
  fondo `--color-background-neutral-strongest`, texto `--color-text-inverse`,
  radio `--radius-xs`, sombra `--shadow-md`, relleno `--layout-padding-xs`
  y `--layout-padding-md`, y tipografía `label/small` con peso `accent`.
- **Popover anidado.** `cs-popover` se cierra al hacer clic fuera de su panel y
  de su disparador, y no reconoce otro `cs-popover` (un calendario dentro de
  un panel) como "dentro". Para un panel con controles que abren otros
  popovers, usar `[closeOnOverlayClick]="false"` y decidir el cierre con un
  `document:click` propio que ignore `.trigger, cs-popover`. Un disparador en
  el borde derecho usa `placement="bottom-end"`: con `bottom-start` el panel se
  recorta contra el viewport y queda despegado.
- **Menús desplegables.** `InputDropdown` expone `fullWidth`; su menú no
  iguala el ancho del disparador aunque `Popover` tenga `matchTriggerWidth`.
  Es una brecha registrada, no algo que se corrige en la aplicación.
- **Tabla.** `cs-table` no ofrece filtro por columna en el encabezado; un
  patrón de embudo por columna no se construye con su API pública. Brecha
  registrada.
- **Sin `::ng-deep`.** Un componente del DS no se restiliza desde el consumidor.
  Si falta una variante, es una brecha para el DS.

## Comandos y dependencias

Se permite usar los scripts ya declarados por la aplicación (`npm run build`,
`npm test`, lint o e2e) y Angular CLI 22 para bootstrap, **salvo que el
repositorio consumidor prohíba ejecutarlos sin pedido del usuario** (en cuyo
caso aplica `../arquitectura-proyecto.md`). No instalar PrimeNG,
Material, Tailwind, un kit UI alternativo, una librería de mapas ni otra
dependencia visual para reemplazar Comsatel DS sin una solicitud explícita y
una evaluación de compatibilidad, licencia, bundle y accesibilidad.

Un error de registro, versión o API pública faltante es un bloqueo del contrato:
documentarlo y pedir la mejora en Comsatel DS; no resolverlo copiando fuentes.
