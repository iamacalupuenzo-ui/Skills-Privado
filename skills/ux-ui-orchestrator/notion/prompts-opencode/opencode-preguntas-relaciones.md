Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta comandos de terminal, en este orden estricto, desde la carpeta de trabajo actual (donde está `lote-preguntas.js`). Cada comando imprime una línea JSON al terminar; el siguiente solo se ejecuta cuando el anterior termine. Puede tardar varios minutos: espera sin interrumpirlo.

1. `node lote-preguntas.js --relaciones --lote=1/2`
2. `node lote-preguntas.js --relaciones --lote=2/2`

Reglas:
- Si un comando falla (código de salida distinto de 0 o mensaje de error), NO ejecutes el siguiente: informa el error exacto y detente.
- No imprimas ni abras ningún archivo de credenciales.
- Después de los dos comandos, lee solo `preguntas/rel-resumen-1.json` y `preguntas/rel-resumen-2.json` y no los modifiques.

Informe final (SOLO esto): la línea JSON de cada comando; y la lista de ids con `ok` distinto de true, con campo `error` o con `sinResolver` no vacío (indica el id y su contenido), o «ninguno».
