# Referencias visuales y buenas prácticas de UI

Regla: **el patrón se busca primero en el propio sistema; una referencia visual
se pide solo si hace falta.** Una captura no es especificación (B4).

## 1. Orden de búsqueda (parar en el primero que responda)

1. **Patrón del DS.** Para una pantalla completa, `guidelines/patterns/index.md`
   del repositorio del DS (listado, formulario, detalle, login). Las guías por
   componente traen props, contrato a11y y trampas.
2. **Producto referente del equipo** ya construido con el DS (FleetOperations):
   verlo corriendo para comparar densidad, estados y paginación.
3. **Fuentes oficiales** del comportamiento (solo para logística/mapas,
   `logistics-patterns.md`).
4. **Pedir una referencia al usuario**, únicamente si lo anterior no resuelve una
   decisión visual concreta. Pedir una cosa precisa («¿cómo debe verse el estado
   vacío de X?»), no «mándame el diseño».

Desde el DS 1.6.0 las `guidelines/` viajan dentro del paquete
(`node_modules/@comsatel/ui-components/guidelines/`). Si faltan, se declara el
contrato faltante; no se deducen composiciones de los tipos.

## 2. Qué se extrae de una referencia (no su aspecto)

Anotar como práctica reutilizable, no como copia: jerarquía de la pantalla,
estados que cubre (carga, vacío, error, sin permiso), densidad, qué acciones
están primarias y cuáles secundarias, qué pasa en móvil, y dónde está el
resumen o el total. Cada práctica se traduce a componentes y tokens públicos.
Si la práctica se repite en dos pantallas, es candidata a plantilla del DS
(`cs-list-template` nació así): se propone al mantenedor, no se inventa local.

## 3. Pantallas tipo y su composición con el DS

| Pantalla | Composición | Trampas conocidas |
|---|---|---|
| Listado con filtros | Ver `mapa-del-piloto-y-reglas-ui.md` §1 y §2 (plantilla, tabla con 10 filas, vacío y error) | El buscador lleva etiqueta; el vacío ofrece «Limpiar filtros» |
| Login y pantallas públicas | `cs-auth-template` según su guía y `mapa-del-piloto-y-reglas-ui.md` §3 | El botón principal lleva `type="submit"` y se maneja `(submit)` del form; el foco inicial va al primer campo, nunca a «Acepto» |
| Inicio del shell | `cs-page-header` + `cs-list-item` por sección habilitada, `cs-empty-state` sin permisos | No hay `ul` con viñetas |
| Mensaje / error de página | `cs-empty-state` con ícono + botón primario | Sin detalles técnicos |

No existe `--color-text-danger`: el color de error viene de `cs-banner`, del
`errorMessage` de `cs-form-field` o de un token verificado en el paquete.

## 4. Encadenar con el diseño atómico

Antes de componer algo nuevo que no está en la tabla, usar
`web-atomic-component-designer` para decidir si es átomo, molécula o plantilla y
si pertenece al DS o al producto. El resultado se registra como brecha (ver
`arquitectura-proyecto.md` §4) y se pregunta al usuario antes de crear nada en
el DS.
