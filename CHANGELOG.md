# Changelog

All notable repository changes are documented here.

## [0.1.0] - 2026-07-15

### Added

- Formal V1 YAML validation with duplicate-ID, reference, approval, queue, claim, and independent-audit checks.
- The generated [Glass Tide](examples/worlds/glass-tide) evidence world, including its prompt, run record, intermediate ledgers, six canonical subjects, five relations, AI self-audit, and an honestly qualified human evaluation record.
- One GitHub Actions workflow covering V1 theory, V1 validation, V2 contracts, and release consistency.
- Japanese and English public entry points, contribution guidance, and evidence-oriented Issue forms.

### Changed

- Made V2 release builds stable across LF and CRLF checkouts.
- Revalidated the V2 candidate in Chromium and tied browser evidence to the current candidate SHA.
- Replaced the PowerShell regex validator with a compatibility wrapper around the Node/YAML implementation.

### Known limits

- Glass Tide is a small demonstration, not proof of long uninterrupted autonomous generation at book scale.
- One low-confidence repository-owner response is recorded; independent human creative-quality review is still required and remains separate from structural validation.
- Multi-model and multi-environment reproducibility has not yet been established.
