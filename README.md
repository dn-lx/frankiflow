# FrankiFlow Website

Production source for **FrankiFlow Gebäudereinigung & Objektbetreuung**.

- Production: https://frankiflow.de
- Hosting: Netlify
- Backend: shared Supabase project **FrankiFlow & FrankiHolz Backend**
- Payments: Stripe Checkout through server-side Netlify Functions
- Main public calculator: `/preisrechner/`
- Admin: `/admin/`

## Repository structure

- `public/` — public website, calculator, admin UI, legal pages and SEO pages
- `netlify/functions/` — server-side Stripe functions
- `migrations/` — database schema/setup files kept with the source
- `netlify.toml` — Netlify publish, functions, redirects and security headers

## Production deployment rule

`main` is the **production branch**. Netlify should deploy production only from `main`.

Future changes must be made on one temporary working branch, for example:

`work/2026-09-calculator-improvements`

Keep all related changes on that branch until they are finished and checked. Only then open/complete a pull request into `main`. Merging to `main` is the production release event and should cause one Netlify deployment.

Do not use `main` for incremental experiments. To save Netlify build/deploy credits, disable automatic branch deploys and deploy previews in Netlify unless a preview is specifically needed.

See `DEPLOYMENT.md` for the exact workflow.

## Netlify settings

- Production branch: `main`
- Build command: none
- Publish directory: `public`
- Functions directory: `netlify/functions`

The directories are also declared in `netlify.toml`.

## Secrets

Browser-safe Supabase values may exist in public configuration. Private credentials must remain in Netlify environment variables and must never be committed, including:

- Supabase service/secret key
- Stripe secret key
- Stripe webhook signing secret
