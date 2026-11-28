# Estados, compuertas y cierre del paquete

Leer al pasar de fase, al validar lo construido y antes de cerrar un paquete.

## Índice

1. Cómo se diseña: la pregunta al inicio
2. Control de cierre de paquete (compuerta GU)
3. Construcción y cierre de iteración
4. Verificaciones automáticas antes de avanzar
5. Recalcular estados en cadena
6. Compuertas humanas

## 1. Cómo se diseña: la pregunta al inicio

Antes de diseñar pantallas, se pregunta a Enzo «¿cómo diseñamos esto?». El agente propone una opción según el tiempo disponible frente a lo que costaría el front, y Enzo decide.

| Opción | Cuándo | Qué es |
|---|---|---|
| Directo al front | Hay tiempo para construir e iterar (lo construye UX/UI o Desarrollo) | Front real con datos simulados; el diseño se valida sobre él. Si el front ya existe, manda el front |
| Prototipo rápido en Angular | Poco tiempo | Pantallas con los componentes reales de `@comsatel/ui-components` y datos fijos: sin BFF, servicios ni pruebas. Se compila y se comparte con un enlace (nadie instala nada). No es la especificación: la SCR lo es |
| Claude Design o Figma | Explorar estructura y flujo | Baja fidelidad con controles imitados; no se salta (IB) |

No se diseña en HTML suelto imitando los `cs-*`: se parece, pero no es igual. Hipótesis por medir: el prototipo cuesta una fracción del front. En el primer paquete donde se use, se registran sus horas frente a las del front.

## 2. Control de cierre de paquete (compuerta GU)

Un paquete DSP-NNN con pantallas especificadas **no se cierra, ni se sube su rama de diseño, sin la UXS que lo indexa**. Esto no depende de que alguien lo recuerde: lo comprueban tres controles duros, además de este texto.

| Control | Qué hace | Cuándo corre |
|---|---|---|
| `scripts/audit_ux.py --exigir-uxs` | Error `PAQUETE_SIN_UXS` si el paquete tiene SCR y ninguna UXS; aviso `UXS_NO_INDEXA` si la UXS no menciona artefactos del paquete; aviso `ARTEFACTO_SIN_PAQUETE` si hay artefactos sin etiqueta `dsp-NNN`. `--paquetes` o `--desde-rama <base>` lo limitan a lo que toca la rama | En el paso 5, antes de proponer la integración |
| Hook `hooks/guardia-uxs.mjs` (plugin `comsatel-ux`) | Frena el `git push` de una rama `ux/*` que toca un paquete sin UXS | Al subir la rama, en cualquier sesión con el plugin |
| Compuerta GU del `pack.yaml` | La consolidación es una tarea y una compuerta del flujo (T-03b), también en la vía directa | Al planificar y al cerrar |

Si el hook frena: arma la UXS con `ux-context-builder`, commitéala en la rama y vuelve a subir. **No rodees el bloqueo** (ni lo apagues con `COMSATEL_UX_GUARDIA`: esa variable la fija una persona, no el agente). Detalle y pruebas en `references/controles-de-cierre.md`.

## 3. Construcción y cierre de iteración

La investigación de la solución va dentro de Pantallas y deja un INV y un DEC enlazados al SCR antes de cerrarlo: benchmarking, componentes del DS disponibles o faltantes, micro UI de destino y ubicación en el shell. La exploración admite cualquier herramienta y guarda capturas. El ARP se crea y actualiza durante la construcción del prototipo, sobre lo implementado. En cada iteración que cambia lo construido, el agente propone los cambios a UXR, FLW, SCR y DEC, la captura y el estado; Enzo aprueba **antes de escribir**. El registro de evidencia se mantiene en la memoria del proyecto (`design/MEMORY.md`) y en el artefacto, con el contrato de `references/controles-de-cierre.md`.

Flujos, Pantallas y Exploraciones siguen **Borrador → En revisión → En construcción → Validado**. Validado exige prueba con Enzo en el navegador y captura de la versión probada, además de accesibilidad revisada sobre lo implementado. La vía directa a código conserva todos estos controles. `audit_ux.py --cerrar-paquete --conciliacion <informe.json>` bloquea un cierre sin estas evidencias; la auditoría ordinaria avisa de los documentos aún en preparación.

## 4. Verificaciones automáticas antes de avanzar

Ejecuta `scripts/audit_ux.py <kb> --compuerta <G>` antes de dar paso a la siguiente fase. G0 exige la memoria con el plan; G1 UXR y lineage; G2 FLW y screens; G3/GR SCR e INV+DEC; GU UXS; G4 exploración y capturas; G5 ARP implementado; G6 diseño validado en código o gobernado aprobado; G7 HOF (además del gate formal si se usa); GI la propuesta y evidencia de iteración; GC la conciliación completa sin diferencias. El esquema y los códigos están en `references/controles-de-cierre.md`. Un resultado con errores bloquea el avance. La vía directa a código pasa por GU, G3, G5, G6, GI y GC; no depende de Figma ni de un HOF formal.

El hook guardia-uxs impide subir ramas de diseño con UXS faltante, SCR cerrado sin INV/DEC, iteración sin propuesta/captura/aprobación o Validado sin prueba y ARP implementado. La conciliación también advierte ARTEFACTO_BORRADOR_CON_CONSTRUCCION: lee los repositorios de producto autorizados, referencias HU/FLW/SCR en código, ramas CLF_Feature_<US> y merges locales con referencias de MR; propone En construcción, y solo propone Validado con prueba de Enzo, captura y ARP de esa versión. Nunca aplica estados automáticamente ni afirma un estado remoto de MR sin evidencia. Sin repositorios configurados informa el límite.

**Decisiones retiradas por el PO (Enzo, 2026-11-26).** Al iniciar o retomar un paquete, desde la raíz de la KB: `node scripts/decisiones-retiradas.mjs --paquete DSP-NNN`. Si sale con código 1, hay una DH del PO que retira o difiere algo que Enzo decidió sin su pregunta en el UXR o sin aviso publicado: se le informa a Enzo antes de diseñar, con las rutas. Dónde vive cada decisión y cómo se valida lo construido con datos simulados: `references/mapa-de-decisiones-y-validacion.md`.

## 5. Recalcular estados en cadena

Al conciliar, propón cambios en ambos sentidos: preguntas resueltas (Decidida/Diferida/Descartada) → UXR En revisión; si sus flujos ya están En construcción o Validado, UXR Aprobado, solo con aprobación de Enzo y approved_by. Una pantalla En construcción mueve su FLW/IB a En construcción; todas Validadas los llevan a Validado. Un IB con lienzo o capturas pasa a En revisión. La evidencia propia de Validado sigue siendo obligatoria.

Recalcula UXS y paquete desde preguntas, aprobación y validación: En curso → Diseño cerrado → Listo para desarrollo. Para Estado del alcance propone Borrador, En preparación, Listo para selección de sprint, En sprint o Cerrado según su preparación y construcción; la persona confirma el paso operativo. Una aprobación propuesta no cuenta como aprobación real.

Si cambia una fuente del KB, sin importar quién la editó, propón Vigencia = Revisar por cambio de fuente en preguntas, Resumen vigente = Desactualizado en UXR/FLW y retorno de Validado/Aprobado a En revisión. La invalidación se propaga por dependencias y prevalece sobre un avance. Sin huella se declara cobertura incompleta. La conciliación genera las propuestas; Enzo aprueba y primero se actualiza el KB. GC bloquea una cascada pendiente o incompleta.

## 6. Compuertas humanas

Los artefactos nuevos comienzan en Borrador (`status: draft`). El orquestador solo transcribe cambios de estado aprobados y comprobables:

- Nunca inventes `verified`, `approved`, `human_review.status: approved` ni una validación en nombre de una persona. Registra Validado solo tras la prueba de Enzo, su aprobación, captura y revisión de accesibilidad implementada.
- **Elegir entre alternativas, resolver una divergencia Stitch↔Figma, aprobar `governed_design` y aprobar el gate son decisiones humanas.** Regístralas (quién, cuándo, qué, por qué) solo cuando el usuario las aporte con nombre y rol; sin autor identificable, queda como información del usuario.
- Crear un proyecto Stitch exige autorización explícita (`--authorized-by human:<id>`).
- Termina con una lista de **decisiones humanas pendientes**: pregunta, responsable, prioridad y qué desbloquea.
