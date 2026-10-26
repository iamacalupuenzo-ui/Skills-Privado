# Verificación de aplicaciones consumidoras

## Antes de cerrar

### Playground del producto

Para todo cambio que afecte una interfaz, abrir la ruta real de la aplicación
en el navegador de validación local. No cerrar solo con build, pruebas o
inspección de código.

- Revisar el estado en reposo y el estado que cambia con la interacción
  (por ejemplo: foco, menú abierto, selección, error, carga o cierre).
- Cuando dos controles deban ser equivalentes, comparar su altura, bordes,
  tipografía y alineación del ícono directamente en el navegador. Para una
  discrepancia visual sutil, medir estilos computados y
  `getBoundingClientRect()` antes de declarar que comparten tamaño.
- Ejecutar el recorrido real con mouse y teclado, y revisar el árbol de
  accesibilidad tras la acción. Una captura de estado base no prueba un
  overlay ni una selección.
- El playground del producto es el navegador que sirve la aplicación que se
  está construyendo. Storybook, una página de documentación del DS o una
  referencia externa pueden usarse como contraste, pero no reemplazan esta
  evidencia.
- Si la ruta local no puede abrirse, declarar la verificación pendiente con
  la causa concreta; no afirmar conformidad visual.

- El sistema de diseño está confirmado y registrado en el README del proyecto.
- La aplicación usa una versión explícita de la librería y el lockfile refleja
  esa adopción; no hay fuentes internas copiadas.
- Los estilos públicos se importan una sola vez y los componentes se importan
  desde la API pública.
- El `body` usa los tokens tipográficos públicos del sistema (en Comsatel DS,
  `--font-family-content`); se comprueba en el navegador la familia computada de
  texto fuera de componentes. No hay `@font-face`, URL de fuentes ni familias
  propias agregadas por la app.
- En formularios, los labels de campos equivalentes tienen la misma familia,
  tamaño, interlineado y peso computados. La diferencia entre etiqueta de campo,
  etiqueta de opción y ayuda solo se conserva cuando responde a la anatomía del
  componente publicado; no se imponen reglas globales sobre `label`.
- La auditoría diferencia el label del texto escrito o placeholder dentro del
  control. En Comsatel DS, el tamaño de `cs-input` y `cs-select` es consistente en el mismo
  formulario; si `md` no aporta legibilidad suficiente para el contexto, se
  adopta `lg` en ambos. Un cambio del tamaño estándar de labels se deriva al DS,
  nunca se resuelve con una excepción de una sola pantalla.
- La ruta se abre, el flujo principal completa y cada estado del plan se
  verifica: carga, vacío, error, permisos, responsive y recuperación aplicable.
- Si hay caso de uso, cada criterio de aceptación (CA) queda verificado con su
  evidencia, y cada alterno, error y estado de pantalla del caso existe en la
  interfaz. Lo marcado como Pendiente se declara en el cierre, no se simula.
- La navegación por teclado conserva orden y foco; controles tienen nombre;
  errores y estados se anuncian sin interrupciones innecesarias.
- Un mapa, si existe, tiene alternativa de lista/detalle y comunica frescura,
  error y selección.
- Notificaciones tienen severidad, acción y política de persistencia acordadas;
  no se duplican ni expiran antes de ser útiles.
- Ejecutar build, pruebas y lint/e2e definidos por el proyecto destino **solo
  si las reglas del repositorio lo permiten** (`arquitectura-proyecto.md`,
  sección 1). Si el repositorio prohíbe ejecutarlos sin pedido del usuario:
  no se ejecutan; la compilación se verifica leyendo los logs del servidor de
  desarrollo ya corriendo (sin errores de compilación), el recorrido crítico
  se prueba en el navegador y el cierre declara "build y pruebas no ejecutados
  por regla del repositorio; los corre el usuario". Si no existe una prueba,
  declarar el recorrido manual y su evidencia.
- Las reglas de arquitectura del repositorio se verifican con su checklist
  (`arquitectura-proyecto.md`, sección 3.7): tamaño de archivos, shell sin
  lógica de negocio, mutaciones solo en el servicio de transiciones, diálogos
  en su propio componente, plantilla y estilos según la convención.
- Los tokens CSS del Design System usados en código nuevo existen de verdad en
  los archivos públicos del paquete instalado (ver la referencia del sistema
  elegido); un token que solo aparece en el código compilado del DS no cuenta.
- Si el cambio toca varios archivos y otro agente o persona editaba a la vez,
  el cierre lista qué archivos ajenos cambiaron en disco durante la sesión y
  qué se hizo (nada, avisar o una corrección mínima explicada).

## Casos de evaluación del skill

| Entrada | Resultado esperado | Fallo detectado |
|---|---|---|
| “Crea un login” sin repo ni sistema indicado | Pregunta qué sistema de diseño usar antes de instalar nada. | Instalar Comsatel DS (u otro) por costumbre. |
| “Crea un login con Comsatel DS” sin repo | Plan + bootstrap limpio, librería versionada y estilos públicos. | Clonar o modificar Comsatel DS. |
| “Construye CU-3764-01” | Lee el caso y la ficha, construye flujo, alternos, errores y estados, y verifica cada CA. | Construir solo el camino feliz o de memoria. |
| “Mejor que no pida confirmación antes de guardar” durante el desarrollo | Pausa esa pieza y deriva la Solicitud de ajuste a `epica-a-plan-desarrollo`. | Cambiar el código y dejar el caso de uso desactualizado. |
| “Usa mi sistema de diseño personal” | Pide paquete y documentación, lo registra en el README y trabaja con su API pública. | Suponer que funciona como Comsatel DS o copiar sus recetas. |
| “Agrega alertas de flota” en repo existente | Plan de severidad, audiencia, estado y recuperación antes de UI. | Toast genérico sin acción o duplicado. |
| “Haz un mapa de unidades” | Lista equivalente, dato fresco/obsoleto y estados de mapa. | Mapa visual sin alternativa ni error. |
| “Actualiza la librería” | Cambio explícito de versión y lockfile, pruebas de regresión. | `latest` o CSS copiado. |
| API pública insuficiente | Bloqueo documentado y propuesta para DS. | Acceder a `node_modules` interno. |
| Pantalla con texto propio | Base tipográfica desde tokens públicos y familia computada verificada. | Heredar la serif del navegador o cargar una fuente ajena. |
| Formulario con Input y Select | Labels de campos equivalentes comparten tokens y valores computados. | Dejar un label nativo heredando el cuerpo o sobrescribir Checkbox globalmente. |
| Formulario con baja densidad | Labels y texto interno se miden por separado; Input y Select usan `lg` de forma consistente si el contexto requiere más legibilidad. | Aumentar solo un label local o mezclar `md` y `lg` sin jerarquía. |
| Repositorio con `CLAUDE.md` que prohíbe ejecutar build y pruebas | Lee el archivo antes de editar, no ejecuta build ni tests, verifica por logs del servidor y navegador, y lo declara en el cierre. | Ejecutar `ng build` "para verificar" porque este skill o el skill de Angular lo recomiendan. |
| Pantalla nueva con filtros, tabla, formulario y diálogos | Shell delgado, servicio de pantalla, servicio de transiciones y un componente por diálogo desde el diseño inicial. | Un solo componente de página de miles de líneas. |
| Acción que crea, edita o cierra datos | La mutación vive en el servicio de transiciones; el de pantalla la envuelve y actualiza signals. | Llamar `create`/`update`/`close` del servicio de datos desde el servicio de pantalla. |
| Repositorio sin archivo de reglas | Propone el patrón de referencia, pide confirmación y lo deja escrito en un `CLAUDE.md`. | Decidir la estructura en silencio. |
| Otro agente rompe la compilación en un archivo ajeno | Reporta archivo y síntoma; no completa su diseño ni revierte su cambio. | Reescribir o revertir el trabajo del otro agente. |
| Error `Failed to resolve styles at position 1` | Busca un `` ` `` suelto en un comentario CSS de los estilos inline recién editados. | Borrar la caché o reinstalar dependencias a ciegas. |
| “Audita el proyecto” en un repositorio con reglas propias | Modo AUDITAR: mediciones de solo lectura, hallazgos con evidencia, decisiones conscientes aparte, backlog priorizado y sin editar código. | Reportar como error lo que el repositorio decidió a propósito, o corregir sin aprobación. |
| Un `effect` que hace `.set()` sobre otra señal | Lo señala como hallazgo (regla oficial de efectos) y propone `computed`/`linkedSignal`. | Dejarlo pasar por "funciona" o reescribir todos los efectos de una vez. |
| Editar `angular-developer` para "ajustarlo" a un proyecto | Se niega: la regla local va en `angular-product-builder` o en el `CLAUDE.md` del proyecto; `npm test` detectaría el cambio. | Modificar la copia vendorizada. |
| Necesita una pieza de Angular (formularios, señales, rutas) | Consulta la referencia oficial puntual y respeta las reglas del repositorio cuando difieren. | Aplicar de memoria una práctica de otra versión de Angular. |
