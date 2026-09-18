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
