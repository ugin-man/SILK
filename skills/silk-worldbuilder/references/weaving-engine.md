# Weaving engine

## Purpose

Connect vertical threads only when the relation changes understanding or behavior. World shape is produced by accepted relations, rejected relations, boundaries, and independent roots.

## Relation proposal

Record:

```yaml
id: relation.dragon_conquest.tax_rights
source: world.subject.northern_kingdom
target: world.subject.dragon_order
type: granted_autonomy_to
summary: The first conquest granted the order taxation rights that outlived the original threat.
effects_on_source:
  - The crown cannot tax the frontier directly.
effects_on_target:
  - The order survives despite reduced dragon attacks.
origin: world.subject.first_dragon_conquest
scope: regional
development_status: internally_accepted
user_status: unreviewed
```

A relation needs a reason, direction or reciprocity, scope, and observable effect. The same place, era, category, element, aesthetic, or keyword is not enough.

## Relation review

Ask:

- Does at least one subject change because of this relation?
- Does the other subject constrain, interpret, enable, transform, exploit, resist, or depend on that change?
- Is the relation already part of one subject and too small for a registry entry?
- Does the proposed link merely repeat the central premise?
- Would cutting it preserve more independence and breadth?
- Does it create obligations elsewhere, and are they worth accepting?

Use `keep`, `deepen`, `rescope`, `cut`, or `promote_to_junction`.

Before adding a relation, inspect existing source-target relations and junctions. Merge semantic duplicates, preserve distinct temporal phases when they change, and avoid recording both a relation and a junction as separate versions of the same effect.

Canonical `relation_ids` list only active internally accepted or user-approved relations. Cut and rejected relations move to the non-relation or decision record and must not keep discarded design subjects active through the graph.

## Junction packet

Use a junction packet for intersections among several vertical threads:

```yaml
id: junction.first_conquest.frontier_order
subjects:
  - world.subject.northern_kingdom
  - world.subject.dragon_order
  - world.subject.cinder_frontier
  - world.subject.frontier_tax
trigger: world.subject.first_dragon_conquest
changes:
  - The order receives temporary taxation rights.
  - The frontier develops a parallel court.
  - Later monarchs inherit a jurisdictional conflict.
present_pressure:
  - The military need declined but the parallel court remains.
```

Integrate each effect into affected canonical files. Promote the junction itself to a canonical subject only when inhabitants can identify it as an event, settlement, treaty, institution, process, or other independent subject.

## Non-relation ledger

Record likely but rejected generalizations when their absence shapes the world:

```yaml
- source: world.subject.northern_soul_ice
  target: world.subject.southern_polar_cap
  expected_relation: shares_soul_properties
  verdict: rejected
  reason: The northern effect belongs to a funerary technique, not ice as a substance.
```

Do not record arbitrary pairs. Record boundaries that future generation is likely to violate.

## Topology review

Inspect the whole fabric for:

- isolated load-bearing subjects;
- one supernode with unjustified influence;
- dense clusters with no bridge to lived reality;
- connections that all repeat one semantic relation;
- regions or eras existing only as names;
- missing feedback, delay, adaptation, or unintended consequence;
- absence of independent causal roots;
- links whose removal changes nothing.

Do not optimize for maximum density. A good fabric contains clusters, bridges, boundaries, asymmetry, and empty space.
