# Orden de fusión cuando el trabajo depende de un DS sin publicar

**Pregunta antes de leer:** ¿por qué ningún MR de producto se abre antes de que la versión del DS aparezca en el registro?

**En 30 segundos:** primero se publica el DS (fase 1), después se cambia `-pre` por la versión estable en cada producto y se abren los MR a `integration` en parejas (fase 2), y al final se prueba DEV y desarrollo lleva cada historia a `develop` (fase 3). Que exista la etiqueta no prueba que la versión esté publicada: se verifica con `npm view`.

## Fase 1 — DS

1. MR de las ramas de brechas (`GAPS.md`) a `develop`. Fusiona César.
2. MR de la rama de funciones del DS a `develop`, con versión menor nueva y nota de versión. Antes: `check:docs`, `test:ci` y `check:release-notes`. Revisa César.
3. `develop` → `release`, etiqueta y publicación (César), y `release` → `main` (`flujo-ds`, `references/publicar-el-ds.md`).
4. **Verificar en el registro**, desde una carpeta con `.npmrc`: `npm view @comsatel/ui-components@<versión> version`. Caso real: `ds-v1.17.0` existía en `release`, pero el registro no tenía la 1.17.0 (`latest` seguía en 1.14.0).

## Fase 2 — Productos

1. En cada `feature/ds-<versión>`, cambiar `-pre` por la versión estable exacta, `npm install` y la suite completa (`lint`, `test:rules`, `test:ci`, `build`). `test:rules` tiene que pasar antes del MR de una micro UI, porque el job `verify` lo corre.
2. MR a `integration` (revisa Luis), en parejas y con la misma versión del DS en todos (es singleton):
   - `web-flotas` + `microui-monitoring`;
   - `web-backoffice` + `microui-bo-tenants` + `microui-bo-feature-flags`.
3. Orden dentro de cada repositorio: rama del DS, luego la del menú (Shell) y luego las historias según la pila (121 antes que 123). Si todos los MR van a `integration`, al fusionar la base el siguiente MR se reduce solo a su diferencia.
4. Una rama que depende del trabajo de otro agente espera su fusión. Caso real: la rama de `microui-bo-tenants` espera `CLF_Feature_103`; después se rebasa sobre `develop` y el código nuevo de la 103 que usa `cs-tag` se migra a `cs-badge`.

## Fase 3 — Integración y entrega

1. Esperar el pipeline de `integration`.
2. Probar en DEV la pareja completa.
3. Avisar a desarrollo, que lleva cada historia a `develop`.

## Migración Tag → Badge (cs-tag es obsoleto desde la 1.16)

| `cs-tag` | `cs-badge` |
|---|---|
| `severity="warn"` | `severity="warning"` |
| `severity="secondary"` | `severity="neutral"` |

## Pregunta de comprobación

La etiqueta `ds-v1.18.0` ya está en `release`. ¿Puedes cambiar `-pre` por `1.18.0` en los productos?
(Respuesta: todavía no. Primero `npm view @comsatel/ui-components@1.18.0 version` desde una carpeta con `.npmrc` tiene que devolver la versión.)
