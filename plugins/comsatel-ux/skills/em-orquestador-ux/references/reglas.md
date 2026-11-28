# Reglas de bloqueo, operación y lecciones

Leer antes de escribir en la KB o en Notion y cuando una regla de SKILL.md no alcance para
decidir. SKILL.md trae cada regla en una línea; aquí está el porqué.

## Índice

1. Reglas B1 a B4: ciclo y paridad
2. Reglas B5 a B12: dónde está su detalle
3. Racionalizaciones comunes
4. Reglas de operación
5. Lecciones de la sesión del 2026-11-14
6. Informe final al usuario

## 1. Reglas B1 a B4: ciclo y paridad

- **B1 — Inicio sin verificación previa, bloqueado.** No iniciar sin el informe de solo lectura de un agente distinto de quien construye y la comprobación de fuentes que exige `references/ciclo-retroalimentacion.md`; si faltan acceso o agente, declarar el bloqueo.
- **B2 — Cierre sin sincronización, bloqueado.** No declarar terminado un desarrollo, mejora, análisis o definición sin ejecutar y comprobar el cierre de `references/ciclo-retroalimentacion.md`. Un destino pendiente se reporta como cierre BLOQUEADO, nunca como completado.
- **B3 — Estado de tareas atrasado respecto del hecho.** Al fusionarse un MR, entregarse un paquete (handoff y pase vivo) o descartarse un trabajo, actualizar la tarea de Notion en ese momento según la sección C de `references/ciclo-retroalimentacion.md`, con evidencia y sin dejar `Completada` con `Resultado = Pendiente`. Un paquete no se da por entregado sin sus dos recursos.
- **B4 — Paridad KB-código obligatoria.** En cada cierre de front/documentación y antes
  de abrir su MR, invocar `paridad-diseno-desarrollo`, modo KB-CODIGO, y su
  [protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/paridad-diseno-desarrollo/references/paridad-kb-codigo.md).
  Sin ejecución sobre fuentes finales, cobertura suficiente y exit 0, o con contradicciones
  pendientes, bloquear cierre/MR. El comparador no otorga aprobación humana.

## 2. Reglas B5 a B12: dónde está su detalle

| Regla | Detalle |
|---|---|
| **B5** — Sin UXS no hay cierre ni push de la rama de diseño | `estados-y-compuertas.md`, sección 2, y `controles-de-cierre.md` |
| **B6** — KB primero; Notion refleja la KB | Sección 5 de esta guía y `tareas-y-notion.md`, sección 3 |
| **B7** — No inventar | Sección 4: «No inventar» |
| **B8** — Sin prueba de Enzo no hay Validado ni aprobación | `estados-y-compuertas.md`, secciones 3 y 6 |
| **B9** — La IA cierra solo preguntas UX estándar | Sección 5: «Delegación limitada a UX estándar» |
| **B10** — La historia es del analista | Sección 5: «La HU pertenece al analista funcional» |
| **B11** — Actualizar, no reemplazar | Sección 4: «Actualizar, no reemplazar» |
| **B12** — Preservar contradicciones | Sección 4: «Preservar contradicciones» |

## 3. Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| «La KB ya menciona la diferencia; puedo cerrar» | La contradicción preservada no es paridad. Ejecutar KB-CODIGO y resolver la divergencia con su responsable antes del cierre/MR (B4). |
| «La KB local o mi memoria bastan para empezar» | La revisión independiente contrasta referencias remotas frescas, código y Notion antes de avanzar (B1). |
| «El build pasó; actualizaré los artefactos cuando termine la sesión» | Cada trabajo termina con sincronización comprobada; build o merge no sustituyen ese cierre (B2). |

## 4. Reglas de operación

- **Actualizar, no reemplazar.** IDs permanentes (UXR, FLW, SCR, CMP, TKN, GEN, STP, DD, ARP, HOF, DTM). Nunca renumeres ni dupliques.
- **Propagar hacia atrás y parar a tiempo** (Enzo, 2026-11-28). Si lo construido difiere, el cambio sube desde lo más cercano al código: SCR → nota en la IB → FLW → UXR → UXS, y se detiene en el primer nivel que ya no cambia (texto o componente: SCR; paso o pantalla: + FLW; capacidad o regla: + UXR y, si es negocio, pregunta al PO). La UXS va siempre al final; la IB no se rehace, se anota como superada por el DEC; la HU no se edita. Detalle en `ux-a-desarrollo/references/seguimiento-de-cambios.md`.
- **Sin huérfanos.** Todo artefacto de diseño cuelga de FLW/SCR y estos de US/UXR. El DTM es la **única** fuente del vínculo SCR↔Stitch/Figma; no copies referencias externas al SCR.
- **Exploración ≠ diseño gobernado.** Claude Design (y Stitch, si se usa) exploran. El diseño se gobierna en Claude Design con un DD humano, o con el prototipo construido en código y validado al terminar de construir; Figma gobierna solo si se usa. Al desarrollo nunca se entrega un artefacto Stitch si existe Figma gobernado.
- **No inventar.** Ante un vacío (permiso, estado, contenido, token), abre pregunta. No aceptes contenido que Stitch inventó; anótalo.
- **Accesibilidad es evidencia, no una frase.** Se apoya en la estructura de los componentes del Design System (el contrato de accesibilidad de cada uno); lo propio de cada pantalla se verifica al validar lo construido. Que una herramienta diga "WCAG AA" no es evidencia; `pass` solo si se evaluó.
- **Preservar contradicciones** entre fuentes; no elijas por tu cuenta.
- **Verificar en vivo** las referencias Stitch y Figma antes de usarlas; si no se puede, es pregunta abierta, no un dato.
- **Fechas y autoría** en frontmatter OKF v0.2: `generated.by` del skill que produjo el archivo (el de la UXS es `ux-context-builder/1.0`), `generated.at` ISO 8601 con `-05:00`.
- **Solo diseño.** Coordinar la retroalimentación del desarrollo está incluido; escribir su código no. Si el pedido se desliza a negocio/requerimientos, arquitectura o código, detente y señala el skill de la etapa correspondiente.

## 5. Lecciones de la sesión del 2026-11-14

- **KB primero y conciliación en ambos sentidos.** Notion refleja el KB. Toda respuesta, decisión y estado se registra primero en Open questions de UXR/FLW/SCR y en DEC cuando se decide; una diferencia se propone y se aprueba antes de aplicarla.
- **Delegación limitada a UX estándar.** La IA cierra textos, estados vacíos, mensajes, formatos o patrones con benchmarking, fecha, DEC y fuentes, como IA (delegado por Enzo). Nunca cierra negocio, permisos, datos ni alcance.
- **Propuesta UX es solo para Enzo.** Las propuestas ajenas no se remapean. Si intervienen PO y UX, decide el PO y UX propone. Diferida significa que la función no se construye en este paquete o piloto; se reabre al construirla.
- **Resumen y detalle tienen lugares distintos.** Respuesta tiene hasta 200 caracteres y [Confirma: X] si está pendiente; el detalle vive en Resolución, con sus cuatro heading_3. Nunca heading_1 en Notion.
- **Lo construido deja evidencia y mueve sus dependencias.** Nada permanece en Borrador con código detectado. Propón estado, captura y actualización en cadena; Validado requiere prueba con Enzo y ARP implementado. Una fuente modificada devuelve a revisión lo aprobado o validado.
- **Corrida en seco y aprobación de Enzo antes de escribir en Notion.** Muestra el plan concreto completo; no conviertas una propuesta ni el silencio en aprobación. La escritura masiva usa API REST, no MCP: el cupo del MCP se agota. La conciliación solo lee por REST.
- **Un plan, un registro por ID.** Deduplica antes de cargar. IDs repetidos con contenido distinto bloquean el plan; campos null, undefined o registros sin ID impiden darlo por completo. Los workers no escriben FIN hasta cubrir todos los registros; los pendientes se explican y nunca se esconden con nulls.
- **Los estados se retroalimentan, no bajan en una sola dirección.** Una pregunta mueve su UXR; una pantalla mueve su flujo y su exploración; flujos y UXR mueven la UXS y el paquete; un cambio en el KB vuelve a abrir lo que depende de él. Recalcula hasta que nada cambie. **El alcance del paquete lo decide el gestor de proyectos** con el sprint de GitLab: la cascada nunca hace retroceder un paquete, y la entrada a «En sprint» o «Cerrado» solo se propone para que él la confirme. UX puede cargar sus tareas en un sprint antes que Desarrollo.
- **La HU pertenece al analista funcional de su DSP.** Si una respuesta o decisión la afecta, no la edites. Propón un comentario para ese analista: ID de pregunta, qué cambió y AC o regla a revisar. El analista decide el cambio; Enzo aprueba el comentario. Si falta el DSP o el AC exacto, decláralo; no inventes destinatarios. El comentario no se envía automáticamente.

## 6. Informe final al usuario

Incluye siempre el informe de inicio y la matriz de sincronización de `references/ciclo-retroalimentacion.md`. Cierra con un resumen breve, en este orden: escenario y ruta ejecutada; artefactos creados/actualizados; resultado de auditoría, preflight y gate (errores restantes); veredictos por consumidor; decisiones humanas pendientes; siguiente skill recomendado. Declara lo que no se pudo verificar u omitió (p. ej. Stitch/Figma inaccesibles).
