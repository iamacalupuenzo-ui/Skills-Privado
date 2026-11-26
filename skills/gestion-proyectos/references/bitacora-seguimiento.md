# Contenido de las páginas de tareas

Para trabajo sujeto al [ciclo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/ux-ui-orchestrator/references/ciclo-retroalimentacion.md), aplicar sus reglas de estados, sección Avance y conservación de horas/fechas por encima de las rutinas generales de esta referencia. Consultar siempre el schema vivo.

## Principio

El cuerpo de cada página de la base **Tareas** cuenta la tarea como un relato: por qué existe,
qué se hace, qué entrega, cuándo termina y dónde está su resultado. Las propiedades y relaciones
son la fuente de verdad para estado, fechas, esfuerzo, proyecto y dependencias. No agregar una
bitácora, seguimiento ni comunicaciones al cuerpo de la tarea.

Usar la misma estructura en tareas y subtareas, sin importar si son de análisis,
configuración, ejecución, validación o comunicación. La plantilla `Nueva tarea` de Notion ya
la trae (aprobada por Enzo el 2026-09-24).

## Estructura obligatoria (encabezado 2; subsecciones con encabezado 3)

```markdown
> **Antes de leer:** [pregunta que el relato responde]

## Recursos            ← solo si la tarea tiene subpáginas o documentos de apoyo

## En 30 segundos
[Qué se hace y para qué, en dos líneas. La segunda dice su papel en el proyecto.]

## El relato
**El problema.** [Por qué existe la tarea: qué pasa si no se hace.]
**Qué se hace.** [El trabajo, contado desde lo que se decide o se construye. El rótulo puede
cambiar: "La decisión.", "El criterio de selección.", etc.]
**Qué entrega.** [Los resultados concretos.]
**Dónde encaja.** [De qué depende (Bloqueada por) y qué habilita (Bloquea a).]
**Lo que todavía no está decidido.** [Solo si aplica.]
**Origen.** [Solo si la tarea viene de otra herramienta: quién la pidió y el enlace.]

## Termina cuando
- [Condición verificable, en lenguaje llano; viñetas simples, no casillas.]

## Resultado
El resumen va aquí; la versión completa, en su enlace.
### 1. [Entregable]
[Resumen corto. Si es pequeño (un diagrama, una decisión, una tabla chica), va completo aquí.]
**Enlace:** [URL de la versión completa, o *Pendiente.*]
**Entregado:** [fecha real de cierre, o *Pendiente.*]

## Comprueba
[Una pregunta que se responda con el relato.]
```

## Reglas

- El relato va en 4 a 6 bloques cortos con rótulo en negrita. Sin tablas en el relato.
- `Termina cuando` reemplaza a los criterios DADO/CUANDO/ENTONCES: ese formato vive solo en los
  casos de uso de Gestión de producto. No usar "terminado", "revisado" o "documentado" como
  condición sin algo observable.
- `Resultado` es la evidencia del cierre. Una sola fuente por dato: lo grande se enlaza, no se
  copia. Si hay varios entregables, un encabezado 3 por cada uno.
- La propiedad `Resultado` pasa a `Listo` solo cuando la sección Resultado tiene el entregable
  o su enlace. La fórmula `Alerta de cierre` marca "Cerrada sin resultado" cuando la tarea está
  `Completada` y el Resultado no está `Listo`. Nunca marcar `Listo` sin ver la evidencia.
- Lo que la fuente no dice queda como *Pendiente.* No se inventan herramientas, cifras,
  personas ni enlaces.
- Ícono de tarea: `icons/checkmark_blue`.
