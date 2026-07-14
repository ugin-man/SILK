$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
  node .\v2.next\scripts\build_v2_next.js
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  node .\v2.next\tests\run_all.js
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  node .\v2.next\scripts\static_audit.js
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}
