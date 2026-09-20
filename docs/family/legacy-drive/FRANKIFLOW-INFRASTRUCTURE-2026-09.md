# Legacy Drive Snapshot — FrankiFlow Ecosystem – Website, Booking, Mail & Payment Infrastructure Documentation

> Imported into GitHub on 2026-09-18. This file is retained for historical/reference context only. Current source code, tests, ADRs, and maintained GitHub documentation override this snapshot where they differ. Do not put secrets into this file.

---

FrankiFlow Ecosystem
Website, Booking, Mail, Dynamic Pricing & Payment Infrastructure Documentation
Technical and operational reference – September 2026
Purpose of this document. This is the consolidated reference for the work completed around the FrankiHolz accommodation booking platform and its connection to the wider FrankiFlow web ecosystem. It explains what was built, why it was built this way, how each component works, what has been tested, and what remains before a full production launch. Passwords, secret API keys, webhook signing secrets and other sensitive credentials are intentionally excluded.


CURRENT ARCHITECTURE UPDATE — 15 SEPTEMBER 2026
This update supersedes older implementation notes below where they conflict with the current system.


Hosting and URLs
• FrankiFlow production: https://frankiflow.de (Netlify project frankiflow).
• FrankiHolz production: https://stay.frankiflow.de (Netlify project frankiholz).
• FrankiHolz develop/test: https://develop--frankiholz.netlify.app.
• FrankiFlow Mail production: https://mail.frankiflow.de (Netlify project frankiflow-mail).
• FrankiFlow Mail develop/test: https://develop--frankiflow-mail.netlify.app.
• main is production-ready code; develop is integration/testing. Temporary merged branches are automatically deleted while main/develop are preserved.


FrankiFlow enquiry transport
The current website and Preisrechner enquiry path uses anfrage@frankiflow.de as the automated sender identity and info@frankiflow.de as the internal recipient. Internal notifications use the customer address as Reply-To so a normal reply answers the customer. Customer acknowledgements are also sent from anfrage@frankiflow.de and use info@frankiflow.de as the reply/contact address. mail@frankiflow.de is not the current intended enquiry recipient.


FrankiHolz booking/payment architecture
The active develop implementation has moved beyond the earlier “admin approves → 120-minute Checkout payment” and later 48-hour manual-capture model. The current v2 flow saves a card/payment method through Stripe Checkout in setup mode and schedules charging according to a 14-day-before-check-in model. The backend stores payment_schedule_version, stripe_setup_intent_id, stripe_payment_method_id and charge_due_at. Charging is intended for 14 days before check-in, with the within-14-days case handled by the immediate/near-immediate confirmation/charge logic. Webhooks remain signature-verified and idempotent.


FrankiHolz sandbox safety
The Netlify develop hostname is explicitly recognized as development and therefore routes payment setup to frankiholz-create-authorization-test. Explicit stripe_test=1 or test=1 flags also force the sandbox path. Production uses the live endpoint. Supabase currently reports live_ready=true and test_ready=true, and test webhook/event records exist.


This does NOT mean the current v2 customer journey is certified problem-free. A full fresh browser QA run is still required to verify: booking creation, setup-mode Checkout with a Stripe test card, saved payment-method state, webhook updates, admin confirmation behavior, scheduled-charge timing, the inside-14-days case, cancellation/release, booking-status EN/DE, email lifecycle, duplicate submission/retry behavior and cleanup. Current status: sandbox and routing architecture are ready for extensive QA; full end-to-end sign-off is still pending.


FrankiHolz media behavior
Room 1 and Room 2 are active and currently have no uploaded room images. Legacy stock image_url values for these rooms were cleared. develop now renders “Will be uploaded soon” whenever there is no genuine frankiholz_room_images record. Room 3 is inactive. Public room media should come from Supabase Storage/image records rather than stock fallbacks.


FrankiHolz mail
Transactional sending identity: stay@frankiflow.de. Internal/admin booking notifications: info@frankiflow.de. Guest transactional mail is sent from stay@frankiflow.de and should direct replies/contact to info@frankiflow.de. Provider secrets remain backend-only.


FrankiFlow Mail
FrankiFlow Mail is now part of the ecosystem architecture rather than an external utility. Stack: Netlify frontend/PWA, Supabase Auth, Postgres + RLS, Supabase Edge Functions and Resend transport.


Develop currently includes: threaded/conversation inbox grouping, full chronological message history, double-click message dialog, editable dialog composer, Reply and Reply All, attachments, drafts, scheduled send, snooze/archive/spam/trash, search/labels/contacts/templates/signatures, responsive/PWA behavior, Meeting Scheduler below More and above Labels, automatic notification enablement subject to browser/OS permission, and Password & sign-in with show/hide eye controls. Mail users/personal mailboxes, Mail accounts, Notifications, Compose & reply and Sender identity status are intentionally removed from the normal Settings screen.


Mailbox data currently includes info@frankiflow.de, don.alex.perera@frankiflow.de and inuraamalsha@frankiflow.de. mail@frankiflow.de is removed as a configured mailbox. The intended model is individual Supabase Auth credentials + personal mailbox + shared info@ access controlled by RLS/account mappings. At this update, the two personal mailbox identities exist, but the corresponding independent Supabase Auth/mail-user records still require completion before those two users can log in separately. Credentials/passwords must never be recorded in this document.


Branch/release warning
FrankiFlow Mail develop is materially ahead of production main. Treat develop as pre-production until its changes are tested and intentionally merged. Likewise, FrankiHolz develop contains current room-placeholder and sandbox-routing fixes that must be tested before production promotion.




1. Executive Summary
________________
FrankiHolz has been developed from a simple accommodation website into a lightweight Airbnb-style direct booking platform. The public website allows a guest to choose one of three rooms, browse room photos, view a live availability calendar, receive dynamically calculated rates, submit a booking request and later check the booking/payment status. A separate administrator dashboard allows authorized staff to manage rooms, photos, hero content, prices, availability, manual blocks, bookings and the revenue-pricing strategy.
The platform is intentionally split into clear layers:
* Netlify hosts the public website and admin frontend and also receives the booking-notification form submission.
* Supabase provides the database, Row Level Security, authentication, storage, booking logic, availability logic, pricing logic and payment-related backend functions.
* Stripe provides secure hosted payment checkout. A separate FrankiHolz sandbox is used for testing so that FrankiHolz payment activity is isolated from unrelated Stripe environments.
* IONOS remains relevant to the wider FrankiFlow business for frankiflow.de domain registration and business email. The replacement FrankiFlow website has now been built on Netlify, and the next step is a controlled website-DNS cutover while preserving IONOS mail records.
* ShipStatic was useful for the original FrankiFlow price calculator and rapid static prototypes. The Preisrechner has now been rebuilt inside the FrankiFlow Netlify deployment, making Netlify the intended long-term host for the FrankiFlow website and calculator while FrankiHolz remains a separate Netlify project.
Current core booking rule: a new booking request does not block dates. The dates are only temporarily held after an administrator approves the request. Successful payment confirms the booking. If the payment window expires or payment fails, the hold is released and the room becomes available again.
2. Main URLs and Platform Roles
________________


Component
	Current role
	Reference
	FrankiHolz public website
	Guest-facing room selection, gallery, calendar, booking request and status/payment access
	https://stay.frankiflow.de/
	FrankiHolz admin
	Authenticated management dashboard
	https://stay.frankiflow.de/admin
	Booking status
	Guest checks a booking using reference + email and receives Pay now when applicable
	https://stay.frankiflow.de/booking-status
	Payment success
	Return page after Stripe Checkout
	https://stay.frankiflow.de/payment-success
	Supabase project
	Database, Auth, Storage, RPC functions, Edge Functions
	Existing project: FrankiFlow Pricing (project ref: bdeajozhylypiidrldka)
	Stripe
	Hosted payment checkout + webhook events
	Separate test environment: FrankiHolz sandbox
	FrankiFlow public site
	New cleaning-company website built on Netlify; IONOS remains the domain/email provider until DNS cutover
	https://www.frankiflow.de/
	FrankiFlow calculator
	Square-metre cleaning-price calculator prototype/production tool
	https://frankiflow.de/preisrechner/
	3. Design and Brand Direction
________________
The initial FrankiHolz versions were functional but visually separate from FrankiFlow. The design was then rebuilt around a FrankiFlow-style palette so the accommodation brand feels connected to the main business ecosystem.
3.1 Visual system
* Deep blue / blue-green for trust, headers and secondary actions.
* Fresh green for primary calls to action and successful states.
* Soft mint and ice backgrounds for sections and subtle status surfaces.
* White cards, rounded corners, soft shadows and generous spacing.
* Modern Manrope-style typography and stronger visual hierarchy.
* Responsive layouts for desktop and mobile.
3.2 Public navigation
The public header was simplified. The unnecessary Booking navigation item was removed, leaving the cleaner combination of Rooms and Book now.
3.3 Admin visual improvements
The administrator interface was redesigned with the same FrankiFlow color language. The native browser-looking file upload control was restyled with a branded gradient button, rounded upload area and consistent card design.
4. Frontend File Structure
________________
The current deployable site is a static frontend with Supabase/Stripe-backed behavior. The important files are:
File
	Purpose
	index.html
	Main guest website, room selection, galleries, calendar, booking form and booking-status section.
	admin.html
	Supabase-authenticated administration dashboard.
	booking-status.html
	Standalone guest booking/payment-status lookup page.
	payment-success.html
	Stripe Checkout return page after a payment is submitted.
	netlify-forms.html
	Hidden Netlify form definition used for booking-request email notifications.
	netlify.toml
	Netlify redirects such as /admin, /booking-status and /payment-success, plus response headers.
	assets/config.js
	Frontend-safe Supabase project configuration and media-bucket reference. No private Stripe secrets belong here.
	assets/styles.css
	FrankiFlow-inspired design system, calendars, forms, upload controls, booking cards and responsive rules.
	5. Public Guest Experience
________________
5.1 Room discovery
The public website retrieves room information from Supabase. The first room image uploaded by an admin becomes the visible room cover; a fallback image can still be used where necessary. Guests can choose among three primary rooms.
5.2 Room gallery
After selecting a room, the guest sees a larger image and a thumbnail gallery. Room photos are managed through Supabase Storage and the frankiholz_room_images table.
5.3 Live calendar
The guest calendar is room-specific. Dates are rendered from a database function rather than blindly trusting frontend logic. Calendar dates can show dynamic nightly prices, while blocked/booked dates are disabled and cannot be selected.
5.4 Date-range selection
The guest selects a check-in and check-out date. The frontend checks that the chosen range does not cross an unavailable date. The server performs the final authoritative availability check again before accepting the request.
5.5 Booking request form
The form collects:
* Guest name
* Email address
* Phone number
* Country
* Number of guests (bounded by the room's maximum capacity)
* Optional message
When the request succeeds, a unique reference such as FH-XXXXXXXX is returned together with the calculated stay total.
6. Booking Lifecycle – Final Business Logic
________________
The booking flow was deliberately changed after the initial version. The earlier design blocked the room as soon as a guest submitted a request. This was replaced with a more commercially useful approval-and-payment flow.
Stage
	Booking state
	Payment state
	Calendar behavior
	Guest submits request
	Pending
	Not started
	Dates remain available.
	Admin approves
	Confirmed/approved hold
	Awaiting payment
	Dates are temporarily held and become unavailable to other guests.
	Guest pays successfully
	Confirmed
	Paid
	Dates remain permanently booked.
	Payment expires
	Cancelled
	Expired
	Temporary hold is removed and dates become available again.
	Async payment fails
	Cancelled
	Failed
	Hold is released.
	Admin rejects before payment
	Cancelled
	Not started/expired as applicable
	No block remains.
	Important concurrency rule. Multiple guests may submit pending requests for the same dates because pending requests deliberately do not block inventory. When an admin tries to approve a request, Supabase re-checks availability inside the backend. If another booking has already been approved/confirmed for those dates, the later approval is rejected.
7. Administrator Authentication and Access
________________
7.1 Supabase Auth
Administrator login uses Supabase Auth rather than a plaintext password stored in a custom database table. This means password hashing and session management are handled by the authentication platform.
7.2 Admin allowlist
The database maintains a separate allowlist table, frankiholz_admin_users. Authentication alone is not enough: the signed-in user's email must also be present in the allowlist for the dashboard to load privileged data.
7.3 No public sign-up
There is no public admin registration button. New administrators should only be created intentionally through Supabase Auth and then added to the allowlist.
7.4 Browser-session behavior
The first hardened version forced a logout on every visit. This was later changed to the preferred behavior: after a successful login, Supabase may remember the session in that browser. Returning to /admin from the same browser can therefore open the dashboard directly, while a different browser/device still requires authentication.
8. Admin Dashboard Capabilities
________________
8.1 Hero/main image
* Upload the main hero image.
* Replace or delete the current hero image.
* Edit hero title and subtitle.
8.2 Room management
* Edit room name and description.
* Edit base nightly price.
* Edit maximum guest count.
* Hide/show a room to guests.
* Upload multiple room photos.
* Delete room photos.
8.3 Per-room admin calendar
Each room has its own admin calendar styled similarly to the guest calendar. The administrator selects a date or date range and can apply one of three states:
* Available – guests can select it.
* Blocked – unavailable because of maintenance, owner use, operational closure, etc.
* Booked – manual booked state that also prevents guest selection.
The same range panel can optionally set a date-specific price override and an admin note. Real booking-generated calendar rows are protected so the administrator does not accidentally remove a genuine reservation through the manual range tool.
8.4 Booking management
The bookings section displays booking reference, room, dates, total, guest details, booking status and payment status. For pending requests, the main action is Approve & create payment. Cancellation/rejection actions are also available. Paid bookings are intentionally protected from ordinary cancellation because a refund workflow is required before releasing paid inventory.
9. Supabase Database Design
________________
9.1 frankiholz_rooms
Stores the three main room definitions. Important fields include name, slug, description, base price, maximum guests, active flag, display order and a fallback image URL.
9.2 frankiholz_admin_users
Stores the allowlisted administrator email addresses used by the private admin-check helper.
9.3 frankiholz_bookings
Stores guest requests and payment lifecycle information. Core fields include:
* Booking reference and room ID
* Check-in / check-out
* Guest name, email, phone, country and guest count
* Message and calculated total price
* Booking status
* Payment status
* Approval time, payment deadline and paid time
* Stripe Checkout Session ID and payment URL
* Stripe Payment Intent reference where applicable
9.4 frankiholz_calendar
Stores explicit per-room, per-date state. It supports:
* is_available
* availability_status = available / blocked / booked
* Optional nightly price_override
* Optional admin note
* Optional booking ID linking a real reservation to the date
9.5 frankiholz_room_images
Stores ordered references to room image files in Supabase Storage.
9.6 frankiholz_site_settings
Stores the hero image path plus editable hero title and subtitle.
9.7 frankiholz_pricing_settings
Stores editable revenue-management rules such as weekend uplift, occupancy thresholds, last-minute discount, long-stay discounts and payment-hold duration.
9.8 frankiholz_payment_events
Stores processed Stripe event IDs so webhook processing is idempotent. If Stripe retries the same event, the system can recognize that the event was already handled instead of applying the same state change twice.
10. Supabase Storage and Media
________________
A public media bucket named frankiholz-media was created. Public retrieval is allowed so images can be displayed on the guest site, while upload/update/delete permissions are restricted to authenticated FrankiHolz administrators.
Configured media controls:
* Maximum image size: approximately 8 MB
* Accepted image formats: JPEG, PNG, WebP and AVIF
* Hero images stored under a hero path
* Room images stored under room-specific paths
11. Key Database Functions and Server-Side Rules
________________
11.1 frankiholz_create_booking(...)
Public booking RPC. It validates dates, guest details, room capacity and actual unavailable inventory. It calculates the total on the server and creates a pending booking. It deliberately does not create calendar blocks at this stage.
11.2 frankiholz_estimate_total(...)
Returns the dynamic total, availability and number of nights for a candidate stay.
11.3 frankiholz_get_calendar_rates(...)
Returns daily availability state and dynamic nightly price for the guest-facing calendar.
11.4 frankiholz_set_booking_status(...)
Admin-only booking-state transition. On approval, it uses a transaction/advisory lock and re-checks conflicts before temporarily blocking the dates. It also prevents paid bookings from being released without a refund workflow.
11.5 frankiholz_set_calendar_range(...)
Admin-only range operation that applies available, blocked or booked status across multiple dates.
11.6 Payment helper functions
Backend-only helpers store Stripe Checkout details, mark payment paid, mark payment failed and expire payment holds. These keep Stripe webhook handling separate from direct public database writes.
11.7 Booking-status lookup
The public status RPC requires both booking reference and guest email. This provides a simple verification step and avoids publishing a general list of booking records.
12. Dynamic Pricing Strategy
________________
A rule-based pricing engine was added to increase revenue during stronger demand while still providing controlled discounts where they are commercially useful. All major parameters can be edited from the admin dashboard.
12.1 Current starting settings
Rule
	Current starting value
	Purpose
	Weekend uplift
	+15% on Friday and Saturday nights
	Capture higher willingness to pay on stronger leisure-demand nights.
	Occupancy level 1
	At approximately 33% occupancy: +10%
	Begin increasing price as inventory starts selling.
	Occupancy level 2
	At approximately 66% occupancy: +20%
	Protect remaining inventory and increase ADR when demand is high.
	Last-minute window
	Within 3 days: -10%
	Try to fill otherwise empty inventory shortly before arrival.
	Long stay 1
	7+ nights: -5%
	Reward longer stays and reduce turnover workload.
	Long stay 2
	14+ nights: -10%
	Encourage very long stays.
	Payment hold
	120 minutes
	Give an approved guest time to complete payment without locking the room indefinitely.
	12.2 Pricing order and override concept
The room's base price is the starting point. A manual calendar price override can replace the base for a particular date. Weekend and occupancy adjustments are then applied, with last-minute discount logic where applicable. The long-stay discount is applied to the stay total.
12.3 Commercial safeguards
The implementation contains a lower-bound concept so aggressive discount combinations cannot reduce a nightly rate indefinitely. For production revenue management, a dedicated per-room absolute minimum rate and maximum markup should eventually be added to the admin settings.
12.4 Verified calculation examples
* A €45 base-price room for a two-night Friday/Saturday test calculated to €103.50 under the weekend uplift.
* A seven-night test calculated to €312.08 after the active rules including the long-stay discount.
13. Stripe Payment Architecture
________________
13.1 Separate FrankiHolz sandbox
FrankiHolz payment testing is isolated in a dedicated Stripe test environment named FrankiHolz sandbox. Existing unrelated Stripe environments were intentionally left untouched.
13.2 Hosted Checkout
After an admin approves a booking request, a Supabase Edge Function creates a Stripe-hosted Checkout Session. The guest is redirected to Stripe rather than entering raw card data into FrankiHolz. This keeps PCI-sensitive payment details away from the FrankiHolz frontend.
13.3 Checkout metadata
The Checkout Session carries booking metadata such as the internal booking ID and FrankiHolz reference. This allows webhook events to be matched back to the correct Supabase booking.
13.4 Payment deadline
The current business setting is a 120-minute hold after approval. Stripe Checkout is created with a matching expiration window within Stripe's supported limits.
13.5 Webhook
A Stripe webhook endpoint points to the Supabase Edge Function:
https://bdeajozhylypiidrldka.supabase.co/functions/v1/frankiholz-stripe-webhook
The webhook listens for the relevant Checkout Session events:
* checkout.session.completed
* checkout.session.async_payment_succeeded
* checkout.session.async_payment_failed
* checkout.session.expired
The webhook signing secret and Stripe private API key are stored as Supabase Edge Function secrets and are not stored in the frontend or this documentation.
14. Supabase Edge Functions
________________


Function
	Role
	frankiholz-create-payment
	Admin-authenticated function. Approves/re-checks a pending booking and creates/reuses the Stripe Checkout Session.
	frankiholz-stripe-webhook
	Public webhook receiver with Stripe-signature verification. Converts Stripe events into booking/payment state changes.
	frankiholz-cancel-payment
	Admin-authenticated cancellation. Expires an open Stripe Checkout Session before releasing the booking hold.
	Temporary integration self-test
	A temporary diagnostic function was created during integration testing and was then disabled. It must not be treated as a production API.
	15. Payment and Booking Tests Completed
________________
Several backend tests were performed against the actual FrankiHolz sandbox and Supabase project.
15.1 Pending request test
A test booking request was created. Result:
* Booking status: pending
* Payment status: not started
* Blocked dates: 0
This confirmed the key requirement that a request alone does not remove room availability.
15.2 Admin approval/hold test
The test request was approved through the backend. Result:
* Booking status changed to confirmed/approved hold.
* Payment status changed to awaiting payment.
* Two test nights became unavailable.
* A payment deadline was created.
15.3 Real Stripe sandbox Checkout test
Supabase successfully created a real Stripe Checkout Session in the FrankiHolz sandbox for €90. This verified that the configured Stripe private key points to the correct sandbox and that Checkout creation works.
15.4 Real Stripe webhook-expiration test
A test Checkout Session was expired. Stripe sent a real checkout.session.expired event to Supabase. The webhook signature was accepted, the event was recorded in frankiholz_payment_events, the booking moved to expired/cancelled and the held dates were released. This verified the live webhook route and signing-secret configuration.
15.5 Paid-state backend test
The successful-payment database transition was tested separately: the booking became confirmed + paid, the payment deadline was cleared and the selected dates remained booked. The temporary test rows were subsequently cleaned up.
Remaining manual payment test: although the real Stripe sandbox Checkout creation and real webhook expiration path were tested, the final customer-visible test using a Stripe test card should still be performed through the live website so the complete browser journey is observed end to end.
16. Manual Stripe Test Procedure
________________
1. Open the FrankiHolz public website and create a booking request for available dates.
2. Verify the request receives a FrankiHolz reference and the dates remain available.
3. Open the admin dashboard and find the pending booking.
4. Click Approve & create payment.
5. Verify the dates become temporarily unavailable.
6. On Stripe Checkout, use Stripe's common test card 4242 4242 4242 4242, any future expiry and any three-digit CVC.
7. Complete the sandbox payment.
8. After redirect, open the booking-status page and check the reference + email.
9. Expected result: Booking = confirmed; Payment = paid.
10. Return to the room calendar and verify the dates remain booked.
A separate shareable PDF test guide was also produced during the project.
17. Booking Request Email Notifications
________________
17.1 Netlify Forms
The frontend submits a hidden Netlify form named frankiholz-booking after a successful Supabase booking request. This allows notification emails to be generated independently of the database booking itself.
17.2 Submitted notification fields
The form includes booking reference, room, check-in/check-out, guest name, guest email, phone, country, number of guests, total price and guest message.
17.3 Target recipients
The intended booking-request notification recipients are:
* frankiflow.reinigung@gmail.com
* info@frankiflow.de
Netlify supports adding separate Form Submission email notifications for the same form. If not already done in the Netlify UI, both recipients should be configured under the project's form notification settings.
17.4 Failure isolation
If the Netlify email/form submission fails after Supabase has accepted the booking, the booking remains stored in Supabase. This avoids losing a valid booking request just because the notification mechanism had a temporary problem.
18. Hosting and Deployment
________________
18.1 Netlify project
The existing Netlify project is named frankiholz. Forms are enabled and recent deployments have reached the ready state.
18.2 Deployment method
During development, ZIP packages were generated for drag-and-drop/manual Netlify deployment. Netlify's deployment integration was also used; local CLI uploads occasionally timed out from the working environment even when the remote Netlify deploy later completed successfully.
18.3 Recommended deployment discipline
* Keep one production Netlify project rather than creating duplicates.
* Use meaningful ZIP/build version names or Git commits for changes.
* Test admin login, public room calendar and booking status after every significant deploy.
* Do not create test bookings on production dates without cleaning them afterward.
* Use the Stripe sandbox until the complete workflow has been signed off.
19. Netlify vs ShipStatic vs IONOS – Hosting Strategy
________________
19.1 Recommendation
The recommended long-term architecture is to use Netlify as the primary website host for both FrankiFlow and FrankiHolz, while keeping Supabase for backend services and Stripe for payments.
19.2 Why Netlify fits the combined ecosystem
* Supports static frontend hosting, custom domains and SSL.
* Supports form handling used by FrankiHolz booking notifications.
* Works cleanly with Supabase Auth/database/storage.
* Works well with Stripe and serverless/Edge Function architecture.
* Allows multiple projects under one team.
* Provides deploy previews/versioned deployments and rollback options.
19.3 ShipStatic historical role
ShipStatic remains useful for rapid static prototypes, but it is no longer the intended production host for the FrankiFlow Preisrechner. The calculator has been migrated into the FrankiFlow Netlify site at /preisrechner/ so the website, calculator, forms and admin surfaces can share one production hosting platform.
19.4 IONOS role
IONOS currently provides the frankiflow.de domain/DNS environment and the professional business email environment associated with the domain. Website hosting, domain/DNS management and email are treated as separate operational components. The mailbox info@frankiflow.de depends on the correct mail-related DNS configuration.
20. Security Design
________________
20.1 Secrets
* Stripe secret API key is stored only as a Supabase Edge Function secret.
* Stripe webhook signing secret is stored only as a Supabase Edge Function secret.
* No secret Stripe key is embedded in browser JavaScript.
* Admin password is handled by Supabase Auth and is not stored as plaintext in application tables.
20.2 Row Level Security
RLS is enabled on sensitive tables. Public users can only read data intended for the public website. Admin updates require authenticated/admin checks. Guest personal information is not exposed as a public bookings list.
20.3 Server-authoritative pricing
The frontend may display an estimate, but the authoritative booking total is calculated server-side. This prevents a guest from changing JavaScript in the browser to submit an arbitrary lower price.
20.4 Server-authoritative availability
The browser calendar is for usability only. Approval and booking RPCs re-check the database before changing inventory.
20.5 Webhook idempotency
Stripe event IDs are stored so repeated webhook delivery does not repeatedly apply the same business action.
21. Operating Procedures
________________
21.1 Handling a new booking request
1. Open the admin dashboard.
2. Review guest details, requested room, dates and total.
3. Check that the dates are still commercially acceptable.
4. If accepted, click Approve & create payment.
5. The dates become temporarily held and the Stripe payment is created.
6. Guest completes payment through the payment link/status page.
7. After Stripe confirms payment, the booking shows paid & confirmed.
21.2 Rejecting a booking request
Reject/cancel the pending request from the admin dashboard. Because pending requests never blocked inventory, no room dates need to be released.
21.3 Payment hold expires
No manual action should be needed. Stripe emits an expiration event, the webhook marks the booking expired/cancelled and Supabase releases the booked-date rows.
21.4 Blocking maintenance dates
1. Open the room in Admin.
2. Select start and end dates on that room's admin calendar.
3. Add an optional note.
4. Click Block range.
21.5 Opening dates again
Select the desired date range and click Make available. Genuine booking-linked dates remain protected.
21.6 Changing prices
Use room base price for normal pricing, Dynamic Pricing for general revenue rules, and a calendar price override for specific special dates/events.
22. Known Limitations and Items Not Yet Fully Implemented
________________
* Refund workflow: paid bookings are protected from simple cancellation, but a proper Stripe refund + booking release process still needs to be built.
* Guest confirmation email: owner/admin booking-request emails are supported via Netlify Forms, but a polished automated guest email sequence (request received / approved / payment received / cancelled) should be added.
* Automatic payment-link email: the guest can check booking status and click Pay now. A dedicated transactional email should eventually send the payment link immediately after admin approval.
* Real property content: final FrankiHolz room names, descriptions, photos, address, amenities and policies still need to replace placeholders where applicable.
* Legal pages: Privacy Policy, Impressum/provider details where applicable, Terms, booking conditions, cancellation/refund policy and payment terms should be published before taking real payments.
* Production Stripe: the current payment work is in the FrankiHolz sandbox. Live mode should only be enabled after full manual testing and legal/commercial review.
* Dynamic pricing sophistication: future versions could add seasonality, local event calendars, minimum/maximum nightly prices and occupancy forecasting.
* Image optimization: automatic compression/resizing and preferred room-image ordering would improve performance.
* Guest cancellation/self-service: not currently provided.
* Multilingual content: German and/or Sinhala versions can be added later if commercially useful.
23. Recommended Production Checklist
________________


Priority
	Action
	1
	Complete the visible Stripe sandbox test using the live FrankiHolz website and Stripe test card.
	2
	Verify both Netlify booking-notification email recipients receive a test request.
	3
	Replace placeholder room content with final names, photos, descriptions, capacities and prices.
	4
	Add booking/cancellation/refund terms and privacy/legal pages.
	5
	Define production rate floors, weekend/occupancy strategy and special-event pricing.
	6
	Implement guest transactional emails, particularly approval/payment-link and payment-confirmation messages.
	7
	Implement Stripe refund handling before allowing paid bookings to be cancelled from Admin.
	8
	Choose the final FrankiHolz custom domain and connect it to Netlify.
	9
	Switch Stripe from sandbox to live only after the complete flow is signed off.
	10
	Set up monitoring/backups and document who is responsible for daily booking operations.
	26. FrankiFlow Bilingual Interface
FrankiFlow uses one bilingual DE/EN interface across the public website, the integrated Preisrechner, the central /admin/ panel, Impressum and Datenschutz pages. Separate /en/ routes are not required.
The browser preference frankiflow-lang is the shared language state. Switching language on one FrankiFlow page carries the preference to the other FrankiFlow interfaces.
The central admin is bilingual and manages both German and English public website content. German and English CMS fields exist for the hero eyebrow, title, subtitle, offer title, offer text, service area and primary/secondary CTA labels. Contact details, legal identity, photos, leads, payments and pricing records remain single-source.
The Supabase table public.frankiflow_site_settings contains the corresponding *_en fields. Pricing continues to use public.pricing_config as the source of truth, while English service wording is a customer-facing presentation layer. The calculator, quotation and invoice continue to use the selected language consistently.
27. Current SEO and Public Search Setup
Update date: 9 September 2026
FrankiFlow public search domain is https://frankiflow.de/. The current SEO-ready website package uses Frankfurt-focused page titles/descriptions, canonical URLs, Open Graph metadata, CleaningService structured data, robots.txt, sitemap.xml, an English homepage at /en/, hreflang links, a local Frankfurt section, FAQs and dedicated German/English service pages for the core cleaning services. The administrative area is excluded from search indexing. The canonical FrankiFlow website logo asset is FrankiFlow-transparent.png, derived from the supplied FrankiFlow.png by removing only the white background while preserving the original artwork.
FrankiHolz public search domain is https://stay.frankiflow.de/. The public accommodation address is Seehofstraße 20, 60594 Frankfurt am Main, Germany. Supabase site settings now contain the Frankfurt address, German and English hero content, and German/English SEO title and description fields. All three active room descriptions include Frankfurt and the accommodation address context.
The current FrankiHolz Netlify frontend is maintained as a complete deployable package with index.html at archive root, booking/admin/payment pages, Netlify route rules, Frankfurt SEO metadata and structured data, robots.txt, sitemap.xml, visible location information, noindex protection for operational pages and a custom 404 page. Deploy only the complete package to the existing frankiholz Netlify project.
External search-account tasks remain outside the website code: Google Search Console verification, sitemap submission, URL inspection/index requests, Google Business Profile/local listing maintenance and ongoing review/link acquisition.
28. Maintenance Notes for Future Developers
________________
* Do not expose Supabase service-role/secret keys or Stripe secret keys in assets/config.js.
* Do not change the pending-booking behavior without understanding that pending requests intentionally overlap and only approval locks inventory.
* Any change to booking approval must preserve the server-side conflict re-check.
* Any change to payment logic must preserve webhook signature verification and event idempotency.
* Do not directly delete booking-linked calendar rows to “make dates free”. Use the booking/payment workflow.
* Paid booking cancellation requires a real refund workflow before inventory release.
* Keep the FrankiHolz Stripe sandbox separate from other business sandboxes.
* When testing, use clearly labelled test guest details and remove test database records afterward.
* Before changing Netlify forms, ensure the hidden frankiholz-booking form remains detectable in the production deploy.
* For production changes, prefer version-controlled/Git deployment over ad-hoc ZIP replacement once the project stabilizes.
27. Final Architecture Overview
________________
Guest Browser
↓ Netlify-hosted FrankiHolz frontend
↓ Supabase public RPCs for rooms, rates, availability and booking request
↓ Pending booking stored without inventory block
Administrator
↓ Supabase Auth + admin allowlist
↓ Admin dashboard
↓ Approve & create payment
↓ Supabase checks availability and places temporary room hold
Payment
↓ Supabase Edge Function creates Stripe Checkout in FrankiHolz sandbox/live account
↓ Guest pays on Stripe-hosted page
↓ Stripe webhook → Supabase Edge Function
↓ Paid = booking confirmed and dates remain booked
↓ Expired/failed = hold released and room reopens
Notifications
↓ Netlify booking form
↓ Owner/admin email notifications to configured recipients
Overall status: the system has moved beyond a visual prototype. The main database booking rules, admin calendar, dynamic pricing engine, Stripe sandbox Checkout creation and real webhook-expiration path have been implemented and tested. The remaining work is primarily production readiness: final content, legal/policy pages, transactional guest emails, refund handling, complete manual payment test and eventual live Stripe activation.
Document prepared as a consolidated project reference. Sensitive credentials are intentionally omitted. Update this document whenever payment rules, dynamic pricing settings, production domains or data schema change materially.
28. FrankiFlow Netlify Website & Domain Cutover Update
Update date: 9 September 2026


The modern FrankiFlow website is hosted in the Netlify project frankiflow at https://frankiflow.de. The project contains the main cleaning-company website, one unified admin at /admin/ for website content, photos, live Preisrechner settings, leads and payments, the public Preisrechner at /preisrechner/, and legal pages.


The FrankiFlow Preisrechner is no longer intended to run as a separate ShipStatic production deployment. Its Supabase-backed pricing logic, Supabase Auth pricing-admin authorization and protected invoice functions are retained while the frontend is hosted inside the FrankiFlow Netlify project.


FrankiHolz remains a separate Netlify project at https://stay.frankiflow.de. It should receive its own custom domain or subdomain rather than sharing the frankiflow.de apex with the FrankiFlow project. A possible future option is frankiholz.frankiflow.de, subject to final naming approval.


The next operational step is the IONOS → Netlify website-DNS cutover. The domain and business email can remain at IONOS. Only website-facing DNS records should be changed for the Netlify connection. MX, SPF, DKIM, DMARC and other mail-related records for info@frankiflow.de must be preserved.


A dedicated living document named “FrankiFlow Website & Netlify Migration Documentation” has been added to the project Drive folder. It contains the detailed architecture, domain cutover sequence, validation checklist, rollback procedure and documentation-maintenance rule. This consolidated document should continue to be updated alongside that dedicated document whenever architecture, domains, payments, pricing or deployment behavior changes materially.


29. FrankiHolz Airbnb iCal Calendar Integration
Update date: 9 September 2026
Room 1 and Room 2 are connected to their respective Airbnb iCalendar (.ics) export feeds. The actual feed URLs are intentionally excluded from this documentation and from public website code. They are stored in the protected Supabase table public.frankiholz_ical_feeds. Room 3 can be connected later from the authenticated admin when its Airbnb export link is available.


Airbnb-derived unavailable dates are stored separately in public.frankiholz_ical_blocks. This keeps external calendar synchronization separate from FrankiHolz manual calendar records, date-specific price overrides and genuine FrankiHolz booking rows. The public calendar, price-estimate RPC, booking-creation RPC and admin approval RPC all check external iCal blocks, so an Airbnb-unavailable date cannot be booked or approved through FrankiHolz.


The admin-authenticated Supabase Edge Function frankiholz-sync-airbnb fetches enabled feeds, parses iCalendar VEVENT date ranges, skips cancelled events and transactionally replaces the external blocks for each room. If a feed fetch fails, the existing imported blocks are retained rather than deliberately cleared.


The FrankiHolz admin dashboard includes an Airbnb calendar sync section showing connection and last-sync status. An authorized admin can add or replace a room feed and click “Sync Airbnb calendars now”. The current synchronization trigger is manual. After changing an Airbnb feed or before relying on newly changed Airbnb availability, run the sync and verify that imported dates appear as Airbnb blocks in Admin and as unavailable in the guest calendar.


The FrankiHolz payment Edge Functions accept both https://stay.frankiflow.de and https://frankiholz.netlify.app as allowed browser origins. Stripe Checkout success and cancellation routes use the production custom-domain paths /payment-success and /booking-status by default.


31. FrankiFlow Customer-Facing Service Checklist
Update date: 10 September 2026


The FrankiFlow Preisrechner contains a customer-facing Leistungscheckliste / Service checklist as the step directly after “Angebot vorbereiten / Prepare a quotation”. Customers can preview the service scope before printing and can choose whether to attach the checklist to the quotation PDF/printout; attachment is enabled by default.


Checklist content is selected dynamically from the chosen cleaning service. Büroreinigung uses Office areas, Kitchen & break area, Toilets & sanitary areas and Entrance & corridors. Wohnungsreinigung uses Living & sleeping areas, Kitchen, Bathroom & toilet and Hallway & entrance. Ferienwohnung/Airbnb uses Sleeping & living areas, Kitchen, Bathroom & toilet and Guest area/final check. Treppenhausreinigung uses Entrance/common areas, Stairs/landings/floors and Railings/doors/touch points.


Grundreinigung extends the base checklist with a separate detailed deep-cleaning checklist covering surfaces/details, kitchen and sanitary work. Refrigerator interior, cupboard interior, carpet deep cleaning and other property-specific extras are explicitly marked as only included when separately agreed. Fensterreinigung has an independent checklist for windows/glass and frames/rebates/window sills. Window-only quotes omit the unrelated base checklist.


The print flow keeps the quotation as page 1 and appends the applicable branded checklist page(s). Checklist pages inherit the selected DE/EN language and include customer/property identification, categorized tasks, service-scope note and the evenly distributed FrankiFlow company-data footer. The customer-facing checklist is based on the approved FrankiFlow Cleaning & Quality Control Checklist while deliberately excluding internal employee time/signature and internal quality-control fields. Invoice printing does not automatically append the client checklist.


30. FrankiFlow Quotation & Invoice Print Standard
Update date: 10 September 2026
The current FrankiFlow calculator produces quotation and authenticated-invoice print views in a modernized one-page A4 style based on the established FrankiFlow quotation layout.


The print design uses the transparent canonical FrankiFlow logo and tagline at the top-left, document type plus a prominent featured amount at the top-right, a clear customer/service section, customer-facing itemized pricing, regular monthly total and a highlighted first-contract-month amount when the promotion applies. Invoice output additionally includes invoice metadata and protected payment information in a distinct block.


The company-data footer is visually anchored at the bottom of the A4 page rather than immediately following the calculation. Five fields are distributed evenly across the page width: Telefon +49 176 62493041; E-Mail info@frankiflow.de; Website www.frankiflow.de; Steuernummer 014/811/68462; W-IdNr. DE464605581. A small tax/legal note sits beneath this row.


The print output remains bilingual. It preserves the pricing-data boundary: internal calculation mechanics and the internal Grundreinigung percentage are not printed; public quotations contain no protected bank/payment values; invoice payment details are available only after authenticated protected billing retrieval. Browser print/PDF output is currently used, so browser-generated headers and footers depend on the user's print-dialog setting.


32. FrankiFlow Preisrechner - Standalone Window Cleaning & Print QA
Update date: 10 September 2026
Fensterreinigung / Window cleaning is now a primary Preisrechner service as well as an optional add-on for the other cleaning types. In standalone mode the customer does not need to select an unrelated floor-cleaning service. Floor area, Grundreinigung, equipment and the duplicate window add-on are hidden; glass area is placed in the main scope step. The initial frequency switches to Einmalig / One-time when the customer first chooses the standalone window service, while recurring frequency options remain available.
The standalone calculation is driven by Supabase window_settings. Current live values are base 5 €, gradient 3.00 €/m² glass and minimum 35 € per visit. Therefore 65 m² glass calculates as max(35 €, 5 € + 65 × 3 €) = 200 € per visit. The enabled 25% new-customer promotion yields 150 € for a one-visit first month before VAT when VAT is not selected.
Window-only quotations/invoices and attached service checklists are strictly labelled Fensterreinigung / Window cleaning. Büroreinigung / Office cleaning and Allgemeine Reinigung / General cleaning must not appear in a window-only printout. The printed per-visit amount is the complete window charge; recurring monthly totals are based on the same per-visit amount multiplied by configured visits.
Print CSS was hardened for reliable browser/PDF rendering after a bold-glyph issue was reported. The print path uses conservative system fonts, disables synthetic weights and ligatures, forces normal body-text weight and draws checklist/check indicators with CSS rather than relying on font glyphs. The physical-bottom company-data footer remains unchanged. Internal print/checklist QA pages are excluded from production deployments.


Public Footer & Cross-Site Navigation Update – 10 September 2026
The FrankiFlow frontend now includes a standardized company-data strip at the bottom of public pages and the Preisrechner. The strip distributes these public values evenly: Telefon / Phone +49 176 62493041; E-Mail info@frankiflow.de; Website www.frankiflow.de; Steuernummer / Tax No. 014/811/68462; W-IdNr. DE464605581.
All customer-facing WhatsApp actions display a WhatsApp logo/icon next to the WhatsApp wording. The FrankiFlow admin WhatsApp URL field is visually marked with the same icon while the underlying destination remains configurable through the existing website settings.
A direct link to the separate FrankiHolz accommodation product at https://stay.frankiflow.de/ is included in the FrankiFlow public footer structure and Preisrechner footer. This is a cross-site navigation link only; FrankiFlow and FrankiHolz remain separate Netlify projects.
This update does not alter Supabase schemas, booking rules, pricing calculations, Stripe payment behavior, quotation/invoice calculations or checklist logic.




Current FrankiFlow Checklist Administration & Mobile App — 10 September 2026
The current FrankiFlow checklist architecture uses public.frankiflow_checklists in the shared Supabase backend. It contains bilingual service scope for office cleaning, home cleaning, Airbnb/holiday-rental cleaning, stairwell cleaning, extended deep cleaning and window cleaning. The public website reads these records; only authorized FrankiFlow administrators can modify them.


The web admin at https://frankiflow.de/admin/ includes Checklisten / Checklists controls for German and English content. The administrator can edit service labels, section headings and task text in both languages, add/remove/reorder sections, add/remove tasks and mark sections as optional / specifically agreed. The Preisrechner uses the saved records in the customer checklist preview and quotation-PDF attachment.


The mobile administration product is named FrankiFlow Admin App and is maintained in GitHub repository dn-lx/franki-admin. The app uses the same Supabase project and has a FrankiFlow Checklists tab for editing the same bilingual checklist records. The stable mobile identifiers remain de.frankiflow.admin on Android and iOS.


The current customer-facing FrankiFlow website footer follows a conventional compact business footer: brand, useful services/navigation, direct phone/email/WhatsApp contact, Impressum, Datenschutz, FrankiHolz accommodation link and copyright/service-area context. The separate Steuernummer/W-IdNr. company-data strip is not part of the public marketing footer, and the /admin/ route is not advertised there. The quotation/invoice print footer remains a separate document layout and retains the approved business information.




FrankiFlow Admin App – Current Mobile Setup
FrankiFlow Admin App is currently version 1.2.1. The Android application ID and iOS bundle identifier remain de.frankiflow.admin. The approved application icon is the dark, symbol-only FrankiFlow icon stored in the project Drive folder as FrankiFlow-Admin-App-Icon-Dark.png. The main dashboard uses a neutral “Dashboard” heading instead of creating a greeting from the administrator email. FrankiHolz booking management uses compact horizontal status chips for All / Pending / Confirmed / Paid / Cancelled so the filter controls remain low-height and phone-friendly. The Android GitHub Actions workflow validates TypeScript, applies the approved app icon, generates the Android project, builds FrankiFlow-Admin-App-1.2.1.apk, and performs an Android emulator launch smoke test.


FrankiFlow Admin App 1.2.2 – Android Launcher Icon and FrankiHolz Calendar Controls
- The Android adaptive launcher icon now uses a dedicated transparent FrankiFlow picture-only foreground with safe padding and a dark navy background (#052A4B), preventing the symbol from being cropped by circular/rounded Android launcher masks.
- The normal application icon and adaptive foreground are separate assets stored in the FrankiFlow Drive folder and pulled into the GitHub Android build before Expo prebuild.
- FrankiHolz Calendar room-selection controls are compact horizontal buttons with a fixed 34 px height and horizontal scrolling when needed.
- The app continues to use the name FrankiFlow Admin App and package identifier de.frankiflow.admin.


GitHub Source & Controlled Production Deployment — 10 September 2026
The current website source is version-controlled in two dedicated GitHub repositories: FrankiFlow at https://github.com/dn-lx/frankiflow and FrankiHolz at https://github.com/dn-lx/frankiholz. Each repository's main branch represents production-ready website code.
For future work, create one work/<topic> branch from current main and collect the complete batch of requested changes there. Intermediate commits stay on the working branch. Only after the full batch has been checked should it be merged into main. Netlify should deploy production only from main, so one completed batch produces one production deployment rather than a deployment for every intermediate edit.
Automatic Netlify branch deploys and Deploy Previews should remain disabled by default to control deployment usage. They can be enabled temporarily only when a preview is intentionally needed.
FrankiFlow uses repository-root base settings, no build command, publish directory public, and netlify/functions for functions as defined in netlify.toml. FrankiHolz uses repository-root base settings, no build command and repository root (.) as the publish directory because index.html is at the repository root. The existing Netlify projects, custom production domains and environment variables remain the production targets.
Secret Stripe keys, Supabase service-role/secret keys, webhook secrets and private Airbnb iCal URLs must never be committed to either repository


Current FrankiHolz Bilingual Website, Live Calendar Sync & Production Payments — 11 September 2026


FrankiHolz website development is version-controlled in GitHub repository dn-lx/frankiholz. The active change batch is kept on work/bilingual-live-booking and is not merged into main until the complete batch is approved. Netlify production remains tied to main so intermediate website work does not create unnecessary production deployments.


The current FrankiHolz interface uses the exact transparent FrankiHolz logo asset from Drive, FrankiHolz-transparent.png. The guest website now supports English and German with a language switch. Hero/SEO settings and room names/descriptions are stored in separate English and German fields. Booking requests store the selected language, and booking/status/payment return interfaces follow that language.


Customer-facing wording is managed from public.frankiholz_copy. Each wording record contains English and German text. The authenticated FrankiHolz admin contains a bilingual public-wording editor, plus bilingual hero, SEO, room-name and room-description editors. Public users can read wording but only authorized FrankiHolz administrators can modify it.


Opening the public FrankiHolz website now requests a server-side Airbnb/iCalendar refresh before current room/calendar data is loaded. The frankiholz-sync-airbnb Edge Function accepts the trusted FrankiHolz website trigger and authenticated admin trigger, keeps private .ics URLs server-side, and uses a short cooldown so repeated page refreshes do not repeatedly fetch the external feeds. Room 1 and Room 2 currently have enabled Airbnb feeds; Room 3 can be connected when its feed is available.


FrankiHolz has a live Stripe account with real charging and payout capability enabled. A live production webhook endpoint is enabled at the existing frankiholz-stripe-webhook Supabase Edge Function for checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed and checkout.session.expired. The payment-creation function supports German/English Checkout locale and custom-domain return URLs. Before accepting real guest payments, the FrankiHolz live Stripe secret key and the live webhook signing secret must be stored directly in Supabase Edge Function secrets; secret values are intentionally not recorded in GitHub or this documentation. After those secrets are set, one small controlled live booking/payment should be used to verify the complete real-payment flow.


Guest transactional email should be sent server-side. Recommended current setup: Resend with sending subdomain mail.frankiflow.de, From identity FrankiHolz <stay@frankiflow.de>, and Reply-To info@frankiflow.de. Keep RESEND_API_KEY, FRANKIHOLZ_EMAIL_FROM and FRANKIHOLZ_EMAIL_REPLY_TO in Supabase Edge Function secrets only. Recommended guest messages are request received, approved/payment requested, rejected/cancelled and payment confirmed. Templates should use frankiholz_bookings.language so German bookings receive German email and English bookings receive English email.
.






SEPTEMBER 12, 2026 — DEVELOPMENT AND FRANKIFLOW CMS UPDATE
________________


Git / hosting workflow
FrankiFlow:
* main → Netlify production → https://frankiflow.de
* develop → ShipStatic development → https://frankiflow.shipstatic.com


FrankiHolz:
* production remains separate from development
* develop → ShipStatic development → https://develop--frankiholz.netlify.app


The ShipStatic GitHub Actions workflows use the configured SHIP_TOKEN plus SHIP_DOMAIN. Successful develop deployments create a new immutable ShipStatic deployment and move the permanent custom development domain to that new deployment. This keeps a stable testing URL while preserving versioned deployments internally.


FrankiFlow homepage CMS enhancement
PR #23 was merged into develop and deployed successfully to development on commit 5609f718ad404c45deb9df7f6a3fa66ebeb1534a. This feature has not been promoted to main/production yet.


Changes include:
* removed the large homepage Price Calculator promo section
* removed the separate Frankfurt local-service block
* approximately doubled the desktop header-logo presentation while retaining mobile sizing rules
* added bilingual About Us content and admin editing
* added bilingual FAQ administration with add/remove/edit capability
* added show/hide controls for major homepage sections
* added English capitalization normalization for public UI copy
* added tracked Supabase migration 004_frankiflow_homepage_cms.sql
* expanded npm JavaScript validation coverage


The active Supabase frankiflow_site_settings table now stores About Us fields, FAQ heading/intro fields, structured FAQ items and homepage section-visibility configuration. Admin updates are persisted in Supabase and consumed by the public homepage without requiring a frontend code change for normal content edits.


FRANKIFLOW ADMIN-WIDE UI & ABOUT PAGE UPDATE — 12 SEPTEMBER 2026


PR #25 was merged into develop on commit 368103148253e972654d75f833f4154ea33d2ede and deployed successfully to ShipStatic development. The visual system approved for the Homepage CMS is now applied across all FrankiFlow Admin panels: Dashboard, Website, Photos, Pricing, Checklists, Enquiries and Import / Export. Shared improvements include consistent dark section headers, card hierarchy, responsive forms, modern tables, improved media/configuration layouts and stronger desktop/tablet/mobile responsiveness. Existing Supabase-backed business logic remains unchanged.


FrankiFlow now has a dedicated bilingual public About Us page at /about/. The page reads the same Supabase about_sections content that is edited in Admin, so About Us content remains single-source. The homepage About Us area is reduced to a compact teaser with a CTA to the dedicated page. About Us navigation is linked from the homepage and service pages, and /about/ has been added to sitemap.xml. This change is currently on develop/development only; main production remains unchanged pending approval.


Current FrankiFlow development test URL:
https://frankiflow.shipstatic.com




ENVIRONMENT DOMAIN STANDARD — 12 SEPTEMBER 2026
All FrankiFlow ecosystem development environments use the dev. prefix directly in front of the production hostname. Staging-based URL naming is retired.
FrankiFlow production: https://frankiflow.de
FrankiFlow development: https://frankiflow.shipstatic.com
FrankiHolz production: https://stay.frankiflow.de
FrankiHolz development: https://develop--frankiholz.netlify.app
FrankiFlow Mail production web app: https://mail.frankiflow.de
FrankiFlow Mail development web app: https://develop--frankiflow-mail.netlify.app
The main branch is the production branch. The develop branch is the development branch. Website development is deployed to ShipStatic and production is deployed through Netlify. FrankiFlow Mail follows the same main/develop environment convention. Mail-delivery DNS and Resend verification records remain separate from the web-app hosting records and must be preserved during domain changes.
