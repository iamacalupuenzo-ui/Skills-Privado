# Constructor de skills — Protocolo UPDATE

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
Fuente canónica: Skills-Privado/skills/[nombre]
Archivos afectados:
  SKILL.md → sección [X]: [qué cambia exactamente]
  references/[archivo].md → [qué cambia]

Lo que NO cambia: [resto del skill]

Autorización: [diagnóstico aprobado; consultar solo ampliaciones]
Distribución: [no solicitada / publicación solicitada / instalación solicitada]
```

### Si el cambio es un renombre (B16)

1. Proponer el nombre: prefijo `em-`, español, minúsculas con guiones.
2. Buscar todas las citas del nombre viejo: `git grep -n "<nombre-viejo>"`. Separar las
   vivas (skills, manifiesto, README, documentos de uso) de las históricas (bitácoras e
   investigaciones fechadas), que no se tocan.
3. Renombrar con `git mv` para conservar el historial; cambiar `name`, `agents/openai.yaml`,
   `evals/evals.json` y el manifiesto en el mismo cambio.
4. Regenerar los plugins que copian el skill (`npm run construir-plugin`).
5. En Notion, renombrar la fila existente; no crear otra.

---

## Fase 2 — Editar

Usar la herramienta de edición indicada por el entorno. Preservar el resto intacto.
Resolver enlaces y respaldar antes de cambios amplios. Corregir regla, ejemplos y llamadas.
Editar la fuente canónica en `Skills-Privado/skills/<nombre>/`, no una instalación local del agente.

---

## Fase 3 — Re-validar los criterios afectados

Correr `python scripts/validar_skill.py <carpeta>` (B15). En cambios pequeños validar lo afectado; en refactorización amplia aplicar el checklist
completo y references/evaluaciones.md. Distinguir pruebas locales de integración real.
Ejecutar `npm test`; si se alteró el catálogo o el contenido instalado, ejecutar además
la CLI con `--dry-run`.

## Fase 4 — Publicar, instalar y registrar

Con la validación en verde (B10): PR y merge, instalación con `doctor` en OK, y en Notion
la fila existente con `Versión`, `Líneas`, las casillas de `medir_molde.py` y la página
revisada: tabla de modos, diagrama, guías internas y versión operativa
(`references/flujo-del-catalogo.md`). Si la página está vacía, se escribe completa.

---

## Cierre de UPDATE

```
Actualización completada — /nombre-del-skill
---------------------------------------------
Cambios:
  SKILL.md:[línea] — [descripción del cambio]
  references/[archivo]:[línea] — [descripción]

Criterios re-validados: [lista] — ✅
Publicación: [PR #n fusionado / el usuario lo fusiona]
Instalación: [doctor OK en Claude y Codex]
Notion: [enlace de la página; propiedades, casillas y página revisadas]
```
