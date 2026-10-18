#!/usr/bin/env node
// Sube el cuerpo (Markdown) de un archivo del repo a una página de Notion sin pasar por ningún modelo.
//
//   node notion-sync.js push   --page <id> --body <archivo.md> --source "<ruta en el repo>" [--loaded 2026-10-16] [--dry-run]
//   node notion-sync.js verify --page <id> --body <archivo.md>
//
// Token: variable NOTION_TOKEN o primera línea del archivo %USERPROFILE%\.notion\token.txt (nunca se imprime).
// Versión de API: NOTION_VERSION (por defecto 2025-09-03).
const fs = require("fs");
const os = require("os");
const path = require("path");

const args = Object.fromEntries(process.argv.slice(3).reduce((acc, a, i, arr) => {
  if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true]);
  return acc;
}, []));
const cmd = process.argv[2];

function token() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN.trim();
  for (const name of ["token.txt", "token.txt.txt", "token"]) {
    const f = path.join(os.homedir(), ".notion", name);
    if (fs.existsSync(f)) return fs.readFileSync(f, "utf8").split(/\r?\n/)[0].trim().replace(/^Bearer\s+/i, "");
  }
  console.error("Falta el token: define NOTION_TOKEN o crea " + path.join(os.homedir(), ".notion", "token.txt"));
  process.exit(3);
}

// GFM -> Markdown enriquecido de Notion: solo las tablas necesitan conversión.
function toEnhanced(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*```/.test(l)) { inCode = !inCode; out.push(l); continue; }
    if (!inCode && /^\|/.test(l) && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1] || "")) {
      const rows = [];
      let j = i;
      while (j < lines.length && /^\|/.test(lines[j])) { if (j !== i + 1) rows.push(lines[j]); j++; }
      const cells = r => r.replace(/^\|/, "").replace(/\|\s*$/, "").split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, "|"));
      // Si alguna fila tiene más celdas que el encabezado, se amplía la tabla para no perder contenido.
      const filas = rows.map(cells);
      const ancho = Math.max(...filas.map(f => f.length));
      out.push('<table header-row="true">');
      for (const f of filas) {
        out.push("<tr>");
        for (let k = 0; k < ancho; k++) out.push("<td>" + (f[k] || "") + "</td>");
        out.push("</tr>");
      }
      out.push("</table>");
      i = j - 1;
      continue;
    }
    out.push(l);
  }
  return out.join("\n");
}

async function api(method, url, body) {
  const res = await fetch("https://api.notion.com/v1" + url, {
    method,
    headers: {
      Authorization: "Bearer " + token(),
      "Notion-Version": process.env.NOTION_VERSION || "2025-09-03",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
  if (!res.ok) { console.error(JSON.stringify({ status: res.status, code: json.code, message: json.message })); process.exit(4); }
  return json;
}

function metrics(md) {
  const lines = md.split("\n");
  let inCode = false, headings = 0, tables = 0, prevTable = false;
  for (const l of lines) {
    if (/^\s*```/.test(l)) inCode = !inCode;
    if (!inCode && /^#{1,6}\s/.test(l)) headings++;
    const isTable = /^\|/.test(l) || /^<table/.test(l);
    if (isTable && !prevTable) tables++;
    prevTable = isTable || (prevTable && /^<\/?(tr|td|table)/.test(l));
    if (/^<\/table>/.test(l)) prevTable = false;
  }
  const links = (md.match(/\]\(https?:[^)\s]+\)/g) || []).length;
  const relative = (md.match(/\]\((?!https?:|mailto:|#)[^)\s]+\)/g) || []).length;
  return { headings, tables, links, relativeLinks: relative };
}

// Bloque opcional «En 30 segundos» (vive fuera del repo); se antepone al aviso de contenido generado.
function resumenPrefijo() {
  return args.summary && args.summary !== true ? fs.readFileSync(args.summary, "utf8").replace(/\r\n/g, "\n").trimEnd() + "\n" : "";
}

async function findPage(ds, idValue) {
  const r = await api("POST", "/data_sources/" + ds + "/query", { filter: { property: "ID", rich_text: { equals: idValue } }, page_size: 1 });
  return r.results && r.results[0] ? r.results[0].id : null;
}

// Crea o actualiza una fila por su ID y sube el cuerpo. meta = { id, title, props, relations }.
// relations: { "<propiedad>": { ds: "<data_source_id>", ids: ["HU-01-09", ...] } } -> se resuelven por la propiedad ID.
async function upsert() {
  const ds = args.ds, meta = JSON.parse(fs.readFileSync(args.meta, "utf8"));
  const props = Object.assign({}, meta.props || {});
  props["Nombre"] = { title: [{ type: "text", text: { content: meta.title } }] };
  props["ID"] = { rich_text: [{ type: "text", text: { content: meta.id } }] };
  const sinResolver = [];
  for (const [prop, rel] of Object.entries(meta.relations || {})) {
    const pages = [];
    for (const id of rel.ids || []) {
      const pid = await findPage(rel.ds, id);
      if (pid) pages.push({ id: pid }); else sinResolver.push(prop + ":" + id);
    }
    props[prop] = { relation: pages };
  }
  let page = await findPage(ds, meta.id), creada = false;
  if (args["solo-props"]) {
    // Actualiza solo las propiedades de meta.props; las de meta.ifEmpty se escriben únicamente si la fila las tiene vacías.
    if (!page) { console.log(JSON.stringify({ ok: false, id: meta.id, error: "la fila no existe" })); return; }
    const actual = await api("GET", "/pages/" + page), patch = {}, omitidas = [];
    const vacia = v => !v || (v.select === null) || (v.select === undefined && v.multi_select === undefined && v.rich_text === undefined) || (v.multi_select && !v.multi_select.length) || (v.rich_text && !v.rich_text.length);
    for (const [k, v] of Object.entries(meta.props || {})) {
      if ((meta.ifEmpty || []).includes(k) && !vacia(actual.properties[k])) { omitidas.push(k); continue; }
      // ifValues: { "<propiedad select>": ["valor", ...] } -> solo se escribe si está vacía o tiene uno de esos valores
      const cond = (meta.ifValues || {})[k];
      if (cond) { const cur = actual.properties[k], nombre = cur && cur.select && cur.select.name; if (nombre && !cond.includes(nombre)) { omitidas.push(k); continue; } }
      patch[k] = v;
    }
    if (Object.keys(patch).length) await api("PATCH", "/pages/" + page, { properties: patch });
    console.log(JSON.stringify({ ok: true, id: meta.id, page, soloProps: Object.keys(patch), omitidas }));
    return;
  }
  if (args["solo-relaciones"]) {
    // Segunda pasada segura: solo añade relaciones (unión con las que ya tiene la fila); no toca propiedades, título ni cuerpo.
    if (!page) { console.log(JSON.stringify({ ok: false, id: meta.id, error: "la fila no existe" })); return; }
    const actual = await api("GET", "/pages/" + page), rels = {};
    // Al leer la página, Notion recorta las relaciones a 25 elementos: se lee la propiedad completa, paginada.
    const relacionCompleta = async (prop) => {
      const pid = actual.properties[prop] && actual.properties[prop].id;
      if (!pid) return [];
      const todas = []; let cursor = null;
      do {
        const r = await api("GET", "/pages/" + page + "/properties/" + encodeURIComponent(pid) + (cursor ? "?start_cursor=" + cursor : ""));
        for (const x of r.results || []) if (x.relation) todas.push({ id: x.relation.id });
        cursor = r.has_more ? r.next_cursor : null;
      } while (cursor);
      return todas;
    };
    for (const prop of Object.keys(meta.relations || {})) {
      const previas = args.reemplazar ? [] : await relacionCompleta(prop);
      // --reemplazar: la lista pasa a ser exactamente la calculada (solo para relaciones que puso un script, nunca las editadas a mano)
      const union = args.reemplazar ? props[prop].relation
        : [...previas.map(x => ({ id: x.id })), ...props[prop].relation.filter(n => !previas.some(x => x.id === n.id))];
      rels[prop] = { relation: union };
    }
    await api("PATCH", "/pages/" + page, { properties: rels });
    console.log(JSON.stringify({ ok: true, id: meta.id, page, creada: false, sinResolver, soloRelaciones: true }));
    return;
  }
  if (page) {
    delete props["Estado del documento"]; // el estado lo cambia una persona
    await api("PATCH", "/pages/" + page, { properties: props });
  } else {
    const r = await api("POST", "/pages", { parent: { type: "data_source_id", data_source_id: ds }, properties: props });
    page = r.id; creada = true;
  }
  if (args.body) {
    const body = fs.readFileSync(args.body, "utf8");
    const src = args.source || "";
    const callout = "<callout>\n\tContenido generado desde el repositorio (GitLab). No se edita aquí: los cambios se hacen en el archivo del repo y se vuelven a cargar." +
      (args.loaded ? " Última carga: " + args.loaded + "." : "") + (src ? " Fuente: `" + src + "`" : "") + "\n</callout>\n";
    await api("PATCH", "/pages/" + page + "/markdown", { type: "replace_content", replace_content: { new_str: resumenPrefijo() + callout + toEnhanced(body) } });
  }
  console.log(JSON.stringify({ ok: true, id: meta.id, page, creada, sinResolver, esperado: args.body ? metrics(fs.readFileSync(args.body, "utf8")) : null }));
}

(async () => {
  if (cmd === "upsert") { await upsert(); return; }
  const page = args.page, bodyFile = args.body;
  if (!cmd || !page || !bodyFile) { console.error("uso: push|verify --page <id> --body <archivo>"); process.exit(2); }
  const body = fs.readFileSync(bodyFile, "utf8");

  if (cmd === "push") {
    const src = args.source || "";
    const callout = "<callout>\n\tContenido generado desde el repositorio (GitLab). No se edita aquí: los cambios se hacen en el archivo del repo y se vuelven a cargar." +
      (args.loaded ? " Última carga: " + args.loaded + "." : "") + (src ? " Fuente: `" + src + "`" : "") + "\n</callout>\n";
    const content = resumenPrefijo() + callout + toEnhanced(body);
    if (args["dry-run"]) { console.log(JSON.stringify({ dryRun: true, bytes: content.length, esperado: metrics(body) })); return; }
    await api("PATCH", "/pages/" + page + "/markdown", { type: "replace_content", replace_content: { new_str: content } });
    console.log(JSON.stringify({ ok: true, page, bytes: content.length, esperado: metrics(body) }));
  } else if (cmd === "verify") {
    const r = await api("GET", "/pages/" + page + "/markdown");
    const md = r.markdown || "";
    if (args.dump && args.dump !== true) fs.writeFileSync(args.dump, md);
    const got = metrics(md), exp = metrics(body);
    const ok = got.headings === exp.headings && got.tables === exp.tables && got.links >= exp.links && got.relativeLinks === 0;
    console.log(JSON.stringify({ ok, esperado: exp, notion: got, truncado: !!r.truncated }));
    process.exitCode = ok ? 0 : 1;
  } else { console.error("comando desconocido"); process.exit(2); }
})();
