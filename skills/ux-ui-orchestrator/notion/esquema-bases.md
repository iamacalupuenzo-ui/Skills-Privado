# Esquema de las bases de Notion que usa el módulo

IDs en `config.json`. Página «Bases» = f9d1a7d0-6388-83c4-a478-813ede66ea64 (una página por base). Workspace «Gestión Operativa». Proyecto «CL2 Flotas» → producto «Piloto de CL2 Flotas».

## Propiedades comunes a las bases de repo
ID (texto, clave de carga), Ruta en el repo, Enlace GitLab, Última carga, Producto (relación); y en las de documentos: Estado del documento (para Flujos, Pantallas y Exploraciones: Borrador, En revisión, En construcción, Validado; Aprobado se conserva por compatibilidad, sin inferir Validado; en las demás bases se conserva su vocabulario), Aprobado por y Fecha de aprobación (solo humano).

## Bases en uso
| Base | Contenido | Propiedades propias destacadas |
|---|---|---|
| Proyectos / Productos | Proyecto y producto | Fase, Ámbito; Repositorio |
| Paquetes de alcance | DSP-001… | Estado del alcance, Hito de sprint, Issue de GitLab |
| Historias | HU-xx-yy | Catálogo (los ids no son únicos entre catálogos) |
| Requerimientos UX | UXR-nnn (historias de experiencia) | Resumen, Resumen vigente, relaciones a Historias y Paquetes |
| Flujos | FLW-nnn | Requerimientos UX |
| Pantallas | SCR-nnn (una fila por pantalla) | Flujo, Estados requeridos |
| Especificaciones UX | UXS-nnn (el conjunto) | Veredicto Stitch, Veredicto QA, Nivel de cierre (En curso, Diseño cerrado, Listo para desarrollo), Fecha de la especificación; relaciones a todo el módulo |
| Exploraciones | IB-nnn (una por flujo) | Enlace del lienzo, Fidelidad, Decisión humana |
| Preguntas | Una fila por pregunta | Ver `arquitectura-preguntas.md` §2 |

Indicadores de bloqueo (en Historias, Requerimientos UX, Paquetes, Flujos, Pantallas, Exploraciones y Especificaciones UX): Preguntas que bloquean, Pendientes de confirmar, Abiertas sin bloqueo, listas de IDs, Resumen de preguntas y Estado de bloqueo. Pantallas añade Bloqueos del flujo y Bloqueada (1/0); Flujos añade Bloqueos propios; Exploraciones añade Pantallas bloqueadas.

## Bases sin uso (vacías o ajenas al flujo UX/UI)
Reglas, Referencias, Decisiones, Recursos, Tareas, Reuniones, Revisiones. Decisión de Enzo: no se cargan Reglas ni Referencias; Decisiones se retira (la respuesta vive en la propia pregunta). Tareas queda para más adelante.
Nota: «Épicas» que se ve en las páginas de Preguntas es una propiedad fantasma que la API devuelve y no existe en el esquema; se ignora.

## Iconos nativos válidos
`{"type":"icon","icon":{"name":"…","color":"blue"}}` con nombres como package, book, ruler, list, shuffle, computer, compass, question-mark, gavel, library, layers, checklist. No valen flow, scales, monitor, desktop.

## Estados de Preguntas y resolución (2026-11-14)

Estado admite Abierta, Propuesta UX, Propuesta, Decidida, Diferida y Descartada. Propuesta UX es solo para las validaciones de Enzo. Las propuestas de PO, Arquitectura, Seguridad y Analista no se tocan ni se remapean; si PO y UX intervienen juntos decide PO y UX propone. Diferida queda fuera del paquete actual y se reabre al construir la función. El mapa al KB está en arquitectura-preguntas.md §2.

La fórmula Situación muestra «Por validar (UX)» para Propuesta UX y «Por confirmar» para Propuesta. La fórmula Pendiente de confirmar (ID) sigue contando **solo Propuesta**. Documentar esta regla no autoriza a modificar fórmulas ni datos en Notion.

Respuesta es un resumen de hasta 200 caracteres, con [Confirma: X] si está pendiente. El cuerpo lleva ## Resolución con ### Respuesta, ### Fuentes y evidencia, ### Quién decide y ### Impacto. No se usa heading_1. Decidida por delegación utiliza el estado Decidida y Decidido por = «IA (delegado por Enzo)», fecha y fuentes, con DEC y práctica estándar UX verificables en el KB.

Flujos, Pantallas y Exploraciones solo llegan a Validado con prueba de Enzo en el navegador, captura y accesibilidad verificada sobre la implementación. La investigación dentro de Pantallas deja INV y DEC antes de cerrar el SCR. Estos cambios se proponen y aprueban antes de escribir; no se crean opciones ni se cambian datos mediante la conciliación.

## Capturas, orígenes y estado construido

Flujos y Exploraciones incorporan **Capturas (files)**, con imágenes de lo diseñado y lo construido, su fecha y versión. Los scripts preparan enlaces HTTPS a archivos ya publicados; una ruta local no se envía como URL. No crean propiedades ni opciones; se requiere que el esquema haya sido habilitado por una persona.

Origen de Preguntas conserva las opciones existentes y admite Flujo, Pantalla, Investigación, UXS, Decisión y Construcción. El origen se transcribe de la columna Origen del KB; en su ausencia solo se usa el prefijo explícito del ID. Una pregunta nacida al construir se registra primero en Open questions del artefacto dueño con Origen = Construcción.

La conciliación de solo lectura compara FLW/SCR/IB con evidencia de repositorios de producto autorizados. Si hay código que referencia la HU o el FLW/SCR, propone En construcción y advierte si Notion sigue en Borrador. La rama CLF_Feature_<US> y un MR fusionado con evidencia local aportan trazabilidad; no reemplazan la prueba. Para proponer Validado exige registro de prueba con Enzo, navegador, fecha, captura existente y ARP implementado de la misma versión. Los campos y estados nunca se aplican mediante la conciliación.

## Cascada y vocabularios por base

UXR y UXS conservan Estado del documento = Borrador, En revisión, Aprobado. Paquetes de alcance usa Estado del alcance = Borrador, En preparación, Listo para selección de sprint, En sprint, Cerrado. Solo Flujos, Pantallas y Exploraciones incorporan En construcción y Validado; Aprobado se conserva por compatibilidad.

El cálculo encadena preguntas → UXR, pantallas → flujos y exploraciones, y estos → Nivel de cierre de la UXS y Estado del alcance del paquete. Un UXR solo se propone Aprobado cuando no tiene preguntas pendientes y sus flujos están construyéndose o validados; Enzo debe aprobar con approved_by. Un cambio de fuente invalida hacia abajo la vigencia, el resumen y los estados ya cerrados. Las reglas completas y límites están en arquitectura-preguntas.md §8; el script solo produce propuestas y nunca cambia propiedades, fórmulas ni estados.
