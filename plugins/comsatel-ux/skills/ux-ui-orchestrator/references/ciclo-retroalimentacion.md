# Ciclo obligatorio de retroalimentación: desarrollo, diseño y artefactos

Dueño: `ux-ui-orchestrator`. Leer completo al iniciar y antes de cerrar **cada desarrollo,
mejora, análisis o definición de producto o diseño**, incluida una reanudación o un encargo
directo a un especialista. No depende de terminar una sesión, publicar o usar Figma.
El orquestador mantiene el ciclo; cada especialista conserva sus formatos y decisiones.

## GUARD y responsabilidades

1. Identificar proyecto, alcance (historias, pantallas, tareas), repos de front, backend,
   BFF y KB, bases de Notion y último informe. Leer README, AGENTS.md/CLAUDE.md y reglas
   de capas; no deducir destinos por nombres. Conservar cambios ajenos.
2. El **agente de verificación previa**, distinto de quien construye, ejecuta A y entrega
   un informe. No hace la sincronización. El **orquestador** comprueba ese informe,
   coordina los especialistas UX y B, y conserva los pendientes. **Quien construye**
   entrega commits, comportamiento real, pruebas y capturas actuales para B.
3. Sin agente aparte o acceso material para verificar el alcance, bloquear su inicio y
   declarar la capacidad que falta; no sustituir la revisión independiente por autolectura.
   La propia verificación previa está exenta de invocarse recursivamente.
4. Un informe solo se reutiliza dentro del mismo alcance y con las mismas referencias
   comprobadas. Si cambió código, KB, Notion, contrato o decisión, actualizar la revisión
   antes de continuar. Entre skills de un mismo trabajo se comparte el informe, no se
   abren ciclos recursivos. Un handoff transfiere las dos compuertas y su evidencia.
5. Para proyectos sin KB o Notion, comprobar y justificar cada destino no aplicable;
   no crear bases ni inventar repos. En CL2 Flotas ambos son aplicables: falta de acceso
   es pendiente/bloqueo, nunca «no aplica». Una instrucción explícita de solo lectura
   permite entregar el diagnóstico y la propuesta de sincronización sin escribir:
   informar «diagnóstico entregado; sincronización pendiente», nunca cierre integral.

## A. INICIO: verificación previa de solo lectura (B1)

**No comenzar el trabajo sin el informe recibido y revisado.** Se permiten lecturas de
API y `git fetch`; no checkout, stash, merge, commit, edición de repos, escritura en
Notion, instalación, build ni servidores. Solo se permite guardar el informe en el
destino autorizado del agente. No imprimir secretos ni mezclar ramas ajenas.

1. En la KB, ejecutar exactamente:

   ```sh
   git fetch origin develop:refs/remotes/origin/develop
   git ls-remote origin refs/heads/develop
   git rev-parse origin/develop
   git show origin/develop:<ruta>
   ```

   Comparar los SHA de `ls-remote` y `rev-parse`; si difieren, repetir el fetch y la
   comprobación antes de usar esa fuente. Un fetch normal puede dejar `origin/develop`
   obsoleto. Registrar SHA, fecha y comandos. Leer los artefactos con `git show`, nunca
   un worktree con cambios sin commit. Aplicar la misma precaución a fuentes ajenas.
2. Por historia/pantalla, contrastar código (rama, commit, capas del README, pruebas
   existentes, estado real de integración), KB (UXR/FLW/SCR/DEC/UXS y versiones) y
   Notion (contenido anterior, Preguntas y Tareas). Distinguir construido, validado,
   fusionado y desplegado; leer resultados previos no equivale a ejecutar pruebas.
3. Cruzar **todas** las preguntas abiertas de los UXR («Open questions») y Notion
   Preguntas con RSP-ARQ-*, RSP-DEV-*, DEC-*, DH en RCP-001, issues y sus comentarios,
   contratos API-PRP y decisiones de la sesión. Separar respondida con fuente,
   propuesta pendiente de confirmar, aún abierta y contradicción. El código o un mock
   por sí solos no constituyen decisión humana ni aprobación de contrato.
4. Revisar ramas y MR abiertos/fusionados del backend y BFF, contratos e issues; anotar
   qué cambió desde el último informe (o declarar que no hay línea base). Contrastar
   rutas, campos, permisos, validaciones, errores, límites, orden y comportamiento
   con lo que el front asume. Buscar también comentarios de MR y consultas de otros
   equipos dirigidas a UX, con su responsable y respuesta si existe.
5. Entregar el informe siguiente. No resolver contradicciones ni decidir por Enzo.
   El orquestador mantiene bloqueadas las piezas que requieran una decisión humana o
   evidencia material ausente; el informe no autoriza corregir o publicar por sí solo.

```text
Verificación previa — proyecto / alcance / fecha
Fuentes: KB SHA, front SHA/ramas, backend/BFF MR, páginas y bases Notion, línea base.
Historia | código y capas | KB y versión | Notion | discrepancia y fuente exacta
Pregunta ID | respuesta existente / abierta / contradicción | fuente | responsable
Novedades de Desarrollo y contratos; preguntas de otros equipos hacia UX.
Pendientes: construcción, brechas DS, decisiones de Enzo, trámites.
No comprobado: operación, motivo, impacto y quién puede desbloquearla.
```

Cada afirmación lleva **[verificado]**, **[inferido]** o **[no comprobado]**. Citar
archivo/sección/commit o URL de MR, issue, comentario o página, no solo el nombre del repo.

Tras la revisión, el orquestador actualiza las tareas que efectivamente comienzan al
estado vivo correspondiente; esta escritura queda fuera del agente de solo lectura.

## B. CIERRE: sincronización obligatoria (B2)

Se ejecuta al terminar **cada** desarrollo, mejora, análisis o definición, aunque no
haya merge. No declarar «terminado» sin comprobar KB, Preguntas, Tareas y evidencias.

1. **KB y diseño.** Repetir el fetch explícito y la comparación de SHA de A. Crear una
   rama nueva desde ese `origin/develop` fresco, en un worktree propio limpio. No partir
   de la rama antigua ni leer/copiar un worktree sucio. Respetar las convenciones de la
   KB, IDs permanentes y `generated.by`. Registrar lo que cambió en desarrollo y afecte
   al diseño: decisión, comportamiento, texto, contrato, estado, validación u orden.
   El orquestador deriva al dueño de UXR, FLW, SCR, DEC y UXS; actualiza `index.md` y
   `changelog.md` una sola vez y regenera la UXS con `ux-context-builder`. Añadir otros
   artefactos afectados (DTM/HOF, componente o diseño gobernado) cuando corresponda.
   Cada decisión conserva autor, rol, fecha y fuente; si falta autoría, declararla.
   Todo artefacto creado o modificado queda `status: draft`, jamás `verified`/`approved`.
   Conservar el antecedente aprobado y registrar contradicciones como pendientes del
   responsable; no fabricar consenso ni aprobación. Ejecutar los validadores reales
   de la KB y reportar cifras y fallos. Push, MR y merge conservan su autorización propia.
2. **Notion Preguntas.** Consultar schema vivo y localizar por ID antes de crear.
   Cerrar o actualizar cada pregunta cuya respuesta ya exista en la KB o se haya decidido
   en la sesión, citando fuente y quién decidió con su rol. Transcribir una decisión
   autorizada no equivale a decidir: una inferencia, propuesta no confirmada o fuente
   contradictoria queda abierta/propuesta con responsable. Preservar respuestas humanas
   e historial. Toda pregunta nueva queda tanto en «Open questions» de la KB como en
   Notion Preguntas, con el mismo ID, relaciones y responsable. Releer ambas copias.
3. **Notion Tareas.** Verificar el ambiente y el schema vivo de la base destino, y leer
   `gestion-proyectos` y `gestor-notion` (o `centro-operativo-uxui`/`notion-workspace`
   si están disponibles y corresponden a ese ambiente). No trasladar estados de otro
   workspace. En Tareas de CL2 se verificaron el 18-nov-2026 `Por hacer`, `En curso`,
   `Finalizada - falta merge` y `Completada` (también existe `Bandeja`); releer antes de
   cada escritura. Pasar a En curso al empezar; a Finalizada - falta merge si está
   construido y validado pero sin fusionar; a Completada al verificar el merge cuando
   es tarea de código. Para análisis/definición sin merge, aplicar su criterio de cierre
   con entregable comprobable. No marcar toda la tarea terminada por una subtarea.
   Adjuntar commits, MR y pruebas; completar Resultado y agregar una sección **Avance**
   con capturas del **build actual**, identificando commit, URL, estado y validación.
   Si no hubo build/UI, justificar la ausencia de capturas y enlazar el entregable real.
4. **Imágenes y texto anterior.** Subir cada imagen a Notion mediante `file-upload://`
   (con guion), esperar carga completa y releer la página: cada imagen debe tener un
   archivo asociado (puede retornar `notion-file-block://`), no solo ruta, pie o URL
   temporal. Verificar todas las imágenes añadidas. Revisar también el texto anterior
   que contradiga lo ejecutado; actualizarlo conservando historia y fuentes.
5. **Horas y fechas.** No son prioridad ni bloquean este cierre. No pedirlas ni cambiar
   propiedades de horas o fechas de tareas salvo petición de Enzo. La fecha de evidencia
   y la autoría documental sí se registran. Esta regla prevalece sobre rutinas de PM
   que soliciten fecha real u horas para cerrar una tarea dentro de este ciclo.
6. **Comprobar y reportar.** Releer archivos, estados, relaciones, cuerpo e imágenes.
   Reportar por destino qué se actualizó y su evidencia, qué no se pudo y por qué,
   responsable y siguiente acción. Si falla un acceso o falta autorización para una
   escritura/publicación, guardar el pendiente con su destino exacto y los datos
   preparados; no simular éxito. Se puede entregar trabajo local, pero el cierre
   integral sigue **BLOQUEADO** hasta completar la sincronización aplicable.

```text
Sincronización — alcance
Destino | actualizado (archivo/URL/commit) | comprobación | pendiente y motivo
KB y diseño; Notion Preguntas; Notion Tareas; imágenes/texto anterior.
Decisiones atribuidas; contradicciones y preguntas nuevas con responsable.
Inicio: informe y SHA / Cierre: completo o BLOQUEADO, con siguiente acción.
Horas/fechas de tareas: sin cambios, salvo solicitud explícita identificada.
```

## Ejemplos de aplicación y límites

- Pregunta abierta con respuesta RSP-ARQ: A la reporta sin escribir; B transcribe la
  respuesta atribuida en KB y Notion. Si otro DH la contradice, conserva ambas y no la cierra.
- Pantalla construida en rama: revisar capas contra README y contrato vigente, validar y
  capturar el build actual; sincronizar artefactos y usar el estado real sin fingir merge.
- Análisis que no cambió código: igual tiene inicio y cierre; registrar hallazgos y preguntas,
  vincular el informe y justificar que no corresponde captura de build.
- Sin Notion, sin agente independiente o con SHA de KB desigual: no declarar las compuertas
  cumplidas. «Lo actualizaré después» es un pendiente, no cierre.

Se evaluó automatizar: comparar SHA y comprobar cargas es mecánico, pero resolver repos,
alcance, contradicciones y atribución requiere juicio y capacidades de cada entorno. Por
eso no se añade un script que aparente certificar la ejecución real desde este catálogo;
los comandos de A y la relectura de B son evidencia obligatoria por ejecución.
