# Leer Notion (solo lectura) al responder una consulta

Leer en la fase 2. Objetivo: saber qué dice Notion sobre las preguntas y pantallas que toca la consulta, sin escribir nada. La escritura es de `ux-decision-aplicar`.

## Cuándo aplica

Cuando existe el módulo Notion del `em-orquestador-ux` (`notion/config.json` con `"activo": true`; su ruta de instalación puede variar por equipo: buscar `em-orquestador-ux/notion/config.json`). Si Enzo dijo «sin Notion», se omite.

## Vías de acceso, en este orden

1. **Conector MCP de Notion** (herramientas `mcp__notion__API-*` o equivalentes): no necesita el token del módulo. Cargarlas con la búsqueda de herramientas diferidas antes de usarlas.
2. **Scripts del módulo** (`conciliar-kb-notion.js`, etc.): leen el token de `~/.notion/token.txt`. Si ese archivo no existe en este equipo, no hay scripts; no pedir el token por chat ni imprimirlo.
3. Sin ninguna: decir «Notion sin acceso» en el cierre y seguir con la KB.

## Cómo consultar

- Los ids de las bases salen de `config.json` → `bases.<Base>.data_source`. Valores vistos el 2026-11-27 (verificar vigencia): Preguntas `9811a7d0-6388-829a-82b4-0735e973e46b`, Pantallas `a101a7d0-6388-8200-ace3-0747fc33b0fb`, Decisiones `9251a7d0-6388-8371-8107-070e3b5bd50a`.
- En **Preguntas** y **Pantallas** la clave de carga se llama `ID` (texto), no `Name`: filtrar con `{"property":"ID","rich_text":{"equals":"UXR-124-Q2"}}` o `contains`. El título (`Nombre`) lleva «ID · pregunta».
- Pedir pocas propiedades (`filter_properties` con los ids de propiedad) o la respuesta es enorme. Las propiedades útiles: `ID`, `Estado`, `Respuesta`, `Decidido por`, `Fecha de decisión` (Preguntas); `Estado del documento`, `Aprobado por`, `Fecha de aprobación` (Pantallas).
- Un `filter_properties` con el id de una propiedad que no existe en esa base da error de esquema: leer la base (`retrieve data source`) si hace falta.

## Qué comparar con la KB

| En Notion | En el KB | Si difieren |
|---|---|---|
| Pregunta `Abierta` | Fila del UXR «Respondida» | Se cita la fuente del KB y se anota «Notion por actualizar» |
| Pregunta `Decidida` | Fila del UXR abierta | El KB está desfasado: se anota para corregir |
| Pantalla `Borrador` | SCR `accepted` | Se anota «Notion por actualizar» |

No se corrige Notion aquí. Las diferencias van al informe y las resuelve `ux-decision-aplicar` cuando Enzo decida.

## Estados de Pantallas, para no malinterpretarlos

Flujos, Pantallas y Exploraciones recorren Borrador → En revisión → En construcción → Validado. «Aprobado» existe por compatibilidad. «Validado» exige prueba de Enzo en el navegador, captura y accesibilidad verificada: no se presume. El estado de un SCR del KB (`accepted`) se guarda **por archivo** y cubre todas las pantallas que ese archivo agrupa.
