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
  await page.goto('/calculator/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#calculatorForm')).toBeVisible();
  await expect(page.locator('#visitPrice')).toBeVisible();
  await expect(page.locator('#printQuote')).toBeVisible();
});


test('quotation and checklist print footers stay at the bottom of every short A4 page', async ({ page }) => {
  await page.goto('/calculator/', { waitUntil: 'domcontentloaded' });
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
      </div>
      <div class="print-checklist-document">
        <div class="print-topline"></div>
        <header class="print-checklist-head">
          <div class="print-brand"><p>FrankiFlow</p></div>
          <div class="print-checklist-titlebox"><span>SERVICE CHECKLIST</span><strong>Office cleaning</strong><small>1 / 1</small></div>
        </header>
        <div class="print-divider"></div>
        <section class="print-checklist-client"><div><span>Client / property</span><strong>Test customer</strong></div></section>
        <div class="print-checklist-grid"><section class="print-checklist-section"><h4>Office</h4><div class="print-checklist-items"><div class="print-checklist-item"><span class="check-symbol included"></span><em>Clean work surfaces</em></div></div></section></div>
        <div class="print-checklist-note">Standard service scope.</div>
        <footer class="print-company-footer"><div class="print-footer-title">FrankiFlow Building Cleaning &amp; Property Services</div></footer>
      </div>`;
  });

  const layouts = await page.locator('.print-document,.print-checklist-document').evaluateAll(nodes => nodes.map(doc => {
    const footer = doc.querySelector('.print-company-footer');
    const dr = doc.getBoundingClientRect();
    const fr = footer.getBoundingClientRect();
    const style = getComputedStyle(doc);
    return {
      className: doc.className,
      display: style.display,
      direction: style.flexDirection,
      minHeight: parseFloat(style.minHeight),
      docHeight: dr.height,
      footerBottomGap: dr.bottom - fr.bottom
    };
  }));

  expect(layouts).toHaveLength(2);
  for (const layout of layouts) {
    expect(layout.display).toBe('flex');
    expect(layout.direction).toBe('column');
    expect(layout.minHeight).toBeGreaterThan(1100);
    expect(layout.docHeight).toBeLessThan(1130);
    expect(layout.footerBottomGap).toBeGreaterThan(35);
    expect(layout.footerBottomGap).toBeLessThan(60);
  }
});


test('public navigation aligns and matches across homepage and calculator', async ({ page }) => {
  for (const [path,contentSelector] of [['/en/','.hero-grid'],['/calculator/','.calc-hero-grid']]) {
    await page.goto(path,{waitUntil:'domcontentloaded'});
    const header=page.locator('.site-header');
    await expect(header).toBeVisible();

    const productLabels=await header.locator('.nav-links a').allTextContents();
    expect(productLabels).toEqual(path==='/en/'?['Home','Services','About Us','Calculator','CalcPura','FrankiHolz','FAQ','Contact']:['Startseite','Leistungen','Über uns','Preisrechner','CalcPura','FrankiHolz','FAQ','Kontakt']);
    await expect(header.locator('.nav-actions a[href="/calculator/"]')).toHaveCount(0);
    await expect(header.locator('.calc-nav-price')).toHaveCount(0);

    const rails=await page.evaluate(({contentSelector})=>{
      const nav=document.querySelector('.site-header .nav');
      const brand=nav.querySelector('.brand').getBoundingClientRect();
      const actions=nav.querySelector('.nav-actions').getBoundingClientRect();
      const navBox=nav.getBoundingClientRect();
      const content=document.querySelector(contentSelector).getBoundingClientRect();
      return {
        display:getComputedStyle(nav).display,
        navLeft:navBox.left,navRight:navBox.right,
        brandLeft:brand.left,actionsRight:actions.right,
        contentLeft:content.left,contentRight:content.right
      };
    },{contentSelector});

    const desktop=await page.evaluate(()=>window.innerWidth>=1021);
    if(desktop){
      expect(rails.display).toBe('grid');
      expect(Math.abs(rails.navLeft-rails.contentLeft)).toBeLessThan(2);
      expect(Math.abs(rails.navRight-rails.contentRight)).toBeLessThan(2);
      expect(Math.abs(rails.brandLeft-rails.contentLeft)).toBeLessThan(2);
      expect(Math.abs(rails.actionsRight-rails.contentRight)).toBeLessThan(2);
    }else{
      expect(rails.display).toBe('flex');
      expect(rails.brandLeft).toBeGreaterThanOrEqual(rails.navLeft-1);
      expect(rails.actionsRight).toBeLessThanOrEqual(rails.navRight+1);
    }

    const calcPura=header.locator('.nav-calcpura');
    await expect(calcPura).toHaveAttribute('aria-label',/CalcPura.+/);
    if(desktop){
      await calcPura.hover();
      await expect.poll(async()=>Number(await calcPura.evaluate(el=>getComputedStyle(el,'::after').opacity))).toBeGreaterThan(.9);
      const tooltipContent=await calcPura.evaluate(el=>getComputedStyle(el,'::after').content);
      expect(tooltipContent).not.toBe('none');
    }else{
      await header.locator('.menu-btn').click();
      await expect(header.locator('.nav-links')).toHaveClass(/open/);
      await expect(calcPura).toBeVisible();
      const tooltip=await calcPura.evaluate(el=>({
        content:getComputedStyle(el,'::after').content,
        opacity:Number(getComputedStyle(el,'::after').opacity)
      }));
      expect(tooltip.content).not.toBe('none');
      expect(tooltip.opacity).toBeGreaterThan(.9);
    }
  }
});

test('calculator presents CalcPura business CTA below the calculator', async ({ page }) => {
  await page.goto('/calculator/',{waitUntil:'domcontentloaded'});
  const cta=page.locator('.calc-business-cta');
  await expect(cta).toBeVisible();
  await expect(cta.getByRole('link',{name:/CalcPura/i})).toHaveAttribute('href','https://calcpura.frankiflow.de/');
});


test('print media excludes the live Calculator and CalcPura CTA', async ({ page }) => {
  await page.goto('/calculator/', { waitUntil: 'domcontentloaded' });
  await page.locator('#printSheet').evaluate(sheet => {
    sheet.setAttribute('aria-hidden','false');
    sheet.innerHTML='<div class="print-document"><div class="print-estimate-note"><strong>NON-BINDING ESTIMATE</strong><p>Estimate only.</p></div></div>';
  });
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('body > main')).toBeHidden();
  await expect(page.locator('.calc-business-cta')).toBeHidden();
  await expect(page.locator('#printSheet')).toBeVisible();
  await expect(page.locator('.print-document')).toBeVisible();
  await expect(page.locator('.print-estimate-note')).toContainText('NON-BINDING ESTIMATE');
});


test('Homepage and Preisrechner share the same footer shell', async ({ page }) => {
  const snapshots=[];
  for (const path of ['/', '/calculator/']) {
    await page.goto(path,{waitUntil:'domcontentloaded'});
    const footer=page.locator('.site-footer');
    await expect(footer).toBeVisible();
    snapshots.push(await footer.evaluate(el=>({
      className:el.className,
      columns:[...el.querySelectorAll('.footer-grid > div > h4')].map(x=>x.textContent.trim()),
      cta:el.querySelector('.footer-cta a')?.textContent.trim(),
      region:el.querySelector('.footer-brand p')?.textContent.trim()
    })));
  }
  expect(snapshots[1]).toEqual(snapshots[0]);
  expect(snapshots[0].cta).toContain('Preisrechner');
  expect(snapshots[0].region).toContain('Nürnberg');
});
