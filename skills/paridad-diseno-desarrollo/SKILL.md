---
name: paridad-diseno-desarrollo
description: >
  Inspector de componentes implementados en desarrollo: extrae estilos computados del render
  real y los compara contra el diseño aprobado en Figma, distinguiendo si dev usó el token del
  sistema o hardcodeó el valor, y construye la página de QA en Figma con las capturas y las
  observaciones. Activar cuando el usuario diga "revisa el Button en dev", "esto no quedó como el
  diseño", "dev implementó mal este componente", "compara el componente con Figma", "está usando
  el token o lo hardcodeó", "extrae los estilos de este componente", "el espaciado en dev no
  coincide", "revisa todos los botones de la app", "documenta esto en Figma", "arma la página de
  QA de este componente". También verifica paridad estática KB-código con configuración
  declarativa por paquete (componentes, campos, navegación y textos), al cerrar tareas de
  front/documentación y antes de abrir un MR; modo KB-CODIGO sin Figma ni navegador.
metadata:
  version: "1.3.0"
---

# Paridad diseño–desarrollo — QA de componentes implementados

Extrae la verdad del render: qué valores tiene realmente el componente que dev implementó, y
—lo que ninguna revisión visual puede ver— **si esos valores vienen del token del sistema o
están hardcodeados**.

Un token bien aplicado y un valor hardcodeado idéntico se ven exactamente igual en pantalla.
Se ven igual en un screenshot. Se ven igual en un diff de píxeles. La diferencia solo aparece
leyendo el CSSOM, y aparece cara: el día que cambie el token, uno se actualiza y el otro no.

---

## Lo que ES y lo que NO ES

**ES dueño de un artefacto: la página de QA de desarrollo.** La mide, la compara, la documenta y
la construye entera en Figma.

**El límite es por artefacto, no por permiso.** Escribe **únicamente dentro de la página de QA que
él mismo crea**: nunca toca un component set, nunca edita un nodo de las páginas de diseño o
documentación. Los nodos aprobados se **clonan** hacia la página de QA, jamás se modifican en su
lugar → `references/figma-build.md`.

**NO ES `documentacion-handoff`**, que es dueño del otro artefacto: la documentación del propio archivo de
diseño, la auditoría de componentes y el handoff. Ese skill opera sobre component sets con
instancias vivas y tiene 21 bloqueantes protegiéndolos. Este no lo invoca ni lo reemplaza, y
sobre todo **no escribe donde escribe él**.

**No es** un auditor de UX completo ni decide reglas de negocio. Los modos visuales miden
render y copy con referencia; `KB-CODIGO` compara componentes, campos, navegación y textos
declarados entre fuentes. Ninguno demuestra comportamiento dinámico completo. Ver
`references/handoff.md` y `references/paridad-kb-codigo.md`.

---

## Referencias disponibles

- `references/paridad-kb-codigo.md` — modo KB-CODIGO y su comparador declarativo obligatorio
- `references/setup.md` — instalación de las 3 herramientas externas para los modos visuales
- `references/probe.md` — la sonda completa y las siete trampas que la hacen mentir
- `references/verdicts.md` — matriz de decisión: de veredicto crudo a hallazgo con severidad
- `references/handoff.md` — contrato de salida: tabla, evidencia, borrador del Comment, validación
- `references/figma-build.md` — cómo construir la página de QA y la regla de contención
- `references/versioning.md` — contrato de patrón visual y de contenido para documentar una
  nueva versión sobre una QA con versión histórica
- `references/engine.md` — Playwright MCP, login, capturas hacia Figma, selectores y límites
- `references/runbook.md` — conexión reproducible, extracción de capturas, reemplazo seguro,
  estados, validación de posiciones y compatibilidad de nombres entre Claude/GPT y OpenCode

**KB-CODIGO:** leer `references/paridad-kb-codigo.md`; no cargar las guías de Figma.
**MODOS VISUALES, EN MÁQUINA NUEVA O SI EL GUARD FALLA:** `references/setup.md`.
**MODOS VISUALES, SIEMPRE AL INICIAR:** `references/probe.md` y `references/verdicts.md`.
**LEER SEGÚN EL MODO:** INSPECT y SWEEP → `references/handoff.md`. DOCUMENTAR →
`references/figma-build.md` y `references/runbook.md` **completos**, y `references/versioning.md`
si hay una versión histórica que mapear. Cualquier navegación → `references/engine.md` y el
apartado de conexión de `references/runbook.md`.

---

## Prerrequisitos

Los modos visuales dependen de Playwright MCP, del servidor
figma-console (o figma-console-local, el nombre varía por máquina) con su plugin de Desktop
Bridge, y de un servidor HTTP local con CORS para insertar capturas dentro de Figma.

**En modos visuales, si es la primera vez que se usa en esta máquina o el GUARD falla, leer
`references/setup.md` completo antes de seguir.** Ahí está la instalación de las tres piezas
paso a paso y cómo verificar cada una.

---

## GUARD

Para **KB-CODIGO**, leer `references/paridad-kb-codigo.md`: verificar Python 3.10+, Git,
configuración versionada, cobertura del paquete y repos/refs. Ejecutar el comando del
protocolo; no requiere Figma, Playwright ni el Paso 0 visual. Si faltan, bloquear el cierre.
Los requisitos siguientes aplican solo a los modos visuales:

Verificar que el engine está disponible antes de prometer nada:

1. El servidor `playwright` responde. Si no, decirlo y parar — sin browser no hay skill.
2. Para INSPECT y SWEEP: el servidor de Figma está activo. **Se llama `figma-console` en una
   máquina y `figma-console-local` en otra** — verificar con `figma_get_status` /
   `figma_list_open_files` y usar `mcp__<activo>__*`.
3. Si el archivo de Figma objetivo no está conectado, pedirle al usuario que abra el Desktop
   Bridge ahí. No se puede hacer remotamente.

Sin Figma se puede correr `EXTRACT`, que no compara. Ofrecerlo en vez de fallar.

---

## Paso 0 — Preflight (siempre, antes de extraer)

1. **Navegar** al URL. Si aparece autenticación → parar y pedirle al usuario que se loguee **en
   la ventana del browser**. Ver `references/engine.md`. El skill nunca escribe credenciales.
2. **Reconocer el terreno** con `browser_snapshot` (`boxes: true`). Confirmar que el componente
   existe y cuántas instancias hay. Si hay varias, extraerlas todas.
3. **Resolver el selector** por orden de estabilidad: `data-testid` → rol accesible → clase →
   ruta del DOM. Si solo queda la ruta del DOM, avisar que el reporte no será reproducible.
4. **Desambiguar contenedor / contenido.** Un problema visual casi nunca vive en un solo nodo:
   el alto puede venir del padding del contenedor o del tamaño del ícono; el corrimiento, del
   `gap` del padre o del `margin` del hijo. Extraer **el elemento y sus hijos relevantes** —
   ícono, texto, wrapper — y decir en el hallazgo cuál es cuál.

   Es el error que `documentacion-handoff/references/anti-hallucination.md` trata como de primer orden:
   reportar `28×28` porque el vector mide eso, cuando el problema es el contenedor de `40×40`.
   Extraer un solo selector reproduce ese error exacto.

   Lo mismo aplica del lado de Figma: si dos nodos del árbol comparten nombre, resolver **los
   dos** y confirmar cuál es el `visible` efectivo —del nodo y de todos sus ancestros— antes de
   anclar cualquier hallazgo. Verificado en corrida real: un ícono de retroceso del stepper
   existía dos veces con el mismo nombre (`fi-br-angle-small-left`) — una instancia oculta a
   nivel del stepper y un frame visible dentro del header — y comparar contra el nodo equivocado
   (el oculto) costó reinvestigar después de haber construido media página sobre esa base. No
   asumir que el primero que aparece en la búsqueda es el correcto.

   **Ningún ícono, chevron, badge o control interno se da por explicado por su contenedor.** No
   alcanza con extraer "el elemento y sus hijos relevantes" en abstracto: hay que **listar cada
   ícono y cada control interactivo visible del nodo aprobado** —chevrons dentro de tarjetas,
   botón de retroceso del stepper, badges de estado— y confirmar que cada uno tiene su propio
   selector en `TARGETS`, con `opacity` incluida en `PROPS`. Un ícono correcto en tamaño y color
   puede seguir mal si su opacidad no es la del aprobado, y eso no aparece comparando solo el
   contenedor que lo envuelve. Y para cada control interactivo, contrastar su estado contra lo
   que el paso o variante **actual** exige, no solo contra su forma en reposo: un botón de
   retroceso en el primer paso de un stepper puede estar activo en dev cuando el diseño lo pide
   inhabilitado, y eso no se detecta si el control nunca se agregó como objetivo propio de la
   sonda. Verificado el 2026-08-09: se midió un panel de selección de canal a nivel de
   contenedor y quedaron fuera los chevrons de dos tarjetas (80% de opacidad en dev, 100% en el
   aprobado) y el botón de retroceso del stepper (activo en dev, inhabilitado en el aprobado
   para el paso 1/2) — los tres existían en el DOM y en el nodo de Figma, pero como ninguno tenía
   selector propio, la sonda no tuvo dónde medirlos. Antes de cerrar este paso, recorrer el árbol
   del nodo aprobado nombrando cada ícono y cada control, y confirmar que cada uno aparece en la
   lista de selectores de dev.
5. **Medir la cobertura de tokens**: correr la sonda y leer `tokenCount` y `sheetErrors`.
   - **Contar los tokens *propios*, no el total.** `tokenCount` incluye los de terceros:
     verificado con 37 custom properties de las cuales 36 eran de Bootstrap y ninguna del
     sistema. Filtrar los prefijos de vendor antes de decidir → `references/probe.md`.
   - Sin tokens propios → el proyecto no los expone en runtime. Decirlo **una vez** con el
     desglose, cambiar el eje de veredictos a coincidencia-con-Figma y seguir. No emitir 40
     hallazgos de hardcode cuando la causa es una sola decisión de build.
   - `sheetErrors` no vacío → hay CSS cross-origin ilegible. Declarar qué quedó sin auditar.
6. **Elegir la raíz por equivalencia con el nodo aprobado**, no por lo que parece "el componente".
   Si el ancho de la raíz candidata no coincide con el del frame aprobado, subir un nivel: el
   contenedor suele traer margen interno, radio, borde y sombra que el aprobado sí documenta y
   que quedarían fuera de la captura, sin superficie donde anclar sus hallazgos →
   `references/engine.md`.

Ningún paso se saltea por parecer obvio. Un componente sin hijos relevantes se declara como tal
y se sigue — pero se declara.

Los pasos 2 a 6 son **una sola llamada**, no cinco: árbol con rects relativos a la raíz, estilos
computados filtrando los valores por defecto, textos, tokens, `devicePixelRatio` y `sheetErrors`.
Después queda a lo sumo un hueco puntual, que se cierra con una segunda llamada dirigida →
`references/runbook.md`.

### Regla de eficiencia

Para documentación nueva, priorizar el flujo de `references/runbook.md`: nodo aprobado dirigido,
observaciones anteriores, una sonda compacta, una QA nueva y una validación final. No explorar el
archivo completo ni repetir lecturas que no cambien un veredicto.

---

## Detección de modo

Declarar el modo en la primera línea de cada respuesta.

| Modo | Señales del usuario | Output |
|------|--------------------|--------|
| **KB-CODIGO** | Cierre de front o documentación; antes de MR; «compara la KB con lo construido» | Informe determinista, hashes, valores, archivo/línea KB y código; exit 0/1/2, según `references/paridad-kb-codigo.md` |
| **INSPECT** | Da URL + nodo de Figma. "revisa el Button", "compara esto con el diseño" | Tabla de hallazgos comparada, con evidencia |
| **EXTRACT** | Da URL sin nodo. "extrae los estilos", "qué tiene este componente", "usa el token o no" | `codeSpec` crudo con los 3 veredictos, sin comparar |
| **SWEEP** | Plural o alcance de pantalla. "revisa todos los botones", "audita esta pantalla completa" | Tabla consolidada + inconsistencias entre instancias |
| **DOCUMENTAR** | "documenta esto en Figma", "arma la página de QA", "pasa los hallazgos al archivo" | Página de QA construida: comparación, marcadores, observaciones |

Si el pedido no encaja con el modo invocado, decirlo en una línea y proponer el correcto.

---

## Protocolo por modo

### INSPECT

1. Preflight (Paso 0).
2. **Leer el nodo de Figma** con `figma_get_component_for_development`. Resolver los IDs de
   variable a nombres con `figma_get_variables`. Los IDs de nodo son por archivo y por sesión:
   nunca reusar uno de otra conversación.
3. **Mapear las observaciones históricas antes de comparar.** Leer las versiones anteriores y
   clasificar cada punto como `RESUELTA`, `PERSISTE`, `REGRESIÓN`, `NO REPRODUCIBLE` o
   `CONTRA DISEÑO`. Una observación previa no se copia ni se descarta: se vuelve a medir contra
   el DOM actual, el diseño visible y el estado actual. Después hacer una pasada de novedades
   para detectar diferencias que no existían en las versiones anteriores.
4. **Extraer de dev** con la sonda → `references/probe.md`.
5. **Cruzar** los dos lados aplicando la matriz de `references/verdicts.md`. Descartar todo lo
   que caiga dentro de tolerancia. **Comparar también la disposición** —dirección, separación,
   alineación y orden de cada grupo de hermanos— no solo los elementos de a uno: dos elementos
   correctos pueden estar mal ubicados uno respecto del otro, y eso desplaza todo lo que sigue.
6. **Opcional**: `figma_check_design_parity` con el `codeSpec` armado, para el score de parity.
   Recordar que `codeSpec` colapsa tres veredictos en dos — el reporte propio mantiene los tres.
7. **Emitir** tabla + evidencia + sección de hallazgos contra el diseño →
   `references/handoff.md`. Adjuntar captura de ambos lados (`browser_take_screenshot` y
   `figma_get_component_image`) como **referencia visual para quien lee**, nunca como fuente de
   medidas: toda cifra sale de la sonda o del nodo (B3).
8. **Ofrecer** el modo DOCUMENTAR y esperar confirmación. La tabla existe para revisarse antes de
   escribir en el archivo.

### EXTRACT

1. Preflight (Paso 0).
2. Correr la sonda sobre el selector.
3. Devolver el `codeSpec` armado + la tabla de veredictos por propiedad, sin comparar contra
   nada y **sin emitir severidad** — sin Figma no hay contra qué medir, y un `HARDCODED_OFF_SCALE`
   sin diseño de referencia todavía no es un hallazgo.
4. Cerrar:

```
Extracción — [componente]
--------------------------
URL:      [url]  ·  Selector: [selector]
Tokens detectados: [N]   Sin auditar: [hojas cross-origin, si las hay]
Propiedades: [N] ([X] con token, [Y] hardcodeadas)

Sin nodo de Figma no hay severidad: esto todavía no son hallazgos.
Para comparar: pasame el nodo y corro INSPECT.
```

Es el modo para explorar la forma del dato o para alimentar otro skill (`audit-spacing`,
`audit-a11y`), que hoy leen código fuente y no el render real.

### SWEEP

1. Preflight (Paso 0), una sola vez.
2. **Enumerar los objetivos** y mostrarlos antes de correr:
   ```
   Voy a inspeccionar [N] elementos:
   | # | Selector | Instancias |
   ¿Corro sobre todos o filtramos?
   ```
   Esperar confirmación. Una corrida larga sobre selectores equivocados desperdicia la sesión.
3. Extraer todos con **una sola** llamada a la sonda — acepta múltiples selectores.
4. **Detectar inconsistencia entre instancias**: dos instancias del mismo componente con valores
   distintos en la misma pantalla es un hallazgo de primer orden, aunque ambas coincidan con
   Figma por separado.
5. Consolidar: agrupar hallazgos repetidos en una fila con su conteo, no repetir 12 veces el
   mismo problema.
6. Guardar el reporte → `references/handoff.md`. Confirmar la ruta antes de escribir.
7. Cerrar:

```
Barrido — [pantalla o conjunto]
--------------------------------
URL:       [url]
Elementos: [N] inspeccionados · [M] instancias
Hallazgos: [N] ([X] menores, [Y] notas, [Z] mayores)
Inconsistencias entre instancias: [N]
Contra el diseño: [N]
Reporte:   [ruta del archivo guardado]

Siguiente paso opcional: /documentacion-handoff → modo REPORTE con la tabla validada
```

Si la sesión expira a mitad de la corrida (el selector deja de matchear en todos a la vez, o la
URL cambió a la de login): parar, decirlo, pedir re-login, retomar desde donde falló.

---

### DOCUMENTAR

Construye la página de QA. Requiere hallazgos ya cruzados — si no los hay, correr INSPECT primero.
Separar los dos pasos permite re-documentar sin volver a medir.

**Si existe una versión histórica de la misma QA** (mismo componente, mismo estado, mismo
viewport) y el usuario pide una nueva versión, una actualización o el mapeo de correcciones:
leer `references/versioning.md` completo antes de escribir nada. Define el patrón visual
obligatorio (versión histórica a la izquierda, checklist en el centro, versión nueva a la
derecha), el contrato de contenido obligatorio para `N ≥ 2`, y los bloqueantes de calidad
específicos de una nueva versión. No improvisar la disposición ni reutilizar el relato de la
versión anterior a criterio propio.

Si no hay versión histórica que mapear, `references/versioning.md` no aplica — seguir directo
con lo de abajo.

Leer `references/figma-build.md` completo antes de escribir nada.

1. **Descubrir la página del kit, inventariarla y recién ahí resolver.** En ese orden. El nombre de
   la página y de los componentes **cambia entre archivos**: nada de rutas ni nombres literales, se
   descubre la página que concentra las definiciones y se lista todo lo que ofrece. Verificar el
   `type` y descartar instancias de corridas anteriores. Declarar lo que falte antes de seguir; no
   improvisar reemplazos. El inventario no es burocracia: es lo que evita armar una página de
   hallazgos de medida sin usar los componentes de cota que el archivo ya tenía →
   `references/figma-build.md`, Paso 0.
2. **Proponer los agregados opcionales y esperar respuesta.** El núcleo —contexto, comparación y
   observaciones— se construye siempre. «Contra el diseño», «Estados y alcance» y las cotas sobre
   la captura **se ofrecen enumerados y no se agregan sin un sí explícito** →
   `references/figma-build.md`.
3. **Crear la página de QA** con nombre propio (`QA — [componente]`). Si ya existe, usarla; no
   duplicar. Llenarla en la misma corrida: una página vacía es basura.
4. **Capturar dev** sobre el selector raíz, servir la imagen con CORS en un puerto del rango
   9223-9232 y cargarla con `fetch` + `figma.createImage` → `references/runbook.md`.
5. **Armar los dos paneles apilados**: la captura de dev al tamaño del DOM, y un **clon** del nodo
   aprobado — **la variante que coincide con el estado en que se midió dev**, que suele estar en la
   sección de Estados y no en la de Anatomía → `references/figma-build.md`. El original nunca se
   toca. Si al colocar los marcadores quedan colisiones que el
   reanclaje no resuelve, **partir el panel de dev en copias por tipo de desviación** —geometría,
   espaciado, color, tipografía y contenido— con la numeración corrida y una sola lista de
   observaciones. Con pocos hallazgos **no se parte**: empeora la lectura →
   `references/figma-build.md`.
6. **Colocar las áreas `Marker`** con el rect medido de cada elemento, numeradas, con la variante
   de `Type` que corresponde a la severidad del hallazgo.
7. **Verificar la colocación** dibujando los mismos rects en el navegador → `references/handoff.md`.
   Limpiar el overlay.
8. **Crear las observaciones `Comment`** con el mismo número y la misma variante de `Type` que su
   marcador, y la `Etiqueta Tipo` por `swapComponent`.
9. **Enlazar las referencias**: el encabezado al frame de handoff, un botón en cada panel hacia la
   documentación aprobada y hacia el entorno medido. La URL **se deriva** de `figma.fileKey` y el
   `nodeId`; no se le pide al usuario → `references/figma-build.md`.
   **El botón no se construye como texto suelto**: debe clonarse una instancia del componente/frame
   de enlace estándar del kit QA (por ejemplo, `Enlace — → Ver documentación del componente` o
   `Enlace — → Abrir el entorno medido`) y conservar su Auto Layout, padding, borde, tipografía
   e hipervínculo. Solo se cambia el destino o el texto cuando corresponda. Si el catálogo no
   contiene ese componente, declarar el faltante y no improvisar un reemplazo visual.
10. **Cerrar con `Divider` + footer**, y verificar: desbordes, solapamientos, textos recortados,
    que ninguna leyenda haya quedado en `FIXED`, y **que ninguna instancia conserve el texto de su
    componente** — comparar cada nodo de texto contra el de su `mainComponent`, con visibilidad
    efectiva → `references/figma-build.md`, «Identidad de la página».
11. **Verificar visualmente panel por panel, a medida que se construyen** — no al final. El export
    se agota tras unas pocas capturas, así que dejarlo para el cierre garantiza que los últimos
    paneles queden sin mirar. Ante un timeout: probar el puente, `figma_reload_plugin`, un solo
    reintento, y si falla pasar a verificación estructural. Informar la cobertura como **fracción**
    y nombrar lo que quedó sin mirar; nunca afirmar que la página fue validada visualmente si no
    se la miró entera → `references/figma-build.md`.
12. **Cerrar:**

```
Documentación — [componente]
-----------------------------
Página:        [nombre]  ·  [ancho]×[alto]
Observaciones: [N] ([X] menores, [Y] notas, [Z] mayores)
Overlay:       [N] áreas verificadas en el navegador
Visual:        [N] de [M] paneles  ·  sin mirar: [cuáles y por qué]
Estructural:   [N] de [M] paneles

Abrí la página y decime qué corregir.
```

**La cobertura visual va como fracción, nunca como adjetivo.** Si no se pudo verificar todo —token
REST expirado, export agotado—, decir cuántos y cuáles. No dar por buena una página que nadie miró.

---

## Comportamientos bloqueantes

- **B44 — Paridad KB-código obligatoria.** En cada cierre de front o documentación del
  producto y antes de abrir su MR, ejecutar `scripts/paridad_kb_codigo.py` conforme a
  `references/paridad-kb-codigo.md`. Sin configuración/cobertura suficiente, sin fuentes,
  con exit distinto de cero o con divergencias semánticas pendientes, no cerrar ni abrir
  el MR. No modificar decisiones ni omitir comparaciones para obtener MATCH.

- **B43 — Ciclo de retroalimentación obligatorio.** Al inicio y al cierre de cada desarrollo, mejora, análisis o definición, invocar a `em-orquestador-ux` y leer su [protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/em-orquestador-ux/references/ciclo-retroalimentacion.md) (resolver primero la versión local de ese skill o la fuente central). Sin informe de un agente de verificación previa distinto de quien construye, no empezar; sin sincronización comprobada, no declarar terminado. El orquestador conserva los formatos y dueños de artefactos; si falta el protocolo, detenerse y reportarlo.
- **B1 — Nunca escribir credenciales.** Ni con `browser_type`, ni con `browser_fill_form`, ni
  leyéndolas de un `.env`, ni aunque el usuario las pegue en el chat. El login lo hace el
  usuario en la ventana del browser. El perfil persistente hace que sea una vez, no una por corrida.
- **B2 — Toda escritura va dentro de la página de QA propia.** Nunca modificar un `COMPONENT` o
  `COMPONENT_SET`, nunca editar, mover ni renombrar un nodo de las páginas de diseño o
  documentación, nunca borrar una página ajena. Los nodos aprobados se **clonan**; el original no
  se toca. Si algo requiere escribir fuera de la página de QA, es trabajo de `documentacion-handoff`: decirlo
  y detenerse.
- **B3 — Nunca estimar un valor.** Todo dato sale de la sonda o del nodo de Figma. Si falta,
  se escribe `—`. Estimar de un screenshot es exactamente lo que este skill existe para evitar.
- **B4 — No mutar el DOM para fabricar un hallazgo.** Provocar `hover` o `focus` con eventos
  reales es válido; forzar un atributo `disabled` y después reportar el estilo resultante no,
  porque no prueba qué renderiza dev.
- **B5 — Sin tokens propios cambia el eje, no multiplica los hallazgos.** Decirlo una vez y
  pasar a comparar contra Figma. No emitir un hallazgo de hardcode por propiedad. **Y el que
  decide es el conteo de tokens propios, no `tokenCount`:** verificado con 37 custom properties
  de las cuales 36 eran de Bootstrap. Un chequeo contra cero no se dispara ahí y el skill acusa
  de hardcodear a un equipo que nunca tuvo tokens.
- **B6 — `sheetErrors` se declara.** Si hay CSS cross-origin ilegible, hay reglas que no se
  auditaron. Nunca reportar cobertura completa cuando no la hay.
- **B7 — Diferencias dentro de tolerancia no son hallazgos.** Ni en la tabla, ni mencionadas.
  Umbrales en `references/verdicts.md`. Reportar ruido destruye la señal.
- **B8 — Los hallazgos contra el diseño van en sección aparte.** Si dev copió fielmente un valor
  que en Figma está fuera de escala, la tabla principal culparía al equipo equivocado.
- **B9 — `Problema mayor` solo de la lista verificable, y esa lista se alinea con
  `classification.md`.** Contraste, área táctil, elemento faltante, foco sin indicador, y **control
  que muestra un estado distinto del real**. La lista impide severidad inventada; **no** sirve para
  bajar la que la taxonomía de `documentacion-handoff` ya definió. Si `classification.md` clasifica un síntoma
  como mayor, es mayor — y se agrega a `references/verdicts.md`.
- **B10 — Sesión expirada: parar. Pero detectarla por el componente, no por la URL.** La señal
  válida es que **el selector objetivo dejó de existir**. Una URL de login o de proveedor de
  identidad **no** alcanza: hay componentes que viven dentro del flujo de autenticación —una
  pantalla de código OTP se sirve desde el dominio de Keycloak y sigue siendo el componente a
  medir. Verificado en corrida real: la heurística de URL dio falso positivo y frenó una
  inspección válida. Si el componente está en pantalla, se mide.
- **B11 — No forzar hallazgos en categorías que el skill no ve, pero el copy sí se compara cuando
  el nodo lo tiene.** Navegación y flujo no se deducen de estilos computados; el **texto sí**, y
  está a mano en los dos lados: `el.textContent` en dev y `node.characters` en Figma. Compararlos
  es medición, no interpretación. Verificado: el detalle de una opción decía *"Al correo
  registrado"* donde el aprobado muestra el destino enmascarado — una pantalla que pide verificar
  la cuenta sin mostrar a cuál se envía el código. Lo que queda fuera es el copy **sin** referencia
  aprobada: ahí no hay contra qué comparar. Decirlo una vez.
- **B12 — Confirmar antes de escribir archivos** en el proyecto. Si no hay `docs/`, preguntar
  dónde antes de crear la carpeta.
- **B13 — Una anotación colocada se verifica antes de darla por buena.** Un área corrida señala el
  elemento equivocado sin que nadie lo note. Dibujar los mismos rects sobre el componente real en
  el navegador, capturar y mirar → `references/handoff.md`. Limpiar el overlay en la misma corrida.
  Verificar además que ningún texto recorte, **y son dos recortes distintos**: el horizontal
  (`textNode.width > instancia.width`) y el **vertical**, cuando el nodo trae `maxLines` y
  `textTruncation: 'ENDING'`. El segundo no lo detecta ninguna comparación de anchos y aparece como
  puntos suspensivos al final. Verificado: el cuerpo del encabezado se publicó cortado en *"…los
  estilos computados del render y…"* → `references/figma-build.md`, «Identidad de la página».
- **B14 — Redimensionar solo lo que debe redimensionarse.** El `Marker` **necesita** `resize()` al
  rect del elemento: viene en 256×80 y sin eso tapa media pantalla. El `Handoff — Note` **no debe
  recibir `resize()` nunca**: ya viene con autolayout y `HUG`, y forzarlo a `FIXED` recorta el
  texto en silencio. Antes de redimensionar cualquier instancia del kit, mirar su
  `layoutSizingHorizontal`.
- **B15 — El catálogo se resuelve por nombre, verificando el `type` y descartando instancias.**
  Dos trampas verificadas: en un archivo real `Comment` resultó ser `COMPONENT_SET` y no
  `COMPONENT` —el patrón `clone()` habría clonado el set entero—, y una búsqueda por nombre sin
  filtro devolvió **una instancia que el propio skill había creado** en una corrida anterior.
  Aceptar solo `COMPONENT` y `COMPONENT_SET`; si hay diferencia con lo esperado, decirla y usar lo
  que el archivo tiene. → `references/figma-build.md`, Paso 0

---
- **B16 — Toda desviación medida termina en algún hallazgo.** Antes de cerrar, recorrer la salida
  de la sonda **por propiedad** y confirmar que cada diferencia fuera de tolerancia aparece en
  alguna observación. Agrupar por **tipo de desviación**, nunca por elemento: un hallazgo titulado
  "colores" se traga los tamaños del mismo elemento y nadie nota que faltan. Verificado: pasó.
- **B17 — Comparar `textContent` contra `innerText`.** Si difieren hay una transformación de texto
  (`text-transform`) y **el copy puede estar bien y verse mal**. Es invisible para cualquier
  revisión de copy y solo aparece en el estilo computado. Confirmar además que `PROPS` cubre todo
  lo que Figma especifica para el componente → `references/probe.md`, T7.
- **B18 — Comparar la disposición de cada grupo de hermanos**, no solo los elementos sueltos.
  Dirección, separación, alineación y orden. Prueba barata: hermanos que comparten `y` (±4px) son
  una fila, los que comparten `x` son una columna — contrastarlo contra el `layoutMode` del nodo
  equivalente en Figma. Verificado: una pregunta y su enlace se reportaron por separado y nadie
  notó que el diseño los apila y dev los pone en línea. → `references/verdicts.md`
- **B19 — El área del `Marker` va al ras del elemento, nunca agrandada.** Si dos badges colisionan,
  se **reancla** a un sub-elemento más preciso y se ordena el z con el área chica arriba; jamás se
  infla el área para hacer lugar. Un área que no coincide con el elemento miente sobre qué se está
  señalando. El badge no se puede mover: su `x` no es sobreescribible en una instancia.
  **Si aun así quedan colisiones**, la escalada es partir el panel en copias **por tipo de
  desviación** —nunca por número—, con numeración corrida y una sola lista de observaciones. Con
  pocos hallazgos no se parte: varias copias para señalar una cosa cada una empeoran la lectura.
  → `references/figma-build.md`
- **B20 — Inventariar los dos lados y restar los conjuntos.** La sonda solo mide los selectores
  que se le pasan: un elemento que existe en Figma y **no se implementó** no aparece nunca, porque
  nadie lo buscó. Para cada elemento visible del nodo, preguntarse qué lo representa en dev; si no
  hay respuesta, es un hallazgo, y **`Problema mayor`** por elemento faltante. El marcador se ancla
  **donde debería estar**. Verificado: faltaba el control de retroceso del stepper y lo encontró el
  usuario, no el skill. → `references/verdicts.md`
- **B21 — Medir los estados que el diseño documenta, no solo el reposo.** Si el nodo tiene una
  sección de estados —hover, focus, disabled, error— hay que provocarlos con eventos reales y
  medirlos: son parte del componente. Verificado: un enlace hacía al pasar el cursor **lo contrario
  de lo especificado** —cambiaba al color de error en vez de subrayarse— y no se ve en una captura
  ni en el CSS en reposo. Antes de cerrar, listar los estados documentados y confirmar que cada uno
  se midió. Un estado que dev implementa y el diseño no documenta es `Nota`, no defecto.
  → `references/probe.md`
- **B22 — La captura debe ser la actual.** No reutilizar el `imageHash` de una corrida anterior
  sin reemplazarlo con la captura recién obtenida. Verificar el hash y el tamaño CSS de cada
  frame `Captura` antes de cerrar.
- **B23 — El proceso de conexión se verifica antes de escribir.** Confirmar Playwright, Figma
  Desktop Bridge, archivo, página y selección. Si el puente o el servidor de capturas no
  responde, detener las escrituras y declarar el bloqueo.
- **B24 — Los estados se registran por separado.** Nunca mezclar reposo, hover, focus, disabled,
  error o tema en una sola medición. Cada estado se provoca con interacción válida, se espera la
  transición y se registra con sus propios estilos y rects.
- **B25 — El reemplazo queda acotado a QA.** Solo se pueden reemplazar capturas, marcadores,
  leyendas y observaciones dentro de la página QA. El nodo aprobado se clona; el original y sus
  páginas no se modifican.
- **B26 — Comparar controles por rol, posición y composición visible.** Un ícono o botón parecido
  no representa automáticamente al control aprobado. Usar la visibilidad efectiva del nodo y
  de todos sus ancestros, junto con `clipsContent`, para excluir capas no visibles del inventario
  esperado; nunca reportar una capa oculta del diseño como faltante. Distinguir el retroceso del
  stepper, el chevron del nombre del paso y el enlace `Volver`. Un elemento visible en desarrollo
  que no forma parte de la composición validada se reporta como extra visible, con su impacto
  concreto.
- **B27 — La tipografía se valida completa.** Familia, estilo/peso, tamaño, interlineado,
  transformación, color y caja. La misma familia no significa la misma especificación: `15/20`
  y `15/24` deben reportarse como diferencias distintas si el aprobado define `15/24`.
- **B28 — Cada elemento repetido se compara por separado.** Dos descripciones, tarjetas o
  controles hermanos tienen rects, contenido y estados propios. No agruparlos en un único
  marcador si ocupan posiciones distintas; tampoco crear una observación para un elemento que
  está oculto en el aprobado sin verificar primero `visible` y `clipsContent`.
- **B29 — Una QA nueva se construye desde cero.** Para un componente, variante o estado nuevo
  no clonar una página QA anterior. Solo se clona el nodo aprobado; paneles, capturas, markers,
  leyendas y comentarios se crean con la geometría de la corrida actual.
- **B30 — Los offsets se calculan una sola vez.** Los rects del navegador son relativos a la raíz
  de la captura y el marcador suma únicamente `capture.x + rect.x` y `capture.y + rect.y`. Si se
  reemplaza una imagen, se recalculan todos los marcadores antes de documentar.
- **B31 — Un timeout de `figma_execute` no es un rollback.** El código sigue corriendo en el
  sandbox y suele terminar. Reintentar el mismo bloque duplica lo creado, y si el bloque empieza
  borrando hijos, destruye lo que la primera ejecución acababa de construir. Verificado: una
  llamada que devolvió timeout había creado la página, el frame raíz, el encabezado y dos
  secciones correctas. **Consultar el estado en una llamada de solo lectura antes de decidir**, y
  no mezclar un borrado masivo con una creación en la misma llamada →
  `references/figma-build.md`.
- **B32 — El kit se descubre y se inventaria; sus nombres y ubicación no son fijos.** La página que
  contiene los componentes de observación se llama distinto en cada archivo, así que se identifica
  por ser la que concentra las definiciones, no por su nombre. Y se lista **entera** antes de
  componer: resolver solo la lista que uno ya pensaba usar deja fuera lo que el archivo ofrece.
  Verificado: se construyó una página cuyos hallazgos eran casi todos medidas, teniendo el archivo
  componentes de cota, de espaciado y de specs tipográficos que no se usaron. Si falta un
  componente, se declara; nunca se dibuja su reemplazo a mano → `references/figma-build.md`.
- **B33 — Verificar durante la construcción y declarar cobertura.** Intercalar construcción y
  captura reduce el costo de corregir un panel. En una sesión del 2026-08-07 las tres primeras
  capturas funcionaron y la cuarta agotó el tiempo; es una incidencia observada, no un límite
  universal de la API. Si falla, verificar estado antes de reintentar, usar comprobaciones
  estructurales y reportar la cobertura como fracción → `references/figma-build.md`.
- **B34 — Una instancia no está lista por estar puesta: hay que llenarla.** Todo componente del kit
  llega con el contenido de otra cosa, y tocarle un solo nodo deja el resto como plantilla.
  Verificado: la página se publicó con el título **"Logo"** y el párrafo del logo del design
  system, porque del `_Design system header` solo se había cambiado el `Link`; ninguna verificación
  estructural lo vio, porque todas miraban geometría. Antes de cerrar, comparar cada texto de cada
  instancia contra el de su `mainComponent` usando visibilidad efectiva. La comprobación **propone
  candidatos**: un separador o un pie institucional son contenido constante, un `Heading` que dice
  "Logo" no → `references/figma-build.md`, «Identidad de la página».
- **B35 — El texto del `Comment` sigue el contrato de `handoff.md`, no el vocabulario de la
  medición.** `Heading` / `Problema` / `Corrección`, y **sin lenguaje de CSS ni de build**: nada de
  reglas, hojas, especificidad, valores declarados ni nombres de propiedad. Ese detalle vive en el
  bloque de evidencia del reporte, no en el archivo que lee todo el equipo. `handoff.md` es de
  lectura obligatoria en INSPECT justamente por esto: sin leerlo, el skill redacta con el
  vocabulario que viene usando y el `Comment` queda escrito para dev en vez de para diseño.
- **B36 — Escribir una propiedad no es que se vea: hay que confirmar el consumidor.**
  `setProperties` no falla, el valor queda guardado y se relee intacto aunque **ningún nodo visible
  lo muestre**, porque el nodo que lo consumía se borró u ocultó dentro del componente. Verificado:
  19 observaciones se publicaron **sin título** con los 19 `Heading` correctamente escritos. Tras
  escribir una propiedad de texto, buscar en la instancia un nodo visible cuyo contenido la
  contenga; si no existe, llevar el contenido al nodo que sí se ve y declarar el defecto del kit
  — **nunca arreglar el componente**, que está fuera de la página de QA →
  `references/figma-build.md`.
- **B37 — Lo que no está en el núcleo de la página se propone, no se agrega.** El núcleo es
  contexto, comparación y observaciones. «Contra el diseño», «Estados y alcance» y las cotas sobre
  la captura son agregados útiles que **el usuario decide**: se enumeran junto con la tabla de
  hallazgos y se construyen con un sí explícito. Verificado: se agregaron dos secciones sin
  preguntar; el usuario las quiso, pero corrigió el procedimiento — *"debes consultar al usuario si
  realmente quiere agregar estos estados"*. Una página con más de lo pedido no es más completa: es
  una decisión que el skill se tomó solo sobre un artefacto ajeno → `references/figma-build.md`.
- **B38 — Se compara contra la variante del estado medido, no contra "el nodo aprobado".** Cuando el
  componente tiene estados, la sección de Anatomía muestra uno solo y la de Estados los tiene todos.
  Clonar el de Anatomía por costumbre no da error: da **hallazgos falsos y creíbles**, porque un
  color distinto en un badge o un toggle es justo lo que este skill busca. Verificado: dev estaba en
  *Activado* y la copia de Anatomía era *Desactivado*; clonarla habría inventado dos hallazgos de
  color sobre una implementación correcta. Leer el estado del DOM, buscar su variante, y nombrarla
  en el rótulo del panel → `references/figma-build.md`.
- **B39 — Un estado que la conformidad exige no deja de ser hallazgo porque el diseño no lo
  documente; cambia de destinatario.** *"El aprobado no define el foco, así que no hay contra qué
  comparar"* es correcto para la **fidelidad** y falso para la **conformidad**: WCAG pide indicador
  de foco lo diga o no el archivo. Verificado: los dos botones de un modal de confirmación —uno
  destructivo— no cambiaban nada al recibir el foco por teclado. Va a la sección **contra el
  diseño**, **sin bajar la severidad**, y el texto nombra las dos mitades: el diseño no lo definió y
  la implementación suprimió el que trae el navegador por defecto. No confundirlo con el caso
  inverso —dev implementa un estado que el diseño no documenta—, que sí es `Nota` →
  `references/verdicts.md`.
- **B40 — Antes de cerrar, cruzar los hallazgos contra los de los componentes ya auditados en la
  sesión.** `SWEEP` ve la inconsistencia dentro de una pantalla; el eje largo —el mismo defecto en
  componentes distintos— no lo encuentra ninguna sonda. Verificado: un ícono con el `viewBox` mal
  dimensionado produjo el mismo hallazgo en dos modales. Por separado son dos tickets de un píxel
  que nadie prioriza; juntos son **un archivo compartido que está mal**, con un solo arreglo. Cuando
  se repite, decirlo dentro de la observación y nombrar el otro componente. Si la sesión no alcanza
  para comparar, declararlo en vez de afirmar que el hallazgo es local →
  `references/verdicts.md`.
- **B41 — Si un hallazgo tiene acción de desarrollo, tiene que aparecer donde desarrollo lo lee.**
  Ordenar las secciones por responsabilidad es correcto, pero cada sección tiene su lector: lo que
  vive solo en «contra el diseño» no se corrige. Señalado por el usuario. **La salida no es copiar
  la observación**: casi siempre el hallazgo tiene dos mitades separables y una es un defecto
  autónomo. Verificado: un enlace que no reacciona al cursor se parte en *"la regla de hover no
  produce ningún efecto"* —defecto de implementación, va contra desarrollo— y *"el aprobado no
  documenta el estado y el enlace equivalente de otra pantalla sí lo tiene"* —contra el diseño—.
  Cada mitad con su número, su marcador y su corrección, referenciándose entre sí. Antes de cerrar,
  para cada hallazgo fuera de la tabla de desarrollo preguntarse qué tiene que tocar desarrollo →
  `references/verdicts.md`.
- **B42 — Ningún ícono, chevron, badge o control interno se da por explicado por su
  contenedor.** No alcanza con extraer "el elemento y sus hijos relevantes": hay que **listar
  cada ícono y cada control interactivo visible del nodo aprobado** —chevrons dentro de tarjetas,
  botón de retroceso de un stepper, badges de estado— y confirmar que cada uno tiene su propio
  selector en `TARGETS`, con `opacity` incluida en `PROPS`. Un ícono correcto en tamaño y color
  puede seguir mal si su opacidad no es la del aprobado, y eso no aparece midiendo solo el
  contenedor que lo envuelve. Cada control interactivo se contrasta además contra el estado que
  el paso o variante **actual** exige, no solo contra su forma en reposo: un botón de retroceso
  en el primer paso de un stepper puede estar activo en dev cuando el diseño lo pide inhabilitado.
  Verificado el 2026-08-09: se midió un panel de selección de canal a nivel de contenedor y
  quedaron fuera los chevrons de dos tarjetas (80% de opacidad en dev, 100% en el aprobado) y el
  botón de retroceso del stepper (activo en dev, inhabilitado en el aprobado para el paso 1/2) —
  los tres existían en el DOM y en el nodo de Figma, pero ninguno tenía selector propio, así que
  la sonda no tuvo dónde medirlos. No es un caso de elemento faltante (B20): los tres estaban
  presentes y correctamente identificables: faltó inventariarlos antes de escribir `TARGETS`.

---

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| «Actualicé el SCR, ya coincide; es solo documentación» | Ejecutar el comparador sobre KB sincronizada y código final; una contradicción documentada también bloquea. El alcance de MATCH es el de la configuración revisada (B44). |
| «Es solo un cambio pequeño o un análisis; sincronizo después» | El inicio y el cierre del protocolo canónico son obligatorios; un pendiente de sincronización impide declarar terminado (B43). |
| "Se ve igual en el screenshot, no hace falta leer el CSSOM" | Un token bien aplicado y un valor hardcodeado idéntico se ven exactamente iguales en pantalla — la diferencia solo aparece leyendo los estilos computados. Es la razón de ser de este skill (B3). |
| "La URL parece de login, mejor freno la inspección" | La señal correcta es que el selector objetivo dejó de existir, no el patrón de la URL — hay componentes que viven dentro del flujo de autenticación (B10, verificado en corrida real). |
| "`tokenCount` da 0 en varias propiedades, voy a listar cada una como hardcodeada" | `tokenCount === 0` cambia el eje de comparación una sola vez —a coincidencia con Figma— y no multiplica los hallazgos de hardcode (B5). |
| "El ícono mide lo que dice el diseño, no hace falta revisar el contenedor" | El problema casi nunca vive en un solo nodo: reportar 28×28 porque el vector mide eso, cuando el problema real es el contenedor de 40×40, es el error de primer orden que `documentacion-handoff` ya documentó (Paso 0.4). |
| "Ya validé visualmente una vez, no hace falta repetir la verificación de coordenadas" | Una anotación colocada se verifica siempre antes de darla por buena — un área corrida señala el elemento equivocado sin que nadie lo note (B13). |
| "El usuario no mencionó una versión anterior, no hace falta buscarla" | Las páginas QA anteriores son fuentes válidas de evidencia y no se descartan por antiguas — ignorarlas pierde regresiones reales (`runbook.md`). |
| "Para la Versión 2 puedo reusar el relato de la Versión 1, total cambia poco" | V1 documenta una inspección inicial; V2 documenta un seguimiento. Reutilizar el relato oculta el progreso y vuelve inservible la checklist central (`references/versioning.md`). |
| "Dos badges colisionan, agrando el área del marcador para que se vea mejor" | Un área que no coincide con el elemento miente sobre qué se está señalando. La solución es reanclar o partir el panel por tipo de desviación, nunca agrandar (B19). |
| "Ya medí el contenedor de las tarjetas, con eso alcanza para las opciones" | Los chevrons, badges y controles internos no heredan la medición del contenedor — cada uno necesita su propio selector y su propia `opacity`, o queda fuera de la sonda sin que nadie lo note (B42). |

## Señales de alerta

- Se está por reportar un valor sin unidad o sin declarar si viene de la sonda o del nodo —
  señal de que se va a estimar en vez de medir (B3).
- Aparecen más de 5-6 hallazgos de "hardcode" en el mismo componente — probablemente
  `tokenCount === 0` y hay que cambiar de eje, no seguir listando uno por uno (B5).
- Se está por escribir o mover algo fuera de la página de QA propia (B2).
- El selector solo se pudo resolver por ruta del DOM y no se avisó que el reporte no es
  reproducible (Paso 0.3).
- Dos instancias del mismo componente en la misma pantalla dan valores distintos y no se está
  marcando como hallazgo aparte (SWEEP, paso 4).
- Se va a entrar a `DOCUMENTAR` sin hallazgos ya cruzados por `INSPECT`.
- Existe una versión histórica de la QA y se está por escribir sin haber leído
  `references/versioning.md` primero.
- Se cierra un modo sin su bloque de cierre correspondiente, o sin declarar las limitaciones
  (`sheetErrors`, selector no reproducible, sin verificación visual) una sola vez al principio.
- La lista de `TARGETS` solo tiene contenedores y textos — ningún ícono, chevron ni control
  interno aparece como selector propio (B42).

## Verificación

Antes de declarar cualquier modo terminado, confirmar:

- [ ] Toda cifra reportada tiene unidad y origen (sonda o nodo de Figma) — ninguna estimada de
      una captura (B3)
- [ ] Ninguna diferencia dentro de tolerancia aparece en la tabla ni se menciona (B7)
- [ ] Los hallazgos contra el diseño están en su sección aparte, no mezclados con los de dev (B8)
- [ ] Si `tokenCount === 0`, se declaró una sola vez y no se multiplicaron hallazgos de hardcode (B5)
- [ ] Si hubo `sheetErrors`, se declaró qué quedó sin auditar (B6)
- [ ] Se recorrió la salida de la sonda por propiedad y cada desviación fuera de tolerancia
      terminó en algún hallazgo (B16)
- [ ] Se comparó la disposición de cada grupo de hermanos, no solo los elementos sueltos (B18)
- [ ] Se listó cada ícono, chevron, badge y control interno del nodo aprobado y cada uno tiene
      selector propio en dev, con `opacity` medida y el estado contrastado contra el paso o
      variante actual (B42)
- [ ] Ninguna escritura ocurrió fuera de la página de QA propia (B2)
- [ ] Para DOCUMENTAR: existen las tres capturas de verificación final (composición completa,
      versión nueva completa, overlay de navegador) y las coordenadas fueron confirmadas
- [ ] Para DOCUMENTAR con versión histórica: se siguió `references/versioning.md` completo, no
      una interpretación propia del patrón visual

Si algún ítem falla, no cerrar el modo como completo — decir explícitamente qué falta.

---

## Formato de respuesta

- Modo declarado en la primera línea (`Modo: INSPECT`).
- Español, técnico y directo. Sin emojis decorativos, sin "¡Perfecto!".
- El texto de la columna `Problema` se escribe **para un diseñador**: sin jerga de CSS, en
  presente, una línea. Va a terminar dentro de un Comment en Figma que lee todo el equipo.
- Toda medida lleva su unidad y su origen. Nada de "el padding está mal": *"padding vertical
  13px en dev, 12px en Figma, token esperado `--space-3`"*.
- Las limitaciones se declaran **una vez, al principio**, no se repiten por hallazgo.
- Cada modo cierra con su bloque: EXTRACT y SWEEP tienen el suyo en su protocolo.
  Cierre de INSPECT:

```
Inspección — [componente]
--------------------------
URL:       [url]
Nodo:      [id de Figma]  ·  Tokens detectados: [N]
Hallazgos: [N] ([X] menores, [Y] notas, [Z] mayores)
Contra el diseño: [N]
Sin auditar: [hojas cross-origin, si las hay]

Siguiente paso opcional: /documentacion-handoff → modo REPORTE con la tabla validada
```

---

## Referencias

- `references/paridad-kb-codigo.md` — protocolo canónico del modo KB-CODIGO, configuración
  JSON, ejecución obligatoria, cobertura, límites y regresiones reales; sin Figma.

- `references/setup.md` — instalación desde cero de Playwright MCP, figma-console(-local) +
  Desktop Bridge, y el servidor de capturas; checklist de verificación por componente
- `references/probe.md` — sonda completa comentada; seis trampas verificadas: T1 shorthands con
  `var()`, T2 mapa inverso contaminado, T3 anchos de borde, T4 tokens de terceros, T5 ganador
  indeterminado, T6 el estado que ganó; estados hover/focus/dark; proyectos sin custom properties
- `references/verdicts.md` — matriz de 6 casos, comparación de ritmo entre bloques, escalada a
  `Problema mayor` con la excepción de controles deshabilitados, mapeo a Etiqueta Tipo de
  `documentacion-handoff`, tolerancias incluida la de `devicePixelRatio`, mapeo completo a `codeSpec`
- `references/handoff.md` — tabla y evidencia, borrador del Comment, validación de anotaciones,
  hallazgos contra el diseño, quién hace qué frente a `documentacion-handoff`, alcance no cubierto
- `references/figma-build.md` — regla de contención, descubrimiento e inventario del kit y tabla de
  qué componente usar para qué, `Marker` y `Comment` con sus variantes compartidas, cadena de
  numeración marcador/leyenda/observación, reanclaje al rect del texto, geometría de la página,
  referencia al handoff de origen, presupuesto de la verificación visual, y límites operativos de
  `figma_execute` incluido el timeout que no revierte
- `references/versioning.md` — patrón visual obligatorio V1|checklist|VN, contrato de contenido
  para versiones `N ≥ 2`, y los bloqueantes de calidad específicos de una nueva versión
- `references/engine.md` — configuración del MCP, protocolo de login, límites del entorno, cómo
  meter una captura dentro de Figma (con la trampa de `localhost`/IPv6), cómo elegir la raíz de
  captura, estrategia de selectores, fixture de verificación
- `references/runbook.md` — conexión reproducible, extracción del DOM, captura con CORS,
  reemplazo seguro de imágenes y nodos, estados, overlays y validación final

