# Extracción desde C-Locater — catálogo y disciplina

C-Locater (`C:\Users\emacalupu\Documents\Proyectos\CLocater\C-Locater`) es un producto real de fleet
tracking (React + Leaflet + Tailwind v4), independiente del design system,
con su propia marca y su propio sistema de tokens shadcn/Tailwind. No es
parte del Comsatel Design System — es una tercera fuente de referencia, al
mismo nivel que React lo es para Angular: se lee para saber QUÉ existe
(estructura, secciones, comportamiento), nunca para copiar CÓMO está hecho
(valores de color, spacing, tipografía, sintaxis JSX/CSS literal).

**Ojo con `src/styles/comsatel-tokens.css`:** C-Locater ya tiene una copia
manual de los tokens de Comsatel-DS ahí (agregada en una sesión anterior).
Es una copia local que se desincroniza el día que el token real cambie en
`Sistema-de-dise-o-Comsatel` — nunca es la fuente de verdad. Ir siempre a
los tokens reales de `Sistema-de-dise-o-Comsatel` (`src/styles/tokens.css`
+ `src/lib/tokens/typography.mjs`), incluso si el valor buscado ya está,
en apariencia, disponible en ese archivo copiado.

## Archivos ya conocidos (punto de partida, sesión 2026-09-08)

Estos archivos ya se leyeron y corrigieron una vez con tokens de Comsatel-DS
copiados directo en C-Locater (antes de que se estableciera el flujo
EXTRAER real vía React) — son buen punto de partida porque ya se sabe qué
secciones/estados tienen:

- `src/shared/components/FleetMap.tsx` — mapa de flota: theme toggle
  claro/oscuro, controles de zoom, card de información de vehículo
  (header, badges de estado/ignición, fila de estadísticas, menú de
  acciones rápidas).
- `src/shared/lib/mapIcons.ts` — `getStatusColor()` (colores por estado de
  vehículo), `createCustomIcon()` (ícono de marcador con halo/sombra).
- `src/shared/components/vehicle-detail/VehicleTrackingMap.tsx` —
  `createVehicleOnRouteIcon()`, `createRouteMarkerIcon()` (origen/destino),
  `EventLegend` (leyenda de eventos de ruta), estado de carga del mapa.
- `src/App.tsx` — sincronización de tema global (`isDark` prop-driven, sin
  clase/atributo DOM propio salvo el que se agregó para activar los
  tokens de Comsatel-DS).
- `src/index.css` — imports de fuentes y tokens.

No es una lista cerrada — cualquier otra sección de C-Locater (vistas de
lista, filtros, tablas de eventos, etc.) es candidata igual de válida
cuando el usuario la señale.

## Disciplina de extracción

1. Leer el archivo `.tsx`/`.ts` real de C-Locater — layout, subcomponentes,
   props, estados (hover/activo/seleccionado/vacío/error), qué problema
   resuelve esa UI.
2. Nunca copiar: valores hex, píxeles de padding/gap/radio, nombres de
   clase Tailwind literales, `box-shadow` a mano. Todo valor sale del
   sistema de tokens de destino (React: `tokens.css`/`typography.mjs` de
   `Sistema-de-dise-o-Comsatel`).
3. Si un patrón de C-Locater no calza con ningún token existente ni con el
   patrón de página real de `Sistema-de-dise-o-Comsatel`
   (`PageContent.tsx` + `DocsComponents.tsx`: Canvas/Toolbar/CodeBlock,
   copy bilingüe vía `src/lib/translations/`), no forzarlo — señalarlo
   como pregunta al usuario (mantener estructura tal cual / rediseñar /
   reestructurar), nunca decidirlo por cuenta propia.
4. Construido y verificado en React, el componente sigue el flujo
   RECONSTRUIR ya existente del skill para portarlo a Angular — EXTRAER
   termina en React, no continúa solo a Angular en la misma pasada.
