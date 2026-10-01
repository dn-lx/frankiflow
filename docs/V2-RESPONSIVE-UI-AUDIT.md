# FrankiFlow V2 Responsive UI Audit

Status: **in progress — mobile structural pass completed**

Scope:
- V2 homepage
- V2 Calculator
- Viewports: 375, 390, 430, 768, 1024 and 1440 CSS px
- Evidence: rendered local V2 review artifact plus V2 branch source/CSS cross-check

Important limitation: the local review artifact intentionally does not execute Supabase, email, PDF or production network flows. Runtime/network verification still belongs in a real branch preview before release.

## Findings

### P1 — Homepage hero dashboard overlaps the following trust strip on phones

**Viewports:** 375, 390 and 430 px  
**Surface:** Homepage hero  
**Selectors:** `.hero-visual`, `.hero-dashboard`, `.signal-grid`

Rendered geometry at 390 px:
- `.hero-visual`: y ≈ 740, height 430, bottom ≈ 1170
- `.hero-dashboard`: y ≈ 780, height ≈ 555, bottom ≈ 1335
- `.signal-grid`: begins ≈ 1240

The dashboard therefore extends roughly **95 px into the trust strip**. The same structural collision is visible at 375 px and remains present at 430 px.

**Root cause:** the mobile V2 layer gives the visual a fixed/minimum height while the absolutely positioned dashboard is taller than its containing visual. The decorative offer card compounds the collision.

**Recommended fix:** on <=680 px, stop treating the dashboard as a desktop overlay. Prefer one of:
1. make the dashboard participate in normal flow (`position:relative; left:auto; right:auto; top:auto`) and keep the photo as a background/decorative layer, or
2. substantially increase the visual's reserved height and explicitly bound all floating cards.

Option 1 is safer and more resilient to localized content.

---

### P1 — Trust signal strip clips content at 375/390 px

**Viewports:** 375 and 390 px  
**Surface:** Homepage trust strip  
**Selector:** `.signal-grid`

At 390 px, the right edge of the second/fourth stat block reaches about 419 px. At 375 px the same content exceeds the viewport by about 44 px.

The page itself is not horizontally scrollable because the surrounding layout clips the content, so the defect appears as **cut-off trust text** rather than a scroll bar.

**Root cause:** the mobile two-column signal grid combines large numeric values, inline/flex copy and padding without enough shrink room.

**Recommended fix:**
- keep two columns only if each stat switches to vertical composition,
- set `min-width:0` on grid children,
- stack `strong` above `span`,
- otherwise switch to one column below ~400 px.

---

### P1 — Homepage has no working DE/EN language switch in the V2 source

**Viewports:** all, especially mobile navigation  
**Surface:** Homepage header  
**Files:** `public/index.html`, `public/en/index.html`

The homepage header contains WhatsApp + menu actions but no `.language-switch` / `.ff-language-switch`. The Calculator does contain a DE/EN switch.

The repository also contains homepage language-routing code that expects a `.ff-language-switch button[data-lang]`, but the current V2 homepage markup does not provide that control.

**Impact:** bilingual support is not discoverable/operable from the homepage UI.

**Recommended fix:** add one shared DE/EN control to the homepage header/mobile menu and route it through the existing language persistence convention (`frankiflow-lang` / `ff-price-lang`).

---

### P2 — Mobile hamburger is below the preferred touch target

**Viewports:** phone and tablet  
**Surface:** Homepage header  
**Selector:** `.menu-btn`

The current source CSS reduces the homepage menu button to roughly 34–36 px on narrow widths. The rendered review artifact is 38×38 px.

**Recommended fix:** keep the visual icon compact but give the interactive button at least a practical ~44×44 px hit area.

---

### P2 — Several homepage actions and disclosure rows are under 44 px high

**Viewports:** 375/390/430 px  
**Surface:** service cards, dashboard CTA, About/FAQ disclosures

The mobile review showed several card actions around 37–39 px high and disclosure summaries with very small vertical hit areas.

**Recommended fix:** use padding/min-height on the clickable element rather than enlarging text. Aim for ~44 px on primary touch actions and roomy accordion summaries.

---

### P2 — The mobile Calculator hides the “live” price until after the entire form

**Viewports:** 375/390/430/768 px  
**Surface:** Calculator

At 390 px:
- calculator form begins around y ≈ 633
- result card begins around y ≈ 2885

A user must traverse roughly **2250 px of form content** before the “live” estimate is visible.

This is not an overflow bug, but it weakens the core product promise of immediate/live pricing.

**Recommended fix:** add a compact mobile result bar after calculation becomes valid:
- fixed/sticky bottom bar with “per visit” + “per month”,
- tap/expand to reveal full breakdown,
- full result card remains in normal flow after the form.

Respect safe-area insets and ensure it never covers focused controls.

---

### P2 — Calculator mobile page is visually long and front-loads too much hero space

**Viewports:** 375/390/430 px  
**Surface:** Calculator hero + steps

The first calculator step starts well below the header/hero, while the complete form + result runs several screens.

**Recommended fix:**
- reduce mobile Calculator hero top/bottom padding,
- slightly reduce mobile hero heading size while preserving hierarchy,
- prioritize getting Step 01 and the first service choices closer to the first viewport,
- avoid shrinking body/helper text.

---

### P2 — Mobile homepage service cards are overly tall/dense as a six-card stack

**Viewports:** 375/390/430 px  
**Surface:** Services

The current mobile rules preserve relatively large minimum card heights. Six sequential cards create a long repetitive section.

**Recommended fix:** use content-driven height on mobile (`min-height:auto` or a smaller minimum), reduce vertical card padding, and keep the primary action aligned without forcing desktop-like empty space.

---

### P3 — Trust-strip and secondary copy are too small relative to the new hero hierarchy

**Viewports:** 375/390 px  
**Surface:** Homepage

The V2 hero is strong, but the trust strip and some secondary/service copy become visually tiny immediately afterward.

**Recommended fix:** normalize mobile supporting copy around a readable 13–15 px range with suitable line-height, and avoid using tiny text to make the grid fit.

## Checks that passed in the local structural pass

- No document-level horizontal scroll at 375, 390, 430, 768, 1024 or 1440 in the review artifact.
- Calculator form controls fit within the viewport at the tested widths.
- Calculator result card correctly drops into normal flow on narrow layouts.
- Two-column Calculator fields collapse to one column on phone widths.
- Calculator service choices remain selectable and readable on phone widths.
- 430 px eliminates the trust-strip clipping seen at 375/390, although the hero/dashboard overlap still requires repair.

## Recommended repair order

1. Fix homepage hero/dashboard containment.
2. Fix trust-strip clipping below 400 px.
3. Restore a shared homepage DE/EN switch.
4. Increase mobile header/action/disclosure hit areas.
5. Add a compact mobile Calculator live-price summary.
6. Reduce Calculator hero height and service-card mobile density.
7. Re-run the full 375/390/430/768/1024/1440 matrix.
8. Run real branch-preview console/network/accessibility checks before promotion.

## Completion gate for V2

Before V2 is ready to promote:
- no homepage overlap/clipping at 375/390/430,
- no unintended horizontal overflow,
- bilingual navigation works on desktop and mobile,
- primary touch targets are practical,
- Calculator live-price feedback remains visible/useful on mobile,
- representative screenshots at 390, 768 and 1440 have been visually inspected,
- console/network errors have been checked in a real browser runtime,
- accessibility scan has been run on homepage + Calculator.
