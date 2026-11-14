¿Dónde debe quedar una respuesta antes de verla en Notion?

## En 30 segundos

El KB es la fuente de verdad: primero Open questions del UXR, FLW o SCR y un DEC si hay una decisión; después Notion.
La conciliación detecta diferencias en ambos sentidos y solo propone: una persona decide qué aplicar.
Reglas aprobadas por Enzo el 2026-11-14; sustituyen el flujo de refinamiento primero en Notion del 2026-10-18.

## 1. Del KB a Notion

La respuesta, su estado, quién decide, fecha, fuentes e impacto se registran primero en la tabla **Open questions** del artefacto dueño. Si se decide, añade el DEC y enlázalo. No esperes al cierre de sesión para devolver decisiones al repo: esa regla queda reemplazada. Notion conserva la gestión, relaciones, vistas y comentarios; los documentos son espejos del KB.

Si se detecta una respuesta que alguien escribió en Notion, conserva la evidencia y propone incorporarla al KB. No la copies ni sobreescribas por tu cuenta. Antes de escribir durante una iteración, Enzo aprueba la propuesta de cambios a UXR, FLW, SCR y DEC, la captura y el estado. La aprobación de una propuesta UX no decide negocio.

## 2. Estados y vocabulario del KB

| Notion | KB en Open questions | Quién decide |
|---|---|---|
| Abierta | Abierta | Responsable identificado |
| Propuesta UX | Propuesta UX, pendiente de validar por Enzo | UX propone; solo Enzo valida |
| Propuesta | Propuesta o Respondida, pendiente de confirmar | PO, Negocio, Arquitectura, Seguridad o Analista |
| Decidida | Cerrada o Resuelta (también acepta Decidida) | Responsable autorizado, con DEC |
| Diferida | Diferida | Fuera del paquete o piloto actual; se reabre cuando se construya |
| Descartada | Descartada, Reemplazada, Absorbida o Duplicada explícita | Responsable autorizado |

**Propuesta UX es solo para las validaciones de Enzo.** Las propuestas de otros (PO, Arquitectura, Seguridad, Analista) no se tocan ni se remapean. Una Propuesta existente nunca se transforma automáticamente en Propuesta UX. Si se mezclan PO y UX, decide el PO y UX propone; permanece Propuesta. Los estados ambiguos se reportan para revisión, no se infieren de palabras sueltas en la pregunta.

**Decidida por delegación** no es un séptimo estado. Es Decidida, con `Decidido por = IA (delegado por Enzo)`, fecha y fuentes de benchmarking (NN/g, GOV.UK, Material, Carbon, Atlassian, Polaris o WCAG), registradas primero en el KB y el DEC. Se permite solo para prácticas estándar UX: textos, estados vacíos, mensajes, formatos y patrones. Nunca para negocio, permisos, datos o alcance; una pregunta mixta sigue con su responsable humano. Registra una columna Dominio con una de esas prácticas para poder verificar la delegación; la IA no simula una aprobación de Enzo.

## 3. Base Preguntas y bloqueos

Una fila por pregunta, clave **ID**; título `ID · pregunta completa`. Conserva Ruta en el repo, Enlace GitLab, Última carga, Producto, Responsable, Prioridad, Bloquea (No, Diseño, Desarrollo), Nivel de bloqueo (Flujo, Pantalla, Entrega, Documental), Duplicada y Equivale a. Relaciones a Historias, Paquetes, UXR, Flujos, Pantallas y Exploraciones. IDs de bases en config.json; el token nunca va allí.

Abierta (o Estado vacío), con Bloquea Diseño/Desarrollo y sin Duplicada, bloquea el diseño. Propuesta no bloquea diseño y sigue pendiente de su responsable para el paso a desarrollo. Propuesta UX queda pendiente de Enzo y su revisión se verifica por separado antes de cerrar: no se agrega al contador de PO. Diferida no se construye en el paquete actual y exige registrar cuándo se reabre.

La fórmula **Situación** muestra **Por validar (UX)** para Propuesta UX y **Por confirmar** para Propuesta. **Pendiente de confirmar (ID)** sigue contando solo Propuesta. No cambies propuestas de otros ni sus fórmulas por inferencia. Flujos, Pantallas, Exploraciones, Historias y UXS conservan sus indicadores y relaciones de bloqueo; Notion no admite rollup de rollup y usa fórmulas intermedias.

## 4. Página de pregunta

La propiedad **Respuesta** contiene un resumen de hasta **200 caracteres**, incluido el prefijo **[Confirma: X]** cuando está pendiente (Enzo para Propuesta UX; PO o responsable real para Propuesta). El texto completo nace en el KB y vive en el cuerpo de Notion:

- Encabezado 2: **Resolución**.
- Encabezados 3: **Respuesta**, **Fuentes y evidencia**, **Quién decide**, **Impacto**.

Nunca heading_1. Las fuentes deben permitir revisar la evidencia y sus límites; fecha y autoría no se inventan. Mantén contexto de la necesidad, qué se evalúa, alternativas, texto original y enlaces al KB. Las propuestas de IA llevan «(IA)». El contexto temporal generado por IA no constituye una respuesta mientras no esté registrado en el KB. Los resúmenes «En 30 segundos», vistas e indicadores pueden seguir siendo propios de Notion.

## 5. Conciliación en ambos sentidos

Ejecuta `scripts/conciliar-kb-notion.js` al retomar, antes de cargar y antes de cerrar. Lee la rama de config.json con git, sin checkout ni fetch; usa REST y ~/.notion/token.txt, sin MCP. Produce Markdown y JSON locales, nunca aplica cambios ni modifica la huella.

- **a, Notion → KB:** cierre o respuesta que el KB no refleja; propone Open questions y DEC.
- **b, KB → Notion:** cambio frente a la huella de la última carga verificada, incluidas fuentes de Arquitectura, PO e Infraestructura; propone actualizar y **Vigencia = Revisar por cambio de fuente**. También señala divergencia respecto de los valores cargados.
- **c:** pregunta en un solo lado; no crea, archiva ni descarta automáticamente.
- **d:** estados contradictorios, duplicación de ID o vocabulario ambiguo, incluso dentro del KB.

Los tipos pueden coincidir en una pregunta. La huella conserva por ID el hash de las fuentes, la fila canónica, el commit y los valores verificados en Notion. No se reconstruye desde la fecha ni desde el estado actual: sin huella la cobertura queda incompleta y no autoriza el cierre. La dependencia se calcula de forma conservadora por archivo completo: un cambio en un catálogo compartido puede exigir revisar varias preguntas. Las referencias a tablas antiguas de DUD/CPO sin pregunta canónica aparecen como solo Notion: deben migrarse mediante una propuesta humana.

## 6. Carga y recuperación

Primero concilia; una persona revisa el informe y aprueba los cambios concretos. Actualiza el KB aprobado y ejecuta extracción y preparación de respuestas. `subir-respuestas.js --dry-run` prepara un plan con la revisión del KB, las propiedades y el cuerpo actuales de Notion como precondiciones. Solo `--aplicar-plan <archivo>` aplica un plan aprobado; si cambió el KB o Notion, se detiene. opencode ejecuta la carga y el orquestador verifica leyendo. La huella se guarda fuera del repo únicamente tras la carga verificada; los scripts históricos de respuestas redirigen al cargador canónico.

No pises campos humanos ni cierres decisiones por otra persona. Conserva comentarios, vistas y contexto fuera de Resolución. Si Notion no está disponible, trabaja en el KB autorizado y registra pendientes; un paquete no se cierra con diferencias abiertas ni conciliación incompleta. Reglas y Referencias siguen sin cargarse como bases separadas: la evidencia vive en la pregunta.

## 7. Iteración y cierre UX

La investigación de la solución vive dentro de **Pantallas** y deja un **INV y un DEC** enlazados al SCR, incluso en la vía directa a código. En cada iteración con cambios en lo construido, propone la actualización de UXR, FLW, SCR y DEC, la captura y el estado; Enzo aprueba antes de escribir. La investigación sustenta la propuesta, no sustituye la validación.

Flujos, Pantallas y Exploraciones recorren **Borrador → En revisión → En construcción → Validado**. Validado exige prueba con Enzo en el navegador y captura de esa versión. La accesibilidad se evalúa sobre lo implementado antes de Validado; el contrato del Design System no reemplaza esa revisión. El esquema comprobable y los comandos de auditoría están en `../references/controles-de-cierre.md`.

¿Qué registro actualizas primero cuando Notion tiene una decisión que falta en el KB?

## 8. Estados en cadena, hacia arriba y hacia abajo

Pregunta → UXR: si todas sus preguntas están Decidida, Diferida o Descartada, propone En revisión; ninguna puede seguir Abierta, Propuesta UX o Propuesta. Si además todos sus flujos están En construcción o Validado, propone Aprobado (cerrado). **Enzo aprueba ese paso y registra approved_by**: la propuesta no equivale a la aprobación. Sin preguntas canónicas registradas no se infiere el cierre de un UXR vacío.

SCR → FLW: al menos una pantalla En construcción o Validado lleva el flujo a En construcción; todas Validadas llevan a Validado. SCR → IB: lienzo o capturas llevan a En revisión, una pantalla construida a En construcción y todas Validadas a Validado. La propuesta de Validado conserva la exigencia de evidencia del flujo o exploración; no copia una aprobación humana.

FLW/UXR → UXS/Paquete: En curso mientras falten definiciones o revisión. Diseño cerrado exige ausencia de preguntas que bloqueen diseño, aprobación real de los documentos y exploraciones resueltas. Listo para desarrollo agrega ausencia de propuestas por confirmar y verificación de lo construido (pantallas Validadas). Las preguntas Diferidas o Descartadas no se construyen en el alcance actual. Una aprobación meramente propuesta no satisface este cierre.

En el paquete se propone Borrador sin artefactos, En preparación mientras se define, Listo para selección de sprint con diseño cerrado, En sprint con construcción detectada y Cerrado tras validación completa. Estar En sprint no retrocede a selección solo porque falte la validación final. Los estados operativos de sprint son propuestas y los confirma una persona; no implican una asignación automática a un sprint.

Hacia abajo: cualquier cambio en una fuente del KB, también de Arquitectura, PO o Infraestructura, propone Vigencia = Revisar por cambio de fuente en sus preguntas y Resumen vigente = Desactualizado en UXR/FLW. Los documentos ya Validados o Aprobados vuelven a En revisión como propuesta. Las dependencias se recalculan hasta un punto fijo; una fuente invalidada tiene prioridad sobre un avance. No se deduce la vigencia por autor ni por fecha: se usa la huella verificada, también de documentos.

La conciliación usa estados canónicos del KB para las preguntas. Las decisiones que solo están en Notion deben conciliarse e incorporarse primero al KB; no aprueba un UXR apoyándose en un cierre remoto contradictorio. Guarda la propuesta con `--cascada-informe <salida.md>`; el JSON conserva cascada.propuestas y estadosCalculados. Ningún cambio se aplica. La auditoría de cierre bloquea si quedan propuestas o cobertura incompleta.

## 9. HU afectada: comentario al analista del DSP

La HU es del analista funcional de su paquete; el orquestador nunca la edita. Una respuesta o decisión que puede afectarla genera el tipo de diferencia «HU afectada → comentario al analista del DSP», con pregunta, cambio, HU, DSP conocido y AC o regla a revisar. Si faltan el DSP o la referencia exacta, la propuesta lo dice. Primero se concilia la respuesta al KB y Enzo aprueba el comentario; el analista decide si modifica la historia. Ni el script ni la cascada publican comentarios.

Antes de toda carga: corrida en seco completa, deduplicación por ID y aprobación de Enzo. Un ID con dos contenidos distintos o un registro con null/undefined bloquea el plan; no se escribe FIN para una carga parcial. La carga masiva usa REST para no agotar el cupo del MCP.
