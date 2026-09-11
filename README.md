# FrankiFlow

FrankiFlow public website, price calculator and administration interface.

## Development workflow

Production is deployed from `main`. UI and feature changes should be developed on a separate branch and reviewed through a Netlify Deploy Preview before merging.

## Current UI preview work

The draft preview branch `work/ui-fixes-2026-09-11` contains the current review changes, including:

- branded FrankiFlow white-circle favicon
- service-card navigation fixes
- clean service-page hero fallback when no service photo exists
- compact admin logo presentation
- slightly smaller homepage CTA text
- remembered Property & Scope calculator values, defaulting to 80 m² / weekly / 1 month / new customer until the user changes them
- quotation footer with the full FrankiFlow business name and founder line
- removal of the “This calculation is non-binding” sentence from quotation printouts

Do not merge preview work into `main` until the preview has been approved.
