# Dependencias, bloqueos y restricciones

Para trabajo sujeto al [ciclo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/em-orquestador-ux/references/ciclo-retroalimentacion.md), aplicar sus reglas de estados, sección Avance y conservación de horas/fechas por encima de las rutinas generales de esta referencia. Consultar siempre el schema vivo.

## Propósito

Usar este modelo para explicar por qué un ítem puede o no avanzar. No confundir la jerarquía,
el orden visual, una condición limitante y una relación de precedencia.

## Conceptos operativos

| Concepto | Significado | Representación |
|---|---|---|
| Jerarquía | El ítem forma parte del alcance de otro. | `Tarea padre` / `Subtareas`, Proyecto y Entregable. |
| Dependencia | El resultado de un ítem es necesario para iniciar, continuar o cerrar otro. | `Depende de` y su relación inversa `Bloquea a`. |
| Restricción | Condición que limita cómo o cuándo trabajar: política, acceso, capacidad, ventana, presupuesto o ambiente. | Bitácora y propiedad disponible en el schema vivo; no inventar una relación. |
| Bloqueo | Dependencia o restricción que impide un avance necesario. | Estado según matriz siguiente; pendiente, dueño y condición de desbloqueo. |
| Riesgo | Evento futuro incierto que podría producir una restricción o bloqueo. | Registro de riesgo; todavía no marcar la tarea como bloqueada. |

`Depende de` apunta desde el trabajo posterior hacia el predecesor. `Bloquea a` expresa la
misma relación desde el predecesor hacia el trabajo posterior. No son dos decisiones distintas.

## Tipos que deben reconocerse

Clasificar la causa aunque el modelo de Notion no tenga una propiedad específica. Registrar la
clasificación en la evaluación y, si afecta el seguimiento, en `Pendiente o bloqueo`.

- **Precedencia:** el predecesor debe terminar antes de iniciar el siguiente trabajo.
- **Entrada o insumo:** falta un documento, dato, archivo, grabación o configuración utilizable.
- **Aprobación o puerta de control:** una decisión formal habilita implementación, lanzamiento o cierre.
- **Restricción externa:** acceso, política, proveedor, presupuesto, capacidad, ambiente o ventana.
- **Validación de cierre:** el trabajo está ejecutado, pero no puede cerrarse sin prueba, evidencia o aceptación.

No usar `Depende de` para expresar preferencia, afinidad temática, pertenencia al mismo entregable
o una secuencia deseable que no impida avanzar.

## Algoritmo de mapeo

Para cada tarea y subtarea:

1. Identificar la próxima salida verificable y preguntar qué resultado previo es indispensable.
2. Si existe un ítem que produce ese resultado, relacionarlo en `Depende de` y comprobar que el
   predecesor muestre el ítem en `Bloquea a`.
3. Si lo que falta es una condición sin trabajo ejecutable, registrarla como restricción, con
   dueño de resolución, impacto y condición objetiva de desbloqueo. No crear una tarea ficticia.
4. Si existe una acción concreta para remover la restricción, crear o reutilizar esa acción y
   relacionarla como predecesora después de validar su nivel y responsable.
5. Verificar estados, fechas y criterio de cierre en ambos extremos.
6. Recorrer la cadena aguas arriba y aguas abajo para detectar ciclos, dependencias redundantes,
   elementos cancelados, relaciones entre proyectos sin justificación y bloqueos indirectos.
7. Presentar el mapa y los cambios propuestos antes de modificar Notion.

## Mapa obligatorio

Toda evaluación de dependencias debe producir, como mínimo:

| Ítem afectado | Depende de / restricción | Tipo | Estado de la causa | ¿Bloquea ahora? | Dueño | Condición de desbloqueo | Impacto |
|---|---|---|---|---|---|---|---|

Añadir la evidencia y la fecha compromiso cuando existan. Si un dato falta, declararlo; no inferirlo.

## Reglas de integridad

- Prohibir autorreferencias y ciclos directos o indirectos.
- Mantener reciprocidad exacta: `A Depende de B` equivale a `B Bloquea a A`.
- No duplicar dependencias transitivas salvo que representen una puerta de control independiente.
- La relación padre-hijo no crea una dependencia automática entre hermanos ni entre padre e hijo.
- `N° orden` organiza la lectura; no demuestra que un resultado sea indispensable.
- Una tarea cancelada no satisface una dependencia. Definir reemplazo, excepción aprobada o cambio
  de alcance antes de retirar la relación.
- No cerrar una tarea mientras una dependencia de cierre o aceptación continúe pendiente.
- Si queda ejecución pendiente y no puede avanzar, usar `Bloqueada`. Si existe trabajo útil,
  mantener `En progreso` con alcance bloqueado documentado. Si la ejecución terminó y solo
  falta validar el resultado o recibir evidencia de aceptación, mantener `En revisión`.

## Coherencia temporal

- La fecha del sucesor no debe asumir que el predecesor terminará antes de su compromiso confirmado.
- Una fecha vencida del predecesor obliga a revisar la proyección de todos los elementos aguas abajo.
- La antigüedad del bloqueo comienza en la primera evidencia de que impidió avanzar, no en la fecha
  de creación de la tarea.
- Una fecha de lanzamiento no elimina dependencias; una excepción requiere responsable, riesgo,
  impacto y decisión explícita.

## Ejemplos aplicados

### Restricción de acceso por IP

```text
Requerimiento funcional elaborado
→ requerimiento revisado y aprobado
→ solución implementada por Desarrollo
→ funcionamiento validado por Gabriel
```

Cada resultado depende del anterior. La implementación queda bloqueada si falta la aprobación;
la validación depende de una implementación comprobable. La fecha de lanzamiento solo es una
restricción temporal, no reemplaza esas relaciones.

### Materiales para clientes C-Go

```text
Requerimientos consolidados
→ capacitación e insumos disponibles
→ grabaciones de Ilver entregadas
→ material elaborado
→ revisión funcional de Lorena
```

Relacionar únicamente los resultados realmente indispensables. Si una grabación solo afecta una
pieza del material, documentar el alcance del bloqueo y mantener en progreso el trabajo que sí puede avanzar.

### Catálogo de escenarios CL

Las subtareas ejecutadas pueden quedar `Hecho`, pero la tarea principal permanece `En revisión`
mientras falte el Excel de Ricardo y su validación. El archivo es un insumo/evidencia de cierre;
si existe una acción explícita para solicitarlo y obtenerlo, esa acción puede bloquear el cierre.

## Matriz de ejecución y aceptación

| Situación comprobada | Estado | Control necesario |
|---|---|---|
| Trabajo no iniciado, sin bloqueo materializado | Pendiente | Próxima acción y responsable. |
| Ejecución pendiente impedida por una entrada o aprobación | Bloqueada | Causa, dueño, impacto y condición de desbloqueo. |
| Parte impedida, pero hay trabajo útil ejecutándose | En progreso | Alcance bloqueado separado del avance posible. |
| Implementación lista para un ciclo de pruebas aún no iniciado | Listo para pruebas, si existe en el schema | Responsable y criterio de prueba. |
| Ejecución reportada y confirmada; falta validar evidencia o aceptación | En revisión | Evidencia pendiente, solicitante y acción de validación. |
| Criterio de cierre cumplido y evidencia o validación responsable | Hecho | Fuente de cierre y fecha real. |
| Alcance cancelado por decisión autorizada | Cancelada | Conservar historial y revisar sucesores. |

La relación pendiente se conserva aunque el padre esté En revisión; distingue dependencia
de ejecución de dependencia de cierre. La etiqueta no sustituye el diagnóstico.
No marcar subtareas Hecho solo para aumentar un porcentaje: cada una necesita ejecución
confirmada según B6. La aceptación del padre no se deduce de que sus hijas estén Hecho.
La reciprocidad se verifica leyendo ambos extremos; si Notion la mantiene automáticamente,
no escribir dos veces ni reemplazar el conjunto de relaciones existentes.
