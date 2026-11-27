---
name: accessibility-reviewer
description: Evalúa WCAG 2.2 AA sobre el prototipo en código mientras se construye (micro UI, shell y Design System), crea y actualiza el ARP por SCR y bloquea Validado cuando falta evidencia sobre lo implementado. También puede revisar una especificación o Figma como diagnóstico preliminar, sin que eso sustituya la evaluación de la implementación.
metadata:
  version: "1.0.0"
---

# accessibility-reviewer

## Propósito y entradas

Crea y actualiza el informe de accesibilidad **durante la construcción** del prototipo en código, sobre micro UI, shell y componentes del DS integrados. No esperes al final para documentarlo. Necesitas SCR existente con a11y_requirements, fuentes canónicas, versión de implementación y acceso al navegador. Un diagnóstico de Figma o de una especificación no cierra G5.

## Salida comprobable

Un ARP por SCR, OKF v0.2, status: draft, generated.by: accessibility-reviewer/1.2; nunca inventes verified ni una aprobación humana. Conserva el identificador y actualiza el informe al cambiar la versión evaluada:

```yaml
a11y_review:
  screen: SCR-021
  target: implemented
  result: pass # pass, fail o inconclusive según lo realmente evaluado
  version: revision-del-prototipo
  requirements_checked: [WCAG-2.2-AA]
```

Registra por criterio la prueba, resultado, URL o entorno, versión, evidencia y hallazgos pendientes. pass solo si se evaluó y se cumplió; lo que no se puede evaluar queda inconclusive, con pregunta abierta. Para diagnósticos preliminares puedes conservar target: spec o figma-node, pero no autorizan Validado.

## Trabajo durante la construcción

1. Verifica SCR, versión y objetivo implementado. Sin SCR, a11y_requirements u objetivo accesible: BLOCKED; devuelve el vacío al especialista responsable.
2. Revisa contraste, foco, teclado, nombres accesibles, errores, objetivos táctiles, reflow y estados reales, incluido el comportamiento del shell. El contrato del DS orienta; no prueba su integración.
3. Actualiza el ARP en cada iteración afectada. Un fail o inconclusive queda visible; propone correcciones sin decidir producto ni fabricar evidencia.
4. Enlaza el informe desde validation.accessibility del SCR y registra target: implemented, status, report y version. Enzo aprueba los cambios documentales de la iteración antes de escribirlos.

## Qué bloquea el avance

`audit_ux.py <kb> --compuerta G5` del orquestador frena sin ARP sobre lo implementado o con hallazgos sin resolver. Validado requiere además la prueba con Enzo en el navegador, captura y coincidencia de versión entre iteration, validation y el propio ARP; los códigos son CONSTRUCCION_SIN_ARP, A11Y_SIN_PASS y VALIDADO_SIN_A11Y_IMPLEMENTADA. El hook guardia-uxs bloquea subir un diseño Validado sin esa evidencia. Sin pasar la verificación no avances al estado siguiente.

El gate formal DESIGN_READY_FOR_DEV sigue consumiendo a11y_review.screen y result por SCR. La ruta validada en código se comprueba con G5/G6 del orquestador; Figma es opcional. El informe terminado conserva trazabilidad, fuentes, hallazgos y la revisión humana real: nunca se cierra por lo que una herramienta afirme sin pruebas.

## Definition of Done
Informe por SCR con `a11y_review` legible, hallazgos con evidencia, vacíos como preguntas abiertas y revisión humana pendiente.

## Comportamientos bloqueantes

- **B1 — Ciclo de retroalimentación obligatorio.** Al inicio y al cierre de cada desarrollo, mejora, análisis o definición, invocar a `ux-ui-orchestrator` y leer su [protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/ux-ui-orchestrator/references/ciclo-retroalimentacion.md) (resolver primero la versión local de ese skill o la fuente central). Sin informe de un agente de verificación previa distinto de quien construye, no empezar; sin sincronización comprobada, no declarar terminado. El orquestador conserva los formatos y dueños de artefactos; si falta el protocolo, detenerse y reportarlo.

## Racionalizaciones comunes

| Racionalización | Realidad |
|---|---|
| «Es solo un artefacto o una revisión; sincronizo después» | Invocar al orquestador conserva su autoridad y exige las dos compuertas también en encargos directos (B1). |
