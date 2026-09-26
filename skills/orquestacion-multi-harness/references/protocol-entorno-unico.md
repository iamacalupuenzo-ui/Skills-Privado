# Protocolo ENTORNO-ÚNICO

Se activa cuando falta alguno de los tres harnesses en el entorno actual, o cuando el
usuario no pidió explícitamente repartir el trabajo entre agentes. No se despacha nada
vía Orca — el trabajo se hace directo, en el agente actual, o se deriva al skill de
contenido que corresponda.

## Fase 0 — Confirmar por qué se cayó a este modo

Antes de proceder, declarar la razón concreta (no asumir en silencio):
- "Esta máquina no tiene `orca` disponible / no tiene los 3 agentes configurados" (ver
  `orca account list --json`, `orca status --json`), o
- "No pediste explícitamente repartir esto entre agentes."

## Fase 1 — Ejecutar directo

Hacer el trabajo del DAG en la sesión actual, secuencialmente, sin dispatch. Si el DAG
tiene pasos que un skill ya cubre (por ejemplo documentación de componentes, revisión de
código), invocar ese skill en vez de reinventar el procedimiento.

## Fase 2 — Avisar la limitación, no fingir paridad

El cierre debe dejar explícito que esto corrió en un solo agente por falta de entorno
multi-harness, no como decisión de calidad — para que Enzo sepa que en su máquina con
los 3 harnesses el mismo pedido puede repartirse si lo pide.

## Cierre

```text
Resultado: [qué se hizo, en un solo agente]
Razón del modo: [falta de entorno / no se pidió multi-harness]
Archivos: [rutas generadas, ver artifact-locations.md]
Pendiente: [si al pasar a una máquina con multi-harness convendría repetir repartido]
```
