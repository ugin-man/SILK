# Spatial registry contract

## Purpose

The spatial registry is the V1-to-V2 contract for maps. It records spatial facts and uncertainty without making a rendered map canonical. Canonical identity, meaning, history, and relationships remain in subject files and registries.

Create spatial registries only when space matters to the requested world. A local city, layered underworld, dream topology, or planar world must not be forced into a planetary globe.

## Files

- `spatial_registry.yaml`: coordinate model and spatial features
- `map_layers.yaml`: world-specific display layers
- `map_snapshots.yaml`: changes by era or phase boundary

## Space model

Choose one primary model:

- `planetary`: wrapping longitude-like horizontal axis; globe projection is possible
- `planar`: bounded or unbounded plane
- `layered`: multiple spatial surfaces connected by routes or portals
- `local`: one settlement, site, island, or similarly bounded area
- `topological`: adjacency and reach matter, but physical distance does not
- `undefined`: spatial facts are intentionally insufficient for a map

Record the choice, reason, scale, coordinate system, wrapping behavior, and layer IDs. A later model change requires a migration decision because coordinates may no longer mean the same thing.

Also record a renderer profile. Supported renderer families are `globe`, `flat_map`, `local_map`, `layer_stack`, `floor_stack`, `system_map`, and `topology_graph`. V1 states what is suitable; V2 decides whether that renderer is implemented. An unavailable renderer falls back to ATLAS and must not coerce the world into a planetary globe.

## Geometry

Use a GeoJSON-like geometry shape with normalized coordinates unless the world supplies authoritative units.

- `Point`: settlement, site, gate, event location
- `LineString`: river, route, border segment, migration path, front
- `Polygon`: region, polity, climate zone, habitat, influence area
- `MultiPolygon`: archipelago, exclave, fragmented distribution
- `Topology`: named adjacency and transitions without metric coordinates

Normalized planar coordinates use `[x, y]` in the inclusive range `0..1`. Planetary normalized equirectangular coordinates use the same range, with `x` wrapping when declared. Never mix normalized, longitude/latitude, and local coordinates without an explicit coordinate-space ID.

## Feature contract

```yaml
- id: spatial.city.elenheim
  subject_id: world.subject.elenheim
  feature_type: settlement
  spatial_role: city_center
  geometry:
    type: Point
    coordinate_space: world_surface
    coordinates: [0.42, 0.31]
  layer_ids: [settlements, political]
  parent_feature_ids: [spatial.polity.lumina]
  valid_from: -842
  valid_to: null
  development_status: internally_accepted
  user_status: unreviewed
  confidence: established
  provenance:
    source_ids: [world.subject.elenheim]
    decision_id: decision.spatial.elenheim-placement
  constraints:
    - downstream of spatial.river.lume
  non_applications: []
  display:
    visibility_tier: 1
    label_priority: 95
    map_role: capital
    always_label_above_zoom: 0.35
```

Required fields are `id`, `subject_id` or `subject_ids`, `feature_type`, `spatial_role`, `geometry`, `layer_ids`, development and user states, confidence, and provenance. A feature may link multiple subjects when it represents a shared border, route, conflict front, or overlapping distribution.

Allowed confidence values:

- `established`: supported by integrated canon
- `provisional`: useful placement under active review
- `disputed`: incompatible in-world or authorial placements are intentionally retained
- `unknown`: location exists but cannot yet be placed

`unknown` geometry uses `type: Unplaced` and a reason instead of invented coordinates.

Spatial display metadata controls map decluttering rather than canon. Capitals, major sites, and load-bearing routes may remain visible at wider zoom, while villages or minor facilities appear only at local zoom. `map_role` never creates lore by itself; it must agree with the canonical subject.

## Spatial manifestations

Do not put abstract or non-spatial subjects directly on the map. Create spatial manifestations where warranted.

- deity -> temple, sacred site, manifestation event, worship distribution
- law -> jurisdiction
- institution -> headquarters, offices, operational reach
- creature kind -> habitat or migration route
- magical principle -> anomaly, resource field, affected zone
- historical event -> event location, route, front, or changed boundary

The feature points back to the stable canonical subject. It does not replace that subject.

## Layer contract

Create only layers supported by the world. Common possibilities include terrain, water, climate, ecology, settlements, political, routes, trade, military, history, belief, and anomalies, but none is mandatory.

Every layer records ID, readable label, role, default visibility, order, supported feature types, and optional exclusivity or zoom guidance. Layer membership controls navigation and rendering only; it grants no inherited lore traits.

## Snapshots

Snapshots record change rather than duplicate full maps. Every snapshot has an ID, label, temporal anchor or phase boundary, base snapshot, changed features, evidence, and approval state.

Allowed changes include `created`, `geometry_updated`, `expanded`, `contracted`, `renamed`, `moved`, `destroyed`, `abandoned`, `rebuilt`, and `disputed`.

V1 phase snapshots describe construction history. In-world temporal snapshots describe world history. Keep their `snapshot_kind` distinct.

## Generation sequence

1. Determine the space model and authoritative constraints.
2. Record relative spatial obligations before exact geometry.
3. Build physical structure only to the required depth.
4. Add ecology, movement, settlement, and political reach where supported.
5. Add historical residues and world-specific spatial manifestations.
6. Audit physics or internal rules, logistics, history, diversity, and canonical IDs.
7. Integrate accepted features and snapshot changes.

Do not generate a complete decorative map before the underlying spatial obligations are stable.

## Audit gates

Before marking geometry `established`, check:

- stable subject references resolve;
- coordinates use a declared coordinate space;
- parent and containment claims agree with canon;
- routes, rivers, barriers, and travel assumptions are compatible;
- settlements have plausible support under world capabilities;
- borders and distributions have causes and limiting factors;
- similar regions are not copies of the first region;
- local phenomena have not spread globally without a promotion decision;
- historical snapshots preserve consequences in later states;
- user approval is not inferred from internal acceptance.

V2 may visualize provisional or disputed geometry, but must label it separately from established and user-approved placement.
