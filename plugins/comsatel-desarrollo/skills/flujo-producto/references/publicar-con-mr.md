# Publicar un cambio de producto con MR

**Pregunta antes de leer:** ¿por qué nuestro MR va a `integration` y quién lo lleva después a `develop`?

**En 30 segundos:** desde el 2026-11-12, en CL2 solo `integration` despliega en DEV. Cada historia tiene su rama (`CLF_Feature_<n>`), que sale de `develop` y llega a DEV con un MR hacia `integration` que revisa Luis. Nosotros (UX Engineering) no subimos a QA. Llevar la historia a `develop` le toca al equipo de desarrollo, con su propio MR y nunca desde `integration`.

Todo paso de subida pide la confirmación del usuario (B1), y cada MR la suya.

## El flujo de ramas

La regla está en el README de `comsatel/infrastructure/ci-cd`, sección «Rama integration: despliegue a DEV en CL2».

| Rama | Qué hace | Quién entra |
|---|---|---|
| `CLF_Feature_<n>` | Trabajo de una historia; solo corre sus pruebas, no despliega | Nosotros, desde `origin/develop` |
| `integration` | Única rama que construye y despliega en DEV (imagen `<versión>-dev`) | Por MR, revisa Luis (`lrodriguez`) |
| `develop` | Base de QA | Cada rama por su lado, con su MR; lo decide desarrollo |

- **`integration` nunca se mezcla hacia `develop`.** `integration` junta el trabajo de todos para DEV, así que mezclarla en `develop` arrastraría ramas de otras personas. El guardia bloquea ese MR.
- **El equipo mantiene `integration` al día** mezclando `develop` en ella. Si nuestro MR choca con lo que integraron otros, el conflicto se resuelve en nuestro MR.
- **Desarrollo puede crear su rama desde la nuestra** para conectar el backend real.
- **El DS (`ui-components`) y el knowledge-base no cambian:** rama `feature/<tema>`, MR a `develop` y revisor César.

## Nombre de la rama

La rama se llama `CLF_Feature_<n>`. `CLF` es Flotas y `n` es el IID del issue de la historia en el proyecto **collaboration** (id 622, etiqueta «User Story»). Por ejemplo, «US108: Consultar y actualizar los datos de un Distribuidor» es el issue #108, así que su rama es `CLF_Feature_108`. El shell y la micro UI usan el mismo nombre.

- **Una rama por historia.** Si dos historias comparten código (servicio, rutas, menú), la segunda **se apila** sobre la primera: `CLF_Feature_111` sale de `CLF_Feature_108`. Su MR se abre cuando la primera ya entró; si se abre antes, se avisa en la descripción.
- **Si una rama mezcla dos historias,** se separa antes de subir y se guarda un respaldo local de la rama original.
- **Antes de crear la rama,** busca si la historia ya tiene ramas del backend (`CL2_FEATURE_US<n>` en el BFF o en servicios). El contrato del mock tiene que coincidir con el suyo.

## 1. Preparar

1. **Lee `develop` e `integration` en el remoto, no en la copia local.**
   - Tráelas de forma explícita: `git fetch origin develop:refs/remotes/origin/develop integration:refs/remotes/origin/integration`.
   - Compara el último commit con la API (`GET /projects/:id/repository/branches/develop`).
   - Revisa qué versión del producto y del DS fija cada `package.json`.
2. **Crea la rama** `CLF_Feature_<n>` desde `origin/develop`. Si `develop` avanzó, rebasa sobre `origin/develop`.
3. **Haz commits temáticos.** La versión va en su propio commit.
4. **Haz una mezcla de prueba contra `integration`** antes de subir: `git merge-tree --write-tree origin/integration <rama>`. Si hay conflictos, resuélvelos en tu rama antes de abrir el MR.

## 2. Versión y suite

1. **Sube la versión en los cinco sitios** (`version-en-cinco-sitios.md`) si lo que cambia se despliega. Un cambio solo del mock (`dev/mock-bff`) no se despliega y no sube versión.
2. **Corre la suite completa** con la salida filtrada y anota las cifras: `npm run lint`, `npm run test:ci`, `npm run test:mock` y `npm run test:rules` si existen, y `npm run build`.
3. **Reinicia los servidores locales** después, porque `ng test` y `ng build` los rompen.

## 3. Subir y abrir el MR

1. **Sube la rama** con confirmación: `git push -u origin CLF_Feature_<n>`.
2. **Abre el MR hacia `integration`:**
   - Revisor: Luis (`lrodriguez`).
   - `remove_source_branch: false`. La rama sigue viva porque desde ella se lleva la historia a `develop`.
   - Título en ASCII y cuerpo en un archivo JSON UTF-8.
   - Descripción: enlace al issue de la historia en collaboration, qué cambia, contrato propuesto del mock, **pareja** con enlace, verificación con cifras, lo no verificado y la versión.
3. **Abre el MR de la pareja** (shell o micro UI) y edita las dos descripciones para que se enlacen entre sí.
4. **Comprueba el MR recién abierto:** `GET /projects/:id/merge_requests/:iid?include_diverged_commits_count=true` debe dar `has_conflicts: false`. Revisa cada afirmación de la descripción contra GitLab.

## 4. Después de la fusión

1. **Espera el pipeline de `integration`** en cada repo: construye la imagen `<versión>-dev` y la despliega en DEV.
2. **Si el despliegue falló, lee el registro del job.** Un fallo de infraestructura lo reintenta quien tenga rol de despliegue. Uno de código se corrige en la rama y vuelve por MR.
3. **Comprueba DEV en vivo.**
4. **Avisa a desarrollo** que la rama está en DEV y lista para tomarla como base. El MR hacia `develop` no lo abrimos nosotros, salvo que el equipo lo pida.

## Si el entorno bloquea la fusión

El entorno y el rol de GitLab pueden bloquear una fusión sin revisión de otra persona. No se rodea. Se informa qué MR está listo (pipeline en verde, sin conflictos ni discusiones abiertas) y quién puede fusionarlo.

**Pregunta de comprobación:** terminaste la historia US116 y comparte el servicio de la API con US108. ¿Cómo se llama la rama, desde dónde sale y hacia qué rama abres el MR?
