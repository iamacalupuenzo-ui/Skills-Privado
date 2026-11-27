# Integrar con `integration`

Leer en el modo `INTEGRAR`, antes de construir sobre una rama y antes de cada MR a
`integration`. Cubre B12 a B14.

**Pregunta antes de leer:** si `simular_fusion.py` da 13 choques con `integration`, ¿por qué
no se resuelve con un rebase?

**En 30 segundos:** se fusiona `origin/integration` dentro de nuestra rama con `git merge`,
en un worktree aparte, conservando lo de ambos lados. Nunca rebase ni push forzado: la rama
ya está subida y otros la leen. Después, MR a `integration` con Luis de revisor.

## Lo que pasó (2026-11-17)

Gabriel (`cl2_feature_us_119`) construyó en `integration` la misma página «Estado de las
Unidades» y el estado visual del mapa mientras nosotros lo hacíamos en `CLF_Feature_119`,
apilada sobre `develop`. Nadie revisó `integration` antes de empezar. La simulación dio:

| Repo | Rama | Choques |
|---|---|---|
| microui-monitoring | 121 / 123 / 119 | 6 / 7 / 13 |
| web-flotas | 119 | 6 |
| Los demás productos | — | 0 |

## 1. Antes de construir y antes de cada MR: simular

```bash
python <carpeta del skill>/scripts/simular_fusion.py <repo> CLF_Feature_121 CLF_Feature_123 CLF_Feature_119
```

Hace `git fetch`, corre `git merge-tree --write-tree` por rama (no toca el árbol de trabajo
ni las ramas) y muestra choques, commits propios, cuántos va adelante la base y las cadenas
apiladas. Código 1 si hay choques. Con choques antes de construir: se basa la rama nueva en
`integration` o se pregunta (ver `angular-product-builder`, B22).

## 2. Integrar (decisión de Enzo)

1. **Worktree aparte** `fusion-integration`, nunca el del `ng serve`:
   `git worktree add <ruta>/fusion-integration origin/<rama>` (queda en HEAD separado).
2. **Ref local de trabajo** `fusion/<rama>`: `git switch -c fusion/<rama>` dentro del worktree.
3. **Fusionar:** `git merge --no-ff origin/integration`. Cada choque se resuelve conservando lo
   de ambos lados (las dos funciones, los dos campos, las dos rutas); si dos versiones de lo
   mismo se contradicen, se pregunta en vez de elegir.
4. **Cadenas apiladas:** se fusiona `integration` en la base de la cadena, se pasan sus
   puertas, y se propaga de base a hija con `git merge fusion/<base>` en cada hija, en el
   orden que imprime `simular_fusion.py`.
5. **Puertas** en el worktree de fusión: `puertas.py` de `verificar-calidad` (lint,
   `test:rules`, `test:ci`, build) y `revisar_ds.py`. Lo que ya fallaba se separa de lo nuevo.
6. **Subir por avance rápido**, con confirmación del usuario:
   `git push origin HEAD:refs/heads/<rama>`. Si git lo rechaza por no ser avance rápido,
   alguien subió algo: se vuelve a fusionar, nunca se fuerza.
7. **MR a `integration`**, revisor Luis (`lrodriguez`), en pareja Shell + micro UI cuando
   aplica, con la lista de choques resueltos en la descripción.

Prohibido: `git rebase`, `git push --force` o `--force-with-lease`, borrar y volver a subir la
rama, y resolver un choque descartando un lado sin preguntar.

## 3. La versión del DS antes del commit

```bash
python <carpeta del skill>/scripts/revisar_ds.py <repo> --ref <rama> --pareja <ruta-del-shell>@<rama>
```

Falla si la versión no es exacta, si es una prerelease cuando ya hay una estable igual o
mayor (caso real: `1.17.0-pre.157` con la `1.17.0` como `latest`), si el lock no coincide, si
la pareja fija otra versión o si el código usa un subpath o un valor estático que la versión
publicada no tiene (`variant="neutral"` de `cs-button`). Avisa de valores dinámicos dudosos
(escenas de `cs-illustration`). El cambio de versión es
`npm install @comsatel/ui-components@<estable> --save-exact`, en Shell y micro UI a la vez.

Si el código depende de una pieza que solo existe en una rama del DS sin publicar, esa pieza
no va a MR: se documenta como bloqueada hasta que la versión del DS se publique (`flujo-ds`).

## Pregunta de comprobación

`simular_fusion.py` dice que `CLF_Feature_123` está apilada sobre `CLF_Feature_121` y ambas
chocan con `integration`. ¿En cuál fusionas primero y cómo llega el cambio a la otra?

(Respuesta: primero en la 121, la base de la cadena; después se fusiona `fusion/CLF_Feature_121`
dentro de la 123, y recién entonces se corren sus puertas.)
