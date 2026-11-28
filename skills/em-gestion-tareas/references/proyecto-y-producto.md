# Proyecto y producto: dos relaciones distintas

Leer al recibir un paquete y cuando una página no aparece en una vista. Regla de Enzo
(2026-11-26).

## Jerarquía

En Notion es **Proyecto → Producto → Paquete (DSP) → Historia (HU)**. Ejemplo: el proyecto
«CL2 Flotas» tiene los productos «CL2 Flotas», «Piloto de CL2 Flotas», «CL2 SVR Captura y
Recupero» y los dos Design System.

## Qué relación lleva cada registro

| Registro | Lleva | De dónde sale |
|---|---|---|
| Paquete e historia | Solo **Producto** | El proyecto le llega por el producto; la historia lleva el de su paquete |
| Tarea | **Proyecto y Producto** | Los del paquete que la origina |

✅ La tarea IDV-UX · 01 lleva Proyecto «CL2 Flotas» y Producto «CL2 Flotas», los del DSP-009.
❌ La historia HU-01-14 queda en «Piloto de CL2 Flotas» mientras su paquete está en «CL2
Flotas»: no aparece en la vista junto a HU-01-16 (caso real).

## Si hay duda

No se adivina: se pregunta con opciones (herramienta de preguntas, con las alternativas de la
base Productos y su proyecto). Hay duda cuando:

- el paquete no tiene producto o tiene más de uno;
- el producto no tiene un único proyecto;
- la historia ya está en otro producto.

`cargar-paquete.js` (del orquestador UX) las devuelve en `dudas`, sale con código 3 y no cambia
esa relación. Con la respuesta se repite con `--producto <id>` o `--confirmar-producto`.
