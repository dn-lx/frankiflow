import { test, expect } from '@playwright/test';
import { blockExternalNetwork } from './helpers.mjs';

test.beforeEach(async ({ page }) => blockExternalNetwork(page));

test('homepage renders core service UI', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/FrankiFlow|Gebäudereinigung/);
  await expect(page.locator('h1')).toContainText('Gebäudereinigung');
  await expect(page.getByRole('link', { name: /Preis/ }).first()).toBeVisible();
});

test('price calculator shell renders without external writes', async ({ page }) => {
  await page.goto('/preisrechner/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#calculatorForm')).toBeVisible();
  await expect(page.locator('#visitPrice')).toBeVisible();
  await expect(page.getByRole('button', { name: /Angebot drucken|PDF/ })).toBeVisible();
});


test('quotation print footer stays at the bottom of a short A4 page', async ({ page }) => {
  await page.goto('/preisrechner/', { waitUntil: 'domcontentloaded' });
  await page.emulateMedia({ media: 'print' });

  await page.locator('#printSheet').evaluate(sheet => {
    sheet.setAttribute('aria-hidden','false');
    sheet.innerHTML = `
      <div class="print-document">
        <div class="print-topline"></div>
        <header class="print-head-legacy">
          <div class="print-brand"><p>FrankiFlow</p></div>
          <div class="print-featured"><div class="print-kind">QUOTATION</div><div class="print-featured-amount">€127.28</div></div>
        </header>
        <div class="print-divider"></div>
        <section class="print-client-block"><div><div class="print-customer-name">Test customer</div></div></section>
        <section class="print-service-intro"><h2>Office cleaning</h2><p>80 m²</p></section>
        <section class="print-breakdown-legacy"><div class="print-line"><span>Service</span><strong>Office cleaning</strong></div></section>
        <section class="print-month-totals"><div class="print-month-row"><span>Regular month</span><strong>€169.72</strong></div></section>
        <div class="print-note">Non-binding quotation.</div>
        <footer class="print-company-footer"><div class="print-footer-title">FrankiFlow Building Cleaning &amp; Property Services</div></footer>
      </div>`;
  });

  const layout = await page.locator('.print-document').evaluate(doc => {
    const footer = doc.querySelector('.print-company-footer');
    const dr = doc.getBoundingClientRect();
    const fr = footer.getBoundingClientRect();
    const style = getComputedStyle(doc);
    return {
      display: style.display,
      direction: style.flexDirection,
      minHeight: parseFloat(style.minHeight),
      docHeight: dr.height,
      footerBottomGap: dr.bottom - fr.bottom
    };
  });

  expect(layout.display).toBe('flex');
  expect(layout.direction).toBe('column');
  expect(layout.minHeight).toBeGreaterThan(1100);
  expect(layout.docHeight).toBeLessThan(1130);
  expect(layout.footerBottomGap).toBeGreaterThan(35);
  expect(layout.footerBottomGap).toBeLessThan(60);
});
