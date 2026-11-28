// Todo registro de un plan tiene ID único y campos completos antes de una escritura.
function deduplicarPlan(registros) {
  const mapa = new Map();
  for (const r of registros) {
    if (!r || typeof r.id !== 'string' || !r.id.trim()) throw new Error('Plan con registro sin ID.');
    const revisar = (v, ruta) => {
      if (v === null || v === undefined) throw new Error('Plan incompleto en ' + ruta + '; no se puede declarar terminado.');
      if (typeof v === 'object') for (const [k, x] of Object.entries(v)) revisar(x, ruta + '.' + k);
    };
    revisar(r, r.id);
    if (mapa.has(r.id) && JSON.stringify(mapa.get(r.id)) !== JSON.stringify(r)) throw new Error(r.id + ': hay dos registros contradictorios; concilia antes de cargar.');
    mapa.set(r.id, r);
  }
  return [...mapa.values()];
}
module.exports = { deduplicarPlan };
