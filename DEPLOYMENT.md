# FrankiFlow deployment workflow

## Branch policy

1. `main` always represents the production website.
2. Start each batch of work from the latest `main` using one branch such as `work/<topic>`.
3. Make and test all related changes on that branch.
4. Do not merge partial work to `main`.
5. When the complete batch is ready, merge the branch into `main` once.
6. Deploy the resulting `main` static site from the `public/` directory.
7. Delete the finished working branch after merge if it is no longer needed.

## Static hosting

FrankiFlow no longer requires Netlify Functions or any server-side runtime from the frontend host. The host only needs to serve the contents of `public/` and support the desired clean-path redirects/security headers.

The application backend remains Supabase. Browser-safe Supabase configuration is part of the frontend; permissions are enforced with Supabase Auth/RLS.

## Before merging to main

Check the homepage, all DE/EN service pages, Supabase-managed service photos, Preisrechner calculations, window-only calculations, checklist preview, quotation print/Save-as-PDF flow, admin login/editing, legal pages, responsive layout, and changed Supabase behavior.

FrankiFlow has no integrated Stripe/payment workflow, so no Stripe or checkout verification is required.
