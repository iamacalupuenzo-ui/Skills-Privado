# Skill Builder — Protocolo MIGRATE

Protocolo completo para migrar un comando o contexto dump existente a un skill
global estructurado. Se activa cuando el modo detectado es `MIGRATE`. Leer este
archivo entero antes de actuar.

Aplica cuando el usuario tiene un archivo `.claude/commands/*.md` o un contexto
dump que quiere convertir en skill global estructurado.

---

## Fase 0 — Leer el comando existente

```powershell
Get-Content "[ruta al archivo]"
```

---

## Fase 1 — Análisis de contenido

Clasificar cada sección del archivo en una de estas categorías:

| Categoría | Dónde va | Criterio |
|-----------|----------|---------|
| Contexto estático | references/ | No cambia entre sesiones: tokens, decisiones, inventario, patrones |
| Lógica de orquestación | SKILL.md | Procedimientos, fases, guards, modos, bloqueantes |
| Conocimiento de dominio | references/ | Datos específicos del proyecto/tecnología |
| Formato de output | SKILL.md | Cómo reportar, cerrar, qué incluir en cierre |

Presentar el análisis antes de continuar:
```
Análisis de migración — [nombre del archivo]
---------------------------------------------
El archivo tiene [N] líneas. Clasificación:

→ references/tokens.md:      [secciones X, Y]
→ references/decisions.md:   [secciones A, B]
→ references/patterns.md:    [secciones C]
→ SKILL.md (orquestación):   [secciones D, E, F]

Contenido a conservar o retirar con justificación y autorización:
  - [sección] — razón

¿Continuamos con esta distribución?
```

---

## Fase 2 — Entrevista reducida

Para migración solo se necesitan las preguntas que el archivo original no responde:
- ¿Cuáles son los modos que no están explícitos en el archivo?
- ¿Hay blocking behaviors no documentados?
- Solo si se pidió registro: ¿qué proceso y rol admite el catálogo?

---

## Fase 3 — Construir

Seguir Fases 2, 3, 4 y 6 de `references/protocol-create.md`; fase 5 solo con registro
solicitado. La versión migrada vive en `Skils/skills/<nombre>/` y se agrega al manifiesto
si es nueva. Comparar capacidades y ejemplos con el origen; probar antes de activar.

---

## Fase 4 — Deprecar el original (con confirmación)

```
El comando original en [ruta] puede eliminarse o quedar como stub.
¿Qué prefieres?
  A) Eliminar el archivo original
  B) Reemplazarlo con un stub que redirija al nuevo skill
  C) Dejarlo como está (dos versiones coexistentes)
```

Por defecto conservar origen y respaldo. Migrar formato no autoriza borrar ni cambiar instalaciones.
