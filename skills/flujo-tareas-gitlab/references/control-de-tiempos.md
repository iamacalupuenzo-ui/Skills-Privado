# Control de tiempos por día

Objetivo: que el tiempo de cada issue refleje **cuánto se trabajó cada día**, para llevar el control del esfuerzo real. Verificado contra GitLab 14.2.1 el 4 de noviembre de 2026.

## Regla

- Un registro de tiempo (`/spend`) **por día trabajado**, con la fecha de ese día. Nunca se junta varios días en una sola nota.
- Las horas de cada día las dice el usuario (B3). El skill no las inventa ni las calcula.
- **La fecha es la de ejecución real, no la del cronograma.** Cargar el tiempo con la fecha programada («según el cronograma») hace que GitLab muestre la tarea como ejecutada un día en que quizá no se trabajó. Si el usuario no da la fecha real, se pregunta; nunca se toma la fecha de inicio o de fin planificada.
- Cada vez que el usuario informa las horas de un día, se imputa **solo la diferencia** con lo que ya está registrado esa fecha. Así repetir la orden no duplica horas.
- La estimación (`/estimate`) es la planificada; lo imputado es lo real. Se muestran juntas.

## Procedimiento

1. **Leer lo ya imputado por día** con GraphQL. La API REST de 14.2 no lo da por fecha. Las notas del sistema solo muestran la fecha cuando es distinta del día en que se escribió la nota («added 4h of time spent at 2026-10-28»), así que no sirven para sumar por día:

   ```json
   { "query": "{ project(fullPath: \"comsatel/development/products/clocator2/cl2-flota/collaboration\") { issue(iid: \"56\") { timelogs { nodes { spentAt timeSpent user { username } } } } } }" }
   ```

   `POST https://project.comsatel.com.pe/api/graphql`. `timeSpent` viene en segundos. Sumar por `spentAt` y por usuario.
2. **Calcular** para la fecha indicada: `horas indicadas − horas ya imputadas ese día = a imputar`.
3. **Mostrar la tabla** antes de escribir y esperar confirmación (B1):

   | Fecha | Ya imputado | Indicado | A imputar | Acumulado | Estimado |
   |---|---|---|---|---|---|
   | 2026-11-03 | 5 h | 8 h | +3 h | 8 h | 6 h |

4. **Escribir** una nota con `/spend <diferencia> <fecha>` (`api-issues.md`). Si la diferencia es negativa (el usuario corrige a menos), `/spend -1h <fecha>` resta.
5. **Releer** el issue y confirmar que el acumulado quedó como la tabla dijo.

## Ejemplo

La tarea se trabajó el 3-nov con 8 horas y GitLab ya tenía 5 horas ese día:

- Diferencia: 8 − 5 = 3 horas.
- Se envía `/spend 3h 2026-11-03`.
- El día queda en 8 horas. Un segundo día de trabajo es otra línea con su propia fecha.

## Corregir un registro con fecha equivocada

GitLab 14.2 no permite editar un registro de tiempo. Se corrige con la acción rápida `/remove_time_spent` (deja a cero el acumulado del issue y queda un asiento negativo en el historial) y después un `/spend` por cada día real. Es visible para el equipo: se muestra la tabla de lo que se borra y lo que se carga, y se espera confirmación.

## Avisos

- **Se pasó de lo estimado:** si el acumulado supera el estimado, se avisa y se pregunta si se reestima. No se cambia `/estimate` solo.
- **Más de 8 horas en un día:** si la suma de la persona en todos los issues ese día pasa de 8 horas, se avisa antes de imputar.
- **Fecha futura:** no se imputa tiempo a una fecha que aún no llegó.
- **Issue de otra persona:** el tiempo se imputa con el usuario del token. No se imputa en issues ajenos sin que el usuario lo pida.

## Qué no va a GitLab

Las horas con IA y las horas humanas estimadas viven solo en Notion (B3). Aquí van únicamente las horas reales de trabajo que el usuario indica.
