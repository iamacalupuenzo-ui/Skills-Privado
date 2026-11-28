# Skill Builder — Catálogo de patrones reales

Ejemplos adaptados de skills existentes; los nombres no implican instalación ni disponibilidad.
Son patrones seleccionables, no una plantilla obligatoria para todos los dominios.
Nunca copiar literalmente — adaptar al dominio del skill que se está construyendo.

---

## Patrón 1: Frontmatter — skill complejo (react-dev)

```yaml
---
name: react-dev
description: >
  Senior Full Stack Engineer (frontend-heavy) para proyectos React / Next.js.
  Activar cuando el usuario quiere construir una feature, componente, página o
  solicita arrancar un proyecto nuevo con una plantilla verificada.
  Usa revisiones pertinentes al alcance, sin activar todos los auditores por defecto.
argument-hint: "[feature o componente a construir]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, WebSearch
shell: powershell
effort: high
---
```

**Lección:** description combina rol ("Senior Full Stack Engineer") con qué activa el skill
y qué orquesta. Es más largo que el mínimo porque el skill es complejo.

---

## Patrón 2: Frontmatter — skill de auditoría (audit-a11y)

```yaml
---
name: audit-a11y
description: >
  Auditor de accesibilidad WCAG 2.2 AA para componentes web (Angular y React/Next).
  Activar cuando el usuario solicita auditar componentes interactivos o pide "revisar accesibilidad",
  "audit a11y" o "cumplir WCAG". Reporta hallazgos verificados con severidad y fix concreto.
argument-hint: "[componente, carpeta o feature a auditar]"
allowed-tools: Read, Glob, Grep, Bash
effort: medium
---
```

**Lección:** skills de solo lectura no necesitan Write/Edit/Agent. effort: medium para
auditores sin orquestación compleja.

---

## Patrón 3: Frontmatter — skill de rol conversacional (design-director)

```yaml
---
name: design-director
description: Ayuda a evaluar decisiones de UX y producto con evidencia, alternativas y una recomendación. Usar al debatir un diseño o elegir entre opciones; no modifica artefactos.
metadata:
  version: "1.0.0"
---
```

**Lección:** skills conversacionales sin fases complejas pueden prescindir de argument-hint
y allowed-tools específicos. `version:` es útil para skills que evolucionan.

---

## Patrón 4: Guard de proyecto (lyse-ds)

````markdown
## GUARD — verificar proyecto antes de continuar

Antes de cualquier acción, confirmar que estamos en el proyecto correcto:
```powershell
Test-Path "astro.config.mjs"
Test-Path "src/styles/tokens.css"
```
Si alguno falla → este proyecto NO es lyse-ds. Avisa al usuario y detente.
Si pasan → registra el working directory y continúa.
````

**Lección:** verificar la identidad mediante evidencias específicas del proyecto, no por cantidad de archivos.
Decir qué hacer si falla (no solo verificar).

---

## Patrón 5: Guard de stack en código (react-dev)

````markdown
## GUARD DE STACK — verificar antes de continuar

Si hay `package.json` en el proyecto, léelo ANTES de cualquier otra cosa:
- Tiene `@angular/core` → este skill NO aplica. Avisa al usuario y deriva a `/angular-dev`.
- Tiene `next` o `react` → continúa acá.
- No hay `package.json` → comprobar ruta y tipo de proyecto. No clonar una plantilla sin pedido.
````

**Lección:** el guard puede leer un archivo y tomar decisiones basadas en su contenido,
no solo verificar si existe.

---

## Patrón 6: Tabla de modos — skill complejo

````markdown
## Detección de Modo

Declarar el modo en la primera línea antes de cualquier acción.

| Modo | Señales | Acción |
|------|---------|--------|
| `FROM_CODE` | El usuario muestra/nombra un componente existente en el código | Leer HTML + SCSS, extraer specs, crear en Figma |
| `FROM_DESCRIPTION` | El usuario describe un componente sin código de referencia | Usar requisitos y sistema verificados; declarar vacíos antes de crear |
| `AUDIT` | "qué componentes faltan", "qué no tenemos en Figma" | Comparar codebase vs componentes existentes |
| `EXTRACT` | "extrae las specs de este componente de Figma" | Leer props internas y documentar |
| `FIX` | "el componente quedó mal", "corrige el sizing" | Leer estado actual, identificar problema, corregir |
````

**Lección:** las señales del modo FROM_CODE son condiciones observables, no solo frases.
Cada modo tiene una acción descriptiva, no solo un nombre.

---

## Patrón 7: Tabla de modos — skill conversacional

````markdown
| Modo | Señales clave |
|------|--------------|
| SPARRING | "debate esto", "discutamos", "qué opinas de", "estoy pensando en hacer X" |
| CRÍTICA | "critica este diseño", "revisa como senior", "qué está mal acá" |
| DECISIÓN | "estoy entre A y B", "ayúdame a decidir", "cuál conviene" |
| ENSEÑANZA | "qué leo para", "explícame por qué", "qué referente sabe de esto" |
````

**Lección:** skills conversacionales tienen señales de texto puro, no condiciones de código.
La columna "Acción" puede omitirse si los protocolos de cada modo son largos.

---

## Patrón 8: Fase con preflight y reporte (figma-component-builder)

````markdown
## Paso 0 — Preflight (Obligatorio)

Fase B — Contexto del design system (en paralelo):
1. figma_get_variables (format: "summary")
   → Cargar nombres de variables semánticas disponibles
2. figma_search_components (query: "", limit: 25)
   → Inventario de componentes existentes

Resultado del preflight:
```
Preflight completado
--------------------
Archivo:      [nombre] (fileKey: [key])
Variables:    [N total] — [colecciones]
Componentes:  [lista con variantCount]
```
````

**Lección:** el preflight reporta siempre en formato fijo. Permite verificar que el
contexto está correcto antes de actuar.

---

## Patrón 9: Fase de planificación con confirmación (react-dev)

````markdown
### 1.3 — Diseñar el árbol de componentes

Preséntale al usuario el árbol ANTES de codear:

```
features/nombre/
├── components/
│   ├── NombreCard.tsx        ← (nueva)
│   └── NombreGrid.tsx        ← (nueva)
├── hooks/
│   └── useNombre.ts          ← fetch + estado
└── index.ts                  ← barrel export
```

Si la arquitectura introduce decisiones fuera del alcance aprobado, solicitar aprobación; de otro modo continuar.
````

**Lección:** el árbol de archivos es una forma excelente de visualizar el plan.
"Espera aprobación antes de continuar" es la pausa explícita.

---

## Patrón 10: Blocking behaviors — estilo react-dev

````markdown
## Reglas de oro

- **Resuelve vacíos materiales** — usa primero los datos conocidos; pregunta si cambia la decisión
- **Reutiliza antes de crear** — busca siempre si el componente ya existe
- **Responsabilidades claras** — dividir cuando mejore el uso y conservación, no por un límite de líneas
- **Tokens pertinentes** — reutilizar tokens semánticos verificados si el sistema los define
````

**Lección:** cuando los bloqueantes son simples y pocos, "Reglas de oro" es suficiente.
Para skills más complejos, numerarlos (B1, B2...) permite referenciarlos.

---

## Patrón 11: Blocking behaviors — estilo figma-component-builder (numerados)

````markdown
## Comportamientos Bloqueantes

- **B1 — Sin conexión**: si `figma_get_status (probe: true)` falla, no proceder.
- **B2 — Sin preflight**: no crear ningún componente sin haber ejecutado el Paso 0.
- **B3 — Colores hardcodeados**: nunca setear fills con hex fijos si existe variable semántica.
- **B11 — Avanzar sin pausa entre lotes**: no crear organismos hasta terminar moléculas Y recibir confirmación.
- **B13 — Ejecutar sin archivo pineado**: si hay más de un archivo conectado, nunca ejecutar sin haber pineado.
````

**Lección:** numerados cuando son muchos (>6). El nombre corto en negrita permite identificar
sin leer el texto completo. La consecuencia está implícita o explícita.

---

## Patrón 12: Cierre estructurado (lyse-ds)

````markdown
### Cierre obligatorio

```
Componente completado — [NombreComponente]
-------------------------------------------
Archivos creados:
  ✅ src/components/ui/nombre.tsx
  ✅ src/components/docs/NombrePageContent.tsx
  ✅ src/pages/components/nombre/index.astro

Archivos modificados:
  ✅ src/lib/nav.ts (entrada agregada)
  ✅ references/inventory.md (marcado ✅)

Props: [lista]
Estados documentados: [lista]
Auditorías: [corridas / pendientes]

Siguiente componente sugerido: [nombre]
```
````

**Lección:** el cierre lista archivos creados/modificados, resultado de auditorías, y
sugiere el próximo paso. Siempre en formato fijo para que el usuario pueda comparar sesiones.

---

## Patrón 13: Motor de razonamiento (design-director)

````markdown
## El Motor de Razonamiento — Siempre Antes de Responder

### Paso 1 — No asumir. Reformular como JTBD + hipótesis.
### Paso 2 — Investigar antes de opinar.
### Paso 3 — Evaluar las alternativas relevantes y sus consecuencias.
### Paso 4 — Autocrítica (red-team de la propia recomendación).
### Paso 5 — Recomendar con la estructura completa.
````

**Lección:** skills de razonamiento/consultoría tienen un criterios de decisión, no una transcripción de razonamiento interno.
Entregar evidencia, alternativas y justificación concisa.

---

## Patrón 14: Formato de respuesta con restricciones de idioma

````markdown
## Formato de Respuesta

- Declarar modo detectado en primera línea
- Sin emojis decorativos. Sin "¡Perfecto!" ni frases de relleno
- **Idioma: español neutro (Perú).** No usar voseo ni rioplatense ("tú", "dale", "mira").
  Usar "tú"/"usted" según corresponda o formas impersonales.
- Tono directo de director: opina, decide, fundamenta.
- Preguntas: máximo 3 por ronda, agrupadas.
````

**Lección:** cuando el skill tiene un usuario específico con preferencias de idioma,
documentarlo aquí. Evitar que el skill cambie de registro entre sesiones.

---

## Patrón 15: Auto-mejora (design-director)

````markdown
## Modo Aprendizaje — Auto-mejora de la Biblioteca

Cuando se evalúa una empresa/producto que no está en `references/learning-library.md`:
1. Declararlo: "Esto vale la pena guardar en la biblioteca."
2. Proponer la entrada y pedir confirmación.
3. Al confirmar, escribir en `references/learning-library.md`.
4. Si contradice algo ya guardado, actualizar la entrada vieja.
````

**Lección:** los skills de consultoría/razonamiento pueden mejorar con el uso escribiendo
en sus propias referencias. Esto los hace más valiosos con el tiempo.

---

## Patrón 16: Externalización de protocolos por modo (skill-builder)

````markdown
## Detección de modo

| Modo | Señales | Acción |
|------|---------|--------|
| `CREATE` | "crea un skill", "nuevo skill" | Leer `references/protocol-create.md` completo y seguirlo |
| `AUDIT` | "audita el skill", "qué le falta a" | Leer `references/protocol-audit.md` completo y seguirlo |

## Protocolos por modo

Cada modo tiene su protocolo completo en un archivo de `references/` — no se carga
hasta que ese modo específico se detecta. Al detectar el modo, leer el archivo de
protocolo correspondiente entero antes de actuar.
````

**Lección:** cuando un skill tiene ≥2 modos y el protocolo combinado supera ~150-200
líneas, cada protocolo va en su propio `references/protocol-[modo].md`. La tabla de
modos apunta al archivo en vez de resumir la acción inline. El SKILL.md queda como
orquestador puro — guard, tabla, bloqueantes, formato — y cada invocación real solo
carga el protocolo del modo que se usa, no los otros.

---

## Patrón 17: Racionalizaciones comunes (skill-builder)

````markdown
## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| "Necesito repetir las ocho preguntas" | Resolver solo vacíos del contexto (B1, B6). |
| "Los campos funcionan igual en todos los agentes" | Verificar soporte por consumidor (B9). |
````

**Lección:** cada fila ancla una excusa predecible y específica del dominio del
skill a un bloqueante o criterio concreto (no genérica tipo "no cortés camino").
Es la diferencia entre prohibir una acción (bloqueante) y anticipar el pensamiento
exacto que lleva a cometerla de todas formas (racionalización).

---

## Patrón 18: Señales de alerta (skill-builder)

````markdown
## Señales de alerta

- Se propone reducir referencias sin mapa de conservación de reglas y ejemplos.
- Se propone una arquitectura y se empieza a escribir sin esperar la confirmación
  explícita del usuario.
````

**Lección:** a diferencia del checklist (que se corre al final), las señales de
alerta son observables *durante* el trabajo — permiten frenar a mitad de camino en
vez de descubrir el problema recién en la validación.

---

## Patrón 19: scripts/ con contrato y pruebas (orquestacion-multi-harness)

Verificado el 2026-09-26 — la sesión ejecutó ambos scripts en aislamiento, incluido el caso
de fallo, antes de darlos por buenos:

````bash
#!/usr/bin/env bash
# Contrato: imprime en stdout el nombre del ejecutable correcto para esta sesión, sale 0.
# Si el ejecutable resuelto no puede correr, imprime el error exacto en stderr y sale 1 —
# no cae a otro ejecutable en silencio.
set -euo pipefail

resolve() {
  if [ -n "${ORCA_CLI_COMMAND:-}" ]; then echo "$ORCA_CLI_COMMAND"; return 0; fi
  if [ -n "${ORCA_DEV_REPO_ROOT:-}" ]; then echo "orca-dev"; return 0; fi
  if [ "$(uname -s 2>/dev/null)" = "Linux" ]; then echo "orca-ide"; return 0; fi
  echo "orca"
}

CMD="$(resolve)"
if ! "$CMD" --version >/dev/null 2>&1; then
  echo "No se pudo ejecutar '$CMD --version'. No se cae a otro ejecutable." >&2
  exit 1
fi
echo "$CMD"
````

Pruebas que se corrieron antes de declararlo listo (no alcanza con que "se vea bien"):
- Caso normal: sin variables de entorno seteadas → imprime `orca`, exit 0.
- Caso de fallo: `ORCA_CLI_COMMAND=orca-que-no-existe-xyz` → reporta el error exacto, exit 1,
  sin fallback silencioso a otro ejecutable.

**Lección:** el contrato (qué entra, qué sale, qué pasa si falla) se escribe como comentario
antes del código, no después. El caso de fallo se prueba de verdad — forzando la condición
(variable de entorno con un valor inválido, umbral bajado a propósito para el otro script del
mismo skill) — no se asume que "si no hay error visible, funciona". Un script sin su caso
negativo probado no cumple C21/C22 del checklist aunque el caso normal funcione.

---

## Decisiones de arquitectura por tipo de skill

| Tipo de skill | Modos típicos | References típicas | Effort |
|--------------|---------------|-------------------|--------|
| Auditor | 1-2 (AUDIT, FIX) | checklist.md | medium |
| Constructor | 3-5 (ADD, UPDATE, STATUS, AUDIT) | inventory.md, tokens.md, patterns.md | high |
| Consultor/Razonamiento | 4-6 (conversacionales) | mental-models.md, learning-library.md | medium-high |
| Orquestador complejo | 5+ (CREATE, MIGRATE, AUDIT, UPDATE) | anatomy.md, checklist.md, patterns.md, protocol-[modo].md por modo | high |
| Reporter | 1 (REPORT) | templates.md | low |
| Configurador | 2-3 (SETUP, UPDATE, AUDIT) | schema.md | medium |

Los campos argument-hint, shell y effort de los ejemplos históricos no son un contrato
portable. En fuente compartida usar name, description y metadata; configurar capacidades
según el agente disponible. No inicializar dependencias por copiar un ejemplo.
