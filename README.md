# FrankiFlow Website

**FrankiFlow Projects:** This repository is part of the FrankiFlow project family. See [`PROJECT-FAMILY.md`](PROJECT-FAMILY.md) for the shared engineering/agent architecture.

Production source for **FrankiFlow Gebäudereinigung & Objektbetreuung**.

- Production: https://frankiflow.de
- Frontend: static files in `public/`
- Backend/data: Supabase
- Main public calculator: `/preisrechner/`
- Admin: `/admin/`

FrankiFlow does **not** use Stripe Checkout, an integrated payment system, or Netlify Functions. Customer payments are handled outside this website.

## Repository structure

- `public/` — public website, calculator, admin UI, legal pages and SEO pages
- `migrations/` — database schema/setup files kept with the source
- `netlify.toml` — legacy/current Netlify static-host redirects and security headers only; no functions are configured

## Runtime architecture

The website frontend is static. Browser-safe Supabase configuration lives in the public frontend and is used for database reads/writes permitted by Supabase RLS, authentication, storage, and existing Supabase Edge Functions where required.

Service-page hero photos are loaded directly from the public Supabase gallery. Quotation PDF output uses the browser print flow, where users can print or choose **Save as PDF**. No server-side PDF function is required.

## Production deployment rule

`main` is the production branch. Future changes should be made on a temporary `work/<topic>` branch, checked there, and merged to `main` only when the complete batch is ready.

See `DEPLOYMENT.md` for the current workflow.
