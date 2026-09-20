# Project Memory — FrankiFlow

## Identity

FrankiFlow is the cleaning/service website, public price calculator and browser administration product for FrankiFlow Gebäudereinigung & Objektbetreuung. It belongs to the FrankiFlow Projects family.

## Durable rules

- GitHub is the engineering source of truth.
- `develop` is the development integration branch; `main` is production.
- Feature/fix/chore branches merge into `develop`, never directly into `main`.
- Preserve the static frontend, existing Supabase boundary, hosting layout, validation, authorization, accessibility and German/English behavior unless an explicitly approved change requires otherwise.
- Reuse approved brand assets; do not invent replacement logos/icons when canonical assets already exist.
- Prefer the smallest complete change and avoid unrelated refactors or new dependencies.
- Runtime secrets and credentials never belong in source control.

## Read before specialized work

- Project skill: `.agents/skills/frankiflow/SKILL.md`
- Release workflow: `.agents/skills/release-workflow/SKILL.md`
- Quality gates: `.agents/skills/quality-gates/SKILL.md`
- Security boundary review for auth/Supabase/storage/customer data
- Brand assets skill for logos/icons/documents
- `PROJECT-FAMILY.md` and `docs/AGENT-ORCHESTRATION.md` for shared architecture

## Continuity rule

Durable project facts belong here, in ADRs, or in Agent Skills. Temporary task state belongs in `docs/CURRENT-HANDOFF.md`. Chat/session memory is supplementary and must never override current source, tests or accepted decisions.
