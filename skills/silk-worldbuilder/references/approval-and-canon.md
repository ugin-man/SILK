# Approval and canon authority

## Separate three decisions

Do not merge development state, provisional canon acceptance, and user approval.

```yaml
development_status: internally_accepted
user_status: unreviewed
canon_authority: generated
```

Development states are `working`, `internally_accepted`, `replace`, and `discarded`. User states are `unreviewed`, `approved`, `changes_requested`, and `locked`.

`locked` means user-supplied or explicitly protected canon. SILK may identify problems and propose alternatives but cannot overwrite it without approval.

## Physical status

- `subjects/approved/`: only user-approved or user-locked subjects.
- `subjects/pending/`: working, internally accepted, unreviewed, or changes-requested subjects.
- `subjects/discarded/`: generated non-canon and user-rejected material with reasons.

Internal completion can occur while all generated subjects remain under `pending`. Stable IDs prevent relations from breaking when approval moves files.

## World states

- `building`: internal work remains.
- `internally_complete`: SILK's theoretical gates pass; user review has not completed.
- `changes_requested`: user review reopened work.
- `user_approved`: user accepted the intended approval scope.

Do not label `internally_complete` as user-approved completion.

## Review packet

Generate `reports/review_packet.md` with intended experience, assumptions, load-bearing subjects, major replacements, controversial scope or mystery decisions, important relations and boundaries, internally accepted subjects grouped by collection, non-critical limitations, and exact evaluation paths.

The user may approve the whole package, selected collections, or individual subjects. Record approval scope and date in the decision log.

After approval, move affected files, update subject, relation, and claim authority fields, regenerate Markdown paths and status views, and synchronize manifest approval state. Stable IDs remain unchanged.

## Changes requested

When the user rejects or revises a subject, reopen affected relations, vertical packets, maturity gates, reports, and dependent internally accepted material. User rejection is not merely a rename request unless stated.

Separate local feedback from reusable taste evidence. If the user rejects one name, change that subject. If the reason reveals a broader dislike such as explanatory names, uniform coined terms, forced twists, or template-like institutions, update `taste_profile` and `pattern_ledger.yaml`, then audit other affected subjects. Do not generalize a single preference beyond the user's stated reason.
