Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta comandos de terminal, en este orden estricto, desde la carpeta de trabajo actual (donde está `preguntas-refs.js`). Cada comando imprime una línea JSON al terminar; el siguiente solo se ejecuta cuando el anterior termine. Pueden tardar varios minutos: espera sin interrumpirlos.

1. `node preguntas-refs.js niveles --lote=1/2`
2. `node preguntas-refs.js niveles --lote=2/2`
3. `node preguntas-refs.js relaciones --lote=1/2`
4. `node preguntas-refs.js relaciones --lote=2/2`

Reglas:
- Si un comando falla (código de salida distinto de 0 o mensaje de error), NO ejecutes los siguientes: informa el error exacto y detente.
- No imprimas ni abras ningún archivo de credenciales.
- Al final lee solo `preguntas/refs-niveles-1.json`, `preguntas/refs-niveles-2.json`, `preguntas/refs-relaciones-1.json` y `preguntas/refs-relaciones-2.json`, sin modificarlos.

Informe final (SOLO esto): la línea JSON de cada comando y la lista de ids con campo `error` o con `ok` distinto de true que no tengan `sinCambio`, o «ninguno».
