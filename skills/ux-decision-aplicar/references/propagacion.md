# Propagación: qué archivos tocar cuando Enzo decide

Leer antes de editar. Cada decisión de Enzo se escribe **una vez** como fuente (DEC) y el resto remite a ella.

## Matriz

| Orden | Archivo | Qué se hace | Siempre |
|---|---|---|---|
| 1 | `decisions/ux-ui/decisiones/DEC-NNN-<tema>-<AAAA-MM-DD>.md` (o `design/decisiones/` si el árbol es antiguo) | Crear DEC nuevo, o agregar D# a uno `draft` del mismo tema. Nombre y número con `scripts/siguiente_id.py DEC` | Sí |
| 2 | UXR afectados, tabla «Open questions» | Fila `UXR-NNN-Qn`: «**Respondida AAAA-MM-DD (UX, DEC-NNN D#):** …» + columnas «Decidido por» y «Fecha de decisión» | Si hay fila |
| 3 | SCR, FLW, UXS afectados | Corregir el texto o la tabla que contradice; una línea «Cambia por DEC-NNN» | Si hay contradicción |
| 4 | Decisión previa reemplazada | Marcar «Reemplazada por DEC-NNN D#»; no borrar el antecedente | Si reemplaza |
| 5 | RSP-UX del borrador | Pasar cada punto a su estado final, citar DEC, cambiar `version`; `status` queda `draft` hasta que Enzo la apruebe | Si existe |
| 6 | Catálogo de preguntas (`questions/design/consultas/catalogo/`) | Estado `Abierta` → `Respondida` → `Incorporada`; actualizar conteos | Si la pregunta está allí |
| 7 | Historial de los UXR/SCR tocados | Una fila: fecha, DEC, quién decidió | Sí |
| 8 | `index.md` | Alta del DEC (y del RSP si es nuevo) | Si hay archivo nuevo |
| 9 | `changelog.md` | Entrada «Decidido (UX, <DSP>, <consulta>)» con enlaces y pendientes ajenos, al inicio de la lista | Sí |
| 10 | `avisos/management/AVS-<DSP>-avisos-<fecha>-<tema>.md` | Borrador de aviso de impacto | Si afecta a otra área |
| 11 | `graphify update .` | Actualizar el grafo (AST, sin costo de API) | Sí |

## Estados y quién los cambia

- DEC nuevo: `status: accepted` si Enzo dio sus elecciones de forma explícita en la sesión (se anota en «Aprobación» con fecha); `status: draft` y `human-reviewed: false` si son propuestas de la IA o su elección no consta.
- SCR/UXR alineados con el código: siguen en `draft` mientras haya partes sin verificar contra el código. Un SCR que estaba `accepted` y se modifica vuelve a `accepted` solo si Enzo lo confirma; hay que avisar a la AF si su aceptación previa era sobre la versión anterior.
- «Decidió: Enzo Macalupu, UX/UI, <fecha>» solo si Enzo dio la elección en esta sesión o consta por escrito; si no, no se escribe quien decidió.
- Textos de interfaz que Enzo elige: van al DEC con ID D#. Los que la IA propuso y Enzo no confirmó quedan «Propuesta UX».

## Estructura del DEC (campos que usan los DEC reales)

Frontmatter OKF v0.2: `id`, `type: Decision Record`, `title` («DEC-NNN — <DSP>: <qué se decide>»), `description`, `tags`, `status`, `generated`, `date`, `owner: role:ux`, `classification: internal`, `sources` (la consulta, aunque esté fuera de la KB, y los documentos afectados), `related`. Cuerpo: «Pregunta antes de leer», «En 30 segundos», «El problema», tabla «Decisiones humanas» (ID D#, decisión, motivo/alcance), «Decidió», «Qué queda abierto», «Dónde se aplicó» (rutas), «Pregunta de comprobación».

## Aviso de impacto (AGENTS.md, DH-307)

Hay aviso si la decisión cambia lo que otra área construye, prueba, diseña o debe responder. Si no hay impacto, registrar «Sin avisos» en el changelog.
- Se **redacta** como archivo `AVS-…` con estado «Pendiente de publicar». Publicar notas en GitLab (marca `[AVISO-DSP-NNN-AAAA-MM-DD]`) o enviar correo exige confirmación de Enzo antes.
- Nunca escribir «Avisado» si no se publicó o envió; el aviso pasa a «Atendido» solo cuando el responsable responde.
- Si hay avisos en estado «Avisado» sobre el paquete, revisar si ya respondieron y registrarlo.

## Reglas de edición

- Solo adiciones y marcas de reemplazo: no borrar antecedentes ni respuestas de otras áreas.
- Cada cambio debe poder remitirse a un DEC; sin DEC, no se edita un UXR/SCR.
- Si un archivo `approved` o `accepted` cambia, vuelve a `draft` y se anota (como hizo `SCR-089-091` en el changelog).
- No hacer commit, push ni abrir MR sin pedido expreso; sugerir una rama `docs/…` o `feature/…` porque `develop` es la rama principal.
