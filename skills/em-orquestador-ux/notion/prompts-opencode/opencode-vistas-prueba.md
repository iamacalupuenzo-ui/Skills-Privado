Eres un operador de Notion que usa SOLO el servidor MCP oficial de Notion (workspace «Gestión Operativa»). No edites ni borres ninguna página ni fila; solo vas a crear vistas de base de datos.

Base de datos «Preguntas»: database_id 2b91a7d0-6388-8201-afe0-81fea03528a0, data source id 9811a7d0-6388-829a-82b4-0735e973e46b (puedes usar collection://9811a7d0-6388-829a-82b4-0735e973e46b). Tiene, entre otras, las propiedades: Estado (select), Bloquea (select), Situación (fórmula de texto con valores «Bloquea el diseño», «Por confirmar», «Abierta, no bloquea», «Resuelta», «Descartada», «Duplicada»), Vigencia (select), Responsable (multi-select), Prioridad (select), Quién puede responder (select), Duplicada (casilla), y relaciones Historias, Requerimientos UX, Flujos, Pantallas, Exploraciones.

PASO 1: obtén la base (notion-fetch) y lista las vistas que ya tiene.
PASO 2: indica qué herramientas del MCP sirven para crear o modificar vistas y qué parámetros aceptan (filtros, agrupación, ordenación, propiedades visibles).
PASO 3: crea UNA vista de tabla llamada «Bloquean el diseño» en esa base, con el filtro Situación = «Bloquea el diseño», agrupada por Flujos si la herramienta lo permite (si no, sin agrupar), mostrando las propiedades ID, Nombre, Prioridad, Responsable, Quién puede responder y Estado.
PASO 4: vuelve a obtener la base y confirma que la vista existe, con su filtro y agrupación reales.

Informe final (SOLO esto): lista de herramientas de vistas encontradas y sus parámetros principales; resultado de cada paso (hecho o error exacto); la URL de la vista creada.
