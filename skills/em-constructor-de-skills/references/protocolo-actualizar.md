# Skill Builder — Protocolo UPDATE

Protocolo completo para modificar un skill existente con un cambio puntual. Se
activa cuando el modo detectado es `UPDATE`. Leer este archivo entero antes de
actuar.

---

## Fase 0 — Leer el skill completo

No editar sin leer. Leer SKILL.md + references/ afectadas.

---

## Fase 1 — Identificar el cambio mínimo

```
Cambio solicitado: [descripción]
Fuente canónica: Skils/skills/[nombre]
Archivos afectados:
  SKILL.md → sección [X]: [qué cambia exactamente]
  references/[archivo].md → [qué cambia]

Lo que NO cambia: [resto del skill]

Autorización: [diagnóstico aprobado; consultar solo ampliaciones]
Distribución: [no solicitada / publicación solicitada / instalación solicitada]
```

---

## Fase 2 — Editar

Usar la herramienta de edición indicada por el entorno. Preservar el resto intacto.
Resolver enlaces y respaldar antes de cambios amplios. Corregir regla, ejemplos y llamadas.
Editar la fuente canónica en `Skils/skills/<nombre>/`, no una instalación local del agente.

---

## Fase 3 — Re-validar los criterios afectados

En cambios pequeños validar lo afectado; en refactorización amplia aplicar el checklist
completo y references/evaluaciones.md. Distinguir pruebas locales de integración real.
Ejecutar `npm test`; si se alteró el catálogo o el contenido instalado, ejecutar además
la CLI con `--dry-run` antes de proponer publicación o instalación.

---

## Cierre de UPDATE

```
Actualización completada — /nombre-del-skill
---------------------------------------------
Cambios:
  SKILL.md:[línea] — [descripción del cambio]
  references/[archivo]:[línea] — [descripción]

Criterios re-validados: [lista] — ✅
Publicación: [no solicitada / commit y push verificados]
Instalación: [no solicitada / doctor verificado]
```
