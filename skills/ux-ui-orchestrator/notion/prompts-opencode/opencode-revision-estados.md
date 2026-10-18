Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta este comando de terminal desde la carpeta de trabajo actual (donde está `revision-estados.js`) y espera a que termine:

`node revision-estados.js`

Reglas:
- Si falla (código de salida distinto de 0 o mensaje de error), informa el error exacto y detente.
- No imprimas ni abras ningún archivo de credenciales.
- Después lee solo `preguntas/revision-resumen.json`, sin modificarlo.

Informe final (SOLO esto): la línea JSON que imprimió el comando y la lista de ids con `error` o con `ok` distinto de true, o «ninguno».
