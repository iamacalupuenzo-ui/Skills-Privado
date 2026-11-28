Eres un operador de Notion que usa SOLO el servidor MCP oficial de Notion (workspace «Gestión Operativa»). No edites ni borres ninguna página ni fila; solo creas vistas.

Base «Preguntas»: database_id 2b91a7d0-6388-8201-afe0-81fea03528a0, data source collection://9811a7d0-6388-829a-82b4-0735e973e46b. Propiedades útiles: ID, Nombre, Prioridad, Responsable (multi-select), Quién puede responder, Estado, Vigencia, Duplicada (casilla), Situación (fórmula de texto: «Bloquea el diseño», «Por confirmar», «Abierta, no bloquea», «Resuelta», «Descartada», «Duplicada»), y relaciones Historias, Requerimientos UX, Flujos, Pantallas, Exploraciones. Ya existe la vista «Bloquean el diseño»; no la repitas.

PARTE A. Crea estas vistas de TABLA en la base (parámetro database_id), una por una. Mostrar siempre: ID, Nombre, Prioridad, Responsable, Quién puede responder, Estado (más Vigencia donde se indica). Ordenar por ID ascendente.
 1. «Por situación»: sin filtro (excluye solo duplicadas: Duplicada no marcada); agrupar por Situación.
 2. «Por confirmar»: filtro Situación = «Por confirmar»; agrupar por Responsable.
 3. «Revisar por cambio de fuente»: filtro Vigencia = «Revisar por cambio de fuente»; sin agrupar; mostrar también Vigencia.
 4. «Por flujo»: Duplicada no marcada; agrupar por Flujos y subagrupar por Situación.
 5. «Por pantalla»: Duplicada no marcada; agrupar por Pantallas y subagrupar por Situación.
 6. «Por exploración»: Duplicada no marcada; agrupar por Exploraciones y subagrupar por Situación.
 7. «Por historia»: Duplicada no marcada; agrupar por Historias y subagrupar por Situación.
Si la herramienta no admite subagrupar por una propiedad, agrupa solo por la primera y dilo.

PARTE B (prueba de vista enlazada dentro de una página). En la página de la pantalla SCR-013 (page id 3fb1a7d0-6388-8140-a940-dda4be025f0d) crea con el parámetro parent_page_id una vista enlazada de la base «Preguntas» llamada «Preguntas de esta pantalla», de tipo tabla, filtrada para que la relación Pantallas contenga esa página (usa la URL o el id de la página en el filtro de la relación), agrupada por Situación, mostrando ID, Nombre, Estado y Prioridad. No cambies nada más de la página.

PARTE C. Vuelve a obtener (notion-fetch) cada vista creada y confirma su filtro, agrupación y propiedades reales. Para la vista de la PARTE B, ejecútala con notion-query-data-sources en modo vista y dime cuántas preguntas devuelve (se espera 21).

Informe final (SOLO esto): una tabla con nombre de vista, tipo, filtro real, agrupación real y estado (hecha o error exacto); el resultado de la PARTE B y su conteo; y cualquier limitación que encontraste.
