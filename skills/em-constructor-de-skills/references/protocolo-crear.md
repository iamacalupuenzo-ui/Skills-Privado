# Skill Builder — Protocolo CREATE

Protocolo completo para crear un skill nuevo desde cero. Se activa cuando el modo
detectado es `CREATE`. Leer este archivo entero antes de actuar — no improvisar
las fases de memoria.

---

## Fase 0 — Entrevista (forcing questions)

Leer `references/forcing-questions.md` antes de empezar.

Usar primero lo aportado en el pedido y los archivos. Preguntar solo vacíos materiales;
no reiniciar la entrevista cuando el alcance ya esté definido.

Orden de preguntas (ver forcing-questions.md para el detalle de cada una):
1. Propósito y output
2. Alcance: project-specific vs global
3. Trigger phrases (ejemplos positivos y negativos, sin cuota)
4. Modos y sus señales
5. Herramientas y acceso externo
6. Conocimiento estático para referencias
7. Blocking behaviors / reglas no negociables
8. Registro en Notion solo si se solicitó (proceso y rol verificados)

Al terminar la entrevista, sintetizar en un bloque de confirmación antes de diseñar:

```
Resumen de entrevista — [nombre del skill]
-------------------------------------------
Propósito:      [una línea]
Alcance:        [global / project-specific: guard en archivo X]
Trigger phrases: [lista]
Modos:          [N modos — lista con señales]
Herramientas:   [lista]
Referencias:    [lista de archivos con su contenido]
Bloqueantes:    [lista]
Notion:         [proceso, rol]

Decisión pendiente: [solo si existe]
```

Continuar con el alcance autorizado; consultar solo ampliaciones materiales.

---

## Fase 1 — Diseño de arquitectura

Con la entrevista confirmada, diseñar y presentar la arquitectura antes de escribir.

```
Arquitectura — /nombre-del-skill
---------------------------------
SKILL.md          ← orquestación: guard, modos, fases, bloqueantes
references/
  archivo-1.md    ← [qué contiene y por qué va acá y no en SKILL.md]
  archivo-2.md    ← [ídem]
  ...

Decisiones de arquitectura:
  - [X] va en references/ porque es conocimiento estático que no cambia con el contexto
  - [Y] va en SKILL.md porque es lógica de orquestación que guía el comportamiento
  - [Z] no aplica porque [razón]

Nombre del skill:  [nombre-en-kebab-case]
Effort:            [low / medium / high] — por qué
Allowed tools:     [lista y justificación de cada una]

Autorización: [existente; consultar únicamente decisiones nuevas]
```

**Criterio para separar SKILL.md de references/:**
- SKILL.md → procedimientos, fases, modos, guards, bloqueantes, formato de respuesta
- references/ → tokens, decisiones tomadas, inventarios, patrones de código, checklists, mapas

---

## Fase 2 — Escribir references/ primero

Escribir cada archivo de referencias **antes** del SKILL.md. Las referencias son el
conocimiento que el SKILL.md va a invocar — sin ellas, el SKILL.md no puede referenciarlas.

Orden de escritura:
1. El archivo de conocimiento más estático (tokens, decisiones, inventario)
2. Los archivos de patrones o checklists
3. Los archivos que el SKILL.md va a citar por nombre en su sección de Referencias

Para cada archivo, declarar antes de escribir:
```
Escribiendo references/nombre.md
  Contenido: [qué va acá]
  Citado en SKILL.md como: references/nombre.md
```

---

## Fase 3 — Escribir SKILL.md

Escribir el SKILL.md siguiendo la anatomía de `references/skill-anatomy.md`.

Secciones posibles (adaptar el orden; omitir lo que no aporte):
1. Frontmatter (YAML)
2. Título + rol
3. Lo que ES y NO ES (si el skill tiene límites claros con otros)
4. Referencias disponibles
5. GUARD
6. Detección de modo (tabla)
7. Un bloque por modo: si el protocolo combinado supera ~150-200 líneas, externalizar
   cada protocolo a `references/protocol-[modo].md` en vez de escribirlo inline (ver
   `references/skill-anatomy.md`, sección 7)
8. Comportamientos bloqueantes (numerados B1..Bn)
9. Racionalizaciones comunes (tabla excusa → realidad)
10. Señales de alerta
11. Formato de respuesta
12. Sección de referencias (lista de archivos)

Reglas de escritura:
- Description explica capacidad y activación; combina el resultado delimitado con 2-4
  frases de disparo reales entre comillas (ver `references/skill-anatomy.md`, sección 1) —
  ni comillas vacías sin resultado, ni resultado sin ejemplos de activación.
- Cada modo define entrada, acción, verificación y salida; pausa por decisiones nuevas.
- Los bloqueantes son concretos, no principios vagos
- Las racionalizaciones son específicas al dominio del skill, no genéricas
- El formato de respuesta incluye idioma, tono, posición del modo y formato de cierre

Guardar todos los archivos creados en `Skils/skills/<nombre-del-skill>/`. Si es un skill
nuevo, agregar su nombre exacto a `Skils/skills-manifest.json`. No escribir primero en
`~/.codex/skills` ni `~/.claude/skills`: son copias instaladas.

---

## Fase 4 — Validación

Correr el checklist de `references/quality-checklist.md` sobre el skill recién escrito.

Formato del reporte de validación:
```
Validación — /nombre-del-skill
--------------------------------
✅ [criterio] — ok
❌ [criterio] — [qué falta o está mal]
⚠️  [criterio] — [pasa pero con observación]

Resultado: APROBADO / APROBADO CON OBSERVACIONES / RECHAZADO
Issues críticos: [lista si los hay]
```

Si hay issues críticos (❌) → corregirlos antes de continuar.
Corregir observaciones dentro del alcance aprobado; consultar solo ampliaciones.
Ejecutar los casos de references/evaluaciones.md y pruebas aisladas de código nuevo.

---

## Fase 5 — Registrar en Notion (opcional y autorizado)

Omitir esta fase si no se pidió registro. Verificar base y propiedades reales en
`references/catalog-flow.md`. Usar la base **Skills**, buscar primero una fila
existente y mantener: `Skill`, estado, descripción, cuándo usarlo, disparadores,
entornos verificados, tipo, prioridad, repositorio fuente, ruta fuente y última revisión.

Confirmar con el ID de Notion y la URL de la página creada.

## Fase 6 — Preparar distribución

Ejecutar `npm test` y `node bin/skils.js install --target all --skill <nombre> --dry-run`
desde la raíz de `Skils`. Informar que publicar con Git e instalar con la CLI son pasos
pendientes, a menos que el usuario los haya solicitado explícitamente.

## Cierre obligatorio

```
Skill creado — /nombre-del-skill
----------------------------------
Archivos:
  ✅ Skils/skills/nombre/SKILL.md
  ✅ Skils/skills/nombre/references/archivo-1.md
  ✅ Skils/skills/nombre/references/archivo-2.md
  [...]

Validación: APROBADO / APROBADO CON OBSERVACIONES
Registro:   [no solicitado / realizado y verificado → URL / pendiente]
Publicación: [no solicitada / commit y URL verificados]
Instalación: [no solicitada / destinos y doctor verificados]

Para usar: /nombre-del-skill [argumento]
Triggers:  [3 frases clave del frontmatter]
```
