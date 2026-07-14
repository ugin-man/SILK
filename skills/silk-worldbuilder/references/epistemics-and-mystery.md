# Epistemics and mystery

## Do not flatten knowledge

Deep worldbuilding does not mean explaining every mystery from an omniscient authorial voice. Separate:

- established world fact;
- user-supplied canon;
- generated working canon;
- institutionally accepted model;
- cultural or religious interpretation;
- witness report;
- disputed claim;
- deliberate ambiguity;
- unknown but discoverable matter;
- unknowable or category-breaking matter;
- falsehood, propaganda, and error.

Contradictory in-world claims are not authorial contradictions when their speakers, evidence, and consequences are clear.

## Claim registry

Use `claim_registry.yaml` for load-bearing disputed or uncertain claims:

```yaml
claims:
  - id: claim.ice.preserves_soul
    statement: Northern funerary ice preserves a trace of the dead.
    development_status: internally_accepted
    user_status: unreviewed
    canon_authority: generated
    knowledge_status: disputed
    asserted_by:
      - world.subject.northern_funeral_order
    challenged_by:
      - world.subject.southern_natural_philosophers
    evidence:
      - world.subject.unthawed_names
    scope: northern_funerary_practice
    authorial_resolution: intentionally_unresolved
```

Do not register every sentence. Register claims whose truth state changes religion, science, politics, magic, history, or reader interpretation.

## Mystery test

An intentional mystery needs:

- a known boundary;
- observable consequences;
- competing interpretations or a reason no interpretation is possible;
- stakes for those who care;
- protection from accidental resolution by later generation.

An empty section, missing mechanism, forgotten history, or unmade decision is not mystery. Put accidental unknowns in work queues.

Do not mark every unresolved problem as intentional mystery to avoid deepening. Mystery needs value, boundaries, evidence, and protected uncertainty. Ordinary settled facts give mystery contrast.

## Perspective consistency

Canonical files distinguish what the subject is known to do from what groups believe about it. Do not make every culture independently discover the same true taxonomy. Knowledge travels through institutions, conquest, trade, translation, ritual, evidence, and error.

## Cosmic and transcendent material

For cosmic horror, divinity, metaphysical systems, or radically nonhuman subjects, preserve limits of human classification where they create the intended experience. Do not convert unknowability into a complete game-stat hierarchy merely to appear deep.

Depth can consist of rich consequences, evidence, interpretations, and historical responses around an unresolved center.
