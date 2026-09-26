# Protocolo DEFINIR — de una idea a una épica

Se activa cuando el usuario no tiene una épica ni historias escritas: solo una idea,
un problema narrado o una necesidad. El objetivo es convertirla en una épica y un
conjunto de historias propuestas que el usuario valida antes de segmentar.

## Fase 0 — Confirmar que no hay fuente escrita

Comprobar que no existe una épica, issue, documento o registro en Notion con esa
necesidad. Si existe, el modo correcto es ANALIZAR o ACTUALIZAR. Leer primero lo que
el usuario ya contó en la conversación: no se le pregunta lo que ya dijo.

## Fase 1 — Entrevista

Preguntar solo lo que falta, **máximo tres preguntas por turno**, en este orden de
prioridad:

1. **Problema:** ¿qué pasa hoy, a quién le pasa y qué le cuesta (tiempo, dinero,
   errores, riesgo)?
2. **Actor:** ¿quién usa lo que se va a construir y con qué perfil o permisos?
3. **Resultado:** ¿qué debe poder hacer el actor cuando esto exista, y cómo se sabe
   que funcionó (dato, métrica o evidencia observable)?
4. **Alcance:** ¿qué incluye y qué queda fuera explícitamente?
5. **Restricciones:** plataforma o stack, sistema de diseño, datos o integraciones
   existentes, plazos, normas o seguridad.
6. **Incertidumbres:** ¿qué no está decidido o depende de otra persona?

Una respuesta vaga no se completa por intuición: se repregunta una vez y, si sigue
abierta, se marca `[SUPUESTO]` con la opción propuesta y su razón (B1).

## Fase 2 — Borrador de la épica y de las historias

Con las respuestas, armar:

- **Épica** con la estructura de `trazabilidad-notion.md` (Qué se construye, Alcance,
  Historias, Riesgos y decisiones pendientes) y su `Objetivo` y `Criterio de cierre`.
- **Historias propuestas:** una por cada resultado independiente para el actor, en
  formato Como/quiero/para, con su papel en la épica y el orden sugerido según
  dependencias. Todo lo que no salió de la entrevista va marcado `[SUPUESTO]`.

No se escriben casos de uso ni criterios detallados todavía: eso ocurre en ANALIZAR,
cuando la épica está validada.

## Fase 3 — Validación

Mostrar el borrador de forma breve: la épica en un párrafo, las historias en una
lista con su orden y los supuestos aparte. Pedir al usuario que confirme, corrija o
descarte cada supuesto. Iterar hasta que no queden supuestos sin decisión o el usuario
los acepte como pendientes explícitos.

## Fase 4 — Guardar y continuar

1. Guardar el borrador validado como archivo nuevo:
   `D:\Investigacion - V4\01-proyectos\<proyecto>\epica-definida-<proyecto>-v1-<YYYY-MM-DD>.md`.
2. Si el usuario pidió registrar en Notion, crear la épica (Estado `Borrador`) y las
   historias (Estado `Backlog`, con su `Orden`) usando las plantillas `Nueva épica` y
   `Nueva historia de usuario`, siguiendo `trazabilidad-notion.md`. La propiedad
   `Fuente` queda vacía o apunta al archivo local: no hay issue de origen.
3. Ofrecer continuar en modo ANALIZAR con ese archivo como entrada, para segmentar
   en módulos, flujos y casos de uso.

## Cierre

```
Resultado: épica definida v1 — [nombre]
Fuente:    D:\Investigacion - V4\01-proyectos\<proyecto>\epica-definida-<proyecto>-v1-<fecha>.md
Historias: [cantidad] propuestas, en orden [lista corta]
Supuestos: [aceptados como pendientes o "ninguno"]
Notion:    [registrado con URLs / no solicitado]
Siguiente: ANALIZAR para segmentar en módulos, flujos y casos de uso
```
