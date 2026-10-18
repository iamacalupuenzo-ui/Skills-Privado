// Registra los cierres de RCP-001 (develop) que el worktree aún no recoge: ARQ-08 (DH-85), ARQ-11.5 (DH-84), ARQ-10.1 (DH-65), ARQ-09.3 (DH-63/64) y HU-07-02-Q8.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const MOD = require("path").resolve(__dirname, /historico$/.test(__dirname) ? "../.." : "..");
const CFG = JSON.parse(require("fs").readFileSync(require("path").join(MOD, "config.json"), "utf8"));
const S = process.env.NOTION_TRABAJO || require("path").join(MOD, "trabajo").replace(/\\/g, "/");
const SYNC = CFG.sync;
const DS_PREG = "9811a7d0-6388-829a-82b4-0735e973e46b";
const dry = process.argv.includes("--dry-run");
const rt = s => ({ rich_text: [{ type: "text", text: { content: s } }] });
const CIERRES = [
  { id: "ARQ-08", resp: "[RCP-001 · ARQ-08 · DH-85, 2026-10-13] El 2FA es configurable y no obligatorio para todas las poblaciones, incluido el staff de Comsatel; cada administrador decide si lo activa para los usuarios de su nivel (BR-243).", por: "Interesados (PO y Arquitectura), según DH-85", fecha: "2026-10-13" },
  { id: "ARQ-11.5", resp: "[RCP-001 · ARQ-11.5 · DH-84, 2026-10-13] Todo ingreso es por Keycloak, también el de los usuarios del Distribuidor; se retira el login local de tenant-service. El BackOffice elige el login por el dominio de ingreso.", por: "Interesados (PO y Arquitectura), según DH-84", fecha: "2026-10-13" },
  { id: "ARQ-10.1", resp: "[RCP-001 · ARQ-10.1 · DH-65] Cerrada funcionalmente: el staff entra bajo el dominio del Distribuidor al que atiende, con su cuenta transversal y solo si ese Distribuidor pidió el soporte de Comsatel. Arquitectura debe definir cómo una cuenta transversal ingresa bajo el dominio de un tenant.", por: "Interesados (PO), según DH-65; la parte técnica sigue en Arquitectura", fecha: null },
  { id: "ARQ-09.3", resp: "[RCP-001 · ARQ-09.3 · DH-63 y DH-64] El alcance de ESAC lo delimitan los permisos del Rol, con acceso a la información de Unidades a demanda para el soporte; BR-133 (Grupos asignados temporalmente) sigue vigente. Arquitectura lo confirma (HU-07-02-Q8).", por: "Interesados (PO) y Arquitectura, según DH-63 y DH-64", fecha: null },
  { id: "HU-07-02-Q8", resp: "[RCP-001 · ARQ-09.3 · DH-63 y DH-64] Confirmada por Arquitectura: el alcance de ESAC lo delimitan los permisos del Rol, con acceso a la información de Unidades a demanda para el soporte.", por: "Arquitectura, según RCP-001 ARQ-09.3", fecha: null },
];
const out = path.join(S, "preguntas", "cierres-arq");
fs.mkdirSync(out, { recursive: true });
const resumen = [];
for (const c of CIERRES) {
  const props = { "Estado": { select: { name: "Decidida" } }, "Respuesta": rt(c.resp), "Decidido por": rt(c.por) };
  if (c.fecha) props["Fecha de decisión"] = { date: { start: c.fecha } };
  const f = path.join(out, c.id.replace(/[^\w.-]+/g, "_") + ".json");
  fs.writeFileSync(f, JSON.stringify({ id: c.id, title: c.id, props }, null, 1));
  if (dry) { resumen.push({ id: c.id, dry: true }); continue; }
  try { resumen.push(JSON.parse(execFileSync("node", [SYNC, "upsert", "--ds", DS_PREG, "--meta", f, "--solo-props"], { encoding: "utf8" }))); }
  catch (e) { resumen.push({ id: c.id, error: String(e.stderr || e.message).slice(0, 200) }); }
}
fs.writeFileSync(path.join(S, "preguntas", "cierres-arq-resumen.json"), JSON.stringify(resumen, null, 1));
console.log(JSON.stringify({ total: resumen.length, ok: resumen.filter(r => r.ok).length, errores: resumen.filter(r => r.error).length, dry }));
