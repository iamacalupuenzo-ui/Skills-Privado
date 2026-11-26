#!/usr/bin/env node
// Valida la pertenencia de un paquete en Notion (solo lee). Jerarquía: Proyecto → Producto → Paquete → Historia;
// las tareas llevan Proyecto y Producto. Lo corre cambios-kb.mjs después de la carga, en el paso 0.
//
//   node validar-relaciones.js DSP-009 --kb <clon de la KB> [--ref origin/develop]
//
// Comprueba:
//   1. el paquete tiene un Producto y ese producto un Proyecto;
//   2. las historias de la KB («Historias incluidas») y las relacionadas en Notion son las mismas;
//   3. cada historia lleva el Producto del paquete y el Catálogo de Flotas;
//   4. cada tarea del paquete lleva el Proyecto y el Producto del paquete, y las subtareas su Tarea padre;
//   5. la página del paquete tiene sus vistas «Historias del paquete» y «Tareas del paquete».
// Lo que no cuadra sale en `hallazgos`; cuando la corrección depende de Enzo, con `opciones` para preguntarle.
// Código de salida: 0 todo cuadra, 3 hay hallazgos, 1 error.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const DS = { historias: "4951a7d0-6388-820e-8c76-87b77818bc9f", paquetes: "66f1a7d0-6388-83f8-881b-0758134faa78",
  productos: "8f11a7d0-6388-83aa-8575-07f48d4cdc91", tareas: "87a1a7d0-6388-82a0-82c0-8709ea959111" };
const CATALOGO = "RCP-001 CL2 Flotas";
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const dsp = process.argv[2];
const KB = arg("--kb", process.env.NOTION_WORKTREE);
const REF = arg("--ref", "origin/develop");
if (!/^DSP-\d{3}$/.test(dsp || "") || !KB) { console.error("uso: node validar-relaciones.js DSP-NNN --kb <clon de la KB>"); process.exit(2); }
const git = (...a) => execFileSync("git", ["-C", KB, ...a], { encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] });

function token() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN.trim();
  const f = path.join(os.homedir(), ".notion", "token.txt");
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8").split(/\r?\n/)[0].trim() : "";
}
async function api(method, url, body) {
  const r = await fetch("https://api.notion.com/v1" + url, { method, body: body && JSON.stringify(body),
    headers: { Authorization: "Bearer " + token(), "Notion-Version": "2026-03-11", "Content-Type": "application/json" } });
  if (!r.ok) throw new Error(method + " " + url + " -> " + r.status);
  return r.json();
}
async function consulta(ds, filter) {
  const todas = []; let cursor;
  do {
    const r = await api("POST", "/data_sources/" + ds + "/query", Object.assign({ page_size: 100 }, filter ? { filter } : {}, cursor ? { start_cursor: cursor } : {}));
    todas.push(...(r.results || [])); cursor = r.has_more ? r.next_cursor : null;
  } while (cursor);
  return todas;
}
// Al leer una página, Notion recorta las relaciones a 25: se lee la propiedad completa.
async function relacion(pagina, prop) {
  const p = pagina.properties[prop]; if (!p) return [];
  if (!p.has_more) return (p.relation || []).map(x => x.id);
  const ids = []; let cursor;
  do {
    const r = await api("GET", "/pages/" + pagina.id + "/properties/" + encodeURIComponent(p.id) + (cursor ? "?start_cursor=" + cursor : ""));
    for (const x of r.results || []) if (x.relation) ids.push(x.relation.id);
    cursor = r.has_more ? r.next_cursor : null;
  } while (cursor);
  return ids;
}
const texto = (p, prop) => { const v = p.properties[prop]; if (!v) return ""; return (v.title || v.rich_text || []).map(x => x.plain_text).join("") || v.select?.name || ""; };
const nombre = p => texto(p, "Nombre") || (Object.values(p.properties).find(v => v.type === "title")?.title || []).map(x => x.plain_text).join("");
const mismo = (a, b) => a.length === b.length && a.every(x => b.includes(x));

(async () => {
  const hallazgos = [], bien = [];
  const productos = await consulta(DS.productos);
  const nomProd = id => nombre(productos.find(p => p.id === id) || { properties: {} }) || id;
  const opcionesProducto = await Promise.all(productos.map(async p => ({ id: p.id, producto: nombre(p),
    proyecto: (await Promise.all((p.properties.Proyecto?.relation || []).map(async r => nombre(await api("GET", "/pages/" + r.id))))).join(", ") || "(sin proyecto)" })));

  // 1. Paquete → Producto → Proyecto
  const pag = (await consulta(DS.paquetes, { property: "ID", rich_text: { equals: dsp } }))[0];
  if (!pag) { console.log(JSON.stringify({ paquete: dsp, error: "el paquete no está en Notion" })); process.exit(1); }
  const prodPaq = await relacion(pag, "Producto");
  let producto = null, proyecto = null;
  if (prodPaq.length !== 1) hallazgos.push({ tipo: "paquete-producto", que: `${dsp} tiene ${prodPaq.length} productos; debe tener uno.`, pregunta: `¿A qué producto pertenece ${dsp}?`, opciones: opcionesProducto });
  else {
    producto = prodPaq[0];
    const p = productos.find(x => x.id === producto);
    const proy = p ? (p.properties.Proyecto?.relation || []).map(r => r.id) : [];
    if (proy.length !== 1) hallazgos.push({ tipo: "producto-proyecto", que: `El producto «${nomProd(producto)}» tiene ${proy.length} proyectos; debe tener uno.`, pregunta: `¿A qué proyecto pertenece «${nomProd(producto)}»?`, opciones: [...new Set(opcionesProducto.map(o => o.proyecto))].map(proyecto => ({ proyecto })) });
    else { proyecto = proy[0]; bien.push(`${dsp} → producto «${nomProd(producto)}» → proyecto «${opcionesProducto.find(o => o.id === producto).proyecto}»`); }
  }

  // 2 y 3. Historias: KB contra Notion, y su producto
  const ruta = git("ls-tree", "--name-only", REF, "requirements/scope-packs/").split("\n").find(f => path.basename(f).startsWith(dsp + "-"));
  const seccion = (git("show", REF + ":" + ruta).replace(/\r\n/g, "\n").split(/^## Historias incluidas/m)[1] || "").split(/^## /m)[0];
  const enKb = [...new Set([...seccion.matchAll(/^\|\s*\[[^\]]*?\b(HU-\d+-\d+)[^\]]*\]\(/gm)].map(m => m[1]))];
  const relHist = await consulta(DS.historias, { property: "Paquetes de alcance", relation: { contains: pag.id } });
  const enNotion = relHist.map(h => texto(h, "ID"));
  for (const id of enKb.filter(x => !enNotion.includes(x))) hallazgos.push({ tipo: "historia-sin-relacion", que: `${id} está en la KB del paquete pero no se relaciona con ${dsp} en Notion.`, arreglo: "cargar-paquete.js la relaciona" });
  for (const h of relHist.filter(h => !enKb.includes(texto(h, "ID")))) hallazgos.push({ tipo: "historia-de-mas", que: `${texto(h, "ID")} se relaciona con ${dsp} en Notion pero no está en «Historias incluidas» de la KB.`, pregunta: `¿${texto(h, "ID")} sigue en ${dsp}?`, opciones: [{ opcion: "Quitar la relación" }, { opcion: "Mantenerla: falta en la KB" }] });
  for (const h of relHist.filter(h => enKb.includes(texto(h, "ID")))) {
    const prod = await relacion(h, "Producto");
    if (producto && !mismo(prod, [producto])) hallazgos.push({ tipo: "historia-producto", que: `${texto(h, "ID")} está en «${prod.map(nomProd).join(", ") || "sin producto"}» y su paquete en «${nomProd(producto)}».`, pregunta: `¿A qué producto pertenece ${texto(h, "ID")}?`, opciones: [...new Set([producto, ...prod])].map(id => opcionesProducto.find(o => o.id === id) || { id }) });
    if (texto(h, "Catálogo") !== CATALOGO) hallazgos.push({ tipo: "historia-catalogo", que: `${texto(h, "ID")} tiene Catálogo «${texto(h, "Catálogo") || "vacío"}».`, arreglo: "cargar-paquete.js pone el Catálogo de Flotas" });
  }
  if (!hallazgos.some(x => x.tipo.startsWith("historia"))) bien.push(`${relHist.length} historias relacionadas, las mismas de la KB (${enKb.join(", ")}), con el producto del paquete`);

  // 4. Tareas: Proyecto, Producto y Tarea padre
  const tareas = await consulta(DS.tareas, { property: "Paquetes de alcance", relation: { contains: pag.id } });
  let tareasMal = 0;
  for (const t of tareas) {
    const prod = await relacion(t, "Producto"), proy = await relacion(t, "Proyecto");
    const falta = [];
    if (producto && !mismo(prod, [producto])) falta.push(`Producto «${prod.map(nomProd).join(", ") || "vacío"}»`);
    if (proyecto && !mismo(proy, [proyecto])) falta.push(`Proyecto ${proy.length ? "distinto" : "vacío"}`);
    const esMadre = !/ · \d+/.test(nombre(t));
    if (!esMadre && !(await relacion(t, "Tarea padre")).length) falta.push("sin Tarea padre");
    if (falta.length) { tareasMal++; hallazgos.push({ tipo: "tarea", que: `«${nombre(t).slice(0, 60)}»: ${falta.join(", ")}.`, arreglo: "em-gestion-tareas (AJUSTAR) con el Proyecto y el Producto del paquete" }); }
  }
  if (!tareasMal) bien.push(`${tareas.length} tareas con el proyecto y el producto del paquete, y cada subtarea con su madre`);

  // 5. Vistas de la página del paquete
  const md = (await api("GET", "/pages/" + pag.id + "/markdown")).markdown || "";
  const vistas = md.match(/<database [^>]*>/g) || [];
  const tiene = ds => vistas.some(v => v.includes(ds));
  const faltan = [!tiene(DS.historias) && "Historias del paquete", !tiene(DS.tareas) && "Tareas del paquete"].filter(Boolean);
  if (faltan.length) hallazgos.push({ tipo: "vistas", que: `A la página de ${dsp} le faltan las vistas: ${faltan.join(", ")}.`, arreglo: "em-gestion-tareas, references/pagina-del-paquete.md" });
  else if (!md.trimStart().startsWith("<database")) hallazgos.push({ tipo: "vistas", que: `Las vistas de ${dsp} no están arriba de la página.`, arreglo: "cargar-paquete.js las sube" });
  else bien.push("la página del paquete tiene sus dos vistas arriba");

  const fin = { paquete: dsp, ok: !hallazgos.length, bien, hallazgos };
  console.log(JSON.stringify(fin));
  process.exit(hallazgos.length ? 3 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
