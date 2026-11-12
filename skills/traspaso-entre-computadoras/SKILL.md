---
name: traspaso-entre-computadoras
description: >
  Traspaso de trabajo entre computadoras en las dos direcciones: el cierre obligatorio
  de la que se va (commit, push, página de estado en Notion, mensaje para pegar) y el
  arranque de la que llega (leer el estado, preparar el equipo, descargar, verificar y
  retomar). Úsalo cuando el usuario diga «cambio de computadora», «voy a seguir en otra
  PC», «dame el mensaje para la otra computadora», «retoma lo que dejó la otra
  computadora», «cierra la sesión para pasar a otro equipo» o «deja todo listo para
  continuar». No construye ni versiona nada del Design System (usa flujo-ds) ni de un
  producto (usa flujo-producto): solo garantiza que el trabajo y su contexto viajen.
metadata:
  version: "1.0.0"
---

# Traspaso entre computadoras

La memoria de un agente es local a cada computadora y git solo lleva lo que se sube. Sin un
cierre, el trabajo sin commit, las ramas sin push y las copias locales se pierden. Este skill
hace que las dos computadoras hagan lo mismo cada vez: la que se va deja todo en remotos y en
una página de estado; la que llega la lee y retoma.

## Referencias disponibles

- `references/mensaje-de-arranque.md` — la plantilla del mensaje que el usuario pega en la computadora que retoma. Leer al entregar el mensaje.

## GUARD — verificar contexto

1. Hay Notion conectado (herramienta de Notion con búsqueda y lectura). Sin él no hay dónde dejar el estado: decirlo y detenerte.
2. Ubica la página de estado («Retomar el trabajo … (traspaso vivo)», en la base Recursos). Si no existe, créala en el primer cierre con las secciones de abajo.
3. Confirma qué repositorios y ramas están en juego (`git status` y `git branch -vv` en cada uno) antes de afirmar qué falta por subir.
4. La VPN corporativa debe estar activa para GitLab; si la API responde 503, es la VPN, no el cambio.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `IRSE` | «me cambio de computadora», «termino por hoy», «deja todo listo» | Cierre obligatorio (abajo) |
| `LLEGAR` | «retoma lo que dejó la otra computadora», el usuario pega el mensaje de arranque | Arranque (abajo) |
| `MENSAJE` | «dame el mensaje para la otra computadora» | Cierre completo y luego entregar el mensaje |

## IRSE — cierre obligatorio

1. **Commit de todo lo trabajado**, incluido lo ajeno a la tarea que esté sin commit. Nada se queda solo en el disco. Cada repositorio lleva su propia revisión de `git status`.
2. **Push** de las ramas (el DS a GitLab, el piloto a GitHub) y los MR con César de revisor (`reviewer_ids=[91]`), **solo con la confirmación del usuario**. Si algo está apilado sobre un MR sin fusionar, avisar de no fusionar el de arriba antes de reapuntarlo.
3. **Actualizar la página de estado** con: estado de cada MR verificado con la API y con fecha; ramas y commits; qué se hizo; qué quedó sin comprobar en pantalla; pendientes en orden.
4. **Anotar lo que no viaja por git**: capturas, memoria local, copias dentro de `node_modules`, servidores levantados, variables de entorno. Y avisar si un consumidor necesita una versión del DS que aún no está publicada.
5. **Actualizar la memoria local** y entregar al usuario el mensaje listo para pegar (`references/mensaje-de-arranque.md`), con enlaces e imágenes de lo trabajado.

## LLEGAR — arranque

1. Leer la página de estado completa. Guardar en la memoria local las reglas de trabajo y el estado.
2. Preparar el equipo: VPN, variables de entorno (`GITLAB_TOKEN` y `GITLAB_NPM_TOKEN`; si faltan, pedirlas al usuario), Git, Node y Chrome.
3. Descargar el DS y el piloto en las ramas indicadas y correr `npm ci`.
4. Si el consumidor usa un DS sin publicar, construirlo y copiarlo a `node_modules` (ver `flujo-ds`, B8) y reiniciar el servidor.
5. **Verificar el estado real con la API** y no fiarse solo de la página: puede estar vieja.
6. Resumir al usuario en pocas líneas lo que entendiste y preguntar qué sigue. No modificar nada antes.

## Qué lleva la página de estado

Reglas de trabajo con el usuario; dónde está cada cosa (repos, ramas, puertos, enlaces); estado con fecha y la consulta de API que lo verifica; preparar el equipo; cómo actualizar la librería; cómo actualizar el consumidor; pendientes en orden; capturas de lo evaluado; y este protocolo.

## Comportamientos bloqueantes

- **B1 — No se da el cierre por hecho sin commit y push.** Lo que solo está en el disco se declara como tal y se pide autorización para subirlo.
- **B2 — Nada se sube sin la confirmación del usuario** (push, MR, etiqueta). `release`, las etiquetas y `main` son del arquitecto.
- **B3 — Los tokens no viajan por Notion, por el chat ni por archivos del repositorio.** Se nombran las variables de entorno y se le pide al usuario que las ponga.
- **B4 — El estado se verifica con la API, con fecha.** No se copia de la memoria: se consulta y se escribe lo observado.
- **B5 — Lo que no viaja por git se anota explícitamente** en la página.
- **B6 — La página se actualiza antes de entregar el mensaje.** Un mensaje que apunta a una página vieja manda al agente siguiente en una dirección equivocada.
- **B7 — Al llegar no se empieza a trabajar sin resumir y preguntar.**

## Racionalizaciones comunes

| Dices | Realidad |
|---|---|
| «Está todo en la rama, no hace falta cerrar» | Si hay cambios sin commit o sin push, no está. Se revisa `git status`. |
| «La página ya lo dice, no verifico» | Envejece. Se consulta la API y se escribe la fecha. |
| «Pego el token para que funcione allá» | Nunca. Se pide que el usuario cree las variables de entorno. |

## Formato de respuesta

Declarar el modo. En `IRSE` y `MENSAJE`, cerrar con: qué quedó subido (con commit y rama), qué no, el enlace de la página de estado y el mensaje en un bloque de código para copiar. Dejar siempre enlace del recurso e imagen de lo trabajado cuando hubo cambios visibles.
