// Piloto «contexto de la necesidad»: reformula 10 preguntas (título + sección «Pregunta reformulada (IA)») y registra los cierres ARQ de RCP-001 (develop).
// Uso: node contexto-piloto.js [--dry-run]. Conserva el texto original del repo debajo. No toca Bloquea ni Prioridad salvo los cierres ARQ (Estado, Respuesta, Decidido por, Fecha).
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const WT = process.env.NOTION_WORKTREE || CFG.worktree;
const SYNC = process.env.NOTION_SYNC || require("path").resolve(MOD, CFG.sync);
const REPO_URL = CFG.repo_url;
const DESIGN_REF = process.env.DESIGN_REF || CFG.design_ref;
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b";
const hoy = new Date().toISOString().slice(0, 10);
const dry = process.argv.includes("--dry-run");
const out = path.join(S, "preguntas", "contexto");
fs.mkdirSync(out, { recursive: true });
const rt = s => ({ rich_text: [{ type: "text", text: { content: s } }] });
const PAGE = {};
for (const i of [1, 2, 3, 4]) for (const x of JSON.parse(fs.readFileSync(path.join(S, "preguntas", "resumen-" + i + ".json"), "utf8"))) if (x.page) PAGE[x.id] = x.page;

const AVISO = "> Título, contexto, alternativas y propuesta elaborados con apoyo de IA a partir del texto del repo y de las reglas que cita. El texto original se conserva más abajo. Por validar por Enzo Macalupu.";
const RCP = "[RCP-001 en develop](" + REPO_URL + "develop/requirements/context-packs/RCP-001-cl2-flotas-estandar.md)";

const CASOS = [
  { id: "UXR-007-Q6", quien: "Diseño",
    titulo: "¿Cómo responde el alta si un contacto queda incompleto y existe otro completo?",
    md: [
      "**¿Cómo debe comportarse el formulario de alta del Distribuidor si un contacto queda con datos incompletos (por ejemplo, nombre sin correo) y existe otro contacto completo?**", "",
      "## Contexto de la necesidad", "HU-01-01 §6 dice «no se registra ese contacto» sin precisar qué ocurre con el envío. El registro exige los datos obligatorios, por lo que el caso es muy improbable. Se documenta para tener un estado específico en las pantallas del alta (SCR-008 a SCR-010) y no dejar el comportamiento sin definir.", "",
      "## Qué se evalúa", "Qué hace el formulario ante un contacto parcial: impedir el envío o registrar solo el completo.", "",
      "## Alternativas posibles",
      "- **A.** Rechazar el envío entero e indicar qué falta (supuesto actual del requisito 4 del UXR).",
      "- **B.** Registrar el alta con el contacto completo y descartar o avisar del parcial.", "",
      "## Propuesta o resolución", "Propuesta (IA) validada por Enzo: la alternativa A, con la acción «Quitar contacto». Ver la sección «Propuesta de diseño» más abajo. Prioridad Baja: estado límite que no bloquea el diseño.",
    ] },
  { id: "UXR-017-Q2", quien: "Diseño",
    titulo: "¿Qué pasa si el usuario abandona el 2FA del primer ingreso: repite credenciales o retoma el paso?",
    md: [
      "**Si una persona abandona o cierra el paso de verificación en dos pasos (2FA) durante el primer ingreso, ¿vuelve al formulario y debe escribir de nuevo sus credenciales, o retoma el paso pendiente?**", "",
      "## Contexto de la necesidad", "Cuando el administrador exige el 2FA, el primer ingreso encadena contraseña inicial, 2FA y T&C en un solo asistente (UXR-017-Q1 y UXR-020-Q4). Si la persona cierra el asistente a medias, el diseño debe decir qué ve al volver, para no dejarla bloqueada ni obligarla a repetir pasos ya hechos.", "",
      "## Qué se evalúa", "Qué conserva el sistema entre intentos y cuánto debe repetir el usuario.", "",
      "## Alternativas posibles (IA)",
      "- **A.** Volver al formulario de ingreso, autenticarse otra vez y retomar el paso pendiente.",
      "- **B.** Conservar la sesión parcial un tiempo corto y retomar directamente el paso pendiente.",
      "- **C.** Cancelar el proceso y exigir comenzar de cero.", "",
      "## Propuesta o resolución", "**Respuesta (IA): sí, debe repetir las credenciales y, al volver, retoma el paso pendiente (alternativa A).** La verificación en dos pasos forma parte del ingreso: mientras no se completa, la persona no tiene sesión y no entra a la aplicación. Si cierra el asistente, se autentica de nuevo y el asistente la lleva directo al paso que quedó pendiente, sin repetir los ya completados (por ejemplo, la contraseña inicial).", "",
      "**Cómo funcionaría**", "",
      "1. La persona ingresa con credenciales válidas y el asistente muestra «Paso 1 de 3: contraseña inicial».",
      "2. Completa el paso 1 y pasa al paso 2 (verificación en dos pasos).",
      "3. Si abandona o cierra la ventana, no se crea la sesión y no accede a la aplicación.",
      "4. Al volver, inicia sesión otra vez y el asistente abre el paso pendiente, sin repetir los completados.", "",
      "```mermaid", "flowchart TD", '    A["Credenciales válidas"] --> B["Paso 1 de 3: contraseña inicial"]', '    B --> C["Paso 2 de 3: verificación en dos pasos"]', '    C -->|"Completa"| D["Paso 3 de 3: términos y condiciones"]', '    D --> E["Sesión creada: accede a la aplicación"]', '    C -->|"Abandona o cierra"| F["Sin sesión"]', '    F --> G["Nuevo ingreso con credenciales"]', '    G --> C', "```", "",
      "**Evidencia**", "",
      "- Keycloak: las acciones requeridas bloquean el ingreso hasta completarse y se vuelven a pedir en el siguiente inicio de sesión (INV-003 §3, grado D).",
      "- Okta y Microsoft Entra no permiten omitir el 2FA cuando es obligatorio (INV-003, grado D).", "",
      "**Límites:** el texto del aviso al volver es de UX writing, y el periodo de gracia para el 2FA sigue pendiente (INV-003).",
    ] },
  { id: "UXR-001-Q8", quien: "Diseño",
    titulo: "¿A dónde va el foco del teclado y del lector de pantalla al cerrarse la tarjeta de una Unidad que sale del alcance?",
    md: [
      "**Cuando ESAC tiene abierta la tarjeta o el detalle de una Unidad y esa Unidad sale de su alcance, ¿a qué elemento se mueve el foco del teclado y del lector de pantalla al cerrarse la tarjeta?**", "",
      "## Contexto de la necesidad", "La Unidad puede salir del alcance por retirada del Grupo, ESAC retirado, asignación vencida o Unidad Inactiva. El aviso no intrusivo no debe mover el foco (WCAG 4.1.3), pero cerrar la tarjeta sí lo desplaza; sin una regla, el foco se pierde en la página y afecta a quien usa teclado o lector de pantalla. Complementa UXR-001-Q2.", "",
      "## Qué se evalúa", "El destino del foco tras el cierre automático de la tarjeta.", "",
      "## Alternativas posibles",
      "- **A.** Un contenedor estable: la lista o el título del panel principal (propuesta registrada de Enzo, 2026-10-07, con INV-003 A6).",
      "- **B.** Volver al elemento que abrió la tarjeta, si sigue en pantalla (IA).",
      "- **C.** Al propio aviso de pérdida de acceso (IA).", "",
      "## Propuesta o resolución", "**Propuesta registrada de Enzo: alternativa A.** Cuando la tarjeta se cierra porque la Unidad salió del alcance, el foco pasa a un contenedor estable de la página (la lista o el título del panel principal) y el aviso se anuncia sin mover el foco. Pendiente del PO.", "",
      "**Cómo funcionaría**", "",
      "1. La Unidad sale del alcance con la tarjeta abierta.",
      "2. El sistema cierra la tarjeta y muestra el aviso no intrusivo, que se anuncia al lector de pantalla sin mover el foco (WCAG 4.1.3).",
      "3. El foco se coloca en el contenedor estable (la lista o el título del panel), de modo que no se pierde en la página.", "",
      "```mermaid", "flowchart TD", '    A["Unidad sale del alcance con la tarjeta abierta"] --> B["Se cierra la tarjeta"]', '    B --> C["Aviso no intrusivo anunciado sin mover el foco"]', '    B --> D["Foco al contenedor estable: lista o título del panel"]', "```",
    ] },
  { id: "UXR-010-Q2", quien: "Mixta",
    titulo: "¿Qué límites tiene el nombre visible del Distribuidor y qué pasa si se borra?",
    md: [
      "**¿Qué longitud y qué caracteres admite el nombre visible de un Distribuidor, y qué ocurre si el administrador lo borra: se hereda el del Producto o es un error?**", "",
      "## Contexto de la necesidad", "El nombre visible es uno de los elementos de identidad del Distribuidor (BR-240 define logotipo, color principal, color secundario y nombre visible). El editor de identidad (SCR-011 a SCR-013) necesita reglas de validación y mensajes para ese campo.", "",
      "## Qué se evalúa", "Las reglas de validación del campo y el comportamiento al vaciarlo.", "",
      "## Alternativas posibles (IA)",
      "- **Límites:** un máximo y un conjunto de caracteres que fije el PO (valores por definir), o solo recorte visual sin límite de datos.",
      "- **Al vaciarlo, A:** vuelve a heredar el nombre del Producto (coherente con «retirar identidad propia»).",
      "- **Al vaciarlo, B:** error de campo obligatorio.", "",
      "## Propuesta o resolución", "Sin propuesta: los límites son una decisión de negocio; el comportamiento al vaciar puede proponerse cuando el PO fije el alcance.",
    ] },
  { id: "UXR-013-Q3", quien: "Diseño",
    titulo: "¿Qué mensaje se muestra al rechazar el acceso a Configuración por permiso o ámbito?",
    md: [
      "**Cuando una persona intenta abrir «Configuración del Distribuidor» sin permiso o fuera de su ámbito, ¿qué mensaje se muestra y es el mismo mensaje común de la plataforma?**", "",
      "## Contexto de la necesidad", "El acceso a la configuración se rechaza por falta de permiso o por ámbito, y existe una pantalla de acceso no autorizado (SCR-013). Hace falta un texto y una forma de salida definidos, sin mostrar un formulario utilizable ni dar pistas sobre datos que la persona no puede ver. Sin fuente en el repo.", "",
      "## Qué se evalúa", "El contenido del mensaje y si es único para toda la plataforma.", "",
      "## Alternativas posibles (IA)",
      "- **A.** Un mensaje común de la plataforma para ambos motivos, con una vía de salida (pedir acceso al administrador).",
      "- **B.** Mensajes distintos para permiso y ámbito.",
      "- **C.** Una página de error genérica sin orientación.", "",
      "## Propuesta o resolución", "**Respuesta (IA): un mensaje común de la plataforma para ambos motivos (alternativa A), con una vía de salida.** Distinguir permiso y ámbito en el texto da pistas sobre qué existe y qué no; un mensaje único explica que no tiene acceso y a quién pedirlo.", "",
      "**Cómo funcionaría**", "",
      "1. La persona intenta abrir «Configuración del Distribuidor» por el menú o por enlace directo.",
      "2. El sistema rechaza el acceso, sea por permiso o por ámbito, y muestra la pantalla de acceso no autorizado (SCR-013).",
      "3. La pantalla dice que su usuario no tiene acceso a esa sección y que puede pedirlo a su administrador, con una acción para volver al inicio. No se muestra ningún formulario.", "",
      "**Evidencia:** Carbon recomienda explicar que no hay permiso y cómo solicitar acceso; GitLab Pajamas prefiere un mensaje que explique antes que un control deshabilitado (grado D). **Límites:** el texto final es de UX writing y no hay fuente en el repo.",
    ] },
  { id: "UXR-024-Q2", quien: "Mixta",
    titulo: "¿App móvil por Distribuidor o app común, y qué marca ve el formulario de ingreso?",
    md: [
      "**En Móvil Cliente, ¿habrá una app distinta por Distribuidor (con su marca en la tienda y en el arranque) o una app común que adopta la marca tras ingresar, y qué marca ve la persona en el formulario de ingreso del App?**", "",
      "## Contexto de la necesidad", "HU-02-02 y UXR-024: ninguna fuente elige un modelo ni define cómo se resuelve la marca antes de autenticar. Afecta al formulario móvil (SCR-006), al icono y a la pantalla de arranque.", "",
      "## Qué se evalúa", "El modelo de distribución de la app y la marca que se muestra antes de autenticar.", "",
      "## Alternativas posibles",
      "- **A.** Una app por Distribuidor, con su marca desde la tienda.",
      "- **B.** App común con la marca del Producto antes del ingreso y la del Distribuidor tras ingresar.",
      "- **C.** App común con formulario neutral antes del ingreso.", "",
      "## Propuesta o resolución", "Respuesta de Enzo (propuesta, pendiente del PO): app común que adopta la marca del Distribuidor tras el ingreso. Sigue abierto qué marca ve el formulario del App: Producto (B) o neutral (C).",
    ] },
  { id: "ARQ-12", quien: "Arquitectura o Seguridad",
    titulo: "¿BackOffice se publica en una sola dirección o en una por Distribuidor?",
    md: [
      "**¿BackOffice usa una sola dirección (URL) para todos los usuarios o una distinta por Distribuidor?**", "",
      "## Contexto de la necesidad", "BR-290 y DH-70 piden que la pantalla de ingreso nazca con la identidad vigente del Distribuidor. Si la dirección es única, la marca solo puede resolverse después de identificar al usuario; si es por Distribuidor, SCR-001 puede mostrar esa identidad desde el primer momento.", "",
      "## Qué se evalúa", "El modelo de direcciones de BackOffice.", "",
      "## Alternativas posibles",
      "- **A.** Una sola dirección para todos.",
      "- **B.** Una dirección por Distribuidor (staff por la del Producto).", "",
      "## Propuesta o resolución", "**Cerrada (DH-86, 2026-10-13):** el BackOffice del Distribuidor se publica en el subdominio `admin.<dominio>` de su dominio, y el staff entra por `backoffice.cl2flotas.com`. Fuente: " + RCP + ", ARQ-12 y DH-86.",
    ],
    cierre: { resp: "[RCP-001 · ARQ-12 · DH-86, 2026-10-13] El BackOffice del Distribuidor se publica en el subdominio admin.<dominio> de su dominio, y el staff entra por backoffice.cl2flotas.com (ADR-031 §2 revisado).", por: "Interesados (PO y Arquitectura), según DH-86", fecha: "2026-10-13" } },
  { id: "UXR-004-Q1", quien: "Negocio",
    titulo: "¿Qué se muestra de una Unidad en el mapa si ninguno de sus Dispositivos es visible para ESAC?",
    md: [
      "**Si ninguno de los Dispositivos de una Unidad es visible para ESAC, ¿qué se muestra de esa Unidad en el mapa?**", "",
      "## Contexto de la necesidad", "ESAC solo ve cierta información de las Unidades de sus Grupos (UXR-004: mostrar solo los Dispositivos visibles). Una Unidad puede tener varios Dispositivos; si ninguno es visible para ESAC, la Unidad está en su alcance pero sin datos que mostrar. Ninguna fuente lo dice.", "",
      "## Qué se evalúa", "Si la Unidad aparece o no, y con qué información.", "",
      "## Alternativas posibles (IA)",
      "- **A.** No mostrar la Unidad en el mapa ni en listas.",
      "- **B.** Mostrarla sin posición y con un estado «sin datos visibles».",
      "- **C.** Mostrarla solo en un listado para soporte, con aviso.", "",
      "## Propuesta o resolución", "Sin propuesta: depende de las reglas de visibilidad, que decide el PO.",
    ] },
  { id: "UXR-016-Q7", quien: "Arquitectura o Seguridad",
    titulo: "¿Se acepta o se mitiga el riesgo de enumerar cuentas por el bloqueo de intentos (BR-273)?",
    md: [
      "**Como un usuario inexistente nunca acumula intentos para el bloqueo y una cuenta real sí (BR-273), ¿se acepta que repetir intentos con el mismo identificador pueda revelar si la cuenta existe, o se mitiga?**", "",
      "## Contexto de la necesidad", "BR-273 (confirmada) define el bloqueo por intentos. QA señala el riesgo de enumeración de cuentas (RISK-002). Afecta a los mensajes de rechazo del login de BackOffice y de Cliente (BR-244). Si Keycloak gestiona el bloqueo, depende de UXR-016-Q6 y UXR-020-Q5.", "",
      "## Qué se evalúa", "Aceptar o mitigar el riesgo.", "",
      "## Alternativas posibles (IA)",
      "- **A.** Aceptar el riesgo y documentarlo.",
      "- **B.** Mitigar contabilizando intentos también para identificadores inexistentes, con respuesta indistinguible.",
      "- **C.** Mitigar con límites por origen del intento y mensajes siempre genéricos.", "",
      "## Propuesta o resolución", "Sin propuesta: es una decisión de Seguridad.",
    ] },
  { id: "UXR-014-Q3", quien: "Diseño",
    titulo: "¿Se verificó la identidad base del Producto contra WCAG 2.2 AA y quién la verifica?",
    md: [
      "**¿La identidad base del Producto (colores y logotipo) se verificó contra WCAG 2.2 AA, y quién la verifica antes de que los Distribuidores la hereden?**", "",
      "## Contexto de la necesidad", "Los Distribuidores heredan la identidad base del Producto, y las pantallas deben cumplir WCAG 2.2 AA (HU-01-09 §9). La base de conocimiento no tiene evidencia de esa verificación.", "",
      "## Qué se evalúa", "Si existe evidencia de cumplimiento y quién la aporta.", "",
      "## Alternativas posibles (IA)",
      "- **A.** Verificar el contraste con una herramienta (relaciones 4.5:1 para texto y 3:1 para componentes) y registrar el resultado en la base de conocimiento.",
      "- **B.** Delegar la verificación al Design System.",
      "- **C.** Aceptar sin verificar y registrarlo como riesgo.", "",
      "## Propuesta o resolución", "**Respuesta (IA): verificar el contraste de la identidad base y registrar el resultado en la base de conocimiento (alternativa A).** Es una comprobación mecánica, que se puede hacer en cuanto se tengan los colores definidos.", "",
      "**Cómo funcionaría**", "",
      "1. Tomar el color principal, el secundario y los colores de texto de la identidad base del Producto.",
      "2. Medir la relación de contraste de cada combinación que se usa: 4.5:1 para texto y 3:1 para componentes (WCAG 2.2 AA).",
      "3. Registrar el resultado y las combinaciones que no cumplen, y corregir antes de que los Distribuidores la hereden.", "",
      "**Límites:** necesita los valores de color reales de la identidad base; hoy no están en la base de conocimiento.",
    ] },
];

const run = (script, args) => execFileSync("node", [script, ...args], { encoding: "utf8", env: Object.assign({}, process.env, { DESIGN_REF }) });
const resumen = [];
for (const c of CASOS) {
  const f = c.id.replace(/[^\w.-]+/g, "_");
  const candidatos = [path.join(S, "preguntas", "piloto", f + "-origen2.md"), path.join(S, "preguntas", "resp", f + "-origen2.md"), path.join(S, "preguntas", "lote", f + "-origen.md")];
  const baseF = candidatos.find(x => fs.existsSync(x));
  let base = fs.readFileSync(baseF, "utf8").replace("## Pregunta\n", "## Texto original del repo\n");
  const nombre = c.id + " · " + c.titulo;
  const props = { "Nombre": { title: [{ type: "text", text: { content: nombre } }] }, "Quién puede responder": { select: { name: c.quien } } };
  if (c.cierre) {
    props["Estado"] = { select: { name: "Decidida" } }; props["Respuesta"] = rt(c.cierre.resp); props["Decidido por"] = rt(c.cierre.por);
    props["Fecha de decisión"] = { date: { start: c.cierre.fecha } };
  }
  const mP = path.join(out, f + "-props.json"); fs.writeFileSync(mP, JSON.stringify({ id: c.id, title: nombre, props }, null, 1));
  const nuevo = path.join(out, f + "-origen2.md"), cuerpo2 = path.join(out, f + "-cuerpo2.md");
  fs.writeFileSync(nuevo, [AVISO, "", ...c.md.slice(2), "", "---", "", base].join("\n"));
  const rec = { id: c.id, nombre, cierre: !!c.cierre, base: path.basename(path.dirname(baseF)) };
  if (dry) { resumen.push(rec); continue; }
  try {
    const p = JSON.parse(run(SYNC, ["upsert", "--ds", DS_PREG, "--meta", mP, "--solo-props"]));
    const repoPath = JSON.parse(fs.readFileSync(path.join(S, "preguntas", "lote", f + "-meta.json"), "utf8")).props["Ruta en el repo"].rich_text[0].text.content;
    run(path.join(MOD, "scripts", "prepare-body.js"), [repoPath, nuevo, cuerpo2, WT, c.id]);
    run(SYNC, ["push", "--page", PAGE[c.id], "--body", cuerpo2, "--source", repoPath, "--loaded", hoy]);
    resumen.push(Object.assign(rec, { ok: true, props: p.soloProps }));
  } catch (e) { resumen.push(Object.assign(rec, { error: String(e.stderr || e.message).slice(0, 220) })); }
}
fs.writeFileSync(path.join(S, "preguntas", "contexto-resumen.json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length, dry }));
