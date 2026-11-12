# Publicar un cambio de producto con MR

Todo paso de subida pide la confirmación del usuario (B1). Orden:

## 1. Preparar

1. **Leer `develop` remoto de verdad, no la copia local.** Algunos clones tienen un `fetch` de una sola rama (pasa en `microui-monitoring`): `git fetch origin` termina sin error y `origin/develop` sigue viejo. Traerlo explícito: `git fetch origin develop:refs/remotes/origin/develop`, y comprobar contra la API (`GET /projects/:id/repository/branches/develop`) que el último commit coincide y qué versión de producto y de DS fija su `package.json`. Con eso se parte de la versión correcta (la del producto sube desde la de `develop`, no desde la de la rama).
2. Mirar los MR recientes. Si `develop` avanzó, **rebasar**: `git rebase origin/develop`. Un conflicto de README o de documentación suele ser de adiciones por ambos lados: conservar las dos.
3. Commitear lo pendiente en commits temáticos. La versión va en su propio commit.
4. Crear la rama de publicación `feature/<tema>` desde ahí (si la rama actual ya se fusionó en otro MR, no reutilizarla).

## 2. Versión y suite

1. Subir la versión en los cinco sitios (`version-en-cinco-sitios.md`).
2. Suite completa con salida filtrada: `npm run lint`, `npm run test:ci`, `npm run test:mock` y `npm run test:rules` si existen, y `npm run build`. Anotar las cifras.
3. Reiniciar los servidores locales después (`ng test` y `ng build` los rompen).

## 3. Subir y abrir el MR

1. `git push -u origin <rama>`.
2. MR a `develop` por la API: título en ASCII, cuerpo en un archivo JSON UTF-8. Descripción con: qué cambia, contrato propuesto (si lo hay), **pareja** con enlace, verificación con cifras, lo no verificado y la versión.
3. Abrir la pareja y editar ambas descripciones para enlazarse entre sí.
4. **Comprobar el MR recién abierto** antes de avisar al revisor: `GET /projects/:id/merge_requests/:iid?include_diverged_commits_count=true` debe dar `has_conflicts: false` y `diverged_commits_count: 0`. Si no, arreglarlo primero (fusionar `develop` en la rama y rehacer la versión) y corregir la descripción. Revisar también cada afirmación de la descripción contra GitLab: no escribir que algo «nunca se subió» sin haberlo leído.

## 4. Después de la fusión

1. Los pipelines de `develop` de cada repo: `verify`, `package container image`, `delivery helm chart` y `deploy to qa`. Esperar a que terminen.
2. Si `deploy to qa` falló, leer el registro del job: un timeout de Docker Hub al bajar `oke-cli-tools` se reintenta con **Retry** (lo hace quien tenga rol de despliegue; el token del agente recibe 403).
3. Comprobar QA en vivo (`diagnostico-qa.md`).

## Si el entorno bloquea la fusión

Fusionar sin revisión de otra persona puede estar bloqueado por el entorno y por el rol de GitLab. No se rodea: se informa qué MR está listo (pipeline en verde, sin conflictos, sin discusiones abiertas) y quién puede fusionarlo.
