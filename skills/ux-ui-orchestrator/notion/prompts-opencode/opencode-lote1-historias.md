Eres el ejecutor de subida a Notion. Usa SOLO el servidor MCP de Notion. Trabaja únicamente en la base «Historias» (data source collection://4951a7d0-6388-820e-8c76-87b77818bc9f, base dentro de la página «Historias» de «Bases»). No toques ninguna otra base, no borres propiedades ni filas, no cambies ningún campo que no se nombre aquí. Si algo falla, anota el error exacto y detente en ese paso: no improvises.

Contexto: «Historias» es un índice (ID, ruta y enlace al repo; sin contenido). Los IDs HU-xx-yy se repiten entre catálogos distintos del repo (RCP-001 CL2 Flotas y RCP-002 SVR captura y recupero), por eso hace falta una propiedad «Catálogo».

## Paso 1 — Esquema
Añade a «Historias» la propiedad «Catálogo» de tipo select con dos opciones: «RCP-001 CL2 Flotas» y «RCP-002 CL2 SVR captura y recupero».

## Paso 2 — Actualizar 5 filas existentes
Para cada página: pon «Catálogo» = «RCP-001 CL2 Flotas» y «Última carga» = 2026-10-16. No cambies nada más.
- HU-01-01: 3fb1a7d0-6388-81cf-9c88-fa9f56807e9e
- HU-01-09: 3fb1a7d0-6388-8151-adf5-d2231b6ed445
- HU-02-01: 3fb1a7d0-6388-8188-a5c1-fac4009cba8f
- HU-02-02: 3fb1a7d0-6388-811e-89d0-fce08c745c0c
- HU-07-02: 3fb1a7d0-6388-819f-838f-d8a49ff0d001

## Paso 3 — Crear 1 fila nueva (comprueba antes que no existe una con ID HU-01-14 en «Historias»)
- Nombre: HU-01-14 — Personalizar la identidad visual del Cliente
- ID: HU-01-14
- Catálogo: RCP-001 CL2 Flotas
- Ruta en el repo: requirements/context-packs/user-stories/HU-01-14-personalizar-identidad-visual-cliente.md
- Enlace GitLab: https://project.comsatel.com.pe/comsatel/development/products/clocator2/knowledge-base/-/blob/develop/requirements/context-packs/user-stories/HU-01-14-personalizar-identidad-visual-cliente.md
- Última carga: 2026-10-16
- Producto: relación a la página «Piloto de CL2 Flotas» (3fb1a7d0-6388-814e-8cce-f48a414b5cf2)
No la enlaces a ningún Paquete de alcance (es una dependencia, no parte del paquete DSP-001).

## Informe final
Responde SOLO con: lo hecho en cada paso, el URL o id de la fila nueva, y los errores exactos si hubo alguno.
