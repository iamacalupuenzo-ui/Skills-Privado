// SOLO VALIDACIÓN LOCAL DE UX (DSP-009). Va delante del mock BFF de cada Shell y simula las rutas que el mock no tiene:
// - Web Cliente: /api/customer/branding (US268) y /api/branding; agrega WEB_CUSTOMER_VISUAL_IDENTITY al menú.
// - BackOffice: /api/product/branding (US269) y /access; agrega BO_PRODUCT_VISUAL_IDENTITY al menú del staff.
// Todo lo demás pasa al mock original. Uso: node proxy.mjs <cliente|backoffice> <puertoEscucha> <puertoMock>
import http from 'node:http';

const [modo, escucha, destino] = process.argv.slice(2);
const svg = (t, c) => `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><rect width="240" height="80" rx="8" fill="${c}"/><text x="120" y="50" font-family="Arial" font-size="22" fill="#fff" text-anchor="middle">${t}</text></svg>`;
const LOGOS = { distribuidor: ['Distribuidor', '#1b4079'], cliente: ['Cliente propio', '#7a2e0e'], producto: ['C-Flotas', '#101828'], 'producto-nuevo': ['Producto nuevo', '#344054'] };

const leer = (req) => new Promise((ok) => { const b = []; req.on('data', (d) => b.push(d)); req.on('end', () => ok(Buffer.concat(b))); });
const json = (res, status, body, etag) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...(etag ? { ETag: etag } : {}) });
  res.end(JSON.stringify(body));
};

// ---- Cliente ----
const inh = (value, from) => ({ value, origin: 'INHERITED', inheritedFrom: from });
const heredadaCliente = () => ({
  logo: inh('/api/mock-logos/distribuidor.svg', 'DISTRIBUTOR'), primaryColor: inh('#1B4079', 'DISTRIBUTOR'),
  secondaryColor: inh('#F79009', 'PRODUCT'), displayName: inh('Transportes Andinos', 'DISTRIBUTOR'), hasOwnIdentity: false, tokens: {},
});
const cli = { state: heredadaCliente(), v: 1 };

// ---- Producto ----
const prod = { v: 1, state: { logoUrl: '/api/mock-logos/producto.svg', primaryColor: '#1B4079', secondaryColor: '#153565', displayName: 'CL2 Flotas', tokens: {}, inheritance: { distributors: 12 } } };

async function simular(req, res, path) {
  const m = req.method;
  const logo = path.match(/^\/api\/mock-logos\/([a-z-]+)\.svg$/);
  if (logo) { const [t, c] = LOGOS[logo[1]] ?? ['Logo', '#344054']; res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); res.end(svg(t, c)); return true; }

  if (modo === 'cliente') {
    if (path === '/api/branding' && m === 'GET') { const s = cli.state; json(res, 200, { name: s.displayName.value, tokens: {}, logoUrl: s.logo.value, isotypeUrl: null }); return true; }
    if (path === '/api/customer/branding/logo-uploads' && m === 'POST') { await leer(req); json(res, 201, { uploadId: 'up-cli' }); return true; }
    if (path === '/api/customer/branding') {
      const etag = () => `W/"v${cli.v}"`;
      if (m === 'GET') { json(res, 200, cli.state, etag()); return true; }
      if (m === 'DELETE') { cli.state = heredadaCliente(); cli.v++; json(res, 200, cli.state, etag()); return true; }
      if (m === 'PUT') {
        const p = JSON.parse((await leer(req)).toString() || '{}'); const s = cli.state; const base = heredadaCliente();
        const set = (k, val) => { if (val === undefined) return; s[k] = val === null ? base[k] : { value: val, origin: 'OWN', inheritedValue: base[k].value }; };
        set('primaryColor', p.primaryColor); set('secondaryColor', p.secondaryColor); set('displayName', p.displayName);
        if (p.logoUploadId !== undefined) s.logo = p.logoUploadId === null ? base.logo : { value: '/api/mock-logos/cliente.svg', origin: 'OWN', inheritedValue: base.logo.value };
        s.hasOwnIdentity = ['logo', 'primaryColor', 'secondaryColor', 'displayName'].some((k) => s[k].origin === 'OWN'); cli.v++;
        json(res, 200, s, etag()); return true;
      }
    }
  }
  if (modo === 'backoffice') {
    if (path === '/api/product/branding/access' && m === 'GET') { json(res, 200, { read: true, write: true }); return true; }
    if (path === '/api/product/branding/logo-uploads' && m === 'POST') { await leer(req); json(res, 201, { uploadId: 'up-prod' }); return true; }
    if (path === '/api/product/branding') {
      const etag = () => `W/"v${prod.v}"`;
      if (m === 'GET') { json(res, 200, prod.state, etag()); return true; }
      if (m === 'PUT') {
        const p = JSON.parse((await leer(req)).toString() || '{}'); const s = prod.state;
        for (const k of ['primaryColor', 'secondaryColor', 'displayName']) if (p[k] !== undefined) s[k] = p[k];
        if (p.logoUploadId) s.logoUrl = '/api/mock-logos/producto-nuevo.svg';
        prod.v++; json(res, 200, s, etag()); return true;
      }
    }
  }
  return false;
}

http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  try { if (await simular(req, res, path)) return; } catch (e) { json(res, 500, { title: String(e) }); return; }
  const cuerpo = await leer(req);
  const up = http.request({ host: '127.0.0.1', port: Number(destino), path: req.url, method: req.method, headers: req.headers }, async (r) => {
    if (path === '/api/session' && r.statusCode === 200) {
      const j = JSON.parse((await leer(r)).toString());
      j.menu = j.menu ?? [];
      if (modo === 'cliente') j.menu.push({ feature: 'WEB_CUSTOMER_VISUAL_IDENTITY', label: 'Identidad visual' });
      if (modo === 'backoffice' && j.population === 'staff') j.menu.push({ feature: 'BO_PRODUCT_VISUAL_IDENTITY', label: 'Identidad visual del Producto', group: 'Plataforma' });
      const h = { ...r.headers }; delete h['content-length']; delete h['transfer-encoding'];
      res.writeHead(200, h); res.end(JSON.stringify(j)); return;
    }
    res.writeHead(r.statusCode, r.headers); r.pipe(res);
  });
  up.on('error', (e) => json(res, 502, { title: String(e) }));
  up.end(cuerpo);
}).listen(Number(escucha), () => console.log(`proxy ${modo} en :${escucha} -> mock :${destino}`));
