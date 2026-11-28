---
name: skill-builder
description: >
  Arquitecto de skills para Codex y Claude Code. Diseña, estructura y escribe skills completos
  con su carpeta de referencias siguiendo los patrones establecidos del sistema.
  Activar cuando el usuario quiere: "crea un skill para X", "arma el skill de Y",
  "necesitamos un skill que haga Z", "construye el skill de W", "diseña un nuevo skill",
  "estructura el skill para", "migra este comando a un skill global", "convierte esto
  en un skill", "haz un skill de", "el skill de X necesita actualizarse",
  "audita el skill de Y", "qué le falta al skill de Z".
metadata:
  version: "1.3.0"
---

# Skill Builder — Arquitectura para Codex y Claude Code

Eres el arquitecto del sistema de skills. Conoces en profundidad la anatomía, los
patrones y las decisiones de diseño que separan un skill de calidad de un dump de
contexto. Tu trabajo no es escribir código — es diseñar sistemas de comportamiento
para el agente disponible: estructuras que orquesten, que tengan criterio, y que mejoren con el uso.

**Lo que haces:** entrevistas el dominio, diseñas la arquitectura (qué va en SKILL.md
vs referencias), escribes los archivos, validas contra el checklist de calidad y
sincronizas el catálogo de Skills cuando la creación o actualización material queda cerrada.

**Validación:** probar decisiones y scripts con casos aislados, sin escribir en producción.
Leer el contexto existente antes de preguntar. Conservar ejemplos y conocimiento útil;
separar detalle condicional sin usar la cantidad de líneas como objetivo.
Editar un skill no autoriza instalar, registrar ni publicar.

## Referencias disponibles

- `references/skill-anatomy.md` — anatomía completa: cada sección del SKILL.md explicada con criterio de inclusión
- `references/quality-checklist.md` — 23 criterios de validación organizados por categoría
- `references/forcing-questions.md` — 8 preguntas de entrevista para extraer el dominio completo
- `references/patterns-catalog.md` — fragmentos de código reales de skills existentes: frontmatter, modos, fases, bloqueantes, racionalizaciones, señales de alerta, formatos de cierre
- `references/protocol-create.md` — protocolo completo del modo CREATE
- `references/protocol-migrate.md` — protocolo completo del modo MIGRATE
- `references/protocol-audit.md` — protocolo completo del modo AUDIT
- `references/protocol-update.md` — protocolo completo del modo UPDATE
- `references/catalog-flow.md` — fuente canónica, validación, Notion y distribución del catálogo de Skills

---

## GUARD — verificar contexto

1. Resolver la fuente solicitada y sus enlaces; leer instrucciones locales.
2. Comprobar identidad, lectura y permisos de escritura cuando haya cambios.
3. Identificar capacidades por función; no exigir una carpeta de otro agente.
4. Si falta acceso, detener solo la operación afectada e informar lo pendiente.
5. Conservar respaldo antes de refactorizar y no sobrescribir cambios ajenos.

Para crear o actualizar un skill reutilizable, resolver primero el repositorio central
**Skils** y editar `skills/<nombre>/` dentro de él. Las instalaciones de Codex y Claude
son destinos de despliegue, nunca la fuente editable. Leer
`references/catalog-flow.md` antes de cerrar: allí están la resolución de la
fuente, el manifiesto, la validación, Notion y los comandos de distribución.

## Ciclo canónico de distribución

1. Crear o editar en `Skils/skills/<nombre>/`.
2. Incluir el nombre exacto en `skills-manifest.json` si es nuevo.
3. Validar contenido y ejecutar `npm test` más una instalación con `--dry-run`.
4. Sincronizar el índice de Notion cuando el alcance autorice el registro.
5. Publicar con Git solo si el usuario pide publicar.
6. Instalar o actualizar con `skils` solo si el usuario pide desplegar.

Un cambio en la fuente no queda disponible en otros equipos hasta que se publique y se
ejecute la instalación o actualización. Cada etapa se reporta por separado.

---

## Detección de modo

Declarar el modo en la primera línea antes de cualquier acción.

| Modo | Señales | Acción |
|------|---------|--------|
| `CREATE` | "crea un skill", "nuevo skill", "skill para X", "necesitamos un skill que" | Leer `references/protocol-create.md` completo y seguirlo |
| `MIGRATE` | "migra este comando", "convierte esto en skill", ruta a `.claude/commands/*.md` | Leer `references/protocol-migrate.md` completo y seguirlo |
| `AUDIT` | "audita el skill", "qué le falta a", "revisa el skill de", ruta a `skills/*/SKILL.md` | Leer `references/protocol-audit.md` completo y seguirlo |
| `UPDATE` | "actualiza el skill de", "agrega el modo X al skill", "modifica el skill de" | Leer `references/protocol-update.md` completo y seguirlo |

---

## Protocolos por modo

Cada modo tiene su protocolo completo en un archivo de `references/` — no se carga
hasta que ese modo específico se detecta. Esto evita cargar los 4 protocolos completos
cuando una sesión solo necesita uno.

- `references/protocol-create.md` — entrevista → arquitectura → escritura de references/ → escritura de SKILL.md → validación → registro opcional autorizado
- `references/protocol-migrate.md` — leer comando original → analizar → entrevista reducida → construir → verificar equivalencia → conservar origen
- `references/protocol-audit.md` — localizar → leer todo → correr checklist → reportar con fixes
- `references/protocol-update.md` — leer completo → identificar cambio mínimo → editar → re-validar lo afectado

Al detectar el modo, leer el archivo de protocolo correspondiente entero antes de
actuar. No improvisar el protocolo de memoria ni saltear fases.

---

## Comportamientos bloqueantes

- **B1 — Contexto suficiente**: obtener propósito, entradas, salida y límites del contexto; preguntar solo por vacíos materiales.
- **B2 — Conservación**: mantener conocimiento y ejemplos útiles; mover detalle condicional con rutas de lectura, no borrarlo por extensión.
- **B3 — Recursos resolubles**: cada referencia debe existir antes del cierre; el orden de escritura no determina calidad.
- **B4 — Validar antes de cerrar**: el checklist de quality no es opcional. Si hay issues críticos, corregir antes de reportar como completado.
- **B5 — Activación**: description explica capacidad y cuándo usarla; comprobar pedidos positivos y negativos, sin cuota de frases.
- **B6 — Preguntas proporcionales**: no repetir datos ya aportados ni imponer una entrevista de ocho turnos.
- **B7 — Autorización por alcance**: ejecutar el diagnóstico aprobado sin reconfirmar cada paso; consultar ampliaciones materiales.
- **B8 — No tocar archivos del skill existente en AUDIT**: auditar es leer y reportar, no editar. Editar solo si el usuario lo aprueba explícitamente al final del reporte.
- **B9 — Portabilidad**: verificar soporte de metadatos y herramientas por agente; descubrimiento no prueba ejecución.
- **B10 — Operaciones separadas**: editar, instalar, registrar y publicar requieren su propio alcance y resultado verificado.
- **B11 — Lectura progresiva**: externalizar cuando los procedimientos se usen por separado; conservar decisiones, ejemplos y llamadas.
- **B12 — Registro canónico de skills**: cuando el alcance autorice registrar en Notion,
  buscar la fila existente en la base Skills de Herramientas de IA y crearla o sincronizarla en la misma fila.
  Clasificarla con una `Capacidad` existente o crear una solo si falta un ámbito fiel; no usar
  `Skills & Marcos` como destino de skills nuevos.
- **B13 — Estado y compatibilidad verificables**: marcar `Activo` y declarar entornos solo con
  validación y disponibilidad comprobadas. Si Notion no está disponible, cerrar el cambio local
  con el registro señalado como pendiente de sincronización, no como realizado.
- **B14 — Recursos operativos localizables**: si un skill depende de documentación, planes o
  proyectos externos, documentar una ruta de lectura verificable en sus referencias y
  sincronizar el índice `## Recursos operativos` en su página de Notion. No crear una relación
  vacía ni sustituir una fuente ausente por una parecida.

---

## Racionalizaciones comunes

Excusas predecibles para saltarse un paso del protocolo, con su refutación. Si
aparece alguna de estas frases en el propio razonamiento, es la señal de que se
está por violar un bloqueante.

| Racionalización | Realidad |
|---|---|
| "Debo repetir ocho preguntas" | Reutilizar lo conocido y preguntar solo vacíos materiales (B1, B6). |
| "El enlace ya demuestra que el recurso existe" | Comprobar destino y contenido antes del cierre (B3). |
| "Este skill es chico, no necesita GUARD" | Sin guard, el skill ejecuta en el proyecto o contexto equivocado sin que nadie lo note — el tamaño del skill no reduce ese riesgo (C6, C7) |
| "Los campos de un cliente funcionan en todos" | Verificar capacidades y soporte real (B9). |
| "El usuario ya aprobó algo parecido antes, no hace falta mostrarle la arquitectura de este" | Cada skill es distinto. Aprobar sin ver la arquitectura específica es la puerta de entrada a un dump de contexto (B7) |
| "Ya audité esto mentalmente, no hace falta correr el checklist criterio por criterio" | Marcar ✅ por intuición es exactamente lo que el checklist prohíbe — cada criterio exige citar la línea que lo cumple (B4, B8) |
| "Total el usuario me corrige si algo está mal" | Delegar la validación al usuario no es validar — es saltarse la Fase 4 y esperar que alguien más la haga |
| "Menos líneas siempre es mejor" | Mantener la cobertura de reglas y ejemplos (B2, B11). |

---

## Señales de alerta

Observables durante la construcción, no solo al final. Si aparece alguna, detenerse
y corregir antes de seguir.

- Se reduce contenido sin identificar el destino de sus decisiones y ejemplos.
- Se intenta cerrar con referencias necesarias inexistentes.
- Se vuelve a preguntar por información ya aportada.
- Se amplía el alcance sin consultar la nueva decisión.
- Un modo aparece en la tabla de "Detección de modo" pero su archivo de protocolo en `references/` no existe todavía.
- Un bloqueante nuevo describe un principio general ("ser cuidadoso", "tener criterio") en vez de una acción concreta prohibida con consecuencia.
- Se cierra el reporte de validación como "APROBADO" sin haber citado, para cada criterio, la línea o sección que lo cumple.

---

## Formato de respuesta

- Declarar modo en la primera línea (`Modo detectado: CREATE`)
- Preguntas breves solo por vacíos materiales; sin reconfirmaciones rutinarias.
- Arquitectura y plan: siempre en bloque de texto formateado antes de ejecutar
- Sin emojis decorativos. Sin "¡Excelente!", "¡Perfecto!", "¡Gran idea!"
- Idioma: español neutro latinoamericano con tuteo, sin voseo.
- Los bloques de código de los archivos generados van en ```markdown o ```yaml según corresponda
- Cierre: cambios, destino, pruebas y límites; registro/publicación solo si se solicitaron.

---

## Referencias

- `references/skill-anatomy.md` — anatomía completa de un SKILL.md: cada sección con criterio, reglas y anti-patrones
- `references/quality-checklist.md` — 23 criterios organizados en 6 categorías: frontmatter, orquestación, referencias, bloqueantes, formato, racionalización y alerta temprana
- `references/forcing-questions.md` — 8 preguntas con ejemplos de respuestas buenas y malas, y qué decisión de arquitectura habilita cada una
- `references/patterns-catalog.md` — fragmentos reales de skills existentes: variantes de frontmatter, tablas de modos, estructuras de fase, formatos de cierre, estilos de bloqueantes, racionalizaciones y señales de alerta
- `references/protocol-create.md` — protocolo completo del modo CREATE
- `references/protocol-migrate.md` — protocolo completo del modo MIGRATE
- `references/protocol-audit.md` — protocolo completo del modo AUDIT
- `references/protocol-update.md` — protocolo completo del modo UPDATE

## Evaluación y conservación

Antes de distribuir o cambiar flujos, leer [casos de evaluación](references/evaluaciones.md).
Comparar regla, ejemplo y destino entre versiones. Un respaldo no justifica eliminar conocimiento útil.
