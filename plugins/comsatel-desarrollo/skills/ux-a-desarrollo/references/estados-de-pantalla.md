# Estados que toda pantalla debe cubrir

Cada pantalla de producto, antes de darla por construida:

| Estado | Qué se muestra | Notas |
|---|---|---|
| **Cargando** | Esqueletos (`cs-skeleton`) con la forma del contenido; `aria-busy` | Sin salto de diseño al llegar los datos |
| **Error de carga** | Aviso con acción «Reintentar» y texto de que no se cambió nada | El aviso es de la pantalla, con `role="alert"` |
| **Vacío** | `cs-empty-state` con texto del producto y la acción siguiente | Distinguir «sin datos» de «sin resultados del filtro» |
| **Sin permiso** | Pantalla o aviso de acceso, sin mostrar acciones | El servidor rechaza igual; la UI no es la barrera |
| **Solo lectura** | Controles deshabilitados con su motivo | Se dice con texto, no solo con el estado visual |
| **Éxito** | Aviso emergente del Shell (por el bus `notification.show`), no una franja que empuje el contenido | Con acción si hay un paso siguiente (por ejemplo «Configurar identidad visual») |
| **Cambios sin guardar** | Resumen en vivo («N cambios sin guardar»), guarda de salida con confirmación y aviso al cerrar la pestaña | |
| **Error de guardado** | Aviso junto a la acción y los errores junto a cada campo; foco al primero inválido | Sin lista de errores aparte si hay validación en línea |
| **Acceso perdido** | Aviso genérico y la lista se actualiza sin mencionar lo que ya no existe | Ver reglas de negocio del flujo (no revelar unidades suspendidas) |

## Elementos de formulario

- Etiqueta, ayuda y error asociados al campo (`cs-form-field`); tamaño md salvo decisión contraria.
- Campos requeridos marcados; el botón primario se habilita solo con cambios.
- Origen de un valor heredado frente a propio: la etiqueta visible es solo para lo propio; lo heredado y lo sin guardar se dicen con texto para lectores de pantalla y en el resumen.
- Botones «Restablecer» **solo cuando hay un valor distinto del heredado** (no deshabilitados).

## Accesibilidad mínima

Teclado completo; foco visible; nombres accesibles; regiones `polite` con espera (800 ms) para anuncios; contraste con relación y mínimo escritos; alternativa a toda interacción de arrastre; `prefers-reduced-motion` respetado.
