---
name: posthog-analytics
description: Use PostHog safely for product analytics verification, funnels, feature flags, experiments, replay and release checks while keeping analytics non-authoritative.
---

# PostHog Analytics

Use when FrankiFlow uses PostHog for product analytics, flags, experiments, replay, error investigation or release verification.

Pair with `analytics-contract` whenever events or properties change.

## Connection first

1. Verify the PostHog connector/plugin is actually connected.
2. Perform a harmless read.
3. Confirm the intended project/environment.
4. Confirm permissions.
5. Only then query or modify flags/experiments.

Never claim PostHog verification if the connector action is unavailable.

## FrankiFlow event/privacy rules

Prefer explicit business events such as:
- `homepage_viewed`
- `calculator_viewed`
- `estimate_calculated`
- `estimate_pdf_downloaded`
- `enquiry_submitted`

Do not send names, email addresses, phone numbers, free-form messages, precise addresses, payment data or auth tokens.

PostHog is never authoritative for pricing, enquiries, invoices, email delivery, auth or payments.

## Release verification

When connected:
- verify the correct project/environment,
- verify expected release events arrive without duplicates,
- verify allowed property shapes,
- inspect errors/replay only where privacy permits,
- verify flags have safe defaults and rollback behavior,
- verify analytics failure never blocks the customer flow.
