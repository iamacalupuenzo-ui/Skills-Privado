# Paridad obligatoria entre KB y código

Dueño del comparador: `paridad-diseno-desarrollo`, modo `KB-CODIGO`. Dueño del ciclo,
de la sincronización y de las derivaciones de SCR/FLW/UXR/UXS/DEC: `ux-ui-orchestrator`.
Este modo no necesita navegador, Figma, modelos, red ni dependencias de Python.
No reemplaza la validación visual, los contratos API ni la aprobación humana.

## Cuándo bloquea

Ejecutar al cerrar cada tarea de front **y de documentación de ese producto**, después
de sincronizar/regenerar los artefactos y antes de abrir el MR. También si no cambió
código: una modificación de SCR/FLW/UXR/UXS/DEC puede introducir el desfase.
Un informe anterior no sustituye la ejecución sobre las fuentes finales.

- Exit **0 / MATCH**: igualdad de las proyecciones declaradas, con cobertura revisada.
- Exit **1 / DIVERGENT**: diferencias; el informe enumera valores y archivo/línea de ambos lados.
- Exit **2 / BLOCKED**: configuración, fuente, región o evidencia incompleta; nunca es un pase.
- Sin comparador, configuración versionada, código accesible o cobertura suficiente:
  cierre y apertura del MR bloqueados. Una tarea de documentación de una pantalla aún
  no construida puede entregarse como borrador, pero no como paridad/cierre integral.

No resolver una contradicción tomando automáticamente el código como autoridad ni
reescribir una decisión humana para hacer pasar el comando. Registrar la discrepancia,
conservar las fuentes y solicitar la decisión responsable. Una contradicción documentada
sigue siendo una divergencia bloqueante; no existen allowlists de diferencias toleradas.

## Configuración del paquete

Versionar `paridad-kb-codigo.json` junto al paquete o en su repo de documentación.
La plantilla completa está en `examples/paquete.json` del skill: sus nombres y contenido
son **sintéticos**, no una configuración aprobada de DSP-004. Copiarla y adaptar los
selectores con evidencia de las fuentes; no ejecutarla contra producción sin adaptación.
Agregar otro paquete consiste en otro JSON, sin modificar Python.

Contrato JSON, `schema_version: 1`:

- `package`: ID; `screens`: inventario completo de pantallas afectadas. El orquestador
  contrasta este inventario con rutas, menú y cambios reales; no puede omitir pantallas
  para obtener MATCH. Incluir las pantallas del Shell que aportan navegación.
- `sources`: nombre → `root`, `role` (`kb`/`code`), `ref`. Raíces relativas al JSON o
  sobrescritas por `--root nombre=ruta`. La KB exige un commit/ref Git, nunca WORKTREE.
  Código admite commit/ref o WORKTREE para verificar lo que realmente se está cerrando.
- `checks`: `id`, `screen`, `dimension` (`components`, `fields`, `navigation`, `texts`),
  `comparison` (`set`, `sequence`, `multiset`; por defecto `set`) y selectores `kb`/`code`.
  Hay que cubrir las cuatro dimensiones **por pantalla**, y comparar fuentes de los
  cinco tipos SCR, FLW, UXR, UXS y DEC. Un tipo/archivo ausente se completa o se informa
  como bloqueo; no se inventa una decisión. Una lista vacía no representa cobertura.
- Selector: `source`, `file` relativo exacto, `region` regex con grupo `body` (una sola
  coincidencia), `pattern` regex con grupo `value`; en KB, además `artifact_type`.
  Usar regiones vigentes con límites de sección, no buscar en todo el historial.
- `format`: `text`, `typescript` o `angular-template`. El último extrae el template literal
  de un `.ts` o lee `.html` y excluye comentarios HTML. Para componentes, comparar los
  tags `cs-*` del template de la pantalla **y sus componentes hijos** relevantes; imports
  o menciones en comentarios no prueban uso. Archivos con template dinámico/no soportado
  requieren adaptar su proyección y revisión; nunca deducir que no hay componentes.
- `aliases`: equivalencias explícitas y revisadas entre prosa y claves técnicas, por ejemplo
  `"peso": "weightUnit"`. No introducir aliases que conviertan decisiones distintas en iguales.
  Se normalizan Unicode NFC, espacios y mayúsculas/minúsculas. Comparar texto sensible
  a capitalización o lógica ejecutada requiere otro control, no una afirmación de cobertura.
- `allow_empty: true` solo si una ausencia dentro de una región identificada es significativa
  (p. ej. no existe un acordeón en el template). No permite omitir archivos ni regiones.
  Probar cada selector también con un defecto inyectado para evitar patrones que ignoren
  valores nuevos. Los textos se extraen como conjunto real, no solo buscando el esperado.

El script valida cobertura estructural; una persona/agente responsable revisa la cobertura
semántica de la configuración. Un MATCH no demuestra que la configuración incluya todo el
producto ni detecta comportamiento dinámico, datos del backend o diferencias visuales.
Esas comprobaciones siguen obligatorias. No presentar el resultado como «cero diferencias
de cualquier tipo»: reportar alcance, pantallas y dimensiones realmente comprobadas.

## Ejecución

Resolver la ruta instalada o la fuente central de este skill. Ejemplo PowerShell,
sustituyendo las rutas; no copia scripts al producto ni modifica la instalación:

```powershell
py "<skill>/scripts/paridad_kb_codigo.py" --config "<paquete>/paridad-kb-codigo.json" --root "kb=<repo-kb>" --root "code=<repo-front>" --ref "kb=<sha-kb-sincronizada>" --ref "code=WORKTREE" --json
if ($LASTEXITCODE -ne 0) { throw 'Paridad KB-código bloqueada' }
```

Preparar las fuentes con el fetch explícito y comprobación remota del ciclo. La rama nueva
de KB parte de `origin/develop` fresco; tras sincronizar se valida **su commit**, no se
compara el código nuevo contra develop antiguo. Para un MR, usar los commits exactos de
las ramas que se enviarán y repetir si cambian archivos, configuración o refs. Si hay varios
repos de código (Shell y micro UI), declarar ambos y comprobarlos en la misma configuración.

El comando solo lee: el JSON sale por stdout; guardar el informe en el destino autorizado.
Incluye SHA del JSON, commits, hashes SHA-256 de archivos leídos, valores y líneas. Para
WORKTREE detecta modificaciones de los archivos leídos durante la ejecución. Quien cierra
verifica que la configuración y el inventario correspondan al alcance y que las fuentes
no hayan cambiado después. Adjuntar el resultado al cierre y a la descripción del MR.
Integrar el mismo comando como paso obligatorio de CI por paquete al autorizar cambios
en ese repo; este cambio de skills no instala CI ni hooks en proyectos ajenos.

## Pruebas y evidencia del 18-nov-2026

```powershell
py -m unittest discover -s "<skill>/tests" -p "test_*.py"
```

Los fixtures `tests/fixtures/regresiones-2026-11-18.json` contienen extractos literales,
SHA y línea original, obtenidos con `git show` de knowledge-base y los fronts:

- KB `e7670ed4ad27cdf180e3563c5827b21c383beb73`: cinco unidades en SCR-055;
  acordeón en SCR-053; entrada con pestañas en la resolución UXR-111-Q1.
- Micro UI `4487a0bd201106c168b40db7b446973e1bdb2ca4`: incluye `weightUnit`;
  `f6ca4fc64c0fd550ef96647c5efb114862bca0f4`: template de página sin acordeón.
- Shell `54b6470bda293b64c7683d56284fbf99db6c9b80`: menú del mock con dos hijas;
  `shell-layout.mapper.ts` agrupa por `parent`. Esto verifica código/configuración estática
  del piloto, no el menú servido por el BFF real ni una sesión en vivo.
- KB `a0300f0239ffd5b59a57a45192c18d754f015cd1` corrige esas tres proyecciones:
  tres pruebas positivas evitan perpetuar el diagnóstico histórico. No afirman paridad
  completa actual: sigue documentada, por ejemplo, la lista fija frente al catálogo dinámico.

Las regresiones aisladas prueban extractores/comparación, no son una configuración de
cierre completa. Otras pruebas ejecutan la CLI con cobertura de los cinco tipos y cuatro
dimensiones, salidas 0/1/2, fuentes ausentes, regiones ambiguas, comentarios, orden,
duplicados, WORKTREE y un segundo paquete sin cambiar el motor.
