# Protocolo ANALIZAR — plan nuevo desde cero

Se activa cuando el GUARD no encontró un archivo de plan previo para este
proyecto/épica. Produce la versión 1 del documento.

## Fase 0 — Confirmar entrada

La épica debe llegar como texto legible: pegada en el chat, en un archivo que se
pueda leer directo, como export/captura, o como contenido obtenido desde Notion
cuando el usuario autorizó la consulta y el conector está disponible. GitLab es
opcional: solo se consulta por API corporativa cuando esa capacidad ya existe en
el equipo, normalmente mediante VPN. La falta de VPN o API de GitLab no bloquea
un plan cuya épica, historias y casos están disponibles en Notion. Si no hay una
fuente legible, pedir captura o export; no solicitar credenciales ni VPN.

Identificar el proyecto asociado (nombre explícito del usuario, o inferible del
directorio de trabajo actual). Si no es identificable con lo disponible, preguntar
solo eso — no inventar un nombre de proyecto.

## Fase 1 — Contexto opcional del repo

Si el proyecto tiene código accesible localmente, listar su estructura de alto
nivel (Glob de carpetas principales, sin leer archivo por archivo) para detectar
módulos que ya existen y evitar proponerlos como nuevos. Si no hay acceso, seguir
sin este paso y declarar "Verificado contra código existente: No" en el documento
final — nunca asumir que el proyecto está vacío solo porque no hay acceso.

## Fase 2 — Mapear módulos

Leer la épica completa. Aplicar `references/criterios-segmentacion.md` para
identificar los módulos que contempla. Cada módulo debe trazarse a una parte
concreta de la épica — no agregar módulos por prolijidad.

## Fase 3 — Definir flujos por módulo

Por cada módulo, identificar los flujos end-to-end: actor, disparador, pasos,
sistemas involucrados, resultado esperado. Un flujo mal definido (sin pasos claros
o sin resultado) es una señal de que la épica no tiene suficiente detalle ahí —
marcarlo en supuestos en vez de inventar los pasos faltantes.

## Fase 4 — Desglosar historias de usuario

Por cada flujo, desglosar en historias de usuario chicas siguiendo
`references/criterios-segmentacion.md` (INVEST + patrones de split). Cada historia
lleva al menos un criterio de aceptación en formato Given/When/Then.

## Fase 5 — Plan de testing por módulo

Por cada módulo: casos funcionales, casos borde, no funcionales si la épica los
sugiere, y qué datos/mocks hacen falta para poder probarlo.

## Fase 6 — Orden y dependencias

Determinar qué módulo depende de qué otro antes de poder implementarse, y un
orden sugerido de desarrollo.

## Fase 7 — Riesgos y preguntas abiertas

Registrar cualquier ambigüedad, riesgo técnico o de producto detectado durante el
análisis que no quedó resuelto como supuesto razonable.

## Fase 8 — Armar y guardar el documento

Volcar todo en la estructura de `references/plantilla-plan-desarrollo.md`. Guardar
en:

```
D:\Investigacion - V4\01-proyectos\<proyecto>\epica-a-plan-desarrollo-<proyecto>-v1-<YYYY-MM-DD>.md
```

Si la carpeta del proyecto no existe todavía, crearla (`<proyecto>\_proyecto.md`
sigue la convención general de outputs de Enzo si el proyecto es nuevo del todo;
si ya existe la carpeta, usarla tal cual está).

## Fase 8.1 — Mapear en Notion cuando fue solicitado

Si el usuario autorizó expresamente el mapeo en Notion, leer `trazabilidad-notion.md`
y crear o actualizar la cadena Épica → Historia de usuario → Caso de uso. Antes de
crear un caso, leer la historia padre y todos sus casos existentes para evitar
duplicar alcance. El plan local sigue siendo obligatorio. GitLab se usa solo como
evidencia de lectura.

## Fase 9 — Cierre

```
Resultado: plan de desarrollo v1 armado para [proyecto] — [N] módulos, [N] historias
Fuente:    D:\Investigacion - V4\01-proyectos\<proyecto>\epica-a-plan-desarrollo-<proyecto>-v1-<fecha>.md
Cambios:   documento nuevo
Validación: cada historia tiene al menos un criterio de aceptación; [N] supuestos marcados
Pendiente: [lista de preguntas abiertas de la Fase 7, si las hay]
```
