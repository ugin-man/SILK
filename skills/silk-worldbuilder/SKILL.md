---
name: silk-worldbuilder
description: Use when a user asks to autonomously build, deepen, expand, complete, revise, or audit a fictional world. Operates as a single-agent weaving system that generates candidate subjects, develops deep vertical packages, forms and rejects meaningful relations, replaces weak concepts without sunk-cost bias, prevents template contagion and premise convergence, and advances the world through evidence-gated maturity levels without using fixed word counts.
---

# SILK Worldbuilder

Treat a world as a fabric of canonical subjects and deliberately chosen relations. Generate points, deepen vertical threads, weave horizontal junctions, cut wrong threads, and repeat at increasing resolution until the world has a durable shape.

Own the entire run as one agent. A single user request starts many internal iterations. Do not ask the user to operate phases, choose routine candidates, or tell you to continue. Ask only when incompatible creative directions would materially change the requested experience and no reversible assumption can preserve progress.

## Load the system

Read these references before creating files:

1. [core-model.md](references/core-model.md)
2. [maturity-loop.md](references/maturity-loop.md)
3. [phase-contracts.md](references/phase-contracts.md)
4. [package-contract.md](references/package-contract.md)
5. [autonomy-and-context.md](references/autonomy-and-context.md)
6. [orchestration-algorithm.md](references/orchestration-algorithm.md)

Load the following when their operation begins:

- Candidate generation: [ideation-engine.md](references/ideation-engine.md)
- Vertical development: [deepening-engine.md](references/deepening-engine.md)
- Load-bearing domain routing: [domain-router.md](references/domain-router.md)
- Rule-bearing systems: [system-design-lens.md](references/system-design-lens.md)
- History and chronology: [history-and-chronology.md](references/history-and-chronology.md)
- Geography and ecology: [geography-and-ecology.md](references/geography-and-ecology.md)
- Map-ready spatial facts and temporal map states: [spatial-registry.md](references/spatial-registry.md)
- Society and institutions: [society-and-institutions.md](references/society-and-institutions.md)
- Culture and language: [culture-and-language.md](references/culture-and-language.md)
- Cosmology and nonhuman subjects: [cosmology-and-nonhuman.md](references/cosmology-and-nonhuman.md)
- Characters and historical agents without plot drift: [characters-and-agents.md](references/characters-and-agents.md)
- Connection work: [weaving-engine.md](references/weaving-engine.md)
- Coherence without one-cause convergence: [coherence-without-convergence.md](references/coherence-without-convergence.md)
- Claims, disagreement, and deliberate mystery: [epistemics-and-mystery.md](references/epistemics-and-mystery.md)
- User canon and approval state: [approval-and-canon.md](references/approval-and-canon.md)
- Dynamic collections and readable views: [taxonomy-and-views.md](references/taxonomy-and-views.md)
- Scale, logistics, and capability stress: [simulation-and-consistency.md](references/simulation-and-consistency.md)
- Adaptive breadth planning: [coverage-planning.md](references/coverage-planning.md)
- Subject weight and depth allocation: [weighting-and-priority.md](references/weighting-and-priority.md)
- Ordinary life and reusable story affordances: [lived-world.md](references/lived-world.md)
- Canonical page readability and documentation quality: [documentation-quality.md](references/documentation-quality.md)
- Identity changes and document growth control: [identity-and-document-hygiene.md](references/identity-and-document-hygiene.md)
- Adversarial review: [interest-and-structural-critic.md](references/interest-and-structural-critic.md) and [anti-convergence.md](references/anti-convergence.md)
- Naming: [naming-and-diversity.md](references/naming-and-diversity.md)
- Drift prevention and stop signs: [failure-modes.md](references/failure-modes.md)
- Independent internal audit routes: [audit-protocol.md](references/audit-protocol.md)
- Worked decision example when the process is unclear: [worked-example.md](references/worked-example.md)
- Adversarial design scenarios for audits: [red-team-scenarios.md](references/red-team-scenarios.md)
- V2 and V3 handoff boundaries: [downstream-contracts.md](references/downstream-contracts.md)
- Post-completion expansion and revision: [maintenance-and-expansion.md](references/maintenance-and-expansion.md)

## Quick routing

| Symptom | Route |
|---|---|
| Name, list, or short summary without inner depth | Deepening Engine and selected domain lens |
| First sibling becoming the category template | Anti-Convergence and Pattern Ledger |
| Local concept spreading across the world | Ideation claim promotion and Scope Ledger |
| Interesting concept with excessive obligations | Structural Critic: accept, promote, rescope, or replace |
| Mature subject isolated or overconnected | Weaving Engine and topology review |
| Subject identity split across files | Core Model and Identity Hygiene |
| World is deep but narrow | Coverage Planning and Scale Completion |
| World is broad but feels unrelated | Coherence Without Convergence |
| Generated work appears user-approved | Approval and Canon Authority |
| Agent wants to stop because context is long | Autonomy, checkpoint, and resume |
- Level promotion and final completion: [scale-and-completion.md](references/scale-and-completion.md)
- Legacy packages: [legacy-migration.md](references/legacy-migration.md)

## Start or resume

For a new world, copy `assets/world-template/` and replace placeholders. For an existing world, read `state.yaml`, registries, active queues, current reports, and only the canonical subjects required by the active work packet.

Record the user's intended experience, supplied canon, exclusions, desired scale, unresolved choices, and reversible assumptions in `world.yaml`. Preserve user canon unless the user authorized revision. Never silently replace supplied canon merely because the critic prefers an alternative.

## Run the nested loom

At each world maturity level, repeat this phase cycle:

1. **Spin:** Generate hypotheses for a real gap. Keep hypotheses outside canon.
2. **Deepen:** Build or revise one vertical package until its important internal questions are answered.
3. **Weave:** Propose, test, accept, reject, or cut horizontal relations.
4. **Challenge:** Judge appeal, purpose fit, scope, explanation debt, copying, convergence, and structural necessity.
5. **Integrate:** Update canonical subjects, registries, views, queues, reports, and the promotion decision.

Do not promote merely because one cycle ended. Repeat phases within the level until its gate passes. If a later audit exposes a foundational weakness, demote the affected subject or world level and repair it.

## Preserve subject integrity

Give every independently identifiable subject exactly one canonical file. A deity's origin, nature, constraints, history, present condition, interpretations, and relationships belong in that deity's canonical file unless another event or concept has independent identity and consequences across multiple subjects.

Treat categories as navigation views, not sources of inherited traits. Resolve relations by stable subject ID, never by file path. Moving a subject between statuses or collections must not break its identity.

Before integrating a subject, assign its readable collection and `display` metadata. Every subject must have `importance`, `visibility_tier`, `label_priority`, `representative`, and `preferred_contexts`; missing display metadata is a package blocker, not a V2 concern to repair later. Judge these values from the subject's actual world responsibility. Do not copy the first sibling's values and do not promote a subject merely to make the ATLAS look balanced.

## Permit destructive editing

Do not protect generated work because effort was spent on it. Choose among `keep`, `deepen`, `rescope`, `merge`, `replace`, and `discard`.

When replacing a concept, extract the job it was meant to perform, preserve only valuable constraints or relations, quarantine dependent claims, create structurally different alternatives, choose the best fit, repair affected subjects, and record `replaced_by` and the reason. Detect rescue cascades: if exceptions and explanatory lore exist mainly to save a weak concept, replace the source concept instead.

## Prevent false breadth

Never generalize one instance into a category rule without an explicit promotion decision. A soul-related ice rite does not make all ice, polar regions, ice deities, or ice creatures soul-related. A personified artifact does not make artifacts normally personified. A globally distributed nuisance creature does not make other creatures global.

Generate possibilities broadly, canonize narrowly, and preserve independent causal roots. Record where important effects do not apply. Shared traits require a shared in-world cause; category membership is not a cause.

## Keep worldbuilding separate from plot

Create agents, incidents, unresolved pressures, and historical outcomes. Do not create chapter plans, scene sequences, protagonist arcs, prescribed quests, or story endings. Express an incident as a reusable world state capable of supporting multiple stories. V3 owns story production.

## Complete honestly

Do not substitute word count, file count, loop count, link count, self-assigned scores, or structural validation for completion. Apply [scale-and-completion.md](references/scale-and-completion.md). Require evidence for subject depth, relation quality, causal breadth, temporal and spatial layers, lived consequences, interest, non-convergence, coherence, and two independent clean audits of the integrated result.

If a structural validator passes but the world remains thin, generic, over-converged, or uninteresting, continue weaving. At delivery, link the overview, catalog, shape report, interest audit, quality report, and world root. State remaining non-critical limitations without presenting a theoretical scaffold as proven creative quality.

Internal completion does not equal user approval. Leave generated subjects under `pending` with `user_status: unreviewed` until the user approves them. Only user action moves them to `approved` or locks them as user canon.
