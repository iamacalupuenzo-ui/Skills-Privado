# Pantallas del flujo (FLW ↔ SCR)

## Índice

1. La regla
2. Reservar pantallas
3. Pantallas compartidas y agrupadas
4. Cómo lo comprueba la auditoría

## 1. La regla

Toda pantalla pertenece a un flujo. El flujo la declara en `screens: [SCR-NNN]` y la pantalla
declara `flow: FLW-NNN`. Si no coinciden, la compuerta G2 falla. El flujo declara; la SCR confirma.

## 2. Reservar pantallas

En la fase 2 las pantallas aún no están especificadas. El flujo:

1. Decide qué pantallas hacen falta: una por cada lugar donde el usuario se detiene a decidir o leer
   (editor, confirmación, resultado, acceso denegado). Un diálogo que cambia el contexto cuenta
   como pantalla; un aviso en línea no.
2. Toma los siguientes IDs libres en `design/screens/` de `origin/develop` y de las ramas `ux/*`.
3. Los lista en `screens` y en la tabla de la sección 4 con «Nombre propuesto» y «Base» (la SCR de
   la que parte, si reutiliza una).
4. Avisa a `ui-spec-writer` (por el orquestador) qué pantallas reservó.

`screens: []` solo se acepta con una pregunta abierta que lo explique («no se sabe si la
confirmación es pantalla propia hasta que el PO decida X»).

## 3. Pantallas compartidas y agrupadas

- Una SCR que ya pertenece a otro flujo no se vuelve a listar aquí: se enlaza en el texto («el
  ingreso es de FLW-002; este flujo no lo redibuja»).
- Un archivo puede agrupar varias pantallas (`SCR-092-094-identidad-visual-cliente.md`). El flujo
  lista cada ID por separado: `screens: [SCR-092, SCR-093, SCR-094]`.

## 4. Cómo lo comprueba la auditoría

`audit_ux.py --compuerta G2` falla si una SCR listada no existe en `design/screens/` o declara otro
flujo, y avisa si un UXR no aparece en el `requirements` de ningún flujo. Antes de la fase 3, una
SCR reservada que aún no existe aparece como error: es esperado y se cierra cuando `ui-spec-writer`
la especifica. No se borra la reserva para que la auditoría pase.
