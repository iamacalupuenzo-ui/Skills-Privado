# Cómo construir plantillas y entregables

Proceso completo para agregar documentación al sistema: cómo investigarla, cómo
estructurarla, dónde guardarla y cómo relacionarla con los sub-procesos.

Escrito tras construir las 17 plantillas de la fase de entendimiento el 2026-08-02.

---

## 1. Antes de escribir: la plantilla existe para un paso

**Toda plantilla se ancla a un paso concreto de un flujo.** Si no puedes nombrar el paso
donde se usa, la plantilla no debería existir todavía.

Antes de empezar, responde:

- ¿En qué paso de qué flujo se usa? *(relación `Sub-proceso`)*
- ¿Qué recibe como entrada y qué produce?
- ¿Qué decisión permite tomar? Si no cambia ninguna decisión, no la construyas.
- ¿Ya existe algo parecido? Buscar antes de crear.

---

## 2. Cómo investigar la estructura

### Fuentes que sirven

| Fuente | Para qué |
|---|---|
| **NN/g** (nngroup.com) | Definiciones rigurosas, entregables de discovery, guiones, problem statements |
| **SVPG** (svpg.com) | Distinciones conceptuales de producto (discovery vs. optimización) |
| **Maze, User Interviews, Lyssna** | Bancos de preguntas concretas y ejemplos |
| **Atlassian, Asana** | Documentos de gestión: SOW, kickoff, actas |
| **APQC** | Jerarquías y marcos formales de proceso |

### Fuentes que no sirven

Los blogs de herramientas que aparecen primero en búsquedas genéricas suelen ser
contenido SEO: listas de "10 preguntas" sin criterio, repetidas entre sitios. Se
reconocen porque no explican **por qué** cada pregunta importa.

### Método que funciona

1. **Primero el marco, después las preguntas.** Busca cómo se estructura el documento
   antes de buscar qué preguntas lleva. Sin marco, las preguntas quedan sueltas.
2. **`WebSearch` para mapear el terreno, `WebFetch` para extraer.** La búsqueda te dice
   qué artículos existen; el fetch trae el contenido real.
3. **En el prompt del fetch, pide extracción literal**: *"lista textualmente las preguntas
   concretas agrupadas por categoría"*. Sin eso devuelve resúmenes vagos.
4. **Cruza dos o tres fuentes** por plantilla. Cuando coinciden, es convención; cuando
   difieren, ahí hay una decisión que tomar y hay que declararla.
5. **Cita las fuentes al pie** de la plantilla. Da autoridad ante un cliente y permite
   volver a la fuente cuando algo no se entienda.

---

## 3. Anatomía de una plantilla que se usa

La diferencia entre una plantilla que se llena y una que se ignora:

### Encabezado de contexto

Tipo, flujo, fase, paso, y enlace a la contraparte (Notion o local). Que se sepa de un
vistazo dónde encaja.

### Cuándo sí y cuándo no

Arriba de todo, en cita. **Una plantilla que no dice cuándo NO usarla se usa mal.**

> Ejemplo: *"La encuesta no reemplaza a la entrevista. La entrevista te dice por qué; la
> encuesta te dice cuántos. Si todavía no sabes qué preguntar, no estás listo para encuestar."*

### Las preguntas, con el porqué al lado

Esto es lo que separa una plantilla profesional de una lista. Cada bloque de preguntas
lleva una nota que explica qué revela:

> *"¿Puedo hablar con 5 de ellos?"* — es una prueba de realidad. Un cliente que no puede
> darte acceso a usuarios está declarando algo importante sobre el proyecto.

Sin esas notas, quien use la plantilla hace las preguntas sin entender qué está buscando,
y no sabe reconocer la respuesta importante cuando aparece.

### Ejemplos de lo mal hecho y lo corregido

Más efectivo que la regla abstracta. Un problem statement mal escrito al lado del mismo
corregido enseña más que cinco reglas.

### Tablas para lo que se compara, listas para lo que se recorre

Las tablas de "no hagas esto / haz esto" funcionan muy bien para reglas de formulación.

### Checklist de cierre

Al final, condiciones verificables antes de dar el documento por terminado.

---

## 4. El patrón de variantes

**Cuando una plantilla cambia según el caso, se duplica con sufijo — no se llena de
condicionales.**

| Plantilla | Variantes | Qué las separa |
|---|---|---|
| Brief | Producto Nuevo · Mejora de Producto | ¿Ya existe evidencia de uso? |
| Guion de Entrevista | Exploratoria · Evaluativa | ¿Ya existe el producto? |

Regla para decidir si conviene una variante o un solo documento con condicionales:

- Si **una sección entera** cambia o desaparece → variante separada
- Si cambian **algunas preguntas sueltas** → un solo documento con nota

Ejemplo real: el Brief de Mejora tiene una sección (*Evidencia disponible*) que en producto
nuevo no puede existir, porque no hay producto en uso. Eso justifica la variante.

En el archivo README local y en el skill, documenta siempre **el criterio de elección**
entre variantes, no solo su existencia.

---

## 5. Doble destino: Notion y local

Toda plantilla vive en dos lugares:

| Destino | Para qué |
|---|---|
| **Notion** — BD Templates & Entregables | Operativo. Relacionada al paso, se abre mientras se trabaja |
| **Local** — `D:\Investigacion - V4\04-plantillas\` | Versionable, editable, y respaldo si Notion no está |

Ambos con el mismo contenido. El archivo local lleva el enlace a Notion en el encabezado;
el README local lleva la tabla índice con los enlaces cruzados.

### Al crear en Notion

```
data_source_id: fb45c89e-76bd-4c70-9d48-ab2a2194e7af
```

| Campo | Valor |
|---|---|
| `Nombre` | title — con sufijo de variante si aplica |
| `Tipo` | `Brief` · `User Story` · `Checklist` · `Report` · `Guía` · `Canvas` |
| `Status` | `Activo` · `En revisión` · `Borrador` |
| `Sub-proceso` | relation → el paso donde se usa. **Nunca dejarlo vacío** |
| `Archivo` | url — hoy vacío; es tipo URL y las rutas locales no aplican |

Criterio de `Tipo`: guiones, agendas y actas → `Guía`. Informes y análisis → `Report`.
Mapas y lienzos de trabajo → `Canvas`. *(Faltan `Acta` y `Plan` como opciones; el select
se queda corto.)*

### Al crear el archivo local

Encabezado obligatorio:

```markdown
# Nombre de la Plantilla

**Tipo:** X · **Flujo:** Y · **Fase:** Z · **Paso:** W
**Notion:** https://app.notion.com/p/...
```

Y actualizar el índice en `plantillas/README.md`: tabla, secuencia de uso y patrón de
variantes si corresponde.

---

## 6. Cómo relacionarla con el sub-proceso

La relación `Sub-proceso` es lo que hace que la plantilla aparezca cuando se necesita.

1. Identifica el paso: consulta la BD Sub-procesos & Pasos filtrando por flujo
2. Si la plantilla se usa en más de un flujo, vincula **todos** los pasos correspondientes
   *(la Agenda de Kickoff cuelga de `Kick-off & Brief` en FDPY y de `Propuesta & Scope` en GP)*
3. La relación es bidireccional: al vincularla, el paso muestra su plantilla automáticamente

**Verificación:** después de crear, revisa que el paso tenga la plantilla en su propiedad
`Templates`. Si no aparece, la relación no se escribió.

---

## 7. Inventario actual — fase de entendimiento (17)

BD: `collection://fb45c89e-76bd-4c70-9d48-ab2a2194e7af`

**Entendimiento** — Brief de Proyecto (Producto Nuevo) · Brief de Entendimiento (Mejora de
Producto) · Mapa de Stakeholders · Guion de Entrevista a Stakeholders · Mapa de Supuestos ·
Agenda de Kickoff · Acta de Acuerdo de Alcance

**Investigación** — Plan de Investigación · Análisis Competitivo · Guion de Entrevista a
Usuarios (Exploratoria) · Guion de Entrevista a Usuarios (Evaluativa) · Registro de Sesión
de Investigación · Encuesta a Usuarios

**Síntesis** — Mapa de Experiencia Actual · Informe de Síntesis · Problem Statement

**Transversal** — Acta de Reunión · Checklist Handoff Dev *(preexistente)*

### La cadena que no se puede romper

```
Brief → Supuestos → Plan → Guion → Registro → Síntesis → Problem Statement
```

Cada eslabón alimenta al siguiente. Los dos que más se saltan son **Mapa de Supuestos**
(sin él, el plan se arma por intuición) y **Registro de Sesión** (sin él, la síntesis se
hace de memoria).

### Pendiente de construir

Dirección visual · PRD / FRS · Épicas y User Stories · Handoff · Guion e informe de test
de usabilidad · Acta de cierre y retrospectiva.

**Personas quedó excluido a propósito:** consume tiempo y suele terminar decorando una
pared. El mapa de experiencia más hallazgos bien escritos da lo mismo, accionable.

---

## 8. Reglas

- **B-T1 — Toda plantilla se ancla a un paso.** Sin `Sub-proceso` no se crea.
- **B-T2 — Buscar antes de crear.** La BD ya tiene contenido; puede haber una versión vacía
  que hay que llenar en vez de duplicar *(pasó con "Brief de Proyecto", que existía sin una
  sola línea).*
- **B-T3 — Antes de sobrescribir, leer.** Una plantilla existente puede tener trabajo previo.
- **B-T4 — Doble destino siempre.** Notion y local, con enlaces cruzados.
- **B-T5 — Las preguntas van con su porqué.** Una lista de preguntas sin explicación no es
  una plantilla, es un cuestionario.
- **B-T6 — No inventar contenido de proceso.** Si no sabes cómo el usuario ejecuta una fase,
  pregúntale. No completes una plantilla con lo que suena razonable.
- **B-T7 — Citar fuentes al pie.** Da autoridad ante el cliente y permite volver al origen.
