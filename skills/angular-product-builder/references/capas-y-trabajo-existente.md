# Capas del repositorio y trabajo existente

Leer en GUARD (pasos 10 y 11) y en CONSTRUIR antes de crear el primer archivo y
antes de cada commit. Cubre B20 a B24.

## El error que esto evita (ocurrió)

En `microui-monitoring`, al construir la página «Estado de las Unidades»
(HU-07-05, rama `CLF_Feature_119`), el modelo, el cliente HTTP y la validación
quedaron dentro de `features/visual-state-settings/`:

```text
features/visual-state-settings/visual-state-settings.api.ts         cliente HTTP
features/visual-state-settings/visual-state-settings.model.ts       modelo
features/visual-state-settings/visual-state-settings.validation.ts  validación
```

El README del repositorio (sección «Estructura de carpetas y reglas») dice que
`core/<dominio>/` lleva los datos sin interfaz y `features/<pantalla>/` solo la
página, el servicio de pantalla y los textos. La justificación fue que la
carpeta quedaba «autocontenida y fácil de mover». Además, otro desarrollador ya
tenía esa capa de datos en `core/settings/` de la rama `integration`, con la
misma URL (`/api/customer/visual-state-settings`; la rama nueva usaba
`/api/v1/...`). Nadie lo buscó antes de construir.

`npm run test:rules` pasó: solo comprueba la **dirección** de los imports entre
capas. Una página que importa su propio modelo desde su carpeta no rompe esa
dirección. Por eso la clasificación de cada archivo no se delega en esa prueba.

## 1. Leer las capas del repositorio (B20)

Antes de crear un archivo, leer la estructura y las dependencias que declara el
repositorio, en este orden: `CLAUDE.md`/`AGENTS.md`, los documentos que enlazan
y el README. Algunos repositorios prohíben `CLAUDE.md` y ponen las reglas en el
README (microui-monitoring lo hace por regla de `dev/rules.test.mjs`).

Anotar, con archivo y sección:

- qué carpeta lleva datos, cuál interfaz reutilizable y cuál pantallas;
- en qué dirección van las dependencias;
- qué puertas pide antes de cada commit.

Si el repositorio no declara capas, proponer la de la tabla siguiente y pedir
confirmación (`arquitectura-proyecto.md`, sección 2).

## 2. Clasificar cada archivo antes de crearlo (B21)

| Si el archivo es… | Va en | Ejemplos |
|---|---|---|
| Datos sin interfaz | `core/<dominio>/` | modelo, tipos del contrato, cliente HTTP, flujo /ws, validación de negocio, adaptadores, fixtures en `testing/` |
| Interfaz que reutilizan varias pantallas | `shared/<tema>/` | marcador del mapa, presentación de una Unidad, tabla de estados |
| Una pantalla | `features/<pantalla>/` | página, servicio de pantalla, servicio de transiciones, textos, `panels/` y `dialogs/` propios |

Reglas de desempate:

- La validación de un formulario que solo traduce errores a textos de la
  pantalla puede vivir en `features/`. La regla de negocio que valida el dato
  (límites, orden de umbrales) es datos: va en `core/`.
- Un tipo que solo usa un componente puede quedarse en ese archivo. Un tipo del
  contrato con la API va en `core/`, aunque hoy lo use una sola pantalla.
- Una tabla de presentación (íconos, variantes de insignia) es interfaz: si la
  usa una sola pantalla puede quedar en `features/`; si la va a reutilizar otra
  (el mapa, por ejemplo), va en `shared/`.
- «Autocontenido», «fácil de mover» o «lo muevo después» **no** son razones
  para saltarse la capa. Mover después cuesta un commit extra y rompe las ramas
  de quien ya importó desde la ruta vieja.

En el plan y en el cierre se escribe una tabla por archivo nuevo:

| Archivo | Capa | Regla que aplica |
|---|---|---|
| `core/settings/visual-state.model.ts` | datos | README, «Estructura de carpetas y reglas»: `core/<dominio>/` datos sin UI |
| `features/visual-state-settings/visual-state-settings.page.ts` | pantalla | README, misma sección: `features/<pantalla>/` página |

## 3. Buscar trabajo existente antes de construir (B22)

```bash
git fetch origin
git branch -r                                   # integration, develop y las ramas de otros (cl2_feature_us_*, CLF_Feature_*)
git log --oneline -10 origin/integration
git ls-tree -r --name-only origin/integration -- src/app/core src/app/features
git grep -n "/api/<recurso>" $(git for-each-ref --format='%(refname:short)' refs/remotes/origin) -- src
git log --all --oneline -i --grep "<HU o recurso>"
```

Buscar por tres claves: el nombre de los archivos que se van a crear, la URL de
la API (con y sin `/v1/`) y el código de la historia (HU-07-05, US119).

Si aparece una capa de datos o una pantalla del mismo recurso:

1. Leerla antes de escribir nada.
2. Basar la rama en ella (o en la rama que la contiene) si el usuario lo
   aprueba, o preguntar cómo seguir.
3. Nunca construir una segunda capa de datos en paralelo. Dos clientes para la
   misma URL divergen (aquí ya diferían en `/v1/`).

## 4. Puertas antes de cada commit (B23)

1. Correr las puertas que declara el repositorio, en su orden. En
   microui-monitoring: `npm run lint`, `npm run test:rules` y
   `npm run test:ci`. Mostrar la salida real (las líneas de resumen, no
   «pasó»).
2. Si algo falla, comprobar si ya fallaba antes del cambio: correr la misma
   puerta sobre la rama base en otro worktree o leer el último resultado de CI
   (sin `git stash`: la pila es compartida entre worktrees y otros agentes).
   En el cierre, separar «ya fallaba» de «nuevo».
3. Correr el revisor de capas del skill (solo lectura, sin checkout):

   ```bash
   python <carpeta del skill>/scripts/revisar_capas.py <repo>              # árbol de trabajo
   python <carpeta del skill>/scripts/revisar_capas.py <repo> --ref <rama> # una rama, sin tocar el worktree
   ```

   Código 0: sin hallazgos. Código 1: datos sin interfaz en `features/` o
   posible trabajo duplicado en otra rama remota. Código 2: ruta o ref
   inválida. Los avisos (tipos de presentación sin componente) se revisan a
   mano y no bloquean.
4. Un hallazgo de capas se corrige antes del commit. Un duplicado se lleva al
   usuario con las dos rutas antes de seguir.
5. En los productos de Comsatel, además (si esos skills están instalados):
   `puertas.py` de `verificar-calidad` corre las puertas sobre la rama exportada con
   `npm ci` y separa lo que ya fallaba; `revisar_ds.py` de `flujo-producto` revisa la
   versión del DS y las piezas que la versión publicada no tiene; y
   `simular_fusion.py` de `flujo-producto` dice si la rama choca con `integration`
   antes de construir y antes del MR.

`test:rules` y el revisor se complementan: el primero ve la dirección de los
imports; el segundo, qué tipo de archivo está en qué capa y si otra rama ya lo
tiene. Ninguno reemplaza la tabla de clasificación del punto 2.

Si Python no está disponible, se hace la revisión a mano con los comandos del
punto 3 y `git ls-tree -r --name-only <rama> -- src/app/features`, y el cierre
lo declara.

## 5. Cuando el diseño choca con una regla (B24)

Si una decisión de diseño (dejar la carpeta autocontenida, reutilizar un tipo
de otra pantalla, saltarse una puerta) contradice una regla del README o del
`CLAUDE.md`, detenerse y preguntar con las dos opciones y su costo. No decidir
en silencio ni dejar la excepción para «después».
