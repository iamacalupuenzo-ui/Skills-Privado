# Microinteracciones y fluidez en móvil

Leer al diseñar o auditar cualquier movimiento, gesto o respuesta al toque. Estructura de cada interacción (modelo de
cuatro partes del skill `micro-interactions`, MIT): **disparador → reglas → respuesta → ciclos y modos**. Al
proponer una interacción nueva, escribe las cuatro.

## 1. Tiempos y curvas

| Dato | Valor | Origen |
|---|---|---|
| Movimiento de la hoja inferior | 400 ms | Base |
| Curva de entrada de la hoja | `cubic-bezier(0.23, 1, 0.32, 1)` | Base |
| Curva de salida de la hoja | `cubic-bezier(0.86, 0, 0.07, 1)` | Base |
| Resorte espacial por defecto (movimiento, tamaño, esquinas) | amortiguación 0,8 y rigidez 380 | M3 (esquema expresivo) |
| Resorte espacial rápido / lento | 0,6 y 800 / 0,8 y 200 | M3 |
| Resorte de efectos (color, opacidad) | amortiguación 1,0 (sin rebote): 1600, 3800 o 800 | M3 |
| Salida más corta que la entrada | 60 % a 75 % de la duración de entrada | `micro-interactions` (MIT) |
| Escalas de duración útiles | instantánea 0 a 50 ms; rápida 100 a 200; normal 200 a 300; lenta 300 a 500 | `micro-interactions` (MIT) |
| Funcional máximo | 400 ms; más se siente lento | `micro-interactions` (MIT) |

Lo construido usa los tokens del sistema, no los valores de arriba: `CsDuration.slow` (350 ms) para mover la hoja,
`CsDuration.medium` (200 ms) para el desvanecido de contenido, `CsDuration.entering` (250 ms) para el resorte del
vehículo, y `CsEasing.defaultValue` para la curva. Es una desviación consciente frente a los 400 ms de Base
(Nuestro: el token más cercano). Si el diseñador pide los 400 ms exactos, es una brecha del sistema, no un cambio local.

## 2. Tabla de interacciones del Home de mapa

| Cuando… | Responde… | Tiempo |
|---|---|---|
| Se toca un control | Ondulación nativa desde el punto de toque | Inmediata |
| Se arrastra la hoja | Sigue al dedo; al soltar se acomoda en la posición más cercana, empujada por la velocidad; vibración suave | Hoja 350 ms |
| Se toca el tirador | Pasa a la siguiente posición (alternativa al arrastre) | Hoja 350 ms |
| Se sube la hoja desde el reposo | Las tarjetas se revelan con desvanecido y desplazamiento ligados a la altura de la hoja; al pasar el 62 % pasa a lista (vuelve por debajo del 56 %) | Ligado al gesto |
| Se toca el buscador | La hoja sube a lo máximo, el campo toma el foco, el teclado no tapa resultados | Hoja 350 ms |
| Se escribe | Mapa y lista se filtran en vivo; la coincidencia se resalta | Sin animar la lista |
| Se elige una Unidad | La hoja pasa al detalle; el vehículo crece de 0,8 a 1 con resorte; el mapa centra el vehículo arriba de la hoja; vibración de selección | 250 ms |
| Se cierra el detalle | Vuelve a lo anterior en la misma altura | Hoja 350 ms |
| Se cambia una ficha de filtro | Cambia de tono en 100 ms; vibración suave | 100 ms |
| Se toca una función | Vibración ligera | Inmediata |
| «Reducir movimiento» está activo | Todo cambia sin animar (`MediaQuery.disableAnimationsOf`) | 0 ms |

## 3. Reglas

1. **La animación mejora, no es requisito.** Con el movimiento apagado la pantalla debe funcionar igual.
2. **Interrumpible.** Nada bloquea la entrada del usuario mientras anima.
3. **Un cambio de contenido no se corta en seco.** Si el contenido cambia dentro de la misma superficie, se
   desvanece el nuevo; si la superficie cambia de altura, se mueve con animación y no se crea otra.
4. **Una sola superficie desplazable por zona.** No intercambiar con `AnimatedSwitcher` dos vistas que comparten un
   mismo `ScrollController` (aserción de Flutter); cambiar los hijos de una vista que se conserva.
5. **Las zonas fijas también se arrastran.** Todo lo que está sobre la hoja y no desplaza (tirador, buscador, fichas)
   debe mover la hoja al arrastrarlo; si no, solo funciona agarrando el cuerpo.
6. **Vibración con medida.** Selección y cambio de altura: `HapticFeedback.selectionClick`; acción de una función:
   `HapticFeedback.lightImpact`. No vibrar con cada dato en vivo.
7. **Frecuente significa sutil.** Lo que se repite cien veces al día no lleva rebote ni demora.

## 4. Fluidez con datos en vivo

El mapa recibe actualizaciones continuas; cada una no debe reconstruir toda la pantalla.

- Escuchar el controlador solo donde se necesita (la lista y el detalle), no en la raíz de la pantalla.
- Envolver la hoja en `RepaintBoundary`.
- Lo que depende de la altura de la hoja (opacidad de las tarjetas) se actualiza con un `ValueListenable` propio,
  sin reconstruir el resto.
- Las filas de la lista llevan `ValueKey` con el id de la Unidad.
- Hallazgo vigente al 25-nov-2026: cada actualización sigue reconstruyendo todo el mapa; aislar los marcadores es un
  pendiente de ingeniería y debe medirse en un celular real, no en el emulador.
