Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta comandos de terminal, en este orden estricto, desde la carpeta de trabajo actual (donde está `lote-preguntas.js`). Cada comando imprime una línea JSON al terminar; el siguiente solo se ejecuta cuando el anterior termine. Cada uno puede tardar varios minutos: espera sin interrumpirlo.

1. `node lote-preguntas.js --lote=1/4`
2. `node lote-preguntas.js --lote=2/4`
3. `node lote-preguntas.js --lote=3/4`
4. `node lote-preguntas.js --lote=4/4`

Reglas:
- Si un comando falla (código de salida distinto de 0 o mensaje de error), NO ejecutes los siguientes: informa el error exacto y detente.
- No imprimas ni abras ningún archivo de credenciales.
- Después de los cuatro comandos, lee solo estos cuatro archivos de la carpeta actual y no los modifiques: `preguntas/resumen-1.json`, `preguntas/resumen-2.json`, `preguntas/resumen-3.json` y `preguntas/resumen-4.json`.

Informe final (SOLO esto): para cada comando, la línea JSON que imprimió; y la lista de ids con `ok` distinto de true, con campo `error` o con `sinResolver` no vacío (indica el id y el contenido de `sinResolver`), o «ninguno».
