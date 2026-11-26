# Arquitectura de la pantalla de mapa móvil

Decisiones tomadas con el diseñador (Enzo) el 24-nov-2026 para el Home del Cliente de la app de Flotas
(US120, HU-07-01). Leer antes de diseñar o auditar la pantalla principal de cualquier app móvil de Comsatel con
mapa. El diseño completo se validó en HTML (maquetas medidas en dp) antes de construirse en Flutter.

## 1. La opción elegida: «la hoja es el lanzador»

El mapa ocupa toda la pantalla. Sobre él:

- **Arriba a la izquierda:** botón de cuadrícula que abre todas las funcionalidades del Rol (hoja modal).
- **Arriba a la derecha:** perfil del usuario (avatar con su inicial); su menú trae el nombre y «Cerrar sesión».
- **Sin barra de título ni barra de navegación inferior.** El título vive en el saludo y en la hoja.
- **Hoja inferior única, no modal, con tres alturas que decide quien la usa:**
  1. *Compacta* (mínimo): el saludo y, debajo, el buscador. Es lo más rápido.
  2. *Reposo*: suma las funcionalidades del Rol como tarjetas en una fila que se desplaza; se revelan al subir la hoja.
  3. *Lista*: al subirla más, el buscador queda fijo arriba, con las fichas de filtro y la lista de Unidades.
- **Búsqueda:** el campo toma el foco arriba, dentro de la hoja, y la lista y el mapa se filtran mientras se escribe.
- **Detalle de una Unidad:** reemplaza a la lista dentro de la misma hoja; el mapa centra el vehículo arriba de la hoja.
  Nunca hay dos paneles abiertos a la vez.

Alturas en la implementación: compacta y reposo se calculan según el contenido (no son porcentajes fijos); la expandida
deja 80 dp bajo la barra de estado (Base dice 60 dp; se dejó más para no tapar los botones de arriba).

## 2. Por qué un solo buscador

La primera propuesta puso una lupa arriba y el campo en la hoja. El diseñador la descartó: dos buscadores en una
pantalla no tienen sentido. Investigación de plataformas (24-nov, evidencia limitada: sobre todo prensa y páginas de
producto, sin documentación oficial de diseño por app):

| App | Buscador | Perfil | Barra inferior | Calidad de la fuente |
|---|---|---|---|---|
| Apple Maps | Dentro de la hoja inferior | Foto de perfil dentro de esa hoja | No tiene | Verificado (soporte de Apple, MacRumors) |
| Uber | Arriba, «Where to?» | Sin fuente de ubicación | Sí: Services y Activity | Verificado (página oficial) |
| Google Maps | Barra flotante arriba | Arriba a la derecha | Sí: 3 pestañas (antes 5) | Parcialmente inferido |
| Lyft | En una tarjeta deslizable abajo | Menú de perfil, ubicación sin fuente | Pestañas por modo | Verificado |
| Cabify | Entrada de destino abajo | En el menú hamburguesa | Sin fuente | Verificado |

Patrón repetido: ninguna app con fuente muestra dos buscadores a la vez. Nadie publica las alturas de sus hojas: habría
que medirlas en un dispositivo. Bolt, DiDi, inDrive, Rappi y Glovo no tuvieron datos fiables.

## 3. Alternativas evaluadas

| Opción | Idea | Por qué no |
|---|---|---|
| A | Barra superior con menú y lupa más barra inferior con las funcionalidades | Dos superficies para buscar y menos mapa; el diseñador prefirió B |
| C | Menú lateral y lupa, sin barra inferior | Las funcionalidades quedan a dos toques; menos descubrible |
| B con buscador arriba y abajo | Lupa arriba más campo en la hoja | Duplica la función; descartada |

Si un Rol llega a tener más de cinco funcionalidades, la cuadrícula de arriba ya las agrupa: no hace falta cambiar la
arquitectura.

## 4. Datos y límites de lo construido

- El saludo usa el nombre de la sesión (`userName` del BFF); sin nombre es solo «Hola».
- Las funcionalidades vienen del menú del Rol (`SessionFeatures`): hoy Atención de Alarmas (F-06-01), Compartir
  ubicación (F-07-04) y Herramientas en mapa (F-07-06). No hay «Reportes» ni «Alertas».
- Las tarjetas y la cuadrícula no abren nada todavía: sus destinos son de otras historias.
- El menú de perfil no trae «Ajustes» porque aún no tiene destino.
- El tipo de vehículo (camión, furgoneta, camioneta) no existe como dato de la Unidad: hoy se dibuja un auto.
- Los 4 tonos del Design System (activo, detenido, apagado, neutro) cubren los siete estados visuales; la maqueta
  mostraba seis colores. Provisional hasta que UX lo confirme.
- Las etiquetas de las fichas de filtro (Activas, Detenidas, Sin conexión) son provisionales.

## 5. Unidades en el mapa

Vehículo visto desde arriba, girado según su rumbo. Por defecto, pintura neutra (blanco perla, como los autos de Uber)
con un halo del color del estado debajo y una insignia con ícono en la esquina; existe también la variante teñida.
Al elegirse, el vehículo crece con un resorte, lleva un halo de selección y su nombre. En la lista cada fila lleva el
mismo vehículo para reconocerlo en el mapa. Las ilustraciones las dibuja código (`CustomPainter`), sin imágenes ni
dependencias, y cambian con el tema.
