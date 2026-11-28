# Preguntas abiertas

## Índice

1. La tabla
2. Quién responde qué
3. Qué puede cerrar el agente
4. Dónde se registran

## 1. La tabla

```markdown
# Open questions

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
| --- | --- | --- | --- | --- | --- |
| UXR-NNN-Q1 | <pregunta concreta, con el dato que falta y su efecto> | Product Owner | Alta | Sí, a Desarrollo | Abierta |
```

- **ID:** `UXR-NNN-Qn`, correlativo y permanente. Una pregunta cerrada no se borra: cambia su
  estado («Respondida AAAA-MM-DD por <quién>: …», con la fuente de la respuesta).
- **Pregunta:** se responde con una decisión, no con una investigación. Incluye la propuesta si
  la hay: «¿Se confirma que los valores propios se descartan? Propuesta: sí, con aviso».
- **Bloquea:** a quién y qué. «No a Desarrollo; sí al texto del diálogo» es mejor que «Parcial».
- Si no hay preguntas, se escribe «Ninguna abierta», no se omite la sección.

## 2. Quién responde qué

| Tema | Responsable |
|---|---|
| Reglas, alcance, permisos, datos, textos legales | Product Owner |
| Contratos de API, comportamiento técnico, tiempos | Desarrollo o Arquitectura (con nombre si se conoce) |
| Seguridad, auditoría | Seguridad o Arquitectura |
| Textos de interfaz, estados vacíos, mensajes, patrones estándar | UX (el agente puede cerrarla, ver 3) |

## 3. Qué puede cerrar el agente

Solo preguntas UX estándar (textos, estados vacíos, mensajes, patrones conocidos), con
benchmarking de al menos dos referencias reconocidas, una decisión DEC con fecha y fuentes, y la
marca «IA (delegado por Enzo)». Nunca negocio, permisos, datos ni alcance (regla B9 del
orquestador).

## 4. Dónde se registran

Primero en la KB (el UXR y, si el paquete lo usa, el catálogo de preguntas), después en Notion
como reflejo (regla B6 del orquestador). Si la pregunta nace de una consulta de otra área (QST),
se enlaza a ella y se responde con `ux-consultas-responder`.
