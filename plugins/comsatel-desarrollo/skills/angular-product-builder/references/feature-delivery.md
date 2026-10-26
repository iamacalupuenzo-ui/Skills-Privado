# Entrega de una característica Angular

## Arquitectura de producto

Usar la estructura existente y las reglas del repositorio. **Antes de crear o
editar una pantalla, leer `arquitectura-proyecto.md`**: define la precedencia
entre reglas (usuario > repositorio > este skill > guía general de Angular), el
protocolo de entrada a un repositorio, el patrón validado de pantalla (shell +
servicio de pantalla + servicio de transiciones + diálogos por componente), el
registro de brechas del Design System y las trampas reales ya ocurridas. Para
cómo se escribe Angular actual (señales, formularios, DI, rutas, pruebas), leer
`angular-moderno.md`.

En una base nueva, separar:

```text
src/app/
  core/             sesión, clientes API, guards, interceptores, configuración
  layout/           shells, navegación y áreas compartidas autenticadas
  features/         flujos de negocio y sus rutas
    dominio/feature/ página, estado, validación y componentes locales
  shared/           utilidades exclusivamente de la aplicación
```

Una composición como login, tablero de seguimiento o panel de alertas vive en
`features/`, no en la librería. Un componente local se extrae solo si se repite
en el producto; se propone para el Design System únicamente con evidencia de
reutilización entre plataformas.

Una pantalla con más de una pieza entre filtros, tabla, formulario y diálogos
no se construye en un solo archivo: se divide desde el diseño inicial según
`arquitectura-proyecto.md`, sección 3.

## Secuencia de construcción

1. Leer las reglas del repositorio (`CLAUDE.md`/`AGENTS.md` y los documentos
   que enlaza), el plan, el contrato público y la arquitectura destino. Correr
   `git status` y anotar los archivos que ya tienen cambios ajenos.
2. Identificar componentes existentes antes de escribir markup o CSS local.
3. Crear ruta, estado y datos simulados o reales claramente etiquetados. Las
   mutaciones van en el servicio de transiciones, no en el de pantalla.
4. Construir primero el flujo principal y luego cada estado acordado.
5. Implementar validación, progreso, recuperación y feedback sin duplicar
   acciones ni perder datos ingresados.
6. Revisar teclado, foco, lectura de mensajes, contraste y tamaños móviles.
7. Verificar según la regla del repositorio: ejecutar los scripts reales solo
   si el repositorio lo permite; si lo prohíbe, leer los logs del servidor de
   desarrollo, revisar el código y probar la interacción crítica en el
   navegador, y declarar qué no se ejecutó.
8. Si se halló una brecha del Design System, registrarla en el documento de
   brechas del repositorio; si se tomó una decisión de estructura no cubierta,
   registrarla en el documento que corresponda.

## Decisiones de composición

Elegir componentes por significado y comportamiento público, no por similitud
visual. Si se necesita una variación de layout, componer con HTML semántico y
tokens expuestos por `styles.css`; no alcanzar archivos internos del paquete.

Para una decisión de UX, declarar el propósito del patrón, el tradeoff y su
efecto en operadores, supervisores o administradores. Si una necesidad altera
seguridad, datos, notificaciones persistentes, roles o una integración de mapa,
planificarla antes de codificar y pedir dirección si el requisito no existe.
