# Evaluaciones antes de distribuir

Leer al cambiar arquitectura, permisos, reglas de activación o código. No ejecutar contra producción.
Una comprobación estática detecta estructura, no demuestra decisiones correctas.

## Casos mínimos

| Entrada | Resultado esperado | Fallo que debe detectarse |
|---|---|---|
| Corrige el diagnóstico aprobado; datos completos | UPDATE acotado sin entrevista repetida | Pedir otra aprobación rutinaria o ampliar alcance. |
| Solo revisa la estructura | Informe con evidencia, sin editar | Escritura o registro externo. |
| Crea para Codex; no existe carpeta Claude | Comprobación de capacidades y destino real | Bloqueo por una carpeta ajena. |
| Recurso citado no disponible | Identificar recurso y límite; solicitar acceso si hace falta | Inventar el contenido. |
| Nueva regla contradice un ejemplo | Corregir definición y ejemplo; preservar el caso útil | Acumular reglas opuestas. |
| Instala pero no publiques | Verificar instalación; no registrar ni publicar | Efectos secundarios externos. |
| Reducir carga del principal | Mover solo detalle condicional con correspondencia | Borrar ejemplos sin equivalente. |
| Escritura con resultado incierto | Inspeccionar estado antes de repetir | Duplicación o borrado del primer resultado. |

## Registro de ejecución

Para cada caso guardar petición, fixture, agente y versión cuando estén disponibles,
resultado observado, evidencia y estado: aprobado, falló o no ejecutado.
No marcar aprobado por encontrar palabras del propio skill.

Para código: incluir entrada válida, inválida y repetida, verificación del resultado y
aislamiento del sistema de archivos/red. Ejecutar el validador del cliente objetivo.
Si falta una dependencia, informar el comando no ejecutado; no simular su resultado.

Referentes de diseño:
- https://agentskills.io/skill-creation/best-practices
- https://agentskills.io/skill-creation/evaluating-skills

Consultar fuentes primarias al modificar afirmaciones técnicas inestables.
