# Tareas y Notion

Leer al empezar o cerrar una tarea, y antes de la primera carga a Notion de la sesión.

## Índice

1. Mejoras del proceso y MR
2. Tareas con em-gestion-tareas
3. Módulo Notion

## 1. Mejoras del proceso y MR

Leer también `references/mejoras-del-proceso.md` al iniciar el paso 0 y, al cerrar cada fase, anotar ahí cada hueco encontrado (validación, automatización o job) con su estado. Después de cada merge, recargar en Notion los documentos de la rama con `DESIGN_REF=develop` y corregir los enlaces de las notas de GitLab. Toda entrega cierra con la tabla de MR: enlace, qué trae y orden de merge.

**Tareas al ritmo del trabajo (Enzo, 2026-11-26).** Cada skill que termina un paso entrega su evidencia y en ese mismo turno se llama a `em-gestion-tareas`: al abrir el MR, AVANCE (estado «En curso», línea de MR y enlaces provisionales a la rama); al fusionarlo, CIERRE de las tareas que ese MR completa (casillas con evidencia, Artefactos que produce, Resultado, «Completada» y la línea del Plan en la madre). Una casilla sin evidencia no se marca: se escribe qué falta y se le pregunta a Enzo. No se pasa al paso siguiente con tareas terminadas sin cerrar.

## 2. Tareas con em-gestion-tareas

Toda tarea que este orquestador ejecuta se registra con `em-gestion-tareas`; ningún otro skill escribe en la base Tareas, en issues ni en ClickUp.

- **Antes de empezar** (paso 0): las tareas existen y la KB está revisada con `cambios-kb.mjs`.
- **Al empezar** una tarea UX (y al recibir un paquete: modo RECIBIR): modo AVANCE (estado «En curso»). Si la tarea no existe, se pide; no se crea sin su mapeo.
- **Al pasar cada compuerta** (G1 a G7, GU): modo AVANCE con la salida de `audit_ux.py --compuerta` como evidencia. Así cada avance deja su trazabilidad sin depender de la memoria.
- **Al terminar cada paso con evidencia** (MR, artefacto, comentario): modo AVANCE con los enlaces, para marcar su casilla. Mientras el trabajo vive en la rama `ux/*`, la rama y el commit son evidencia provisional; al fusionar se cambian por el enlace a `develop`.
- **A mitad del trabajo**: la tabla del paso 4 (bloqueo, AJUSTAR o nota).
- **Al terminar la tarea**: modo CERRAR con la evidencia. Cerrar marca criterios, cierre, Plan de la madre y Resultado; GitLab y ClickUp esperan su fecha límite.
- Las capturas y «Cómo funciona» las agrega el ejecutor en la misma tarea; `em-gestion-tareas` no las sube.

Con la auditoría limpia, o los errores restantes declarados, cierra según la sección 4 de `references/worktree-protocol.md`: `graphify update .`, resumen de cambios y decisiones pendientes, y propuesta de merge, PR, conservar o descartar. Espera la respuesta; no hagas commit, merge ni borres el worktree por iniciativa propia.
