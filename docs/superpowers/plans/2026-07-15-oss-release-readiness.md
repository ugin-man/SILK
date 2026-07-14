# SILK OSS Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SILKを、V1実証、正式YAML検査、V2統合CI、公開デモ、貢献導線、Issue、タグ、GitHub Releaseを持つ`v0.1.0` OSSリリースへ整える。

**Architecture:** Node.jsの正式YAML検査器をV1構造検査の正本にし、PowerShellは互換ラッパーにする。新規のGlass Tide世界パッケージを同じ検査器で検証し、V1、デモ、V2、文書整合を一つのGitHub Actionsワークフローから実行する。公開文書は検証済み範囲と未実証範囲を分け、リモートCI成功後にIssue、タグ、Releaseを作る。

**Tech Stack:** Node.js 20、CommonJS、`yaml@2.9.0`、Node組み込み`node:test`、PowerShell 7、GitHub Actions、単一HTMLのSILK V2。

## Global Constraints

- リポジトリ全体の初回OSSリリース番号は`v0.1.0`とする。V2世界パッケージ内部の形式番号とは別に扱う。
- 過去の1コミットを架空の履歴へ書き換えない。
- 既存の無関係な未追跡ファイルを追加しない。
- 作品固有のアルネビアデータをV2公開HTMLへ混ぜない。
- 構造検査PASSを創作品質の証明として扱わない。
- AI自己監査と人間評価を同一視しない。
- APIキー、Cookie、Git認証情報、個人パスを成果物へ残さない。
- 実装コードはテストを先に作り、期待した理由で失敗することを確認する。
- ローカル検証、現行コミットのGitHub Actions成功、Issue、タグ、Releaseの存在まで確認して完成とする。

---

## File Map

- `package.json`: リポジトリ全体の検査コマンドと`yaml`依存を定義する。
- `package-lock.json`: CIとローカルで同じYAMLパーサーを使う。
- `skills/silk-worldbuilder/scripts/validate_world.js`: V1世界パッケージの正本構造検査器。
- `skills/silk-worldbuilder/scripts/validate_world.ps1`: Node検査器を呼ぶWindows互換入口。
- `tests/v1_validator_contract.js`: YAML書式差と構造違反の回帰テスト。
- `examples/worlds/glass-tide/`: SILKで生成する小規模公開デモと実行証拠。
- `tests/glass_tide_demo_contract.js`: デモ固有の規模、証拠、境界を確認する。
- `scripts/release_consistency.js`: README、バージョン、ライセンス、デモ、V2証拠の同期検査。
- `.github/workflows/ci.yml`: V1、デモ、V2、文書整合の公開CI入口。
- `CONTRIBUTING.md`: V1、V2、文書、評価への参加方法。
- `README.md`: 日本語の公開入口。
- `README.en.md`: 英語審査向けの独立した公開入口。
- `.github/ISSUE_TEMPLATE/bug_report.yml`: 再現可能なバグ報告フォーム。
- `.github/ISSUE_TEMPLATE/validation_proposal.yml`: 長時間生成や品質評価の検証提案フォーム。
- `CHANGELOG.md`: リポジトリ全体の公開変更履歴。
- `docs/releases/v0.1.0.md`: GitHub Release本文の正本。
- `v2.next/RELEASE_READINESS.md`: 現行ライセンスと証拠SHAに同期したV2状態。

### Task 1: Formal V1 YAML validator

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `skills/silk-worldbuilder/scripts/validate_world.js`
- Create: `tests/v1_validator_contract.js`
- Modify: `skills/silk-worldbuilder/scripts/validate_world.ps1`
- Modify: `tests/silk_skill_contract.Tests.ps1`

**Interfaces:**
- Consumes: `validateWorld(worldPath: string): ValidationResult`
- Produces: `{ valid, world_path, subject_count, relation_count, findings, note }`
- Produces: CLI `node skills/silk-worldbuilder/scripts/validate_world.js <worldPath> [--json]`
- Produces: PowerShell `./skills/silk-worldbuilder/scripts/validate_world.ps1 -WorldPath <path> [-Json]`

- [ ] **Step 1: Add the failing validator contract**

Create `tests/v1_validator_contract.js` with Node's built-in test runner. Its fixture builder must write all required V1 files to a temporary folder and expose `makeValidWorld()`, `writeYaml()`, and `writeSubject()` helpers. Add these tests:

```js
test('accepts quoted scalars, inline arrays, and block scalars', () => {
  const world = makeValidWorld();
  const result = validateWorld(world);
  assert.equal(result.valid, true, JSON.stringify(result.findings, null, 2));
});

test('rejects invalid YAML with a file-scoped finding', () => {
  const world = makeValidWorld();
  fs.writeFileSync(path.join(world, 'completion.yaml'), 'state: [broken', 'utf8');
  const result = validateWorld(world);
  assert.equal(result.valid, false);
  assert.ok(result.findings.some(item => item.code === 'yaml_parse' && item.file === 'completion.yaml'));
});

test('rejects duplicate subject ids', () => {
  const world = makeValidWorld();
  writeSubject(world, 'subjects/pending/places/duplicate.md', { id: 'glass-tide.place.first-light' });
  const result = validateWorld(world);
  assert.ok(result.findings.some(item => item.code === 'duplicate_subject'));
});

test('rejects broken relation subjects and relation ids', () => {
  const world = makeValidWorld();
  writeYaml(world, 'relation_registry.yaml', {
    relations: [{ id: 'relation.broken', source: 'missing.subject', target: 'glass-tide.place.first-light', type: 'tests', summary: 'broken', effects_on_source: [], effects_on_target: [], scope: 'local', development_status: 'working', user_status: 'unreviewed' }],
    junctions: []
  });
  const result = validateWorld(world);
  assert.ok(result.findings.some(item => item.code === 'broken_relation_subject'));
});

test('rejects unapproved subjects stored under approved', () => {
  const world = makeValidWorld();
  writeSubject(world, 'subjects/approved/places/unapproved.md', { id: 'glass-tide.place.unapproved', user_status: 'unreviewed' });
  const result = validateWorld(world);
  assert.ok(result.findings.some(item => item.code === 'approval_path'));
});
```

The valid fixture must use `summary: |` in subject frontmatter, quoted title values, and inline arrays. It must contain two audit files with different `Audit route` values and `Clean audit: yes`.

- [ ] **Step 2: Run the contract and verify the expected failure**

Run:

```powershell
node --test tests/v1_validator_contract.js
```

Expected: FAIL with `Cannot find module '../skills/silk-worldbuilder/scripts/validate_world.js'`.

- [ ] **Step 3: Add the repository Node contract**

Create `package.json` with exactly these public commands:

```json
{
  "name": "silk-worldbuilder",
  "version": "0.1.0",
  "private": true,
  "description": "Autonomous AI worldbuilding skill and local visual atlas for Codex",
  "license": "MIT",
  "scripts": {
    "test:v1": "node --test tests/v1_validator_contract.js tests/glass_tide_demo_contract.js tests/oss_docs_contract.js",
    "validate:demo": "node skills/silk-worldbuilder/scripts/validate_world.js examples/worlds/glass-tide",
    "test:v2": "node v2.next/tests/run_all.js",
    "audit:v2": "node v2.next/scripts/static_audit.js",
    "check:release": "node scripts/release_consistency.js",
    "check": "npm run test:v1 && npm run validate:demo && npm run test:v2 && npm run audit:v2 && npm run check:release"
  },
  "dependencies": {
    "yaml": "2.9.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

Run `npm install --package-lock-only` and then `npm ci` so `package-lock.json` records`yaml@2.9.0`.

- [ ] **Step 4: Implement the validator API**

Create `validate_world.js` as a CommonJS module exporting:

```js
module.exports = {
  validateWorld,
  formatHumanResult,
  parseFrontmatter
};
```

Use `YAML.parseDocument(text, { prettyErrors: true, uniqueKeys: true })`. Convert parser errors into findings with this exact shape:

```js
{
  severity: 'error',
  code: 'yaml_parse',
  file: relativePath,
  path: null,
  message: error.message
}
```

Every structural finding must use the same five fields. `validateWorld()` must apply this matrix:

| Area | Required behavior |
|---|---|
| required files | Require the 31 files listed by the old PowerShell validator plus `workspace/audits/` |
| manifest | Require format `silk-world-v1`, revision `2`, matching world ID, level `4` |
| world/state/completion | Require internally complete state, level `4`, empty blockers, two clean audits, all 14 dimensions `pass`, non-empty evidence arrays |
| taxonomy | Require at least one collection and `id`, `label`, `role`, `weight`, `reason` strings |
| subjects | Parse YAML frontmatter, require template keys, reject duplicate IDs, reject immature load-bearing items and unresolved internally accepted items |
| approved path | Permit only `user_status: approved` or `locked` |
| subject registry | Require exact one-to-one ID coverage between registry and canonical subject files |
| relations | Reject duplicate IDs, missing subjects, and subject `relation_ids` absent from the relation registry |
| claims | Reject duplicate claim IDs and unknown subject IDs in `asserted_by` or `challenged_by` |
| queues | Recursively reject any object with `priority: critical` or `blocks_completion: true` |
| quality report | Require all 14 dimension headings and two `### Clean audit` entries |
| audit files | Require at least two files with different non-empty routes and `Clean audit: yes` |
| plot boundary | Reject subject headings matching chapter, protagonist arc, scene sequence, quest walkthrough, or story ending |

`formatHumanResult()` must print file and path when present, followed by `Structural validation does not prove creative quality.`. CLI exit status is `0` only when `valid` is true.

- [ ] **Step 5: Replace the PowerShell regex implementation with a wrapper**

Use this behavior in `validate_world.ps1`:

```powershell
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
```

Add `scripts/validate_world.js` to the required component list in `tests/silk_skill_contract.Tests.ps1`.

- [ ] **Step 6: Run the focused tests**

Run:

```powershell
node --test tests/v1_validator_contract.js
./tests/silk_skill_contract.Tests.ps1
```

Expected: validator contract PASS and `PASS: SILK theoretical component contract`.

- [ ] **Step 7: Commit the validator**

```powershell
git add package.json package-lock.json skills/silk-worldbuilder/scripts/validate_world.js skills/silk-worldbuilder/scripts/validate_world.ps1 tests/v1_validator_contract.js tests/silk_skill_contract.Tests.ps1
git commit -m "feat: add formal V1 world validation"
```

### Task 2: Glass Tide generated-world evidence

**Files:**
- Create: `examples/worlds/glass-tide/PROMPT.md`
- Create: `examples/worlds/glass-tide/RUN_RECORD.md`
- Create: `examples/worlds/glass-tide/AI_SELF_AUDIT.md`
- Create: `examples/worlds/glass-tide/HUMAN_EVALUATION.md`
- Create: `examples/worlds/glass-tide/manifest.yaml`
- Create: `examples/worlds/glass-tide/world.yaml`
- Create: `examples/worlds/glass-tide/state.yaml`
- Create: `examples/worlds/glass-tide/taxonomy.yaml`
- Create: `examples/worlds/glass-tide/subject_registry.yaml`
- Create: `examples/worlds/glass-tide/relation_registry.yaml`
- Create: `examples/worlds/glass-tide/claim_registry.yaml`
- Create: `examples/worlds/glass-tide/completion.yaml`
- Create: `examples/worlds/glass-tide/subjects/pending/**/*.md`
- Create: `examples/worlds/glass-tide/workspace/*`
- Create: `examples/worlds/glass-tide/views/*`
- Create: `examples/worlds/glass-tide/reports/*`
- Create: `tests/glass_tide_demo_contract.js`

**Interfaces:**
- Consumes: `validateWorld(examples/worlds/glass-tide)` from Task 1.
- Produces: a complete `silk-world-v1` revision 2 package with `world_id: glass-tide`.
- Produces: an honest evidence boundary between structural validation, AI self-audit, and human review.

- [ ] **Step 1: Add the failing demo contract**

Create `tests/glass_tide_demo_contract.js` with these assertions:

```js
test('Glass Tide is a complete small generated-world package', () => {
  const result = validateWorld(demoRoot);
  assert.equal(result.valid, true, JSON.stringify(result.findings, null, 2));
  assert.equal(result.subject_count, 6);
  assert.equal(result.relation_count, 5);
});

test('Glass Tide preserves execution and review evidence', () => {
  const prompt = read('PROMPT.md');
  const run = read('RUN_RECORD.md');
  const selfAudit = read('AI_SELF_AUDIT.md');
  const human = read('HUMAN_EVALUATION.md');
  assert.match(prompt, /Independent causal roots/);
  assert.match(run, /Level 0/);
  assert.match(run, /Level 4/);
  assert.match(run, /Rejected hypothesis/);
  assert.match(selfAudit, /Structural validation is not creative proof/);
  assert.match(human, /Evaluator:/);
  assert.doesNotMatch(human, /Evaluator:\s*(Codex|AI|ChatGPT)/i);
});
```

- [ ] **Step 2: Verify the demo contract fails because the package is absent**

Run:

```powershell
node --test tests/glass_tide_demo_contract.js
```

Expected: FAIL with `ENOENT` for `examples/worlds/glass-tide`.

- [ ] **Step 3: Generate the Glass Tide package through the SILK workflow**

Use `skills/silk-worldbuilder/SKILL.md` and only the directly routed references. Record actual timestamps and the active model in `RUN_RECORD.md`. The fixed user intent is:

```text
Build a compact maritime world where glass is harvested from tides that remember heat.
The world must have at least three independent causal roots, no chosen protagonist,
no universal magic system, and no single institution that controls every region.
Show one attractive tradition, one material constraint, one disputed historical claim,
one deliberately non-connected subject, and one rejected hypothesis that would have
made the setting too convergent.
```

The integrated package must contain exactly these six canonical subjects:

| ID | Collection | Weight | Required role |
|---|---|---|---|
| `glass-tide.phenomenon.ember-tide` | tidal_phenomena | load_bearing | stores and releases heat without becoming a universal power source |
| `glass-tide.place.first-light-terraces` | settlements | load_bearing | tidal glass harvesting settlement with daily labor consequences |
| `glass-tide.institution.cooling-houses` | civic_practices | supporting | neighborhood cooling practice, not a world government |
| `glass-tide.people.ash-divers` | livelihoods | supporting | hazardous craft with bodily and economic limits |
| `glass-tide.route.pale-current` | routes | supporting | seasonal route that changes trade and isolation |
| `glass-tide.place.rain-vault` | inland_archives | supporting | intentionally non-connected inland archive with a separate causal root |

Create exactly five relations:

```yaml
relations:
  - id: relation.ember-tide.first-light.harvest-cycle
    source: glass-tide.phenomenon.ember-tide
    target: glass-tide.place.first-light-terraces
    type: material-cycle
  - id: relation.first-light.cooling-houses.civic-obligation
    source: glass-tide.place.first-light-terraces
    target: glass-tide.institution.cooling-houses
    type: civic-obligation
  - id: relation.ash-divers.ember-tide.occupational-risk
    source: glass-tide.people.ash-divers
    target: glass-tide.phenomenon.ember-tide
    type: occupational-risk
  - id: relation.pale-current.first-light.seasonal-access
    source: glass-tide.route.pale-current
    target: glass-tide.place.first-light-terraces
    type: seasonal-access
  - id: relation.ash-divers.cooling-houses.aftercare
    source: glass-tide.people.ash-divers
    target: glass-tide.institution.cooling-houses
    type: aftercare
```

Each relation must include a concrete `summary`, non-empty `effects_on_source`, non-empty `effects_on_target`, `scope`, `development_status: internally_accepted`, and `user_status: unreviewed`.

Create three claims: the origin of ember tides is disputed, cooling-house access is a civic obligation, and the Rain Vault predates coastal glass harvesting. Keep the origin claim intentionally unresolved.

All six subjects remain under `subjects/pending/` because the user has not approved them as canon. Load-bearing subjects have maturity level 4. Completion is `internally_complete`, not `user_approved`.

Record the rejected candidate `The Furnace Crown`, a single order controlling all heat glass, as rejected for premise convergence. Record the Rain Vault as an intentional non-relation rather than forcing it into the coastal graph.

- [ ] **Step 4: Write the evidence reports and views**

The reports must use concrete IDs and counterevidence. `quality_report.md` must contain all 14 completion headings and two clean audits with different routes:

- route A: registry-to-subject-to-relation trace
- route B: lived-consequence-to-causal-root-to-non-relation trace

`AI_SELF_AUDIT.md` must state exactly: `Structural validation is not creative proof.` and list at least one weakness. `HUMAN_EVALUATION.md` must use the rubric from `USER_EVALUATION_GUIDE.md`, contain evaluator and date fields, and remain explicitly unapproved until the user reviews the generated artifacts.

- [ ] **Step 5: Validate the demo**

Run:

```powershell
node --test tests/glass_tide_demo_contract.js
npm run validate:demo
```

Expected: 2 tests PASS and `PASS: ...examples\worlds\glass-tide` followed by the creative-quality boundary note.

- [ ] **Step 6: Commit the demo**

```powershell
git add examples/worlds/glass-tide tests/glass_tide_demo_contract.js
git commit -m "feat: add generated Glass Tide evidence world"
```

### Task 3: Unified CI and release consistency

**Files:**
- Create: `.github/workflows/ci.yml`
- Delete: `.github/workflows/v1-ci.yml`
- Create: `scripts/release_consistency.js`
- Create: `tests/release_consistency_contract.js`

**Interfaces:**
- Consumes: npm scripts from Task 1 and demo evidence from Task 2.
- Produces: `checkReleaseConsistency(root): string[]`.
- Produces: one GitHub Actions workflow with four named jobs.

- [ ] **Step 1: Add the failing release-consistency contract**

Create tests that require `package.json` version `0.1.0`, `LICENSE`, `README.en.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `docs/releases/v0.1.0.md`, a structurally valid demo, a V2 browser evidence SHA matching `SILK-V2.html`, and no stale `GitHubで公開する前に、ライセンス` wording.

```js
test('release metadata and evidence agree', () => {
  assert.deepEqual(checkReleaseConsistency(repoRoot), []);
});
```

- [ ] **Step 2: Verify the contract fails on missing public documents**

Run:

```powershell
node --test tests/release_consistency_contract.js
```

Expected: FAIL listing at least `README.en.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `docs/releases/v0.1.0.md`.

- [ ] **Step 3: Implement release consistency checks**

`scripts/release_consistency.js` must export `checkReleaseConsistency` and print one `FAIL:` line per mismatch. It must not rewrite files. Exit `0` only when the returned array is empty.

Checks:

```js
const requiredFiles = [
  'README.md', 'README.en.md', 'CONTRIBUTING.md', 'LICENSE', 'CHANGELOG.md',
  'docs/releases/v0.1.0.md', 'examples/worlds/glass-tide/HUMAN_EVALUATION.md',
  'v2.next/RELEASE_READINESS.md', 'v2.next/BROWSER_VALIDATION.json',
  'v2.next/SILK-V2.html'
];
```

Compare the SHA-256 of `SILK-V2.html` with `candidate_sha256` in `BROWSER_VALIDATION.json`. Check that README files link to the demo, contribution guide, license, validation limits, and release version. Check that release notes link to the long-run validation issue using the stable marker `LONG_RUN_VALIDATION_ISSUE_URL`, which is replaced with the real Issue URL before tagging.

- [ ] **Step 4: Add the unified GitHub Actions workflow**

Create `.github/workflows/ci.yml` with trigger `push` and `pull_request`. Use these jobs:

```yaml
jobs:
  v1-theory:
    runs-on: windows-latest
  v1-validator:
    runs-on: ubuntu-latest
  v2-contracts:
    runs-on: ubuntu-latest
  release-consistency:
    runs-on: ubuntu-latest
```

All jobs use `actions/checkout@v4` and `actions/setup-node@v4` with Node 20 and `cache: npm`. `v1-theory` runs `pwsh ./tests/silk_skill_contract.Tests.ps1`. Other jobs run `npm ci` before their focused scripts. `v2-contracts` runs the build, all V2 contracts, and the static audit. Delete `v1-ci.yml` after the new workflow contains the old contract.

- [ ] **Step 5: Run local CI equivalents**

Run:

```powershell
./tests/silk_skill_contract.Tests.ps1
npm ci
node --test tests/v1_validator_contract.js tests/glass_tide_demo_contract.js
npm run validate:demo
node v2.next/scripts/build_v2_next.js
npm run test:v2
npm run audit:v2
```

Expected: every command exits `0`. The release-consistency contract remains red until Tasks 4 and 5 add public documents.

- [ ] **Step 6: Commit CI infrastructure**

```powershell
git add .github/workflows/ci.yml .github/workflows/v1-ci.yml scripts/release_consistency.js tests/release_consistency_contract.js
git commit -m "ci: validate V1 demo and V2 release artifacts"
```

### Task 4: Contribution and public documentation

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `README.en.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/validation_proposal.yml`
- Create: `tests/oss_docs_contract.js`
- Modify: `README.md`
- Modify: `USER_EVALUATION_GUIDE.md`

**Interfaces:**
- Consumes: exact npm commands established in Task 1.
- Produces: a Japanese and English public entry point with matching factual claims.
- Produces: contributor and Issue forms that separate structural validity from creative quality.

- [ ] **Step 1: Add the failing OSS documents contract**

Create a test that requires these headings and commands:

```js
const japaneseHeadings = ['SILKとは', 'V1', 'V2', '5分で試す', '公開デモ', '検証済み範囲', '未実証範囲', '貢献'];
const englishHeadings = ['What SILK is', 'V1', 'V2', 'Try it in five minutes', 'Public demo', 'What is verified', 'What is not yet proven', 'Contributing'];
const commands = ['npm ci', 'npm run validate:demo', 'npm run test:v2', 'npm run audit:v2'];
```

Require both README files to contain the commands, `examples/worlds/glass-tide`, `CONTRIBUTING.md`, `LICENSE`, and the sentence that structural validation does not prove creative quality in the appropriate language.

- [ ] **Step 2: Verify the documents contract fails**

Run:

```powershell
node --test tests/oss_docs_contract.js
```

Expected: FAIL because `README.en.md` and `CONTRIBUTING.md` do not exist.

- [ ] **Step 3: Rewrite the Japanese README**

Use this exact section order:

```markdown
# SILK
[English](README.en.md)
## SILKとは
## V1
## V2
## 5分で試す
## 公開デモ
## 検証済み範囲
## 未実証範囲
## 貢献
## ロードマップ
## ライセンス
```

State that Glass Tide proves a small revision 2 package can be generated, recorded, and structurally validated. Do not claim uninterrupted long-run autonomy or human-approved creative excellence. Link the open long-run validation Issue once created.

- [ ] **Step 4: Write the English README and contribution guide**

`README.en.md` must stand alone and use the same commands, version, demo, and evidence limits as the Japanese README. `CONTRIBUTING.md` must have separate paths for V1 rules and validator changes, V2 changes, documentation, and human evaluation. Require bug reports to include OS, Node version, command, expected result, actual result, and minimal package or screenshot when relevant.

- [ ] **Step 5: Add Issue forms and update the evaluation guide**

Both Issue forms must include reproduction or evaluation evidence fields. The validation proposal form must ask whether the work measures structure, creative quality, long-run autonomy, or browser behavior. Update `USER_EVALUATION_GUIDE.md` so its opening no longer says no real world has ever been generated; instead, link Glass Tide and explain that broader evaluation remains open.

- [ ] **Step 6: Run and commit documentation checks**

Run:

```powershell
node --test tests/oss_docs_contract.js
```

Expected: PASS.

```powershell
git add README.md README.en.md CONTRIBUTING.md USER_EVALUATION_GUIDE.md .github/ISSUE_TEMPLATE tests/oss_docs_contract.js
git commit -m "docs: add OSS contribution and evaluation paths"
```

### Task 5: Release documents and final local audit

**Files:**
- Create: `CHANGELOG.md`
- Create: `docs/releases/v0.1.0.md`
- Modify: `v2.next/RELEASE_READINESS.md`
- Modify: `SILK_V1_THEORY_AUDIT.md`
- Modify: `SILK_V2_COMPLETION.md`
- Modify: `ACTIVE_VERSION.json`

**Interfaces:**
- Consumes: current demo validation and V2 audit evidence.
- Produces: release notes that distinguish repository version `v0.1.0` from V2 package format.
- Produces: `npm run check:release` returning zero after the real Issue URL is inserted.

- [ ] **Step 1: Update release facts without overstating quality**

`CHANGELOG.md` starts with `[0.1.0] - 2026-07-15` and lists formal V1 validation, Glass Tide, unified CI, V2 public candidate, contribution paths, and known limits.

`docs/releases/v0.1.0.md` must contain:

- install and five-minute commands
- Glass Tide evidence links
- V2 artifact and readiness links
- exact verification commands
- known limitation that long uninterrupted generation and multiple independent human evaluations remain open
- marker `LONG_RUN_VALIDATION_ISSUE_URL` until the Issue is created

Change `v2.next/RELEASE_READINESS.md` from the stale pre-publication license wording to: MIT license present, repository description present, distribution files selected, release tag pending until CI passes. Preserve the existing browser verification claim only while its SHA still matches.

- [ ] **Step 2: Update audit documents to current evidence**

`SILK_V1_THEORY_AUDIT.md` must mark the new validator and Glass Tide small-world run as executed, while keeping long-run autonomy and broad creative quality unproven. `SILK_V2_COMPLETION.md` and `ACTIVE_VERSION.json` must name repository release `0.1.0` without changing V2's world-package version.

- [ ] **Step 3: Run the release consistency test and repair only real mismatches**

Run:

```powershell
node --test tests/release_consistency_contract.js
npm run check:release
```

Expected before Issue creation: the only permitted failure is the stable Issue URL marker. All other mismatches must be fixed now.

- [ ] **Step 4: Run the full local suite**

Run:

```powershell
npm run check
./tests/silk_skill_contract.Tests.ps1
git diff --check
```

Expected: all automated checks PASS except the explicitly reported Issue URL marker if it has not yet been replaced.

- [ ] **Step 5: Commit release preparation**

```powershell
git add CHANGELOG.md v2.next/RELEASE_READINESS.md SILK_V1_THEORY_AUDIT.md SILK_V2_COMPLETION.md ACTIVE_VERSION.json
git add -f docs/releases/v0.1.0.md
git commit -m "docs: prepare SILK v0.1.0 release"
```

### Task 6: Human review, GitHub Issue, push, CI, tag, and Release

**Files:**
- Modify: `examples/worlds/glass-tide/HUMAN_EVALUATION.md`
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `docs/releases/v0.1.0.md`

**Interfaces:**
- Consumes: user review of Glass Tide and authenticated GitHub admin access for `ugin-man/SILK`.
- Produces: one open long-run validation Issue, remote commits, green Actions, annotated `v0.1.0` tag, and published GitHub Release.

- [ ] **Step 1: Present the Glass Tide review packet to the user**

Link `reports/review_packet.md`, `reports/world_overview.md`, `views/catalog.md`, `AI_SELF_AUDIT.md`, and `HUMAN_EVALUATION.md`. Ask the user to record pass, fail, or needs revision for the rubric. Do not fill the evaluator verdict before the user responds.

- [ ] **Step 2: Record the human evaluation**

Write only the user's actual verdict, observations, evaluator name or chosen label, and date. If the user finds a substantive defect, return to Task 2, revise the affected world artifacts, rerun validation, and make a focused fix commit.

- [ ] **Step 3: Create the public long-run validation Issue**

Title:

```text
Validate long-run autonomous world generation and independent creative review
```

The body must include the exact reproduction prompt from `USER_EVALUATION_GUIDE.md`, environment capture requirements, required outputs, structural validation command, human rubric, success criteria, and the explicit boundary that Glass Tide is a small demonstration only.

- [ ] **Step 4: Replace the Issue marker and commit final public links**

Replace `LONG_RUN_VALIDATION_ISSUE_URL` in both README files and release notes with the real Issue URL. Run:

```powershell
npm run check:release
npm run check
```

Expected: both commands PASS.

Commit:

```powershell
git add examples/worlds/glass-tide/HUMAN_EVALUATION.md README.md README.en.md
git add -f docs/releases/v0.1.0.md
git commit -m "docs: record public validation evidence"
```

- [ ] **Step 5: Push commits and verify GitHub Actions**

Push the current branch without force. Confirm the workflow run belongs to the pushed HEAD SHA. Require all four jobs to succeed. If any job fails, inspect that job's logs, reproduce locally, fix through a new focused commit, and push again.

- [ ] **Step 6: Create and push the annotated tag**

```powershell
git tag -a v0.1.0 -m "SILK v0.1.0"
git push origin v0.1.0
```

Verify the tag resolves to the same SHA that passed Actions.

- [ ] **Step 7: Publish the GitHub Release**

Create a non-draft, non-prerelease GitHub Release for `v0.1.0` using `docs/releases/v0.1.0.md` as the body. Link the demo, CI run, contribution guide, and long-run validation Issue.

- [ ] **Step 8: Completion audit**

Confirm all of the following from current local and GitHub state:

- multiple meaningful commits after the initial release
- no unrelated untracked files in any commit
- `CONTRIBUTING.md` and `README.en.md` on GitHub
- one unified CI workflow and green current run
- formal YAML parser and passing regression tests
- Glass Tide input, outputs, intermediate state, AI audit, and real human evaluation
- public long-run validation Issue
- corrected V2 readiness wording
- annotated `v0.1.0` tag
- published `v0.1.0` Release

Only after every item is directly verified may the active goal be marked complete.
