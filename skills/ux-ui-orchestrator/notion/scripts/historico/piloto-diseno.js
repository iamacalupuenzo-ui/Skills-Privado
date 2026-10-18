// Piloto «preguntas de diseño»: propuestas de diseño con evidencia para 2 preguntas y registro de la propuesta ya existente de UXR-020-Q4.
// Uso: node piloto-diseno.js [--dry-run]. Las propuestas son BORRADORES de Claude: no cambian el Estado salvo UXR-020-Q4 (propuesta de Enzo ya escrita en su UXR).
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = CFG.sync;
const REPO_URL = CFG.repo_url;
const DESIGN_REF = process.env.DESIGN_REF || CFG.design_ref;
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b";
const hoy = new Date().toISOString().slice(0, 10);
const dry = process.argv.includes("--dry-run");
const out = path.join(S, "preguntas", "piloto");
fs.mkdirSync(out, { recursive: true });
const rt = s => ({ rich_text: [{ type: "text", text: { content: s } }] });
const PAGE = {};
for (const i of [1, 2, 3, 4]) for (const x of JSON.parse(fs.readFileSync(path.join(S, "preguntas", "resumen-" + i + ".json"), "utf8"))) if (x.page) PAGE[x.id] = x.page;

const AVISO = "> Propuesta elaborada con apoyo de IA a partir de la práctica de productos y design systems públicos. **No es una regla de CL2.** Validada como propuesta de diseño por Enzo Macalupu el " + hoy + "; pendiente de confirmación del PO. Grado de evidencia: D = documentado en la fuente; I = inferencia (IA) al aplicarlo a CL2.";

const CASOS = [
  {
    id: "UXR-001-Q7", quien: "Diseño", estado: "Propuesta", valida: true,
    propuesta: "Mantener el Home y, en el área donde iría el mapa, mostrar un estado «sin acceso»: explica que su usuario no tiene la función del mapa e indica a quién pedirla (su administrador). No se muestra un mapa vacío ni controles deshabilitados, y los accesos que sí tenga siguen visibles. Propuesta (IA) validada por Enzo Macalupu; fuentes: NN/g, Carbon y GitLab Pajamas. El PO debe confirmar qué otro contenido tendría el Home de ESAC.",
    cuerpo: [
      "## Propuesta de diseño (IA, " + hoy + ")", "", AVISO, "",
      "**Qué se propone**", "",
      "- El Home carga siempre. En el área del mapa se muestra un estado «sin acceso» con un título claro, una frase que explica el motivo en lenguaje llano y una vía de salida: pedir la función a su administrador.",
      "- No se deja el área vacía, ni se muestra un mapa vacío, ni se muestra la función deshabilitada. Coherente con la respuesta de Enzo a UXR-001-Q4: lo que el usuario no puede usar no se le ofrece.",
      "- El resto del Home y de la navegación (lo que ESAC sí puede usar) permanece visible.",
      "- El mensaje no revela datos de Unidades ni de Clientes, solo que falta la función.", "",
      "**Evidencia**", "",
      "| Fuente | Qué dice | Grado |", "|---|---|---|",
      "| [NN/g, Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/) | No dejar secciones totalmente vacías: comunicar el estado del sistema, orientar y ofrecer una vía para actuar | D |",
      "| [Carbon Design System, Empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/) | Ante falta de permiso: explicar que el usuario no puede ver los datos y sugerir cómo solicitar acceso, sin dejarlo en un callejón sin salida | D |",
      "| [GitLab Pajamas, Feature management](https://design.gitlab.com/usability/feature-management) | Ocultar lo que el usuario no debe usar por permisos; preferir un mensaje que explique a deshabilitar el control | D |",
      "| Aplicación al Home de ESAC | Combinar las tres prácticas para el caso «el mapa es el contenido principal y falta la función» | I |", "",
      "**Límites**", "",
      "- Es práctica general de productos B2B, no una regla de CL2 Flotas. No hay fuente en el repo (la pregunta ya se marcó como inferencia).",
      "- Si el Home de ESAC tiene otro contenido además del mapa es una decisión de negocio: la debe confirmar el Product Owner (UXR-001-Q7 lo lista como PO/UX).",
      "- El texto final del mensaje corresponde a UX writing.", "",
      "**Estado:** validada como propuesta de diseño por Enzo Macalupu el " + hoy + "; pendiente de confirmación del PO.",
    ],
  },
  {
    id: "UXR-007-Q6", quien: "Diseño", estado: "Propuesta", valida: true, extra: { "Bloquea": { select: { name: "No" } }, "Prioridad": { select: { name: "Baja" } } },
    propuesta: "Opción (a): al enviar, si un contacto está incompleto no se envía el alta. Se muestra un resumen de errores arriba y un mensaje junto al contacto incompleto («Falta el correo de este contacto»), conservando todo lo escrito, y se ofrece «Quitar contacto» para resolverlo sin completarlo. No se descarta nada en silencio. Propuesta (IA) validada por Enzo Macalupu; fuentes: GOV.UK y WCAG 3.3.1. Se mantiene como estado límite de baja probabilidad.",
    cuerpo: [
      "## Propuesta de diseño (IA, " + hoy + ")", "", AVISO, "",
      "**Qué se propone** (opción a de la pregunta)", "",
      "- Si hay un contacto parcialmente completo, **el envío no se realiza**. La pantalla vuelve a mostrarse con todo lo que el usuario escribió.",
      "- Un resumen de errores en la parte superior (con el foco) indica qué contacto está incompleto, y un mensaje junto a ese contacto dice qué falta, por ejemplo «Falta el correo de este contacto».",
      "- Cada contacto tiene la acción **«Quitar contacto»**, para que el usuario pueda resolver el error eliminando un contacto que no quiere registrar, sin tener que completarlo.",
      "- No se descarta nada en silencio. Si el PO eligiera la opción (b), registrar el alta sin el parcial, habría que avisar **antes de enviar** qué contacto no se guardará.", "",
      "**Evidencia**", "",
      "| Fuente | Qué dice | Grado |", "|---|---|---|",
      "| [GOV.UK Design System, Validation](https://design-system.service.gov.uk/patterns/validation) | Validar al enviar; volver a mostrar la página con los campos como el usuario los llenó; resumen de errores arriba con el foco y un mensaje junto a cada campo con error | D |",
      "| [W3C, WCAG 2.2 criterio 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) | Si se detecta un error de entrada, se identifica el elemento con error y se describe en texto (nivel A) | D |",
      "| Aplicación a contactos parcialmente completos | Tratar el contacto incompleto como un error de ese contacto y ofrecer quitarlo | I |", "",
      "**Límites**", "",
      "- La guía de GOV.UK no trata específicamente grupos repetidos parcialmente completos; la acción «Quitar contacto» es una inferencia de diseño.",
      "- HU-01-01 §6 dice «no se registra ese contacto» sin precisar el efecto. La opción (a) es compatible, pero el PO debe confirmar el texto de la historia (UXR-007-Q6 lo lista como PO/UX).",
      "- Distinto del bloque de contacto totalmente vacío (UXR-007-Q3), que ya tiene respuesta.", "",
      "**Nota de diseño (Enzo Macalupu, " + hoy + ")**", "",
      "El registro exige todos los datos obligatorios, así que un contacto incompleto es un escenario muy improbable. La pregunta se mantiene solo para mapear cómo se mostraría si ocurriera y para tener un estado específico en la pantalla (contacto incompleto). **No bloquea el diseño** (Bloquea: No, prioridad Baja).", "",
      "**Estado:** validada como propuesta de diseño por Enzo Macalupu el " + hoy + "; pendiente de confirmación del PO.",
    ],
  },
  {
    id: "UXR-020-Q4", quien: "Mixta", estado: "Propuesta",
    respuesta: "[UXR-020 · actualización 2026-10-07 · propuesta de Enzo con INV-003] Contraseña inicial → 2FA → T&C en un solo asistente con indicador de pasos, sin «Omitir» cuando el administrador exige el 2FA. «T&C primero» queda como alternativa si Legal lo exige. Pendiente del PO y de Seguridad.",
    decidido: "Enzo Macalupu (diseño); pendiente del PO, Seguridad y Legal", fecha: "2026-10-07",
    cuerpo: [
      "## Respuestas registradas", "",
      "### Vigente · UXR-020, actualización 2026-10-07 — propuesta de Enzo con INV-003", "",
      "Contraseña inicial → 2FA → T&C en un solo asistente con indicador de pasos, sin «Omitir» cuando el administrador exige el 2FA. Reemplaza la propuesta anterior (T&C antes del 2FA). «T&C primero» queda como alternativa si Legal lo exige. Coincide con HU-02-02 §10 y difiere de HU-02-01 §10 (UXR-017-Q4). Pendiente del PO y de Seguridad.", "",
      "**Evidencia:** [INV-003 §3](" + REPO_URL + DESIGN_REF + "/design/investigacion/INV-003-aviso-de-acceso-perdido-y-orden-del-primer-ingreso.md): no se encontró un orden estandarizado por la industria (grado I); Keycloak controla el orden con la prioridad de sus required actions; Okta y Entra no permiten omitir el 2FA cuando es obligatorio.", "",
    ],
  },
];

const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8", env: Object.assign({}, process.env, { DESIGN_REF }) });
const resumen = [];
for (const c of CASOS) {
  const f = c.id.replace(/[^\w.-]+/g, "_"), base = path.join(S, "preguntas", "lote", f);
  const props = { "Quién puede responder": { select: { name: c.quien } } };
  const ifEmpty = [];
  if (c.propuesta) { props["Propuesta de diseño"] = rt(c.propuesta); }
  let ifValues;
  if (c.extra) Object.assign(props, c.extra);
  if (c.estado) {
    props["Estado"] = { select: { name: c.estado } }; ifValues = { "Estado": ["Abierta"] };
    props["Respuesta"] = rt(c.valida ? "[Propuesta de diseño (IA) validada por Enzo Macalupu · " + hoy + "] " + c.propuesta : c.respuesta);
    props["Decidido por"] = rt(c.valida ? "Enzo Macalupu (diseño), sobre propuesta (IA); pendiente del PO" : c.decidido);
    props["Fecha de decisión"] = { date: { start: c.valida ? hoy : c.fecha } };
    ifEmpty.push("Respuesta", "Decidido por", "Fecha de decisión");
  }
  const mP = path.join(out, f + "-props.json"); fs.writeFileSync(mP, JSON.stringify({ id: c.id, title: c.id, props, ifEmpty, ifValues }, null, 1));
  const nuevo = path.join(out, f + "-origen2.md"), cuerpo2 = path.join(out, f + "-cuerpo2.md");
  fs.writeFileSync(nuevo, fs.readFileSync(base + "-origen.md", "utf8").replace(/\s+$/, "") + "\n\n" + c.cuerpo.join("\n"));
  const rec = { id: c.id, estado: c.estado || "sin cambio" };
  if (dry) { resumen.push(rec); continue; }
  try {
    const p = JSON.parse(run(SYNC, ["upsert", "--ds", DS_PREG, "--meta", mP, "--solo-props"]));
    const repoPath = JSON.parse(fs.readFileSync(base + "-meta.json", "utf8")).props["Ruta en el repo"].rich_text[0].text.content;
    run(path.join(MOD, "scripts", "prepare-body.js"), [repoPath, nuevo, cuerpo2, WT, c.id]);
    run(SYNC, ["push", "--page", PAGE[c.id], "--body", cuerpo2, "--source", repoPath, "--loaded", hoy]);
    resumen.push(Object.assign(rec, { ok: true, props: p.soloProps, omitidas: p.omitidas }));
  } catch (e) { resumen.push(Object.assign(rec, { error: String(e.stderr || e.message).slice(0, 220) })); }
}
fs.writeFileSync(path.join(S, "preguntas", "piloto-resumen.json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length, dry }));
