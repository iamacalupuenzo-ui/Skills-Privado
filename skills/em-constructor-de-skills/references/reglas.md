# Reglas de bloqueo, atajos y alertas

Leer antes de escribir o editar archivos de un skill y antes de cerrar. El `SKILL.md`
lista cada regla en una línea; aquí está el detalle.

## Índice

1. Reglas de bloqueo (B1–B16)
2. Atajos previsibles
3. Señales de alerta
4. Formato de respuesta

## 1. Reglas de bloqueo

- **B1 — Contexto suficiente**: obtener propósito, entradas, salida y límites del contexto;
  preguntar solo por vacíos materiales.
- **B2 — Conservación**: mantener conocimiento y ejemplos útiles; mover detalle condicional
  con rutas de lectura, no borrarlo por extensión.
- **B3 — Recursos resolubles**: cada referencia citada existe antes del cierre; el orden de
  escritura no determina calidad.
- **B4 — Validar antes de cerrar**: el checklist de calidad no es opcional. Con fallos
  críticos se corrige antes de reportar como completado.
- **B5 — Activación**: la descripción explica capacidad y cuándo usarla; comprobar pedidos
  positivos y negativos, sin cuota de frases.
- **B6 — Preguntas proporcionales**: no repetir datos ya aportados ni imponer una entrevista
  de ocho turnos.
- **B7 — Autorización por alcance**: ejecutar el diagnóstico aprobado sin reconfirmar cada
  paso; consultar ampliaciones materiales.
- **B8 — AUDIT no edita**: auditar es leer y reportar. Editar solo si el usuario lo aprueba
  al final del reporte.
- **B9 — Portabilidad**: verificar soporte de metadatos y herramientas por agente;
  descubrimiento no prueba ejecución.
- **B10 — Cierre completo**: al terminar CREATE, MIGRATE o UPDATE con la validación en
  verde, se publica (PR y merge en Skills-Privado), se instala en Claude y Codex y se registra
  en Notion, cada paso con su resultado verificado. Solo se omite un paso si Enzo lo pide
  (por ejemplo, «yo fusiono el PR» o «no lo instales»). AUDIT no escribe nada (B8).
- **B11 — Lectura progresiva**: externalizar lo que se usa por separado; conservar
  decisiones, ejemplos y llamadas.
- **B12 — Registro canónico y completo**: buscar la fila existente en la base Skills y
  sincronizarla en la misma fila: propiedades, las seis casillas del molde y la página con la
  estructura de 10 secciones (`templates/pagina-notion.plantilla.md`). Una fila con la
  página vacía es un registro incompleto (caso real: em-gestion-tareas, 2026-11-28).
- **B13 — Estado verificable**: marcar `Activo` y declarar entornos solo con validación y
  disponibilidad comprobadas. Sin Notion, cerrar con el registro pendiente, no realizado.
- **B14 — Recursos operativos localizables**: si el skill depende de documentación o
  proyectos externos, documentar una ruta de lectura verificable; no sustituir una fuente
  ausente por una parecida.
- **B15 — Validador en verde**: no declarar terminado un skill propio mientras
  `scripts/validar_skill.py` tenga errores. Los avisos se reportan con su motivo.
- **B16 — Nombre del molde**: un skill propio nuevo o renombrado lleva prefijo `em-`,
  nombre en español y `name` igual a la carpeta. Renombrar exige actualizar en el mismo
  cambio cada referencia al nombre viejo (otros skills, manifiesto, documentos, Notion).

## 2. Atajos previsibles

| Atajo | Realidad |
|---|---|
| «Debo repetir ocho preguntas» | Reutilizar lo conocido y preguntar solo vacíos materiales (B1, B6). |
| «El enlace ya demuestra que el recurso existe» | Comprobar destino y contenido antes del cierre (B3). |
| «Este skill es chico, no necesita verificación de arranque» | Sin ella, el skill ejecuta en el contexto equivocado; el tamaño no reduce el riesgo. |
| «Los campos de un cliente funcionan en todos» | Verificar capacidades y soporte real (B9). |
| «El usuario ya aprobó algo parecido» | Cada skill es distinto: mostrar su arquitectura (B7). |
| «Ya audité esto mentalmente» | Cada criterio exige citar la línea que lo cumple (B4, B8). |
| «El validador da avisos, igual está listo» | Los errores bloquean; los avisos se explican (B15). |
| «Renombro la carpeta y luego arreglo los enlaces» | Un nombre viejo citado rompe la activación de otros skills (B16). |
| «Menos líneas siempre es mejor» | Mantener la cobertura de reglas y ejemplos (B2, B11). |
| «Las evals las escribo al final» | Anthropic pide escribirlas antes de la documentación extensa. |

## 3. Señales de alerta

Detenerse y corregir si aparece alguna:

- Se reduce contenido sin identificar el destino de sus decisiones y ejemplos.
- Se intenta cerrar con referencias inexistentes o con el validador en rojo.
- Se vuelve a preguntar por información ya aportada.
- Se amplía el alcance sin consultar la nueva decisión.
- Un modo aparece en la tabla pero su protocolo en `references/` no existe.
- Una regla nueva describe un principio general («ser cuidadoso») en vez de una acción
  concreta prohibida con su consecuencia.
- Se cierra la validación como «APROBADO» sin citar, para cada criterio, la evidencia.
- Un skill usa una herramienta MCP que no está registrada en Herramientas externas.

## 4. Formato de respuesta

- Declarar el modo en la primera línea (`Modo detectado: CREATE`).
- Preguntas breves solo por vacíos materiales; sin reconfirmaciones rutinarias.
- Arquitectura y plan en un bloque de texto antes de ejecutar.
- Sin emojis decorativos ni halagos.
- Español neutro latinoamericano con tuteo, sin voseo.
- Archivos generados en bloques ```markdown, ```yaml o ```json según corresponda.
- Cierre: cambios, destino, resultado del validador y de las pruebas, PR fusionado,
  instalación y enlace a la página de Notion.
