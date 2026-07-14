# Core model

## Principle

The world is not a folder taxonomy. It is a set of canonical subjects, vertical development histories, and reviewed horizontal relations. Taxonomy is a changeable view over that fabric.

`World` means the setting envelope under construction, not necessarily one planet. It may contain a city, continent, network, dream structure, planes, several worlds, or another topology defined in `scope_envelope`.

## Canonical subject

A subject is anything independently identifiable inside the world: a deity, law, city, species, weather cycle, collective mind, language, artifact, ritual, historical transformation, metaphysical wound, or concept not anticipated by the schema.

Create one canonical file per subject. Put all identity-defining information there:

- what it is;
- what it is not when confusion would spread errors;
- current state;
- origin or formation when known;
- internal structure or operating logic when relevant;
- capabilities and limitations;
- historical changes;
- interpretations and contested claims;
- meaningful relationships;
- unresolved questions.

Keep aliases, hostile names, historical names, and translated names in the canonical subject when they are actually used. Record identity boundaries only when they prevent likely confusion or scope leakage; do not force antonyms and exclusions into every file.

Do not split a deity's roots into a second file merely because `origins` could be a category. Split an event, doctrine, or mechanism only when it has independent identity, affects multiple subjects, or needs its own lifecycle. Keep a summary and relation in the original subject so its canonical file remains understandable by itself.

## Stable identity

Use IDs independent from status, category, and path:

```yaml
id: arnebia.subject.returning_tide
canonical_path: subjects/pending/divine_beings/returning_tide.md
development_status: internally_accepted
user_status: unreviewed
canon_authority: generated
primary_collection: divine_beings
collections:
  - coastal_religion
  - nonhuman_agents
```

Update `subject_registry.yaml` whenever status, path, title, alias, collection, or maturity changes. All relations target the stable ID.

## Category as view

`primary_collection` selects a readable physical location. `collections` provide additional views. Neither grants properties. A subject can move when understanding changes without changing identity.

Create a collection only when it helps users navigate actual subjects. Do not create empty folders or a universal list of gods, nations, cities, factions, species, and magic systems.

## Vertical thread

A vertical thread is the evolving understanding of one subject through origin, change, mechanism, consequence, and present condition. Develop it in a temporary vertical packet, then integrate accepted knowledge into the canonical file. The packet is not a second source of truth.

## Horizontal relation

A relation is a reviewed statement about how two or more subjects affect, constrain, interpret, enable, transform, depend on, or reject one another. Co-location, category membership, and thematic resemblance alone are not relations.

## Junction

Use a junction when an intersection has effects that cannot be represented as a short pairwise relation, such as a conquest connecting a polity, landscape, military order, law, and displaced population. Promote it to a canonical subject only when the junction has independent identity or history.

## Boundary and non-relation

World shape also comes from absent links. Record important rejected relations, non-effect zones, distribution limits, incompatible systems, and subjects deliberately independent from a central premise. Do not record every non-link; record boundaries whose absence prevents likely overgeneralization.

## Status and authority

Use `approval-and-canon.md`. Physical `approved` means user-approved or user-locked, not merely accepted by SILK. Internally accepted generated canon remains in `pending` until human approval. Structural review can reopen generated material; user-locked canon requires a proposal and user authorization.
