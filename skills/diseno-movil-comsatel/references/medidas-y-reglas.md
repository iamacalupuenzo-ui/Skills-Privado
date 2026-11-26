# Medidas y reglas de diseño móvil

Conocimiento estático: cada cifra lleva su origen. Leer antes de proponer o auditar una medida.
Si una cifra que necesitas no está aquí, no la inventes: escríbela como «decisión propia, sin fuente»
(bloqueante B4).

Origen de cada etiqueta:

| Etiqueta | Significa |
|---|---|
| **Base** | Leído en la documentación pública de Uber Base (`base.uber.com`) con navegador; las páginas cargan con JavaScript y un lector de texto solo ve el título |
| **M3** | Leído en las referencias de Material 3 Expressive vendorizadas en el skill `m3-expressive` (MIT) |
| **Nuestro** | Decisión del equipo con el diseñador; no viene de una fuente externa |
| **Sin verificar** | Dato recordado, no leído en la fuente: confirmar antes de usarlo como regla |

## 1. Rejilla, márgenes y zonas táctiles

| Regla | Valor | Origen |
|---|---|---|
| Escala de espaciado | Múltiplos de 4 dp | Base |
| Margen lateral del teléfono | 16 dp en Android e iOS | Base |
| Área táctil interactiva mínima | 48 dp (la capa de estado es de 40 dp) | M3 |
| Ícono | 24 dp dentro del área de 48 dp | M3 (ícono de 24 dp con optical size de 20 a 48) |
| Altura de la barra de navegación (cabecera) | 48 dp en Android, 44 en iOS | Base |
| Ficha de filtro (chip) | 32 dp de alto visual, con 48 dp de área táctil | M3 (32 dp), Nuestro (área de 48) |
| Altura de barras superiores o inferiores tipo toolbar | 64 dp por defecto | M3 |

## 2. Hoja inferior (no modal)

| Regla | Valor | Origen |
|---|---|---|
| Posición colapsada | Entre 10 % y 30 % de la altura de pantalla | Base |
| Posición media (la de inicio) | Entre 40 % y 80 % | Base |
| Posición expandida | Arriba, a 60 dp de la barra de estado, con la superficie de fondo aún visible; «casi completa» y «completa» son personalizaciones | Base |
| Al soltar | Se acomoda en la posición más cercana; desde colapsada, pasar de la media salta a la expandida | Base |
| Tirador: área táctil | Al menos 48 dp de alto; tocarlo recorre las posiciones; alternativa al arrastre | Base |
| Tirador: relleno vertical | 22 dp arriba y abajo | M3 |
| Radio de las esquinas superiores | 28 dp | M3 |
| Margen superior | 72 dp | M3 |
| Ancho | Completo; máximo 640 dp | M3 |
| Título | Obligatorio (orienta a usuarios con baja visión) | Base |
| Cerrar | Botón «X» a la derecha del encabezado, obligatorio si la hoja se puede descartar; el gesto y el toque afuera son solo complementos | Base |
| Presentación | No modal: sin capa oscura, el fondo sigue usable. Modal: capa oscura y acción de cerrar obligatoria | Base, M3 |
| Relleno del encabezado | 16 dp; las acciones del encabezado a 8 dp del borde | Base |
| Barra de navegación inferior | Fija; solo un componente modal puede ir encima de ella | Base |

Excepciones conocidas frente a los tokens de `comsatel_ui_flutter`: su escala de radios llega a 12 dp, así que el
radio de 28 dp no tiene token (brecha del Design System). Va explícito y comentado en el código.

## 3. Barra de navegación inferior (si la pantalla la usa)

| Regla | Valor | Origen |
|---|---|---|
| Cantidad de destinos | De 3 a 5, de igual tamaño; con más, un destino de desbordamiento | Base |
| Pestaña activa | Indicador tonal; tocar la activa vuelve al inicio de la sección; cada sección conserva su estado | Base |
| Etiquetas | Hasta dos líneas (los nombres de las funcionalidades del Rol son largos) | Nuestro |
| Altura total con zona de gestos | 72 a 80 dp | Sin verificar (Base la muestra solo en imagen) |

## 4. Buscador

| Regla | Valor | Origen |
|---|---|---|
| Altura del contenedor | 56 dp | M3 |
| Avatar dentro del buscador | 30 dp | M3 |
| Relleno al enfocar | Pasa de 24 a 12 dp de cada lado | M3 |
| Buscador en una pantalla | **Uno solo.** Ninguna app de referencia con fuente muestra dos a la vez | Nuestro, con la evidencia de `arquitectura-pantalla-mapa.md` |

## 5. Tarjetas

| Regla | Valor | Origen |
|---|---|---|
| Esquinas | 12 dp | M3 |
| Relleno lateral | 16 dp | M3 |
| Separación entre tarjetas | 8 dp como máximo | M3 |
| Variante con contorno | 1 dp, para dar definición a una tarjeta sobre una superficie clara | M3 (variante «outlined»); la altura de 128 dp de las tarjetas del Home es Nuestro |

## 6. Estilo: sin bordes

Los elementos no llevan contorno. Se separan por relleno tonal y elevación (M3). Excepciones acordadas con el
diseñador: la tarjeta de funcionalidad con contorno de 1 dp y el campo de texto en foco. Los botones de ícono del
Design System web (`CsButton.icon`) llevan borde y no sirven en móvil: usar un botón tonal de 48 dp.

## 7. Estados y color

El estado de una Unidad nunca se comunica solo con el color: se combinan color o halo, ícono de insignia y texto
(SCR-083 a SCR-086 de la knowledge-base). Los colores salen del tema (`context.cs`), nunca de un valor literal.

## 8. Correspondencia con los tokens de `comsatel_ui_flutter`

| Necesidad | Token |
|---|---|
| Tamaños (16, 20, 24, 32, 40, 48, 56, 64, 80) | `CsSize.x2xs`, `xs`, `sm`, `base`, `md`, `lg`, `xl`, `x2xl`, `x3xl` |
| Espaciado y huecos (2 a 48) | `CsPadding`, `CsGap` |
| Radios (2, 4, 6, 8, 10, 12, completo) | `CsRadius` |
| Grosores de línea (1, 2, 4) | `CsBorder.thin`, `thick`, `thicker` |
| Duraciones (100 a 350 ms) | `CsDuration.fast`, `leaving`, `medium`, `entering`, `slow` |
| Curvas | `CsEasing.defaultValue`, `enter`, `exit`, `spring` |
| Sombras | `CsShadow.xs`, `sm` |

Valores exactos de la versión fijada (`flutter-v0.1.0`) en `lib/src/tokens/cs_tokens.g.dart` de `mobile-ui-components`.
Si cambia la etiqueta, verificar de nuevo.
