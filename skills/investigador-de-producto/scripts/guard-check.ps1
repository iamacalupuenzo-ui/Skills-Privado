<#
Contrato: sin argumentos. Resuelve el contexto antes de investigar o registrar.
Imprime en stdout:
  SKILL_ROOT=<ruta encontrada o VACIO>
  METODO_OK=True|False
  RESEARCH_DIR_OK=True|False
  ARCHIVOS_EXISTENTES: (seguido de un nombre de archivo por línea, o vacío)

Códigos de salida:
  0 = listo (skill root resuelto, método presente, carpeta de investigaciones presente)
  1 = falta el método (references/evaluacion-en-uso.md no existe donde se resolvió el
      skill) — no ejecutar ningún producto sobre un sistema propio sin esto.
  2 = falta la carpeta de investigaciones en este equipo — preguntar la ruta antes de
      escribir cualquier informe.

Nunca crea carpetas ni archivos — solo lee.
#>

$skillRoots = @(
  (Join-Path $env:USERPROFILE '.codex\skills\investigador-de-producto'),
  (Join-Path $env:USERPROFILE '.claude\skills\investigador-de-producto'),
  'D:\Investigacion\Skills\Skils\skills\investigador-de-producto'
) | Where-Object { Test-Path -LiteralPath $_ }
$skillRoot = $skillRoots | Select-Object -First 1

if (-not $skillRoot) {
  Write-Output 'SKILL_ROOT=VACIO'
  Write-Output 'METODO_OK=False'
  Write-Output 'RESEARCH_DIR_OK=False'
  exit 1
}

$metodoOk = Test-Path -LiteralPath (Join-Path $skillRoot 'references\evaluacion-en-uso.md')
$researchDir = if ($env:INVESTIGACIONES_DIR) { $env:INVESTIGACIONES_DIR } else { 'D:\Investigacion - V4\02-investigaciones' }
$researchDirOk = Test-Path -LiteralPath $researchDir

Write-Output "SKILL_ROOT=$skillRoot"
Write-Output "METODO_OK=$metodoOk"
Write-Output "RESEARCH_DIR_OK=$researchDirOk"

$casosDir = Join-Path $skillRoot 'references\casos'
Write-Output 'ARCHIVOS_EXISTENTES:'
Get-ChildItem -LiteralPath $researchDir, $casosDir -File -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty Name |
  ForEach-Object { Write-Output "  $_" }

if (-not $metodoOk) { exit 1 }
if (-not $researchDirOk) { exit 2 }
exit 0
