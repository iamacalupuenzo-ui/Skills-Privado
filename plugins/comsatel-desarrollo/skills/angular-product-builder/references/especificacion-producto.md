# Especificación de producto: leerla y pedir ajustes

Cuando el proyecto tiene su especificación en Gestión de producto (Notion), esa es la
fuente de lo que se construye. Este skill la **lee**; nunca la edita. El dueño de
épicas, historias y casos de uso es `epica-a-plan-desarrollo`.

## Encontrar la especificación

1. Preguntar o identificar qué épica, historia o caso de uso se va a construir. Si el
   usuario dio un nombre (por ejemplo, "CU-3764-01" o "el registro de órdenes"),
   buscarlo en Gestión de producto con el conector de Notion.
2. Si el conector no está disponible, pedir un export o el texto del caso. No
   construir un flujo especificado de memoria.
3. Si no existe especificación, el flujo se planifica en PLANIFICAR como hasta ahora,
   y se ofrece registrarlo con `epica-a-plan-desarrollo`.

## Qué leer y para qué

| Fuente | Qué sacar de ella | Para qué sirve al construir |
|---|---|---|
| Épica | Qué se construye y alcance | No construir fuera del alcance |
| Historia y su ficha técnica | Reglas R-xx, estados, dependencias y decisiones pendientes | Reglas de validación y lo que todavía no se puede construir |
| Caso de uso | Diagrama, flujo principal, alternos, errores, estados de pantalla, campos, mensajes y criterios | Es la especificación de la pantalla o el flujo |

Leer siempre el caso completo y la ficha de su historia; si el flujo toca otros
casos de la misma historia (por ejemplo, documentos o estados), leerlos también.

## Cómo traducir el caso a construcción

- **Flujo principal, alternos y errores:** cada uno es un camino que la interfaz debe
  soportar. Ninguno se omite por ser poco frecuente.
- **Estados de pantalla:** cada fila es un estado de UI que se construye y se verifica
  (carga, vacío, parcial, error, éxito, deshabilitado).
- **Campos y validaciones:** reglas del formulario; los mensajes se usan con el texto
  exacto del caso.
- **Criterios de aceptación:** son las pruebas de cierre. Cada CA se verifica en el
  navegador o con una prueba antes de declarar la pieza terminada.
- **Pendiente:** es una decisión sin tomar. No se inventa: se pregunta al usuario o
  se construye lo demás y esa parte queda marcada como pendiente en el cierre.
- **Propuesta:** es una recomendación de UX; se puede adoptar sin pedir permiso.

## Cuando el flujo cambia durante el desarrollo

Si el usuario pide que algo funcione distinto a lo especificado, o al construir se
descubre que el caso no se puede cumplir tal como está escrito:

1. Pausar solo esa pieza. Lo que no depende del cambio puede continuar.
2. No editar Notion ni construir la versión nueva todavía.
3. Derivar a `epica-a-plan-desarrollo` (modo AJUSTAR) esta solicitud:

```text
Solicitud de ajuste de producto
Caso afectado: [CU-… o "nuevo flujo"]
Historia / épica: [US… / EP-…]
Qué cambia: [comportamiento actual → comportamiento pedido]
Por qué: [motivo]
Quién lo pidió y cuándo: [persona, fecha]
Impacto en desarrollo: [qué está construido, qué se pausó]
Evidencia: [mensaje, captura o decisión]
```

4. Cuando llegue el "Ajuste aplicado", releer el caso actualizado y construir contra
   él. Sus criterios vigentes reemplazan a los anteriores.

Construir primero y actualizar la especificación después deja historias y casos que
ya no describen el producto real, y el siguiente equipo construye sobre algo falso.
