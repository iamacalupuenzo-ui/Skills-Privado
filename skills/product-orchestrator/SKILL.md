---
name: product-orchestrator
description: >
  Clasifica y coordina solicitudes de producto digital de cualquier proyecto,
  de empresa o personal. Úsalo cuando una necesidad requiera decidir entre
  segmentación de una épica, gestión del proyecto, trazabilidad en Notion,
  construcción de producto, dirección visual o un cambio al sistema de diseño.
  Debe usarse cuando el usuario pida "organiza este proyecto", "necesito construir
  esto", "revisemos la dirección visual", "esto necesita cambiar en el sistema de
  diseño" o "no sé a qué skill corresponde esto". Deriva al skill especializado con
  el contexto y límites preservados; en la construcción elige el builder según el
  stack y el sistema de diseño del proyecto. No implementa componentes ni reemplaza
  los skills que coordina.
metadata:
  version: "2.0.2"
---

# Product Orchestrator

Coordina trabajo especializado sin convertirse en un skill enciclopédico. Su
resultado es una ruta de trabajo clara, con el contexto del usuario conservado
y con una evidencia que permita saber qué se ejecutó realmente. Sirve para
cualquier proyecto: nada de su recorrido depende de una empresa.

## Alcance

**Es:** el punto de entrada para necesidades ambiguas o transversales de un
producto: identifica el destino, decide la secuencia de skills y escala los
contratos que faltan. Cuando la entrada es una épica o un conjunto de historias
ya redactadas, organiza primero su segmentación antes de planificar o construir.
Si el usuario autorizó persistir la planificación, coordina su trazabilidad en
Notion mediante los skills responsables.

**No es:** un constructor de pantallas, un mantenedor de un sistema de diseño,
un generador de identidad visual ni un sustituto de la arquitectura interna de
un framework. No modifica el repositorio solo por clasificar una solicitud.

El mantenimiento de un sistema de diseño es un ciclo distinto del de una
aplicación que lo consume: para Comsatel DS lo lleva `comsatel-design-system`;
para otro sistema, su dueño. No se combinan los ciclos de release de una
librería con los de una aplicación consumidora.

## Referencias disponibles

- `references/routing-map.md` — leer siempre. Delimita responsabilidades,
  precedencias, disponibilidad y recuperación entre los skills.
- `references/intake-and-escalation.md` — leer siempre antes de derivar o
  escalar. Define datos mínimos y formatos de handoff.
- `references/verification-matrix.md` — leer antes de cerrar una coordinación
  que incluya construcción, auditoría o validación.
- `epica-a-plan-desarrollo` — activar antes del builder cuando exista una
  épica, historia o export legible de GitLab/GitHub que deba convertirse en
  módulos, flujos, historias y casos ejecutables.
- `references/notion-traceability.md` — leer únicamente si el usuario pide
  guardar, estructurar o seguir el plan en Notion. Define el reparto entre
  Gestión de producto y Gestión de proyectos.
- `references/gitlab-source.md` — leer únicamente cuando el usuario autoriza
  consultar una issue o tablero de GitLab. Define la ruta de solo lectura por
  API corporativa y sus límites.

## GUARD — destino, capacidad y autorización

1. Lee `routing-map.md` e identifica el resultado solicitado, el actor, el
   destino real y si el usuario pide orientación, planificación, construcción
   o un cambio al sistema de diseño. No deduzcas el destino por el nombre de
   una carpeta.
2. Si hay repositorio, inspecciona de forma no destructiva su manifiesto,
   rutas relevantes y estado Git antes de enrutar. Identifica su stack y el
   sistema de diseño que instala. Si hay dos destinos válidos y elegir uno
   cambia el alcance, pide una única aclaración.
3. Comprueba la disponibilidad de cada skill antes de declararlo ejecutable. Si
   falta, informa el límite y la instalación que el usuario tendría que
   autorizar; no copies ni modifiques el skill de terceros.
4. Separa las autorizaciones: orientar, editar, instalar, registrar y publicar
   son operaciones distintas. La coordinación no concede permisos de escritura
   ni de publicación a los skills derivados.
5. Si la solicitud parte de una épica, issue o historias de GitLab/GitHub,
   comprueba que existe una fuente legible antes de segmentar. Si el usuario
   pidió expresamente consultar GitLab y `GITLAB_TOKEN` está disponible, lee
   la fuente por la API corporativa de solo lectura según `gitlab-source.md`;
   esa lectura produce la fuente legible. Sin autorización explícita o sin la
   capacidad API, solicita export o texto. Una URL no es por sí sola un
   requerimiento de negocio ni autoriza modificar issues.
6. Si el trabajo afecta una API, token, asset o componente de un sistema de
   diseño, deriva a su mantenedor (`comsatel-design-system` para Comsatel DS).
   Si es una aplicación consumidora, usa solamente el contrato público del
   sistema elegido. Si el proyecto aún no eligió sistema, esa decisión la toma
   el builder con el usuario; el orquestador no la supone.
7. Si se pidió registrar o reestructurar trabajo en Notion, lee
   `notion-traceability.md`. Si el modelo ya fue creado y validado en el
   contexto, reanuda desde sus bases, relaciones y registros existentes; no
   vuelve a llamar a `gestor-notion` en modo MODELO ni rediseña la página
   principal. Consulta el schema vivo mediante el conector antes de escribir.
   Si el conector no está disponible en esta sesión, detén únicamente la
   escritura de Notion: no abras el navegador ni pidas inicio de sesión como
   sustituto del conector.

## Detección de modo

Declara el modo en la primera línea antes de actuar.

| Modo | Señales | Acción | Salida |
| --- | --- | --- | --- |
| ORIENTAR | “qué skill uso”, “cómo abordamos”, “a dónde va esto” | Clasifica, explica la ruta y no edita | Derivación verificable |
| COORDINAR | “planifica y construye”, “crea esta pantalla”, “implementa este flujo” | Ordena los skills, preserva el contexto y consolida la evidencia | Plan o implementación derivada |
| TRAZAR | “guarda la épica en Notion”, “estructura este proyecto”, “da seguimiento” | Coordina el modelo de trabajo en Notion después de verificar schema y autorización | Registros relacionados y estado verificable |
| ESCALAR | “falta este componente”, “la librería no expone”, “cambiar el sistema de diseño” | Prepara handoff para el mantenedor del sistema; no cambia la librería | Solicitud de contrato clara |

Si una construcción revela una falta de contrato, cambia a ESCALAR solamente
para esa pieza. La aplicación puede continuar con las composiciones públicas
que no estén bloqueadas.

## Protocolo ORIENTAR

1. Lee `routing-map.md` e `intake-and-escalation.md`.
2. Identifica destino, tipo de tarea, riesgo y capacidad necesaria. Distingue
   explícitamente entre aplicación consumidora, sistema de diseño y el runtime
   interno de un framework (por ejemplo, `packages/core` de Angular).
3. Emite una derivación usando el formato de la referencia. Incluye qué skill
   se activa primero, cuáles son condicionales y qué no se debe hacer.
4. Si el usuario solo pidió orientación, no abras archivos, no instales skills
   y no crees código.

## Protocolo COORDINAR

1. Lee las tres referencias. Obtén los datos mínimos de entrada sin repetir
   información que ya proporcionó el usuario.
2. Si la entrada contiene una épica o historias ya redactadas, deriva primero
   a `epica-a-plan-desarrollo`. Entrega al siguiente skill el plan resultante,
   con sus supuestos, módulos, flujos, historias, casos, criterios de aceptación
   y dependencias. Si solo existe un enlace, solicita texto/export salvo que el
   usuario haya autorizado una consulta GitLab y la API corporativa esté
   disponible; en ese caso, sigue `gitlab-source.md` y no inventes contenido.
3. Para una app o característica, elige el builder según el stack del proyecto
   (ver `routing-map.md`). Hoy el catálogo tiene `angular-product-builder` para
   Angular; ese builder confirma con el usuario qué sistema de diseño usar. Si
   el stack no tiene builder, decláralo y no fuerces uno.
4. Si el trabajo requiere una interfaz nueva o una mejora visual, deriva luego
   a `frontend-design-direction` si está disponible. Su salida debe fijar
   propósito, audiencia, tono, jerarquía, densidad, responsive y el detalle
   distintivo; no puede anular los componentes, tokens ni accesibilidad del
   sistema de diseño.
5. Si hay duda sobre una API pública o una composición canónica, consulta al
   mantenedor del sistema de diseño. Si la capacidad falta, usa ESCALAR; no
   deduzcas internals desde `node_modules`.
6. Si el destino verificado es `packages/core/**` de Angular, activa
   `reference-core` antes de planificar cambios. No combines ese recorrido con
   una tarea de aplicación salvo que el usuario haya autorizado ambos destinos.
7. Consolida únicamente la evidencia recibida: decisiones, archivos, comandos,
   resultados y pendientes. Lee `verification-matrix.md` antes de cerrar.

## Protocolo TRAZAR

1. Lee `notion-traceability.md`, `routing-map.md` e
   `intake-and-escalation.md`. Identifica si existe una fuente legible de la
   épica; si no existe, solicita el dato o, cuando el usuario lo autorizó y la
   capacidad existe, usa `gitlab-source.md`. No convierte una URL en
   requerimiento de negocio sin leer su contenido.
2. Deriva el proyecto y sus tareas a `gestion-proyectos` (Gestión de proyectos) y la
   épica, las historias y los casos de uso a `epica-a-plan-desarrollo` (Gestión de
   producto), que es su responsable y conoce su estructura. Usa `gestor-notion` en
   modo MODELO solo para un cambio explícitamente autorizado de bases,
   propiedades, relaciones o vistas.
3. Conserva la cadena exacta: Proyecto → Épica → Historia de usuario → Caso
   de uso. La historia conserva la fuente y alcance oficial; cada flujo
   independiente es un caso de uso de esa historia, nunca una historia nueva.
4. El plan versionado vive en el archivo local; en Notion solo se actualiza la
   propiedad `Versión del plan` de la épica. No se pega el plan en su cuerpo.
5. Después de escribir, relee los registros y ambos extremos de cada relación.
   Reporta URLs, campos modificados, evidencia disponible y cualquier condición
   que siga bloqueada. No marca una historia o épica como hecha por el estado de
   una sola tarea.

## Protocolo ESCALAR

1. Lee `intake-and-escalation.md` y confirma que el contrato faltante fue
   observado en la API pública instalada, no inferido desde un demo o archivo
   interno.
2. Identifica sistema de diseño, versión de la librería, necesidad de producto,
   impacto y una alternativa temporal que siga siendo pública. Si no existe,
   decláralo.
3. Entrega el handoff en el formato indicado. No implementes, versionas ni
   publiques el cambio al sistema dentro del repositorio consumidor.
4. Si el usuario autoriza abordar el cambio, deriva a su mantenedor
   (`comsatel-design-system` para Comsatel DS) en un ciclo separado y conserva
   el handoff como entrada.

## Bloqueantes

- **B1 — Dos ciclos, dos destinos.** Nunca modificar un sistema de diseño al
  construir una aplicación consumidora, ni construir producto dentro del
  sistema. Mezclarlos oculta releases y rompe el contrato de consumo.
- **B1a — Sin empresa por defecto.** No asumir Comsatel ni ningún otro cliente,
  sistema de diseño o workspace por costumbre. El destino, el stack y el sistema
  se leen del proyecto o se preguntan; suponerlos mezcla contratos entre
  proyectos.
- **B2 — `reference-core` es condicional y estricto.** Solo se usa cuando el
  destino verificado afecta `packages/core/**` en Angular. Usarlo para una app
  añade contexto incorrecto; omitirlo en Angular core incumple su alcance.
- **B3 — Dirección visual después de producto.**
  `frontend-design-direction` no decide reglas de negocio, permisos, errores
  ni notificaciones. Aplicarlo antes de conocer la tarea convierte la UI en
  decoración y deja casos operativos sin resolver.
- **B3a — Épica antes de planificación de producto.** Si existe una épica o
  historias fuente, `epica-a-plan-desarrollo` determina módulos, flujos,
  criterios de aceptación y dependencias antes del builder. Saltarlo deja al
  constructor inventar o perder alcance; una URL no sustituye esa evidencia
  legible.
- **B4 — Solo contrato público del sistema de diseño.** No copiar CSS, fuentes,
  assets ni componentes de rutas internas de la librería para resolver una
  falta. La salida segura es una composición pública o un handoff al mantenedor.
- **B5 — Derivar no es declarar éxito.** No afirmar que un skill construyó,
  probó o publicó algo sin su evidencia concreta. La coordinación conserva lo
  no verificado como pendiente.
- **B6 — Sin efectos laterales implícitos.** Una solicitud de orquestación no
  autoriza instalar, actualizar, registrar ni publicar skills. Ejecutar esas
  acciones sin alcance explícito altera otros agentes o destinos compartidos.
- **B7 — Notion no reemplaza la fuente ni Git.** No inferir requisitos desde
  código ni declarar un cambio de repositorio ejecutado porque un registro de
  Notion fue actualizado. El resultado sería una trazabilidad ficticia.
- **B8 — Casos de uso sin duplicación.** Cuando el workspace ya tiene una base
  canónica de Casos de uso, debe usarse como cuarto nivel de la cadena. Cada
  caso tiene una sola historia padre y relación inversa verificable; no se
  crean historias hijas ficticias, tablas por proyecto ni duplicados para
  representar el mismo flujo.
- **B9 — Reentrada sin rehacer el workspace.** Cuando la configuración de
  Notion ya está verificada, no reescribir la página principal, recrear bases
  ni solicitar autenticación de navegador para suplir un conector ausente. El
  plan vive en el archivo local y la ausencia del conector bloquea solo esa
  escritura; repetir el modelo destruye la continuidad del trabajo.

## Racionalizaciones comunes

| Racionalización | Realidad |
| --- | --- |
| “Casi todo es de Comsatel, lo asumo.” | El orquestador sirve para proyectos personales y de otros clientes; el sistema y el destino se leen o se preguntan (B1a). |
| “Puedo revisar `node_modules` para saber cómo armarlo.” | El consumidor depende de la API pública; los internals no son contrato y no se copian. |
| “La pantalla luce bien, por lo que ya está lista.” | La dirección visual no verifica flujo crítico, errores, foco, teclado ni responsive. |
| “Angular es Angular; `reference-core` puede ayudar en cualquier app.” | Ese skill explica el runtime de `packages/core`, no la construcción de aplicaciones. |
| “El título de una issue ya permite empezar a desarrollar.” | Una épica requiere texto/export y segmentación trazable; el título no contiene reglas, flujos ni criterios de aceptación. |
| “Una URL de GitLab siempre obliga a pedir capturas.” | Si el usuario autorizó la consulta y el entorno ya tiene API corporativa, se debe leer la fuente por API de solo lectura; pedir la misma información de nuevo desperdicia el flujo configurado. |
| “Marcar la épica hecha en Notion prueba que ya se implementó.” | Notion coordina; el cierre exige evidencia de tareas y validaciones, y el cambio de código conserva su propia evidencia en Git. |
| “Ya sé qué componente falta; lo agrego en este repositorio.” | El cambio requiere el ciclo independiente del sistema de diseño, sus pruebas y publicación versionada. |

## Señales de alerta

- La ruta propuesta cambia de repositorio sin que se haya identificado el
  destino real.
- Se nombra un sistema de diseño o un cliente que el proyecto no declara.
- Una derivación no preserva actor, objetivo, restricciones o evidencia.
- Se invoca un skill externo que no está instalado o cuyo alcance no coincide.
- La implementación usa una fuente o token local para suplir un export público
  inexistente.
- Una relación de Notion apunta a un padre distinto, un caso no tiene historia
  padre o falta un nivel de la cadena de trazabilidad.
- Se propone modificar la portada de Notion cuando el pedido solo afecta
  registros de Proyecto, Épica, Historia o Caso de uso.
- Se solicita iniciar sesión en Notion porque no aparece el conector, en vez de
  declarar ese límite y conservar el plan listo para persistir.
- El cierre enumera skills, pero no aclara qué se observó ni quién debe continuar.

## Formato de respuesta

- Primera línea: `Modo: ORIENTAR`, `COORDINAR`, `TRAZAR` o `ESCALAR`.
- Español neutro latinoamericano, directo y sin emojis decorativos.
- Muestra la ruta elegida antes de iniciar trabajo especializado e identifica
  toda hipótesis que pueda cambiar el destino o los permisos.
- En ORIENTAR, cierra con la derivación y ninguna edición.
- En COORDINAR, TRAZAR y ESCALAR, cierra con el bloque `Coordinación cerrada` de
  `verification-matrix.md`, incluyendo evidencia y pendiente real.

## Referencias

- `references/routing-map.md`
- `references/intake-and-escalation.md`
- `references/verification-matrix.md`
- `references/notion-traceability.md`
- `references/gitlab-source.md`
