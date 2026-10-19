#!/usr/bin/env node
// Pruebas del guardia: cada caso envía un evento PreToolUse y comprueba la decisión.
// Uso: node probar-guardia.mjs   (sale con código 1 si algún caso falla)
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const guardia = join(dirname(fileURLToPath(import.meta.url)), 'guardia-gitlab.mjs');
const cwdSeguro = process.env.TEMP || process.cwd(); // una carpeta que no es repo: la rama actual queda vacía

// [esperado, comando]  esperado: deny | ask | allow
const casos = [
  // Se bloquean
  ['deny', 'curl -X PUT -H "PRIVATE-TOKEN: $t" https://project.comsatel.com.pe/api/v4/projects/9/merge_requests/12/merge'],
  ['deny', 'Invoke-RestMethod -Method Put -Uri "$b/projects/9/merge_requests/3/merge" -Headers $h'],
  ['deny', 'glab mr merge 12'],
  ['deny', 'git tag ds-v1.9.2'],
  ['deny', 'git tag -a ds-v1.9.2 -m "release"'],
  ['deny', 'git push origin ds-v1.9.2 --tags'],
  ['deny', 'git push origin refs/tags/ds-v1.9.2'],
  ['deny', 'curl -X POST https://project.comsatel.com.pe/api/v4/projects/9/repository/tags -d tag_name=ds-v1.9.2'],
  ['deny', 'npm publish'],
  ['deny', 'git push origin develop'],
  ['deny', 'git push origin HEAD:main'],
  ['deny', 'git push origin feature/x:release'],
  ['deny', 'git push --force origin feature/x'],
  ['deny', 'git push -f'],
  ['deny', 'git push origin +feature/x'],
  ['deny', 'git push --delete origin feature/x'],
  ['deny', 'git -C "D:\\repo" push origin main'],
  ['deny', 'echo $GITLAB_TOKEN'],
  ['deny', 'Write-Host $env:GITLAB_TOKEN'],
  ['deny', 'printenv GITLAB_TOKEN'],
  ['deny', 'curl -H "PRIVATE-TOKEN: glpat-abcdefghijklmnopqrst" https://x/api/v4/user'],
  // Piden confirmación
  ['ask', 'git push -u origin feature/mejora-mapa'],
  ['ask', 'git -c credential.helper= push origin feature/ds-1-9-3'],
  ['ask', 'curl -X POST -H "PRIVATE-TOKEN: $t" --data-binary @mr.json https://project.comsatel.com.pe/api/v4/projects/9/merge_requests'],
  // Pasan sin ruido
  ['allow', 'git push --dry-run origin feature/x'],
  ['allow', 'git push -n origin develop'],
  ['allow', 'git tag --list'],
  ['allow', 'git tag'],
  ['allow', 'git status'],
  ['allow', 'git fetch origin'],
  ['allow', 'git log --oneline -5'],
  ['allow', 'curl -s -H "PRIVATE-TOKEN: $t" https://project.comsatel.com.pe/api/v4/user'],
  ['allow', 'curl -s -H "PRIVATE-TOKEN: $t" https://project.comsatel.com.pe/api/v4/projects/9/merge_requests?state=opened'],
  ['allow', 'npm run build'],
  ['allow', '$t=[Environment]::GetEnvironmentVariable("GITLAB_TOKEN","User"); "Guardado, longitud: $($t.Length)"'],
  // El texto de un mensaje de commit no es un comando
  ['allow', 'git commit -m "bloquea npm publish y git tag ds-v1"'],
  ['allow', "git commit -q -F - <<'EOF'\nfeat: bloquea npm publish, git tag y merge_requests/1/merge\nEOF"],
  // Un remoto que no es de Comsatel (el repo de skills en GitHub) no usa la protección de GitLab
  ['ask', 'git push origin main', 'D:\\Investigacion\\Skills\\Skils'],
  ['ask', 'cd "/d/Investigacion/Skills/Skils" && git push origin main'],
  // Un repo de Comsatel sí tiene ramas protegidas, aunque el comando haga cd
  ['deny', 'cd "D:/0001 - Proyectos Generales/01 - Proyectos Trabajo/web-flotas" && git push origin develop', 'D:\\0001 - Proyectos Generales\\01 - Proyectos Trabajo'],
];

function decision(cmd, tool = 'Bash', cwd = cwdSeguro) {
  const r = spawnSync('node', [guardia], {
    input: JSON.stringify({ tool_name: tool, tool_input: { command: cmd }, cwd }),
    encoding: 'utf8',
  });
  if (r.status === 2) return { tipo: 'deny', texto: r.stderr };
  if (r.stdout.includes('"permissionDecision":"ask"')) return { tipo: 'ask', texto: r.stdout };
  return { tipo: 'allow', texto: '' };
}

let fallos = 0;
for (const [esperado, cmd, cwd] of casos) {
  if (cwd && !existsSync(cwd)) { console.log(`OMITE  ${cmd.slice(0, 60)} (no existe ${cwd})`); continue; }
  const { tipo, texto } = decision(cmd, 'Bash', cwd);
  const ok = tipo === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK   ' : 'FALLA'} esperado=${esperado} obtenido=${tipo}  ${cmd.slice(0, 90)}`);
  if (ok && tipo !== 'allow' && !/Motivo:/.test(texto)) { fallos++; console.log('FALLA  el bloqueo no explica el motivo'); }
}
// Herramientas que no son de comandos no deben afectarse.
const otra = spawnSync('node', [guardia], { input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'x' } }), encoding: 'utf8' });
if (otra.status !== 0) { fallos++; console.log('FALLA  Read no debería evaluarse'); }
const ps = decision('git push origin develop', 'PowerShell');
if (ps.tipo !== 'deny') { fallos++; console.log('FALLA  PowerShell debería evaluarse igual'); }

console.log(`\n${casos.length + 2} casos, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
