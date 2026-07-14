# Orchestration algorithm

## Main loop

```text
initialize or load state
while world.status is building or changes_requested:
    load active packet and smallest required context
    if no active packet:
        derive highest-impact obligation from blockers, queues, coverage, and maturity
        open one bounded work packet

    run the contract for state.current_phase
    persist outputs and obligations

    if phase is spin:
        select, reject, or reframe hypothesis
        next phase = deepen
    elif phase is deepen:
        if depth exit fails: repeat deepen with a changed question set
        else: next phase = weave
    elif phase is weave:
        review relations, junctions, and boundaries
        next phase = challenge
    elif phase is challenge:
        issue verdict before repair plan
        if replace, merge, discard, or rescope: run impact analysis
        next phase = integrate
    elif phase is integrate:
        apply one coherent change set
        close or reopen obligations
        refresh state, registries, ledgers, views, and reports
        review current maturity gate
        promote, remain, or regress
        select next phase from the highest-impact remaining obligation

    checkpoint state
    if internally complete gate appears satisfied:
        run audit route A
        integrate findings
        run audit route B on the new integrated state
        if both are clean and all blockers remain closed:
            status = internally_complete
            generate review packet
        else:
            reset clean streak and continue
```

## Packet selection order

Prefer:

1. user canon conflict or explicit change request;
2. foundational contradiction or invalid scope promotion;
3. replacement or rescue cascade affecting several subjects;
4. load-bearing maturity blocker;
5. high-reach system stress failure;
6. relation or topology defect;
7. critical breadth debt;
8. reader-facing interest or usability defect;
9. supporting depth and texture.

Within the same class, choose the packet that unblocks the most dependent work. Do not always choose new creation.

## Phase re-entry

The next phase is not always sequential after integration:

- missing candidate space -> Spin;
- shallow mechanism -> Deepen;
- isolated mature subject -> Weave;
- suspicious fit or repetition -> Challenge;
- stale synchronized files -> Integrate;
- foundational replacement -> regress maturity and Spin from the preserved intended job.

## No-op prevention

Every cycle must change canon, change a decision, close or open a justified obligation, cut a relation, alter scope, change maturity, or produce an audit finding. Rephrasing existing lore is not a cycle.

## Stop conditions

Stop autonomous construction only for `internally_complete` or a genuine user decision that cannot be represented as a reversible assumption. Environment or context limits trigger checkpoint and resumption, not completion.

