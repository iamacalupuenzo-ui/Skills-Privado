# Subir ramas sin fusionar ni desplegar

**Pregunta antes de leer:** si el producto usa funciones de un DS que aún no está en el registro, ¿qué tienes que subir además de la rama del producto?

**En 30 segundos:** cuando el trabajo depende de un DS sin publicar, las ramas se suben para que viajen, no para fusionarse. Antes de subir, cada rama se verifica en un worktree limpio con `npm ci`. Se suben sin MR y con `-o ci.skip`, se deja una nota «NO FUSIONAR» en el issue y se cierra con el paquete de traspaso. El orden en que luego se fusionan está en `orden-de-fusion-ds-sin-publicar.md`.

## Cuándo aplica

El usuario pide «súbelo, pero no lo fusiones», o el código usa algo que solo existe en una rama local del DS (una escena de `cs-illustration`, una variante nueva de `cs-button`). Caso real (2026-11-17): la micro UI de monitoreo compilaba en local porque el DS estaba copiado sobre `node_modules` (B8 de `flujo-ds`). En un worktree limpio con `npm ci`, el build falló: usaba 3 escenas y la variante `neutral` que solo existían en `feature/ilustraciones-escenas` del DS, con 15 commits sin subir.

## 1. Verificar cada rama en un worktree aparte

Nunca en el worktree donde corre `ng serve`: `ng build` y `ng test` lo rompen.

1. `git worktree add ../publicar-ds <rama>` (un worktree `publicar-ds` por repositorio).
2. `npm ci` con `GITLAB_NPM_TOKEN` en el entorno.
3. `npm run lint`, `npm run test:rules`, `npm run test:ci` y `npm run build`. Anotar las cifras. Pasar `test:ci` no basta: en el caso real pasaron 227 pruebas, pero había 2 errores de lint y 9 incumplimientos de reglas.
4. Si el build necesita el DS sin publicar, compilar la rama del DS (`npm run build:lib`) y copiar su `dist/comsatel-ds` en el `node_modules/@comsatel/ui-components` **del worktree de verificación**. Nunca fijes esa versión en `package.json`.
5. **Ramas apiladas:** cada una pasa su propia suite antes de apilar la siguiente. En el caso real, la rama de la US121 tenía pruebas de la página desactualizadas que se corrigieron en un commit de la US123; la 121 sola no pasaba.

## 2. Listar lo que no está publicado

Antes de subir, anota de qué ramas del DS sin publicar depende el producto (`git log origin/develop..<rama>` en `ui-components`). Súbelas también, como rama `feature/*` y sin MR. Así otra computadora puede compilar el DS en local.

## 3. Estructura de ramas

| Rama | Desde | Contiene |
|---|---|---|
| `feature/ds-<versión>` | `origin/develop` | Solo `package.json`, `package-lock.json` y las migraciones mínimas de API (por ejemplo, `cs-tag` → `cs-badge`) |
| `feature/menu-ds-<versión>` (solo el Shell) | la rama del DS | El menú, en su propia rama |
| Ramas de historia | la rama del DS (o la del menú) | El trabajo de cada historia, una rama por historia |

Una versión `-pre` no se fusiona a `develop` (B8 de `flujo-ds`): estas ramas esperan la versión estable.

**Traer `package.json` de otra rama puede bajar la versión de la app.** `git checkout <sha> -- package.json` la bajó de 0.2.2 a 0.2.1. Después de traerlo, compara `version` con `origin/develop` y corrige `package.json` y el lock (2 entradas).

## 4. Subir sin disparar el pipeline

1. `git push -u origin <rama> -o ci.skip`, con confirmación (B1). No abras MR: en `microui-monitoring` el job `verify` corre con `merge_request_event` o en `develop`, `release` y `main`, así que un MR dispara la compilación.
2. Comprueba con `git ls-remote origin <rama>` que el remoto quedó en tu SHA.
3. Nota «NO FUSIONAR» en el issue de `collaboration` (`POST /projects/622/issues/<iid>/notes`), con el porqué: DS sin publicar, paquete incompleto, pareja Shell + micro UI. Si las ramas cambian, edita esa misma nota (`PUT /projects/622/issues/<iid>/notes/<id>`); no crees otra.
4. En la tarea de Notion, la tabla de ramas: repositorio, rama, SHA, verificación con cifras y pasos para retomar.

## 5. Si hay que reescribir una rama ya subida

El push forzado está bloqueado por el guardia aunque el usuario lo autorice, y borrar la rama remota para volver a subirla también es rodearlo (`hooks-bloqueantes.md`). Comprueba con `git ls-remote` que el remoto sigue en el SHA que subiste y dale al usuario el comando para que lo ejecute él con `!`:

```
git push --force-with-lease=<rama>:<sha-esperado> origin <rama> -o ci.skip
```

La mejor prevención es separar las historias antes del primer push (convención de commits en `orquestador-desarrollo`, `references/convenciones-comunes.md`).

## 6. Cerrar con el traspaso

Cada subida termina con el paquete de traspaso del skill `traspaso-entre-computadoras`: ramas por repositorio, la rama del DS sin publicar que hay que compilar y copiar, servidores y el mensaje listo para pegar.

## Pregunta de comprobación

Tu rama compila en local, pero en el worktree limpio el build no encuentra una escena de `cs-illustration`. ¿Qué haces antes de subir?
(Respuesta: identificas la rama del DS que la contiene, la subes como `feature/*` sin MR, verificas el build copiando su `dist` en el `node_modules` del worktree de verificación sin tocar `package.json`, y la anotas en la nota «NO FUSIONAR» y en el traspaso.)
