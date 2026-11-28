---
name: documentacion-handoff
description: >
  Documentación de handoff de componentes en Figma: audita component sets, documenta anatomía,
  variantes, estados y especificaciones, y construye páginas de handoff con observaciones.
  Activar cuando el usuario diga "documenta este componente", "prepara el handoff", "necesito
  las especificaciones para desarrollo", "mapea la documentación de", "audita el componente",
  "corrige la observación" o "actualiza el handoff".
metadata:
  version: "3.2.0"
---

# Documentación de handoff — Orquestador

Prepara el handoff de componentes directamente en Figma: audita component sets, crea y mantiene
observaciones, y construye documentación para desarrollo.

**Límite de responsabilidad:** `paridad-diseno-desarrollo` comprueba si la implementación
renderizada coincide con el diseño. Este skill recibe hallazgos ya validados y documenta el
componente y sus especificaciones en Figma; no reemplaza esa comparación.

**HERRAMIENTAS:** el servidor se llama `figma-console` en una máquina y `figma-console-local`
en otra. Verificar cuál está activo y usar `mcp__<nombre-activo>__*`.

**LEER SIEMPRE AL INICIAR:**
- `references/anti-hallucination.md` — reglas de specs y validación
- `references/figma-gotchas.md` — trampas de la API y del render
- `references/components.md` — catálogo del kit y resolución por nombre

**LEER SEGÚN EL MODO:**
- QA → `references/classification.md`, `references/comment-format.md`, `references/figma-execution.md`
- Documentación → `references/documentation-build.md`
- Corrección de componente → `references/component-audit-checklist.md`
- Archivo con sistema parcial o sin kit → `references/design-system-maturity.md`

---

## GUARD — arranque de sesión (siempre, antes de cualquier escritura)

1. **Verificar el archivo activo** con `figma_get_status` / `figma_list_open_files`. El plugin
   puede estar apuntando a otro proyecto. Si el archivo objetivo no está conectado, pedirle al
   usuario que abra el Desktop Bridge ahí — no se puede hacer remotamente.
2. **Resolver los componentes por nombre** → `references/components.md`, Paso 0.
   **Nunca usar un ID hardcodeado de otra sesión.** Los IDs son por archivo; los nombres y las
   claves de propiedad se mantienen entre archivos.
3. **Declarar lo que no existe** en ese archivo antes de seguir. No improvisar reemplazos.
4. **Ubicar el nivel de madurez del sistema** → `references/design-system-maturity.md`. El mismo
   síntoma significa cosas distintas según el nivel: "hex crudo" es irrelevante en un archivo
   sin sistema, corregible en uno con colección local, y pendiente de la librería en uno remoto.

---

## Detección de Modo

Declarar el modo en la primera línea de cada respuesta.

| Modo | Señales del usuario |
|------|---------------------|
| **REPORTE** | Entrega un hallazgo ya validado, dice "OBS X:" o pide documentar una observación |
| **PROACTIVO** | Pide QA de una pantalla completa o el skill detecta algo no mencionado |
| **EDICIÓN** | "Corrige la obs X", "cambia el tipo de", "actualiza la descripción de" |
| **DOCUMENTACIÓN** | "Documenta este componente", "mapear la documentación de", da un componente + una referencia de estructura |
| **CORRECCIÓN** | "Corregimos el componente", "arregla los hallazgos" |

**Si el pedido es comparar desarrollo contra diseño, derivarlo a `paridad-diseno-desarrollo`.**
Si no encaja con el modo invocado, decirlo en una línea y proponer el camino correcto.

---

## Protocolo por Modo

### REPORTE
1. Escuchar la descripción completa
2. Obtener specs → `references/anti-hallucination.md`
3. Clasificar → `references/classification.md`
4. Redactar → `references/comment-format.md`
5. Crear → `references/figma-execution.md`
6. Bloque de confirmación

### PROACTIVO
1. Screenshot del frame numerado
2. Analizar y validar contra el nodo
3. Proponer en tabla **antes de crear**:
```
Detecté [N] observaciones adicionales:
| # | Elemento | Problema | Tipo | Etiqueta |
|---|----------|----------|------|----------|
¿Las agrego todas o filtramos?
```
4. Esperar confirmación — nunca crear sin OK

### EDICIÓN
1. Buscar la obs por número → `references/figma-execution.md`
2. Aplicar solo el cambio indicado
3. Confirmar: número + campo + valor nuevo

### DOCUMENTACIÓN
1. Leer la página de referencia entera y mapear su patrón
2. Leer el componente objetivo completo — todas las variantes
3. Auditar → `references/component-audit-checklist.md`
4. **Proponer estructura + hallazgos y esperar OK**
5. Construir → `references/documentation-build.md`
6. Verificar panel por panel con screenshot

### CORRECCIÓN
1. Auditar y presentar los hallazgos con su impacto
2. Marcar cuáles cambian la apariencia de instancias existentes
3. Separar lo corregible en el archivo de lo que necesita decisión del dueño de la librería
4. Esperar confirmación
5. Corregir por etapas, con screenshot después de cada una
6. Releer todas las variantes y armar la tabla final de specs

---

## Bloque de Confirmación

**Por observación:**
```
Modo REPORTE — OBS [N] creada
------------------------------
Título:   [heading]
Tipo:     [Problema mayor / Problema menor / Nota]
Etiqueta: [categoría]
Node:     [id del instance]
```

**Al cerrar sesión de QA:**
```
Sesión QA — [pantalla]
-----------------------
Total: [N] observaciones
  Problema mayor: [N]  |  Problema menor: [N]  |  Notas: [N]

Por categoría:
  Diseño de Interacción:           [N]
  Jerarquía Visual y Consistencia: [N]
  Navegación e Incorporación:      [N]
  Manejo de Errores y Textos:      [N]
```

---

## Comportamientos Bloqueantes

- **B22 — Ciclo de retroalimentación obligatorio.** Al inicio y al cierre de cada desarrollo, mejora, análisis o definición, invocar a `em-orquestador-ux` y leer su [protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/em-orquestador-ux/references/ciclo-retroalimentacion.md) (resolver primero la versión local de ese skill o la fuente central). Sin informe de un agente de verificación previa distinto de quien construye, no empezar; sin sincronización comprobada, no declarar terminado. El orquestador conserva los formatos y dueños de artefactos; si falta el protocolo, detenerse y reportarlo.
- **B1** Sin descripción del usuario → no crear obs autónomamente
- **B2** Sin nodo y sin frame numerado → pedir URL o nombre del frame
- **B3** Nodo falla → declarar el error, no reportar ninguna medida
- **B4** Etiqueta Tipo con `setProperties` → siempre `swapComponent`
- **B5** Número duplicado → verificar secuencia antes de crear
- **B6** Modo PROACTIVO sin confirmación → proponer, no crear
- **B7** ID de nodo hardcodeado de otra sesión → resolver por nombre
- **B8** Modificar un component set sin confirmación → cada instancia del archivo hereda el cambio
- **B9** Crear variables en una colección remota → no se puede; documentar como pendiente
- **B10** Cerrar sin screenshot → aplicar no es renderizar
- **B11** Documentación en la página del kit → cada componente va en su página `↳ Nombre`
- **B12** Crear una página que ya existe → reutilizar; y reutilizar vacías antes de crear
- **B13** Construir sobre documentación preexistente → se construye nueva, la vieja la decide el usuario
- **B14** Tocar un component set sin contar sus instancias → decir cuántas y en qué frames, antes
- **B15** Cerrar dejando huérfanos propios → listarlos y proponer borrarlos
- **B16** Afirmar contraste sin calcularlo → ratio, no impresión
- **B17** Documentar capas o estados ocultos → solo lo visible; las ocultas se preguntan y, si corresponde, van a Observaciones
- **B18** Ícono visible sin cota → marcar ancho y alto con `Handoff — Spacing`
- **B19** Posicionar una cota a mano → se deriva del nodo y se verifica contra el tramo real
- **B20** Afirmar que un bloque está vacío desde una lectura truncada → contar sus nodos visibles
- **B21** Documentar sin inventariar antes todos los bloques → alguno queda afuera

---

## Verificación

**Aplicar no es renderizar.** Que una propiedad se lea de vuelta correcta no significa que se
vea. Cerrar siempre con screenshot, y del **nodo padre** cuando hay bordes exteriores, sombras
o líneas guía — el export a nivel de nodo los recorta.

**Verificar a escala de panel, no solo del conjunto.** Los solapamientos, los textos recortados
y las flechas mal apuntadas no se ven en el screenshot completo.

**Si una corrección reintroduce el problema que resolvía, decirlo y rehacerla.** Es información
útil, no un error que ocultar.

---

## Formato de Respuesta

- Modo declarado en primera línea
- Respuestas cortas — una obs = un bloque de confirmación
- Sin emojis. Sin "¡Perfecto!" ni relleno
- Si algo falla en Figma: una línea declarando el error + acción pedida al usuario
- Reportar valores como **token + hex**, no solo hex. Un color sin token es un hallazgo

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| «Es solo un cambio pequeño o un análisis; sincronizo después» | El inicio y el cierre del protocolo canónico son obligatorios; un pendiente de sincronización impide declarar terminado (B22). |
| "La propiedad se aplicó, así que ya quedó bien" | Aplicar no es renderizar; cerrar sin screenshot puede dejar un resultado invisible o recortado. |
| "Podemos documentar primero y auditar después" | El handoff congelaría una inconsistencia y desarrollo la implementaría como especificación. |
| "El componente del kit tiene el mismo nombre, debe ser el correcto" | Los nombres y tipos varían entre archivos; resolver y verificar antes de instanciar evita usar un nodo equivocado. |

## Señales de alerta

- El archivo activo de Figma no coincide con el solicitado o el Desktop Bridge no responde: detenerse antes de escribir.
- Una propiedad cambia al leerla, pero no aparece en el screenshot: revisar el nodo consumidor y no cerrar.
- Un cambio de component set afecta instancias existentes: contar y mostrar el impacto antes de corregir.
- Una documentación previa contiene instancias vivas o contradice el componente actual: no construir sobre ella.

## Referencias

- `references/anti-hallucination.md` — lectura verificable de specs y validación.
- `references/classification.md` — severidad y categoría de observaciones.
- `references/comment-format.md` — redacción de observaciones.
- `references/component-audit-checklist.md` — auditoría previa del componente.
- `references/components.md` — resolución y uso del kit de Figma.
- `references/design-system-maturity.md` — adaptación al nivel del sistema de diseño.
- `references/documentation-build.md` — construcción de la página de handoff.
- `references/figma-execution.md` — patrones de ejecución en Figma.
- `references/figma-gotchas.md` — límites y fallas conocidas de Figma.
