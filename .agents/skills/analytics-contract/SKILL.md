---
name: analytics-contract
description: Define privacy-safe, provider-neutral product analytics events and verify their wiring without making analytics authoritative.
---

# Analytics Contract

Use when adding or changing FrankiFlow analytics events, funnels, flags, experiments or instrumentation.

This skill owns the event contract and privacy boundary. PostHog is the current provider, but the contract must remain meaningful without PostHog.

## Event contract first

For every custom event define:
- event name,
- exact trigger,
- business question,
- allowlisted properties and types,
- identity model,
- forbidden/sensitive properties,
- duplicate/retry behavior.

Prefer business events over generic click events.

## FrankiFlow privacy boundary

Do not send customer names, email addresses, phone numbers, free-form messages, precise service addresses, auth tokens, payment details or raw enquiry payloads to analytics.

Allowed properties should be low-cardinality operational context such as source surface, service key, language and deployment environment.

Analytics must never be authoritative for pricing, enquiries, email delivery, invoices, auth, payments or service fulfillment. A PostHog outage must not block the customer flow.

## Verification

For changed instrumentation:
1. verify the event fires only after the intended trigger,
2. verify only allowlisted properties are sent,
3. verify no PII is present,
4. verify duplicate/retry behavior,
5. verify analytics delivery failure is non-blocking,
6. when PostHog is connected, verify the event arrives in the intended project/environment.

Pair with `posthog-analytics` for provider-specific data verification.
