# Esquema de las bases de Notion que usa el módulo

IDs en `config.json`. Página «Bases» = f9d1a7d0-6388-83c4-a478-813ede66ea64 (una página por base). Workspace «Gestión Operativa». Proyecto «CL2 Flotas» → producto «Piloto de CL2 Flotas».

## Propiedades comunes a las bases de repo
ID (texto, clave de carga), Ruta en el repo, Enlace GitLab, Última carga, Producto (relación); y en las de documentos: Estado del documento (Borrador, En revisión, Aprobado), Aprobado por y Fecha de aprobación (solo humano).

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
