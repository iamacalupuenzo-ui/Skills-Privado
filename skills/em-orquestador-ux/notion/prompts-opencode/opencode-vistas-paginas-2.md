Eres un operador de Notion que usa SOLO el servidor MCP oficial de Notion (workspace «Gestión Operativa»). No edites ni borres ninguna página ni fila; solo creas o corriges vistas. Haz las llamadas una por una, sin resumir ni detenerte hasta terminar toda la lista.

Para CADA página de la lista, crea con notion-create-view y el parámetro parent_page_id (id de la página) una vista enlazada de la base «Preguntas» (data source collection://9811a7d0-6388-829a-82b4-0735e973e46b, database_id 2b91a7d0-6388-8201-afe0-81fea03528a0): tipo tabla, nombre «Preguntas de esta página», filtro: la relación indicada contiene esa página (usa como valor la URL https://app.notion.com/p/<page_id sin guiones>) Y Duplicada no marcada; agrupada por Estado (select; NO agrupes por Situación, que es una fórmula y no se puede); mostrar ID, Nombre, Situación, Responsable y Prioridad; ordenar por ID ascendente. Si una página ya tiene una vista llamada «Preguntas de esta página», no la dupliques: informa y sigue. No cambies nada más de la página.

Lista (pantallas SCR-001 a SCR-008):
- SCR-001 (pantalla): page_id 3fb1a7d0-6388-81c7-a50d-d960885aa86a; relación de Preguntas = «Pantallas»
- SCR-002 (pantalla): page_id 3fb1a7d0-6388-8109-94fc-e9c1dca9f00b; relación de Preguntas = «Pantallas»
- SCR-003 (pantalla): page_id 3fb1a7d0-6388-8138-9167-c3eb1637d25f; relación de Preguntas = «Pantallas»
- SCR-004 (pantalla): page_id 3fb1a7d0-6388-8116-ae0f-d72230fb3965; relación de Preguntas = «Pantallas»
- SCR-005 (pantalla): page_id 3fb1a7d0-6388-81ba-b8fa-c30df2912f13; relación de Preguntas = «Pantallas»
- SCR-006 (pantalla): page_id 3fb1a7d0-6388-8161-9004-fe324d968919; relación de Preguntas = «Pantallas»
- SCR-007 (pantalla): page_id 3fb1a7d0-6388-817f-9515-c7c3cb86f43b; relación de Preguntas = «Pantallas»
- SCR-008 (pantalla): page_id 3fb1a7d0-6388-819c-87a3-f4a08e3b0972; relación de Preguntas = «Pantallas»

Informe final (SOLO esto): una línea por página con el id, «hecha» o el error exacto y la URL de la vista; al final, cuántas se crearon y cuántas fallaron.
