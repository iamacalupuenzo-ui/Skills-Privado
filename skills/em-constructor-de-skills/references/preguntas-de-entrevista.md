# Preguntas que cambian decisiones

Consulta esta guía al delimitar un skill o cuando una actualización encuentre vacíos.
Las ocho dimensiones sirven para analizar el problema; no son ocho turnos obligatorios.
Primero extrae las respuestas del pedido, la conversación, los archivos y los ejemplos existentes.
Pregunta solo por información que cambie el alcance, el riesgo o el resultado.
No pidas al usuario datos que puedes verificar mediante una lectura autorizada.

## Q1 — Propósito y resultado

**Pregunta útil:** ¿Qué recibe este skill y qué resultado debe entregar?

**Por qué importa:** distingue una necesidad concreta de un tema demasiado amplio.
**Decisión que habilita:** propósito, frontera de responsabilidad y descripción de activación.

**Respuesta suficiente:**
> Toma un componente existente y produce documentación de sus variantes, propiedades,
> estados y ejemplos, basada en lo que realmente está implementado.

**Respuesta insuficiente:**
> Para trabajar con el sistema de diseño.

**Seguimiento si hace falta:** ¿necesitas construir componentes, documentarlos o evaluar su calidad?
Si el usuario ya mostró un documento de salida, úsalo para precisar el resultado sin repetir la pregunta.
No prometas documentación completa de estados que no se puedan inspeccionar.

## Q2 — Alcance y contexto de operación

**Pregunta útil:** ¿Se usará en un proyecto específico o en distintos proyectos?
¿Qué evidencia permite identificar el proyecto o destino correcto?

**Por qué importa:** evita aplicar convenciones de un entorno a otro.
**Decisión que habilita:** comprobación de identidad, configuración local y precondiciones.

**Caso específico:**
> Solo en el repositorio del sistema de diseño; su manifiesto identifica el paquete
> y su configuración señala la ruta de tokens.

**Caso reutilizable:**
> En proyectos React; primero debe comprobar las dependencias y convenciones reales.

No basta encontrar un archivo llamado package.json para identificar un proyecto particular.
Tampoco exijas una carpeta de Claude para un uso exclusivo de Codex.
Si no se conoce la ruta, intenta resolverla con los datos disponibles; pregunta si hay varios
destinos válidos y elegir uno modificaría el alcance.

## Q3 — Activación y exclusiones

**Pregunta útil:** ¿Qué pedido real debería atender este skill y cuál debería quedar fuera?

**Por qué importa:** define cuándo usarlo y evita invocaciones por palabras demasiado generales.
**Decisión que habilita:** description y ejemplos positivos, negativos y ambiguos de evaluación.

**Ejemplos positivos para un documentador:**
> Documenta las variantes del selector.
> Actualiza el handoff de este componente.

**Ejemplo negativo:**
> Implementa el selector en producción.

Una descripción como “ayuda con diseño” no diferencia documentación, construcción y auditoría.
No impongas un número fijo de frases ni prometas activación por coincidencia literal.
Si el usuario no tiene ejemplos, deriva candidatos de sus peticiones anteriores y comprueba
que representan la intención, sin inventar responsabilidades nuevas.

## Q4 — Variantes del trabajo y modos

**Pregunta útil:** ¿En qué situaciones cambia el proceso, el resultado o la autorización?

**Por qué importa:** separa recorridos diferentes sin fragmentar cada paso en un modo.
**Decisión que habilita:** flujo único o selección entre protocolos.

**Respuesta suficiente:**
> Crear produce documentación nueva; actualizar modifica un documento identificado;
> auditar produce un informe y no cambia el documento.

**Respuesta insuficiente:**
> Hace todo lo relacionado con documentación.

Para resolverla, compara entrada, acciones y salida de cada caso.
Dos títulos distintos con el mismo recorrido normalmente no justifican dos modos.
“Revisa cómo está” no equivale a “corrígelo”; define cómo se resuelve esa diferencia.
La selección del modo nunca concede permisos por sí sola.

## Q5 — Herramientas, datos y permisos

**Pregunta útil:** ¿Qué información y capacidades son imprescindibles para completar el trabajo?

**Por qué importa:** distingue lo deseable de lo necesario y permite una salida segura sin acceso.
**Decisión que habilita:** precondiciones, mecanismo disponible y alcance no verificable.

| Necesidad | Capacidad que se debe comprobar | Si falta |
|---|---|---|
| Leer código o documentos | Lectura del archivo y su contexto | Pedir la fuente concreta; no inventar contenido. |
| Modificar archivos | Edición en la ruta autorizada | Preparar el cambio y explicar el permiso faltante. |
| Ejecutar validaciones | Runtime y dependencias requeridas | Reportar prueba pendiente y alternativa disponible. |
| Consultar Notion o Figma | Conector o acceso autorizado al objeto | Diferenciar falta de herramienta de falta de permisos. |
| Consultar documentación actual | Acceso web y fuentes primarias | Declarar lo que no pudo verificarse. |

Describe capacidades, no namespaces MCP históricos como si fueran universales.
Una lista de herramientas en el archivo no instala conectores ni concede permisos del sistema.
La necesidad de leer un sistema externo no autoriza escribir en él.

## Q6 — Conocimiento que debe conservarse

**Pregunta útil:** ¿Qué decisiones, ejemplos o recursos no conviene redescubrir en cada uso?

**Por qué importa:** recupera experiencia específica, incluidas correcciones del usuario.
**Decisión que habilita:** qué queda en el principal, references, scripts o assets.

**Respuesta suficiente:**
> La estructura de seguimiento aprobada, un ejemplo correcto y uno incorrecto,
> el mapa de relaciones y las reglas para cerrar una actividad.

**Clasificación:**
- Procedimiento común y límite crítico: archivo principal.
- Criterio detallado, caso de excepción o protocolo condicional: referencia.
- Operación determinista repetida: script con contrato y pruebas.
- Plantilla reutilizada para la salida: asset.

No clasifiques inventarios, IDs o esquemas externos como “información que nunca cambia”.
Registra su procedencia, ámbito y cómo comprobar vigencia.
No elimines ejemplos útiles solo porque la regla pueda resumirse en una frase.

## Q7 — Riesgos y límites

**Pregunta útil:** ¿Qué error concreto ha ocurrido o debemos impedir, y cómo se detecta?

**Por qué importa:** convierte experiencia en controles operativos.
**Decisión que habilita:** regla con condición, respuesta y caso negativo de evaluación.

**Respuesta suficiente:**
> Al cancelar una tarea debemos conservarla y cambiar su estado, no borrarla.

**Respuesta insuficiente:**
> Que el agente tenga cuidado.

**Seguimiento:** ¿qué acción sería incorrecta?, ¿cuál es la alternativa permitida?
Distingue prohibición del sistema, política del proyecto y preferencia que el usuario puede cambiar.
No conviertas un incidente aislado en una prohibición universal sin revisar su causa.
Ejemplo: el recorte de un menú por overflow exige analizar su contenedor, no prohibir
esa propiedad en todos los componentes de todos los proyectos.

## Q8 — Fuente, instalación y distribución

**Pregunta útil, solo cuando sea pertinente:** ¿Se requiere editar la fuente, instalarla
en un agente, registrarla en un catálogo o publicarla?

**Por qué importa:** son operaciones diferentes, con destinos y permisos diferentes.
**Decisión que habilita:** alcance de entrega y comprobación específica de cada operación.

**Respuesta suficiente:**
> Actualiza la fuente compartida. Los enlaces existentes ya la utilizan. No publiques.

**Si se solicita un catálogo:** confirma la base y sus propiedades reales.
Proceso y rol pueden servir para clasificar, pero no son obligatorios para construir un skill.
No uses el antiguo catálogo de Notion como requisito universal.
Si el pedido es únicamente editar, no abras una conversación sobre publicación.

## Síntesis de alcance

Usa esta plantilla cuando el trabajo necesite varias decisiones; omite campos irrelevantes.

```text
Skill: [nombre]
Recibe: [entrada]
Entrega: [resultado verificable]
Incluye / excluye: [frontera]
Contexto y precondiciones: [destino, datos, capacidades]
Recorrido o modos: [señal → acción → salida]
Conocimiento que se conserva: [reglas, ejemplos, referencias]
Riesgos y controles: [condición → respuesta]
Pruebas previstas: [caso normal y fallo relevante]
Operaciones autorizadas: [editar / instalar / registrar / publicar]
Vacío material pendiente: [si realmente existe]
```

Con contexto y autorización suficientes, resume y ejecuta.
Si queda una decisión material, explica su efecto y pregunta solo por ella.
