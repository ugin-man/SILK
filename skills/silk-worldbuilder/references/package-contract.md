# World package contract

## Layout

```text
<world>/
  manifest.yaml
  world.yaml
  state.yaml
  taxonomy.yaml
  subject_registry.yaml
  relation_registry.yaml
  claim_registry.yaml
  spatial_registry.yaml
  map_layers.yaml
  map_snapshots.yaml
  completion.yaml
  subjects/
    approved/<primary_collection>/*.md
    pending/<primary_collection>/*.md
    discarded/<primary_collection>/*.md
  workspace/
    hypothesis_pool.yaml
    change_set.yaml
    expansion_queue.yaml
    weave_queue.yaml
    replacement_queue.yaml
    non_relation_ledger.yaml
    scope_ledger.yaml
    maturity_ledger.yaml
    coverage_map.yaml
    pattern_ledger.yaml
    causal_root_ledger.yaml
    vertical_packets/*.md
    junction_packets/*.md
    audits/*.md
    contradiction_log.md
    decision_log.md
    iteration_log.md
  views/
    catalog.md
    by_status.md
    relation_map.md
    claims.md
    comparison_matrix.md
  reports/
    world_overview.md
    shape_report.md
    interest_audit.md
    quality_report.md
    review_packet.md
```

Create status and collection directories only when they contain a subject. `views/` are generated navigation artifacts; canonical content lives only in `subjects/`.

Use the reusable contracts under `assets/templates/`. They define stable metadata and decision shape, not category-specific content fields.

## world.yaml

Record world ID, title, intent, intended appeals, desired scale, supplied canon, constraints, exclusions, reversible assumptions, and status. Distinguish user canon from generated canon.

## manifest.yaml

Provide stable package entry points for humans and V2:

```yaml
format: silk-world-v1
revision: 2
world_id: <world-id>
world_status: building
world_level: 0
user_approval_state: unreviewed
entrypoints:
  overview: reports/world_overview.md
  catalog: views/catalog.md
  by_status: views/by_status.md
  relation_map: views/relation_map.md
  claims: views/claims.md
  shape_report: reports/shape_report.md
  interest_audit: reports/interest_audit.md
  quality_report: reports/quality_report.md
  review_packet: reports/review_packet.md
registries:
  subjects: subject_registry.yaml
  relations: relation_registry.yaml
  claims: claim_registry.yaml
  spatial: spatial_registry.yaml
  map_layers: map_layers.yaml
  map_snapshots: map_snapshots.yaml
```

Update the manifest after level, status, approval state, or entrypoint changes. Counts may help navigation but never prove quality.

Revision `1` adds the optional spatial, map-layer, and map-snapshot registry entry points. Revision `0` packages remain valid non-spatial packages; consumers must not interpret their missing spatial registries as empty geography.

Revision `2` makes collection and display labels mandatory for every newly integrated subject. Older packages may be migrated without changing subject prose. V2 consumers may derive temporary fallback labels for inspection, but release validation must reject missing or out-of-range display metadata.

## state.yaml

Record world level, phase, active packet, active change set, iteration, next action, promotion blockers, and last integrated state. This is the authoritative resume point.

## taxonomy.yaml

```yaml
collections:
  - id: dragon_ecology
    label: 龍の生態と移動
    role: 龍の移動と繁殖が土地利用を変える仕組み
    weight: primary
    reason: 世界の主要な生態圧力を探しやすくする
    aliases: []
```

Each collection records `id`, `label`, `role`, `weight`, `reason`, and optional aliases. IDs use lowercase ASCII letters, digits, and underscores; labels use the world's and user's readable language. It grants no inherited traits. Collections may be created, merged, renamed, or retired without changing subject identity.

## subject_registry.yaml

One row per stable subject ID:

```yaml
subjects:
  - id: world.subject.returning_tide
    title: Tide That Does Not Return
    canonical_path: subjects/pending/divine_beings/returning_tide.md
    development_status: internally_accepted
    user_status: unreviewed
    canon_authority: generated
    primary_collection: divine_beings
    collections: [coastal_religion, nonhuman_agents]
    maturity_level: 3
    weight: load_bearing
    aliases: [The Offshore Silence]
    summary: A northern divine presence used to legitimate coastal rule.
    intended_role:
      - carry the coastal legitimacy tradition
    intended_appeal:
      - solemn grandeur
    causal_roots:
      - world.subject.first_withdrawal
    pattern_tags:
      - regional_divine_legitimacy
    display:
      importance: 82
      visibility_tier: 1
      label_priority: 90
      representative: true
      preferred_contexts: [atlas_overview, atlas_focus]
```

`display.importance` is a `0..100` world-structural importance score, not popularity, file length, or visual preference. `visibility_tier` is `0..4`, where `0` is eligible for the widest overview and `4` appears only in local focus, evidence detail, or search. `label_priority` resolves collisions independently from importance. Stable hashes may break layout ties but must not invent semantic importance.

`preferred_contexts` must contain at least `atlas` or `reader`; use more specific values such as `atlas_overview`, `atlas_focus`, or `map` only when they are supported. A collection assignment and display label are required even when a subject has no spatial manifestation. Geography remains optional.

Legacy Markdown packages use the equivalent flat keys `display_importance`, `display_visibility_tier`, `display_label_priority`, `display_representative`, and `display_contexts`. Exporters normalize those keys into the nested `display` object. This compatibility form exists only for the legacy phase scripts; new skill packages use the nested contract above.

## Canonical subject file

Universal metadata stays small:

```yaml
---
id: world.subject.returning_tide
title: Tide That Does Not Return
aliases: []
development_status: internally_accepted
user_status: unreviewed
canon_authority: generated
primary_collection: divine_beings
collections:
  - coastal_religion
weight: load_bearing
maturity_level: 3
scope: regional
summary: A northern divine presence used to legitimate coastal rule.
relation_ids:
  - relation.returning_tide.coastal_crown
open_questions: []
identity_boundaries: []
display:
  importance: 82
  visibility_tier: 1
  label_priority: 90
  representative: true
  preferred_contexts:
    - atlas_overview
    - atlas_focus
---
```

The body is subject-specific. Include a clear overview, present condition, relevant formation or origin, operating logic, limitations, meaningful history, interpretations, relationships with summaries, and intentional unknowns as needed. Do not create empty universal headings.

The file must remain understandable without following every relation. Related files add depth; they do not hold the subject's missing identity. Physical `approved` is reserved for `user_status: approved` or `locked`; internally accepted generated subjects remain under `pending`.

Integrate display metadata only after judging the subject's actual responsibility in the world. Derive it from load-bearing role, accepted causal responsibility, cross-collection junctions, current consequence, and user-declared centrality. Supporting-only, replaced, or discarded subjects normally receive lower visibility. Explicit user overrides take precedence and are recorded as decisions.

## relation_registry.yaml

Relations store stable IDs, source, target, type, summary, effects on each side, origin, scope, development status, user status where separately reviewed, and optional temporal bounds. Canonical subjects list relevant relation IDs and summarize important connections in their bodies.

## claim_registry.yaml

Track only load-bearing disputed, perspective-bound, intentionally unresolved, or false claims. Record statement, development and user states, authority, knowledge status, asserting and challenging subjects, evidence, scope, and authorial resolution. Ordinary settled facts remain in canonical subjects.

## Spatial registries

Use [spatial-registry.md](spatial-registry.md) when the world has meaningful physical, layered, local, or topological space. `spatial_registry.yaml` stores map-ready spatial facts keyed to stable subject IDs. `map_layers.yaml` defines only the layers this world needs. `map_snapshots.yaml` records temporal changes without overwriting present or historical canon.

Spatial registries are optional for worlds whose space is intentionally undefined. When omitted, record the reason in `world.yaml` and do not fabricate geography merely to satisfy V2. A rendered map is a derived view, never canonical evidence by itself.

## Work queues

Every queue item records ID, level, phase, target, reason, priority, dependencies, and evidence-based `done_when`. Queue files cannot hide vague tasks such as `deepen world` or `make interesting`.

## completion.yaml

Record world level, clean audit streak, critical gaps, dimension verdicts, evidence locations, unresolved non-critical limitations, and completion status. Every dimension has its own evidence list containing stable IDs and artifact paths. A passing string without cited evidence is invalid.

## Views

`catalog.md` groups subjects by dynamic collection and shows approved, pending, and discarded entries with short reasons. `by_status.md` gives status-first navigation. `relation_map.md` lists important relations and junctions. Regenerate views after integration; do not hand-edit them as alternate canon.
