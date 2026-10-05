# Gates de verificación antes del cierre

Esta referencia evita dos errores recurrentes: declarar terminado un
componente que solo fue compilado, y reconstruir una apariencia sin cubrir el
comportamiento, los estados o la estructura real. Se aplica a cada componente
o patrón que se audita o reconstruye.

## 1. Matriz de referencia funcional

Antes de editar, identifica la fuente de capacidades:

- **PrimeNG oficial actual**, cuando hay equivalente público. Es obligatorio
  revisar su sección de ejemplos y accesibilidad; sirve para detectar estados,
  ARIA y teclado que el componente propio debe cubrir. Por ejemplo, el Select
  documenta selección múltiple, chips, filtro, estados disabled/invalid/loading
  y relaciones combobox/listbox.
- **React de Comsatel**, para estructura, variantes documentadas y edge cases
  propios del sistema. Nunca aporta tokens ni implementación Angular.
- **WAI-ARIA APG**, cuando PrimeNG no ofrece equivalente o el patrón es más
  específico que un componente de PrimeNG.

Deja en la auditoría una matriz breve con las capacidades aplicables y su
evidencia Angular: prop/estado, ARIA, teclado, overlay, formularios/carga y
la ruta de documentación. Una capacidad ausente se registra como hallazgo o
como exclusión razonada; nunca se omite silenciosamente.

No instalar ni copiar PrimeNG: es una referencia funcional externa, no una
dependencia ni fuente de estilos.

## 2. Gate estructural

Revisar el componente y su página de documentación con código y DOM real:

1. El elemento anfitrión usa semántica nativa cuando existe (`button`,
   `input`, `label`, `a`, `table`) y no inventa roles redundantes.
2. Cada subpieza existente en `comsatel-ds` se reutiliza o se extrae como
   primitivo compartido; no se recrea con markup local.
3. Los controles tienen nombre accesible, foco visible y relaciones ARIA
   completas (`aria-controls`, `aria-expanded`, `aria-activedescendant`,
   `aria-describedby`) cuando el patrón las requiere.
4. El orden de foco coincide con el orden visual. Un overlay tiene su estrategia
   de portal, cierre, retorno de foco y z-index semántico definida.
5. La página conserva el patrón real: breadcrumb, DemoShell/CodeBlock,
   accesibilidad, propiedades y lineamientos en dos columnas, sin `<select>`
   nativo para controles del playground.

La inspección del árbol de accesibilidad o DOM debe acompañar esta revisión;
leer solo el template no cuenta como evidencia.

## 3. Gate visual por estados

En un tab limpio, construir una matriz proporcional al componente. Revisar y
capturar evidencia de los estados que existan, no una lista artificial:

| Familia | Estados mínimos cuando aplican |
|---|---|
| Control | reposo, hover, foco visible, presionado, disabled, error/invalid, loading, seleccionado |
| Selección/lista | abierto, navegación de teclado, selección, vacía, filtro, lista larga y cierre/retorno de foco |
| Overlay | apertura, posición extrema, colisión/borde de viewport, Escape, clic afuera si corresponde, contenido completo sin recorte |
| Tamaños/contenido | cada tamaño, texto solo, ícono+texto, contenido largo y composición agrupada |
| Tema y movimiento | claro/oscuro, reducción de movimiento si anima, contraste de estados semánticos |

Para alineación fina, medir con `getBoundingClientRect()` los bordes, centros
o alturas que deben ser iguales. Para overlays, comprobar visualmente el panel
completo abierto y que no tape indebidamente controles o documentación. Para
lineamientos de uso, interactuar el demo independiente del Playground.

## Regla de cierre

`npm run build` y la compilación de Storybook validan la integridad técnica;
no sustituyen la evidencia de los tres gates. El informe final solo dice
`Finalizado` cuando enumera las interacciones y estados realmente revisados.
Si el navegador, la referencia o un estado necesario no estuvo disponible, el
componente queda `Pendiente de verificación` con la causa concreta.

## 4. Gate técnico de checkout limpio

Cuando la aplicación consume la librería del mismo repositorio mediante un
`paths` de TypeScript que apunta a `dist/` (por ejemplo,
`@comsatel/ui-components`), una
prueba local puede pasar por un paquete construido en una sesión anterior. No
es evidencia equivalente a CI.

Antes de cerrar un cambio de librería o de sus consumidores, validar en este
orden: `npm ci --legacy-peer-deps`, `npm run build:lib`, `npm run test:ci` y,
si hay stories, `npm run build-storybook`. El workflow remoto debe conservar
el mismo orden: nunca ejecutar los tests de la aplicación antes de construir
la librería de la que importan.

El reporte debe distinguir una prueba hecha sobre dependencias instaladas de
una verificación de checkout limpio. Si CI falla, se revisa el log completo
del job y no se declara el despliegue terminado hasta identificar y corregir
el paso que falla.

## 5. Gate de trazabilidad para versiones distribuibles

Cuando un cambio modifica la API pública, el nombre/versión del paquete o su
canal de distribución, la documentación de release es parte de la evidencia
del cambio, no una tarea posterior. Antes de crear un tag `ds-v<versión>`:

1. Crear o actualizar `docs/releases/<versión>.md`, donde `<versión>` coincide
   exactamente con `projects/comsatel-ds/package.json`.
2. Incluir las secciones `Resumen`, `Cambios`, `Impacto para consumidores` y
   `Verificación`. Declarar de forma explícita si no hay migración; no dejar
   ese impacto implícito.
3. Ejecutar `npm run check:release-notes`, los gates técnicos y el preflight
   del registro: identidad npm, permisos de escritura y ausencia de la versión
   objetivo. Un token de lectura permite instalar, no publicar.
4. Después de `npm publish`, consultar la versión exacta y el dist-tag `latest`
   desde GitHub Packages. Solo esa respuesta demuestra que una aplicación puede
   instalar la versión; un commit en `main` no la sustituye.
5. Crear y publicar `ds-v<versión>` después de la comprobación del registro.
   El workflow remoto debe repetir los pasos 3 y 4 antes de etiquetar.

Una nota inexistente, con otra versión, un token sin escritura, o un artefacto
ausente del registro deja la publicación **Pendiente**, aunque el paquete
compile. El tag y la publicación son operaciones distintas de editar el código:
nunca se crean por inferencia.
