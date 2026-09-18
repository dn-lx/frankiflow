# Legacy Drive Snapshot — FrankiFlow Preisrechner – System Documentation

> Imported into GitHub on 2026-09-18. This file is retained for historical/reference context only. Current source code, tests, ADRs, and maintained GitHub documentation override this snapshot where they differ. Do not put secrets into this file.

---

FrankiFlow Preisrechner – System Documentation


Version: September 2026
System: FrankiFlow Preisrechner + Admin + Supabase backend + Invoice/Quotation flow
Primary deployment target: https://frankiflow.de/preisrechner/
Admin path: /admin/ → Preise


1. Purpose and Scope


This document records the architecture, business rules, security design, database configuration, admin workflow, invoice/quotation logic, deployment structure, and maintenance notes for the FrankiFlow Preisrechner system built during this project.


The system has two user-facing modes within the FrankiFlow Netlify deployment:
• Public customer calculator at /preisrechner/
• Protected pricing administration inside the main /admin/ area under Preise


The calculator is intended to produce customer-facing price estimates and, when an authenticated admin is logged in, also support invoice generation with protected billing details.


2. Core Architecture


Frontend
• Static HTML/CSS/JavaScript hosted on Netlify as part of the FrankiFlow website.
• One deployment contains both public and admin views.
• Public route in the combined site: /preisrechner/.
• Pricing administration route in the combined site: /admin/ → Preise.
• FrankiFlow logo is stored as a real image asset and should not be recolored or replaced with generated artwork.


Backend
• Supabase project: FrankiFlow Pricing.
• Project ref: bdeajozhylypiidrldka.
• Region: eu-central-1.
• Public frontend reads public pricing configuration from Supabase.
• Authenticated pricing settings are managed inside the main FrankiFlow admin with Supabase RLS; sensitive invoice/billing actions continue through the pricing-admin Edge Function.


Security model
• Public configuration remains readable by the customer calculator.
• Sensitive company billing data is never embedded in public HTML.
• Sensitive billing data is stored in a protected Supabase table.
• Admin access uses Supabase Auth.
• The pricing-admin Edge Function validates the Supabase Auth JWT and then checks that the signed-in user exists as an active FrankiFlow pricing admin.


3. Single-Deployment URL Structure


The preferred deployment structure is:


/
  index.html
  logo.png
  admin/
    index.html


The FrankiFlow Netlify deployment serves both interfaces:
• https://frankiflow.de/preisrechner/
• https://frankiflow.de/admin/ → Preise


Netlify packaging note:
index.html must be at the root of the ZIP/archive. Do not wrap all files inside an extra parent folder.


4. Public Calculator – Business Logic


4.1 Services


Current supported primary cleaning services include:
• Wohnungsreinigung
• Büroreinigung
• Ferienwohnung / Airbnb
• Treppenhausreinigung


Each service has:
• enabled/disabled state
• display label
• 1-month base price


The service configuration is stored in pricing_config under service_settings.


4.2 Floor-cleaning pricing model


The calculator uses a base price plus a square-metre gradient.


Current model:
• Gradient: 0.2304 €/m²
• Minimum floor-cleaning charge: 30 € per visit


Calculation concept:
service base adjusted by contract duration + (floor area × gradient)
then protected by the minimum cleaning charge.


Important customer-facing rule:
The customer must NOT see internal base-price wording such as “Basis (12 Monate)” or equivalent.


Customer-facing output should focus on:
• Preis pro Termin
• Preis pro Monat


Internal base-price components can still exist in the calculation/admin logic but should not appear in customer overview, quotation, or invoice.


4.3 Contract durations


Supported contract durations:
• 1 month
• 3 months
• 6 months
• 9 months
• 12 months
• 24 months


Base-price reductions:
• 1 month: 0%
• 3 months: 2%
• 6 months: 4%
• 9 months: 6%
• 12 months: 8%
• 24 months: 10%


Important rule:
Only the base portion is reduced by contract duration. The square-metre gradient is not reduced.


4.4 Visit frequencies


The system deliberately uses fixed monthly visit counts rather than 4.33-week calculations.


Configured examples:
• 1× per month = 1 visit/month
• Every 2 weeks = 2 visits/month
• 1× per week = 4 visits/month
• 2× per week = 8 visits/month
• 3× per week = 12 visits/month
• 4× per week = 16 visits/month
• 5× per week = 20 visits/month


Customer-facing frequency wording must always include context.


Do NOT display:
“Allgemeine Reinigung · 4”


Instead display:
“Allgemeine Reinigung · 4 Termine/Monat”


English equivalent:
“General cleaning · 4 visits/month”


This explicit unit/context should be used consistently in:
• calculator breakdown
• monthly overview
• quotation
• invoice
• central /admin/ preview and operational pricing controls


4.5 Window cleaning


Window cleaning is optional and independently selectable.


Current settings:
• base: 5 €
• gradient: 3.00 €/glass m²
• minimum: 35 €
• enabled: configurable


Floor area can be 0 when only window cleaning is requested.


4.6 Equipment and cleaning supplies


Optional equipment/cleaning-supplies surcharge:
• enabled/disabled from admin
• base: 5 €
• gradient: 0.01 €/floor m²


4.7 New-customer promotion


Current promotion:
• 25% discount in the first month
• enabled/disabled from admin


Minimum charges remain protected.


4.8 VAT / MwSt.


Current VAT configuration:
• enabled option
• rate: 19%
• customer-pays-default configurable


Important wording rule:
When VAT is not selected, do NOT say “im Preis getragen” or imply VAT is absorbed.


Correct wording:
German: “MwSt. nicht enthalten”
English: “VAT not included”


When VAT is selected, 19% is added to the calculated price.


5. Deep Cleaning / Grundreinigung


Grundreinigung is an optional cleaning mode. The configured percentage is an internal calculation parameter only; customers see the resulting Grundreinigung amount, not the percentage.


Current default configuration:
• label: Grundreinigung
• enabled: true
• internal calculation setting: +30% (not customer-visible)


The percentage is stored in Supabase and can be edited from the admin panel.


Business rule:
If Grundreinigung is selected, the normal cleaning amount is internally adjusted by the configured percentage and then presented to the customer as one Grundreinigung amount.


Example:
Internal normal-cleaning amount = 50 €
Internal Grundreinigung calculation = +30%
Resulting visit price = 65 €


The feature is presented to customers as a simple Grundreinigung checkbox/toggle. The percentage must never appear in the public calculator, quotation or invoice.


6. Admin Pricing Interface


Live pricing is managed inside the main FrankiFlow /admin/ area under Preise, without redeploying the website. There is no separate Preisrechner admin page and no Admin button on the customer calculator.


Admin-controlled settings include:
• general gradient €/m²
• minimum cleaning charge
• individual service base prices
• service labels
• service enabled/disabled state
• contract-duration reductions
• window-cleaning base/gradient/minimum/enabled
• Grundreinigung internal calculation percentage/enabled
• equipment base/gradient/enabled
• new-customer discount percentage/enabled
• VAT rate/enabled/default behavior/label


6.1 Toggle switch UX


Technical “Aktiv (1/0)” inputs were replaced with intuitive ON/OFF switches.


Use switches for:
• each cleaning service
• Fensterreinigung
• Grundreinigung
• Equipment & Reinigungsmittel
• Neukundenangebot
• MwSt option
• default “customer pays VAT additionally” behavior


Internally these still save as boolean true/false in Supabase.


7. Supabase Configuration Model


The main configuration table is pricing_config.


Important keys include:
• service_settings
• contract_settings
• frequency_settings
• window_settings
• deep_cleaning_settings
• equipment_settings
• promotion_settings
• vat_settings
• meta_settings


Public customer calculator reads public rows from pricing_config.


The main admin saves pricing settings as an authenticated FrankiFlow admin under Supabase Row Level Security. Sensitive private billing and invoice operations remain protected behind the pricing-admin Edge Function.


8. Sensitive Billing Data


The following billing details are considered private and must not be embedded in the public site source:
• Zahlungsziel: 14 Tage
• Kontoinhaber: FrankiFlow Reinigung
• Bank: N26
• BIC: NTSBDEB1XXX
• IBAN: DE79 1001 1001 2043 2730 31
• Seehofstraße 20, 60594 Frankfurt am Main


These values are stored only in Supabase in a protected table.


Public users must not receive them.


They are retrieved only after valid admin authentication for invoice generation.


9. Quotation vs Invoice Workflow


9.1 Public user


Without admin login:
• customer can calculate prices
• customer can print/download a quotation
• private bank/address/payment details are absent
• no admin/internal wording should appear in the customer document


Customer quotation terminology:
• Angebot / Quotation
• non-binding price estimate


9.2 Authenticated admin


After admin login:
• admin can still generate a quotation
• admin can also generate an invoice
• invoice can include private billing/address/payment data fetched from Supabase


Important customer-facing rule:
Do not print “Nur Admin-Vorschau” or similar internal text.


10. Invoice Layout


Invoice print should use a proper professional layout.


Top section should contain:
• FrankiFlow logo
• RECHNUNG / INVOICE prominently
• FrankiFlow company/address block
• customer “Rechnung an / Bill to” block
• invoice metadata aligned clearly


Invoice metadata includes:
• Rechnungsnummer / Invoice number
• Rechnungsdatum / Invoice date
• Leistungsdatum / Service date
• Zeitraum / Monat / Period


Print labels must be forced to dark/bold styling so browsers do not omit them.


Bank/payment information should appear lower in the invoice, not awkwardly mixed into the top metadata block.


11. Automatic Invoice Numbering


Invoice numbering is managed in Supabase.


A protected invoice-number settings/sequence is used.


Current sequence format:
• prefix: FF
• padding: 4 digits
• examples: FF0001, FF0002, FF0003, …


Important rule:
A new number should be reserved only when an authenticated admin actually generates/prints a new invoice.


The invoice number is not manually editable in the normal flow.


12. Authentication and Access
Current authentication uses Supabase Auth with email/password sessions and JWT access tokens. Protected admin requests send Authorization: Bearer <user-jwt> to the pricing-admin Edge Function. The Edge Function validates the authenticated user and then verifies that the user is an active FrankiFlow pricing administrator before allowing protected operations.


Current authorized admin mapping includes info@frankiflow.de with role admin and active status.


13. Admin Authorization Table


A dedicated pricing-admin authorization table was introduced.


Purpose:
Authentication alone is not enough. A valid Supabase user must also be explicitly authorized as a FrankiFlow pricing admin.


Conceptual fields:
• user_id
• email
• role
• active


The Edge Function should reject authenticated users who are not active admins.


14. Edge Function – pricing-admin


The protected Edge Function handles sensitive/admin operations.


Current responsibilities include:
• verify Supabase Auth JWT
• verify active admin status
• get private billing details
• reserve invoice number
• get complete pricing configuration for admin
• save pricing configuration
• change authenticated user password where supported by the admin flow


Current function has been migrated to JWT-based Supabase Auth and deployed with JWT verification enabled.


Do not expose the Supabase service-role key in browser code.


15. Public vs Private Data Boundary


Publicly readable:
• public pricing configuration required by the calculator


Protected/private:
• private billing details
• invoice sequence settings
• admin authorization mapping
• all sensitive admin write operations


The browser must never contain:
• service-role key
• private billing values hardcoded in HTML/JS
• custom database secrets


16. Printing and Browser URL/Header/Footer


The website uses browser print functionality.


Print CSS was adjusted to minimize browser-generated headers/footers, including use of @page rules.


Important limitation:
A normal webpage cannot guarantee removal of Chrome/Edge browser header/footer text if the user manually enables “Headers and footers” in the browser print dialog.


Therefore:
• CSS can reduce/remove normal page margins and help
• but guaranteed URL-free PDFs require server-generated PDF output rather than window.print()


If guaranteed clean invoices become necessary, recommended future upgrade:
Generate PDF server-side or through a dedicated PDF-rendering service/function.


17. Branding and Logo Rules


The correct FrankiFlow logo is the supplied navy/teal logo with Frankfurt/house/broom imagery and the FrankiFlow wordmark.


Do not:
• regenerate the logo
• recolor it
• use a WebP conversion that changes colors
• substitute AI-generated artwork


Use FrankiFlow-transparent.png as the canonical transparent PNG asset in the website and Preisrechner. It is derived from the supplied FrankiFlow.png by removing only the white background; do not redraw, recolor or replace the logo artwork.


18. Language Support


The complete FrankiFlow interface supports German and English. The Preisrechner shares the same DE/EN language preference as the public website, central /admin/ panel and legal pages. The selected language is stored as frankiflow-lang and remains active when users move between FrankiFlow pages.


The Preisrechner language switch translates:
• page titles and intro text
• service names
• duration/frequency wording
• field labels
• pricing breakdown
• VAT wording
• customer warnings
• quotation/invoice labels
• billing labels


Important frequency examples:
German: “4 Termine/Monat”
English: “4 visits/month”


19. Customer-Facing Pricing Display Rules


The customer should see simple, decision-useful pricing.


Preferred visible values:
• Preis pro Termin
• Preis pro Monat
• first-month discounted value where applicable
• optional surcharge lines when selected


Do not show internal pricing mechanics such as:
• “Basis (12 Monate)”
• raw internal base reductions as a customer-facing breakdown
• unexplained frequency numbers


20. Admin Preview Rules


Admin preview can show more detail than the public calculator because it is operational tooling.


However, even admin preview should be readable and non-technical where possible.


Use:
• toggle switches instead of 1/0
• human-readable frequency wording
• meaningful labels
• pricing preview before saving


21. Deployment Package Requirements


For the canonical combined FrankiFlow deployment, the Preisrechner is contained under the website's /preisrechner/ route. A separate standalone drag-and-drop calculator package may still use root-level index.html for testing.


Recommended structure:


index.html
logo.png
admin/
  index.html


If the public calculator uses separate CSS/JS files, they must also remain at the root with paths matching the HTML references.


Historical standalone-package error:
“No index.html at root — the entry point must be in the top-level directory.”


Cause:
ZIP contains an extra outer folder.


Fix:
Repack so index.html is directly visible when opening the ZIP.


22. Deployment Naming / URLs


Preferred production URL:
https://frankiflow.de/preisrechner/


Preferred pricing-admin location:
https://frankiflow.de/admin/ → Preise


Older ShipStatic deployments were used during iteration. They are development/testing history only and are not canonical production URLs.


23. Security Notes and Advisors


After database changes, Supabase security advisors were checked.


Important findings observed during development included:
• RLS-enabled tables with no policies on deliberately service-role-only tables
• leaked-password protection disabled in Supabase Auth
• unrelated Frankiholz SECURITY DEFINER warnings in the same Supabase project


Recommended follow-up:
• enable leaked-password protection in Supabase Auth if available on the plan
• review whether RLS-no-policy info notices are intentional for service-only tables
• separately review Frankiholz security-definer warnings because they are unrelated to the Preisrechner but exist in the same project


24. Current Pricing Snapshot


At the latest configuration check during this project:


General
• floor gradient: 0.2304 €/m²
• minimum floor cleaning: 30 €


Service bases
• Wohnungsreinigung: 30 €
• Büroreinigung: 24 €
• Ferienwohnung / Airbnb: 26 €
• Treppenhausreinigung: 24 €


Window cleaning
• base 5 €
• gradient 3.00 €/m²
• minimum 35 €


Equipment
• base 5 €
• gradient 0.01 €/m²


Promotion
• 25% first-month discount


VAT
• 19%


Deep Cleaning
• +30%


Important: these values are dynamic and should be treated as a snapshot only. The live source of truth is Supabase pricing_config.


25. Recommended Operating Workflow


For normal pricing changes:
1. Open /admin/ and select Preise
2. Sign in with the authorized Supabase Auth account
3. Change prices/toggles/percentages
4. Review preview
5. Publish/save
6. Public calculator automatically reads the new Supabase configuration


For customer quotation:
1. Open public calculator
2. enter service/area/frequency/options/customer details
3. print quotation
4. no private billing data is shown


For invoice:
1. authenticate as admin
2. prepare customer calculation
3. choose invoice flow
4. reserve next invoice number
5. fetch protected billing details
6. print invoice


26. Maintenance Checklist


Whenever changing pricing logic:
• update admin UI
• update public calculator
• update Supabase config schema/key if needed
• update Edge Function allowed configuration keys
• test German and English
• test quotation print
• test invoice print
• test mobile layout
• confirm no sensitive data appears in public source


Whenever changing authentication:
• test login/logout
• test expired session
• test unauthorized authenticated user
• test private billing fetch
• test invoice-number reservation
• ensure service-role key is never exposed


Whenever deploying:
• verify index.html is at archive root
• verify /admin/ → Preise loads and can save pricing settings
• verify logo asset path
• verify Supabase URL and publishable key
• verify public pricing loads
• verify admin Edge Function requests use the Supabase Auth access token


27. Future Improvements


Recommended possible next upgrades:
• true server-generated invoices/PDFs to guarantee clean print output
• invoice history table storing issued invoice number, customer, amount, date, and status
• quotation history / CRM-style lead tracking
• audit log for admin pricing changes
• multiple admin roles
• password-reset UI using Supabase Auth
• optional MFA for admin accounts
• localStorage language persistence
• make company/bank details editable from protected admin settings rather than only database-side
• invoice status tracking: draft/sent/paid/cancelled
• automatic invoice PDF naming
• email quotation/invoice from the system


28. Key Design Principles Used


The project evolved around several important principles:
• pricing variables should be editable without redeploying
• customer view should remain simple and professional
• internal pricing mechanics should not confuse the customer
• sensitive billing details must never be public
• invoice generation must require admin authentication
• one domain/deployment should serve both public and admin views
• Supabase Auth should be preferred over custom password/session code
• admin UI should be intuitive and use switches instead of technical 1/0 fields
• every frequency value must include its unit/context


29. Canonical System Summary


Public customer URL:
https://frankiflow.de/preisrechner/


Pricing administration:
https://frankiflow.de/admin/ → Preise


Backend:
Supabase project FrankiFlow Pricing
Project ref: bdeajozhylypiidrldka


Authentication:
Supabase Auth + explicit active pricing-admin authorization


Public configuration:
pricing_config


Protected functions:
pricing-admin Edge Function


Protected data:
private billing details, invoice sequence, admin authorization


Primary pricing features:
• service-based base pricing
• floor-area gradient
• minimum visit price
• contract-duration base reduction
• fixed visits/month frequency model
• window cleaning
• equipment/supplies
• first-month promotion
• VAT option
• Grundreinigung internal calculation uplift


Document outputs:
• public quotation
• admin-authenticated invoice


30. Final Notes


This documentation is intended as the operational and technical reference for the FrankiFlow Preisrechner system as built through September 2026.


For future updates, Supabase remains the live source of truth for pricing and private configuration, while Netlify is now the canonical frontend host through the integrated FrankiFlow website. ShipStatic should be treated only as historical prototype/development hosting.


31. Customer-Facing Grundreinigung Display Rules
Update date: 9 September 2026


The customer-facing pricing breakdown was simplified to avoid exposing internal Grundreinigung pricing mechanics.


Current display rules:
• The normal cleaning terminology is “Allgemeine Reinigung”, not “Bodenreinigung”.
• If Grundreinigung is NOT selected, customer summaries/monthly lines use “Allgemeine Reinigung”.
• If Grundreinigung IS selected, the normal cleaning amount and the internal Grundreinigung surcharge are combined into one customer-facing Grundreinigung amount.
• The customer must not see the internal surcharge percentage (for example +30%) in the calculator, quotation, or invoice.
• The surcharge percentage remains stored in Supabase and editable from the protected admin panel.
• Equipment/Reinigungsmittel can remain a separate visible line when selected.
• Frequency wording continues to include full context, e.g. “Grundreinigung · 1 Termin/Monat” or “Allgemeine Reinigung · 4 Termine/Monat”.


Example using the current pricing logic for a 200 m² Büroreinigung with Grundreinigung selected:
• Internal normal cleaning amount: 68,16 € / Termin
• Internal Grundreinigung component: 20,45 € / Termin
• Customer-facing display: Grundreinigung · 200 m² = 88,61 € / Termin
• If Equipment & Reinigungsmittel = 7,00 € / Termin, the monthly total for one visit is 95,61 €.


The customer should not see the 68,16 € + 20,45 € internal split. This rule applies consistently to the live calculator, printed quotation, and printed invoice.


33. Customer-Facing Service Checklist
Update date: 10 September 2026


A customer-facing Leistungscheckliste / Service checklist is integrated directly into the Preisrechner after Step 04 “Angebot vorbereiten / Prepare a quotation” as Step 05. The customer can preview the checklist before printing and can choose whether it is attached to the quotation. Checklist attachment is enabled by default.


The checklist content is dynamic and follows the selected service. Büroreinigung uses categories for office areas, kitchen/break area, toilets/sanitary areas, and entrance/corridors. Wohnungsreinigung uses living/sleeping areas, kitchen, bathroom/toilet, and hallway/entrance. Ferienwohnung/Airbnb uses sleeping/living areas, kitchen, bathroom/toilet, and guest-area/final-check tasks. Treppenhausreinigung uses entrance/common areas, stairs/landings/floors, and railings/doors/touch points.


Grundreinigung extends the selected base-service checklist with an additional, more detailed deep-cleaning checklist covering surfaces/details, kitchen and sanitary areas. Refrigerator interior, cupboard interior, carpet deep cleaning and other property-specific extras remain clearly marked as “only when specifically agreed” rather than being silently presented as standard included work.


Fensterreinigung has an independent checklist for windows/glass and frames/rebates/window sills. If the calculation is window-only with 0 m² floor area, unrelated base-service checklist pages are omitted. If window cleaning is added to another service, the window checklist is appended as an additional page.


Quotation printing keeps the pricing quotation as page 1. When checklist attachment is enabled, one or more branded A4 checklist pages follow automatically. Each page uses the selected DE/EN language, customer/property details, categorized service tasks, a scope note and the same evenly distributed FrankiFlow company-data footer used by the quotation. Invoice printing does not automatically attach the customer checklist.


The task baseline comes from the approved FrankiFlow Cleaning & Quality Control Checklist. The customer-facing version intentionally focuses on the promised service scope and excludes internal employee time/signature fields and internal FrankiFlow quality-control fields.
.


32. Current Quotation & Invoice Print Design
Update date: 10 September 2026
The current FrankiFlow quotation and invoice print output intentionally keeps the recognizable visual grammar of the established FrankiFlow one-page quotation style while applying a cleaner, more premium current brand treatment.


Print standard:
• Target format is one A4 page for normal quotations and invoices.
• The canonical transparent FrankiFlow logo appears at the top-left with the business tagline underneath.
• The document type appears at the top-right as ANGEBOT / QUOTATION or RECHNUNG / INVOICE, together with a prominent featured amount. When the new-customer promotion applies, the featured quotation amount is the first-contract-month amount.
• The customer/company block and service heading remain prominent and easy to scan.
• The line-item breakdown uses only customer-facing terminology: service/area with price per visit, optional Equipment & Reinigungsmittel, Allgemeine Reinigung or Grundreinigung with explicit Termine/Monat or visits/month wording, optional window cleaning, and VAT status.
• Internal pricing mechanics and the internal Grundreinigung calculation percentage must never appear in the quotation or invoice.
• The regular monthly total is shown first. When the first-month promotion applies, the discounted first-contract-month total is emphasized with a restrained FrankiFlow mint/teal highlight.
• Invoice output additionally shows invoice number, date, service date/period and protected payment information in a separate payment block.
• Company data is anchored visually at the physical bottom of the A4 page and distributed evenly across five columns: Telefon +49 176 62493041; E-Mail info@frankiflow.de; Website www.frankiflow.de; Steuernummer 014/811/68462; W-IdNr. DE464605581.
• A small tax/legal note remains below the company-data row.
• German and English print labels follow the selected FrankiFlow interface language.
• Public quotations must not expose protected bank/payment details. Invoice payment data continues to come only from the authenticated protected billing fetch.
• The current implementation uses browser print/PDF output. Browser-generated headers and footers can still appear if the user enables them in the browser print dialog.


34. Standalone Window Cleaning & Print Quality Update
Update date: 10 September 2026
The Preisrechner now treats Fensterreinigung / Window cleaning as a fifth primary service in Step 01, in addition to the four floor-cleaning service types. This allows customers who need only window cleaning to calculate and print a quotation without selecting Büroreinigung or another unrelated service.
When standalone window cleaning is selected, the floor-area field, Grundreinigung, equipment and duplicate window-add-on controls are hidden. The glass-area field is moved into the main Objekt & Umfang / Property & scope step, and the frequency initially switches to Einmalig / One-time for a clearer first-use experience. Recurring frequencies remain selectable.
Standalone window pricing is calculated only from window_settings: max(window minimum, window base + glass area × window gradient). The current live Supabase snapshot is base 5 €, gradient 3.00 €/m² glass and minimum 35 € per visit. Example: 65 m² glass = max(35 €, 5 € + 65 × 3 €) = 200 € per visit. If the 25% new-customer promotion applies to a one-visit first month, the promotional amount is 150 € before any selected VAT.
Window-only quotations and invoices must use only the customer-facing service name Fensterreinigung / Window cleaning. They must not print Büroreinigung, Office cleaning, Allgemeine Reinigung or General cleaning for a window-only calculation. The first price line shows the full window-cleaning price per visit, and the frequency/month line is calculated from that same per-visit amount.
Print typography was hardened after browser/PDF QA to eliminate irregular bold-letter/glyph artifacts. Print documents use a conservative Arial/Helvetica stack, disabled synthetic font weights and ligatures, regular body-text weights, and CSS-drawn checklist symbols instead of font checkmark glyphs. The five-column company-data footer remains fixed at the physical bottom of each A4 page.
Production packages must not include internal checklist/print QA test pages.


Public Footer & Cross-Site Navigation Update – 10 September 2026
The FrankiFlow public website and Preisrechner now use a consistent bottom company-data strip across customer-facing pages. The strip displays the following values evenly across the footer: Telefon / Phone +49 176 62493041; E-Mail info@frankiflow.de; Website www.frankiflow.de; Steuernummer / Tax No. 014/811/68462; W-IdNr. DE464605581.
WhatsApp links use a recognizable WhatsApp logo/icon wherever the public WhatsApp action is shown. The admin WhatsApp URL field is also visually marked with the same icon. The configured WhatsApp destination remains the managed FrankiFlow WhatsApp URL.
A direct FrankiHolz accommodation link to https://accommodation.frankiflow.de/ is included in FrankiFlow public footers and the Preisrechner footer so customers can move between the cleaning and accommodation products.
These additions are presentation/navigation changes only. Pricing calculations, quotation/invoice calculations, checklist logic, Supabase pricing configuration and protected billing behavior are unchanged.




Current Editable Checklist Administration — 10 September 2026
The customer-facing service checklist is now managed from Supabase table public.frankiflow_checklists. The table contains six service records: Büroreinigung, Wohnungsreinigung, Ferienwohnung/Airbnb, Treppenhausreinigung, Erweiterte Grundreinigung and Fensterreinigung. Every record stores a German and English service label plus ordered bilingual sections and tasks.


The FrankiFlow web admin at /admin/ contains a Checklisten / Checklists area. An authorized FrankiFlow administrator can edit the German and English service labels, section titles and individual tasks; add or remove tasks; add, remove or reorder sections; and mark sections as optional / only when specifically agreed. Saving publishes the checklist content to Supabase. Public users have read-only access to these checklist records, while changes are protected by the existing FrankiFlow admin authorization rules.


The Preisrechner loads the current checklist records from Supabase and uses them for Step 05 preview and quotation-PDF checklist pages. The packaged checklist definitions remain only as a resilience fallback if the checklist read is temporarily unavailable. This keeps the customer preview and the attached quotation checklist consistent with the admin-managed source.


The mobile product is named FrankiFlow Admin App. Its FrankiFlow area contains a bilingual Checklists tab connected to the same public.frankiflow_checklists records, so checklist edits can be made from either the web admin or the phone app.


Current Website Footer Standard
Customer-facing FrankiFlow website footers use a normal compact business-site structure: FrankiFlow brand, useful service/navigation links, phone, email, WhatsApp, Impressum, Datenschutz, the FrankiHolz accommodation link and copyright/service-area context. The separate website footer strip showing Steuernummer and W-IdNr. is not displayed. The public admin link is also not shown in customer-facing footers. Quotation and invoice print footers are separate document elements and continue to carry the approved company information at the physical bottom of the A4 printout.


GitHub Source & Deployment Control — 10 September 2026
FrankiFlow website source is maintained in https://github.com/dn-lx/frankiflow. The main branch is the production-ready source used by Netlify. The Preisrechner, /admin/, public website, Netlify Functions and related static assets are kept together in this repository.
For future calculator/website changes, create one work/<topic> branch from the latest main, keep all requested changes and testing on that branch, and merge to main only when the complete batch is ready. Netlify should deploy production from main only. Automatic branch deploys and Deploy Previews remain disabled by default so intermediate changes do not consume unnecessary deployments.
Current Netlify source settings for FrankiFlow are: repository root as base directory, no build command, public as publish directory and netlify/functions as the functions directory through netlify.toml. Pricing changes made through the authenticated admin remain Supabase-managed and do not require a website deployment.
