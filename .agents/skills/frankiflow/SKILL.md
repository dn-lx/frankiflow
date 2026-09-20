---
name: frankiflow
description: Maintain the FrankiFlow static cleaning website, Preisrechner, bilingual content and browser admin while preserving its existing Supabase architecture. Use for this repository, not FrankiHolz bookings or FrankiFlow Mail.
---

# FrankiFlow maintenance

Follow the root AGENTS.md branch and simplicity rules. Verify the current source before relying on a graph or historical documentation.

## Find the active path

- `public/` is the deployed site. There is no frontend build, Netlify Function, Stripe Checkout or integrated payment system in this repository.
- `public/index.html` and `public/en/index.html` are the homepage entries; service and legal pages have their own HTML entries. Inspect their script tags before changing a similarly named legacy file.
- `public/assets/app.js` imports `app-base.js`, then awaits enhancements, homepage refinements and about navigation in order. `admin.js` similarly layers `admin-base.js`, enhancements, logo settings, CMS and unified UI. Preserve these existing loading relationships.
- `public/preisrechner/index.html` loads `calculator-app-v3.js` as its primary controller. Pricing arithmetic lives in `calculator-engine.js`; `calculator-mobile-island.js` supplies the mobile summary. Do not reconnect the obsolete calculator controllers merely because their files exist.
- `pricing.js` owns the shared Supabase client and pricing fallback; `site-i18n.js` extends `site-i18n-base.js`. Reuse them when applicable.

## Preserve behavior and boundaries

- Pricing must reconcile at cents: per-visit totals, monthly visit count, equipment, VAT, first-month discounts, window-only work and recurring window add-ons have explicit tests. Read `tests/calculator-engine.test.mjs` before changing arithmetic.
- The calculator quotation uses browser print / Save as PDF and waits for images. Keep the enquiry and checklist flows connected to the single controller.
- Preserve both German and English content, language selection, Supabase-managed galleries, CMS overrides and offline pricing/checklist fallbacks.
- Browser configuration contains only public Supabase connection data. Auth, RLS and existing Edge Functions enforce backend permissions; never move service-role credentials into browser files.
- `migrations/` contains SQL history. Hosted Edge Function implementations are not present here: an invocation in browser code is not proof of server behavior. Do not apply migrations, send enquiry emails or mutate live data merely to validate a frontend/tooling edit.

## Verify

From the repository root, run `npm run check` and `npm test`. These require Node.js and no npm dependency installation. For affected UI behavior, serve `public/` locally and check the relevant page, DE/EN language switch, mobile layout and console; exercise calculator print/checklists when touched. Local pages can still connect to the configured Supabase backend, so use authorized test data for write flows.

For navigation across modules, follow `../graphify/SKILL.md`, then confirm the cited source and HTML loading order. A local code graph does not cover hosted Supabase functions, RLS policies or runtime CMS values.
