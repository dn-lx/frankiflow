# FrankiFlow GitHub → Netlify workflow

## Branch policy

1. `main` always represents the production website.
2. Start each batch of work from the latest `main` using one branch such as `work/<topic>`.
3. Make and test all related changes on that branch.
4. Do not merge partial work to `main`.
5. When the complete batch is ready, merge the branch into `main` once.
6. Netlify deploys that new `main` commit to production.
7. Delete the finished working branch after merge if it is no longer needed.

## Cost-control rule

Netlify should be configured with `main` as the production branch. Keep automatic branch deploys and deploy previews disabled by default. This prevents every intermediate branch push from consuming a Netlify deployment.

## Before merging to main

Check the homepage, DE/EN pages, Preisrechner calculations, window-only calculations, checklist preview/PDF output, admin login/editing, legal pages, responsive layout, and any changed Stripe/Supabase behavior.
