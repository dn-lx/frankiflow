# FrankiFlow V2 Design Brief

V2 is the isolated redesign branch. Do not merge or deploy it to develop/main without explicit approval.

## Product constraints
- Preserve the canonical FrankiFlow logo asset; do not regenerate, recolor or replace the mark.
- Preserve German/English parity and realistic long localized content.
- Preserve Preisrechner calculation/business rules, Supabase pricing configuration, admin behavior, enquiry flows and legal/SEO requirements unless separately authorized.
- Treat current working behavior as a regression baseline.

## V2 workflow
1. Capture current homepage and Preisrechner desktop/mobile baseline.
2. Define visual acceptance criteria and FrankiFlow semantic design tokens.
3. Use the premium-redesign/design-stack flow for direction.
4. Use Figma when visual approval before implementation reduces rework; keep Figma editable and token/component based.
5. Implement in Next.js/component architecture on v2.
6. Add Motion only where interaction/state benefits.
7. Run Impeccable polish against acceptance criteria.
8. Verify DE/EN, desktop/mobile, keyboard/focus, loading/error/validation states, console/network health, accessibility and performance.
9. Regression-check homepage, mobile navigation, admin, Preisrechner, pricing save/load, quote form, legal pages, logo and images before promotion.

Promotion path: v2 review/approval → develop → normal production release workflow.
