# Modelo por tarea — política provisional

Propuesta medida en casos pequeños; no implica un cambio de settings ni un override model automático. No seleccionar por la etiqueta «barato» ni usar un resultado aislado como garantía.

| Trabajo | Claude | Codex | Cuándo escalar |
|---|---|---|---|
| Desarrollo habitual | Sonnet 5.5 medio | GPT-6.2 Sol bajo | Diagnóstico complejo o decisión de arquitectura |
| Registrar decisiones ya tomadas y documentar evidencia | Sonnet bajo; Haiku solo en piloto | GPT-6 Luna bajo en piloto | Autoría, fecha, alcance o fuentes contradictorios |
| Generar UXS o ejecutar specs | Script; Sonnet bajo si requiere interpretación | Script; Luna bajo en piloto | Veredictos, bloqueos o fallos que requieran diagnóstico |
| Preparar versión, commit y MR | Sonnet bajo | Luna bajo en piloto | Conflictos o fallos de pipeline; permisos y guardias siempre aplican |
| Verificación previa entre código, KB y Notion | Sonnet medio, revisión independiente | Sol bajo, revisión independiente | Inconsistencia material: detener la pieza y escalar al responsable |
| Diseño o motor complejo | Sonnet primero; Opus a demanda | Sol primero; Astra a demanda | El alcance requiere razonamiento que el modelo inicial no resolvió |

Primero usar un informe vigente del mismo alcance y referencias. No reducir la verificación previa a comparar SHA ni relajar B1. Una contradicción exige detener la decisión afectada; no esperar dos fallos. Dos fallos de un spec exigen diagnóstico, no subir de modelo a ciegas.

Usar contextos dirigidos y respuestas breves. Scripts para operaciones mecánicas, modelo para juicio; adjuntar evidencia completa por archivo y llevar a la sesión solo los resultados relevantes. Una salida breve no autoriza omitir discrepancias.

Los pilotos se aprueban después de 2–3 tareas reales pequeñas con revisión de referencia: omisiones, datos inventados, correcciones, duración total, tokens normales/cache/salida y costo nominal por separado de factura. Los casos congelados ya ensayados no equivalen a producción.

El modelo se selecciona explícitamente al lanzar sesión/subagente/worker. Claude Code admite model/effort en el frontmatter, pero no se añaden aquí hasta aprobar el comportamiento por tarea. Codex usa su configuración o flags; no asumir que lee los campos de Claude. Una tabla Markdown no cambia el modelo. No cambiar defaults globales sin confirmación.

Las lecturas de caché son tokens, no dinero. Las tarifas API no prueban el costo del plan; cuando falte precio o dato de consumo se declara no comprobado. Pin de modelo y esfuerzo, entrada de prueba y telemetría deben guardarse para reproducir el resultado. Confirmar disponibilidad y versión del cliente antes de usar una opción.

Los guardias preparados son hooks de Claude Code. Su interceptaci?n no se ha comprobado en Codex ni en otros runtimes de Orca; no asumir que instalar un skill activa esas protecciones all?.
