# Paridad KB–código: diseño y evidencia del 18-nov-2026

[verificado] Fuente Skills-Privado, base local `9f8a38d367a4164cd03640ace6cdb4a06e294f0a`.
Este ajuste fue solicitado expresamente por Enzo. No incluye los hallazgos visuales/MR
apilados de la auditoría que decidió posponer. No publica, instala ni activa hooks globales.

## Diseño incorporado

- Un solo motor Python estándar, `skills/paridad-diseno-desarrollo/scripts/paridad_kb_codigo.py`.
- Configuración JSON versionada por paquete, sin nombres de producto codificados en Python.
- Proyecciones por pantalla: componentes, claves de campos, navegación y textos. Fuentes
  SCR, FLW, UXR, UXS y DEC. Comparación de conjuntos, orden o multiplicidad y aliases explícitos.
- Fuentes Git fijadas a commit al iniciar; KB nunca desde WORKTREE. Código final puede
  leerse desde WORKTREE, con hashes y control de cambios durante la comprobación.
- Salidas 0 igualdad declarada, 1 divergencias, 2 falta de evidencia/configuración válida.
  Valores y archivo/línea de KB/código por divergencia; JSON por stdout, sin escribir fuentes.
- Cierre de front y documentación y apertura de MR bloqueados sin ejecución final y cobertura
  revisada, o con diferencias pendientes. El ciclo coordina; el comparador no decide cuál
  fuente prevalece. Una contradicción conservada sigue bloqueando; B1 no se relaja.
- La configuración no puede omitir una dimensión de una pantalla declarada ni uno de los
  cinco tipos de artefactos. La revisión del inventario y la semántica sigue siendo obligatoria:
  no existe certificación universal de equivalencia entre prosa y programa por regex.

## Casos reales y contraste con las correcciones

[verificado] Se hizo fetch explícito de la KB (develop y ux/dsp004-cierre) y de las ramas
103/105/106 de micro UI. Se compararon referencias remotas y locales; la referencia local
de la rama de KB avanzó durante la revisión. Por eso las pruebas usan SHA inmutables,
no el nombre de una rama que puede avanzar.

| Caso | KB histórica e7670ed | Código comprobado | Resultado histórico |
|---|---|---|---|
| SCR-055 | design/screens/SCR-055-056-configuracion-del-distribuidor.md:62, cinco unidades | Micro UI 4487a0b, src/app/tenants/settings/settings-regional.component.ts:23, seis claves | weightUnit extra en código |
| SCR-053 | design/screens/SCR-051-054-catalogos-regionales.md:151, cs-accordion | Micro UI f6ca4fc, src/app/regional-catalogs/measurement-units-page.component.ts:36, template sin acordeón | cs-accordion ausente en código |
| UXR-111-Q1 | design/ux-requirements/UXR-111-mantenimiento-comun-de-los-catalogos-regionales.md:154, una entrada con pestañas | Shell 54b6470, dev/mock-bff/data.mjs:82–83, dos hijas | Dos entradas frente a la decisión de entrada unificada |

[verificado] Se ejecutaron los extractores sobre esos commits completos, además de los
fixtures: tres comparaciones históricas divergentes; las tres proyecciones con la KB
corregida en `a0300f0239ffd5b59a57a45192c18d754f015cd1` coinciden. Los fixtures preservan
extractos literales, procedencia y líneas originales. El menú es el mock/configuración del
piloto, corroborado por shell-layout.mapper.ts; no prueba una sesión con el BFF real.

## Versiones (al 18-nov, antes de integrar con main)

| Skill | Versión |
|---|---|
| paridad-diseno-desarrollo | 1.3.0 |
| ux-ui-orchestrator | 1.2.0 |
| orquestador-desarrollo | 1.5.0 |
| flujo-producto | 1.2.0 |

Copias de plugins regeneradas: desarrollo 1.3.0 y UX 1.4.0. El manifiesto conserva el
catálogo de 33 skills y registra dueño, comando y consumidores del nuevo control.
`npm test` incluye los tests Python por `scripts/probar-paridad.mjs`; no usa modelos/red.

## Validación ejecutada

[verificado] Salida final de `npm test` (exit 0):

```text
33 skills revisados: 0 errores, 18 avisos
Ran 34 tests in 129.394s
OK
```

Los 18 avisos son los mismos de la base. Se verificó además el catálogo después del
último ajuste documental (exit 0), `git diff --cached --check` (exit 0) y el dry-run de
actualización en Claude para los cuatro skills, sin escribir destinos instalados. Pruebas
de regresión: tres casos históricos negativos y sus correcciones positivas; SCR-053
tiene además comparación explícita pestañas/ramificación maestro-detalle. No se consumieron
llamadas a modelos. No se repitieron los evals de modelos ni suites ajenas al cambio.

## Límites y pendiente operativo

[no comprobado] No se ha certificado paridad integral de DSP-004 ni del producto actual.
La plantilla examples/paquete.json es sintética y las regresiones son pruebas aisladas:
hay que preparar/revisar la configuración completa de cada paquete en su repo autorizado.
La lista fija de magnitudes frente al catálogo dinámico sigue siendo una diferencia de
comportamiento que estas tres proyecciones históricas no demuestran resuelta.

No se escribió en la KB, micro UI o Shell, ni se abrió/actualizó un MR. No se consultó
el estado actual de !321 por API. El bloqueo está incorporado en las instrucciones de
los skills y validado en el catálogo; no hay CI ni hook de paridad instalado en GitLab o
en proyectos. Su instalación/publicación requiere el alcance correspondiente.

## Estado integrado con main (2026-11-27)

[verificado] Los dos commits del ciclo (paridad y guardias) se rebasaron sobre el `main` de Skills-Privado del
traspaso del 27-nov (PR #2, 30 commits más) y se fusionaron a `main` por avance rápido. Las versiones de la tabla
anterior ya no rigen: `main` había subido varias, así que se resolvió tomando la más alta y sumando una.

| Skill o plugin | Versión publicada | Regla de paridad |
|---|---|---|
| paridad-diseno-desarrollo | 1.3.0 | Define el modo KB-CODIGO |
| ux-ui-orchestrator | 1.2.0 | B4 |
| orquestador-desarrollo | 1.8.0 | B11 |
| flujo-producto | 1.5.1 | B16 |
| plugin comsatel-desarrollo | 1.3.0 | — |
| plugin comsatel-ux | 1.3.0 | — |

La regla tiene número distinto en cada skill porque cada uno ya tenía sus propias reglas B. En `main` ya existían
B9 y B10 en orquestador-desarrollo, B10 a B15 en flujo-producto y B1 a B3 en ux-ui-orchestrator, así que la de
paridad quedó al final de cada lista.

El diseño gobernado de Claude Design y de prototipos (governed_artifacts.py) pasó a ser reconocido por el gate de
handoff; hasta entonces el gate solo aceptaba Figma o Stitch.

[verificado] Casos de prueba de la regla: orquestador-desarrollo caso 10 (B11) y flujo-producto caso 14 (B16).
Validación sobre la rama integrada: `npm test` con 36 skills, 0 errores y 24 avisos; 34 pruebas de paridad; 134 de
ux-development-handoff; guardias con 56 casos declarados y 0 fallos.

## Qué decide el comparador y qué no

El comparador informa una divergencia con el valor y el archivo y línea de cada lado; no decide cuál fuente manda.
Esa decisión es del responsable del paquete. Ejemplo: la KB dice cinco unidades y el código tiene seis claves.
El comparador marca la clave sobrante. Si la clave sobra del código o falta en la KB lo decide una persona, y
mientras no lo decida el cierre y el MR siguen bloqueados.
