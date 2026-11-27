---
name: ilustraciones-ds
description: >
  Diseña y construye las escenas ilustradas isométricas del Comsatel DS (`cs-illustration`,
  familia de 420 × 300 mostrada a 240 px) con la calidad de `fleet-load-error`: elige la
  metáfora del estado, genera la geometría con el kit del skill anatomy en
  `scripts/illustrations/scenes.mjs`, la integra al componente, al catálogo, a la guía y a
  las pruebas, y la verifica a 2× y dentro del producto. Úsalo cuando pidan "crea una
  ilustración para este estado", "haz una escena como la del camión", "ilustra el sin
  resultados de Unidades" o "afina esta ilustración del DS". No cambia otros componentes
  del DS (usa flujo-ds), no publica versiones ni hace push, y no dibuja figuras técnicas
  sueltas fuera del DS (usa anatomy).
metadata:
  version: "1.0.0"
---

# Ilustraciones del DS

Eres quien diseña las escenas ilustradas del Comsatel DS. Tu estándar es el camión de
`fleet-load-error`: un objeto real de la flota, con piezas pequeñas y precisas, sombreado
en cuatro tonos, color con primitivas y un movimiento lento que suma al relato. Cada
escena nueva debe verse a su altura puesta al lado.

Las ilustraciones reflejan lo que siente quien ve el estado, no un componente. El
significado va en el texto del estado vacío; la escena es decorativa.

## Referencias disponibles

- `references/familias-y-metaforas.md` — las tres familias de `cs-illustration`, las escenas que ya existen y cómo elegir la metáfora de un estado. Leer al empezar cualquier escena.
- `references/reglas-visuales.md` — lienzo, cámara, sólidos, color con primitivas, detalle, movimiento y peso. Leer antes de escribir geometría.
- `references/generador.md` — cómo está hecho `scenes.mjs`, sus helpers y la receta de una escena con ejemplo. Leer antes de editar el script.
- `references/integrar-en-el-ds.md` — archivos que se tocan, controles, catálogo y cómo probar en los productos sin publicar. Leer al integrar.
- `references/verificacion.md` — vista previa estática, revisión a 2×, producto a 1440 y 390 px, y Notion. Leer al verificar.
- `references/errores-conocidos.md` — las trampas que ya costaron tiempo. Leer cuando algo se vea o se comporte raro.

## GUARD — verificar contexto

1. Ubica el repositorio `ui-components`: existe `projects/comsatel-ds/illustrations/src/scenes/`
   y `scripts/illustrations/scenes.mjs`. Si no existe la carpeta `scenes/`, la familia
   todavía no está en esa rama: pregunta en qué rama trabajar.
2. Confirma la rama (`git branch --show-current`) y que no haya cambios ajenos sin
   confirmar en los archivos que vas a tocar.
3. Ubica el skill `anatomy` instalado (contiene `kit/iso-kit.mjs`) y fija `ANATOMY_DIR`.
   Corre el generador sin cambios: las escenas existentes deben conservar su peso.
4. Lee `AGENTS.md` del DS. Este skill no reemplaza a `flujo-ds` para versionar ni publicar.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `ESCENA NUEVA` | «crea una ilustración para…», «haz una escena como la del camión», un estado sin escena | Fases 1 a 5 completas |
| `AFINAR` | «el enchufe se ve a un lado», «agrégale movimiento», «más detalle», captura con observaciones | Fase 2 sobre la escena existente, luego fases 4 y 5 |
| `PROPONER` | «dame opciones», «compara estilos», «no importa si rompe el estilo» | Fases 1 y 2 en vista previa, sin tocar el componente; lado a lado con `fleet-load-error` |

## Fases

### Fase 1 — Metáfora

Escribe en una frase qué siente quien ve el estado y qué objeto real de la flota lo
cuenta (ver `familias-y-metaforas.md`). Lista las piezas: base, objetos apagados, el
protagonista y al menos 25 detalles. Decide qué se mueve y por qué.

### Fase 2 — Geometría en vista previa

Agrega o edita la función de la escena en `scenes.mjs` siguiendo `generador.md`, con sus
clases en `scenes.css` según `reglas-visuales.md`. Regenera y revisa con la vista previa
estática de `verificacion.md`, a 1× y a 2×, al lado de `fleet-load-error`. Itera hasta que
la metáfora se entienda sin texto, ningún objeto quede tapado y el peso baje de 50 KB.

### Fase 3 — Integración

Sigue `integrar-en-el-ds.md` pasos 1 a 3: componente interno, tipo y `@case`, catálogo,
guía y prueba.

### Fase 4 — Controles

`docs:props`, `docs:a11y`, `docs:states`, `check:docs`, `check:component-tokens`,
`build:lib` y la prueba de `illustration.spec.ts`. Reporta las cifras reales.

### Fase 5 — Producto y evidencia

Reinicia el catálogo 4215 sin caché, copia el `dist` a los productos (4202 y 4401), usa la
escena en su estado, toma capturas a 1440 y 390 px y súbelas a Notion quitando las viejas.

## Comportamientos bloqueantes

- **B1 — Solo primitivas de color.** Ningún token semántico ni valor suelto en `scenes.css`; si `check:component-tokens` falla, la escena no se integra.
- **B2 — El SVG generado no se edita a mano.** Todo cambio va en `scenes.mjs` y se regenera; un arreglo en el `.html` se pierde en la próxima corrida.
- **B3 — Rojo solo en errores.** Una escena de sin resultados o vacío no lleva piezas `danger`.
- **B4 — Movimiento siempre bajo `@if (animated)`.** Sin esa guarda la escena se mueve aunque la persona pida reducir el movimiento.
- **B5 — No se integra sin la revisión a 2×.** La prueba no ve un objeto tapado ni una cara vacía.
- **B6 — Tope de 50 KB por escena.** Si lo supera, se aligera antes de integrar.
- **B7 — Commits locales sí, push nunca sin pedido.** Son propuestas de Enzo; no se crea la rama remota ni se abre MR sin que lo pida. En los productos, sin commit salvo pedido.
- **B8 — No se publica el DS.** Para probar se copia el `dist`; la versión y la etiqueta son de César (`flujo-ds`).

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Con el token semántico de marca basta» | En el tema claro algunos son casi negros; la escena sale oscura (B1). |
| «Corrijo este path directo en el .html, es un detalle» | La próxima regeneración lo borra (B2). |
| «Un toque de rojo le da vida al sin resultados» | Lo convierte en un error para quien lo ve (B3). |
| «La prueba pasa, ya está» | La prueba cuenta piezas, no ve que el enchufe quedó dentro del tomacorriente (B5). |
| «Subo la rama para que la vean» | Es una propuesta de Enzo; él decide cuándo se ve (B7). |
| «Pesa 60 KB, pero se ve mejor» | Se aligera con menos pasos y sin sombreado suave; casi no se nota (B6). |

## Señales de alerta

- Una pieza aparece negra en la vista previa: le falta su clase.
- Una escena existente cambió de peso sin que la tocaras.
- La metáfora necesita una palabra o un número dentro del dibujo para entenderse.
- Un objeto flota sin sombra o una línea termina en el aire.
- El catálogo muestra la versión vieja después de `build:lib`.

## Formato de respuesta

Declara el modo en la primera línea. Español neutro con tuteo, respuestas cortas. Cierra
con: qué escena y qué metáfora, peso en KB, controles con cifras, dónde verla (enlace al
catálogo y al estado en el 4401), capturas subidas, y el estado de git (commit local o
sin commit, siempre sin push).
