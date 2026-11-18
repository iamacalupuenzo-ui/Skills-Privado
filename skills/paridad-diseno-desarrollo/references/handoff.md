# Contrato de salida

Qué emite este skill antes de construir nada. La tabla y la evidencia son el producto del modo
INSPECT; el modo DOCUMENTAR las convierte en la página de Figma → `references/figma-build.md`.

Separar los dos pasos importa: la tabla se revisa y se discute con el equipo **antes** de escribir
en el archivo. Documentar hallazgos sin confirmar llena una página de ruido que después hay que
desarmar a mano.

El formato que sigue es el del componente `Comment` del archivo, así que lo emitido entra sin
traducción — y `documentacion-handoff` también puede consumirlo si el trabajo termina siendo suyo.

---

## La tabla — formato exacto

`documentacion-handoff` en modo REPORTE recibe hallazgos ya validados y propone esta tabla antes de crear:

```
| # | Elemento | Problema | Tipo | Etiqueta |
|---|----------|----------|------|----------|
```

`paridad-diseno-desarrollo` emite exactamente esa tabla. Reglas por columna:

| Columna | Contenido | Regla |
|---------|-----------|-------|
| `#` | Número correlativo desde 1 | Se renumera por corrida, no es global |
| `Elemento` | Nombre legible del componente + variante | "Button / primary", no `.btn--primary` |
| `Problema` | Una línea, en presente, sin jerga de CSS | "El padding vertical es 13px en lugar de 12px" |
| `Tipo` | `Problema mayor` / `Problema menor` / `Nota` | Según la matriz de `verdicts.md` |
| `Etiqueta` | Categoría de `documentacion-handoff` | Casi siempre "Jerarquía Visual y Consistencia" |

**El `Problema` se escribe para un diseñador, no para un desarrollador.** `documentacion-handoff` va a
pegar ese texto dentro de un componente Comment en Figma que lee todo el equipo.

---

## El bloque de evidencia

La tabla sola no alcanza: quien la lea tiene que poder verificar sin volver a correr nada.
Debajo de la tabla, un bloque por hallazgo:

```
#3 — Button / primary · padding vertical
  dev:      13px            (.btn--drift, declarado 13px)
  Figma:    12px            (nodo 695:313, paddingTop)
  token:    --space-3       (12px)
  veredicto: HARDCODED_OFF_SCALE
```

Cuatro líneas fijas. Si algún dato falta, escribir `—`, nunca inventarlo ni estimarlo.

---

## El borrador del Comment

La tabla es para decidir qué se documenta. El texto que termina **dentro** del componente Comment
en Figma tiene otra estructura, definida en `documentacion-handoff/references/comment-format.md`:

```
Heading:    [Componente o elemento] — [descripción corta del problema]
Problema:   [qué está mal en desarrollo y qué impacto tiene]
Corrección: [qué debe quedar, con los valores integrados naturalmente en la frase]
```

`paridad-diseno-desarrollo` es quien mejor puede redactar `Corrección`, porque tiene los tres valores exactos
(dev · Figma · token). Emitir el borrador junto a cada hallazgo le ahorra a `documentacion-handoff` el paso
de reconstruirlo — pero **`documentacion-handoff` sigue siendo quien decide y escribe**.

Ejemplo, para el hallazgo #3 de arriba:

```
Heading: Button primario — padding vertical mayor al aprobado
Problema: El botón primario tiene más altura que el diseño aprobado, lo que desalinea la
fila de acciones respecto del resto de la pantalla.
Corrección: El padding vertical debe ser 12px, tomado del espaciado del sistema.
```

### Reglas duras del texto

Heredadas de `comment-format.md`, y fáciles de violar desde un skill que trabaja con CSSOM:

- **Sin IDs de nodo** en el texto (`nodo 695:313`). Eso vive en el bloque de evidencia.
- **Sin lenguaje de API ni de CSS**: nada de `padding-top`, `getComputedStyle`, `--space-3`,
  `.btn--primary`. Se habla de componentes, estados y espaciado.
- **Sin el label `Especificación aprobada:`** — `Corrección` ya cumple esa función.
- **Sin redacción vaga**: "parece incorrecto", "podría ser mejor" no van.
- El nombre del token puede mencionarse como *"el espaciado del sistema"*, no como `--space-3`.
- Para `Nota` sin acción de diseño, alcanza un párrafo sin `Corrección`.

`documentacion-handoff/references/anti-hallucination.md` es la regla que gobierna esto: las specs se leen
del nodo real, no se estiman de un screenshot. Este skill hereda esa regla para el lado de dev:
todo valor sale de la sonda, ninguno de mirar la pantalla.

---

## Sección aparte — hallazgos que apuntan al diseño

Los del caso 5 de la matriz (dev copió fielmente un Figma que está fuera de escala) **no van en
la tabla principal**. Van después, con encabezado propio:

```
Hallazgos contra el diseño (no contra dev) — [N]

| # | Elemento | Qué pasa | Token más cercano |
|---|----------|----------|-------------------|
```

Y una línea de contexto: *"dev implementó estos valores correctamente; la desviación está en el
archivo de Figma."*

Sin esta separación el reporte culpa al equipo equivocado y deja de ser útil políticamente.

---

## Después de la tabla

Al cerrar INSPECT, ofrecer el paso siguiente y **esperar**:

```
Para documentar estos hallazgos en Figma:
  modo DOCUMENTAR → arma la página de QA con la comparación y las observaciones

Se escribe solo dentro de esa página. El archivo de diseño no se toca.
```

No documentar sin confirmación. La tabla existe justamente para revisarse primero.

### Cuándo el trabajo es de `documentacion-handoff`, no de acá

| Pedido | Quién |
|--------|-------|
| Página de QA con capturas de dev y comparación | **este skill**, modo DOCUMENTAR |
| Observaciones dentro de una sección QA del archivo de diseño | `documentacion-handoff` |
| Corregir el componente en Figma para que coincida | `documentacion-handoff` |
| Documentar el componente para handoff | `documentacion-handoff` |
| Auditar un component set | `documentacion-handoff` |

La frontera es el artefacto: este skill es dueño de la página de QA de desarrollo y **solo escribe
ahí**. Todo lo que toque el archivo de diseño en sí es de `documentacion-handoff`. Nombrarlo y detenerse; no
cambiar de skill por cuenta propia.

---

## Validar que las anotaciones caen donde deben

Colocar áreas de anotación sobre una captura es propenso a error silencioso: si el marcador queda
corrido, el reporte señala el elemento equivocado y nadie lo nota hasta que dev pregunta.

**El chequeo que lo cierra:** dibujar los mismos rects sobre el componente real en el navegador,
capturar, y mirar. Si caen bien ahí, caen bien en Figma — son las mismas coordenadas con el mismo
origen.

```js
// en el navegador: overlay temporal con los rects que se van a usar en Figma
const d = document.querySelector(SEL_RAIZ).getBoundingClientRect();
for (const [n, x, y, w, h] of RECTS) {
  const box = document.createElement('div');
  box.className = '__qa_overlay';
  box.style.cssText = `position:fixed;left:${d.left+x}px;top:${d.top+y}px;width:${w}px;height:${h}px;`
    + 'border:2px dashed #F5A623;background:#F5A6231a;z-index:99999;pointer-events:none;box-sizing:border-box';
  document.body.appendChild(box);
}
// capturar, y SIEMPRE limpiar despues:
document.querySelectorAll('.__qa_overlay').forEach(e => e.remove());
```

Esto **no viola B4** (no mutar el DOM para fabricar un hallazgo): no se mide nada del overlay ni se
reporta nada de él. Es andamiaje de verificación y se elimina en la misma corrida. Confirmar que
quedó en cero antes de seguir.

### Dos trampas de alineación que hay que cerrar antes

1. **El frame de la captura debe medir lo que mide el elemento**, no lo que mide el PNG. Una captura
   `scale: 'device'` a dpr 1.25 sale 575×513 para un elemento de 460×409; dividido da 460×410,4. Ese
   1,4px de más escala el contenido y desalinea todo hacia abajo. **Redimensionar el frame al valor
   del DOM** (460×409) y dejar el fill en `FILL`.
2. **Los componentes de anotación traen un tamaño por defecto que hay que sobreescribir.** El
   `Marker` del kit es un **área punteada redimensionable de 256×80**, no un badge: sin
   `resize(w, h)` al rect del elemento, tapa media pantalla. Su número se dibuja 32px **por encima**
   del área, así que al posicionar hay que pensar en el área, no en el badge.

---

## Reporte guardado

Cuando la corrida tiene más de ~8 hallazgos o es un `SWEEP`, guardar el reporte en el proyecto:

```
docs/qa/paridad-diseno-desarrollo-[componente]-[YYYY-MM-DD].md
```

Con: URL inspeccionada, nodo de Figma, fecha, tabla, evidencia, y la sección de hallazgos contra
el diseño. Es lo que se adjunta a un ticket sin tener que reconstruir el contexto.

Si el proyecto no tiene `docs/`, preguntar dónde antes de crear la carpeta.

---

## El copy sí se compara cuando el nodo lo tiene

El texto está disponible en los dos lados —`el.textContent` en dev, `node.characters` en Figma— así
que compararlo es medición, no interpretación. Y las desviaciones de contenido suelen pesar más que
las de color, porque cambian lo que el usuario puede hacer.

Tres clases que aparecen seguido:

| Clase | Ejemplo verificado |
|-------|--------------------|
| **Falta un dato que el diseño muestra** | El detalle de una opción decía *"Al correo registrado"* donde el aprobado muestra el destino enmascarado. La pantalla pide verificar la cuenta y elegir dónde recibir el código: sin el destino no se puede hacer ninguna de las dos. |
| **El enmascarado no coincide** | El diseño enmascara con asteriscos (`*** *** 987`) y dev describe en prosa (*"terminado en 2585"*), mostrando además más dígitos. |
| **Dev corrigió un error del archivo** | El archivo dice *"Correo eletrónico"* y dev escribió *"Correo electrónico"*. Va a **hallazgos contra el diseño**, no contra dev. |

**El copy sin referencia aprobada sigue fuera de alcance**: ahí no hay contra qué comparar, y opinar
sobre redacción no es lo que hace este skill.

Ojo con `textContent` contra `innerText`: si difieren hay una transformación de estilo en juego y el
copy puede estar bien escrito pero verse mal → `references/probe.md`, T7.

---

## Lo que este contrato NO cubre

Los modos visuales no certifican por sí solos lo siguiente. `KB-CODIGO` compara las
proyecciones estáticas declaradas según `references/paridad-kb-codigo.md`; no reemplaza
la navegación ni la validación de negocio:

- Copy sin referencia → comparar exige texto aprobado o fuente canónica
- Comportamiento del flujo entre pantallas → requiere navegar con criterio de negocio
- Comportamiento de interacción más allá de los estados que se pueden provocar y medir
- Contenido dinámico que depende de datos reales del usuario

Cuando el usuario pide "QA completa de la pantalla", decir esto en una línea y proponer
`documentacion-handoff` PROACTIVO con screenshot para el resto. Una vez, sin repetirlo en cada respuesta.

