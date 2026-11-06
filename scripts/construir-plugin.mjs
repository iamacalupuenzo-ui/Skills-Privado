#!/usr/bin/env node
// Genera la copia instalable de un plugin a partir de skills/ y packs/.
//   node scripts/construir-plugin.mjs desarrollo
//   node scripts/construir-plugin.mjs ux
// La fuente única de los skills sigue siendo skills/<nombre>/. Esta copia vive en
// plugins/comsatel-<pack>/skills/ para que un marketplace pueda servirla desde git, y
// `npm test` regenera la copia en una carpeta temporal y falla si la publicada difiere.
// No toca plugin.json, hooks.json ni README.md: esos archivos se editan a mano.
//
// Qué se hace con cada skill:
//   1. Se le quita lo personal con scripts/preparar-publicacion.mjs (p. ej. notion/ de ux-ui-orchestrator).
//   2. No viajan evals/ ni __pycache__.
//   3. Se aplican REEMPLAZOS: rutas del repo (.claude/skills/...) que en un plugin no existen.
//      Si el texto de origen cambia y un reemplazo ya no aplica, el script falla en vez de callar.

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// [archivo dentro del skill, texto o expresión de origen, texto nuevo]
// En SKILL.md rige ${CLAUDE_SKILL_DIR} (la carpeta del propio skill); las referencias .md no
// se sustituyen, por eso allí va la indicación en prosa.
export const REEMPLAZOS = {
  'ux-ui-orchestrator': [
    ['SKILL.md', 'python .claude/skills/ux-ui-orchestrator/scripts/audit_ux.py knowledge-base',
      'python "${CLAUDE_SKILL_DIR}/scripts/audit_ux.py" knowledge-base'],
    ['SKILL.md', 'python .claude/skills/ux-development-handoff/validators/cli.py',
      'python "${CLAUDE_SKILL_DIR}/../ux-development-handoff/validators/cli.py"'],
    ['references/worktree-protocol.md', /^- \*\*Verificación previa:\*\*.*$/m,
      '- **Verificación previa:** además de `git status --short`, comprueba que el worktree contiene `knowledge-base/design/`. Los skills y los validadores vienen con el plugin (no están en el worktree): ejecuta los validadores con la ruta del skill `ux-development-handoff`, carpeta hermana de `ux-ui-orchestrator`, y no los copies al worktree.'],
  ],
};

function skillsDelPack(packFile) {
  const skills = [];
  let dentro = false;
  for (const l of readFileSync(packFile, 'utf8').replace(/\r\n/g, '\n').split('\n')) {
    if (/^skills:\s*$/.test(l)) { dentro = true; continue; }
    if (dentro && /^\S/.test(l) && !l.startsWith('- ')) dentro = false;
    const m = dentro && l.match(/^- name:\s*(\S+)/);
    if (m) skills.push(m[1]);
  }
  return skills;
}

// Escribe en `plugin` las carpetas skills/ y pack.yaml. Lanza un error si algo no cuadra.
export function generar(pack, plugin) {
  const packFile = join(root, 'packs', pack, 'pack.yaml');
  if (!existsSync(packFile)) throw new Error(`No existe packs/${pack}/pack.yaml`);
  const skills = skillsDelPack(packFile);
  if (!skills.length) throw new Error(`packs/${pack}/pack.yaml no declara skills`);

  const tmp = mkdtempSync(join(tmpdir(), 'plugin-'));
  try {
    const r = spawnSync(process.execPath, [join(root, 'scripts', 'preparar-publicacion.mjs'), '--out', tmp, ...skills], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`preparar-publicacion falló:\n${r.stdout}${r.stderr}`);

    const destino = join(plugin, 'skills');
    rmSync(destino, { recursive: true, force: true });
    mkdirSync(destino, { recursive: true });
    for (const name of skills) {
      cpSync(join(tmp, name), join(destino, name), {
        recursive: true,
        filter: (src) => !/[\\/](evals|__pycache__)([\\/]|$)/.test(src) && !src.endsWith('.pyc'),
      });
      for (const [archivo, de, a] of REEMPLAZOS[name] || []) {
        const f = join(destino, name, archivo);
        const texto = readFileSync(f, 'utf8');
        const aplica = typeof de === 'string' ? texto.includes(de) : de.test(texto);
        if (!aplica) throw new Error(`${name}/${archivo}: el texto a reemplazar ya no existe (${de}); revisa REEMPLAZOS en scripts/construir-plugin.mjs`);
        writeFileSync(f, typeof de === 'string' ? texto.split(de).join(a) : texto.replace(de, () => a));
      }
    }
    mkdirSync(plugin, { recursive: true });
    cpSync(packFile, join(plugin, 'pack.yaml'));
    return skills;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// Ejecución por línea de comandos (no al importar el módulo desde el validador).
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const pack = process.argv[2];
  if (!pack) { console.error('Uso: node scripts/construir-plugin.mjs <pack>   (desarrollo | ux)'); process.exit(1); }
  const plugin = join(root, 'plugins', `comsatel-${pack}`);
  if (!existsSync(join(plugin, '.claude-plugin', 'plugin.json'))) {
    console.error(`Falta plugins/comsatel-${pack}/.claude-plugin/plugin.json (se escribe a mano)`);
    process.exit(1);
  }
  try {
    const skills = generar(pack, plugin);
    console.log(`plugins/comsatel-${pack}: ${skills.length} skills copiados (${skills.join(', ')}) y pack.yaml`);
  } catch (e) {
    console.error('ERROR  ' + e.message);
    process.exit(1);
  }
}
