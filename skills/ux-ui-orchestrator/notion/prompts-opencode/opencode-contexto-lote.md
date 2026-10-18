Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta estos comandos de terminal, en este orden estricto, desde la carpeta de trabajo actual (donde está `contexto-lote.js`). Cada uno imprime una línea JSON al terminar; el siguiente solo se ejecuta cuando el anterior termine. Pueden tardar varios minutos: espera sin interrumpirlos.

1. `node contexto-lote.js --lote=1/4`
2. `node contexto-lote.js --lote=2/4`
3. `node contexto-lote.js --lote=3/4`
4. `node contexto-lote.js --lote=4/4`

Reglas: si un comando falla (código de salida distinto de 0 o mensaje de error), NO ejecutes el siguiente: informa el error exacto y detente. No imprimas ni abras archivos de credenciales. Al final lee solo `preguntas/ctx-carga-1.json`, `preguntas/ctx-carga-2.json`, `preguntas/ctx-carga-3.json` y `preguntas/ctx-carga-4.json`, sin modificarlos.

Informe final (SOLO esto): la línea JSON de cada comando y la lista de ids con `error` o con `ok` distinto de true, o «ninguno».
