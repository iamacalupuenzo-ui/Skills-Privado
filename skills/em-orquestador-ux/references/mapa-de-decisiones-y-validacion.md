# Mapa de decisiones y validación de lo construido

Pregunta antes de leer: ¿dónde busca el agente una decisión de Enzo que el PO retiró, y cómo valida lo que construyó Desarrollo sin tocar el backend?

**En 30 segundos.** Las decisiones viven en cuatro lugares de la KB y uno de Notion. Al iniciar un paquete se corre `scripts/decisiones-retiradas.mjs --paquete DSP-NNN`: si el PO retiró algo que Enzo había decidido y no tiene pregunta diferida y aviso, se le avisa antes de diseñar. Lo construido se valida en local con datos simulados, nunca en DEV/QA.

## Dónde se lee cada decisión

| Qué | Dónde | Cómo se reconoce |
|---|---|---|
| Decisiones de Enzo (UX) | `decisions/ux-ui/decisiones/DEC-*.md` | Tabla de decisiones D1…Dn y preguntas DEC-NNN-Qn |
| Decisiones del PO | `requirements/context-packs/RCP-001-cl2-flotas-estandar.md` §10 | Filas `\| DH-NNN \|` con fecha; las que citan una DEC o una pregunta UXR tocan UX |
| Lo diferido o cerrado | Preguntas `UXR-*-Qn` de cada UXR (columna Estado: Diferida, Cerrada) | En Notion, base Preguntas, estado «Diferida» |
| Lo avisado al Analista Funcional | `avisos/management/AVS-*.md` (status SENT con enlace a la nota de la Issue) | Comentario en la Issue de la historia, proyecto 622, sin `@` |

## Regla de lo retirado por el PO (Enzo, 2026-11-26)

Caso que la originó: DH-659 (2026-10-28) quitó del Sprint 1 el isotipo, las tipografías y la escala de colores. La escala y las tipografías se llevaron; el isotipo no, y Enzo no se enteró.

1. Cada DH que retira o difiere algo que Enzo decidió tiene su pregunta en el UXR dueño: **Cerrada** si Enzo acepta el retiro, **Diferida** si debe volver.
2. Lo Diferido que debe entrar en la siguiente versión lleva en Notion (Preguntas) la prioridad **«Obligatoria en la siguiente versión»** y un aviso publicado en la Issue de la historia.
3. El control `node scripts/decisiones-retiradas.mjs --paquete DSP-NNN` (desde la raíz de la KB) lo comprueba; sale con código 1 si falta algo. `--todo` lista también los diferimientos de alcance que no tocan UX, como información.
4. Publicar un aviso en GitLab requiere la confirmación de Enzo. Al responder, siempre se dan las rutas: archivo local, enlace de la nota y página de Notion.

## Validar lo construido con datos simulados (Enzo, 2026-11-26)

UX solo revisa el frontend: lo que Desarrollo construyó se levanta en local, nunca contra DEV o QA ni con usuarios reales.

1. Worktrees en `--detach` desde `origin/integration` (no toca las ramas locales) y `npm ci` con `GITLAB_NPM_TOKEN`.
2. Shell con su mock (`dev/mock-bff`) y la micro UI con `ng serve` en el puerto que espera el `proxy.conf.json` del Shell.
3. Si el mock no tiene las rutas de la pantalla, un proxy delante del mock las simula con el contrato de la micro UI (`*-model.ts`, `*-api.service.ts`) y deja pasar lo demás. Ejemplo: `scripts/mock-validacion/proxy-idv-dsp009.mjs` (Cliente `/api/customer/branding`, Producto `/api/product/branding`). No se cambian los repos de producto; las rutas faltantes se avisan a Desarrollo.
4. A Enzo se le entregan las URL de entrada, una por nivel, diciendo cuál es cuál (Cliente, Distribuidor, Producto).
5. Lo que no se vio en pantalla se dice. Un hallazgo que no se repite queda como no confirmado.

Comprobación: si el PO retira en una DH un elemento que Enzo decidió, ¿qué dos cosas deben existir para que el control lo dé por bueno?
