# Working on FrankiFlow

## Branch and scope

Use `develop` for this development workflow. Check the branch and working tree before editing; preserve other people's changes. Do not commit or push to `main`, merge into production, or deploy production as part of ordinary development work. This develop-only instruction takes precedence over the older `work/<topic>` workflow in README.md and DEPLOYMENT.md for this setup.

Read [.agents/skills/frankiflow/SKILL.md](.agents/skills/frankiflow/SKILL.md) when changing this site. For code relationship searches, use [.agents/skills/graphify/SKILL.md](.agents/skills/graphify/SKILL.md). These are repository-local Agent Skills; no application framework or agent SDK is required.

## Simplicity rules (Ponytail-style)

- Trace the active page, imports, and data flow before editing. Reuse existing utilities and project patterns.
- Prefer standard browser APIs and existing dependencies. Add a dependency or abstraction only when a concrete requirement justifies it.
- Make the smallest readable change that fixes the cause. Avoid speculative features, duplicate controllers, and unrelated cleanup.
- Preserve existing validation, authorization, error handling, accessibility, and German/English behavior when simplifying.
- Verify the affected behavior and report checks and limitations. Do not weaken tests to hide a failure.

Keep the static frontend, Supabase boundary, and current hosting layout. Run `npm run check` and `npm test` before committing relevant JavaScript changes. See the project skill for active entry points and manual checks.

## FrankiFlow Projects shared agent stack

This repository belongs to the **FrankiFlow Projects** family. See [PROJECT-FAMILY.md](PROJECT-FAMILY.md) for the shared architecture and [docs/AGENT-ORCHESTRATION.md](docs/AGENT-ORCHESTRATION.md) for Planner → Executor → Reviewer routing.

Use these repository-local skills when relevant:

- [Context7 policy](.agents/skills/context7/SKILL.md) for current third-party API/SDK documentation.
- [Frontend Design](.agents/skills/frontend-design/SKILL.md) for substantial UI/design work.
- [Headroom pilot](.agents/skills/headroom-pilot/SKILL.md) only when large repetitive context is a measurable bottleneck; do not use compressed context as the sole evidence for high-risk logic.

The agentic stack status is tracked in [docs/AGENTIC-STACK-STATUS.md](docs/AGENTIC-STACK-STATUS.md). Current source, tests and accepted ADRs override agent memory, compressed context or stale graph output.

- [Brand Assets](.agents/skills/brand-assets/SKILL.md) is mandatory for logos/icons/documents; reuse repo assets and never generate a replacement mark when an approved asset exists.

## Mandatory release workflow

Before creating or merging a PR, preparing a production release, applying a hotfix, changing deployment rules, or touching `main`, read and follow [Release Workflow](.agents/skills/release-workflow/SKILL.md).

The production rule is strict: **only this repository's `develop` branch may merge into `main`**, and `develop → main` requires the `production-approved` label plus the repository's required checks. Feature, fix, and chore branches merge into `develop`, never directly into `main`.

