# Legacy Drive Snapshot — FrankiFlow Ecosystem – Current Product & System Documentation

> Imported into GitHub on 2026-09-18. This file is retained for historical/reference context only. Current source code, tests, ADRs, and maintained GitHub documentation override this snapshot where they differ. Do not put secrets into this file.

---

FrankiFlow Ecosystem – Current Product & System Documentation
Living technical and operational reference
Last updated: 15 September 2026


AUTHORITATIVE CURRENT STATE — 15 SEPTEMBER 2026
This section supersedes older date-stamped notes below wherever there is a conflict. Historical notes are retained for project context, but this section is the operational source of truth for the current FrankiFlow, FrankiHolz and FrankiFlow Mail setup.


A. Environment and branch model
• FrankiFlow production: https://frankiflow.de on Netlify project frankiflow.
• FrankiHolz production: https://stay.frankiflow.de on Netlify project frankiholz.
• FrankiHolz development: https://develop--frankiholz.netlify.app from the develop branch.
• FrankiFlow Mail production: https://mail.frankiflow.de on Netlify project frankiflow-mail.
• FrankiFlow Mail development: https://develop--frankiflow-mail.netlify.app from the develop branch.
• GitHub repositories: dn-lx/frankiflow, dn-lx/frankiholz and dn-lx/frankiflow-mail.
• main is the production branch. develop is the testing/integration branch. Temporary feature/fix/hotfix branches are automatically deleted after their pull request is merged; main and develop are preserved.
• Development must be tested before promotion to main. A green deployment or smoke test does not by itself mean the complete customer journey has been fully certified.


B. FrankiFlow website and customer enquiries
FrankiFlow remains the cleaning/property-services product with the public website, integrated Preisrechner and administration surfaces backed by the shared Supabase project. The Preisrechner opens in the same browser tab from the website. The public homepage currently contains the modern service/SEO structure present on main; any future homepage removals or redesigns must be performed against the current main source rather than by restoring an older branch snapshot.


The current enquiry-email architecture is:
• automated sender identity: anfrage@frankiflow.de;
• internal recipient: info@frankiflow.de;
• internal notification Reply-To: the customer email address;
• customer acknowledgement sender: anfrage@frankiflow.de;
• customer acknowledgement Reply-To: info@frankiflow.de;
• website and Preisrechner enquiries use separate subject/source markers so the origin can be distinguished.
Recent Supabase email-event records confirm admin enquiries are being logged to info@frankiflow.de. Older mail@frankiflow.de records are historical and are not the intended current routing.


C. FrankiHolz public product
FrankiHolz is the accommodation/direct-booking product. The canonical production hostname is stay.frankiflow.de. The former accommodation.frankiflow.de hostname is legacy and may be kept only as a forwarding/redirect address to stay.frankiflow.de.


Room/media behavior:
• Room 1 and Room 2 are active.
• Neither currently has an uploaded frankiholz_room_images record or legacy image_url fallback.
• When no genuine uploaded room photo exists, develop displays “Will be uploaded soon” instead of a stock/backup room photo.
• Room 3 is currently inactive and is not part of the normal public room list.
• Future public room imagery should come from frankiholz_room_images / Supabase Storage, not from stock fallback URLs.


Calendar and availability:
• Room availability combines FrankiHolz calendar records, genuine booking state and protected Airbnb iCal blocks.
• Room 1 and Room 2 have Airbnb iCal feeds configured server-side; private feed URLs are never exposed in public code or documentation.
• The backend remains authoritative for availability and pricing. The browser calendar is a presentation/selection layer only.


D. FrankiHolz current payment model
The current development payment flow is the newer 14-day card-on-file model, not the older 48-hour manual-capture workflow described in some historical sections below.


Current v2 flow:
1. Guest selects room/dates and submits the booking request.
2. Supabase creates the booking reference and server-calculated total.
3. The guest is sent to Stripe Checkout in setup mode so a card/payment method is stored securely; the card is not charged simply because the request was submitted.
4. The booking records the saved payment method and a charge_due_at date.
5. The intended charge time is 14 days before check-in; if the stay begins inside the 14-day window, charging is brought forward according to the confirmation/charge rules.
6. Webhooks keep Supabase payment state synchronized and are recorded idempotently.
7. Booking status, cancellation, scheduled charge and payment-failure handling remain backend-controlled.


Production and sandbox Stripe credentials are separate. The FrankiHolz sandbox account is used for development/test checkout and webhook events.


E. FrankiHolz test-environment status — important qualification
The test environment is configured well, but it must NOT be described as “fully tested with no problems” yet.


Verified configuration/status as of this update:
• Supabase payment settings report both live_ready and test_ready as true.
• The current environment flag is test.
• Stripe test and production Edge Functions are deployed separately.
• The development frontend now recognizes develop--frankiholz.netlify.app as a test environment and routes payment setup to frankiholz-create-authorization-test.
• The explicit query flags stripe_test=1 or test=1 also force sandbox routing.
• Sandbox webhook/event records exist in frankiholz_test_payment_events.
• Previous sandbox booking/event tests exist, including test bookings that were later expired/cancelled.


Still required before calling the booking system fully signed off:
• one complete fresh browser journey on the Netlify develop site using a Stripe test card;
• verification of saved-payment-method state and webhook processing for the current 14-day flow;
• verification of admin confirmation/decision behavior;
• verification of scheduled 14-day charge behavior and the within-14-days case;
• cancellation/release tests;
• booking-status page verification in EN and DE;
• email lifecycle verification;
• duplicate submission/webhook retry checks;
• final cleanup of test bookings/calendar state.
Therefore the correct status is: READY FOR EXTENSIVE QA, with the sandbox architecture and routing in place, but not yet certified problem-free end to end.


F. FrankiHolz email routing
FrankiHolz transactional mail uses stay@frankiflow.de as the sending identity. Internal/admin booking notifications should go to info@frankiflow.de. Guest-facing transactional messages are sent from stay@frankiflow.de and should use info@frankiflow.de as the reply/contact address. Secret mail-provider credentials remain only in protected backend configuration.


G. FrankiFlow Mail architecture
FrankiFlow Mail is a separate internal webmail/PWA using Supabase Auth + Postgres + RLS, Supabase Edge Functions, Resend transport and Netlify hosting.


Current develop behavior includes:
• one inbox/list row per conversation thread while the reader shows the full chronological message history;
• double-click message dialog with full conversation history and an editable composer;
• Reply and Reply All handling inside the message dialog;
• rich-text compose, attachments, drafts, scheduled send, snooze, archive, spam, trash, search, labels, contacts, templates/signatures and responsive/PWA behavior;
• Meeting Scheduler positioned under More and above Labels;
• labels displayed without a separate internal scroll area;
• notifications enabled by the app by default, while final permission remains controlled by the browser/OS;
• Password & sign-in remains in Settings, with eye icons to reveal/hide password fields;
• Mail users & personal mailboxes, Mail accounts, Notifications, Compose & reply and Sender identity status are intentionally removed from the normal Settings interface.


Multi-user mailbox model:
• mailbox identities currently stored: info@frankiflow.de, don.alex.perera@frankiflow.de and inuraamalsha@frankiflow.de;
• mail@frankiflow.de is no longer a configured mailbox account;
• each personal login is intended to have its own Supabase Auth password and mailbox plus access to shared info@frankiflow.de according to server-side account mappings/RLS;
• as of this documentation update, the mailbox identities for Don Alex and Inura exist in the mail-account table, but only info@frankiflow.de is currently present in frankiflow_mail_users/account assignment data. The two personal Supabase Auth users still need to be created/bootstrapped before they can log in independently. Passwords are intentionally not recorded in Drive documentation.


FrankiFlow Mail develop is substantially ahead of production main. New Mail features must be verified on https://develop--frankiflow-mail.netlify.app before merging to main and publishing them to https://mail.frankiflow.de.


H. Shared backend and security rules
The ecosystem currently shares Supabase project bdeajozhylypiidrldka for pricing, FrankiHolz booking/calendar/payment data and FrankiFlow Mail data. RLS, explicit authorization helpers and server-side Edge Functions are the security boundary. The browser contains only publishable/frontend-safe configuration. Stripe private keys, Resend API keys, webhook signing secrets, Supabase service-role keys and private Airbnb feed URLs must never be placed in GitHub public frontend files or Drive documentation.


I. Documentation maintenance rule
Whenever a material change is merged or deployed, update this authoritative section first. In particular document changes to: production/develop URLs, branch/deployment rules, enquiry sender/recipient addresses, FrankiHolz booking/payment lifecycle, Stripe test/live routing, room/media fallbacks, Airbnb calendar sync, Mail account/access model, authentication, RLS, Edge Functions and customer/admin email flows.






1. Purpose
This document records the current FrankiFlow and FrankiHolz products exactly as they are set up today. It is the A–Z reference for the websites, admin areas, pricing system, booking system, backend services, payments, forms, security, media, data flows and normal operating procedures. This document focuses only on the current working setup and normal operating procedures.


2. Product Portfolio
FrankiFlow is the cleaning and property-services business website and operating platform.
FrankiFlow Preisrechner is the customer pricing, quotation and admin invoice tool integrated into the FrankiFlow website.
FrankiHolz is the accommodation website and direct-booking platform with room management, live availability, booking requests, dynamic pricing and Stripe-based payment handling.


3. Hosting and Frontend Platform
FrankiFlow Netlify project: frankiflow
Current FrankiFlow production URL: https://frankiflow.de
FrankiFlow Netlify site ID: 71b1e9d0-e68a-4503-96d8-a55e94c20cc9


FrankiHolz Netlify project: frankiholz
Current FrankiHolz production URL: https://stay.frankiflow.de
FrankiHolz Netlify site ID: 582edc8d-020c-4f8f-86ff-1d5e1bd47736


Both products are separate Netlify projects. This separation keeps deployments, forms, routes and production changes independent.


4. FrankiFlow Public Website
FrankiFlow is the public website for Gebäudereinigung & Objektbetreuung in Frankfurt am Main and surrounding areas.


Main service areas:
• Büroreinigung
• Wohnungsreinigung
• Ferienwohnung / Airbnb
• Treppenhausreinigung
• Grund- und Endreinigung
• Objektbetreuung / Objektkontrolle


Main commercial messages:
• 25% Neukundenrabatt im ersten Monat
• kostenlose Probereinigung nach Absprache
• transparente Preise
• direkte Angebotsanfrage
• Frankfurt am Main & Umgebung
• zuverlässige, flexible und persönliche Betreuung


The website uses the original FrankiFlow brand artwork. The canonical transparent website logo is FrankiFlow-transparent.png, derived from the supplied FrankiFlow.png by removing only the white background; the logo artwork itself must not be regenerated, recolored or replaced with AI artwork.


5. FrankiFlow Website Routes
/ — main FrankiFlow website
/admin/ — unified FrankiFlow administration for website content, photos, live Preisrechner settings, leads and payments
/preisrechner/ — public FrankiFlow price calculator


/impressum/ — legal provider information
/datenschutz/ — privacy information


6. FrankiFlow Website Admin
The FrankiFlow admin area is the operational control panel for website-managed content and business leads.


Current capabilities include:
• authenticated admin access
• editable hero and website content
• contact-information management
• image/gallery management
• quote-request overview
• lead status management
• configuration import/export where enabled
• Stripe-ready one-time payment creation where enabled
• integrated live Preisrechner administration under the Preise section
• access to website-related operational settings


Admin authentication is handled through Supabase Auth together with explicit FrankiFlow admin authorization.


7. FrankiFlow Quote Form
The public website includes the Netlify form:
frankiflow-quote


The quote form is used to collect customer enquiries from the public FrankiFlow website. Form handling is separated from Supabase pricing logic so lead capture and pricing administration remain independent.


8. FrankiFlow Preisrechner
The Preisrechner is integrated into the FrankiFlow website at:
/preisrechner/


The public calculator allows customers to estimate cleaning prices using the active configuration stored in Supabase.


Main supported services:
• Wohnungsreinigung
• Büroreinigung
• Ferienwohnung / Airbnb
• Treppenhausreinigung


Pricing components can include:
• service-specific base pricing
• floor-area gradient
• minimum visit price
• contract-duration reductions
• fixed visits-per-month frequency model
• optional window cleaning
• optional Grundreinigung with an internal calculation uplift
• optional equipment and cleaning-supplies surcharge
• first-month promotion
• VAT configuration
• German and English customer views


Customer-facing output remains simple and decision-focused. Normal recurring cleaning is labelled “Allgemeine Reinigung”. When Grundreinigung is selected, the customer sees “Grundreinigung” as the cleaning line with the full calculated cleaning amount; the internal percentage is not shown in the calculator, quotation or invoice.


9. Preisrechner Administration in the Main FrankiFlow Admin
Preisrechner administration is integrated into the main FrankiFlow admin:
/admin/ → Preise


There is no separate Preisrechner admin page and no Admin button on the public calculator. The Preise section is used to manage live pricing without redeploying the frontend.


Current admin-managed settings include:
• general €/m² gradient
• minimum cleaning charge
• individual service base prices
• service labels
• service active/inactive state
• contract-duration reductions
• frequency configuration
• window-cleaning pricing
• internal Grundreinigung calculation percentage; not shown to customers
• equipment/supplies pricing
• new-customer discount
• VAT settings
• customer-facing labels


The interface uses readable ON/OFF switches rather than technical 1/0 controls.


10. Current FrankiFlow Pricing Snapshot
The live source of truth is Supabase pricing_config. The following values are a current operational snapshot and may change through the admin panel.


General:
• floor gradient: 0.2304 €/m²
• minimum floor-cleaning charge: €30


Service bases:
• Wohnungsreinigung: €30
• Büroreinigung: €24
• Ferienwohnung / Airbnb: €26
• Treppenhausreinigung: €24


Window cleaning:
• base: €5
• gradient: €3.00/m²
• minimum: €35


Equipment:
• base: €5
• gradient: €0.01/m²


Promotion:
• 25% first-month discount


VAT:
• 19% option


Grundreinigung:
• internal calculation setting: +30%; not displayed to customers


11. Contract Duration and Frequency Logic
Supported contract durations:
• 1 month
• 3 months
• 6 months
• 9 months
• 12 months
• 24 months


Current base-price reductions:
• 1 month: 0%
• 3 months: 2%
• 6 months: 4%
• 9 months: 6%
• 12 months: 8%
• 24 months: 10%


Only the base portion is reduced by contract duration. The square-metre gradient is not reduced.


The system uses fixed monthly visit counts:
• 1× per month = 1 visit/month
• every 2 weeks = 2 visits/month
• 1× per week = 4 visits/month
• 2× per week = 8 visits/month
• 3× per week = 12 visits/month
• 4× per week = 16 visits/month
• 5× per week = 20 visits/month


12. Quotation and Invoice Functions
Public users can calculate prices and generate a customer quotation without access to private billing information.


Authenticated admins can use the invoice flow, which can include protected company billing details retrieved from Supabase.


Current invoice numbering:
• prefix: FF
• padding: 4 digits
• examples: FF0001, FF0002, FF0003


A new invoice number should only be reserved when an authenticated admin actually generates a new invoice.


13. Shared Supabase Backend
Supabase project: FrankiFlow Pricing
Project ref: bdeajozhylypiidrldka
Region: eu-central-1


Supabase provides:
• PostgreSQL database
• Supabase Auth
• Row Level Security
• Storage
• public pricing configuration
• protected private data
• RPC/database functions
• Edge Functions
• FrankiFlow admin authorization
• FrankiHolz admin authorization
• booking and calendar logic
• dynamic pricing logic
• payment-state logic


14. FrankiFlow Data Boundary
Publicly readable data includes only configuration required by the customer-facing calculator and website.


Protected data includes:
• private company billing details
• invoice sequence
• admin authorization
• sensitive write operations
• private payment configuration
• service-role credentials


Secret/service-role keys must never be embedded in browser JavaScript.


15. FrankiHolz Public Product
FrankiHolz is the direct accommodation-booking product hosted at:
https://stay.frankiflow.de


The guest experience supports:
• room selection
• room galleries
• live availability calendar
• nightly rate display
• date-range selection
• guest-detail collection
• booking-request submission
• booking reference generation
• booking-status lookup
• payment access after approval


FrankiHolz currently manages three main rooms.


16. FrankiHolz Public Routes
/ — public accommodation website
/admin — authenticated administration dashboard
/booking-status — guest booking and payment-status lookup
/payment-success — Stripe Checkout return page


17. FrankiHolz Room and Media Management
Admins can manage:
• room names
• room descriptions
• base nightly prices
• maximum guest counts
• room active/inactive state
• multiple room photos
• hero/main image
• hero title and subtitle


Supabase Storage bucket:
frankiholz-media


Public image retrieval is allowed for guest-facing media. Upload, update and delete permissions are restricted to authorized admins.


18. FrankiHolz Calendar
Each room has its own availability calendar.


Admin date states:
• Available
• Blocked
• Booked


Admins can select a date or date range and apply availability state, optional date-specific price override and an admin note.


Booking-linked dates are protected from casual manual removal.


19. FrankiHolz Booking Request Flow
The public booking form collects:
• guest name
• email
• phone
• country
• number of guests
• room
• check-in
• check-out
• optional message


A successful request returns a unique FrankiHolz reference such as FH-XXXXXXXX and the calculated stay total.


A pending booking request does not block the selected dates.


20. FrankiHolz Booking Lifecycle
Guest submits request:
• booking status: pending
• payment status: not started
• dates remain available


Admin approves:
• availability is checked again on the backend
• dates receive a temporary hold
• payment status becomes awaiting payment
• Stripe Checkout is created


Guest pays successfully:
• payment status becomes paid
• booking remains confirmed
• dates remain booked


Payment expires or fails:
• booking/payment state is updated
• temporary hold is released
• dates become available again


Admin rejects before payment:
• request is cancelled
• no inventory block remains


21. FrankiHolz Dynamic Pricing
The FrankiHolz pricing engine supports rule-based revenue management.


Current starting rules:
• weekend uplift: +15% on Friday and Saturday nights
• occupancy level 1: approximately 33% occupancy → +10%
• occupancy level 2: approximately 66% occupancy → +20%
• last-minute window: within 3 days → -10%
• long stay 1: 7+ nights → -5%
• long stay 2: 14+ nights → -10%
• payment hold: 120 minutes


The room base price is the starting point. Date-specific manual price overrides can replace the normal base for selected dates.


22. FrankiHolz Stripe Payment Setup
FrankiHolz uses Stripe-hosted Checkout.


Payment testing is isolated in the dedicated FrankiHolz sandbox.


Core payment components:
• Stripe Checkout Sessions
• Supabase Edge Functions
• webhook signature verification
• payment-event idempotency
• booking/payment state synchronization


Relevant Edge Functions include:
• frankiholz-create-payment
• frankiholz-stripe-webhook
• frankiholz-cancel-payment


Stripe secret keys and webhook signing secrets are stored only in protected backend secrets.


23. FrankiHolz Booking Notifications
The frontend uses the Netlify form:
frankiholz-booking


The form can carry:
• booking reference
• room
• dates
• guest name
• guest email
• phone
• country
• guest count
• total price
• guest message


Configured owner/admin notification addresses should be managed in Netlify form notification settings.


24. Security Model
Current security principles:
• Supabase Auth for administrator identity
• explicit admin authorization after authentication
• Row Level Security on sensitive tables
• server-authoritative pricing
• server-authoritative availability
• no public access to booking lists with personal data
• no secret Stripe key in browser code
• no Supabase service-role key in browser code
• webhook signature verification
• Stripe event idempotency
• protected private billing data
• protected invoice numbering


25. Source of Truth
FrankiFlow pricing source of truth:
Supabase pricing_config


FrankiHolz booking and calendar source of truth:
Supabase booking/calendar tables and backend functions


FrankiHolz media source of truth:
Supabase Storage and related image records


Frontend deployments are presentation/application layers. Business-critical pricing, booking and authorization state should remain backend-controlled.


26. Current Production/Access URLs
FrankiFlow:
https://frankiflow.de


FrankiFlow website admin:
https://frankiflow.de/admin/


FrankiFlow Preisrechner:
https://frankiflow.de/preisrechner/


FrankiFlow pricing administration:
https://frankiflow.de/admin/ → Preise


FrankiHolz:
https://stay.frankiflow.de


FrankiHolz admin:
https://stay.frankiflow.de/admin


FrankiHolz booking status:
https://stay.frankiflow.de/booking-status


FrankiHolz payment success:
https://stay.frankiflow.de/payment-success


27. Current Domain and Email Setup
The business domain is frankiflow.de.
IONOS currently provides the domain/DNS and business-email environment associated with the domain.
The professional business mailbox includes info@frankiflow.de.


Website hosting and business email are separate services. Email depends on the correct mail-related DNS records and should be managed independently from website content and application configuration.


28. Standard Operating Checks
After a FrankiFlow deployment:
• open the homepage
• test mobile navigation
• test /admin/
• test /preisrechner/
• test the Preise section inside /admin/ and save a pricing change
• verify live pricing loads
• submit a quote-form test
• verify legal pages
• verify logo/images


After a FrankiHolz deployment:
• open the guest website
• test room galleries
• test room calendar
• submit a booking request
• verify pending requests do not block dates
• test admin login
• test booking approval
• test booking-status lookup
• test Stripe sandbox flow when payment code changes
• verify booking notifications


29. FrankiFlow Language System
FrankiFlow supports German and English across the complete customer and administrator experience. The public website, /preisrechner/, /admin/, /impressum/ and /datenschutz/ all provide a DE/EN language switch.
The selected language is stored in the browser as frankiflow-lang and is shared across all FrankiFlow pages. A language selected on the homepage therefore remains active when the user opens the calculator or admin panel. The former Preisrechner-specific language setting remains supported for backward compatibility.
FrankiFlow uses search-friendly language URLs where they add SEO value. The German homepage remains at / and the English homepage is available at /en/. Dedicated German service landing pages use German paths, while paired English service landing pages live under /en/. The calculator, admin and legal interfaces retain their existing routes and switch interface language without duplicating operational routes.
Editable CMS content uses separate German and English fields for hero eyebrow, hero title, hero subtitle, offer title, offer text, service area and the primary/secondary CTA labels. Shared data such as email, phone, WhatsApp, business identity, legal address, photos and operational records remain single-source.
The Website section of /admin/ contains both German and English content fields. The admin interface itself can also be switched between German and English, including navigation, pricing controls, leads, payment tools, import/export labels, confirmations and operational messages.
Supabase frankiflow_site_settings includes the English columns hero_eyebrow_en, hero_title_en, hero_subtitle_en, offer_title_en, offer_text_en, service_area_en, primary_cta_label_en and secondary_cta_label_en. Pricing remains sourced from pricing_config; customer-facing English service names are presentation labels and do not duplicate the pricing source of truth.


30. Current SEO & Search Architecture
Update date: 9 September 2026


Production search domains:
• FrankiFlow canonical domain: https://frankiflow.de/
• FrankiHolz canonical domain: https://stay.frankiflow.de/
• FrankiHolz public accommodation address: Seehofstraße 20, 60594 Frankfurt am Main, Germany.


FrankiFlow SEO implementation in the current deploy package includes:
• Frankfurt-focused homepage title and meta description.
• Canonical URLs and Open Graph/Twitter metadata.
• CleaningService structured data for Frankfurt am Main.
• robots.txt and sitemap.xml.
• German homepage at / and English homepage at /en/ with hreflang links.
• Dedicated German and English landing pages for Büroreinigung/Office Cleaning, Wohnungsreinigung/Home Cleaning, Airbnb/Ferienwohnung cleaning, Treppenhaus/Stairwell Cleaning, Grundreinigung/Deep Cleaning and Objektbetreuung/Property Care.
• A visible Frankfurt local-service section and customer FAQ content.
• Internal links from the main service cards to the relevant SEO landing pages.
• /admin/ is excluded from search indexing.


FrankiHolz SEO and location data currently stored in Supabase includes:
• public address fields for Seehofstraße 20, 60594 Frankfurt am Main, DE.
• Frankfurt-focused German and English hero text.
• German and English SEO title and description fields.
• room descriptions with Frankfurt/address context for all three active rooms.


The current FrankiHolz deploy package is a complete Netlify package with index.html at archive root, the booking/admin/payment application, robots.txt, sitemap.xml, Frankfurt-focused homepage metadata and structured data, a visible Seehofstraße 20 location section, noindex protection for operational pages, robust /admin, /booking-status and /payment-success routes including trailing-slash variants, and a branded 404 page. Only a complete package with root-level index.html should be deployed to the FrankiHolz Netlify project.


Google Search Console and Google Business Profile are external account tasks. The owner should verify the frankiflow.de Domain property, add separate URL-prefix views for the main and accommodation sites, submit both sitemaps, request indexing of priority pages and maintain accurate local business/address information.


31. Documentation Maintenance Rule
This document, the dedicated FrankiFlow Preisrechner documentation and the consolidated FrankiFlow & FrankiHolz technical documentation are living project records.


Update the documentation whenever a material product change is made to:
• public routes
• website content architecture
• Netlify project configuration
• Supabase schema
• RLS policies
• Storage rules
• Edge Functions
• pricing logic
• booking logic
• Stripe behavior
• admin features
• forms
• authentication/authorization
• invoice logic
• production URLs
• domain or email setup
• SEO metadata, canonical URLs, hreflang, structured data, sitemap or robots rules


The documentation should remain a current-state operational reference and describe the working setup and product behavior as they exist now.
.


32. FrankiHolz Airbnb iCal Calendar Sync
Update date: 9 September 2026
FrankiHolz now supports protected Airbnb iCalendar (.ics) availability feeds. Room 1 and Room 2 are connected to their respective Airbnb export calendars. The feed URLs are stored in the protected Supabase table public.frankiholz_ical_feeds and must not be published in website source code, documentation, or public JavaScript. Room 3 can be connected later from the authenticated FrankiHolz admin.


External Airbnb availability is stored separately in public.frankiholz_ical_blocks. This separation prevents Airbnb synchronization from overwriting manual FrankiHolz calendar entries, price overrides, or real FrankiHolz booking rows. The public calendar, booking estimate, booking creation, and admin approval functions all check these external blocks, so a date imported from Airbnb is treated as unavailable before a FrankiHolz booking can be requested or approved.


The admin dashboard contains an Airbnb calendar sync section. Authorized admins can see connection/sync status, replace or add a room's Airbnb iCal link, and click “Sync Airbnb calendars now”. The admin-authenticated Supabase Edge Function frankiholz-sync-airbnb fetches enabled feeds, parses VEVENT date ranges, and transactionally replaces that room's external Airbnb blocks through the protected frankiholz_replace_ical_blocks RPC. A failed network/feed fetch does not deliberately clear previously imported blocks.


The current synchronization trigger is manual from the authenticated admin. After deploying a frontend update or changing an Airbnb feed, open /admin, click “Sync Airbnb calendars now”, and verify that Airbnb dates appear as “Airbnb” in the admin calendar and as unavailable in the guest calendar.


The FrankiHolz payment Edge Functions accept both https://stay.frankiflow.de and https://frankiholz.netlify.app as allowed browser origins. Stripe Checkout success/cancel URLs default to the production custom domain https://stay.frankiflow.de.


33. FrankiFlow Customer-Facing Service Checklist
Update date: 10 September 2026


The FrankiFlow Preisrechner now includes a customer-facing Leistungscheckliste / Service checklist directly after “Angebot vorbereiten / Prepare a quotation”. The customer can preview the checklist and can choose whether it is attached to the printed quotation/PDF; attachment is enabled by default.


The checklist is service-specific. Büroreinigung is categorized into office areas, kitchen/break area, toilets/sanitary areas and entrance/corridors. Wohnungsreinigung is categorized into living/sleeping areas, kitchen, bathroom/toilet and hallway/entrance. Ferienwohnung/Airbnb is categorized into sleeping/living areas, kitchen, bathroom/toilet and guest-area/final-check tasks. Treppenhausreinigung uses entrance/common areas, stairs/landings/floors and railings/doors/touch points.


Grundreinigung extends the selected base-service checklist with a separate detailed deep-cleaning page. Additional interior refrigerator/cupboard work, carpet deep cleaning and other property-specific extras are explicitly identified as requiring separate agreement. Fensterreinigung has its own independent checklist for glass, frames, rebates, handles and window sills. A window-only quotation with 0 m² floor area omits unrelated base-service checklist pages.


When included, the quotation remains page 1 and the relevant checklist page(s) follow automatically in the same branded A4 print/PDF output. Checklist pages use the selected DE/EN language, customer/property details, categorized tasks, scope note and the same evenly distributed FrankiFlow company-data footer. The client-facing checklist is derived from the approved internal Cleaning & Quality Control Checklist but omits employee time/signature and internal quality-control fields because its purpose is to show the customer the agreed service scope. Invoice printing does not automatically attach this checklist.


33. FrankiFlow Quotation & Invoice Print Standard
Update date: 10 September 2026
FrankiFlow quotation and invoice prints use a modernized one-page A4 layout that preserves the clear visual structure of the established FrankiFlow quotation style while improving hierarchy, spacing and brand presentation.


Current print behavior:
• Transparent canonical FrankiFlow logo and tagline at the top-left.
• ANGEBOT / QUOTATION or RECHNUNG / INVOICE at the top-right with a prominent featured amount; when the new-customer offer applies, the quotation highlights the first-contract-month amount.
• Clear customer/company details, service heading and concise service summary.
• Customer-facing line items only: service/area and €/visit, optional equipment/supplies, Allgemeine Reinigung or Grundreinigung with explicit monthly visit context, optional window cleaning, and VAT status.
• Regular monthly total followed by a restrained highlighted first-month discounted total when applicable.
• Invoice-specific number/date/service-period metadata and protected payment information remain separate from the public quotation flow.
• Company data is fixed visually at the bottom of the A4 page and spread evenly across five columns: Telefon +49 176 62493041; E-Mail info@frankiflow.de; Website www.frankiflow.de; Steuernummer 014/811/68462; W-IdNr. DE464605581.
• A small tax/legal note is placed beneath the company-data footer.
• German and English print labels follow the current interface language.
• Internal base-price mechanics and the internal Grundreinigung calculation percentage are not customer-visible.
• Public quotations never include protected bank/payment details; invoice billing/payment values are fetched only for an authenticated admin.
• Printing currently uses the browser print/PDF mechanism, so browser-generated headers/footers can still appear when enabled in the user's print dialog.


35. FrankiFlow Calculator - Standalone Window Cleaning & Print QA
Update date: 10 September 2026
The public Preisrechner includes Fensterreinigung / Window cleaning as a fifth primary service choice. Customers can therefore request a window-only calculation without selecting Büroreinigung, Wohnungsreinigung, Airbnb cleaning or Treppenhausreinigung.
In window-only mode, the calculator hides floor area, Grundreinigung, equipment and the duplicate window-add-on toggle. The glass-area control is shown in the main scope step. On the first switch into standalone window cleaning, frequency defaults to Einmalig / One-time while all configured recurring frequencies remain available.
The source of truth remains public.pricing_config in Supabase. Current window_settings are base 5 €, gradient 3.00 €/m² and minimum 35 € per visit. A 65 m² window-only example therefore calculates to 200 € per visit. With the enabled 25% new-customer promotion and one visit, the promotional amount is 150 € before VAT if VAT is not selected.
Window-only print output is service-specific: the document title/intro and price rows use Fensterreinigung / Window cleaning only. Office/general-cleaning wording is excluded from window-only quotations and invoices. The window price per visit is the complete max(minimum, base + glass area × gradient) amount, and recurring monthly totals multiply that per-visit amount by the configured visits per month.
Print rendering was also hardened to prevent irregular bold-letter/glyph artifacts: conservative print fonts, no synthetic font weights or ligatures, explicit regular body weights and CSS-drawn checklist markers. Internal QA/test pages are excluded from the production package.


Public Footer & Cross-Site Navigation Update – 10 September 2026
FrankiFlow customer-facing pages now share a standardized company-data strip at the bottom of the site. It distributes the public company details evenly across the footer: Telefon / Phone +49 176 62493041; E-Mail info@frankiflow.de; Website www.frankiflow.de; Steuernummer / Tax No. 014/811/68462; W-IdNr. DE464605581.
All public WhatsApp actions now display a WhatsApp logo/icon alongside the WhatsApp wording. The website admin's WhatsApp URL label is also visually marked with the same icon; the destination continues to come from the configured FrankiFlow WhatsApp URL.
FrankiFlow footers and the Preisrechner footer include a direct cross-product link to FrankiHolz at https://stay.frankiflow.de/. This provides a visible route from the cleaning website to the accommodation product without changing either product's separate Netlify deployment.
No pricing, checklist, invoice, booking, Supabase or Stripe business logic was changed by this footer/navigation update.




Current FrankiFlow Checklist & Admin-App Setup — 10 September 2026
FrankiFlow customer service checklists now use public.frankiflow_checklists as their shared source of truth. Six bilingual service records are maintained: office, home, Airbnb/holiday rental, stairwell, extended deep cleaning and window cleaning. Each record contains German and English service labels plus ordered sections/tasks. Public checklist reads support the Preisrechner; writes are restricted to authorized FrankiFlow administrators through RLS.


The FrankiFlow web admin includes Checklisten / Checklists management. Admins can edit both languages, add/remove/reorder sections, add/remove individual tasks and mark a section as optional / only when specifically agreed. The Preisrechner loads this content for the Step 05 customer preview and quotation-PDF checklist attachment. Built-in checklist content remains only as an availability fallback if the database read is unavailable.


The phone application is officially named FrankiFlow Admin App. Repository: dn-lx/franki-admin. Its technical Android application ID and iOS bundle identifier remain de.frankiflow.admin. The FrankiFlow area of the app contains a bilingual Checklists tab that edits the same Supabase checklist records as the web admin, keeping web, mobile and customer-facing quotation scope synchronized.


Current FrankiFlow public footer behavior: marketing pages use a standard business footer with brand identity, relevant service/navigation links, telephone, email, WhatsApp, Impressum, Datenschutz, FrankiHolz accommodation link and copyright/service-area context. The separate company-data strip containing Steuernummer/W-IdNr. is not shown on public marketing pages, and no customer-facing footer advertises the /admin/ route. Print-document footers remain independent and keep their approved business-data layout.




FrankiFlow Admin App – Current Mobile Build
The current mobile administration application is FrankiFlow Admin App version 1.2.1. The Android application ID and iOS bundle identifier remain de.frankiflow.admin. The application uses the approved dark, symbol-only FrankiFlow app icon stored in the project Drive folder as FrankiFlow-Admin-App-Icon-Dark.png. The dashboard uses the neutral title “Dashboard” and does not derive or display a greeting from the administrator email address. In FrankiHolz booking management, the All / Pending / Confirmed / Paid / Cancelled filters are compact horizontal chips designed to fit phone screens without excessive vertical height. The Android GitHub workflow validates TypeScript, applies the approved icon before Expo prebuild, builds FrankiFlow-Admin-App-1.2.1.apk, and then installs and launches the APK on an Android emulator for a smoke test.


FrankiFlow Admin App 1.2.2 – Android Icon and FrankiHolz Calendar UI
- Android launcher icon uses a separate transparent adaptive foreground containing only the FrankiFlow picture symbol, padded inside Android's safe area over a dark navy background (#052A4B). This keeps the complete house, skyline, broom, waves and sparkles visible under circular and rounded launcher masks.
- The regular application icon is stored separately from the adaptive foreground. Both icon assets are kept in the FrankiFlow Drive folder and are applied by the Android GitHub Actions build before Expo prebuild.
- FrankiHolz Calendar uses compact horizontal room buttons with a fixed 34 px height and horizontal scrolling where needed, instead of tall generic segment controls.
- User-facing app name remains FrankiFlow Admin App. Android application ID remains de.frankiflow.admin.


GitHub Source & Controlled Production Deployment — 10 September 2026
FrankiFlow production source repository: https://github.com/dn-lx/frankiflow
FrankiHolz production source repository: https://github.com/dn-lx/frankiholz
Both repositories are now populated with the complete current website source. The main branch is reserved for production-ready code and is the branch that Netlify should use for production deployment.
Future website work must not be performed incrementally on main. For each batch of requested changes, create one work/<topic> branch from the latest main, keep all related edits and testing on that branch, and merge to main only after the whole batch is finished and checked. The merge to main is the production release event and should result in a single Netlify production deployment.
To control Netlify deployment usage, automatic branch deploys and Deploy Previews should remain disabled by default unless a preview is specifically required. Existing Netlify projects, custom domains and environment variables stay unchanged when the repositories are connected.
FrankiFlow Netlify repository settings: production branch main; repository root as base; no build command; publish directory public; Netlify Functions directory netlify/functions as declared in netlify.toml.
FrankiHolz Netlify repository settings: production branch main; repository root as base; no build command; publish directory repository root (.). Sensitive Stripe/Supabase keys and private Airbnb iCal URLs remain outside GitHub


Current FrankiHolz Website & Booking Setup — 11 September 2026


FrankiHolz source is managed in GitHub repository dn-lx/frankiholz. Current development is isolated on work/bilingual-live-booking. Main remains the production branch and should be merged only once the complete batch is approved; Netlify production deploys should therefore occur only from main.


Branding and language: the public and admin/status interfaces use the supplied transparent FrankiHolz logo asset FrankiHolz-transparent.png. The guest website provides English and German language switching. Hero and SEO content plus room names/descriptions have separate English/German fields. Booking rows store the selected language so customer status/payment experiences can remain in the chosen language.


Editable wording: public.frankiholz_copy is the shared source for customer-facing bilingual wording. Public reads are allowed, while writes require authenticated FrankiHolz admin authorization. The admin provides paired English/German editing for public labels/headings/explanations in addition to hero, SEO and room wording.


Calendar synchronization: the public website requests frankiholz-sync-airbnb when the accommodation site opens, before loading the current room/calendar information. The server-side function keeps the private iCal feed URLs protected and applies a short public refresh cooldown. Room 1 and Room 2 are connected and enabled; Room 3 has no feed yet. Admin retains a manual Sync Airbnb calendars now control.


Payments: the FrankiHolz live Stripe account is capable of accepting real payments and payouts. The production webhook to frankiholz-stripe-webhook is enabled for completed, async success, async failure and expired Checkout Session events. The Checkout creator supports the booking language and the production accommodation domain. Real guest charging should begin only after the live Stripe private key and the live webhook signing secret are stored directly in Supabase Edge Function secrets and a small controlled live payment verifies the full flow. Secret values are not stored in GitHub or documentation.


Guest email: recommended transactional email provider is Resend using mail.frankiflow.de. Use FrankiHolz <stay@frankiflow.de> as the sending identity and info@frankiflow.de as Reply-To. Store RESEND_API_KEY, FRANKIHOLZ_EMAIL_FROM and FRANKIHOLZ_EMAIL_REPLY_TO only in Supabase Edge Function secrets. The intended bilingual guest sequence is booking request received, booking approved/payment requested, booking rejected/cancelled and payment confirmed.
.






UPDATE — 12 SEPTEMBER 2026


FrankiFlow Git and development workflow
• Production branch: main → Netlify → https://frankiflow.de
• Development branch: develop → ShipStatic → https://frankiflow.shipstatic.com
• Feature work is created from develop, merged back into develop, tested on the permanent ShipStatic development URL, and only then promoted to main after approval.
• ShipStatic custom-domain development is configured through the develop GitHub Actions workflow using SHIP_TOKEN and SHIP_DOMAIN.
• New successful develop deployments automatically repoint the same dev.frankiflow.de URL to the latest develop build.
• main remains independent and is not changed by development work.


FrankiHolz development workflow
• Production branch remains separate from development.
• develop → ShipStatic → https://develop--frankiholz.netlify.app
• The same permanent-domain development model is used for FrankiHolz.


FrankiFlow homepage/admin update on develop
The following changes were merged into develop in PR #23 and deployed to ShipStatic development on commit 5609f718ad404c45deb9df7f6a3fa66ebeb1534a. Production main has not been changed by this feature yet.


Public homepage changes
• Removed the large homepage Price Calculator promotional banner section shown below the service cards.
• Removed the separate Frankfurt local-service/SEO block shown near the lower part of the homepage.
• Increased the desktop header FrankiFlow logo presentation to approximately 2× its previous visual size while preserving a compact mobile header.
• Added a bilingual About Us section to the homepage.
• Confirmed that no public copy matching “homeprice calculator for FrankiHolz” exists in the FrankiFlow repository.
• English UI text now applies additional capitalization normalization for sentence starts and major UI nouns/headings.


About Us CMS
• About Us is stored in frankiflow_site_settings and is editable from the main FrankiFlow admin.
• German and English eyebrow, title and two body paragraphs can be edited separately.
• The public homepage reads the saved values from Supabase.


FAQ CMS
• FAQ heading/intro copy is bilingual and editable.
• FAQ questions/answers are stored as structured bilingual items.
• Admin can add FAQ entries, remove FAQ entries, edit German and English content, and save the complete list.


Homepage section visibility controls
The admin now contains a homepage section visibility area. Individual sections can be shown or hidden without editing code. Managed sections include:
• Hero
• advantages/signal strip
• services
• About Us
• Why FrankiFlow
• process
• gallery
• FAQ
• contact
Hidden sections also hide their corresponding homepage navigation links where applicable.


Database migration
Migration 004_frankiflow_homepage_cms.sql adds the CMS fields required for About Us, FAQ content and section visibility to frankiflow_site_settings. The migration was applied to the active FrankiFlow Supabase project and is also tracked in GitHub.


Validation
• Expanded npm run check now validates the main public/admin modules and new homepage/English-normalization modules.
• A temporary GitHub Actions feature validator passed before merge and was removed afterwards.
• The develop ShipStatic deployment completed successfully after merge.


FRANKIFLOW ADMIN-WIDE UI & ABOUT PAGE UPDATE — 12 SEPTEMBER 2026


• PR #25 was merged into develop on commit 368103148253e972654d75f833f4154ea33d2ede and deployed successfully to ShipStatic development.
• The visual language approved for the Homepage CMS is now applied across the complete FrankiFlow Admin: Dashboard, Website, Photos, Pricing, Checklists, Enquiries, and Import / Export.
• Shared improvements include consistent dark section headers, card hierarchy, responsive form grids, modern tables, clearer media/configuration layouts, improved spacing, and desktop/tablet/mobile responsiveness.
• The existing functional logic remains unchanged; the work is a presentation and usability layer over the current Supabase-backed Admin.
• A dedicated bilingual public About Us page now exists at /about/. It reads the same Supabase about_sections content edited from Admin, so the story has one source of truth.
• The homepage About Us area is now a compact teaser with a link to /about/ rather than displaying the full long story on the homepage.
• About Us navigation is linked from the homepage and service pages, and /about/ has been added to sitemap.xml.
• main / production remains unchanged until development is approved.


Current development test URL
https://frankiflow.shipstatic.com


CMS REFINEMENT — 12 SEPTEMBER 2026
• The FrankiFlow homepage CMS was redesigned into clear Visibility, About Us and FAQ tabs.
• The admin layout is now responsive across desktop, tablet and mobile widths; wide CMS grids no longer force horizontal overflow.
• The legacy “Website-Texte & Übersetzungen” editor is removed from the visible admin interface.
• Homepage visibility controls now show an explicit Visible/Hidden state with clearer section descriptions.
• FAQ entries are edited as explicit German + English pairs. New FAQ entries include both languages and validation prevents incomplete bilingual entries from being saved.
• About Us now uses structured bilingual sections stored in Supabase via about_sections JSONB.
• The full About Us story now covers Inura Devasurendra, Don Alex Hettiarachi, the FrankiFlow Price Calculator, the service/technology combination and the company vision.
• The public About Us section renders the structured German or English version based on the active language.
• Supabase migration 005_frankiflow_about_sections.sql was added and applied.
• PR #24 was merged into develop only. Production main remains unchanged pending development approval.
• ShipStatic development deployment for develop commit 22107f65cf43fb83741b3e0b502b473195fba549 completed successfully.






ENVIRONMENT DOMAIN STANDARD — 12 SEPTEMBER 2026
The project-wide naming convention is production hostname unchanged, with dev. prefixed for the corresponding development environment. The term staging and staging-based hostnames are no longer used for these project URLs.
FrankiFlow production: https://frankiflow.de
FrankiFlow development: https://frankiflow.shipstatic.com
FrankiHolz production: https://stay.frankiflow.de
FrankiHolz development: https://develop--frankiholz.netlify.app
FrankiFlow Mail production web app: https://mail.frankiflow.de
FrankiFlow Mail development web app: https://develop--frankiflow-mail.netlify.app
For website projects, main remains the production branch deployed through Netlify and develop is the development branch deployed through ShipStatic. FrankiFlow Mail follows the same main/develop environment convention. Existing email sending and mailbox DNS records must be preserved independently when web-app custom domains are connected.
