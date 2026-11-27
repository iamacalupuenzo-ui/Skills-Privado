# Familias de ilustraciones y metáfora por estado

`cs-illustration` (paquete `@comsatel/ui-components/illustrations`) dibuja todas las
ilustraciones del DS. Se piden por nombre; un producto nunca dibuja las suyas.

## Las tres familias

| Familia | Lienzo | Cuándo |
| :-- | :-- | :-- |
| Receta de estado | 160 × 120, trazo y colores del tema | Estados vacíos comunes en tablas, paneles angostos y listas del backoffice: `no-access`, `empty-list`, `no-results`, `load-error`, `no-data`, `no-attachments`. La 404 (`not-found`, 240 × 120) es su excepción de marca. |
| Indicador | 120 × 96, sin panel | Acompaña una cifra de un tablero (`cs-stat`): `documents-*`, `recoveries-*`. Se tiñe con `--cs-illustration-ink` y `--cs-illustration-wash`. |
| Escenas ilustradas | 420 × 300 isométricas (200 × 150 la plana), mostradas a 240 px | Estados de las pantallas de flota que necesitan transmitir un sentimiento: no llegó la información, la búsqueda no encontró Unidades, se cortó la conexión. Es la familia que construye este skill. |

Regla de elección: si el estado aparece en una tabla o un panel angosto, va la receta.
Si es el estado principal de una pantalla de flota y hay espacio para 240 px, va una
escena ilustrada.

## Las escenas que ya existen (1.18, sin publicar)

| Nombre | Escena | Estado |
| :-- | :-- | :-- |
| `fleet-load-error` | Camión isométrico que sigue andando por la pista, con la antena GPS sin señal (señal tachada en rojo). Las ruedas giran y el carril corre. | No llegó la información de la flota. Es la escena de referencia de calidad. |
| `fleet-no-results` | Estacionamiento con dos furgonetas en gris (no coinciden con el filtro), el espacio vacío marcado en marca y una lupa que lo barre. | Búsqueda o filtro de Unidades sin coincidencias. Sin rojo. |
| `map-connection-lost` | Mapa plegado en tres, con la ruta recorrida, el corte en rojo, la ruta perdida punteada, el destino apagado y el enchufe fuera del tomacorriente con chispas. | No se pudo cargar un mapa o un recorrido. |
| `fleet-signal-lost` | Camión plano de perfil con la antena sin señal (hecho a mano, sin generador). | El mismo caso que `fleet-load-error`, en estilo plano. |

## Cómo elegir la metáfora

Las ilustraciones reflejan sentimientos, no componentes. Antes de dibujar, escribe en una
frase qué siente quien ve el estado y qué objeto real de la flota lo cuenta.

| Estado | Sentimiento | Patrón que ya funcionó |
| :-- | :-- | :-- |
| Error de carga | Algo se cortó, no es su culpa y tiene arreglo | El objeto sigue funcionando y solo falla el enlace (antena tachada, enchufe afuera). El rojo va solo en la pieza que falla. |
| Sin resultados | Hay Unidades, pero ninguna coincide | Mostrar lo que sí existe apagado en gris y marcar en marca el lugar donde se buscó. Nada rojo. |
| Vacío (nunca hubo) | Todavía no hay nada, empezará | Lugar preparado y vacío, sin objetos grises (si hay objetos grises se lee como «sin resultados»). |
| Sin conexión | Se perdió el camino a medio recorrido | Lo recorrido en marca, el corte marcado, lo pendiente punteado y apagado. |

Una metáfora sirve si se entiende sin el texto en un segundo y no compite con el texto.
Si necesitas una etiqueta o un número dentro del dibujo para que se entienda, la metáfora
está mal.

## Nombres

`<dominio>-<estado>` en inglés y kebab-case, como los existentes: `fleet-…`, `map-…`.
El nombre se agrega al tipo `IllustrationName`, a `ILLUSTRATION_NAMES` y a
`SceneIllustrationName`.
