param(
  [Parameter(Mandatory = $true)]
  [string]$WorldPath,
  [switch]$Json
)

$ErrorActionPreference = 'Stop'
$validator = Join-Path $PSScriptRoot 'validate_world.js'
$args = @($validator, $WorldPath)
if ($Json) { $args += '--json' }
& node @args
exit $LASTEXITCODE
