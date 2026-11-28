# Reglas

## Índice

1. Reglas de bloqueo en detalle
2. Racionalizaciones comunes
3. Señales de alerta

## 1. Reglas de bloqueo en detalle

| Regla | Qué exige | Por qué |
|---|---|---|
| B1 | Informe de inicio del ciclo antes de escribir y sincronización comprobada al cerrar | Sin informe de otro agente, el analista valida su propio trabajo |
| B2 | Cada UXR cita HU existentes y sus AC; `audit_ux.py` lo comprueba | Un UXR sin historia es diseño inventado |
| B3 | Cada afirmación con fuente o clasificación (`clasificacion-y-fuentes.md`) | QA y Desarrollo deben distinguir regla de propuesta |
| B4 | Vacío de negocio → pregunta al PO | El PO decide alcance, permisos y datos |
| B5 | Se edita el UXR existente; IDs permanentes; lo sustituido se fecha | Los FLW, SCR y la UXS apuntan a esos IDs |
| B6 | Sin colores, medidas ni componentes | Eso es de la SCR y del DS; en el UXR envejece mal |
| B7 | `status: draft`; nunca `approved` ni `verified` | La aprobación es humana |
| B8 | Etiqueta `dsp-NNN` | Sin ella el UXR no entra al inventario de la UXS |
| B9 | Comentario al analista, no edición de la HU | La historia es del analista de negocio |
| B10 | Aviso de impacto en `avisos/` si afecta a otra área | DH-307 lo exige al tocar la KB |

## 2. Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Es obvio que el Cliente no ve la marca de otro Distribuidor» | Escríbelo como inferencia con su base (BR-239). Lo obvio para ti no lo es para QA (B3). |
| «El PO tarda; pongo lo más razonable y avanzo» | Pon la propuesta en la pregunta y marca si bloquea; avanzar no exige decidir por él (B4). |
| «Es más rápido un UXR nuevo que entender el viejo» | Rompe los enlaces de los FLW y SCR que lo citan (B5). |
| «Pongo el color de la marca para que se entienda» | El UXR dice qué se muestra; el color lo resuelve el token en la SCR (B6). |
| «La historia está mal, la corrijo yo» | Se le propone un comentario al analista; el UXR registra la brecha (B9). |
| «Ya está construido; copio lo que hace el front» | Se contrasta con la historia: lo que difiere es criterio o pregunta, no copia. |
| «El aviso lo manda otro» | Si tu cambio lo genera, el aviso va en tu mismo cambio (B10). |

## 3. Señales de alerta

- Un UXR sin `# Open questions` o con todas cerradas el mismo día que se creó.
- Criterios con «adecuado», «claro», «intuitivo» o «rápido» sin medida.
- Un hex, un tamaño en píxeles o el nombre de un componente `cs-*` en el cuerpo.
- `status` distinto de `draft` sin una aprobación humana registrada.
- Dos UXR con el mismo título o la misma historia y capacidad.
- Siglas en el cuerpo que no están en `sources`.
