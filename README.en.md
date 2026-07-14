# SILK

[日本語](README.md)

## What SILK is

SILK is a Codex skill for a single AI agent to deepen canonical world subjects, weave only meaningful relations, and cut weak ideas or false connections until an internally complete world package is ready for human review. Each subject has one canonical file, relations use stable IDs, and generated material stays pending until a person approves it.

The repository release is `v0.1.0` and is available under the [MIT License](LICENSE).

## V1

V1 is the generation workflow and world-package format. [SKILL.md](skills/silk-worldbuilder/SKILL.md) coordinates Spin, Deepen, Weave, Challenge, and Integrate from Level 0 through Level 4.

A package stores its manifest, canonical subjects, relations, claims, resumable state, views, and audit reports together. The validator uses a formal YAML parser and checks duplicate IDs, broken references, approval state, completion blockers, and two independent clean audits.

## V2

V2 is a single-file local application distributed as the [public V2 candidate](v2.next/SILK-V2.html). WORLD, ATLAS, Reader, cell editing, package import, and export share one ID space. Build evidence, Node contracts, static audit results, and Chromium evidence are recorded in [release readiness](v2.next/RELEASE_READINESS.md).

## Try it in five minutes

Use Node.js 20 or newer.

```powershell
npm ci
npm run validate:demo
npm run test:v2
npm run audit:v2
```

To install the V1 skill for Codex on Windows:

```powershell
Copy-Item -Recurse -Force .\skills\silk-worldbuilder "$HOME\.codex\skills\silk-worldbuilder"
```

## Public demo

[Glass Tide](examples/worlds/glass-tide) is a small world generated in this release from a prompt about harvesting glass from tides that remember heat. The repository preserves the prompt, Level 0 through Level 4 run record, six subjects, five relations, three claims, work ledgers, AI self-audit, and a low-confidence human evaluation record.

The demo verifies that a small revision 2 package can be generated, recorded, and structurally validated with the formal parser. The repository owner's response was tentatively accepting but explicitly uncertain, so it is not treated as an independent creative-quality pass. All subjects remain in `subjects/pending/` because no human approval has been inferred.

## What is verified

- Required Glass Tide files, YAML syntax, subject/relation/claim references, and completion state
- V1 parser regressions for quoted, multiline, and inline YAML plus duplicate keys and broken references
- Reproducible V2 build, data and rendering contracts, payload budget, and browser-evidence SHA
- Chromium checks for 390 px layouts, keyboard control, XSS text handling, and atomic rollback of invalid imports
- GitHub Actions jobs for V1, V2, and release consistency

Structural validation does not prove creative quality.

## What is not yet proven

- Long uninterrupted autonomous generation at large scale
- Reproducibility across several models and environments
- Creative-quality evaluation by several independent people
- Maintenance of book-scale worlds over long periods

Glass Tide is small execution evidence, not a general proof of grandeur or interest. Long-run validation is tracked in [GitHub Issue #1](https://github.com/ugin-man/SILK/issues/1).

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) documents separate paths for V1 rules and validation, V2, documentation, and human evaluation, with the checks required for each. Bug reports and validation proposals must include reproducible evidence.

## Roadmap

- V1: add long-run executions, independent reviews, and broader semantic validation
- V2: preserve regression evidence for package visualization and editing
- V3: keep story production separate so plot does not leak into V1 worldbuilding

## License

SILK is released under the [MIT License](LICENSE).
