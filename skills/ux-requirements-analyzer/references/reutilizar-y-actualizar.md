# Reutilizar y actualizar

## Índice

1. Antes de crear: buscar
2. Actualizar un UXR
3. Contrastar con lo construido
4. Avisos de impacto

## 1. Antes de crear: buscar

```bash
git -C <kb> grep -l "HU-01-14" origin/develop -- design/ux-requirements/
git -C <kb> grep -l "dsp-009" origin/develop -- design/ux-requirements/
```

Si un UXR existente ya cubre la capacidad en otro nivel o plataforma (por ejemplo, la identidad
del Distribuidor cuando llega la del Cliente), el nuevo UXR **reutiliza y remite**: copia solo lo
propio del nivel y enlaza al existente en `sources` y `# Traceability`. No duplica sus estados ni
sus criterios.

## 2. Actualizar un UXR

Cuando cambia una historia, una regla, una decisión o llega una respuesta del PO:

1. Se edita el UXR existente; el ID no cambia (B5).
2. Lo sustituido no se borra: se marca «sustituida el AAAA-MM-DD por <fuente>» junto al texto
   vigente, o se mueve al historial si ya no aporta.
3. La pregunta que se respondió cambia su estado con la fuente de la respuesta.
4. Se agrega la fila en `# Historial` (más reciente arriba).
5. `generated.at` se actualiza; `status` sigue en `draft`.
6. Si el cambio afecta a un FLW o a una SCR, se avisa al orquestador para que enrute el
   hallazgo a su dueño; el analista no edita FLW ni SCR.

## 3. Contrastar con lo construido

Si Desarrollo ya construyó la funcionalidad, manda lo construido para estructura y flujo (decisión
de Enzo). El UXR:

- describe lo que la historia pide y señala en `## En 30 segundos` qué difiere en lo construido,
  con la referencia (US, archivo y línea si se conoce);
- convierte cada diferencia en criterio (si lo construido cumple) o en pregunta (si contradice
  una fuente o falta algo);
- no pide rehacer lo construido por preferencia de diseño.

## 4. Avisos de impacto

Si el UXR cambia algo que otra área debe saber (Arquitectura, Desarrollo, QA, Seguridad), se
emite el aviso en `avisos/<area-tematica>` según DH-307 (RCP-001), en el mismo cambio. Editar el
UXR sin el aviso deja a esa área trabajando con lo anterior.
