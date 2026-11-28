Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta estos comandos de terminal, en este orden, desde la carpeta de trabajo actual (donde están los scripts). Cada uno imprime una línea JSON al terminar.

Antes de empezar, define estas dos variables de entorno en la misma sesión de terminal (valores literales, no los imprimas ni los cambies):

- `NOTION_WORKTREE` = `C:/Users/EMACAL~1/AppData/Local/Temp/kbux`
- `DESIGN_REF` = `ux/uxs-dsp-004-a-007`

Comandos (uno por especificación; cada uno crea o actualiza su fila en la base «Especificaciones UX»):

1. `node cargar-uxs-paquete.js design/specs/UXS-003-dsp-004-configuracion-del-distribuidor.md`
2. `node cargar-uxs-paquete.js design/specs/UXS-004-dsp-005-alta-comercial-servicios-clientes.md`
3. `node cargar-uxs-paquete.js design/specs/UXS-005-dsp-006-home-y-mapa-del-cliente.md`
4. `node cargar-uxs-paquete.js design/specs/UXS-006-dsp-007-auditoria.md`

Reglas: si un comando falla, informa el error exacto y detente. No imprimas ni abras archivos de credenciales. No ejecutes nada más. Después lee solo `../trabajo/uxs/UXS-003-resumen.json` a `UXS-006-resumen.json`, sin modificarlos.

Informe final (SOLO esto): la línea JSON de cada comando y, por cada UXS, el valor de `ok` y de `sinResolver` (ids de relaciones que no se encontraron en Notion), o «ninguno».
