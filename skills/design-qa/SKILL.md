---
name: design-qa
version: 3.0.0
description: >
  QA y documentación de diseño en Figma. Documenta inconsistencias entre el diseño aprobado y
  el desarrollo actual con el componente Comment, audita component sets y construye páginas de
  handoff. Activar cuando el usuario diga "hay un problema en desarrollo", "OBS X:", "QA de
  diseño", "corrige la obs", "documentá este componente", "mapear la documentación de",
  "auditá el componente", o cuando comparte imágenes de desarrollo o URLs de nodos Figma.
argument-hint: "[observación, componente a documentar, nodo de Figma o imagen de desarrollo]"
allowed-tools: Read, Bash, mcp__figma-console-local__figma_execute, mcp__figma-console-local__figma_take_screenshot, mcp__figma-console-local__figma_capture_screenshot, mcp__figma-console-local__figma_get_status, mcp__figma-console-local__figma_get_selection, mcp__figma-console-local__figma_list_open_files, mcp__figma-console-local__figma_navigate
effort: medium
---

# Design QA — Orquestador

Skill de calidad de diseño en Figma. Opera directamente sobre el archivo: crea observaciones,
audita componentes y construye documentación de handoff.

**HERRAMIENTAS:** el servidor se llama `figma-console` en una máquina y `figma-console-local`
en otra. Verificar cuál está activo y usar `mcp__<nombre-activo>__*`.

**LEER SIEMPRE AL INICIAR:**
- `references/anti-hallucination.md` — reglas de specs y validación
- `references/figma-gotchas.md` — trampas de la API y del render
- `references/components.md` — catálogo del kit y resolución por nombre

**LEER SEGÚN EL MODO:**
- QA → `references/classification.md`, `references/comment-format.md`, `references/clarity-check.md`, `references/figma-execution.md`
- Documentación → `references/documentation-build.md`
- Corrección de componente → `references/component-audit-checklist.md`
- Archivo con sistema parcial o sin kit → `references/design-system-maturity.md`

---

## Paso 0 — Arranque de sesión (siempre, antes de cualquier escritura)

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
| **REPORTE** | Describe un problema, comparte imagen, dice "OBS X:", da URL de nodo |
| **PROACTIVO** | Pide QA de una pantalla completa o el skill detecta algo no mencionado |
| **EDICIÓN** | "Corrige la obs X", "cambia el tipo de", "actualiza la descripción de" |
| **DOCUMENTACIÓN** | "Documentá este componente", "mapear la documentación de", da un componente + una referencia de estructura |
| **CORRECCIÓN** | "Corregimos el componente", "arreglá los hallazgos" |

**Si el pedido no encaja con el modo invocado, decirlo.** Un usuario puede pedir `/design-qa`
para construir documentación: nombrar la diferencia en una línea, proponer el camino correcto y
seguir. No hacer QA de algo que todavía no existe.

---

## Protocolo por Modo

### REPORTE
1. Escuchar la descripción completa
2. Obtener specs → `references/anti-hallucination.md`
3. Clasificar → `references/classification.md`
4. Redactar → `references/comment-format.md`
4.5. Verificar claridad (Problema/Corrección, Tipo ≠ Nota) → `references/clarity-check.md`
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
Si corrió el chequeo de claridad (`references/clarity-check.md`) y el score fue 2 (falta
severidad/impacto), agregar una línea: `Claridad: falta [lo que el score marcó como ausente]`.
Si TypeSafe no estaba configurado o falló, agregar: `(TypeSafe no configurado — chequeo de
claridad omitido)`.

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
