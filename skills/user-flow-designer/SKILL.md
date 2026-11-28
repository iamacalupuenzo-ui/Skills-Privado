---
name: user-flow-designer
description: Escribe y mantiene los flujos de usuario (FLW) de la KB de Comsatel a partir de los Requerimientos UX (UXR): camino feliz, caminos alternos, ramas y excepciones con su ID, permisos, estados del flujo, diagrama y la lista de pantallas (SCR) que el flujo declara, marcando cada paso con su fuente o como reutilizado, construido, inferencia o pendiente. Úsalo cuando pidan "arma el flujo del DSP-0NN", "qué pasos y excepciones tiene esto", "qué pantallas necesita este flujo", "actualiza el FLW porque cambió el UXR", "contrasta el flujo con lo construido" o cuando el orquestador UX lo llame en la fase 2. No especifica pantallas, layout ni textos finales (usa ui-spec-writer) ni decide negocio.
metadata:
  version: "2.0.0"
  origen: "Nació del catálogo de Ilver (1.1.0); adaptado a la KB de Comsatel el 2026-11-28"
---

# Diseñador de flujos de usuario

Convierte los UXR de un paquete en flujos (FLW) que dicen por dónde pasa el usuario, qué puede
salir mal y qué pantallas hacen falta. Es la fase 2 de `em-orquestador-ux`: lee lo que dejó
`ux-requirements-analyzer` y su lista de pantallas es lo que `ui-spec-writer` especifica. El
flujo identifica pasos, estados y ramas; nunca el layout.

## Verificación de arranque

1. Ciclo de retroalimentación (B1): informe de inicio de otro agente antes de escribir.
2. La KB se lee de `origin/develop`; se escribe en un worktree `ux/<slug>`.
3. Los UXR del paquete existen y pasan `validar_uxr.py`. Sin UXR, no hay flujo (B2).
4. Buscar flujos existentes del mismo tema o de otro nivel (Distribuidor, Cliente, Producto) para reutilizar sus ramas (B8).

## Modos

| Modo | Señales | Leer |
|---|---|---|
| `CREAR` | UXR sin flujo; aviso «ningún FLW lo lista» | `references/anatomia-del-flw.md` y `references/ramas-y-marcas.md` |
| `ACTUALIZAR` | Cambió un UXR, una decisión o una respuesta del PO | `references/reutilizar-y-actualizar.md` |
| `CONTRASTAR` | El front ya está construido | `references/reutilizar-y-actualizar.md` (sección 3) |
| `PANTALLAS` | «qué pantallas necesita», SCR huérfana o flujo con `screens` vacío | `references/pantallas-del-flujo.md` |

Declarar el modo en la primera línea. Si es ambiguo, preguntar una sola cosa: el UXR o el paquete de partida.

## Guías por paso

| Cuándo | Leer |
|---|---|
| Al escribir o revisar las secciones | `references/anatomia-del-flw.md` |
| Al escribir pasos y ramas | `references/ramas-y-marcas.md` |
| Al declarar o reservar pantallas | `references/pantallas-del-flujo.md` |
| Si ya hay un flujo del tema o algo cambió | `references/reutilizar-y-actualizar.md` |
| Antes de escribir en la KB | `references/reglas.md` |

Plantilla en `templates/FLW.plantilla.md`; ejemplo resuelto en `examples/FLW-052-resumido.md`.

## Validación obligatoria

```bash
python scripts/validar_flw.py <kb>/design/user-flows/FLW-NNN-*.md   # forma del flujo
python <em-orquestador-ux>/scripts/audit_ux.py <kb> --compuerta G2  # FLW ↔ SCR y UXR sin flujo
```

Un error bloquea la entrega. Una pantalla listada que aún no existe es normal hasta la fase 3 si
está reservada en `pantallas-del-flujo.md`.

## Reglas de bloqueo

Detalle, excusas comunes y señales de alerta en `references/reglas.md`.

- **B1 — Ciclo de retroalimentación obligatorio.** Inicio y cierre según el [protocolo](https://github.com/iamacalupuenzo-ui/Skills-Privado/blob/main/skills/em-orquestador-ux/references/ciclo-retroalimentacion.md) de `em-orquestador-ux`.
- **B2** — Sin UXR no hay flujo: `requirements` lista las HU y los UXR que el flujo recorre.
- **B3** — Cada paso y cada rama llevan su marca: fuente, reutiliza, construido, inferencia o `PENDIENTE: <ID>`.
- **B4** — Una rama pendiente no se resuelve en el flujo: apunta a su pregunta abierta.
- **B5** — El flujo declara sus pantallas en `screens`; vacío solo con una pregunta abierta que lo justifique.
- **B6** — FLW y SCR coinciden: cada SCR listada declara `flow:` con este flujo.
- **B7** — Sin layout, componentes ni textos finales: eso es de `ui-spec-writer` y de UX writing.
- **B8** — Reutilizar antes que copiar: las ramas iguales de un flujo base se citan, no se duplican.
- **B9** — Actualizar, no reemplazar: los IDs de flujo, paso y rama son permanentes.
- **B10** — `status: draft` y etiqueta `dsp-NNN`; nunca `approved` ni `verified` por su cuenta.

## Cierre

Modo; flujos creados o actualizados con su ruta; pantallas declaradas o reservadas; resultado de
`validar_flw.py` y de la compuerta G2; ramas pendientes con su pregunta; siguiente skill
(`ui-spec-writer`).
