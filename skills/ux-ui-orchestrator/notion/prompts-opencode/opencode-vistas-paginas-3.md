Eres un operador de Notion que usa SOLO el servidor MCP oficial de Notion (workspace «Gestión Operativa»). No edites ni borres ninguna página ni fila; solo creas o corriges vistas. Haz las llamadas una por una, sin resumir ni detenerte hasta terminar toda la lista.

Para CADA página de la lista, crea con notion-create-view y el parámetro parent_page_id (id de la página) una vista enlazada de la base «Preguntas» (data source collection://9811a7d0-6388-829a-82b4-0735e973e46b, database_id 2b91a7d0-6388-8201-afe0-81fea03528a0): tipo tabla, nombre «Preguntas de esta página», filtro: la relación indicada contiene esa página (usa como valor la URL https://app.notion.com/p/<page_id sin guiones>) Y Duplicada no marcada; agrupada por Estado (select; NO agrupes por Situación, que es una fórmula y no se puede); mostrar ID, Nombre, Situación, Responsable y Prioridad; ordenar por ID ascendente. Si una página ya tiene una vista llamada «Preguntas de esta página», no la dupliques: informa y sigue. No cambies nada más de la página.

Lista (pantallas SCR-009 a SCR-015):
- SCR-009 (pantalla): page_id 3fb1a7d0-6388-811a-9ed9-c5dd759c9c02; relación de Preguntas = «Pantallas»
- SCR-010 (pantalla): page_id 3fb1a7d0-6388-8122-95e8-f274418b369a; relación de Preguntas = «Pantallas»
- SCR-011 (pantalla): page_id 3fb1a7d0-6388-81fe-a173-c59db64a9dec; relación de Preguntas = «Pantallas»
- SCR-012 (pantalla): page_id 3fb1a7d0-6388-81aa-b0ec-eee87042560d; relación de Preguntas = «Pantallas»
- SCR-013 (pantalla): page_id 3fb1a7d0-6388-8140-a940-dda4be025f0d; relación de Preguntas = «Pantallas»
- SCR-014 (pantalla): page_id 3fb1a7d0-6388-812e-823f-cccdab974771; relación de Preguntas = «Pantallas»
- SCR-015 (pantalla): page_id 3fb1a7d0-6388-81e1-9d38-e415d1bacbcd; relación de Preguntas = «Pantallas»

Informe final (SOLO esto): una línea por página con el id, «hecha» o el error exacto y la URL de la vista; al final, cuántas se crearon y cuántas fallaron.
