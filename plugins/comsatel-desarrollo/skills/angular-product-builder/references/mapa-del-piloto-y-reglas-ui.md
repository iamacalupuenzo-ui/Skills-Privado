# Mapa del piloto y reglas de UI vigentes

Dónde mirar antes de construir una pantalla de Flotas y qué reglas ya quedaron
decididas. **El estándar se lee corriendo**: se levanta el piloto, el catálogo
del DS y el producto, y se comparan en el navegador (puertos y credenciales en
la bitácora `comsatel-ds`). Si algo de aquí no alcanza, se pregunta; no se
inventa (B4).

## 1. Dónde está cada cosa

| Necesito | Fuente de verdad | Qué mirar |
|---|---|---|
| Layout del shell sin barra superior | Ejemplo oficial del DS `src/app/pages/app-layout-demo/app-shell-example.ts`; piloto `capturas-recuperos/src/app/layout/operations-layout.component.ts` | `cs-app-layout [hasTopnav]="false" scroll="inner" [skipLink]="true"`, marca en `[sidenavHeader]`, `cs-menu` en `sidenav`, sesión en `[sidenavFooter]` |
| Listado con tabla | Guía `list-template.md`, `table.md`, `table-footer.md` en `node_modules/@comsatel/ui-components/guidelines/` (viajan en el paquete desde la 1.6.0) y `microui-bo-tenants/src/app/tenants/tenants-list.component.ts` | `cs-list-template` + `cs-page-header` + `cs-filter-bar` + `cs-table` + `cs-table-footer` |
| Estados vacío, error y carga | `empty-state.md`, `table.md`; piloto `features/access-users/users-table.component.ts` | Ver §2 |
| Pantallas de acceso | `auth-template.md` y `guidelines/patterns/index.md`; piloto, login de `features/` | `cs-auth-template` variante con imagen |
| Menú de navegación | `menu.md`; `cs-menu` ya trae su margen lateral de 12 px | No añadir relleno propio alrededor |
| Tokens | `guidelines/design-tokens.md` | Nunca hex, px sueltos ni z-index numéricos |

## 2. Reglas de UI ya decididas (Enzo, 2026-10-08)

1. **El scroll va en la página, no dentro de la tabla.** La tabla abre con 10
   filas (opciones 10, 25, 50, 100: el valor por defecto de `cs-table-footer`).
   Con más filas se desplaza el área principal de `cs-app-layout` y el menú
   queda fijo. No se usa `cs-list-template [fillHeight]` en listados.
2. **Menú a 12 px del borde**, como el piloto (DS 1.9.1). Si se ve a 24 px, el
   defecto está en la plantilla, no en `cs-menu`.
3. **Marca y sesión en la navegación**: logo arriba (`cs-c-flotas-logo`,
   wordmark expandido, isotipo en rail), nombre, rol y botón de cierre de sesión
   (icon-only con `aria-label`) abajo.
4. **Sin etiqueta de contexto vacía.** No se dibuja «Todos los distribuidores»;
   el contexto se muestra solo al trabajar dentro de un distribuidor concreto.
5. **Estado vacío = el del piloto**: `cs-empty-state` con `icon` (40 px, color de
   marca), título que dice qué pasa, descripción que dice qué hacer y relleno
   `var(--layout-padding-4xl)` en la clase local del vacío. Dos mensajes
   distintos: «Aún no hay X» (sin filtros, ícono del objeto) y «No encontramos
   X» (con filtros, ícono `search` y botón «Limpiar filtros» con ícono `x`).
6. **Error de carga solo en la tabla** (`error` y `(retry)`), nunca como toast, y
   sin pie con «0 registros»: un error no es un vacío.
8. **Tablas dentro de modales y paneles laterales (Enzo, 2026-10-09):** misma tarjeta que el piloto (borde fino, radio y superficie por tokens) con menú de tres puntos por fila (`cs-table-row-actions`), columna de acciones de 72 px centrada y fija al final, anchos en px. Son **5 filas por página y el tamaño no se puede cambiar**: sin selector de filas. `cs-table-footer` siempre trae el selector, así que en modales se usa un pie de resumen («1–5 de 7 contactos») con `cs-pagination`, que aparece solo con más de 5 filas. Brecha del DS: pie de tabla sin selector de filas.
7. **Lo que no existe en el DS se construye con componentes existentes**; si no
   alcanza, se reporta la brecha (`gap:report`) y se pregunta. No se inventan
   contenedores ni texto de relleno.

## 3. Pantallas que el producto compone con libertad

Hay interfaces que no viven en el DS porque dependen de la creatividad del
producto (por ejemplo la composición exacta del login). Ahí no hay regla visual
cerrada, pero sí límites: se usan los **tokens, componentes y valores del DS**,
se justifica el orden y el espaciado, y se toma como referencia de buena UI de
acceso la de Samsara (jerarquía: marca, título, descripción, campos, acción
principal y la vía alterna como enlace de nivel bajo). La práctica se extrae; el aspecto no se copia (ver
`referencias-visuales.md` §2).

### Regla de acceso (Enzo, 2026-10-08)

Antes de diseñar un login se **entiende la lógica real**: qué credenciales pide
cada población, qué contrato las recibe y qué pide el backend. Un código de
distribuidor por sí solo no es un ingreso: hace falta usuario y contraseña.

- El acceso principal es **Usuario + Contraseña + un único botón primario**.
- Las vías alternas (por ejemplo, distribuidor) van **al costado de su pregunta, en la
  misma línea** («¿Eres administrador de un distribuidor? Ingresa aquí»), con un
  botón de variante `link` y `aria-label` completo; llevan a su propio login. Nunca dos
  botones de ingreso compitiendo como primario y secundario.
- Todo campo lleva **placeholder** («Ingresa tu usuario»). El foco inicial va al
  primer campo; en el asistente de primer ingreso el foco va al `h1` de cada paso
  (UXR-019): nunca al botón de aceptar.
- Si el diseño exige un contrato que no existe (por ejemplo, ingreso del personal
  por formulario cuando hoy es Keycloak por redirección), se propone en el mock y
  se deja anotado para Arquitectura; no se asume.

## 4. Reglas aprendidas construyendo prototipos de historias (2026-10-09)

1. **Un remoto = una entrada del manifest = una ruta del shell.** La clave del manifest debe
   igualar el nombre del remoto (Native Federation falla con «Fetched remote X does not match
   requested Y»). Una micro UI que sirve a dos poblaciones decide **por alcance dentro de su ruta
   raíz**; no se agregan entradas de manifest que apunten al mismo remoteEntry. Dos funcionalidades
   de menú en un remoto exigen un manifest con varias rutas: decisión de Arquitectura.
2. **Decisión abierta = rótulo visible «PENDIENTE <ID>».** Se construye lo más simple y
   reversible, el ID se verifica contra los UXR/FLW/DUD, los textos provisionales se rotulan y la
   bandera que los muestra vive en un solo lugar. Un banner por decisión satura: se usa un rótulo
   compacto (`cs-tag` + texto) agrupado.
3. **Todo endpoint o clave nueva del mock es «contrato propuesto solo del mock»**: se comenta
   en el código, se lista en el README y se avisa a Arquitectura. No se reutilizan URLs de
   recursos reales con otro cuerpo.
4. **Envío en curso anunciado** (región `role="status"`, `aria-busy`) y **sin deshabilitar el campo
   con foco** (se pierde el foco con Enter): usar `readonly` o ignorar cambios mientras se envía.
5. **`role="alert"` solo para errores; los avisos van en una región `aria-live="polite"`.** Con
   anuncios por tecla, agregar debounce.
6. **Un hook de prueba por parámetro de URL no viaja a producción**: va detrás de una bandera de
   prototipo.
7. **Antes de construir sobre una historia se valida el código existente contra el flujo**; no se
   asume que ya cumple. Las historias nuevas se validan con un agente independiente.
8. **Verificación en el navegador**: los clics y las teclas simuladas pueden no llegar a los
   componentes del DS en la automatización (el clic por DOM y `fill` sí funcionan); un fallo de
   la automatización no es un defecto hasta reproducirlo a mano.
9. **Ubicación de las pantallas por repositorio** (Flotas): backoffice = `web-backoffice` +
   micro UIs de `micros-ui/backoffice`; Web Cliente = `web-flotas` + micro UIs de
   `micros-ui/flotas`. Cada shell tiene sus propias micro UIs (ADR-031 §9).

## 5. Cómo se valida

Una pantalla se da por buena cuando: pasa los specs de lo que cambió, el
validador independiente no reporta bloqueantes, y se comparó en el navegador
contra el piloto en estado normal, vacío, error y con teclado. Cada diferencia
con el estándar se documenta en la bitácora con su causa.
