param(
  [Parameter(Mandatory = $true)]
  [string]$WorldPath,
  [switch]$Json
)

$ErrorActionPreference = 'Stop'
$findings = [System.Collections.Generic.List[object]]::new()

function Add-Finding {
  param([string]$Code, [string]$Message, [string]$Severity = 'error')
  $script:findings.Add([pscustomobject]@{ severity = $Severity; code = $Code; message = $Message })
}

function Read-Utf8 {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  return Get-Content -LiteralPath $Path -Raw -Encoding UTF8
}

function Require-Keys {
  param([string]$Text, [string[]]$Keys, [string]$Label)
  if (-not $Text) { return }
  foreach ($key in $Keys) {
    if ($Text -notmatch "(?m)^${key}:\s*") { Add-Finding 'missing_key' "$Label is missing key: $key" }
  }
}

$required = @(
  'manifest.yaml',
  'world.yaml',
  'state.yaml',
  'taxonomy.yaml',
  'subject_registry.yaml',
  'relation_registry.yaml',
  'claim_registry.yaml',
  'completion.yaml',
  'workspace/hypothesis_pool.yaml',
  'workspace/change_set.yaml',
  'workspace/expansion_queue.yaml',
  'workspace/weave_queue.yaml',
  'workspace/replacement_queue.yaml',
  'workspace/non_relation_ledger.yaml',
  'workspace/scope_ledger.yaml',
  'workspace/maturity_ledger.yaml',
  'workspace/coverage_map.yaml',
  'workspace/pattern_ledger.yaml',
  'workspace/causal_root_ledger.yaml',
  'workspace/open_questions.yaml',
  'workspace/contradiction_log.md',
  'workspace/decision_log.md',
  'workspace/iteration_log.md',
  'views/catalog.md',
  'views/by_status.md',
  'views/relation_map.md',
  'views/claims.md',
  'views/comparison_matrix.md',
  'reports/world_overview.md',
  'reports/shape_report.md',
  'reports/interest_audit.md',
  'reports/quality_report.md',
  'reports/review_packet.md'
)

foreach ($relative in $required) {
  if (-not (Test-Path -LiteralPath (Join-Path $WorldPath $relative))) {
    Add-Finding 'missing_file' "Missing required file: $relative"
  }
}

$manifest = Read-Utf8 (Join-Path $WorldPath 'manifest.yaml')
Require-Keys $manifest @('format', 'revision', 'world_id', 'world_status', 'world_level', 'user_approval_state', 'entrypoints', 'registries') 'manifest.yaml'
if ($manifest -and $manifest -notmatch '(?m)^format:\s*silk-world-v1\s*$') { Add-Finding 'manifest_format' 'manifest.yaml format must be silk-world-v1.' }

$world = Read-Utf8 (Join-Path $WorldPath 'world.yaml')
Require-Keys $world @('world', 'title', 'intent', 'intended_appeals', 'taste_profile', 'desired_scale', 'scope_envelope', 'status', 'user_canon', 'constraints', 'exclusions', 'reversible_assumptions') 'world.yaml'
if ($world -and $world -notmatch '(?m)^status:\s*(internally_complete|user_approved)\s*$') { Add-Finding 'world_not_complete' 'world.yaml status must be internally_complete or user_approved.' }

$state = Read-Utf8 (Join-Path $WorldPath 'state.yaml')
Require-Keys $state @('world_level', 'current_phase', 'active_packet', 'active_change_set', 'last_integrated_iteration', 'next_action', 'promotion_blockers') 'state.yaml'
if ($state) {
  if ($state -notmatch '(?m)^world_level:\s*4\s*$') { Add-Finding 'world_level' 'Final world_level must be 4.' }
  if ($state -notmatch '(?m)^active_packet:\s*null\s*$') { Add-Finding 'active_packet' 'No active work packet may remain at completion.' }
  if ($state -notmatch '(?m)^active_change_set:\s*null\s*$') { Add-Finding 'active_change_set' 'No active change set may remain at completion.' }
  if ($state -notmatch '(?ms)^promotion_blockers:\s*\[\]\s*$') { Add-Finding 'promotion_blockers' 'promotion_blockers must be empty.' }
}

$taxonomy = Read-Utf8 (Join-Path $WorldPath 'taxonomy.yaml')
if ($taxonomy) {
  $collectionCount = ([regex]::Matches($taxonomy, '(?m)^\s*-\s+id:\s*[a-z0-9_]+\s*$')).Count
  if ($collectionCount -lt 1) { Add-Finding 'empty_taxonomy' 'taxonomy.yaml must contain discovered collections.' }
  foreach ($key in @('label', 'role', 'weight', 'reason')) {
    if (([regex]::Matches($taxonomy, "(?m)^\s+${key}:\s*\S+")).Count -lt $collectionCount) {
      Add-Finding 'taxonomy_contract' "Every collection must define $key."
    }
  }
}

$completion = Read-Utf8 (Join-Path $WorldPath 'completion.yaml')
Require-Keys $completion @('state', 'world_level', 'clean_audit_streak', 'last_audit', 'critical_gaps', 'noncritical_limitations', 'dimensions', 'evidence') 'completion.yaml'
$dimensions = @('subject_integrity', 'depth', 'interest', 'causality', 'weave', 'breadth', 'independence', 'anti_template', 'scope', 'naming', 'coherence', 'mystery', 'plot_boundary', 'usability')
if ($completion) {
  if ($completion -notmatch '(?m)^state:\s*internally_complete\s*$') { Add-Finding 'completion_state' 'completion.yaml state must be internally_complete.' }
  if ($completion -notmatch '(?m)^world_level:\s*4\s*$') { Add-Finding 'completion_level' 'completion.yaml world_level must be 4.' }
  $streak = [regex]::Match($completion, '(?m)^clean_audit_streak:\s*(\d+)\s*$')
  if (-not $streak.Success -or [int]$streak.Groups[1].Value -lt 2) { Add-Finding 'audit_streak' 'Two independent clean audits are required.' }
  if ($completion -notmatch '(?ms)^critical_gaps:\s*\[\]\s*$') { Add-Finding 'critical_gaps' 'critical_gaps must be empty.' }
  foreach ($dimension in $dimensions) {
    if ($completion -notmatch "(?m)^\s+${dimension}:\s*pass\s*$") { Add-Finding 'dimension_not_passed' "Completion dimension must pass: $dimension" }
  }
  $evidenceMatch = [regex]::Match($completion, '(?ms)^evidence:\s*\r?\n(.*)$')
  foreach ($dimension in $dimensions) {
    if (-not $evidenceMatch.Success -or $evidenceMatch.Groups[1].Value -notmatch "(?m)^\s+${dimension}:\s*(?!\[\]\s*$)\S+") {
      Add-Finding 'missing_evidence' "Completion evidence is missing or empty: $dimension"
    }
  }
}

foreach ($queueName in @('hypothesis_pool.yaml', 'expansion_queue.yaml', 'weave_queue.yaml', 'replacement_queue.yaml', 'open_questions.yaml')) {
  $queue = Read-Utf8 (Join-Path $WorldPath "workspace/$queueName")
  if ($queue -and ($queue -match '(?m)^\s+priority:\s*critical\s*$' -or $queue -match '(?m)^\s+blocks_completion:\s*true\s*$')) {
    Add-Finding 'critical_queue' "Completion-blocking work remains in $queueName."
  }
}

$subjectFiles = @()
$subjectsRoot = Join-Path $WorldPath 'subjects'
if (Test-Path -LiteralPath $subjectsRoot) {
  $subjectFiles = @(Get-ChildItem -LiteralPath $subjectsRoot -Recurse -File -Filter '*.md')
}
if ($subjectFiles.Count -lt 1) { Add-Finding 'no_subjects' 'At least one canonical subject is required.' }

$subjectIds = @{}
foreach ($file in $subjectFiles) {
  $text = Read-Utf8 $file.FullName
  $isDiscarded = $file.FullName -match '[\\/]discarded[\\/]'
  if ($isDiscarded) {
    Require-Keys $text @('id', 'title', 'development_status', 'user_status', 'canon_authority', 'discard_reason', 'salvaged_elements', 'replaced_by', 'affected_ids', 'reactivation_condition') $file.FullName
  }
  else {
    Require-Keys $text @('id', 'title', 'development_status', 'user_status', 'canon_authority', 'primary_collection', 'collections', 'weight', 'maturity_level', 'scope', 'summary', 'relation_ids', 'open_questions') $file.FullName
  }
  $idMatch = [regex]::Match($text, '(?m)^id:\s*([^\s]+)\s*$')
  if ($idMatch.Success) {
    $id = $idMatch.Groups[1].Value
    if ($subjectIds.ContainsKey($id)) { Add-Finding 'duplicate_subject' "Duplicate canonical subject id: $id" }
    else { $subjectIds[$id] = $file.FullName }
  }
  if (-not $isDiscarded -and $text -match '(?m)^weight:\s*load_bearing\s*$' -and $text -notmatch '(?m)^maturity_level:\s*4\s*$') {
    Add-Finding 'load_bearing_maturity' "Load-bearing subject is below maturity 4: $($file.FullName)"
  }
  if (-not $isDiscarded -and $text -match '(?m)^development_status:\s*internally_accepted\s*$' -and $text -notmatch '(?ms)^open_questions:\s*\[\]\s*$') {
    Add-Finding 'accepted_questions' "Internally accepted subject has open questions: $($file.FullName)"
  }
  if ($file.FullName -match '[\\/]approved[\\/]' -and $text -notmatch '(?m)^user_status:\s*(approved|locked)\s*$') {
    Add-Finding 'approval_path' "Only user-approved or locked subjects may be stored under approved: $($file.FullName)"
  }
  if ($text -match '(?im)^#{1,3}\s*(chapter\s+\d+|protagonist arc|scene sequence|quest walkthrough|story ending)') {
    Add-Finding 'plot_contamination' "Plot-like heading found in subject: $($file.FullName)"
  }
}

$subjectRegistry = Read-Utf8 (Join-Path $WorldPath 'subject_registry.yaml')
foreach ($id in $subjectIds.Keys) {
  if ($subjectRegistry -notmatch [regex]::Escape($id)) { Add-Finding 'registry_missing_subject' "Subject registry is missing: $id" }
}

$relationRegistry = Read-Utf8 (Join-Path $WorldPath 'relation_registry.yaml')
$relationIds = @{}
if ($relationRegistry) {
  foreach ($match in [regex]::Matches($relationRegistry, '(?m)^\s*-\s+id:\s*([^\s]+)\s*$')) {
    $relationIds[$match.Groups[1].Value] = $true
  }
  foreach ($match in [regex]::Matches($relationRegistry, '(?m)^\s+(source|target):\s*([^\s]+)\s*$')) {
    $targetId = $match.Groups[2].Value
    if (-not $subjectIds.ContainsKey($targetId)) { Add-Finding 'broken_relation_subject' "Relation references unknown subject: $targetId" }
  }
}

foreach ($file in $subjectFiles) {
  $text = Read-Utf8 $file.FullName
  foreach ($match in [regex]::Matches($text, '(?m)^\s+-\s+(relation\.[a-z0-9_.-]+)\s*$')) {
    if (-not $relationIds.ContainsKey($match.Groups[1].Value)) { Add-Finding 'broken_relation_id' "Unknown relation id $($match.Groups[1].Value) in $($file.FullName)" }
  }
}

$quality = Read-Utf8 (Join-Path $WorldPath 'reports/quality_report.md')
if ($quality) {
  foreach ($dimension in $dimensions) {
    $heading = ($dimension -replace '_', ' ')
    if ($quality -notmatch "(?im)^##\s+$([regex]::Escape($heading))\s*$") { Add-Finding 'quality_section' "Quality report is missing section: $heading" }
  }
  if (([regex]::Matches($quality, '(?im)^###\s+Clean audit\s+')).Count -lt 2) { Add-Finding 'audit_evidence' 'Quality report must contain two clean audit records.' }
}

$auditPath = Join-Path $WorldPath 'workspace/audits'
$cleanAuditCount = 0
if (Test-Path -LiteralPath $auditPath) {
  foreach ($auditFile in Get-ChildItem -LiteralPath $auditPath -File -Filter '*.md') {
    $auditText = Read-Utf8 $auditFile.FullName
    if ($auditText -match '(?im)^-\s*Clean audit:\s*yes\s*$') { $cleanAuditCount++ }
  }
}
if ($cleanAuditCount -lt 2) { Add-Finding 'clean_audit_files' 'Two clean audit artifact files are required.' }

$result = [pscustomobject]@{
  valid = ($findings.Count -eq 0)
  world_path = (Resolve-Path -LiteralPath $WorldPath).Path
  subject_count = $subjectFiles.Count
  relation_count = $relationIds.Count
  findings = $findings
  note = 'Structural validation does not prove creative quality.'
}

if ($Json) { $result | ConvertTo-Json -Depth 5 }
else {
  if ($result.valid) { Write-Host "PASS: $($result.world_path)" }
  foreach ($finding in $findings) { Write-Host "$($finding.severity.ToUpper()): [$($finding.code)] $($finding.message)" }
  Write-Host $result.note
}

if ($result.valid) { exit 0 }
exit 1
