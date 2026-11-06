# Arquitectura y reglas del repositorio

Leer siempre antes de escribir una línea en un repositorio existente, y antes
de proponer la estructura de uno nuevo. Este archivo responde tres preguntas:
qué reglas del repositorio mandan sobre este skill, qué patrón de arquitectura
está validado como referencia y qué trampas reales ya costaron tiempo.

Origen: el patrón viene de FleetOperations (repositorio `Prueban1`, Angular 22
sobre Comsatel DS), donde una pantalla llegó a 2 700 líneas y luego un service
a 1 374 antes de que se definieran estas reglas. Su evidencia completa vive en
los documentos de ese repositorio (`CLAUDE.md`, `docs/lineamientos-estructura-
componentes.md`, `docs/arquitectura-new-capture-order.md`). Aquí se resume lo
accionable; no se copia la investigación.

## 1. Precedencia: quién manda cuando dos reglas chocan

De mayor a menor autoridad:

1. **La instrucción explícita del usuario en la sesión actual.**
2. **Las reglas del repositorio**: `CLAUDE.md` o `AGENTS.md` en la raíz y los
   documentos que ese archivo enlaza, en el orden que él indique.
3. **Este skill** (`references/*`).
4. **La guía general de Angular** (skill oficial `angular-developer`, ver
   `angular-moderno.md`) y los valores por defecto del CLI.

Cuando una regla de un nivel inferior contradice a una superior, gana la
superior y el cierre lo declara ("apliqué la regla del repositorio X en lugar
de la recomendación Y"). Ejemplos reales ya resueltos así:

| Recomendación general | Regla del repositorio | Resultado |
|---|---|---|
| Ejecutar `ng build` tras generar código | Nunca correr build, `tsc` ni tests sin que Enzo lo pida | No se ejecutan; se verifica leyendo el código, los logs del servidor de desarrollo y el navegador |
| `templateUrl` y `styleUrl` separados (default del CLI) | `template` y `styles` siempre inline en el `.ts` | Inline |
| Un servicio por feature con todo dentro | Servicio de pantalla + servicio de transiciones | Dos servicios |

## 2. Protocolo de entrada a un repositorio existente

Antes de editar, en este orden:

1. Leer `CLAUDE.md` y/o `AGENTS.md` de la raíz completos. Suelen ser cortos a
   propósito y existen para que el criterio no se descubra por casualidad.
2. Leer los documentos que ese archivo enlaza, en el orden indicado. En
   FleetOperations: lineamientos de estructura primero, luego la arquitectura
   detallada, luego el registro de brechas del Design System, luego los planes
   de la feature concreta.
3. Correr `git status` y anotar qué archivos ya tienen cambios sin commitear:
   pueden ser trabajo de otra persona o de otro agente (ver sección 6).
4. Si el repositorio **no** tiene archivo de reglas, no decidir en silencio:
   proponer el patrón de la sección 3 como punto de partida, pedir
   confirmación y, una vez aceptado, dejarlo escrito en un `CLAUDE.md` del
   repositorio para que la próxima sesión no lo reinvente.
5. Si una decisión de estructura no está cubierta por ningún documento,
   registrarla en el documento que corresponda (o crear uno si el tema es
   nuevo) en lugar de decidirla en silencio.

## 3. Patrón de arquitectura de referencia

Es la convención validada de un repositorio concreto, no una ley de Angular.
Si el repositorio ya declara otra, manda la del repositorio.

### 3.1 Cuándo dividir

Si una pantalla necesita más de una de estas piezas a la vez — filtros, tabla,
formulario de alta o edición, diálogo de acción — **no va en un solo
componente**. Se divide desde el diseño inicial, no cuando ya creció. Las
reglas de lint de Angular que respaldan el criterio son
`@angular-eslint/component-max-inline-declarations` (3 líneas por defecto) y
`max-lines` (300 por defecto). Ningún archivo nuevo debería acercarse a 300
líneas.

### 3.2 Estructura por feature

```text
features/<feature>/
├── <feature>.page.ts                  shell: compone hijos, decide qué diálogo se ve; sin lógica de negocio
├── <feature>.service.ts               estado de pantalla: filtros, orden, paginación, selección,
│                                      helpers de lectura, toast, qué diálogo está abierto
├── <feature>-transitions.service.ts   toda mutación de datos y su validación de negocio
├── <feature>-toolbar.component.ts     filtros y búsqueda, si aplica
├── <feature>-table.component.ts       tabla y sus utilidades, si aplica
├── <feature>-detail-drawer.component.ts   detalle de un registro, si aplica
└── dialogs/
    └── <feature>-<accion>-dialog.component.ts   un componente por diálogo
core/<dominio>/mock-*.service.ts       única fuente de verdad de los datos
```

Nombres en kebab-case, un componente por archivo.

### 3.3 Servicio de pantalla frente a servicio de transiciones

Regla mecánica, válida desde el primer día de la pantalla (no "cuando se sienta
grande"):

- El **servicio de pantalla** puede leer libremente del servicio de datos
  (`orders()`, `fixturesLoading`, `loadFixtures()`), pero **nunca llama
  directo a un método que muta datos** (`create`, `update`, `close`, `annul`,
  `createBulk`, `attachDocument`…).
- Toda mutación y su validación de negocio vive en el **servicio de
  transiciones**: `@Injectable({ providedIn: 'root' })`, sin signals propios,
  recibe datos por parámetro, llama al servicio de datos y devuelve el
  resultado tal cual (`{ kind: 'success' | 'forbidden' | 'not-found' … }`). No
  conoce diálogos, toasts ni qué está abierto.
- El servicio de pantalla es el **único punto de inyección para los
  componentes hijos**. Toolbar, tabla, drawer y diálogos jamás inyectan el de
  transiciones. La dependencia va en una sola dirección: pantalla → transiciones.
  Los métodos del servicio de pantalla (`confirmClose()`, `register()`) son
  envoltorios: llaman al de transiciones y, con el resultado, actualizan sus
  signals (toast, cerrar diálogo, refrescar selección). Ningún componente
  cambia sus imports ni sus bindings cuando se hace esta división.
- El servicio de datos (`core/<dominio>/mock-*.service.ts`, luego el cliente
  real) es la única fuente de verdad. Ni el de pantalla ni el de transiciones
  guardan una copia propia del estado de negocio.

Por qué existe: la regla anterior ("un servicio por feature") no decía qué va
dentro de ese servicio, y volvió a crecer a 1 374 líneas. Esta sí lo dice.

### 3.4 Estado compartido y estado local

- Lo que más de un componente lee o escribe (datos, filtros, selección,
  mensajes) vive en el servicio de pantalla como signals, y los hijos lo
  inyectan con `inject()`. Sin prop-drilling con `@Input`/`@Output` para el
  estado compartido de la pantalla.
- Lo que usa un solo componente (¿está abierto este popover?, ¿qué fila tiene
  el menú abierto?) se queda local; no se sube al servicio "por las dudas".

### 3.5 Diálogos

Un componente por diálogo, bajo `dialogs/`. Si dos pasos son la misma
transición (formulario y su confirmación), van juntos. Las acciones
destructivas usan la variante de peligro del diálogo; las reversibles no.
Patrón de validación de un diálogo con campos obligatorios: un signal por
campo, un signal por mensaje de error, el error se limpia al escribir, se
fija al enviar con el campo vacío y la acción primaria queda deshabilitada
mientras falte un campo.

### 3.6 Plantilla y estilos

En el repositorio de referencia son **siempre inline** dentro del `.ts`, sin
archivos `.html` ni `.css` sueltos. Es una desviación consciente del default
del CLI, elegida por consistencia; dividir en componentes pequeños ya resuelve
el tamaño. En un proyecto nuevo, preguntar; en uno existente, seguir lo que
haga el resto.

### 3.7 Checklist antes de dar una pantalla por terminada

- [ ] Ningún archivo nuevo se acerca a 300 líneas.
- [ ] El shell de la página no tiene lógica de negocio, solo composición.
- [ ] El estado compartido vive en el servicio de pantalla, no repetido.
- [ ] Plantilla y estilos siguen la convención del repositorio.
- [ ] Cada diálogo es su propio componente en `dialogs/`.
- [ ] El servicio de pantalla tiene cero llamadas directas a métodos que
      mutan; todas están en el de transiciones.
- [ ] La compilación está verificada **según la regla del repositorio**: si
      permite ejecutar el build, se ejecuta; si lo prohíbe, se revisan los logs
      del servidor de desarrollo (`ng serve` ya corriendo) y se pide al usuario
      que lo corra. Nunca se marca "compila" sin evidencia.

## 4. Registro de brechas del Design System

El repositorio consumidor **no corrige** el Design System. Cada vez que se
encuentra una brecha (un token que no existe, una altura que no coincide, un
comportamiento que la API pública no permite, un componente ausente), se
agrega una entrada al registro del repositorio (en FleetOperations,
`docs/investigacion-componentes-capturas.md`) con: qué se esperaba, qué hay,
evidencia (fragmento de código o medida) y la propuesta concreta para el DS.
La corrección local que se aplique mientras tanto queda marcada como temporal.
Cuando la brecha se investigó con fuentes externas, se citan.

## 5. Trampas reales de esta arquitectura (ya ocurrieron)

1. **Comillas invertidas en un comentario CSS inline.** Un `` ` `` dentro de un
   comentario de un `styles: [` con template literal cierra la cadena antes de
   tiempo. Angular no señala el archivo: reporta `Failed to resolve styles at
   position 1 to a string. Value could not be determined statically` y el
   servidor de desarrollo no levanta. En comentarios CSS inline no se usan
   comillas invertidas; se usan comillas simples o se escribe el nombre sin
   formato. Ante ese error, buscar primero un `` ` `` suelto en los estilos
   recién editados antes de sospechar de la caché.
2. **La concatenación de strings no estrecha tipos plantilla.** Si un método
   espera `` `bitacora:${string}` `` y la plantilla pasa `'bitacora:' + id`, el
   compilador lo tipa como `string` y falla. Usar un método auxiliar tipado
   (`bitacoraTabKey(id): TabKey { return \`bitacora:${id}\`; }`).
3. **Un input de señal que otro componente enlaza debe ser público.**
   `readonly side = input<'left' | 'right'>('right')` sin `protected`; si es
   `protected`, la plantilla de otro componente no puede enlazarlo.
4. **Los hosts se estilizan con clases de host, no desde el padre.** La
   encapsulación impide que el padre cambie el `:host` de un hijo y no se usa
   `::ng-deep`. La variante se expone como input del hijo y se aplica con
   `host: { '[class.variante]': '...' }`, más una regla `:host.variante {}`.
5. **DOM inyectado por una librería de terceros** (Leaflet, mapas) queda fuera
   de la encapsulación de Angular. Sus estilos van en `styles.css` global, con
   un comentario que explique por qué, replicando los tokens del DS porque el
   componente Angular real no se puede montar ahí.
6. **Estado sincronizado entre pestañas o vistas.** Si un componente reutilizado
   lee una "selección" global y se muestra en otra vista, la vista debe fijar
   esa selección ella misma (un `effect` sobre su input), porque cambiar de
   pestaña con la barra no pasa por la acción que la fijaba.
7. **Servidor de desarrollo con diagnósticos obsoletos.** El watcher a veces
   sigue mostrando errores de código ya corregido. Antes de creerle, confirmar
   en disco que el arreglo existe (`Grep` sobre el archivo); si existe, reiniciar
   el servidor. Cada reinicio pierde la sesión de mock y hay que volver a
   iniciar sesión.

## 6. Trabajo concurrente con otros agentes o personas

Cuando el usuario avisa que otro asistente edita el mismo repositorio, o cuando
un archivo cambia en disco desde la última lectura:

- Tomar el estado actual del disco como el vigente; **no revertir** cambios
  ajenos aunque no se hayan pedido.
- Si un cambio ajeno rompe la compilación en un archivo que no se tocó, **no
  completar ni adivinar** su diseño: reportarlo al usuario con el archivo y el
  síntoma. Solo se corrige una línea faltante evidente cuando bloquea el
  trabajo propio, y se dice explícitamente qué se tocó y por qué.
- Si un cambio ajeno contradice una decisión que el usuario dio antes (por
  ejemplo reintroduce un campo que pidió quitar), avisar; no deshacerlo en
  silencio ni dejarlo pasar.
- No lanzar tareas en segundo plano que consuman tokens sin que el usuario lo
  sepa; si el usuario pide detener una, detenerla y confirmarlo.
- Antes de reiniciar el servidor compartido, considerar que otro agente puede
  estar verificando en él.

## 7. Publicación

Commit y push solo cuando el usuario lo pide de forma explícita. Antes: revisar
`git status`, no incluir secretos, agregar archivos por conjunto coherente
y redactar el mensaje en español neutro explicando el porqué. Un archivo sin
seguimiento cuyo origen se desconoce se revisa (contenido) antes de incluirlo.
