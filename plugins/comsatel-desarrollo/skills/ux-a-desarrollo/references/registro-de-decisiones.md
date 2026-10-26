# Registro de decisiones

Las decisiones abiertas, los desvíos de la fuente y las brechas viven en documentos, no en la pantalla ni en un chat. En el proyecto del DS: `Orquestacion/proyectos/comsatel-ds/objetivos/` (registro de decisiones abiertas, mapa publicado por flujo, estado de publicación para Arquitectura, guía de pruebas).

## Cuándo se registra

| Caso | Cómo se escribe |
|---|---|
| El responsable de diseño decide algo que la fuente (UXR, FLW) no cubre | «Decisión de <responsable>, pendiente del PO», con su origen (captura, fecha) |
| Lo decidido **contradice** la fuente | Un desvío: qué dice la fuente, qué se construyó y por qué; no se resuelve, se preserva |
| Un contrato del BFF no existe aún | «Contrato propuesto, solo del mock», con endpoint, cuerpo y errores |
| Falta un componente del DS | Fila en `GAPS.md` del DS y ficha en la auditoría de brechas |
| Texto provisional | En el documento, no en la UI |

## Estructura de una sección del registro

Número y título de la iteración, la decisión, la fuente que toca (UXR-xxx-Qn, FLW-xxx), lo que se tomó del piloto (archivos), el contrato propuesto, los archivos cambiados y lo pendiente. Las preguntas sin responder se enumeran con su responsable (PO, Seguridad, Arquitectura, UX, Accesibilidad, DS).

## Impacto en la base de conocimiento

Cada decisión que puede obligar a cambiar una historia, UXR o flujo se anota en la tabla inicial del registro («decisiones que pueden obligar a actualizar la base de conocimiento»), para cruzarla cuando el PO valide.

## Qué no hacer

- No marcar como resuelta una pregunta abierta porque se construyó una alternativa: construir no cierra.
- No sobrescribir la fuente de UX desde desarrollo: se propone el cambio y se registra.
- No dejar rótulos «PENDIENTE» en la interfaz.
