Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta este comando de terminal desde la carpeta de trabajo actual (donde está `cargar-uxs.js`) y espera a que termine (puede tardar unos minutos porque resuelve muchas relaciones):

`node cargar-uxs.js`

Reglas: si falla, informa el error exacto y detente. No imprimas ni abras archivos de credenciales. Después lee solo `uxs/resumen.json`, sin modificarlo.

Informe final (SOLO esto): la línea JSON del comando y, si `sinResolver` no está vacío, su contenido, o «ninguno».
