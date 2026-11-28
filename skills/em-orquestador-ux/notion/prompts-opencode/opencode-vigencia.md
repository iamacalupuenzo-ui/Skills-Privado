Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta estos comandos de terminal, en este orden, desde la carpeta de trabajo actual (donde está `vigencia-inicial.js`). Cada uno imprime una línea JSON al terminar; el siguiente solo se ejecuta cuando el anterior termine.

1. `node vigencia-inicial.js --lote=1/2`
2. `node vigencia-inicial.js --lote=2/2`

Reglas: si un comando falla, informa el error exacto y detente. No imprimas ni abras archivos de credenciales. Al final lee solo `preguntas/vigencia-resumen-1.json` y `preguntas/vigencia-resumen-2.json`, sin modificarlos.

Informe final (SOLO esto): la línea JSON de cada comando y la lista de ids con `error` o con `ok` distinto de true, o «ninguno».
