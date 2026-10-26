# Angular moderno: guía de framework

Este skill decide **qué se construye y cómo se organiza** (producto, sistema de
diseño, arquitectura del repositorio). Cómo se escribe Angular actual lo
resuelven dos skills oficiales del equipo de Angular que este catálogo incluye
**sin modificar**:

| Skill vendorizado | Para qué |
|---|---|
| `angular-developer` | Código Angular y guía de arquitectura: componentes, señales, formularios, DI, rutas, estilos, accesibilidad, pruebas, CLI. Trae 40 referencias por tema. |
| `angular-new-app` | Crear una aplicación nueva con el CLI y sus flags. |

Origen: `https://github.com/angular/skills` (MIT, Copyright 2026 Google LLC). El
commit exacto y los hashes de cada archivo están en `UPSTREAM.json` dentro de
cada skill; la licencia, en `LICENSE-UPSTREAM.md`. Se actualizan con
`npm run sync:angular` desde el repositorio Skils; `npm test` falla si alguien
edita una copia.

## Cómo se usa junto a este skill

1. **Confirmar la versión de Angular del proyecto** antes de escribir código
   (`package.json`, `ng version`). Es la primera regla de `angular-developer` y
   la de nuestro bloqueante B13.
2. **Leer la referencia del tema que toca**, no todo el conjunto. Se lee desde
   el skill instalado `angular-developer/references/<tema>.md`:

| Voy a escribir… | Leer |
|---|---|
| Un componente | `components.md`, `inputs.md`, `outputs.md`, `host-elements.md` |
| Estado, derivados, sincronía entre señales | `signals-overview.md`, `linked-signal.md`, `resource.md`, `effects.md` |
| Un servicio o un provider | `creating-services.md`, `di-fundamentals.md`, `defining-providers.md`, `injection-context.md`, `hierarchical-injectors.md` |
| Llamadas HTTP | `http-client.md` |
| Un formulario | `signal-forms.md`, `reactive-forms.md` o `template-driven-forms.md` |
| Rutas, guards, resolvers | `define-routes.md`, `route-guards.md`, `data-resolvers.md`, `loading-strategies.md`, `router-lifecycle.md` |
| Estilos de componente, animaciones | `component-styling.md`, `angular-animations.md` |
| Un control accesible propio | `angular-aria.md` |
| Nombres de archivos y clases | `naming-conventions.md` |
| Pruebas | `testing-fundamentals.md`, `component-harnesses.md`, `router-testing.md`, `e2e-testing.md` |
| CLI, migraciones, entorno | `cli.md`, `migrations.md`, `environment-configuration.md`, `mcp.md` |

3. **Aplicar la precedencia** de `arquitectura-proyecto.md` sección 1: usuario,
   luego reglas del repositorio, luego este skill, luego Angular. Si el skill
   oficial no está instalado, leer su `SKILL.md` y la referencia puntual desde
   el repositorio oficial y declararlo.

## Reglas oficiales que este skill hace suyas

Verificadas leyendo `angular-developer` en el commit fijado:

- **Los efectos no propagan estado.** Regla marcada "CRITICAL" en `effects.md`:
  si un `effect` hace `.set()` o `.update()` sobre otra señal para mantenerlas
  sincronizadas, es un error (ciclos y `ExpressionChangedAfterItHasBeenChecked`).
  El estado derivado se expresa con `computed()` o `linkedSignal()`. Los
  efectos se reservan para trabajo fuera del grafo de señales (registro,
  almacenamiento, un lienzo o librería de terceros).
- **Señales como base del estado**; entradas con `input()` /
  `input.required()` y salidas con `output()`. El decorador `@Input` sigue
  funcionando; en código nuevo, la función.
- **`@HostBinding` y `@HostListener` se evitan en código nuevo**; se usa la
  propiedad `host` del decorador del componente.
- **Control de flujo de plantilla** `@if`, `@for`, `@switch`; nada de
  `*ngIf`/`*ngFor`.
- **Etiquetas autocerradas** cuando el componente no proyecta contenido
  (`<app-x />`).
- **`inject()`** para la inyección y servicios `providedIn: 'root'`.
- **Componentes standalone** (por defecto desde Angular 19).
- **Nombres**: respetar primero las convenciones del proyecto. El estilo
  "Intención sobre rol" (archivos sin sufijo `.component.ts`/`.service.ts`) solo
  se aplica a proyectos nuevos configurados así; `naming-conventions.md` dice
  expresamente que no se fuerza en proyectos que usan sufijos.
- **Formularios**: en aplicaciones nuevas de Angular 22 o posterior, Signal Forms
  por defecto; en aplicaciones existentes se respeta la estrategia que ya usan.
- **Pruebas**: Vitest, arneses de componentes y `RouterTestingHarness`; enfoque
  sin zone.js y asíncrono desde el inicio.
- **Accesibilidad de componentes propios** con Angular Aria.

## Conflictos conocidos y cómo se resuelven

`angular-developer` es genérico y puede pedir cosas que un repositorio prohíbe.
Estas son las diferencias ya detectadas; en todas manda la regla del
repositorio o del usuario y el cierre lo declara:

| Lo que dice el skill oficial | Cuándo cede |
|---|---|
| Paso 3 de `SKILL.md`: "ejecuta `ng build` al terminar y no omitas este paso" | Si el repositorio prohíbe ejecutar build, `tsc` o pruebas sin pedido del usuario. Se verifica con los logs del servidor de desarrollo y el navegador, y se declara. |
| Plantilla y estilos en archivos separados | Si el repositorio exige plantilla y estilos inline en el `.ts` (FleetOperations). El oficial lo permite: solo dice cómo nombrarlos si se separan. |
| Signal Forms en proyectos nuevos v22+ | Si el Design System expone controles con otro contrato o el proyecto ya usa otra estrategia; se decide y se registra. |
| Usar el CLI para generar archivos | Si el repositorio arma archivos a mano por convención propia; el CLI no se impone a una estructura ya definida. |
| Bootstrap con `--ai-config` y el servidor MCP del CLI (`angular-new-app`) | Opcional; se ofrece al usuario, no se asume. |

## Auditar contra esta guía

El modo AUDITAR del skill (ver `auditoria-arquitectura.md`) usa las reglas de
este archivo como criterio, junto con las del repositorio. Una regla oficial que
el código incumple no es un error del repositorio si el repositorio decidió otra
cosa: se registra como desviación consciente, no como hallazgo.

## Mantenimiento

- Para actualizar: `npm run sync:angular` (última versión) o
  `node scripts/sync-angular-skills.mjs <commit>` (una revisión fija); luego
  `npm test`, revisar el diff de las referencias y publicar.
- Las copias vendorizadas nunca se editan a mano. Lo propio va en este skill.
- Si el equipo de Angular cambia una regla que aquí se cita (por ejemplo la de
  efectos), esta sección se corrige en el mismo cambio que la sincronización.
