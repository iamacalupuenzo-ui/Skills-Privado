Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta estos comandos de terminal, en este orden, desde la carpeta de trabajo actual (donde está `titulos.js`). Cada uno imprime una línea JSON al terminar; el siguiente solo se ejecuta cuando el anterior termine. Espera sin interrumpirlos.

1. `node titulos.js --lote=1/2`
2. `node titulos.js --lote=2/2`

Reglas: si un comando falla (código de salida distinto de 0 o mensaje de error), NO ejecutes el siguiente: informa el error exacto y detente. No imprimas ni abras archivos de credenciales. Al final lee solo `preguntas/titulos-1.json` y `preguntas/titulos-2.json`, sin modificarlos.

Informe final (SOLO esto): la línea JSON de cada comando y la lista de ids con `error` o con `ok` distinto de true, o «ninguno».
