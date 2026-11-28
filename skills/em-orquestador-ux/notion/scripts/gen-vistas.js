// Genera los prompts de opencode para crear las vistas enlazadas de «Preguntas» dentro de cada página principal.
const fs = require("fs");
const pag = f => Object.fromEntries(require("./" + f).filter(x => x.page).map(x => [x.id, x.page]));
const FLW = pag("flw/resumen.json"), SCR = pag("scr/resumen.json"), IB = pag("ib/resumen.json");
const grupos = [
  { n: 1, titulo: "flujos, exploraciones, especificación y paquete", items: [
    ...Object.entries(FLW).sort().map(([id, p]) => ({ id, p, rel: "Flujos", tipo: "flujo" })),
    ...Object.entries(IB).sort().map(([id, p]) => ({ id, p, rel: "Exploraciones", tipo: "exploración" })),
    { id: "UXS-001", p: "3fd1a7d0-6388-812f-8e5f-deeccd7cf128", rel: "Especificaciones UX", tipo: "especificación" },
    { id: "DSP-001", p: "3fb1a7d0-6388-8163-912a-c88b9bb9653d", rel: "Paquetes de alcance", tipo: "paquete de alcance" },
  ] },
  { n: 2, titulo: "pantallas SCR-001 a SCR-008", items: Object.entries(SCR).sort().slice(0, 8).map(([id, p]) => ({ id, p, rel: "Pantallas", tipo: "pantalla" })) },
  { n: 3, titulo: "pantallas SCR-009 a SCR-015", items: Object.entries(SCR).sort().slice(8).map(([id, p]) => ({ id, p, rel: "Pantallas", tipo: "pantalla" })) },
];
for (const g of grupos) {
  const lista = g.items.map(i => "- " + i.id + " (" + i.tipo + "): page_id " + i.p + "; relación de Preguntas = «" + i.rel + "»").join("\n");
  const prefacio = g.n === 1 ? `
PARTE 0 (corrección de dos vistas ya creadas, con notion-update-view):
 a) La vista «Por situación» de la base «Preguntas» (view://3fd1a7d0-6388-81b6-8247-000ccfe99fe4): añade GROUP BY «Estado» (propiedad de tipo select) y mostrar también «Situación». 
 b) La vista «Preguntas de esta pantalla» de la página SCR-013 (view://3fd1a7d0-6388-8193-a0a3-000c73d6acba): cambia la agrupación a GROUP BY «Estado» y muestra también «Situación».
` : "";
  const txt = `Eres un operador de Notion que usa SOLO el servidor MCP oficial de Notion (workspace «Gestión Operativa»). No edites ni borres ninguna página ni fila; solo creas o corriges vistas. Haz las llamadas una por una, sin resumir ni detenerte hasta terminar toda la lista.
${prefacio}
Para CADA página de la lista, crea con notion-create-view y el parámetro parent_page_id (id de la página) una vista enlazada de la base «Preguntas» (data source collection://9811a7d0-6388-829a-82b4-0735e973e46b, database_id 2b91a7d0-6388-8201-afe0-81fea03528a0): tipo tabla, nombre «Preguntas de esta página», filtro: la relación indicada contiene esa página (usa como valor la URL https://app.notion.com/p/<page_id sin guiones>) Y Duplicada no marcada; agrupada por Estado (select; NO agrupes por Situación, que es una fórmula y no se puede); mostrar ID, Nombre, Situación, Responsable y Prioridad; ordenar por ID ascendente. Si una página ya tiene una vista llamada «Preguntas de esta página», no la dupliques: informa y sigue. No cambies nada más de la página.

Lista (${g.titulo}):
${lista}

Informe final (SOLO esto): una línea por página con el id, «hecha» o el error exacto y la URL de la vista; al final, cuántas se crearon y cuántas fallaron.
`;
  fs.writeFileSync("opencode-vistas-paginas-" + g.n + ".md", txt);
  console.log("grupo", g.n, g.items.length, "páginas");
}
