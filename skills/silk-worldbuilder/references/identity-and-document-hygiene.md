# Identity and document hygiene

## Stable ID rule

Subject IDs identify the subject, not title, category, path, status, or current interpretation.

```text
<world>.subject.<stable-slug>
```

Do not include a collection such as gods or nations in the ID. Do not reuse a retired ID for a different subject.

## Rename

Keep the ID. Update canonical title, aliases, registry, path when useful, views, and references. Preserve old names as aliases only when readers or inhabitants may use them.

## Move or reclassify

Keep the ID. Update canonical path, primary collection, secondary collections, registry, and generated views. Relations remain stable.

## Rescope

Keep the ID when the subject remains the same and only reach changes. Update scope ledger, affected relations, claims, canonical text, coverage obligations, and maturity gates.

## Merge

Choose the surviving canonical identity according to what inhabitants and readers would recognize. Redirect retired IDs in the registry, merge unique information, reconcile relations and approval authority, and discard the redundant canonical file with a merge record.

Do not silently concatenate two files and preserve contradictions.

## Split

Split only when distinct independently referable subjects have emerged. Decide whether the original remains an umbrella subject or retires. Create new stable IDs, distribute relations and claims deliberately, preserve summaries, and reopen classification and maturity review.

## Replace

A structurally different replacement receives a new ID. Do not overwrite the old file as if it had always been the new concept. Move the old subject to discarded, record `replaced_by`, repair dependents, and preserve user approval history.

## File creation gate

Before creating a file, ask:

- Is this independently identifiable?
- Can a reader reasonably link to it?
- Does it have its own state, lifecycle, or multi-subject consequences?
- Would placing it in an existing canonical file preserve understanding?
- Is this a temporary reasoning artifact rather than lore?

Create a canonical file only when independent identity wins.

## Temporary packets

Vertical, junction, hypothesis, audit, and change packets are process artifacts. After integration:

- move accepted lore into canonical subjects and registries;
- close queue obligations;
- mark the packet closed;
- retain only decisions needed for audit or resumption;
- archive or remove redundant exploratory prose;
- never cite a closed packet as canon.

Compact old process artifacts according to `autonomy-and-context.md`; preserve decisions and authority history rather than every chain-of-thought-like exploration.

## Generated views

Views repeat only IDs, titles, concise summaries, status, maturity, and relation explanations. They do not introduce lore. Regenerate after changes instead of manually reconciling competing narratives.

Canonical Markdown may contain generated clickable paths next to stable IDs. Treat those paths as derived navigation. Relation registry and stable IDs remain authoritative, and Integration refreshes every affected inbound path.

## Discarded material

Retain discarded material when it records a meaningful rejected direction, user decision, replacement dependency, or future reactivation condition. Do not preserve every weak hypothesis as a file.

## Registry summary

Keep compact fields needed for context selection and audits: title, path, development and user states, authority, collections, weight, maturity, scope, one-sentence summary, intended role and appeal, causal roots, and optional pattern tags. The registry is an index, not a second lore body.

Pattern tags support comparison and retrieval only. They do not create inherited properties or replace the reasoning recorded in canonical subjects.
