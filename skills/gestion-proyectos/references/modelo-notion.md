# Modelo operativo actual de Notion

Para trabajo sujeto al [ciclo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/em-orquestador-ux/references/ciclo-retroalimentacion.md), aplicar sus reglas de estados, sección Avance y conservación de horas/fechas por encima de las rutinas generales de esta referencia. Consultar siempre el schema vivo.

## Fuente de verdad

Antes de usar IDs, opciones o propiedades, consultar el schema vivo mediante Notion. Este
documento recoge el modelo observado el 2026-08-30 y sirve para orientar la evaluación.

## Jerarquía objetivo

```text
Proyecto
└─ Entregable
   └─ Tarea
      └─ Subtarea
```

- **Proyecto:** objetivo, alcance, owner, stakeholders, fase y fecha de lanzamiento.
- **Entregable:** resultado verificable que aporta valor al proyecto. Tiene criterio de
  aceptación, estado, responsable, fase, fechas, prioridad y tareas relacionadas.
- **Tarea:** unidad de trabajo que contribuye directamente a un entregable. Define qué
  se hará, por qué, responsable, fecha, criterio de cierre, dependencia y evidencia.
- **Subtarea:** acción concreta y verificable necesaria para completar una tarea. Se
  relaciona por `Tarea padre` / `Subtareas`.

## Bases observadas

| Entidad | Fuente de datos | Relaciones relevantes |
|---|---|---|
| Projects | `collection://36aa01dc-169a-8248-82a1-07b97c2d2dd7` | Tareas, Entregables, Épicas, referencias y stakeholders. |
| Tareas | `collection://3bda01dc-169a-8345-a9a0-8727a8f95122` | Proyecto, Entregable, Tarea padre/Subtareas, Depende de/Bloquea a y evidencias. |
| Entregables operativo | `collection://c26a01dc-169a-82c0-9ddf-873f7e06f4ce` | Proyecto y Tareas; incluye criterio de aceptación, fase, orden y fechas. |

### Campos de control en Tareas

`Estado`, `Prioridad`, `Fase de lanzamiento`, `Proceso operativo`, `Tipo de trabajo`,
`N° orden`, `Depende de`, `Bloquea a`, `Criterio de cierre`, `Descripción`, `Ejecutor`,
`Responsable`, `Fecha compromiso`, `Fecha real`, `Completada`, `Comunicación`,
`Actas y evidencias`.

### Control de comunicación

Toda tarea y subtarea debe tener un valor en `Comunicación`; no dejar el campo vacío.

| Estado | Cuándo usarlo |
|---|---|
| `Pendiente de comunicación` | Falta una solicitud, convocatoria, coordinación, notificación o respuesta necesaria para avanzar o cerrar. |
| `Comunicación realizada` | Hay evidencia registrada de que la comunicación correspondiente se realizó, por ejemplo, un correo enviado, una convocatoria cursada o una reunión efectuada. |
| `No requiere comunicación` | El ítem no necesita comunicación adicional; registrar la razón cuando no sea evidente. |

El estado controla únicamente la gestión de la comunicación. No prueba que el resultado de la
tarea haya sido ejecutado, aceptado o validado. Cada cambio a `Comunicación realizada` debe
tener una evidencia fechada en la bitácora o en `Actas y evidencias`.

## Condición de modelo a validar

Hay otra base llamada `Entregables` (`collection://9faa2d40-9b47-46ee-8fba-de5ee2e4616d`)
relacionada desde Projects, mientras que Tareas se relaciona con la base operativa
`c26a...`. Esto puede responder a una separación intencional o a una evolución del modelo.
Nunca asumir una falla ni elegir una como canónica: evaluar propósito, contenido, cobertura y
uso de ambas antes de proponer cambios.

## Estados observados

- Proyecto: `Discovery`, `Definition`, `Design`, `Development`, `QA`, `Pre-lanzamiento`,
  `Lanzado`, `Post-lanzamiento`, `Cerrado`, `Archivado`.
- Entregable: `Pendiente`, `En progreso`, `Entregado`, `Bloqueado`.
- Tarea: `Pendiente`, `En progreso`, `En revisión`, `Listo para pruebas`, `Bloqueada`,
  `Hecho`, `Cancelada`.

Los campos `Completada` y `Estado` deben ser coherentes. Una discrepancia es una alerta
de calidad; no se corrige sin revisar evidencia y criterio de cierre.

---

## Ambiente Minimalist Project Manager

**Hub:** `https://app.notion.com/p/e131a7d063888252b243010144934d8c`

Este ambiente es la base simplificada para la gestión personal de proyectos, tareas y
productividad. Antes de crear o modificar registros, consultar el schema vivo. No asumir que
las bases anteriores son el destino de este ambiente.

### Modelo vigente

```text
Proyecto ↔ Tareas
    ├─ Notas
    ├─ Recursos
    └─ Reuniones

Tarea ──Bloqueada por / Bloquea a── Tarea
```

**Puente con Gestión de producto (desde 2026-09-24).** Todos los proyectos y tareas, de
Comsatel o personales, viven aquí; `Ámbito` (`Comsatel` / `Personal`) los separa. Gestión de
producto guarda solo el qué: Épicas → Historias de usuario → Casos de uso. Las relaciones:

| Desde | Propiedad | Hacia |
|---|---|---|
| Épica | `Proyecto` ↔ `Épicas` | Project |
| Historia de usuario | `Tareas` ↔ `Historia` | Tasks Manager |
| Caso de uso | `Tareas` ↔ `Caso de uso` | Tasks Manager |

No crear proyectos ni tareas dentro de Gestión de producto.

| Entidad | Fuente de datos | Propósito |
|---|---|---|
| Project | `collection://b2d1a7d0-6388-8272-9051-877b11c20d9d` | Resultado de trabajo con fechas, prioridad, salud y tareas relacionadas. |
| Tasks Manager | `collection://87a1a7d0-6388-82a0-82c0-8709ea959111` | Unidad de trabajo con fecha, avance, esfuerzo, cierre y dependencias. |
| Notes | `collection://05f1a7d0-6388-822d-92e3-078941a7fb1b` | Contexto, decisiones y notas vinculables a proyecto o reunión. |
| Meeting | `collection://cab1a7d0-6388-83ae-9c00-07e25aae11de` | Reuniones con fecha, cliente y notas. |

### Campos operativos mínimos

**Proyecto** (base `Proyectos`, propiedades en español desde 2026-09-24): `Nombre`, `Estado`,
`Prioridad`, `Ámbito`, `Inicio`, `Fin objetivo`, `Objetivo`, `Criterio de cierre`,
`Avance`, `Salud`, `Fecha real de cierre`, `Tareas`, `Épicas`, `Notas` y `Recursos`.
`Avance` es un rollup (porcentaje de tareas en el grupo completado): nunca se escribe a mano.
Las dependencias viven entre tareas, no entre proyectos. Ícono de proyecto:
`icons/briefcase_blue`.

**Página de proyecto** (plantilla `Nuevo proyecto`), con encabezado 2: `Qué se logra`
(objetivo y "Termina cuando" con el criterio de cierre), `Alcance` (incluye, no incluye,
límite), `Épicas` (vista filtrada, solo si el proyecto construye producto), `Tareas` (vista
filtrada agrupada por estado) y `Riesgos y decisiones`. Lo que no se sabe queda como
*Pendiente*.

**Tarea** (base `Tareas`, ex Tasks Manager; depurada el 2026-09-24): `Nombre`, `Estado`,
`Prioridad`, `Inicio`, `Fecha límite` (obligatoria), `Proyecto`, `Ámbito` (rollup desde Proyecto), `Historia`,
`Caso de uso`, `Horas estimadas`, `Horas reales`, `Criterio de cierre`, `Fecha real de cierre`,
`Resultado` (`Pendiente` / `Listo`), `Alerta de cierre` (fórmula: "Cerrada sin resultado"),
`Issue`, `Solicitado por`, `Bloqueada por` y `Bloquea a`. `Progreso (%)` se eliminó: el
avance lo da `Estado`. Título: verbo en infinitivo + resultado, sin prefijo de proyecto.
Ícono: `icons/checkmark_blue`. El cuerpo sigue el relato de `bitacora-seguimiento.md`
(plantilla `Nueva tarea`).

### Reglas de uso

- Un proyecto representa un resultado, no una lista de actividades. Debe tener objetivo y
  criterio de cierre antes de pasar a ejecución.
- La tarea contiene esfuerzo y progreso; el agente calcula cumplimiento de plazo comparando
  `Fecha límite` con `Fecha real de cierre` al completar, y marca alerta si la fecha vence sin
  cierre. No inferir horas reales ni porcentajes.
- `Bloqueada por` y `Bloquea a` son una relación bidireccional entre tareas. Registrar ambas
  direcciones por la relación; no simular una dependencia solo con una prioridad o fecha.
- `Salud` describe la condición del proyecto (`En curso`, `En riesgo`, `Bloqueado`, `En pausa`)
  y no sustituye su `Status` de ciclo de vida.
- No rellenar los registros de plantilla como si fueran trabajo real. Primero levantar los
  proyectos y tareas actuales del usuario mediante entrevista o evidencia verificable.

### Visibilidad compartida en ClickUp

ClickUp es una fuente secundaria de visibilidad para el equipo y líderes; no sustituye el
control interno de este ambiente de Notion. El alcance por defecto del agente es solo el usuario
**Enzo Francisco Macalupu Herrera** (`101231538`, `enzo.macalupu@comsatelglobal.com`) en la
ruta `Espacio del equipo [ES-LA]` (`90175693448`) → `Diseño UX/UI` (`90179266596`) →
`Tareas del equipo` (`901714403439`). La consulta de Marketing no devolvió tareas de Enzo;
no usar Marketing como alcance. Excluir tareas no asignadas, asignadas a terceros o ubicadas en
otras áreas, excepto ante una solicitud explícita de coordinación o revisión de dependencias.

Antes de escribir en ClickUp, definir y aprobar el mapeo entre campos, dirección de
sincronización y fuente que prevalece por cada dato. No propagar automáticamente avances,
horas, prioridades o cierres de Notion a ClickUp ni en sentido inverso.
