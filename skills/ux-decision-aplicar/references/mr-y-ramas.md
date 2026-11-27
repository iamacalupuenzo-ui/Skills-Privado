# Ramas y MR de la KB: que nada quede fuera

Leer al preparar y al cerrar. Todo push o MR requiere orden de Enzo (B7).

## Preparar

- Una rama `docs/<dsp>-<tema>-<AAAA-MM-DD>` desde `origin/develop`, en un `git worktree` aparte si el árbol de Enzo tiene cambios sin guardar. Los worktrees viven en una carpeta temporal y se retiran al terminar.
- Un commit por tema, con mensaje `docs(ux): …`. Los hechos con evidencia (qué se probó) van en la descripción del MR.
- Descripción del MR: qué decide, qué documentos toca, qué queda en `draft` y por qué, y lo que no se verificó.

## Comprobar por la API, siempre

Después de cada push y antes de decir «listo»:

1. Estado del MR: `GET /projects/<id>/merge_requests/<n>` → `state`, `merge_status`, `has_conflicts`. «checking» es transitorio: esperar unos segundos y repetir.
2. **¿El último commit entró?** Comparar el commit de la rama con `origin/<destino>` (`git merge-base --is-ancestor <rama> origin/<destino>`). Si Enzo aprobó el MR antes de que se subiera el último commit, ese commit **no** entró: abrir un MR nuevo desde la misma rama (`POST …/merge_requests` con `source_branch` y `target_branch`) y decirlo.
3. Conflictos: si `has_conflicts` es verdadero, resolver (abajo), subir y repetir la consulta hasta `can_be_merged`.

## Conflicto en `changelog.md` e `index.md`

Casi todos los MR agregan líneas en el mismo sitio (el inicio de la sección del día). Receta:

1. `git fetch origin && git merge origin/<destino>` en la rama.
2. Para cada bloque `<<<<<<<`: conservar **todas** las entradas nuevas del destino y la propia; si la entrada propia ya existía en el destino en una versión anterior, quedarse con la versión nueva y quitar la copia vieja (se ve porque comienza igual).
3. Sin marcadores restantes (`grep -c "^<<<<<<<\|^>>>>>>>"` = 0), `git add`, commit del merge y push.
4. Repetir la consulta del MR.

Resolver con una pequeña rutina que lea el bloque por líneas, no a mano sobre archivos con líneas muy largas.

## Dos o más repositorios

Un cambio en el front y su documentación son MR distintos en repos distintos. Cada uno se comprueba con su propia API; el aviso o la respuesta a quien preguntó cita ambos, e indica qué está integrado y qué no. «Está en el MR» no es «está en `integration`/`develop`».

## Tras integrar

- Enzo actualiza su copia local con `git pull` (cuidando sus cambios sin guardar). Si hace falta, preparar un worktree limpio.
- Recién entonces corresponde la recarga de Notion del módulo.
