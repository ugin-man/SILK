$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$skillRoot = Join-Path $repoRoot 'skills/silk-worldbuilder'
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-True {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { $script:failures.Add($Message) }
}

$required = @(
  'SKILL.md',
  'agents/openai.yaml',
  'references/core-model.md',
  'references/maturity-loop.md',
  'references/phase-contracts.md',
  'references/orchestration-algorithm.md',
  'references/ideation-engine.md',
  'references/deepening-engine.md',
  'references/domain-router.md',
  'references/system-design-lens.md',
  'references/history-and-chronology.md',
  'references/geography-and-ecology.md',
  'references/society-and-institutions.md',
  'references/culture-and-language.md',
  'references/cosmology-and-nonhuman.md',
  'references/characters-and-agents.md',
  'references/weaving-engine.md',
  'references/coherence-without-convergence.md',
  'references/interest-and-structural-critic.md',
  'references/anti-convergence.md',
  'references/autonomy-and-context.md',
  'references/epistemics-and-mystery.md',
  'references/approval-and-canon.md',
  'references/taxonomy-and-views.md',
  'references/simulation-and-consistency.md',
  'references/lived-world.md',
  'references/documentation-quality.md',
  'references/identity-and-document-hygiene.md',
  'references/coverage-planning.md',
  'references/weighting-and-priority.md',
  'references/failure-modes.md',
  'references/audit-protocol.md',
  'references/worked-example.md',
  'references/red-team-scenarios.md',
  'references/downstream-contracts.md',
  'references/maintenance-and-expansion.md',
  'references/scale-and-completion.md',
  'references/package-contract.md',
  'scripts/validate_world.ps1',
  'scripts/validate_world.js',
  'assets/world-template/state.yaml',
  'assets/world-template/manifest.yaml',
  'assets/world-template/subject_registry.yaml',
  'assets/world-template/relation_registry.yaml'
  'assets/world-template/claim_registry.yaml'
  'assets/templates/canonical-subject.md'
  'assets/templates/discarded-subject.md'
  'assets/templates/relation-entry.yaml'
  'assets/templates/hypothesis-entry.yaml'
  'assets/templates/critic-verdict.yaml'
  'assets/templates/work-packet.yaml'
  'assets/templates/claim-entry.yaml'
  'assets/templates/collection-entry.yaml'
  'assets/templates/coverage-cell.yaml'
  'assets/templates/vertical-packet.md'
  'assets/templates/junction-packet.md'
  'assets/templates/audit-record.md'
)

foreach ($relative in $required) {
  Assert-True (Test-Path (Join-Path $skillRoot $relative)) "Missing SILK component: $relative"
}

$skillPath = Join-Path $skillRoot 'SKILL.md'
if (Test-Path $skillPath) {
  $skill = Get-Content -Raw -Encoding UTF8 $skillPath
  foreach ($term in @('single-agent', 'canonical subjects', 'maturity level', 'replace', 'premise convergence', 'fixed word counts')) {
    Assert-True ($skill -match [regex]::Escape($term)) "SKILL.md is missing core concept: $term"
  }
}

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) { Write-Host "FAIL: $failure" }
  exit 1
}

Write-Host 'PASS: SILK theoretical component contract'
Write-Host 'NOTE: This does not run a generated-world experiment or prove creative quality.'
exit 0
