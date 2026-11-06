# Patrones de producto para logística, trazabilidad y mapas

Los referentes sirven para aprender estructura de trabajo, jerarquía y estados;
nunca para copiar marca, capturas, CSS, textos ni componentes. La UI final usa
los componentes y tokens públicos del sistema de diseño elegido.

## Investigación proporcional

Cuando el flujo incluya operación, flota, mapas, alertas o trazabilidad,
consultar fuentes oficiales actuales según la necesidad:

- Samsara: navegación de dashboard y operación de flota.
  https://kb.samsara.com/hc/en-us/articles/48621492984589-Dashboard-Menus
- Samsara: visibilidad GPS y activos.
  https://www.samsara.com/products/telematics/gps-fleet-tracking
- Geotab, Motive u otro referente internacional: usar documentación oficial
  vigente, solo si aporta una comparación pertinente al flujo.
- W3C para accesibilidad de mensajes, formularios y contenidos dinámicos:
  https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html
  https://www.w3.org/WAI/tutorials/forms/notifications/

Registrar en el plan qué patrón se toma, qué problema resuelve y qué se excluye.
No convertir una búsqueda visual en autorización para copiar una solución.

## Mapa como superficie operativa

El mapa no es accesible solo por verse bien. Definir siempre:

1. Propósito principal: localizar, seleccionar, seguir, comparar o despachar.
2. Fuente, hora de actualización y significado de la precisión; mostrar dato
   desactualizado en vez de aparentar tiempo real.
3. Alternativa no cartográfica: lista, tabla o panel de detalle con los mismos
   activos y acciones esenciales.
4. Estados: carga de capa, sin ubicación, permisos, error de proveedor,
   conexión lenta, agrupación de marcadores y selección fuera del viewport.
5. Controles: búsqueda, filtros, leyenda, zoom, selección y retorno de foco.
6. Rendimiento: clustering, actualización incremental y no renderizar miles de
   elementos interactivos sin estrategia.

## Notificaciones operativas

Cada notificación debe declarar evento, audiencia, severidad, urgencia, canal,
deduplicación, caducidad y acción siguiente. Las de estado no roban foco; los
errores que impiden continuar sí deben guiar a la corrección. Usar `role=status`
o regiones vivas solo con mensajes breves y relevantes; no anunciar cambios en
cada pulsación ni convertir un feed entero en alerta.

Una alerta crítica exige contexto, hora, entidad afectada y acción verificable.
Un contador sin destino, un toast que desaparece antes de poder actuar o una
alarma duplicada es un hallazgo de experiencia.
