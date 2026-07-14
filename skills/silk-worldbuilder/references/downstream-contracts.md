# Downstream contracts

## V2 visual atlas

V2 reads `manifest.yaml`, stable subject IDs, dynamic collections, subject paths, relation and claim registries, status, approval state, maturity, generated views, and reports.

V2 must:

- treat collections as dynamic labels and views;
- distinguish development state from user approval;
- resolve edges by stable ID;
- show relation summaries and direction;
- show disputed claims separately from authorial facts;
- display canonical subject content as the source of truth;
- avoid writing lore into generated indexes;
- preserve redirects after rename, move, merge, split, and replacement.

V2 must not infer common properties from category membership or turn a visualization layout into the world ontology.

## V3 story accumulation

V3 uses user-approved canon by default. It may use internally accepted pending material only when the user explicitly allows provisional canon.

V3 reads current pressures, agents, places, relations, boundaries, historical residues, and knowledge differences to find many possible stories. It does not require SILK V1 to preselect a protagonist or plot.

New details created by stories are story-local until reviewed. They return to SILK as hypotheses with provenance, not automatic canon. SILK then deepens, challenges, weaves, and seeks user approval through the normal loop.

## Canon feedback

```yaml
story_candidate:
  source_story: <story-id>
  proposed_subject_or_change: <summary>
  affected_ids: []
  contradiction_risk: []
  status: hypothesis
```

Popular, repeated, or emotionally effective story details do not bypass scope, convergence, canonical-subject, or approval rules.

## Version boundary

Downstream tools record the manifest format they consumed. Breaking schema changes require a new format version or migration path. World content changes continue to use stable IDs and decision history.

