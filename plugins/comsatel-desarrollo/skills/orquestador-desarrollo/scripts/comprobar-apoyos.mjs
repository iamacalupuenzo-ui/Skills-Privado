#!/usr/bin/env node
// Solo lectura. Comprueba dependencias en el destino instalado; no instala ni hace fallback silencioso.
// node comprobar-apoyos.mjs --route producto|ds|estatus [--root <directorio-de-skills>]
// Exit 0 READY; 2 BLOCKED; 1 configuración inválida.
import {existsSync,readFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const argv=process.argv.slice(2),value=(key,defaultValue)=>{const i=argv.indexOf(key);return i<0?defaultValue:argv[i+1]};
const route=value('--route','estatus'),root=resolve(value('--root',resolve(dirname(fileURLToPath(import.meta.url)),'../..')));
const routes={estatus:[],producto:['ux-a-desarrollo','angular-product-builder','flujo-producto','verificar-calidad'],ds:['flujo-ds','comsatel-design-system','verificar-calidad']};
if(!Object.hasOwn(routes,route)){console.error('Ruta inválida');process.exit(1)}
const required=['ux-ui-orchestrator',...routes[route]],optional=['angular-developer','angular-new-app','comsatel-design-system','orquestacion-multi-harness','product-orchestrator'].filter(n=>!required.includes(n));
const inspect=name=>{const file=join(root,name,'SKILL.md');if(!existsSync(file))return{name,available:false};const text=readFileSync(file,'utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');const fm=text.match(/^---\n([\s\S]*?)\n---/);return{name,available:!!fm&&new RegExp('^name: *'+name+' *$','m').test(fm[1])}};
const checked=required.map(inspect),supports=optional.map(inspect),missing=checked.filter(x=>!x.available).map(x=>x.name),optionalMissing=supports.filter(x=>!x.available).map(x=>x.name);
console.log(JSON.stringify({status:missing.length?'BLOCKED':'READY',route,root,required:checked,optional:supports,first_line:'Ruta: '+route+' | obligatorios faltantes: '+(missing.join(', ')||'ninguno')+' | apoyos opcionales faltantes: '+(optionalMissing.join(', ')||'ninguno')},null,2));
process.exitCode=missing.length?2:0;
