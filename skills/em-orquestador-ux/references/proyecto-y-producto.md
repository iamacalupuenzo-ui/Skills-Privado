# Proyecto y producto: dos relaciones distintas

Leer al cargar un paquete, sus historias o sus documentos de diseño en Notion, y cuando una
página no aparece en su vista. Regla de Enzo (2026-11-26).

La jerarquía en Notion es **Proyecto → Producto → Paquete (DSP) → Historia (HU)**. Ejemplo: el proyecto «CL2 Flotas» tiene los productos «CL2 Flotas», «Piloto de CL2 Flotas», «CL2 SVR Captura y Recupero» y los dos Design System.

- **Paquetes e historias** llevan solo **Producto**; el proyecto les llega por el producto. Una historia lleva el producto de su paquete.
- **Tareas** llevan las dos relaciones, **Proyecto y Producto**, las del paquete que las origina.
- Si una página no aparece en una vista, lo primero que se revisa es su Producto (caso real: HU-01-14 seguía en el Piloto y no se veía junto a HU-01-16).
- **Si hay duda, no se adivina: se pregunta con opciones** (herramienta de preguntas, con las alternativas de la base Productos y su proyecto). Hay duda cuando el paquete no tiene producto o tiene más de uno, cuando el producto no tiene un único proyecto, o cuando la historia ya está en otro producto. `cargar-paquete.js` las devuelve en `dudas` (sale con código 3) y no cambia esa relación; con la respuesta se repite con `--producto <id>` o `--confirmar-producto`.
- **Documentos de diseño (UXR, FLW, SCR):** los carga `lote-doc.js`, que toma el producto de sus paquetes y levanta la misma duda. Un UXR que nombra su paquete en `sources` solo se relaciona con ese paquete y sus historias; las demás historias que cita son fuentes que reutiliza (UXR-139 cita HU-01-09 y no es del DSP-001).
- **Un UXR reutilizado por un paquete nuevo se mueve a ese paquete y a su producto,** conservando la relación con el paquete anterior como antecedente (Enzo, 2026-11-26: UXR-010 a 014 pasaron de DSP-001 al DSP-009). En la KB se agrega el paquete nuevo a `sources`; la carga va con `--confirmar-producto=nuevo`.
- **Las historias se resuelven por ID y Catálogo** («RCP-001 CL2 Flotas»): el mismo ID existe en el catálogo SVR, y sin el filtro la relación queda duplicada. La carga suma relaciones y no quita las que ya existen.
