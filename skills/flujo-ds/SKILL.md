---
name: flujo-ds
description: >
  Flujo de trabajo dentro del Design System de Comsatel (`ui-components`, paquete
  `@comsatel/ui-components`): cambiar un componente o una guía, versionarlo con SemVer,
  publicarlo (develop → release → etiqueta → main), registrar brechas en GAPS.md y planear
  cómo lo consumen los productos. Úsalo cuando pidan "cambia este componente del DS",
  "publica el DS 1.x", "crea la etiqueta del DS", "registra esta brecha del sistema" o "sube
  el DS a los productos". No construye pantallas de producto (usa flujo-producto) ni audita
  tokens (usa comsatel-design-system).
metadata:
  version: "1.0.0"
---

# Flujo del Design System

Trabajas dentro de `ui-components`. El `AGENTS.md` de ese repositorio manda sobre este skill:
léelo antes de tocar nada. Aquí vive el orden de publicación y las trampas que ya costaron
tiempo.

## Referencias disponibles

- `references/publicar-el-ds.md` — los pasos exactos de `develop` a `main`, con cómo verificar cada uno. Leer al publicar.
- `references/subir-ds-a-productos.md` — cómo se consume una versión nueva en los cuatro productos. Leer después de publicar.
- `../orquestador-desarrollo/references/hooks-bloqueantes.md` — qué frena el guardia (etiquetas `ds-v*`, `npm publish`, push a ramas protegidas) y por qué: las etiquetas y la publicación del DS las ejecuta César, no el agente.

## GUARD — verificar contexto

1. Estás en `ui-components` (existe `projects/comsatel-ds/package.json` y `GAPS.md`). Si no, derivar a `flujo-producto`.
2. Leer `AGENTS.md` y `docs/versionado.md`; confirmar la versión actual en `develop`, `release` y `main`.
3. **Pedir confirmación antes de cambiar un componente**: explicar qué cambia y por qué, con evidencia (por ejemplo, reproducir el defecto en el navegador), y esperar el visto bueno.
4. Leer los MR abiertos: no abrir un cambio que se pise con otro.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `CAMBIO` | «cambia/arregla/agrega» un componente, token o guía | Rama `feature/` o `fix/` desde `origin/develop`, controles, MR a `develop` |
| `BRECHA` | «registra», «falta un componente», «anota esto para el DS» | `npm run gap:report -- "Qué falta" "Qué usar en su lugar" "Por qué o estado"` en una rama aparte |
| `PUBLICAR` | «publica», «etiqueta», «lleva a release» | `references/publicar-el-ds.md` |
| `CONSUMIR` | «sube el DS a los productos» | `references/subir-ds-a-productos.md` |

## Versionado (docs/versionado.md)

- Un paquete SemVer. **Función nueva = versión menor, nunca parche.** Un arreglo sin API nueva = parche.
- Cada guía declara «Disponible desde X.Y». Las marcas Nuevo/Actualizado solo cubren la versión actual y la anterior (`npm run check:versions` lo hace cumplir).
- Un cambio de API o de distribución exige `docs/releases/<versión>.md` con resumen, impacto para consumidores y verificación.
- Ramas que cambian la librería van en cadena, no en paralelo: cada una con su versión.

## Controles que deben pasar antes de dar un cambio por terminado

- `npm run check:docs` (guías, props, accesibilidad, imports de entrada, versiones).
- `npm run test:ci`.
- `npm run check:release-notes` antes de cualquier etiqueta.
- Si cambias API o plantilla de un componente: `npm run docs` y completar las filas «Sin descripción» (`check:props` falla mientras quede alguna).

## Brechas del sistema

Si falta un componente o variante, no se inventa un envoltorio: se pregunta, y si se confirma, se registra en `GAPS.md` **en el mismo cambio**. Un componente se construye primero en el producto, con una API pensada para migrar (propiedades de entrada y evento de salida, solo tokens, sin dependencia del servicio de la pantalla), y entra al DS por olas cuando el diseño está validado.

## Comportamientos bloqueantes

- **B1 — La etiqueta va después de fusionar a `release`.** Una etiqueta `ds-vX.Y.Z` sobre un commit anterior publica el contenido viejo; si ocurrió, se borra y se rehace. Nunca se crea «para adelantar».
- **B2 — No se crea la etiqueta hasta que `check:release-notes` pase.**
- **B3 — `release`, la etiqueta y `main` son del arquitecto o del usuario**, y solo con su autorización explícita en esa acción. Si el entorno bloquea una fusión sin revisión, se informa (no se rodea).
- **B4 — La versión de los productos se fija exacta** (`"1.9.2"`, sin `^`): el DS es singleton compartido entre Shell y micro UIs.
- **B5 — Los cambios al DS no se publican sin confirmación del usuario.**
- **B6 — Un fallo de infraestructura del pipeline** (timeout al bajar una imagen de Docker Hub) se reintenta; no se interpreta como error del cambio.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Es un cambio de estilo, no necesita nota de versión» | Si cambia lo que ven los consumidores, la nota explica el impacto (B2). |
| «Etiqueto ya y fusiono después» | La etiqueta quedaría sobre el commit viejo (B1). |
| «Sube la versión de los productos con `^`» | Con rangos, Shell y micro UI pueden quedar en versiones distintas y el remoto no carga (B4). |
| «Lo registro en un ticket, no en GAPS.md» | El próximo agente lee GAPS.md, no tu bandeja. |

## Señales de alerta

- `check:release-notes` no encuentra la nota de la versión.
- `release` y la etiqueta apuntan a commits distintos.
- Un producto fija un DS que no existe en el registro.
- `npm run build:lib` falla con EBUSY: hay un `ng serve` del 4200 corriendo; detenerlo y reparar el enlace de `node_modules/@comsatel/ui-components`.

## Formato de respuesta

Declarar el modo. Cerrar con: qué cambió, qué controles corrieron (cifras), en qué paso del camino está (`develop`, `release`, etiqueta, `main`) y qué falta.
