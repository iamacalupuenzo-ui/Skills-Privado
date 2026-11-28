#!/usr/bin/env node
// Preview by default. --apply registers both guards; --settings targets a profile explicitly.
// Does not read/print secret fields; preserves unrelated hooks (including Orca).
import {copyFileSync,existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),args=process.argv.slice(2);
for(let i=0;i<args.length;i++){if(args[i]==='--settings'){if(!args[++i]||args[i].startsWith('--'))throw Error('Falta ruta de settings');}else if(!['--apply','--dry-run','--quitar'].includes(args[i]))throw Error('Opción desconocida: '+args[i]);}
if(args.includes('--apply')&&args.includes('--dry-run'))throw Error('Usa --apply o --dry-run');
const i=args.indexOf('--settings'),settings=resolve(i<0?join(homedir(),'.claude','settings.json'):args[i+1]);
const apply=args.includes('--apply'),remove=args.includes('--quitar');
const skills=resolve(here,'../..');
const sources=[join(here,'guardia-gitlab.mjs'),join(skills,'em-orquestador-ux','hooks','guardia-uxs.mjs'),join(skills,'em-orquestador-ux','scripts','audit_ux.py')];
if(!remove)for(const src of sources)if(!existsSync(src))throw Error('Falta dependencia: '+src);
const fingerprint=remove?'unused':createHash('sha256').update(Buffer.concat(sources.map(src=>readFileSync(src)))).digest('hex').slice(0,16);
const dest=join(dirname(settings),'hooks','comsatel-guardias',fingerprint);
const files=[
[join(here,'guardia-gitlab.mjs'),join(dest,'gitlab','guardia-gitlab.mjs')],
[join(skills,'em-orquestador-ux','hooks','guardia-uxs.mjs'),join(dest,'ux','hooks','guardia-uxs.mjs')],
[join(skills,'em-orquestador-ux','scripts','audit_ux.py'),join(dest,'ux','scripts','audit_ux.py')]];
if(!remove)for(const [src] of files)if(!existsSync(src))throw Error('Falta dependencia: '+src);
const before=existsSync(settings)?readFileSync(settings,'utf8'):null;
const config=before?JSON.parse(before.replace(/^\uFEFF/,'')):{};
config.hooks??={};config.hooks.PreToolUse??=[];
const owned=h=>/comsatel-guardia-gitlab|comsatel-guardias|guardia-gitlab\.mjs|guardia-uxs\.mjs/.test(String(h.command||''));
config.hooks.PreToolUse=config.hooks.PreToolUse.map(g=>({...g,hooks:(g.hooks||[]).filter(h=>!owned(h))})).filter(g=>g.hooks.length);
if(!remove)for(const file of [files[0][1],files[1][1]])config.hooks.PreToolUse.push({matcher:'Bash|PowerShell',hooks:[{type:'command',command:'node "'+file.replace(/\\/g,'/')+'"',timeout:file.includes('gitlab')?10:60}]});
if(!apply){console.log(JSON.stringify({mode:'preview',settings,operation:remove?'remove':'register',guards:remove?[]:['gitlab','uxs'],preserves_other_hooks:true,writes:0},null,2));process.exit(0);}
if(!remove)for(const [src,target]of files){mkdirSync(dirname(target),{recursive:true});copyFileSync(src,target);}
mkdirSync(dirname(settings),{recursive:true});const suffix=new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID();
const current=existsSync(settings)?readFileSync(settings,'utf8'):null;
if(current!==before)throw Error('La configuraci?n cambi? durante la preparaci?n; no se sobrescribe.');
if(before!==null)writeFileSync(settings+'.bak-'+suffix,before,'utf8');
const staged=settings+'.pending-'+suffix;writeFileSync(staged,JSON.stringify(config,null,2)+'\n','utf8');renameSync(staged,settings);
console.log(JSON.stringify({mode:'applied',settings,guards:remove?[]:['gitlab','uxs'],backup_created:before!==null,restart_session_required:true},null,2));
