// Revisión de las preguntas con señal de cierre en su texto (2026-10-16). Transcribe el estado que declara la fuente; no decide nada nuevo.
// Uso: node revision-estados.js [--dry-run]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const SYNC = process.env.NOTION_SYNC || require("path").resolve(MOD, CFG.sync);
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b";
const dry = process.argv.includes("--dry-run");
const out = path.join(S, "preguntas", "revision");
fs.mkdirSync(out, { recursive: true });
const rt = s => ({ rich_text: [{ type: "text", text: { content: s } }] });

const CASOS = [
  { id: "UXR-006-Q7", estado: "Decidida", fecha: "2026-10-08", por: "Product Owner (DH-74); estado transcrito de UXR-006",
    resp: "[UXR-006 · cerrada 2026-10-08] Para el piloto la identidad base se precarga; su mantenimiento queda en HU-01-16 y HU-01-09 AC-11 tiene prueba parcial (DH-74; HU-01-09-Q12). El alta puede informar la herencia de una identidad base ya cargada." },
  { id: "UXR-018-Q1", estado: "Decidida", fecha: "2026-10-08", por: "Product Owner (DH-70, BR-290); estado transcrito de UXR-018 y DUD-001 E-1",
    resp: "[UXR-018 · cerrada 2026-10-08] Sí: el formulario de BackOffice muestra la identidad vigente del Distribuidor según el dominio, propia o heredada del Producto; los cambios se reflejan desde ese momento (HU-01-09 AC-15; BR-290; DH-70). Resuelta a favor del PO frente a la alternativa de marca neutral (DUD-001 E-1)." },
  { id: "UXR-024-Q1", estado: "Decidida", fecha: "2026-10-08", por: "Product Owner (DH-70, BR-290); estado transcrito de UXR-024 y DUD-001 E-1",
    resp: "[UXR-024 · cerrada 2026-10-08] En el formulario Web bajo el dominio del Distribuidor se muestra la identidad vigente del Distribuidor, propia o heredada del Producto (HU-01-09 AC-15; BR-290; DH-70). La marca se resuelve por dominio y no por el usuario escrito." },
  { id: "HU-02-01-Q5", estado: "Abierta", fecha: "2026-10-08", por: "Product Owner (DH-68) para el Distribuidor; el staff sigue abierto en ARQ-08",
    resp: "[HU-02-01 · cerrada parcialmente 2026-10-08] Para los usuarios del Distribuidor, el 2FA lo activa su administrador (DH-68; BR-243). Para el staff la definición permanece en ARQ-08. La UI no ofrece activación voluntaria." },
  { id: "UXR-001-Q1", estado: "Descartada", fecha: "2026-10-06", por: "Reformulada en UXR-001-Q4 según el repo; pendiente de confirmar por Enzo",
    resp: "[UXR-001 · reformulada 2026-10-06] Esta pregunta quedó reemplazada por UXR-001-Q4 (la opción no se muestra a quien no tiene visibilidad del módulo). Ver esa pregunta.", equivale: "UXR-001-Q4" },
];

const run = args => execFileSync("node", [SYNC, ...args], { encoding: "utf8" });
const resumen = [];
for (const c of CASOS) {
  const mP = path.join(out, c.id + "-props.json");
  fs.writeFileSync(mP, JSON.stringify({ id: c.id, title: c.id, props: {
    "Estado": { select: { name: c.estado } }, "Respuesta": rt(c.resp), "Decidido por": rt(c.por), "Fecha de decisión": { date: { start: c.fecha } },
  } }, null, 1));
  if (dry) { resumen.push({ id: c.id, estado: c.estado, equivale: c.equivale || null, dry: true }); continue; }
  try {
    const p = JSON.parse(run(["upsert", "--ds", DS_PREG, "--meta", mP, "--solo-props"]));
    let r = null;
    if (c.equivale) {
      const mR = path.join(out, c.id + "-rel.json");
      fs.writeFileSync(mR, JSON.stringify({ id: c.id, title: c.id, relations: { "Equivale a": { ds: DS_PREG, ids: [c.equivale] } } }, null, 1));
      r = JSON.parse(run(["upsert", "--ds", DS_PREG, "--meta", mR, "--solo-relaciones"]));
    }
    resumen.push({ id: c.id, ok: p.ok && (!r || r.ok), props: p.soloProps, relacion: r ? r.ok : null });
  } catch (e) { resumen.push({ id: c.id, error: String(e.stderr || e.message).slice(0, 200) }); }
}
fs.writeFileSync(path.join(S, "preguntas", "revision-resumen.json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length, dry }));
