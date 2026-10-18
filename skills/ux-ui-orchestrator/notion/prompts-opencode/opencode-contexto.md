Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta estos comandos de terminal, en este orden, desde la carpeta de trabajo actual (donde están los scripts). Cada uno imprime una línea JSON al terminar; el siguiente solo se ejecuta cuando el anterior termine.

1. `node contexto-piloto.js`
2. `node cerrar-arq.js`

Reglas: si un comando falla, informa el error exacto y detente. No imprimas ni abras archivos de credenciales. Después lee solo `preguntas/contexto-resumen.json` y `preguntas/cierres-arq-resumen.json`, sin modificarlos.

Informe final (SOLO esto): la línea JSON de cada comando y la lista de ids con `error` o con `ok` distinto de true, o «ninguno».
