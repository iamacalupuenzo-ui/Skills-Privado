#!/usr/bin/env node
// Pruebas del guardia: cada caso envía un evento PreToolUse y comprueba la decisión.
// Uso: node probar-guardia.mjs   (sale con código 1 si algún caso falla)
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
  ['deny', 'git push origin integration'],
  ['deny', 'curl -X POST --data-binary {"source_branch":"integration","target_branch":"develop"} https://project.comsatel.com.pe/api/v4/projects/9/merge_requests'],
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
  // Volcados completos y expresiones que PowerShell imprime implícitamente.
  ['deny', 'env'],
  ['deny', 'printenv'],
  ['deny', 'Get-ChildItem Env:'],
  ['deny', 'gci env:'],
  ['deny', '[Environment]::GetEnvironmentVariables()'],
  ['deny', '[System.Environment]::GetEnvironmentVariables()'],
  ['deny', '$env:GITLAB_TOKEN'],
  ['deny', '"$env:GITLAB_TOKEN"'],
  ['deny', '($env:GITLAB_TOKEN)'],
  ['deny', '$env:GITLAB_NPM_TOKEN | Out-String'],
  ['deny', '[Environment]::GetEnvironmentVariable("GITLAB_TOKEN", "User")'],
  ['allow', '$headers = @{"PRIVATE-TOKEN"=$env:GITLAB_TOKEN}; Invoke-RestMethod -Uri "https://x/api/v4/user" -Headers $headers'],
  ['allow', 'git commit -m "bloquea Get-ChildItem Env: y env"'],
  // Piden confirmación
  ['ask', 'git push -u origin feature/mejora-mapa'],
  ['ask', 'git push -u origin CLF_Feature_108'],
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
  ['ask', 'cd "/d/Investigacion/Skills/Skils" && git push origin main', 'D:\\Investigacion\\Skills\\Skils'],
  // Un repo de Comsatel sí tiene ramas protegidas, aunque el comando haga cd
  ['deny', 'cd "D:/0001 - Proyectos Generales/01 - Proyectos Trabajo/web-flotas" && git push origin develop', 'D:\\0001 - Proyectos Generales\\01 - Proyectos Trabajo'],
];

function decision(cmd, tool = 'Bash', cwd = cwdSeguro) {
  const r = spawnSync('node', [guardia], {
    input: JSON.stringify({ tool_name: tool, tool_input: { command: cmd }, cwd }),
    encoding: 'utf8',
  });
  // Contrato: la decisión viaja en el JSON y la salida es siempre 0. Un código 2 o 1 sería una
  // regresión: bajo PowerShell (Windows) el código llega como 1 y el comando se ejecutaría.
  if (r.status !== 0) return { tipo: `salida-${r.status}`, texto: r.stderr };
  if (r.stdout.includes('"permissionDecision":"deny"')) return { tipo: 'deny', texto: r.stdout };
  if (r.stdout.includes('"permissionDecision":"ask"')) return { tipo: 'ask', texto: r.stdout };
  return { tipo: 'allow', texto: '' };
}

let fallos = 0, ejecutados = 0, omitidos = 0;
for (const [esperado, cmd, cwd] of casos) {
  if (cwd && !existsSync(cwd)) { omitidos++; console.log(`OMITE  ${cmd.slice(0, 60)} (no existe ${cwd})`); continue; }
  ejecutados++;
  const { tipo, texto } = decision(cmd, 'Bash', cwd);
  const ok = tipo === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK   ' : 'FALLA'} esperado=${esperado} obtenido=${tipo}  ${cmd.slice(0, 90)}`);
  if (ok && tipo !== 'allow' && !/Motivo:/.test(texto)) { fallos++; console.log('FALLA  el bloqueo no explica el motivo'); }
}
// Herramientas que no son de comandos no deben afectarse.
ejecutados++;
const otra = spawnSync('node', [guardia], { input: JSON.stringify({ tool_name: 'Read', tool_input: { file_path: 'x' } }), encoding: 'utf8' });
if (otra.status !== 0) { fallos++; console.log('FALLA  Read no debería evaluarse'); }
ejecutados++;
const ps = decision('git push origin develop', 'PowerShell');
if (ps.tipo !== 'deny') { fallos++; console.log('FALLA  PowerShell debería evaluarse igual'); }

// Avisos de un push a un producto: DS en prerelease y choques con origin/integration. No bloquean:
// la decisión sigue siendo «ask» y los avisos se suman al motivo.
const avisos = (() => {
  const dir = mkdtempSync(join(tmpdir(), 'guardia-avisos-'));
  const g = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.name=p', '-c', 'user.email=p@x', ...a], { stdio: 'ignore' });
  try {
    g('init', '-q', '-b', 'develop');
    g('remote', 'add', 'origin', 'https://project.comsatel.com.pe/clocator2/microui-demo.git');
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { '@comsatel/ui-components': '1.17.0-pre.157' } }));
    writeFileSync(join(dir, 'a.txt'), 'base\n');
    g('add', '-A'); g('commit', '-q', '-m', 'base');
    g('checkout', '-q', '-b', 'integration');
    writeFileSync(join(dir, 'a.txt'), 'integration\n');
    g('commit', '-q', '-am', 'integration');
    g('update-ref', 'refs/remotes/origin/integration', 'integration');
    g('checkout', '-q', '-b', 'CLF_Feature_1', 'develop');
    writeFileSync(join(dir, 'a.txt'), 'nuestra\n');
    g('commit', '-q', '-am', 'nuestra');
    const conAvisos = decision('git push origin HEAD:refs/heads/CLF_Feature_1', 'Bash', dir);
    const r = [];
    if (conAvisos.tipo !== 'ask') r.push(`push con avisos: esperado ask, obtenido ${conAvisos.tipo}`);
    if (!/prerelease/.test(conAvisos.texto)) r.push('push con avisos: falta el aviso de prerelease');
    if (!/choca con origin\/integration en 1 archivos/.test(conAvisos.texto)) r.push('push con avisos: falta el aviso de choques');
    // Sin prerelease ni choques: «ask» sin avisos.
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { '@comsatel/ui-components': '1.17.0' } }));
    g('checkout', '-q', '-b', 'limpia', 'integration');
    g('commit', '-q', '-am', 'estable');
    const limpia = decision('git push origin HEAD:refs/heads/limpia', 'Bash', dir);
    if (limpia.tipo !== 'ask' || /Avisos antes de subir/.test(limpia.texto)) r.push('push limpio: no debería llevar avisos');
    return r;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
})();
ejecutados++;
for (const f of avisos) { fallos++; console.log(`FALLA  ${f}`); }
if (!avisos.length) console.log('OK    avisos de push (prerelease y choques con integration) sin bloquear');

console.log(`
${casos.length + 3} declarados, ${ejecutados} ejecutados, ${omitidos} omitidos, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
