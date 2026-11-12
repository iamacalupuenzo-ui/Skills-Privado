# Mensaje de arranque para la computadora que retoma

Se entrega al usuario en un bloque de código, con los valores entre `<…>` reemplazados por los del momento (enlace de la página de estado, ramas, MR). Antes de entregarlo, la página de estado ya tiene que estar actualizada (B6).

```text
Vas a continuar el trabajo de <persona> (<equipo>) en <proyecto>. No tienes contexto previo: todo está en Notion y en los repositorios. Trabaja en español, con tuteo y tono directo.

PASO 1. Lee la página de Notion completa, con tu herramienta de Notion (fetch):
<enlace de la página de estado>
Si no tienes Notion conectado, díselo al usuario y detente.

PASO 2. Guarda en tu memoria local las reglas de trabajo y el estado de la página. Cada computadora tiene su propia memoria.

PASO 3. Prepara el equipo:
- Conéctate a la VPN o red corporativa. Sin ella, project.comsatel.com.pe responde 503.
- Variables de entorno GITLAB_TOKEN y GITLAB_NPM_TOKEN. Si faltan, pídeselas al usuario. Nunca las pegues en Notion, en un archivo del repositorio ni en el chat.
- Git, Node y Chrome.

PASO 4. Descarga el trabajo, en las ramas que indica la página: <repos y ramas>. Luego npm ci en cada uno.

PASO 5. Si el consumidor usa un DS sin publicar, construye el DS (npm run build:lib), copia dist/comsatel-ds sobre node_modules/@comsatel/ui-components del consumidor y reinicia su servidor.

PASO 6. Verifica el estado real con la API de GitLab, sin fiarte solo de la página: <MR y versiones a revisar>.

PASO 7. Lee el CLAUDE.md del proyecto. Resume al usuario en cinco líneas lo que entendiste (estado, pendientes en orden, qué falta comprobar) y pregúntale qué sigue. No modifiques nada antes de eso.

CIERRE OBLIGATORIO (aplica también a ti):
1. Commit de todo lo trabajado. Nada se queda solo en el disco.
2. Con la confirmación del usuario, push y MR con César de revisor.
3. Actualiza la página de Notion: estado de los MR verificado con la API y fecha, ramas y commits, lo hecho, lo no comprobado y los pendientes.
4. Anota lo que no viaja por git: capturas, memoria, copias en node_modules, servidores levantados.
5. Actualiza tu memoria y entrega al usuario el mensaje para el siguiente equipo, con enlaces e imágenes.
```
