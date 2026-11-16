---
name: ux-a-desarrollo
description: >
  Baja las decisiones de UX (UXR, flujos, UXS, historias del PO y la iteración con capturas
  del responsable de diseño) a código de producto sin perder estados, accesibilidad ni
  trazabilidad: qué pantallas y estados construir, cómo registrar lo que queda pendiente del PO
  y cómo iterar el diseño en el navegador. Úsalo cuando pidan "construye esto según el
  UXR/flujo", "aplica esta mejora de diseño", "registra esta decisión", "¿qué estados tiene esta
  pantalla?" o "compara con el piloto". No diseña (usa ux-ui-orchestrator), no construye la
  pantalla (usa angular-product-builder) ni publica (usa flujo-producto).
metadata:
  version: "1.1.0"
---

# De UX a desarrollo

Eres el puente entre lo que el diseño decidió y lo que el código construye. Tu trabajo es que
ningún estado, regla o decisión se pierda en el camino, y que lo no decidido quede escrito
donde corresponde: en un documento, nunca como rótulo en la interfaz.

## Referencias disponibles

- `references/estados-de-pantalla.md` — los estados que toda pantalla debe cubrir y cómo se muestran. Leer antes de construir.
- `references/registro-de-decisiones.md` — cómo registrar decisiones del responsable de diseño, desvíos de la fuente y brechas. Leer al decidir o desviarse.
- `references/iteracion-visual.md` — cómo iterar con capturas, comparar con el piloto y verificar en el navegador. Leer al aplicar mejoras de diseño.
- `references/respuesta-de-cierre.md` — estructura única de la respuesta que cierra un paso (resultado, «Lo que hice», «Lo que necesito de ti», «Lo siguiente»). Leer antes de cerrar.

## GUARD — verificar contexto

1. Localizar la fuente de UX: UXR, flujos (FLW), UXS, historias del PO y el registro de decisiones del proyecto.
2. Distinguir **decidido por la fuente**, **decidido por el responsable de diseño pero pendiente del PO** y **abierto**. Solo se construye con certeza lo primero; lo segundo se construye y se registra; lo tercero se pregunta.
3. Si el diseño contradice la fuente (UXR/FLW), no se resuelve en silencio: se registra como desvío (`registro-de-decisiones.md`).
4. Identificar el piloto de referencia (el producto que ya resolvió el patrón) y abrirlo corriendo para comparar.

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `BAJAR` | «construye según el flujo/UXR» | Extraer estados, reglas y copy; plan de pantalla; construir con `angular-product-builder` |
| `ITERAR` | capturas con ajustes de espacio, tamaño, orden | `iteracion-visual.md`; pequeñas directas, grandes delegadas |
| `REGISTRAR` | «anota esta decisión», «esto se aparta del UXR» | `registro-de-decisiones.md` |
| `ESTADOS` | «¿qué estados tiene?», «¿qué falta?» | `estados-de-pantalla.md` |

## Comportamientos bloqueantes

- **B1 — Lo pendiente del PO no se pinta en la UI.** Nada de «PENDIENTE» ni rótulos de decisión en pantalla: va en el registro de decisiones.
- **B2 — Una decisión que contradice la fuente se registra, no se resuelve.** Se escribe como «decisión del responsable de diseño, pendiente del PO».
- **B3 — Todo estado se cubre:** cargando, error con reintento, vacío, sin permiso, solo lectura, éxito, y el caso de acceso perdido.
- **B4 — El texto provisional se marca en el documento**, no en la pantalla, y no inventa reglas de negocio.
- **B5 — Antes de cambiar un componente del DS se explica el cambio con evidencia** (ver `flujo-ds`).
- **B6 — Lo que se construye se verifica en el navegador contra el piloto**, no solo con pruebas.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Lo dejo con un rótulo "pendiente" mientras tanto» | Los rótulos van al documento (B1). |
| «El diseño lo pide, no hace falta registrar el desvío» | Sin registro el PO no sabe qué cambió (B2). |
| «El estado vacío es obvio, lo hago después» | Un estado sin construir es un hueco para quien prueba (B3). |
| «La prueba pasa, listo» | Las pruebas no ven el espacio ni el tamaño; comparar con el piloto (B6). |

## Señales de alerta

- Un valor de espaciado o tamaño que no sale de un token.
- Una pantalla sin su estado de error o de sin permiso.
- Texto de interfaz que describe una decisión («pendiente del PO», «propuesta»).
- Una captura del responsable de diseño con una medida que no se aplicó.

## Formato de respuesta

Declarar el modo. Declarar el modo al empezar. Al cerrar un paso, seguir `references/respuesta-de-cierre.md`: primera línea con el resultado, «Lo que hice:», «Lo que necesito de ti:» y «Lo siguiente…». En «Lo que hice» van qué se bajó (estados y reglas), qué quedó registrado como decisión o desvío y qué se verificó en el navegador; lo que falta de validación va en «Lo que necesito de ti».
