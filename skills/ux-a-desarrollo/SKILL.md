---
name: ux-a-desarrollo
description: >
  Baja las decisiones de UX (UXR, flujos, UXS, historias del PO y la iteración con capturas
  del responsable de diseño) a código de producto sin perder estados, accesibilidad ni
  trazabilidad: qué pantallas y estados construir, cómo registrar lo que queda pendiente del PO
  y cómo iterar el diseño en el navegador. Úsalo cuando pidan "construye esto según el
  UXR/flujo", "aplica esta mejora de diseño", "registra esta decisión", "¿qué estados tiene esta
  pantalla?" o "compara con el piloto". No diseña (usa em-orquestador-ux), no construye la
  pantalla (usa angular-product-builder) ni publica (usa flujo-producto).
metadata:
  version: "1.3.2"
---

# De UX a desarrollo

Eres el puente entre lo que el diseño decidió y lo que el código construye. Tu trabajo es que
ningún estado, regla o decisión se pierda en el camino, y que lo no decidido quede escrito
donde corresponde: en un documento, nunca como rótulo en la interfaz.

## Referencias disponibles

- `references/estados-de-pantalla.md` — los estados que toda pantalla debe cubrir y cómo se muestran. Leer antes de construir.
- `references/registro-de-decisiones.md` — cómo registrar decisiones del responsable de diseño, desvíos de la fuente y brechas. Leer al decidir o desviarse.
- `references/iteracion-visual.md` — cómo iterar con capturas, comparar con el piloto y verificar en el navegador. Leer al aplicar mejoras de diseño.
- `references/seguimiento-de-cambios.md` — qué hacer cuando lo construido se aparta de la documentación y cuando otro cambia la documentación del paquete. Leer al construir y cuando el hook avisa cambios.
- `references/respuesta-de-cierre.md` — estructura única de la respuesta que cierra un paso (resultado, «Lo que hice», «Lo que necesito de ti», «Lo siguiente»). Leer antes de cerrar.

## GUARD — verificar contexto

1. Localizar la fuente de UX: UXR, flujos (FLW), UXS, historias del PO y el registro de decisiones del proyecto.
2. Distinguir **decidido por la fuente**, **decidido por el responsable de diseño pero pendiente del PO** y **abierto**. Solo se construye con certeza lo primero; lo segundo se construye y se registra; lo tercero se pregunta.
3. Si el diseño contradice la fuente (UXR/FLW), no se resuelve en silencio: se registra como desvío (`registro-de-decisiones.md`).
4. Identificar el piloto de referencia (el producto que ya resolvió el patrón) y abrirlo corriendo para comparar.
5. En `BAJAR`, registrar el paquete para seguir sus cambios: `node scripts/seguir-paquete.mjs registrar --kb <kb> --paquete DSP-NNN`. Si la sesión empezó con el aviso del hook, atenderlo primero (`seguimiento-de-cambios.md`, sección 3).

## Detección de modo

| Modo | Señales | Acción |
|---|---|---|
| `BAJAR` | «construye según el flujo/UXR» | Extraer estados, reglas y copy; plan de pantalla; construir con `angular-product-builder` |
| `ITERAR` | capturas con ajustes de espacio, tamaño, orden | `iteracion-visual.md`; propuesta documental y captura; el agente la valida y la escribe |
| `SEGUIR` | aviso del hook, «¿cambió algo del diseño?» | `seguimiento-de-cambios.md`: revisar los cambios contra el código y marcar `visto` |
| `REGISTRAR` | «anota esta decisión», «esto se aparta del UXR» | `registro-de-decisiones.md` |
| `ESTADOS` | «¿qué estados tiene?», «¿qué falta?» | `estados-de-pantalla.md` |

## Comportamientos bloqueantes

- **B7 — Ciclo de retroalimentación obligatorio.** Al inicio y al cierre de cada desarrollo, mejora, análisis o definición, invocar a `em-orquestador-ux` y leer su [protocolo canónico](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/em-orquestador-ux/references/ciclo-retroalimentacion.md) (resolver primero la versión local de ese skill o la fuente central). Sin informe de un agente de verificación previa distinto de quien construye, no empezar; sin sincronización comprobada, no declarar terminado. El orquestador conserva los formatos y dueños de artefactos; si falta el protocolo, detenerse y reportarlo.
- **B1 — Lo pendiente del PO no se pinta en la UI.** Nada de «PENDIENTE» ni rótulos de decisión en pantalla: va en el registro de decisiones.
- **B2 — Una decisión que contradice la fuente se registra, no se resuelve.** Se escribe como «decisión del responsable de diseño, pendiente del PO».
- **B3 — Todo estado se cubre:** cargando, error con reintento, vacío, sin permiso, solo lectura, éxito, y el caso de acceso perdido.
- **B4 — El texto provisional se marca en el documento**, no en la pantalla, y no inventa reglas de negocio.
- **B5 — Antes de cambiar un componente del DS se explica el cambio con evidencia** (ver `flujo-ds`).
- **B6 — Lo que se construye se verifica en el navegador contra el piloto**, no solo con pruebas.
- **B8 — Lo construido se documenta mientras se valida, no al cierre.** Cada texto, componente y comportamiento que difiere de la especificación (un flujo por pestaña que pasó a página, un botón que pasó a aviso, una validación que bloquea en lugar de una vista previa) se registra en la SCR, el FLW o el UXR en la misma rama, con el skill dueño (`ui-spec-writer` para la SCR; `user-flow-designer` en modo ACTUALIZAR para el FLW, con `validar_flw.py` sin errores; `ux-requirements-analyzer` en modo ACTUALIZAR para el UXR, con `validar_uxr.py` sin errores), o en un DEC como desvío, y el informe de accesibilidad (ARP) no se entrega sin esa paridad. Si se deja para el cierre, los documentos describen otra pantalla y QA lo descubre al diseñar sus casos de prueba. La mejora pendiente de automatizarlo está en `em-orquestador-ux/references/mejoras-del-proceso.md`.

## Cierre de cada iteración

Construye el prototipo con micro UI, shell y componentes del DS. La investigación de la solución vive dentro de Pantallas y deja INV y DEC antes de cerrar el SCR; incluye benchmarking, componentes disponibles o faltantes, micro UI y ubicación en el shell. La exploración puede hacerse en Claude Design, Figma o código y siempre guarda capturas.

Mientras construyes, invoca accessibility-reviewer y crea o actualiza el ARP **sobre lo implementado**; no lo pospongas al cierre ni lo sustituyas con una revisión de Figma. Cada cambio en lo construido produce una propuesta de actualización de UXR, FLW, SCR y DEC, con captura, versión y estado. El agente la valida y la escribe sin pedir aprobación; solo consulta a Enzo si el cambio es urgente o crítico (negocio, permisos, datos o alcance). Toda respuesta y estado de pregunta se registra primero en Open questions del KB y luego se carga a Notion; las propuestas de otros responsables no se remapean a Propuesta UX.

Cada paso verificado en el navegador deja su evidencia en Notion en ese momento: capturas de cada estado y una explicación breve de cómo funciona en la tarea FRONT; la bitácora de construcción y la página de servidores solo marcan y enlazan (`flujo-producto/references/evidencia-de-avance.md`, regla de Enzo del 2026-11-15).

Flujos, Pantallas y Exploraciones siguen Borrador → En revisión → En construcción → Validado. Hay código que referencia su HU/FLW/SCR: propone En construcción; no lo dejes en Borrador. Una rama CLF_Feature_<US> o un merge aislado son evidencia a revisar, no prueba de validación. Validado solo con prueba de Enzo en el navegador, captura y ARP implementado de la misma versión. Figma es opcional cuando el diseño se validó en código.

## Compuertas automáticas

Ejecuta el audit_ux.py instalado con em-orquestador-ux, sin copiarlo al producto:

- Antes de cerrar el SCR: --compuerta G3; sin INV y DEC vinculados no avanza.
- Durante la construcción y antes de Validado: --compuerta G5 y --compuerta G6; sin captura, prueba de Enzo o ARP implementado no pasa.
- Antes de cerrar la iteración: --compuerta GI; sin propuesta de actualización de UXR/FLW/SCR/DEC, captura y aprobación no pasa.
- Antes de cerrar el paquete: --cerrar-paquete --conciliacion <informe.json>; diferencias abiertas, falta de huella o informe de otra revisión bloquean.

El hook guardia-uxs del orquestador también impide subir una rama de diseño con esos errores de evidencia. La memoria del proyecto y el contrato de evidencia del orquestador conservan las rutas a propuesta, documentos, captura, versión, prueba y ARP. La auditoría verifica que existan; no suplanta el juicio ni la aprobación de Enzo.

## Racionalizaciones comunes

| Excusa | Realidad |
|---|---|
| «Es solo un cambio pequeño o un análisis; sincronizo después» | El inicio y el cierre del protocolo canónico son obligatorios; un pendiente de sincronización impide declarar terminado (B7). |
| «Lo dejo con un rótulo "pendiente" mientras tanto» | Los rótulos van al documento (B1). |
| «El diseño lo pide, no hace falta registrar el desvío» | Sin registro el PO no sabe qué cambió (B2). |
| «El estado vacío es obvio, lo hago después» | Un estado sin construir es un hueco para quien prueba (B3). |
| «La prueba pasa, listo» | Las pruebas no ven el espacio ni el tamaño; comparar con el piloto (B6). |
| «Edito el UXR a mano, es solo una línea» | Sin el analista se pierde la clasificación, el historial o el ID; usa `ux-requirements-analyzer` y su validador (B8). |
| «Actualizo el SCR cuando cierre el paquete» | Para entonces nadie recuerda qué cambió; QA ya diseñó sus casos con la especificación vieja (B8). |

## Señales de alerta

- Un valor de espaciado o tamaño que no sale de un token.
- Una pantalla sin su estado de error o de sin permiso.
- Texto de interfaz que describe una decisión («pendiente del PO», «propuesta»).
- Una captura del responsable de diseño con una medida que no se aplicó.
- Una sesión que empezó con el aviso de cambios del hook y terminó sin `seguir-paquete.mjs visto`.
- Un texto, componente o flujo construido que el SCR no menciona, o un SCR sin fecha posterior al último cambio del front.

## Formato de respuesta

Declarar el modo. Declarar el modo al empezar. Al cerrar un paso, seguir `references/respuesta-de-cierre.md`: primera línea con el resultado, «Lo que hice:», «Lo que necesito de ti:» y «Lo siguiente…». En «Lo que hice» van qué se bajó (estados y reglas), qué quedó registrado como decisión o desvío y qué se verificó en el navegador; lo que falta de validación va en «Lo que necesito de ti».
