# Respuesta de cierre de un paso

Estructura única para toda respuesta que cierra un paso de trabajo ante Enzo: construcción en producto, cambio en el DS, diseño o documentación. La aprobó Enzo el 2026-11-16. La usan el orquestador y todos los especialistas del pack de desarrollo; cada skill solo decide **qué contenido propio** va dentro de «Lo que hice».

Al **empezar** un trabajo, la primera línea sigue declarando el modo o el flujo elegido. Al **cerrar** un paso, la primera línea es el resultado.

## Las cuatro partes, en este orden

1. **El resultado, en la primera línea.** Una o dos frases contadas como Enzo lo vería en pantalla o en el documento, no como lista de archivos. Si aplica, el alcance en la frase siguiente («Todo esto aplica solo en móvil; en escritorio no cambia nada»).
2. **«Lo que hice:»**, en viñetas:
   - **Construido:** cada commit con su hash corto y su repositorio, diciendo si es local o ya tiene push, y las cifras reales de las pruebas (`N de N`).
   - **Registrado:** cada documento creado o actualizado: KB con el hash de su commit, Notion con la URL completa, tareas con su estado. Cada código va con su título y su URL (`DEC-097 — La lupa del buscador va en la barra del Shell`, no `DEC-097` solo).
   - Una línea de riesgo o de comportamiento de respaldo, si existe, y la ruta donde están las capturas.
3. **«Lo que necesito de ti:»** la acción concreta que solo Enzo puede hacer: probar algo en un dispositivo, aprobar, avisar a alguien. Si no hace falta nada, decirlo en una línea.
4. **«Lo siguiente…»**: el próximo paso según las historias, con una propuesta concreta y una pregunta cerrada para su visto bueno («¿Sigo con el filtro por estado de la US124?»).

## Reglas

- Corto. Sin tablas de cambios ni listas de IDs que Enzo no pidió.
- Lo no verificado se dice como tal; no se presenta como hecho.
- Si una parte no aplica (no hubo commits, nada se registró), se omite la viñeta, no se rellena.
- No reemplaza las reglas del CLAUDE.md global de Enzo: la pregunta previa, «En 30 segundos» y la pregunta de comprobación aplican a los documentos, no a esta respuesta en el chat.

## Ejemplo (cifras ilustrativas)

> La lupa ya está en la barra del Shell, a la derecha del logo. Al tocarla se despliega el buscador debajo de la barra y el foco entra al campo. Todo esto aplica solo en móvil; en escritorio no cambia nada.
>
> **Lo que hice:**
> - **Construido:** `b8294b5` en el micro UI de monitoreo (local, sin push). Pruebas: 412 de 412.
> - **Registrado:** DEC-097 — La lupa del buscador va en la barra del Shell (URL de Notion completa), en estado Propuesta.
> - Si el Shell no expone la ranura de la barra, el buscador vuelve a su lugar anterior. Capturas en `capturas-dsp006/`.
>
> **Lo que necesito de ti:** probarlo en tu celular y aprobar DEC-097.
>
> **Lo siguiente:** según la US123 toca la tarjeta de la Unidad en móvil. Propongo empezar por el acordeón. ¿Te parece?
