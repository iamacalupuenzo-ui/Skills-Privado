# Protocolo DISEÑAR

Se activa cuando el usuario pide diseñar, proponer o rehacer una pantalla, flujo o componente móvil. Entrada: la
pantalla o flujo, la plataforma, el Rol y la historia o SCR de la knowledge-base si existen. Salida: una propuesta
validable (maqueta HTML medida en dp y una lista de decisiones por validar). **No construye en Flutter ni publica.**

## Fase 0 — Contexto

1. Leer lo que ya existe: SCR, UXR y flujos de la knowledge-base, la pantalla actual (captura o código) y las
   decisiones previas de `references/arquitectura-pantalla-mapa.md`.
2. Confirmar que el destino sea Flutter con `comsatel_ui_flutter` (GUARD). Si es otra plataforma, decirlo y trabajar
   solo los principios.
3. Preguntar únicamente por vacíos materiales (quién usa la pantalla, qué datos existen). No repetir lo ya dicho.

## Fase 1 — Reglas aplicables

Leer `references/medidas-y-reglas.md` y `references/microinteracciones.md`. Listar qué medidas se aplican y cuáles
están **sin fuente** (se marcarán como tales en la maqueta).

## Fase 2 — Opciones

Proponer de dos a tres arquitecturas o variantes, cada una con lo que gana y lo que cuesta, y recomendar una con su
evidencia y sus límites. Si el tema es la pantalla de mapa, partir de las alternativas ya evaluadas para no repetirlas.
Si no hay fuente de otras plataformas para una decisión, decir «sin fuente», no completar de memoria.

## Fase 3 — Maqueta HTML en dp

1. Un teléfono de 360 dp de ancho (286 px de pantalla, 1 dp = 0,7944 px) con todas las medidas escritas en dp.
2. Estados completos: reposo, lista, búsqueda, detalle y los casos límite (Rol sin funcionalidades, sin conexión,
   sin resultados, texto grande). Los vehículos y estados con ícono y texto, no solo color.
3. Una tabla «Números que se aplican» con la etiqueta de origen de cada cifra (Base, M3, Nuestro, Por confirmar).
4. Verificar la maqueta en el navegador antes de mostrarla: que no haya errores de consola, que no desborde en
   ancho de teléfono y que cada estado se vea. Un `file://` suele estar bloqueado: servir la carpeta con un servidor
   local de Node.
5. Publicar como artefacto solo si el usuario lo pide o lo necesita para validar; las imágenes no se suben.

## Fase 4 — Validación con el diseñador

Cerrar con una lista numerada de decisiones por validar (máximo cinco) y lo que se hará con cada respuesta. **No pasar
a Flutter sin un sí explícito.** Si responde con cambios, volver a la Fase 3, no a la entrevista.

## Fase 5 — Traspaso a construcción

Entregar a quien construya (agente `desarrollador-movil-flutter` o una persona): mapa de medidas a tokens `Cs*`,
excepciones explícitas, brechas del Design System por registrar y los estados que las pruebas deben cubrir. La
librería móvil puede cambiar: se construye primero en el producto y después se lleva a `mobile-ui-components`.

## Cierre

```
Diseño propuesto — [pantalla]
------------------------------
Opciones evaluadas:   [lista y la recomendada]
Maqueta:              [ruta local o URL; estados incluidos]
Medidas sin fuente:   [lista]
Por validar:          [1 a 5 decisiones]
Siguiente paso:       [validación del diseñador / construcción]
```
