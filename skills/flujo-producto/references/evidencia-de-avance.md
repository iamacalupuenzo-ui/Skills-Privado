# Evidencia de avance: capturas y descripción en Notion

Regla de Enzo (2026-11-15). La usan `flujo-producto`, `flujo-ds`, `ux-a-desarrollo` y `em-gestion-tareas`. Cada vez que se construye algo, en un producto o en el DS, el avance
se deja en Notion con capturas y una explicación breve de cómo funciona. Se hace **mientras se
construye**, al terminar cada paso verificado, no solo al cerrar la tarea.

**Por qué:** Enzo no abre lo generado hasta que tiene que presentarlo. Si la evidencia vive en
la tarea, el día de la presentación ya está escrita, con captura, y no hay que reconstruirla.

## Tres recursos, un solo dueño por dato

| Recurso | Qué guarda | Qué no guarda |
|---|---|---|
| **La tarea FRONT** (base Tareas) | Lo completado, las capturas y cómo funciona | Nada se duplica en otra página |
| **La bitácora de construcción** (Recursos, «Bitácora · CL2 Flotas · Construcción…») | La sección «Avance por paquete»: una lista por DSP con la casilla marcada y el enlace a la tarea | Capturas |
| **La página de servidores** (Recursos, «Servidores y estados para probar…») | Qué servidor corre qué rama, y un enlace por estado y por usuario | Capturas nuevas (las anteriores se quedan) |

Las capturas viven en la tarea. La bitácora y la página de servidores solo marcan y enlazan:
así una captura nueva se sube una vez y no queda vieja en otra página.

Si la tarea madre (por ejemplo HOM-FRONT) agrupa subtareas, lleva solo una lista de avance
«al dd/mm» con una línea por subtarea.

## Estructura de la página de la tarea

Igual en todas, para que Enzo sepa dónde mirar:

1. Callout azul «**Antes de leer:**» con una pregunta cuya respuesta está en el texto.
2. `## En 30 segundos`: qué hace, dónde está (repo y rama) y qué falta para cerrarla. Máximo 3 líneas.
3. `## Cómo funciona`: viñetas cortas con el comportamiento real, citando la decisión o el UXR (D12, UXR-135-Q4…).
4. `## Qué se completó`: casillas. `[x]` solo para lo verificado en el navegador y con pruebas; `[ ]` para lo pendiente, con su responsable o la pregunta que lo bloquea.
5. `## Capturas`: una línea que diga qué muestra y debajo la imagen. Cada estado relevante (con datos, vacío, error, confirmación, solo lectura…).
6. `## Cómo probarlo`: la URL local o el enlace de cambio de usuario, y la mención a la página de servidores.
7. `## Comprueba`: una pregunta de comprobación.

H2 y H3, nunca H1. Español de Perú, sin voseo.

## Capturas

- Se toman en el navegador con lo construido corriendo: 1440 px y, si la pantalla cambia en el celular, 390 px.
- Nombre: `<tarea>-<nn>-<estado>-<ancho>.png` (por ejemplo `alt02-03-ficha-error-campo-1440.png`), en la carpeta de capturas del trabajo.
- Antes de subirla, **se mira** (Read de la imagen): una captura en blanco o a medio cargar no se sube.
- Subida a Notion: `notion-create-file-upload` → `curl -F file=@archivo` al `upload_url` con su cabecera (sin imprimir el token en el resumen) → `<image source="file-upload://ID" />` en la página.
- Un ID de file-upload ya adjuntado se puede reutilizar en otra página: no se vuelve a subir.
- Después de escribir, se hace `fetch` de la página y se comprueba que las imágenes quedaron como `notion-file-block://`.

## Cuándo se actualiza cada recurso

| Momento | Tarea | Bitácora | Servidores |
|---|---|---|---|
| Termina un paso verificado | Casilla, captura y «Cómo funciona» | Casilla del paquete | Solo si cambió un servidor, una rama o un usuario de prueba |
| Se levanta o cambia un servidor | — | — | Fila de la tabla y enlaces |
| Se abre un MR o se fusiona | «Qué se completó» y estado de la tarea | Casilla y nota corta | Rama del servidor, si cambió |
| Cambio en el DS | La tarea que lo consume, con la captura del catálogo o del producto | Sección «Design System» | Fila del DS, si cambió la versión |

El estado de la tarea («En curso», «Finalizada - falta merge»…) se mueve con las reglas de
este skill (B4, B9): la evidencia no cierra una tarea por sí sola.

## Señales de alerta

- Una tarea con estado «En curso» o «Finalizada» y la página en blanco.
- Una captura pegada en la bitácora o en la página de servidores en lugar de en la tarea.
- Una casilla `[x]` sin captura ni verificación en el navegador.
- Un enlace de la página de servidores que apunta a un puerto que ya no corre.
