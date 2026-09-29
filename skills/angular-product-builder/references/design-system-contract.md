# Contrato de consumo de un sistema de diseño

Reglas que valen para cualquier sistema de diseño. Lo específico de cada sistema
(paquete, registro, estilos, tipografía y recetas) vive en
`references/design-systems/<sistema>.md`. Hoy existe `comsatel-ds.md`.

## Elegir el sistema

1. Si el repositorio ya instala un sistema de diseño, identificarlo en
   `package.json` y confirmarlo con el usuario solo si hay más de uno.
2. Si es un proyecto nuevo o no está claro, preguntar: “¿Usamos Comsatel DS u
   otro sistema de diseño? Si es otro, indica su paquete o repositorio y su
   documentación pública.”
3. Registrar la elección en el README del proyecto: nombre, paquete, versión
   fijada, documentación y mantenedor. Así la siguiente sesión no vuelve a
   preguntar.
4. Si el sistema elegido no tiene referencia en `design-systems/`, trabajar con
   su README y sus tipos públicos. Si el usuario lo va a usar seguido, proponer
   crear su referencia con `skill-builder`; no improvisarla dentro del proyecto.

## Límite de responsabilidad

La aplicación es dueña de sus dominios, datos, rutas, autenticación, reglas de
negocio y composiciones. El sistema de diseño es dueño de sus componentes,
tokens y contrato público. Nunca se copian su código fuente, demos, Storybook ni
CSS interno hacia una aplicación consumidora.

Antes de elegir componentes, leer el README instalado en `node_modules` o su
fuente pública. Esa es la API vigente: no inventar imports ni mantener una lista
duplicada dentro de este skill.

## Proyecto existente o nuevo

1. Si el usuario da un repositorio destino, leer su `package.json`, rutas,
   scripts, arquitectura y cambios pendientes antes de editar.
2. Si no existe un destino y pidió una pantalla o flujo durable, crear una
   aplicación Angular limpia en la ruta aprobada:

   ```sh
   npx @angular/cli@22 new nombre-de-la-aplicacion --routing --style css --standalone --strict --skip-git
   ```

3. Una pantalla aislada sigue siendo una aplicación consumidora: no se crea
   dentro del repositorio del sistema de diseño ni se convierte una demo en base
   de producto.

## Instalación y estilos

- Instalar una versión explícita, nunca `latest` ni un rango automático en la
  primera adopción.
- Los secretos del registro (si es privado) viven en una variable de entorno del
  usuario, nunca en el repositorio ni en el chat. Solo se versiona la
  configuración del registro sin token.
- Importar los estilos oficiales una vez desde `src/styles.css` y establecer la
  base tipográfica global con los tokens públicos del sistema. No agregar
  `@font-face`, URLs de fuentes ni familias propias para reemplazarlos.
- Los estilos encapsulados de cada componente viajan con el componente; la
  aplicación no los replica.

## Cómo se importa cada componente

Cada sistema de diseño decide cómo se reparte su código, y el producto lo sigue.
No aplicar por costumbre la forma de otro sistema:

1. Leer `exports` del `package.json` instalado del sistema elegido (y su
   README). Hay dos formas habituales:
   - **Un punto de entrada por componente** (Angular Material, PrimeNG,
     Comsatel DS desde 0.6.0): cada componente se importa desde su subpath,
     por ejemplo `@angular/material/button`. Es la forma que hay que usar.
   - **Una sola entrada**: todo se importa desde la raíz del paquete.
2. Si el sistema publica subpaths, **cada** import del producto va por subpath,
   incluidos los de servicios, pipes y tipos. Un import desde la raíz junta en un
   mismo chunk todo lo que la aplicación importa desde ahí, y cada pantalla lo
   descarga completo aunque use pocos componentes.
3. Nunca importar entradas marcadas como internas por el sistema (por ejemplo
   `/shared` en Comsatel DS) ni rutas de archivos internos (`fesm2022/`,
   `types/`, `src/`).
4. Registrar la regla en las instrucciones del repositorio destino (CLAUDE.md o
   AGENTS.md) para que la siguiente sesión no la redescubra.
5. Para medir el efecto, comparar dos builds con `--stats-json` del mismo código
   y lockfile, cambiando solo los imports; no prometer un ahorro sin esa medición.

La receta concreta de cada sistema (qué subpaths existen, dónde se consultan)
vive en `references/design-systems/<sistema>.md`.

## Formularios

Clasificar cada texto antes de aplicar estilos: título de pantalla,
introducción, etiqueta de campo, etiqueta de control de elección, ayuda y
estado. Los labels de campos equivalentes comparten el rol de etiqueta de campo:
medir en el navegador el label encapsulado del componente publicado y usar ese
mismo rol en la etiqueta externa. No declarar reglas globales sobre `label`.
Elegir un tamaño de control coherente para todo el grupo.

## Dependencias

Se permite usar los scripts de la aplicación (`npm run build`, `npm test`, lint
o e2e) y Angular CLI 22 para bootstrap. No instalar PrimeNG, Material, Tailwind,
otro kit UI, una librería de mapas ni otra dependencia visual para reemplazar el
sistema elegido sin una solicitud explícita y una evaluación de compatibilidad,
licencia, bundle y accesibilidad.

## Contrato faltante

Un error de registro, versión o API pública faltante es un bloqueo del contrato:
documentarlo y pedir la mejora al mantenedor del sistema (para Comsatel DS,
`comsatel-design-system`). No resolverlo copiando fuentes ni pidiendo permisos
de repositorio.
