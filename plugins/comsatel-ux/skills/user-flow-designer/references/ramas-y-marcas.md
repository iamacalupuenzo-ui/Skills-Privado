# Ramas y marcas

## Índice

1. Las marcas
2. Pasos y caminos
3. Ramas y excepciones
4. Qué ramas no pueden faltar

## 1. Las marcas

Cada paso y cada rama lleva una, en la columna «Fuente» o al final del tratamiento.

| Marca | Cuándo |
|---|---|
| Cita (`AC-4; BR-258`) | Lo dice la historia, una regla o una decisión |
| `[Reutiliza] FLW-NNN P4` | Es igual a un paso o rama de otro flujo; se cita en vez de copiarlo |
| `[Construido]` | Se observó en lo construido (US, repo); no está aprobado |
| `[Inferencia]` | Se deduce de una fuente; si toca negocio, abre pregunta en el UXR |
| `[PENDIENTE: UXR-NNN-Qn]` | Depende de una pregunta abierta; el flujo no la resuelve (B4) |

La leyenda va al inicio del flujo, en una cita (`>`), con las marcas que el flujo usa.

## 2. Pasos y caminos

- Camino feliz: P1, P2… Un paso es una acción del actor o una respuesta del sistema, no una pantalla.
- Caminos alternos completos (retirar, renovar, exportar): subsección `###` con su prefijo (R1…,
  E1…) y la condición de entrada en el primer paso.
- El resultado de cada paso dice el estado en que queda el usuario («Cargando», «Elementos sin
  guardar»), no lo que ve en detalle.

## 3. Ramas y excepciones

- ID con prefijo por tipo y correlativo: `C-` condición del dominio, `X-` error técnico o de
  validación, `P-` permiso. El ID no cambia aunque la rama se reescriba (B9).
- Tratamiento: qué hace el sistema y en qué pantalla termina («SCR-094 sin permiso; no se muestra
  el editor»).
- Ramas de un flujo base que aplican igual: subsección «Reutilizadas de FLW-NNN» con
  `Rama de origen · Qué cubre · Diferencia en este flujo`. Si no hay diferencia, se dice «Igual».

## 4. Qué ramas no pueden faltar

Revisar cada una; si no aplica, decirlo en una línea.

| Rama | Pregunta que responde |
|---|---|
| Sin permiso o de otro inquilino | ¿Qué pasa si entra quien no debe? |
| Función no habilitada | ¿Y si la empresa no la tiene contratada o activa? |
| Datos vacíos | ¿Qué ve la primera vez? |
| Error al guardar o al cargar | ¿Se conserva lo escrito? ¿Se puede reintentar? |
| Doble envío | ¿Qué evita que se guarde dos veces? |
| Salir con cambios sin guardar | ¿Se avisa? |
| Cambio concurrente | ¿Y si otro cambió lo mismo mientras tanto? |
| Sesión vencida o permiso perdido a mitad | ¿Qué se conserva? |
