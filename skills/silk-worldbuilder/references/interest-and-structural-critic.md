# Interest and structural critic

## Role

Review the artifact as an unsentimental editor. Do not defend a concept because it was difficult to generate, already has dependents, or can be rescued with more lore.

The critic is not a novelty detector. Familiar subjects can be powerful. A great ice deity can remain an ice deity; a dragon-slaying order can remain a dragon-slaying order. Judge whether the intended appeal has been realized, not whether the trope has been subverted.

## Artifact-first review

During the first critique pass, read the user intent, canon locks, canonical subject, direct relations, and necessary world context. Do not use generation effort, private rationale, discarded wording, or planned future fixes as evidence that the artifact works.

Write the verdict, strongest successful element, strongest failure, and strongest case for replacement before proposing repairs. This prevents repair ideas from becoming excuses for keeping the subject.

Do not use a single numeric interest score. Require concrete evidence and a decision. State uncertainty when taste depends on user judgment, but do not use subjectivity to avoid an internal verdict.

## Intended appeal

State what the subject is trying to offer: grandeur, terror, beauty, clarity, heroic directness, mystery, intimacy, humor, strangeness, familiarity, social texture, conceptual fascination, or another experience.

Calibrate against the user's `taste_profile`, supplied examples, disliked tendencies, and the world's intended experience. When examples are works such as D&D or the Cthulhu Mythos, abstract the desired qualities such as breadth, layered history, mystery, usability, or accumulation potential. Do not copy protected names, distinctive expressions, plots, or setting-specific structures.

Taste evidence guides judgment but is not a generation template. Do not repeat previously approved structures merely because they were liked. Preserve room for candidates that satisfy the deeper desired experience through unfamiliar means.

Do not rewrite `intended_role` or `intended_appeal` after seeing the artifact merely to make it pass. A better emergent direction may justify changing the intention, but record the old intention, failure or discovery, new intention, affected subjects, and user-canon impact as a design decision, then re-audit under the new target.

Judge:

- Is the appeal perceptible in the actual material?
- Can a reader imagine presence, behavior, consequence, or use?
- Is important material still an abstract label or list?
- Does the subject earn attention proportional to its importance?
- Does world context strengthen it?
- Has cleverness, forced ambiguity, cost, or reversal damaged its direct appeal?

Do not require every power to have a tragic cost, every institution an internal conspiracy, every history a secret truth, or every familiar concept a twist.

## Composition and rhythm

Judge interest at subject and world levels. Load-bearing subjects should earn sustained attention. Supporting and texture material can be useful, clear, stable, ordinary, or quiet. A world where every object hides a secret and every institution faces collapse has no contrast.

Inspect variation in intensity, familiarity, mystery, stability, scale, and emotional register. Preserve resting places and competent systems when they strengthen the whole. Do not excuse a load-bearing subject as intentionally quiet when it is merely unfinished.

## Structural fitness

Judge separately:

- Does the subject perform the role it was created for?
- Is its blast radius appropriate?
- Does it create explanation debt outside its intended scope?
- Does it occupy conceptual space needed by other subjects?
- Does it force the world to reorganize around a minor idea?
- Is it independently valuable, or only a repair for another weak concept?

An interesting concept can still be wrong for this world or wrong at this scale.

Complexity and broad reach are not failures by themselves. A world-law concept may deserve extensive consequences when it is load-bearing and its payoff justifies the investment. Choose among accepting the obligations, promoting the concept to the world core, narrowing it, or replacing it.

Do not prefer replacement merely because the alternative is easier to integrate. A replacement should preserve or strengthen the intended appeal while improving fit. If the risky concept is the most compelling center of the world, reorganize around it deliberately rather than sanding it down.

## Verdicts

- `keep`: intended appeal and structural role are realized.
- `deepen`: the core is worth preserving but important expression is thin.
- `rescope`: retain the concept but narrow or expand its application explicitly.
- `merge`: the subject lacks independent identity and belongs in another canonical file.
- `replace`: its intended job is valuable but the current concept is a poor vehicle.
- `discard`: neither the concept nor its job warrants continued complexity.

## Radical replacement protocol

1. State the original intended job.
2. List the current concept's useful constraints, images, and relations.
3. List scope mismatch, explanation debt, weak appeal, convergence, and dependent claims.
4. Quarantine dependent claims; do not rewrite them yet.
5. Generate alternatives that solve the job through structurally different means.
6. Compare fit, appeal, scope, debt, and integration value.
7. Select an alternative or remove the job.
8. Rewrite affected canonical subjects and relation records.
9. Move the old concept to `discarded` with `salvaged_elements`, `replaced_by`, and reason.
10. Reopen affected maturity gates.

Reject replacement candidates that are structurally cleaner but imaginatively weaker unless the user's priorities favor that tradeoff.

## Rescue cascade

Flag a rescue cascade when:

- exceptions are added mainly to contain an overbroad claim;
- new history exists mainly to justify an arbitrary restriction;
- each repair creates another repair dependency;
- the original intended role becomes smaller than its support lore;
- removing the source concept would simplify several weak subjects at once.

Replace the source concept when its payoff does not justify the rescue debt. Do not confuse complexity already written with value.

## Critique record

```yaml
subject: world.subject.name_deity
verdict: replace
intended_role:
  - express local belonging
works:
  - divine recognition of community membership
fails:
  - supernatural naming implies world-scale consequences
  - local religion cannot contain the blast radius
salvage:
  - belonging is ritually recognized
replacement_goal:
  - preserve local identity without making names a universal law
```
