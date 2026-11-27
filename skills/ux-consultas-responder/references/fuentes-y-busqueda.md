# Fuentes y búsqueda: dónde buscar la respuesta a una consulta de UX

Leer antes de buscar. Orden de búsqueda y qué cuenta como «ya respondido».

## 0. Resolver el árbol correcto

El árbol local suele ir atrás de `origin/develop`. En `origin/develop` (2026-11-27) la estructura es:

| Qué | Dónde (nuevo) | Dónde (antiguo, árbol sin actualizar) |
|---|---|---|
| Decisiones de UX | `decisions/ux-ui/decisiones/DEC-NNN-*.md` | `design/decisiones/` |
| Respuestas a consultas | `questions/design/consultas/RSP-UX-*.md` | `design/consultas/` |
| Catálogo de preguntas | `questions/design/consultas/catalogo/` | no existe |
| Avisos de impacto | `avisos/management/AVS-DSP-NNN-*.md` | no existe |
| Requisitos UX, pantallas, flujos, UXS | `design/ux-requirements`, `design/screens`, `design/user-flows`, `design/specs` | igual |
| Decisiones de otras áreas | `architecture/adrs/ADR-NNN.md`, `requirements/context-packs/RCP-001-*.md` (DH-NNNN), `management/projects/MCP-DSP-NNN.md` | igual |

**Árbol atrás y con cambios sin guardar:** no hacer `pull` (pisa o choca con el trabajo de Enzo). Crear un worktree limpio de solo lectura: `git fetch origin` y `git worktree add --detach <carpeta temporal> origin/develop`; buscar ahí y retirarlo al terminar con `git worktree remove`. Probado el 2026-11-27: el árbol local estaba 1.973 commits atrás con 53 archivos modificados.

Si `questions/` o `decisions/` no existen en el árbol local, buscar con `git grep <término> origin/develop -- <ruta>` y `git show origin/develop:<ruta>`, y decirlo en el informe. No concluir «no hay respuesta» sobre un árbol desactualizado.

## 1. Orden de búsqueda (parar cuando la respuesta sea completa)

1. **Grafo:** si existe `graphify-out/graph.json`, `graphify query "<pregunta>"`; luego `graphify explain "<concepto>"` o `graphify path "<A>" "<B>"`. Acota; no reemplaza leer la fuente.
2. **IDs citados en la consulta:** abrir cada DEC, UXR, SCR, FLW, UXS, HU, DH, ADR, MCP que nombre. Las consultas de QA los citan con su ruta.
3. **Tablas «Open questions» de los UXR** (`UXR-NNN-Qn`): una fila con «Respondida AAAA-MM-DD (área)» es respuesta citada.
4. **Decisiones:** `git grep -n -i "<término clave>" -- decisions design/decisiones` y leer la fila D# completa, con su estado (`draft` o `accepted`).
5. **RSP anteriores:** `questions/design/consultas/RSP-UX-*` y `RSP-*` de otras áreas sobre el mismo DSP. Una respuesta previa se cita, no se repite ni se contradice sin decirlo.
6. **Decisiones de otras áreas:** ADR (arquitectura), DH en RCP-001 (PO/AF), MCP-DSP (AF), `changelog.md`.
7. **Notion** (solo lectura, ver `notion-lectura.md`): la fila de la pregunta o de la pantalla; si difiere del KB, se anota.
8. **Código construido** (solo si la consulta pregunta por lo construido): repos `microui-*` y `web-*`, ramas `integration` o la que cite la consulta. Se verifica leyendo, no se supone. Si no hay acceso al repositorio, queda «sin verificar».

## 2. Qué cuenta como respondido

Una pregunta está respondida solo si una fuente de la KB, ya existente, dice lo que la pregunta necesita, **con su estado**:

- `accepted` o fila «Respondida» con responsable y fecha: respondida firme.
- `draft`, «propuesta», «falta confirmar»: **no** está respondida; es una propuesta que Enzo debe confirmar. Se cita y se pide confirmar.
- Una fuente que responde otra pregunta parecida: no cuenta. Citarla como contexto.
- Dos fuentes que se contradicen: no elegir. Mostrar ambas con su fecha y estado y marcarlo como decisión de Enzo.

## 3. Detectar documentos desactualizados

Al buscar se descubren desajustes (un UXR que dice una cosa y una DEC posterior otra). No se corrigen dentro de la respuesta: se listan en «Para tu conocimiento» y se corrigen en modo `ux-decision-aplicar` cuando Enzo lo pida. Ejemplo real: la consulta CQA-DSP-005-51 enumera seis (UXR-124-Q2, UXR-129 «N errores», etc.).

## 4. Ejemplo resuelto: punto 1 de CQA-DSP-005-51

Pregunta: ¿rige DEC-100 con ADR-042 cuando el servicio de direcciones no responde?

Búsqueda: DEC-100 (`draft`, textos «provisional»), UXR-129-Q4 (fila «Respondida 2026-11-20, Arquitectura, ADR-042»: 200/404/503 por `telemetria`), UXR-128 (tabla de estados), código en `microui-bo-tenants`.

Resultado correcto: **parcialmente respondida.** Arquitectura ya cerró el servicio (ADR-042, firme); lo que sigue abierto es de UX: si los dos textos de DEC-100 siguen vigentes con 404 y 503 (DEC-100 es `draft`). Etiqueta: «Otra área (cerrado)» para el servicio y «Decisión de Enzo» para los textos, con opciones A/B/C y recomendación. No se marca respondida.
