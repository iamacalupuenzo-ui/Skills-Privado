# Patrones de accesibilidad y motor de comportamiento (Angular)

Leer este archivo al construir cualquier componente que necesite: foco atrapado, portal a
`document.body`, bloqueo de scroll, cierre con Escape/clic afuera, navegación por teclado jerárquica, o
una animación de entrada/salida propia. Son los mismos problemas que resuelve un componente "difícil"
(Modal, Menu, Toast, Table con selección) — acá está el criterio y el código de referencia para
resolverlos a mano, sin ninguna librería de UI externa (ver `PRIMENG_PLAN.md` en
`ui-components` para el porqué de esa decisión).

**El motor de comportamiento/accesibilidad (foco, portal, scroll, cierre, navegación por teclado) es
distinto del motor de movimiento visual (interpolar un número entre dos valores con una curva de
easing).** Lo primero se construye siempre a mano — es lógica de negocio del sistema, no algo que una
librería resuelva mejor. Lo segundo sí puede apoyarse en una librería de utilidad (no de UI) si el caso
lo justifica — ver GSAP en la sección 9. No confundir ambas cosas: instalar GSAP no reabre la puerta a
instalar un PrimeNG.

**Los patrones en sí no son propiedad de nadie** — son el estándar público WAI-ARIA Authoring
Practices Guide (APG), la referencia oficial de accesibilidad web para "Dialog (Modal)", "Menu and
Menubar", "Disclosure", etc. Cualquier componente serio los implementa siguiendo esa misma guía. Este
archivo describe CÓMO se implementan en Angular concretamente, con el código real ya construido en
`ui-components` como ejemplo — nunca cita de dónde "viene" el patrón (mismo criterio que B10 en
`SKILL.md`).

---

## 0. El problema que hay que resolver primero, siempre: zoneless

**`ui-components` corre sin `zone.js`** (confirmado: no está en `package.json` — Angular 22 es
zoneless por defecto en este proyecto). Esto cambia una regla fundamental de cómo escribir estado
interno en un componente:

- Una propiedad de clase plana (`protected visible = false;`) mutada DENTRO de un evento ligado por
  Angular (`(click)`, `@HostListener`, un `@Input()` que cambia) SÍ actualiza la vista — esos eventos
  disparan su propia pasada de detección de cambios.
- Esa misma propiedad plana mutada dentro de un `setTimeout`, `Promise.then` suelto, o cualquier
  callback asíncrono que NO pasó por el sistema de eventos de Angular, **cambia en memoria pero la
  vista nunca se entera** — no hay `zone.js` parcheando esas APIs para avisarle a Angular que reaccione.

**Síntoma real, encontrado construyendo Modal:** la transición de entrada (opacity 0→1, scale
0.98→1) nunca se veía — la clase `--visible` nunca se aplicaba al DOM, aunque el foco (un efecto
imperativo, `element.focus()`, que no depende de que Angular vuelva a renderizar nada) sí funcionaba
correctamente en el mismo callback. Eso es la pista: si un efecto imperativo (foco, scroll) funciona
pero un cambio de estado/clase no se refleja, es este problema.

**Fix, siempre:** cualquier estado interno de un componente que se vaya a mutar dentro de un
`setTimeout`/callback async debe ser `signal()`, nunca una propiedad plana:

```ts
// ❌ no se refleja en la vista si se muta dentro de un setTimeout
protected visible = false;
setTimeout(() => { this.visible = true; });

// ✅ signal() notifica a Angular sin importar el contexto
protected readonly visible = signal(false);
setTimeout(() => { this.visible.set(true); });
```

Y en el template, se lee como función: `[class.x]="visible()"`, `@if (rendered())`.

---

## 1. Foco atrapado (focus trap)

Cuando un panel bloquea el resto de la página (Modal), el foco no puede escaparse de adentro con Tab.

```ts
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((elem) => elem.offsetParent !== null); // solo lo visible
}

@HostListener('document:keydown', ['$event'])
protected onKeydown(e: KeyboardEvent): void {
  if (!this.isOpen) return;
  if (e.key === 'Escape') { this.requestClose(); return; }
  if (e.key !== 'Tab' || !this.panelRef) return;
  const focusable = getFocusable(this.panelRef.nativeElement);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
```

Ejemplo real: `projects/comsatel-ds/modal/src/modal.ts`.

## 2. Foco inicial y restauración

Al abrir: guardar qué tenía el foco ANTES (`document.activeElement`), y enfocar el primer elemento
razonable de adentro (el botón de cerrar, o un elemento explícito si el consumidor lo pide vía
`@Input() initialFocusRef?: ElementRef<HTMLElement>`). Al cerrar: devolver el foco a lo que se guardó.
Sin esto, alguien navegando por teclado pierde su posición en la página cada vez que cierra el panel.

```ts
private previouslyFocused: HTMLElement | null = null;

private openModal(): void {
  this.previouslyFocused = document.activeElement as HTMLElement | null;
  // ...
  setTimeout(() => {
    const target = this.initialFocusRef?.nativeElement ?? this.closeBtnRef?.nativeElement ?? this.panelRef?.nativeElement;
    target?.focus();
  });
}

private closeModal(): void {
  // ...
  this.closeTimeout = setTimeout(() => {
    this.previouslyFocused?.focus?.();
  }, 200);
}
```

## 3. Portal a `document.body`

Un panel que debe dibujarse por ENCIMA de todo (Modal, un menú flotante) necesita escapar del flujo
normal del DOM — si se queda anidado donde el `<cs-componente>` fue declarado, cualquier `overflow:
hidden` o `z-index` de un ancestro puede recortarlo o taparlo.

```ts
constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

private portal(): void {
  if (this.portaled) return;
  this.renderer.appendChild(document.body, this.el.nativeElement);
  this.portaled = true;
}

private unportal(): void {
  if (!this.portaled) return;
  if (this.el.nativeElement.parentNode === document.body) {
    this.renderer.removeChild(document.body, this.el.nativeElement);
  }
  this.portaled = false;
}
```

Mover el HOST del propio componente (no un hijo interno) es seguro: Angular sigue su propio árbol de
componentes por separado del DOM físico — reubicar el nodo con `Renderer2` no rompe el ciclo de vida ni
los bindings. Llamar `unportal()` también en `ngOnDestroy()` para no dejar el nodo huérfano si el
componente se destruye mientras está portado.

**No hace falta `ViewEncapsulation.None`** para que el CSS del componente le siga aplicando después de
moverlo — el CSS scopeado (con `ViewEncapsulation.Emulated`, el default) viaja pegado al nodo porque el
atributo de scope (`_ngcontent-xxx`) es parte del propio elemento, no de su posición en el DOM.

## 4. Bloqueo de scroll de la página

```ts
private originalBodyOverflow = '';

private lockScroll(): void {
  this.originalBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
}
private unlockScroll(): void {
  document.body.style.overflow = this.originalBodyOverflow;
}
```

Guardar el valor ORIGINAL (no asumir `''`) — si algo más ya había puesto un overflow distinto, hay que
devolverlo tal cual estaba, no pisarlo.

## 5. Cierre con clic afuera

El clic debe cerrar SOLO si cae directo sobre el fondo (mask), nunca si viene de un hijo (el panel, un
botón adentro) que burbujea el evento hasta el mask:

```html
<div class="cs-modal__mask" (mousedown)="onOverlayMouseDown($event)">
  <div class="cs-modal" (* el panel no lleva su propio stopPropagation — el chequeo de abajo ya lo cubre *)>
```

```ts
protected onOverlayMouseDown(e: MouseEvent): void {
  if (this.closeOnOverlayClick && e.target === e.currentTarget) this.requestClose();
}
```

`e.target === e.currentTarget` es la clave: solo es `true` cuando el clic originó en el propio mask, no
en un descendiente.

## 6. Animación de entrada/salida sin librería

Dos signals, no una: `rendered` (montado en el DOM, incluye toda la animación de salida) y `visible`
(dispara la transición CSS). Abrir: montar primero (`rendered.set(true)`), un tick después activar
`visible.set(true)` — el tick intermedio (un `setTimeout` sin delay) fuerza el reflow entre "recién
montado en el estado inicial" y "clase que dispara la transición", si no pasa, el navegador puede
coalescer ambos cambios y saltar directo al estado final sin animar. Cerrar: primero `visible.set(false)`
(dispara la transición de salida), y solo DESPUÉS de que la transición termine (un `setTimeout` con la
misma duración que el CSS) recién `rendered.set(false)` (saca el elemento del DOM del todo).

```ts
protected readonly rendered = signal(false);
protected readonly visible = signal(false);

private openModal(): void {
  this.rendered.set(true);
  this.openTimeout = setTimeout(() => this.visible.set(true));
}

private closeModal(): void {
  this.visible.set(false);
  this.closeTimeout = setTimeout(() => this.rendered.set(false), 200); // var(--motion-duration-medium)
}
```

```css
.cs-modal { opacity: 0; transform: scale(0.98); transition: opacity var(--motion-duration-medium) var(--motion-easing-default), transform var(--motion-duration-medium) var(--motion-easing-default); }
.cs-modal--visible { opacity: 1; transform: scale(1); }
```

El valor del `setTimeout` de cierre (`200`) tiene que coincidir con el token de duración usado en el
CSS (`--motion-duration-medium`) — si se cambia uno, cambiar el otro.

## 7. Navegación por teclado jerárquica (para cuando se construya Menu)

Todavía no construido en este proyecto — dejar anotado el patrón del WAI-ARIA APG para "Menu and
Menubar" antes de arrancarlo: flecha abajo/arriba mueve el foco entre ítems del mismo nivel (sin usar
Tab, que debe salir del menú completo), flecha derecha abre un submenú y mueve el foco a su primer
ítem, flecha izquierda cierra el submenú actual y devuelve el foco al padre, Home/End saltan al primer/
último ítem, y escribir una letra salta al siguiente ítem que empiece con esa letra (type-ahead). Igual
que el focus trap de Modal, esto se construye con un solo `@HostListener('keydown')` en el contenedor
raíz del menú, nunca un listener por ítem individual.

## 8. Cola y apilado (para cuando se construya Toast)

Tampoco construido todavía. El patrón real (ya resuelto en React, `toast.tsx` +
`Sistema-de-dise-o-Comsatel`) es responsabilidad del CONSUMIDOR, no del componente Toast en sí — el
componente solo sabe dibujar un toast individual; la cola (máximo N visibles, encolar el resto, timers
de auto-cierre por variante) vive en un servicio/store aparte que el consumidor instancia una vez por
aplicación. Revisar la nota de "Apilados" en `COMPONENT_GAPS.md`/`toast.tsx` de React antes de construir
el servicio de cola en Angular.

## 9. Motor de motion: GSAP (evaluado y aceptado, 2026-09-10)

Para animaciones de ENTRADA/SALIDA de un panel (Modal, y a futuro Menu/Toast), el patrón de la sección 6
(dos signals + transición CSS) sigue siendo el estándar — ya está construido, verificado, y no hace
falta una librería para interpolar una opacidad/escala una sola vez.

Para feedback de INTERACCIÓN sobre un control que se queda en el DOM (ej. "encogerse" mientras se
mantiene presionado un ítem del menú — el equivalente a `whileTap` de Framer Motion en la referencia
React), sí se evaluó e instaló **GSAP** como dependencia real de `comsatel-ds`
(`projects/comsatel-ds/package.json` + `allowedNonPeerDependencies` en `ng-package.json`). Se descartó
antes `@angular/animations`: Angular 22 lo marca deprecado a favor de `animate.enter`/`animate.leave`
(pensado solo para entrada/salida del DOM, no para este caso), así que instalarlo hubiera sido construir
sobre algo que el propio framework está retirando.

GSAP corre su propio ciclo (`requestAnimationFrame`) por fuera de la detección de cambios de Angular —
no depende de `zone.js` ni dispara change detection en cada frame, así que no choca con el modo
zoneless (sección 0). No sustituye nada de foco/portal/teclado — solo calcula el número intermedio de
una animación.

Patrón real: `projects/comsatel-ds/motion/src/press-scale.directive.ts` (desde la 0.4.0 vive en el subpath `/motion`).

```ts
import { Directive, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { gsap } from 'gsap';
import { EASE_DEFAULT } from '../motion/eases';
import { tokenSeconds } from '../motion/token-duration';

@Directive({ selector: '[csPressScale]' })
export class PressScale implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  @HostListener('pointerdown')
  protected onPress(): void {
    this.animateTo(0.98, '--motion-duration-fast');
  }

  @HostListener('pointerup') @HostListener('pointerleave') @HostListener('pointercancel')
  protected onRelease(): void {
    this.animateTo(1, '--motion-duration-leaving');
  }

  // El feedback no reemplaza la activación nativa; solo da paridad visual
  // a Espacio y Enter. No llamar preventDefault ni disparar click manual.
  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (!event.repeat && (event.key === ' ' || event.key === 'Enter')) this.onPress();
  }

  @HostListener('keyup', ['$event'])
  protected onKeyup(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') this.onRelease();
  }

  @HostListener('blur') protected onBlur(): void { this.onRelease(); }

  ngOnDestroy(): void { gsap.killTweensOf(this.el); }

  private animateTo(scale: number, duration: '--motion-duration-fast' | '--motion-duration-leaving'): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.to(this.el, {
      scale,
      duration: tokenSeconds(this.el, duration),
      ease: EASE_DEFAULT,
      overwrite: 'auto',
    });
  }
}
```

**Reglas específicas de PressScale (verificadas 2026-09-11):** es una mejora
decorativa, no vuelve interactivo a un `div` ni añade roles, foco o nombre
accesible. Solo se aplica sobre un control que ya es operable. Debe responder
al puntero y a Espacio/Enter, soltar también en `blur`, respetar
`prefers-reduced-motion: reduce`, sobrescribir un tween anterior y limpiarlo
en `ngOnDestroy()`. La curva y la lectura de duración viven en los helpers
compartidos `eases.ts`/`token-duration.ts`; no volver a registrar una curva
local ni duplicar los milisegundos.

**Antes de usar GSAP para algo nuevo**, la misma pregunta de siempre (B1): ¿lo resuelve ya CSS
(`transition`/`:hover`/`:active`) sin librería? Si sí, no hace falta GSAP — se instaló para el caso
donde el estado no calza limpio en un pseudo-selector CSS (un control que puede tener foco+combinaciones
de estado complejas) o donde a futuro se necesite orquestación (timelines, stagger) que CSS no cubre
bien.

---

## Checklist antes de dar por terminado un componente con este tipo de comportamiento

- [ ] Todo estado que se mute dentro de un `setTimeout`/callback async es `signal()`, no una propiedad plana.
- [ ] Foco atrapado probado con Tab real (no asumido) si el componente bloquea el resto de la página.
- [ ] Foco se restaura al elemento que lo tenía antes, al cerrar.
- [ ] Si porta a `document.body`, se llama `unportal()` también en `ngOnDestroy()`.
- [ ] El bloqueo de scroll guarda y restaura el valor ORIGINAL de `overflow`, no asume `''`.
- [ ] Clic afuera usa `e.target === e.currentTarget`, nunca cierra por un clic que burbujeó desde adentro.
- [ ] La duración del `setTimeout` de desmontaje coincide con la duración real del CSS.
- [ ] Verificado en navegador con interacción real (clicks, Tab, Escape) — no "debería funcionar".
- [ ] Si se usó GSAP, las duraciones salen de un token real (leído en tiempo real o citado explícito),
      nunca un número inventado — y no se usó para algo que CSS puro ya resolvía (sección 9).
- [ ] Una directiva de presión conserva el clic nativo, cubre puntero y teclado, se libera en `blur`,
      respeta `prefers-reduced-motion` y mata sus tweens en `ngOnDestroy()`.
