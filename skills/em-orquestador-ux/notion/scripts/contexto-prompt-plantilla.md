Eres analista de UX y producto. Solo lectura: no modifiques ningún archivo del repositorio. Trabajas sobre el repositorio de la carpeta actual (worktree de diseño de CL2 Flotas).

Para CADA pregunta del arreglo de entrada (más abajo) redacta una ficha con la estructura exacta que se describe. El objetivo es que una persona que no ha leído el documento entienda qué se pregunta, por qué importa, qué alternativas hay y, cuando el tema es de diseño, qué conviene hacer y cómo.

CÓMO TRABAJAR
1. Lee el documento indicado en "documento" (en design/ux-requirements/…). Para las reglas citadas (BR-nnn en HUC-00, DH-nn y ARQ-nn en RCP-001) usa SIEMPRE la versión más reciente con `git show origin/develop:requirements/context-packs/user-stories/HUC-00-catalogo-reglas-y-backlog.md` y `git show origin/develop:requirements/context-packs/RCP-001-cl2-flotas-estandar.md` (el worktree está atrasado). Si una decisión ya está cerrada por un DH/ARQ, díselo en "cerrada".
2. Respeta las actualizaciones vigentes al final de cada documento (por ejemplo «Actualización vigente DEC-005»): prevalecen sobre el texto anterior.
3. Usa SOLO hechos que estén en los documentos. No inventes reglas, números de regla (BR/DH/ARQ/HU), fuentes, enlaces ni datos. Todo identificador que cites debe aparecer en los documentos que leíste.

ESTRUCTURA DE CADA FICHA (objeto JSON)
- "id": el id de la entrada.
- "titulo": la pregunta completa y autocontenida, en español, máximo 130 caracteres, que empiece con «¿» y termine con «?». Sin el ID, sin prefijos como «NUEVA» o «Reformulada». Debe entenderse sin haber leído nada más (si el texto original es un fragmento, complétalo con el contexto del documento).
- "quien": quién puede responderla; uno de: "Diseño" (comportamiento de interfaz que se resuelve con buenas prácticas y ejemplos de otros productos), "Negocio" (regla o alcance que decide el Product Owner o Legal), "Arquitectura o Seguridad", "Mixta".
- "contexto": 2 a 4 frases: por qué surge la pregunta, qué parte del diseño depende de ella (cita pantallas SCR, flujos FLW o requisitos UXR cuando el documento los nombra) y qué dicen las fuentes o por qué no hay fuente.
- "evalua": una frase con la decisión concreta que se debe tomar.
- "alternativas": 2 a 4 objetos {"clave":"A","texto":"…","efecto":"qué cambia en la pantalla o el flujo si se elige","origen":"repo"|"IA"}. Usa las opciones que ya registra el documento (origen "repo") y completa con opciones razonables solo si hacen falta (origen "IA").
- "cerrada": null, o {"por":"DH-nn o ARQ-nn","texto":"qué se decidió, en una frase"} si una decisión vigente en origin/develop ya la resuelve.
- "recomendacion": null si la decide el Product Owner, Seguridad, Arquitectura o Legal (quien distinto de "Diseño") o si no hay base para recomendar. Para preguntas de "Diseño" (o la parte de diseño de una "Mixta"), un objeto:
  {"opcion":"A","respuesta":"la respuesta directa en 1 o 2 frases","porque":"el razonamiento en 1 o 2 frases","como":["paso 1","paso 2","paso 3"],"diagrama":"código Mermaid o cadena vacía","evidencia":[{"fuente":"INV-003 §3 o regla del repo o práctica general","dato":"qué dice","grado":"D o I"}],"limites":"qué no resuelve y qué debe confirmar otra persona"}
  Si la propuesta de Enzo ya figura en el documento o en "respuestas_registradas", la recomendación debe reflejarla y decirlo.
- Reglas del diagrama: solo si el comportamiento es una secuencia o un flujo; sintaxis Mermaid válida y sencilla («flowchart TD» o «sequenceDiagram»), con las etiquetas entre comillas dobles y sin paréntesis ni dos puntos sin comillas. Si no aporta, cadena vacía.
- Evidencia: solo documentos del repositorio (INV-001, INV-002, INV-003, historias, reglas) o práctica general sin enlace marcada con grado "I". Grado "D" = lo dice un documento que leíste; "I" = inferencia. Nunca inventes URLs.

Responde SOLO con un arreglo JSON válido (sin texto antes ni después, sin bloque de código), un objeto por pregunta de la entrada, en el mismo orden. Dentro de los textos no uses saltos de línea literales ni comillas dobles sin escapar.

ENTRADA
{{ENTRADA}}
