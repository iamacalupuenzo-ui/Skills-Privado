# Anatomía adaptable de un skill

Lee esta referencia al crear o refactorizar la estructura.
No es una plantilla de doce secciones obligatorias: cada pieza se incluye por su utilidad.
El principal orienta; las referencias conservan el detalle que corresponde a recorridos concretos.
Una mejora de estructura debe poder explicar dónde quedó el conocimiento anterior.

## 1. Frontmatter: descubrimiento y contrato

Ejemplo del subconjunto utilizado para una fuente compartida:

```yaml
---
name: documentar-componentes
description: Documenta componentes existentes a partir de su implementación. Úsalo para actualizar variantes, propiedades y ejemplos de handoff; no implementa componentes ni publica cambios.
metadata:
  version: "1.0.0"
---
```

Comprueba que name coincida con el directorio y que description explique capacidad y momento de uso.
La descripción necesita distinguirse de skills vecinos — no basta una lista de frases entre
comillas sin delimitar el resultado. “Gestiona cosas del proyecto” no permite saber qué
recorrido corresponde, aunque venga con comillas. “Revisa dependencias y propone correcciones
sin modificar registros” sí delimita el resultado.

Verificado el 2026-09-26 contra el estándar abierto Agent Skills
(github.com/anthropics/skills, agentskills.io — adoptado por Claude, Codex y 26+ plataformas
más): el estilo oficial sí recomienda tercera persona con frases de disparo concretas entre
comillas — “Debe usarse cuando el usuario pida ‘X’, ‘Y’, ‘Z’”. Esto no contradice la regla de
arriba: la técnica correcta combina ambas — delimitar el resultado observable Y anclarlo con
2-4 frases de activación reales (tomadas de pedidos que el usuario ya hizo o haría, no
inventadas para llenar una cuota). Ejemplo que cumple las dos cosas a la vez:

> Documenta las variantes, propiedades y estados de un componente ya implementado, a partir
> de su código real. Debe usarse cuando el usuario pida “documenta este componente”, “actualiza
> el handoff” o “qué le falta de specs a X”; no implementa el componente ni publica cambios.

La regla sigue siendo “no una cuota vacía de comillas sin resultado delimitado” — nunca
“nunca usar comillas”.

Mantén los campos opcionales solo si existe una necesidad y el consumidor los admite.
La especificación y un validador de un cliente pueden diferir: anota cuál comprobaste.
Por ejemplo, el validador local de Codex inspeccionado el 2026-09-03 no admitía
compatibility entre sus claves superiores, aunque existe en la especificación.
Eso es una limitación de ese validador, no una prohibición universal del estándar.

No agregues automáticamente shell, effort, argument-hint o controles de invocación a la
fuente compartida. Verifica soporte específico antes de introducir una extensión.
metadata.version sirve para identificar una versión; no configura el modelo ni la sesión.
allowed-tools tampoco instala herramientas ni sustituye la autorización del usuario.

## 2. Propósito y perspectiva

Describe qué decisión o trabajo aporta el skill y cuál es el resultado observable.

**Útil:**
> Evalúa la coherencia entre implementación y documentación; separa diferencias
> comprobadas de elementos que no pudieron inspeccionarse.

**Insuficiente:**
> Actúa como el mejor experto del mundo.

Un rol puede orientar prioridades, pero no reemplaza criterios, fuentes y pruebas.
No exige primera persona ni una identidad grandilocuente.
Conserva el lenguaje del dominio cuando ayude a decidir y explica el tecnicismo si dificulta actuar.

## 3. Alcance positivo y negativo

Incluye límites explícitos cuando existan responsabilidades cercanas que se puedan confundir.

| Puede hacer | No se deduce de ello |
|---|---|
| Auditar documentos | Reescribirlos sin autorización. |
| Ajustar un skill | Publicarlo, instalar conectores o modificar el sistema descrito. |
| Proponer una secuencia | Cambiar fechas comprometidas sin respaldo. |

Si se deriva a otro skill, comprueba que esté disponible y que el usuario quiera esa acción.
No uses dependencias nominales inexistentes para bloquear una tarea realizable.
Un skill de propósito único puede resolver el alcance en una frase.

## 4. Mapa de recursos

| Recurso | Qué contiene | Criterio para incluirlo |
|---|---|---|
| SKILL.md | Propósito, selección, límites y rutas de lectura | Siempre. |
| references/ | Protocolos, esquemas, criterios y ejemplos | Detalle que cambia decisiones concretas. |
| scripts/ | Operación repetible con entrada y salida definidas | Más fiabilidad que reinterpretar instrucciones. |
| assets/ | Plantilla o material reutilizado en la salida | Tiene un consumidor identificado. |
| agents/ | Configuración específica del agente | Necesidad real y formato verificado. |

Ejemplo de ruta de lectura:
> Para actualizar un documento existente, lee references/protocol-update.md antes de editar.

El ejemplo es ilustrativo: cada ruta del paquete real debe existir.

**Candidato a script, no lo dejes en prosa.** Si durante la entrevista o la escritura del
SKILL.md aparece una secuencia mecánica que se repetiría igual en cada invocación —resolver
un ejecutable, parsear un JSON de estado, calcular un umbral, verificar una condición
booleana— es señal de extraerla a `scripts/` con contrato de entrada/salida y un caso
negativo probado, en vez de volver a redactarla como instrucción en prosa cada vez. Ver
`references/patterns-catalog.md`, Patrón 19, para un ejemplo real con las dos pruebas
(caso normal y caso de fallo) ya verificadas.
No basta enumerar “patrones”: explica cuándo consultarlos.
Evita encadenamientos profundos. El principal debe permitir localizar los recursos relevantes.
Para una referencia extensa agrega un índice útil, no otro resumen que reemplace sus ejemplos.

## 5. Precondiciones y salida ante fallos

Comprueba lo que podría invalidar el trabajo: identidad, acceso, datos y capacidades.
No impongas un número arbitrario de archivos ni una carpeta de otra plataforma.

**Ejemplo de identidad de proyecto:**
1. Lee el manifiesto del repositorio indicado.
2. Contrasta su identificador con el proyecto solicitado.
3. Si coincide, localiza los recursos que requiere la operación.
4. Si no coincide, no escribas; informa qué proyecto encontraste.

**Ejemplo de capacidad:**
> Si el documento no puede leerse, entrega el alcance pendiente y solicita la fuente.
> No completes la auditoría usando un documento distinto de nombre parecido.

Una comprobación sin respuesta al fallo produce falsa seguridad.
No interpretes un fallo de permisos como demostración de que un archivo no existe.

## 6. Selección de flujo

Agrega modos si cambian las acciones, permisos o artefactos.

| Señal | Recorrido | Salida |
|---|---|---|
| “Revisa y dime qué falla” | Auditoría | Hallazgos, sin modificar el objeto. |
| “Corrige el diagnóstico aprobado” | Actualización | Cambio y verificación. |
| “Convierte este instructivo en un skill” | Migración | Mapa de equivalencia y paquete. |

Si el pedido mezcla revisión y corrección explícitas, ambas pueden estar autorizadas.
Si solo pide diagnóstico, no avances a editar por conveniencia.
Anuncia el recorrido cuando ayude a entender el alcance; no repitas una cabecera ritual.
No inventes modos para diferenciar pasos que siempre ocurren juntos.

## 7. Protocolos con decisiones completas

Cada fase relevante define:
- Entrada: información necesaria para empezar.
- Acción: operación concreta y destino.
- Verificación: evidencia para saber qué ocurrió.
- Salida: cuándo continuar, cambiar de ruta o detener el paso.

**Ejemplo para una actualización:**
> Lee el contenido y su versión actual. Calcula la diferencia autorizada.
> Modifica solo esa diferencia. Relee el resultado y compara con lo esperado.
> Si la respuesta fue incierta, inspecciona antes de repetir.

Separa procedimientos largos cuando no se usan siempre juntos.
Mantén en el principal el límite que nunca debe perderse.
No fragmentes por alcanzar una cantidad fija de líneas.
Una pausa responde a un riesgo o decisión nueva, no al final de cada fase por costumbre.

## 8. Reglas comprobables

Una regla útil tiene condición, acción y motivo o consecuencia.

**Vaga:** “Evita problemas de información”.
**Operativa:** “Si una fuente está incompleta, identifica la parte no verificada;
no conviertas la ausencia de datos en un resultado de cero”.

Numera reglas cuando otras secciones necesiten referenciarlas.
No existe un mínimo universal de bloqueantes.
Ordena primero los riesgos de mayor impacto y evita reglas opuestas en distintos archivos.
Cuando una excepción sea legítima, intégrala en la definición original y en sus ejemplos.

## 9. Atajos previsibles

Esta sección es opcional. Úsala para errores recurrentes observados, no para rellenar.

| Atajo | Corrección operativa |
|---|---|
| “Reducir líneas siempre mejora el skill” | Compara cobertura: una regla breve no reemplaza todos sus casos. |
| “Hay respaldo, puedo retirar el original” | El respaldo permite recuperar; no concede autorización de borrado. |
| “La herramienta respondió sin error” | Relee el estado que debía cambiar antes de declarar éxito. |
| “Ya se auditó, no necesito probar el cambio” | La auditoría describe el antes; la verificación comprueba el después. |

La tabla recuerda controles existentes. No crea otra definición normativa contradictoria.

## 10. Alertas observables

Incluye señales que puedan detectarse mientras se trabaja:
- Una reducción extensa sin mapa de conservación.
- Un ejemplo que ordena algo prohibido por la regla vigente.
- Un archivo al que ya no llega ninguna ruta de lectura.
- Un destino externo que no estaba incluido en el pedido.
- Un resultado parcial presentado como validación de todo el sistema.

Ante la señal, detén el paso riesgoso, revisa la causa y corrige el alcance.
No interrumpas trabajo independiente que siga siendo seguro y autorizado.

## 11. Contrato de salida

Define la información necesaria para usar el resultado, no decoración obligatoria.

```text
Resultado: [qué quedó hecho]
Fuente o destino: [ruta u objeto verificado]
Cambios relevantes: [qué se modificó y qué se conservó]
Validación: [prueba realmente ejecutada y resultado]
Pendiente: [límite concreto, si existe]
```

Para un diagnóstico, reemplaza “cambios” por hallazgos y propuestas.
Una respuesta breve puede cubrir estos campos sin encabezados.
Mantén español neutro latinoamericano con tuteo y evita informes llenos de términos vacíos.
No expongas secretos ni vuelques todos los datos inspeccionados en el cierre.

## 12. Mantenibilidad y cobertura

Cada archivo debe tener un propósito y un camino de lectura.
Cada criterio crítico debe tener una definición canónica y al menos una forma de comprobarlo.
No dupliques un índice al principio y al final por obligación.
Separa datos del entorno de reglas reutilizables; incluye procedencia y vigencia cuando corresponda.

### Antipatrones y corrección

| Antipatrón | Problema | Ajuste |
|---|---|---|
| Volcar todo en el principal | Obliga a cargar recorridos que no corresponden | Referencias con instrucciones de lectura. |
| Resumir también todas las referencias | Pierde ejemplos y decisiones | Conservar el detalle útil en su recurso. |
| Exigir ocho respuestas siempre | Repite información conocida | Resolver solo vacíos materiales. |
| Aprobar por encabezados o cantidad de reglas | No demuestra comportamiento | Evidencia y casos representativos. |
| Usar rutas personales como contrato global | Falla en otra laptop | Configuración local separada. |
| Retirar archivos porque parecen largos | Puede romper consumidores | Revisar llamadas y mapa de conservación. |
| Agregar código de ejemplo no ejecutable como solución | Simula una capacidad inexistente | Distinguir plantilla de implementación y probar esta última. |
