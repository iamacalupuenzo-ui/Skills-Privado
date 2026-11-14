Eres el ejecutor de una carga a Notion (Captura y Recupero, DSP-003). NO uses el servidor MCP de Notion y NO edites ningún archivo: solo ejecuta comandos de terminal, en este orden estricto, desde la carpeta de trabajo actual (donde están los scripts). Las variables de entorno NOTION_WORKTREE, NOTION_PRODUCTO, NOTION_TRABAJO y DESIGN_REF ya están definidas; no las cambies ni las imprimas. Cada comando imprime una línea JSON al terminar; el siguiente solo se ejecuta si el anterior terminó con código 0.

1. `node cargar-paquete-historias-cr.js`
2. `node lote-doc-cr.js uxr --only=UXR-046,UXR-047,UXR-048,UXR-049,UXR-050,UXR-051,UXR-052,UXR-053,UXR-054,UXR-055,UXR-056,UXR-057,UXR-058,UXR-059,UXR-060,UXR-061,UXR-062,UXR-063,UXR-064,UXR-065,UXR-066,UXR-067,UXR-068,UXR-069,UXR-070,UXR-071,UXR-072,UXR-073,UXR-074,UXR-075,UXR-076,UXR-077,UXR-078,UXR-079,UXR-080,UXR-081,UXR-082,UXR-083,UXR-084,UXR-085,UXR-086,UXR-087,UXR-088`
3. `node lote-diseno-cr.js flw --only=FLW-016,FLW-017,FLW-018,FLW-019,FLW-020,FLW-021,FLW-022,FLW-023,FLW-024,FLW-025,FLW-026,FLW-027,FLW-028,FLW-029,FLW-030,FLW-031`
4. `node lote-diseno-cr.js scr --only=SCR-023,SCR-024,SCR-025,SCR-026,SCR-027,SCR-028,SCR-029,SCR-030,SCR-031,SCR-032,SCR-033,SCR-034,SCR-035,SCR-036`

Reglas:
- Ejecuta exactamente esos comandos, sin cambiar `--only`, sin `--dry-run` y sin ningún otro script. No uses `node -e`.
- Si un comando falla (código de salida distinto de 0 o mensaje de error), NO ejecutes los siguientes: informa el error exacto y detente.
- No imprimas ni abras ningún archivo de credenciales ni de configuración.
- Estos comandos tardan varios minutos; espera a que terminen sin interrumpirlos.

Informe final (SOLO esto): para cada comando, la línea JSON que imprimió (o el error exacto), y si alguno falló, cuál fue el último que se ejecutó con éxito.
