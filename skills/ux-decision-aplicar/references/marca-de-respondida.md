# Cómo se le indica a quien preguntó que ya se respondió

Leer al cerrar. La respuesta debe poder **verse** en tres sitios: la consulta, la KB y el mensaje a quien preguntó.

## 1. En el archivo de la consulta (el de quien preguntó)

Solo si Enzo lo pide o la consulta indica «devuelve el archivo». Se completa, sin reescribir nada más:

- En cada punto, la línea `Respuesta (A / B / C / Otra):` pasa a: `**<letra> — <opción en pocas palabras>.** Decidió Enzo Macalupu (UX/UI), <AAAA-MM-DD>. Fuente: [DEC-NNN D#](ruta).`
- Si Enzo eligió «Otra», copiar su texto literal.
- Si el punto sigue sin decisión: `Pendiente — <qué falta y de quién>`; nunca dejar `(pendiente)` si ya se respondió ni poner una letra si no se decidió.
- En el encabezado agregar: `**Estado de la respuesta:** <n> de <N> respondidos el <fecha>; resto pendiente de <quién>.` Si la consulta tiene `status` en el frontmatter, no cambiarlo: lo gestiona quien la emitió.
- Si el archivo vive en la KB, el frontmatter sigue OKF v0.2.

## 2. En la KB

- El DEC con las decisiones y el RSP-UX con el resumen por punto (ver `propagacion.md`).
- La fila «Open questions» del UXR en «Respondida», con responsable y fecha.
- Catálogo: `Abierta` → `Respondida` (ya hay respuesta, falta incorporarla) → `Incorporada` (ya está en UXR y, si aplica, en Notion). No saltarse `Respondida`.
- `changelog.md`: «Decidido (UX, <DSP>, <consulta>)».

## 3. Mensaje a quien preguntó

Se entrega como texto para pegar (correo o nota del Issue) y **no se envía**. Estructura:

```
Asunto: <consulta ID> — respuesta de UX/UI

<Nombre>, UX respondió <n> de <N> puntos de <consulta ID>:

1. <título> — <opción elegida en pocas palabras>. Fuente: <DEC-NNN D#> (<enlace>).
2. ...

Pendientes: <punto> — <de quién y qué falta>.
Qué cambia para tus casos: <casos o pantallas afectados, como los nombra la consulta>.
Documentos actualizados: <UXR/SCR/FLW tocados>.
```

Reglas: citar siempre DEC y ruta; no pegar texto de interfaz que siga «Propuesta UX» como definitivo; si algo está `draft`, decirlo («pendiente de aprobación»).
