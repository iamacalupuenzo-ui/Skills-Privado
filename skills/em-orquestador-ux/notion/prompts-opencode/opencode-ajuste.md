Eres el ejecutor de una carga a Notion. NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta estos comandos de terminal, en este orden, desde la carpeta de trabajo actual (donde están los scripts). Cada uno imprime una línea JSON al terminar; el siguiente solo se ejecuta cuando el anterior termine.

1. `node piloto-diseno.js`
2. `node subir-respuestas.js --only=UXR-016-Q1,UXR-016-Q2`

Reglas: si un comando falla, informa el error exacto y detente. No imprimas ni abras archivos de credenciales. Después lee solo `preguntas/piloto-resumen.json` y `preguntas/resp-resumen.json`, sin modificarlos.

Informe final (SOLO esto): la línea JSON de cada comando y la lista de ids con `error` o con `ok` distinto de true, o «ninguno».
