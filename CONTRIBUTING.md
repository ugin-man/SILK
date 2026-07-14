# Contributing to SILK

SILK accepts changes to the V1 worldbuilding workflow, the V1 validator, the V2 local application, documentation, and evaluation evidence. Keep structural validity, browser behavior, and creative-quality judgment separate in every report.

## Development setup

Install Node.js 20 or newer, then run:

```powershell
npm ci
npm run check
```

`npm run check` includes the public release link check. Before the long-run validation Issue exists, that check intentionally reports the unresolved Issue URL marker.

## V1 rules and validator

Use this path for `skills/silk-worldbuilder/`, package contracts, or `validate_world.js`.

- Add a failing Node test before changing validator behavior.
- Keep YAML parsing in the `yaml` package rather than adding regular-expression parsing.
- Preserve five-field findings: severity, code, file, path, and message.
- Do not turn structural validation into a claim about creative quality.

Run:

```powershell
node --test tests/v1_validator_contract.js tests/glass_tide_demo_contract.js
npm run validate:demo
pwsh ./tests/silk_skill_contract.Tests.ps1
```

## V2 application

Use this path for `v2.next/` source, package import, WORLD, ATLAS, Reader, or rendering behavior. Edit source modules and rebuild the release HTML; do not hand-edit the generated candidate.

```powershell
node v2.next/scripts/build_v2_next.js
npm run test:v2
npm run audit:v2
```

Changes that affect browser behavior need updated real-browser evidence. Do not edit `BROWSER_VALIDATION.json` without running the recorded Playwright flows against the exact candidate SHA.

## Documentation

Keep Japanese and English entry points aligned on commands, version, verified scope, and unproven scope. Check local Markdown links and run:

```powershell
node --test tests/oss_docs_contract.js tests/release_consistency_contract.js
```

## Human evaluation

Human reviewers may evaluate the complete demo, one collection, or one subject by following [USER_EVALUATION_GUIDE.md](USER_EVALUATION_GUIDE.md). Record an actual evaluator label, date, verdict, strongest element, strongest weakness, and requested changes. Never fill a human verdict from an AI self-audit.

## Bug reports

Include all of the following:

- OS and architecture
- Node version
- Exact command or browser steps
- Expected result
- Actual result and complete error output
- Minimal world package, fixture, or screenshot when relevant
- Candidate SHA for V2 browser failures

Remove private world material and credentials before attaching evidence.

## Pull requests

Keep one concern per change when practical. Explain the evidence boundary, list the commands you ran, and call out any check that remains pending. Passing checks are required, but they do not replace human review for creative claims.
