---
name: ux-decision-aplicar
description: >
  Aplica en la KB las decisiones que Enzo toma sobre consultas a UX: registra el DEC, marca la
  pregunta como respondida en el UXR y en el catálogo, corrige SCR/FLW/UXS afectados, actualiza
  index y changelog, redacta y publica (con su orden) el aviso o su corrección, actualiza Notion
  y deja el mensaje para quien preguntó, cuidando que cada MR quede completo. Úsalo con "elijo la
  A en el punto 1", "registra estas respuestas de la consulta CQA-…", "marca como respondida esta
  pregunta", "avisa a QA que ya respondí", "actualiza Notion". No busca ni propone opciones (usa
  ux-consultas-responder) y no decide por Enzo.
metadata:
  version: "1.1.0"
---

# Aplicar decisiones de UX en la KB

Conviertes una decisión de Enzo en estado visible y trazable: que el DEC exista, que cada documento remita a él y que quien preguntó pueda ver **qué se decidió, quién y dónde**.

## Referencias disponibles

- `references/propagacion.md` — matriz de archivos a tocar, estados, estructura del DEC, aviso de impacto, reglas de edición. Leer antes de editar.
- `references/marca-de-respondida.md` — cómo se marca la respuesta en la consulta, en la KB y en el mensaje a quien preguntó. Leer al cerrar.
- `references/notion-y-gitlab.md` — qué se actualiza en Notion y cómo, y cómo se publica el aviso o su corrección en el Issue. Leer en las fases 6 y 7.
- `references/mr-y-ramas.md` — ramas, MR, conflictos de `changelog.md` y cómo comprobar que nada quedó fuera. Leer al preparar y al cerrar el MR.
- `scripts/siguiente_id.py` — siguiente ID libre (`DEC`, `UXR`, `SCR`, …) mirando árbol local, ramas y `origin`. Contrato en su cabecera. Se usa antes de crear cualquier archivo numerado.

## GUARD — verificar contexto

1. **Decisión explícita:** debe constar qué eligió Enzo por punto (letra, «Otra» con texto, o instrucción clara). Si falta o es ambigua, preguntar solo ese punto y detenerte con él; los demás avanzan.
2. **Consulta y borrador:** localizar la consulta y, si existe, el RSP-UX de `ux-consultas-responder`. Si no hay borrador, leer la consulta y verificar contra la KB lo que Enzo decidió.
3. **Árbol actualizado:** ejecutar `git fetch` y comprobar que `questions/` y `decisions/ux-ui/` existen localmente. Si el árbol está atrás, avisar y pedir actualizar o trabajar en una rama desde `origin/develop` antes de crear archivos; crear sobre un árbol viejo duplica números y pisa cambios ajenos. Si el árbol tiene cambios sin guardar, no hacer `pull`: pedir a Enzo que los guarde (commit o stash) o trabajar en un `git worktree` de una rama nueva desde `origin/develop`.
4. **Rama:** `develop` es la principal. No editar en ella sin que Enzo lo indique; proponer `docs/<dsp>-respuesta-<consulta>`.
5. Si algo falla, informar y detener solo la operación afectada.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `REGISTRAR` | "elijo A", "esta es mi decisión", "registra las respuestas" | Fases 1 a 8 |
| `CERRAR` | "avisa a QA", "dame el mensaje", "marca la consulta como respondida", "actualiza Notion" | Fases 5 a 8, sobre decisiones ya registradas |

Declarar el modo en la primera línea.

## Protocolo

### Fase 1 — Confirmar las decisiones
Entrada: elecciones de Enzo. Acción: tabla punto → decisión → archivos afectados, según `references/propagacion.md`. Si crea más de cinco archivos o toca un documento `accepted`/`approved`, mostrar el plan y esperar confirmación. Salida: plan.

### Fase 2 — Crear o ampliar el DEC
Obtener el número con `py -3 scripts/siguiente_id.py DEC`. Crear el DEC con `status: accepted` si Enzo dio sus elecciones de forma explícita en la sesión, o `draft` si son propuestas (B2). Si el tema coincide con un DEC `draft`, agregar D# a ese en lugar de crear otro. Verificación: cada D# tiene motivo y alcance.

### Fase 3 — Propagar a los documentos
Seguir el orden de la matriz: UXR («Open questions», historial), SCR/FLW/UXS, decisión reemplazada. Solo adiciones; cada cambio remite al DEC. **Antes de editar un SCR, compararlo con lo construido**: la decisión «rige lo construido» exige describir lo que hace el código, no solo corregir el punto consultado. Verificación: `git grep` del ID de la pregunta no deja filas «Abierta» contradictorias.

### Fase 4 — Registros de la KB
RSP-UX (estado por punto, versión), catálogo (`Respondida`), `index.md`, `changelog.md`. Verificación: enlaces relativos resuelven y los IDs existen.

### Fase 5 — Aviso de impacto
Decidir si hay aviso (AGENTS.md, DH-307). Si lo hay, redactar `AVS-…` «Pendiente de publicar». Publicar o enviar solo con orden de Enzo (`references/notion-y-gitlab.md`). Si una decisión posterior corrige lo ya publicado, la corrección es una nota nueva con marca propia; la nota anterior no se edita.

### Fase 6 — Marca para quien preguntó y Notion
Según `references/marca-de-respondida.md`: completar el archivo de la consulta si se pidió, y entregar el mensaje para pegar. Actualizar Notion según `references/notion-y-gitlab.md` **solo con orden de Enzo** y cuando el MR ya está integrado, salvo las filas de preguntas que Enzo pida cerrar antes.

### Fase 7 — Cerrar el MR
Según `references/mr-y-ramas.md`: comprobar por la API el estado de cada MR, que todos los commits de la rama estén en el MR y que no haya conflictos. Luego `graphify update .`.

### Fase 8 — Informe
Cierre fijo del formato de respuesta, con lo hecho, lo no hecho y por qué.

## Comportamientos bloqueantes

- **B1 — Sin decisión no hay DEC.** Prohibido registrar como decidido lo que Enzo no eligió, ni poner su nombre como quien decidió; el DEC pasaría a ser una decisión inventada que otras áreas usarían como oracle.
- **B2 — `accepted` solo con la elección de Enzo en la sesión.** El DEC pasa a `accepted` cuando Enzo dio sus elecciones de forma explícita en esa misma sesión y las confirmó; si las decisiones son propuestas de la IA o no constan, queda `draft` y `human-reviewed: false`. Los SCR/UXR que se alinean al código quedan `draft` mientras haya partes sin verificar; un documento ya `accepted` solo se devuelve a `accepted` con la confirmación expresa de Enzo. El estado de un SCR es **por archivo**: aceptar un archivo acepta todas las pantallas que agrupa, y se anota la pieza pendiente en su sección «Aprobación».
- **B3 — Número verificado.** Prohibido asignar un ID a ojo: usar `siguiente_id.py` tras `git fetch`; un número repetido rompe el índice y los enlaces de otras ramas.
- **B4 — Solo adiciones.** Prohibido borrar antecedentes o respuestas de otras áreas al corregir un UXR/SCR; se marca «Reemplazada por» y se conserva.
- **B5 — Cada cambio remite a un DEC.** Prohibido editar un UXR/SCR sin DEC que lo respalde; el cambio quedaría sin trazabilidad.
- **B6 — Avisos honestos.** Prohibido escribir «Avisado» sin nota publicada o correo enviado; publicar o enviar requiere orden de Enzo. Antes de publicar, verificar por la API que el Issue es el del paquete y que la marca no existe.
- **B7 — Sin git no pedido.** Prohibido commit, push o MR sin pedido expreso, y nunca en `develop` sin indicación.
- **B8 — Marca fiel.** Prohibido poner una letra en la línea «Respuesta» de la consulta si el punto no fue decidido; quien preguntó actuaría sobre algo no resuelto.
- **B9 — Notion sin estados inventados.** Prohibido pasar una pantalla a «Validado» sin prueba de Enzo en el navegador, captura y accesibilidad verificada; la aceptación de Enzo se registra en «Aprobado por» y «Fecha de aprobación». Marcar «Validado» sin esa evidencia presenta como probado algo que no lo está.
- **B10 — Un MR no está completo hasta comprobarlo.** Prohibido dar por terminado un cambio sin consultar el estado del MR y confirmar que el último commit está dentro; un commit subido después de que Enzo aprobó el MR no entra y hay que abrir otro.
- **B11 — Credenciales fuera de pantalla.** Prohibido imprimir, repetir o guardar tokens (GitLab, Notion); se usan desde el entorno sin mostrarlos. Si falta el token, se dice y se usa otra vía.
- **B12 — Corregir lo publicado con una nota nueva.** Prohibido editar o borrar una nota ya publicada en un Issue; la corrección es una nota con marca `-b`, `-c`… que dice qué se corrige.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Enzo dijo que le parecía bien la A, ya está" | «Me parece bien» a una recomendación de la IA se confirma por punto antes del DEC (B1) |
| "El siguiente DEC debe ser el 009, es el último del árbol" | El árbol está atrás; el último es otro (B3) |
| "Actualizo el UXR y luego creo el DEC" | Sin DEC no se edita el UXR (B5) |
| "El aviso es un trámite, lo marco como enviado" | Enviar es una acción visible; sin envío es «Pendiente de publicar» (B6) |
| "Pongo `accepted` aunque nadie eligió" o "dejo todo en `draft` aunque Enzo ya decidió" | `accepted` sigue a la elección explícita de Enzo en la sesión; ni más ni menos (B2) |
| "Aceptó, entonces en Notion va Validado" | Validado exige prueba, captura y accesibilidad; la aceptación va en «Aprobado por» (B9) |
| "El MR ya está aprobado, no hace falta mirarlo" | Se comprueba que el último commit entró (B10) |
| "Edito la nota para corregirla" | Se publica una nota nueva con marca `-b` (B12) |
| "Reescribo la fila del UXR para que quede limpia" | Se agrega la respuesta y se conserva el antecedente (B4) |

## Señales de alerta

- Un DEC sin D# o sin «Decidió».
- Número de ID que ya existe en otra rama.
- Un UXR con la fila «Abierta» y un DEC posterior que la responde.
- El mensaje a quien preguntó cita texto de interfaz que sigue siendo propuesta.
- Más de un DEC para el mismo tema el mismo día.
- Un SCR corregido en el punto consultado y sin comparar con el resto de lo construido.
- Notion con un estado más avanzado que la evidencia registrada.
- Un MR integrado cuya rama tiene commits posteriores.

## Formato de respuesta

- Primera línea: `Modo detectado: REGISTRAR` o `CERRAR`.
- Español neutro con tuteo, sin emojis; tablas para el plan y el resultado.
- Cierre fijo:

```
Decisiones aplicadas: <n> de <N> puntos (pendientes: <lista y de quién>)
DEC: <ruta, estado>   RSP: <ruta>
Documentos actualizados: <lista>
Aviso: <sin avisos / redactado, pendiente / publicado: nota id>   Corrección: <no aplica / nota id>
Notion: <no pedido / actualizado: qué filas y estados / sin acceso>
MR: <número, estado por la API, conflictos, último commit dentro: sí/no>
Para quien preguntó: <mensaje listo para pegar / archivo de la consulta completado>
Git: <rama, commit, push solo si se pidió>   Grafo: <actualizado / pendiente>
```
