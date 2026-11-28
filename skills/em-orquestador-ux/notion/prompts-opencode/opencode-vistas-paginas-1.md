Eres un operador de Notion que usa SOLO el servidor MCP oficial de Notion (workspace «Gestión Operativa»). No edites ni borres ninguna página ni fila; solo creas o corriges vistas. Haz las llamadas una por una, sin resumir ni detenerte hasta terminar toda la lista.

PARTE 0 (corrección de dos vistas ya creadas, con notion-update-view):
 a) La vista «Por situación» de la base «Preguntas» (view://3fd1a7d0-6388-81b6-8247-000ccfe99fe4): añade GROUP BY «Estado» (propiedad de tipo select) y mostrar también «Situación». 
 b) La vista «Preguntas de esta pantalla» de la página SCR-013 (view://3fd1a7d0-6388-8193-a0a3-000c73d6acba): cambia la agrupación a GROUP BY «Estado» y muestra también «Situación».

Para CADA página de la lista, crea con notion-create-view y el parámetro parent_page_id (id de la página) una vista enlazada de la base «Preguntas» (data source collection://9811a7d0-6388-829a-82b4-0735e973e46b, database_id 2b91a7d0-6388-8201-afe0-81fea03528a0): tipo tabla, nombre «Preguntas de esta página», filtro: la relación indicada contiene esa página (usa como valor la URL https://app.notion.com/p/<page_id sin guiones>) Y Duplicada no marcada; agrupada por Estado (select; NO agrupes por Situación, que es una fórmula y no se puede); mostrar ID, Nombre, Situación, Responsable y Prioridad; ordenar por ID ascendente. Si una página ya tiene una vista llamada «Preguntas de esta página», no la dupliques: informa y sigue. No cambies nada más de la página.

Lista (flujos, exploraciones, especificación y paquete):
- FLW-001 (flujo): page_id 3fb1a7d0-6388-8175-a376-da504fa121a1; relación de Preguntas = «Flujos»
- FLW-002 (flujo): page_id 3fb1a7d0-6388-8157-827f-dcbef2277ed6; relación de Preguntas = «Flujos»
- FLW-003 (flujo): page_id 3fb1a7d0-6388-81a9-ab8e-f2422cf2f13d; relación de Preguntas = «Flujos»
- FLW-004 (flujo): page_id 3fb1a7d0-6388-81de-9efe-f1c6ff32ed35; relación de Preguntas = «Flujos»
- FLW-005 (flujo): page_id 3fb1a7d0-6388-817a-80f4-f3c09b50bc09; relación de Preguntas = «Flujos»
- IB-001 (exploración): page_id 3fb1a7d0-6388-8134-bf2c-dbc4172d3cfe; relación de Preguntas = «Exploraciones»
- IB-002 (exploración): page_id 3fb1a7d0-6388-81c2-8756-e5b87f82a4f0; relación de Preguntas = «Exploraciones»
- IB-003 (exploración): page_id 3fb1a7d0-6388-8177-b28e-d95275932d7b; relación de Preguntas = «Exploraciones»
- IB-004 (exploración): page_id 3fb1a7d0-6388-811f-888f-c245f95dc2ca; relación de Preguntas = «Exploraciones»
- IB-005 (exploración): page_id 3fb1a7d0-6388-8114-aa30-c8f0b725b4c7; relación de Preguntas = «Exploraciones»
- UXS-001 (especificación): page_id 3fd1a7d0-6388-812f-8e5f-deeccd7cf128; relación de Preguntas = «Especificaciones UX»
- DSP-001 (paquete de alcance): page_id 3fb1a7d0-6388-8163-912a-c88b9bb9653d; relación de Preguntas = «Paquetes de alcance»

Informe final (SOLO esto): una línea por página con el id, «hecha» o el error exacto y la URL de la vista; al final, cuántas se crearon y cuántas fallaron.
