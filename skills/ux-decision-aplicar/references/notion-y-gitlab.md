# Notion y GitLab al cerrar una decisión

Leer en las fases 5 y 6. Todo lo de aquí es visible para otras personas: solo con orden de Enzo.

## Notion

Vías (ver `ux-consultas-responder/references/notion-lectura.md`): conector MCP; los scripts del módulo necesitan `~/.notion/token.txt` y, si no existe, no hay scripts. Nunca pedir ni imprimir el token (B11).

### Qué se actualiza con el conector

| Base | Fila | Propiedades |
|---|---|---|
| Preguntas | La del UXR cerrado (`ID` = `UXR-nnn-Qn`) | `Estado` → `Decidida`; `Respuesta` (resumen con fuente); `Decidido por`; `Fecha de decisión` |
| Pantallas | Una fila por SCR del archivo aceptado | `Estado del documento`, `Aprobado por`, `Fecha de aprobación` |

Una pregunta que sigue abierta en el KB no se toca. Una fila que Notion ya tiene Decidida (por ejemplo, por DH del PO) no se reescribe.

### Estado de las pantallas

- Escalera: Borrador → En revisión → En construcción → Validado. «Aprobado» existe por compatibilidad.
- La aceptación de Enzo se guarda en `Aprobado por` y `Fecha de aprobación`; si el archivo tiene una pieza pendiente, se escribe ahí.
- **«Validado» no se pone** sin prueba de Enzo en el navegador, captura de esa versión y accesibilidad verificada sobre lo implementado (B9). Si Enzo dice que ya se hizo, se anota quién y cuándo y se le pide que confirme el estado antes de escribirlo.
- Una pantalla reemplazada (por ejemplo, un panel sustituido por otro control) no se aprueba: se deja como está.
- El estado se aplica a **todas las pantallas del archivo aceptado**, salvo las reemplazadas.

### Lo que no se hace con el conector

- Crear filas de la base Decisiones (llevan relaciones con pantallas, preguntas y paquetes; lo hace el módulo).
- Recargar el cuerpo de páginas, resúmenes «En 30 segundos» o vistas. Eso es la recarga del módulo, con su token, sobre una rama ya integrada en `develop`.

Cerrar con la lista de lo que quedó sin actualizar y por qué.

## GitLab (Issue del paquete)

- Proyecto y número salen del DSP o del aviso (por ejemplo, proyecto 622, Issue #110 de DSP-005). **Verificar** por la API que el Issue es el del paquete (`GET /projects/<id>/issues/<n>`: título y estado) y que la marca no existe en sus notas.
- Publicar con `POST /projects/<id>/issues/<n>/notes`, con el cuerpo desde un archivo (`--data-urlencode "body@archivo.txt"`, ruta relativa al directorio actual) y el token desde el entorno, sin mostrarlo. Respuesta esperada: el id de la nota.
- Marca `[AVISO-<DSP>-<AAAA-MM-DD>-<ÁREA>]`; con varios el mismo día, sufijo `-b`, `-c`. Solo notas: no se cambian etiquetas, estimaciones, Milestone, asignados, descripción ni estado. Nombres en texto, sin `@`.
- **Corrección:** nota nueva con marca `-b` que dice «Corrección de la nota anterior» y qué cambia (B12). La nota original no se toca.
- Después de publicar, dejar en el `AVS-…` el estado «Avisado», los ids de nota y la fecha, y actualizar `index.md` y `changelog.md`.
- Un aviso **no** se publica por correo salvo orden expresa.
