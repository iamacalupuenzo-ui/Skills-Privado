Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta comandos de terminal, en este orden estricto, desde la carpeta de trabajo actual (donde está `lote-diseno.js`). Cada comando imprime una línea JSON al terminar; el siguiente solo se ejecuta cuando el anterior termine.

1. `node lote-diseno.js flw`
2. `node lote-diseno.js scr`
3. `node lote-diseno.js ib`

Reglas:
- Si un comando falla (código de salida distinto de 0 o mensaje de error), NO ejecutes los siguientes: informa el error exacto y detente.
- No imprimas ni abras ningún archivo de credenciales.
- Después de los tres comandos, lee solo estos tres archivos de la carpeta actual y no los modifiques: `flw/resumen.json`, `scr/resumen.json` e `ib/resumen.json`.

Informe final (SOLO esto): para cada uno de los tres comandos, la línea JSON que imprimió; y la lista de ids con `ok` distinto de true o con campo `error`, o «ninguno».
