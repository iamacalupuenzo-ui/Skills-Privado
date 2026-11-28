// Solo los cargadores verificados usan este módulo; la conciliación nunca escribe huellas.
const fs = require('node:fs');
function registrarDocumento(cfg, snapshot, id, textoCargado) {
  const d = snapshot.documentos.find(d => d.id === id);
  if (!d || d.texto.trim() !== textoCargado.trim()) return false;
  const h = fs.existsSync(cfg.huella) ? JSON.parse(fs.readFileSync(cfg.huella, 'utf8')) : { version: 1, preguntas: {} };
  h.documentos ||= {};
  h.documentos[id] = { fingerprint: d.fingerprint, sourceHashes: d.sourceHashes, commit: snapshot.commit, ref: snapshot.ref, cargado: new Date().toISOString() };
  fs.mkdirSync(require('node:path').dirname(cfg.huella), { recursive: true });
  fs.writeFileSync(cfg.huella + '.tmp', JSON.stringify(h, null, 2)); fs.renameSync(cfg.huella + '.tmp', cfg.huella);
  return true;
}
module.exports = { registrarDocumento };
