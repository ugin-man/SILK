# Nested maturity loop

## Two coordinates

Track world maturity and current operation separately:

```yaml
world_level: 1
current_phase: deepen
```

World level describes resolution. Phase describes work being performed at that resolution.

## Level 0: Seed

Establish the intended experience, hard boundaries, promising initial pressure, and a small hypothesis pool. Determine whether the starting idea can generate a world without forcing it into canon unchanged.

Promotion requires a viable seed, a clear intended appeal, a plausible scope, and more than one possible vertical direction.

## Level 1: Skeleton

Select the first load-bearing subjects and independent causal roots. Establish a provisional dynamic taxonomy and broad spatial or conceptual boundaries. Do not fill one node per category.

Promotion requires a recognizable world skeleton, no mandatory stock-fantasy categories, no single seed explaining every primary subject, and explicit vertical packets for the most important gaps.

## Level 2: Systems

Deepen load-bearing systems and subjects: magic, polity, religion, ecology, technology, language, history, or unknown world-specific structures. Establish mechanisms, limits, variation, history, institutionalization, and lived consequences as relevant.

Promotion requires primary vertical packets to be integrated, important systems to survive exploit and edge-case review, history to alter the present, and accidental template inheritance to be removed.

## Level 3: Woven world

Build reviewed junctions across vertical threads. Develop second-order effects, regional interpretations, disagreements, adaptations, and boundaries. Cut unjustified links and reduce central-premise gravity.

Promotion requires meaningful cross-domain fabric, multiple independent causal roots, no relation supernode that explains the world by itself unless explicitly intended, and evidence that important non-connections are preserved.

## Level 4: Spherical world

Inspect the world from multiple scales and perspectives: global and local, past and present, rulers and ordinary people, center and edge, human and nonhuman, official account and disputed memory, extraordinary systems and mundane life.

Completion requires the full contract in `scale-and-completion.md`. Level 4 is not a permanent guarantee; foundational revision can demote affected subjects.

## Repeating phases

Run every level through:

1. `spin`: create competing hypotheses for a real gap;
2. `deepen`: develop one or more vertical packets;
3. `weave`: test relations and junctions;
4. `challenge`: keep, deepen, rescope, merge, replace, discard, or cut;
5. `integrate`: update canon, registries, views, queues, reports, and promotion state.

Repeat phases within a level. Do not advance after a fixed number of cycles.

## Subject-level maturity

Subjects can be at different levels:

```yaml
subject_levels:
  arnebia.subject.northern_kingdom: 3
  arnebia.subject.dragon_order: 3
  arnebia.subject.magic_foundation: 2
  arnebia.subject.western_islands: 1
```

World level is bounded by load-bearing subjects, not the average of every minor subject. A narrow texture subject may intentionally remain shallow. A load-bearing subject cannot.

### Subject Level 0: Hypothesis

The possible subject has a proposed job, appeal, scope, and identity question but is not canon.

### Subject Level 1: Identified

The subject has independent identity, a reason to exist in this world, provisional boundaries, weight, collection, and a canonical-file plan. It is more than a name but remains structurally thin.

### Subject Level 2: Developed

Relevant operating logic, formation, limitations, history, lived consequences, interpretations, or other selected deepening lenses are answered. Important unknowns are classified. Load-bearing systems survive initial edge-case review.

### Subject Level 3: Woven

Meaningful relations, junctions, boundaries, regional or temporal variation, and second-order effects are integrated. Scope and template audits pass. The subject changes and is changed by the world without losing independence.

### Subject Level 4: Curated

The canonical page is self-sufficient and readable, intended appeal is realized, related items are navigable, claims and approval state are clear, destructive alternatives were considered where necessary, and both world audit routes can use it as reliable evidence.

A subject cannot skip missing lower-level obligations by adding relations or polished prose.

## Regression

Demote a subject when later work reveals a false premise, scope mismatch, rescue cascade, severe contradiction, template cloning, or missing mechanism. Demote the world only when the flaw changes its load-bearing shape. Never preserve a level label at the cost of the world.
