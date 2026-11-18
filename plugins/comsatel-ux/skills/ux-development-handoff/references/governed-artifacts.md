# Diseño validado en Claude Design o en un prototipo

«Diseño gobernado» es el término del contrato para la versión elegida y validada por una persona como referencia para construir. No requiere Figma, ni implica que el agente apruebe el diseño.

Tipos explícitos: figma y stitch conservan su contrato; claude-design y prototype usan evidencia vinculada a una DD humana. Cualquier otro tool se bloquea, aunque copie campos de Figma.

## Qué exige el registro nuevo

- artifact_ref identifica la alternativa o URL exacta; version identifica su revisión.
- decision_ref resuelve una Design Decision con screens, decided_by (human:id), decided_at ISO con zona y decides igual a claude-design-governed o prototype-governed.
- La DD declara governed_design con tool, artifact_ref, version, states_covered, responsive_covered y evidence_refs. Este bloque debe coincidir con el DTM: cambiar el artefacto, versión, cobertura o evidencia invalida la aprobación anterior.
- evidence_refs es una lista JSON de objetos resource/sha256. Cada resource es un archivo dentro de la KB, sin traversal ni enlace fuera del árbol; su SHA-256 debe coincidir. Una URL sola no sustituye capturas o evidencia comprobada.
- prototype incluye build_commit completo (40 hex) en DD y DTM. Las capturas/validaciones deben corresponder a ese build y estar vinculadas en la DD.
- approved_by y approved_at transcriben el evento humano de la DD; no se generan. La DD, el DTM y los artefactos editados conservan status: draft. Solo el bloque governed_design registra una aprobación humana ya existente.

El validador comprueba coherencia, archivos y huellas. No autentica quién escribió una aprobación ni abre el sitio externo: la relectura y validación humana de esa versión siguen siendo obligatorias. Esta aprobación de diseño no aprueba el gate; human_review del HOF mantiene su propia compuerta.

## Ejecución

Primero registrar la decisión humana por el dueño de la DD. Después:

    python validators/cli.py register-governed-artifact --kb <kb> --dtm <DTM> --screen <SCR> --tool claude-design|prototype --artifact-ref <ref> --version <version> --decision-ref <DD> --approved-by human:<id> --approved-at <ISO-con-zona> --evidence <manifest.json> --states <estados> --breakpoints <breakpoints> [--build-commit <SHA-completo>]

La entrada evidence es el manifiesto de archivos ya aprobados, no un texto que afirme que existen. Registrar correctamente no declara PASSED: ejecutar gate y dev-context después; se conservan lineage, estados, responsive, accesibilidad, preguntas y aprobación humana del gate. Un campo ausente bloquea; evidencia modificada falla.
