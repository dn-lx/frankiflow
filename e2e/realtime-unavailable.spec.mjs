import { test, expect } from '@playwright/test';
import { blockExternalNetwork } from './helpers.mjs';

test.beforeEach(async ({ page }) => {
  await blockExternalNetwork(page);
  await page.addInitScript(() => {
    window.WebSocket = function () {
      throw new Error('WebSocket not available: The operation is insecure.');
    };
  });
});

test('homepage contact form still works when realtime is unavailable', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err));

  await page.route(url => url.href.includes('supabase.co'), async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    } else {
      await route.fallback();
    }
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const initialUrl = page.url();

  const form = page.locator('#quoteForm');
  await form.locator('[name="customer_name"]').fill('Test User');
  await form.locator('[name="customer_email"]').fill('test@example.invalid');
  await form.locator('[name="privacy_accepted"]').check();
  await form.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(initialUrl);

  const notice = page.locator('#quoteNotice');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText(/\S/);

  const unexpectedErrors = pageErrors.filter(err => !err.message.includes('WebSocket'));
  expect(unexpectedErrors).toEqual([]);
});

test('calculator still updates prices when realtime is unavailable', async ({ page }) => {
  await page.goto('/calculator/', { waitUntil: 'domcontentloaded' });

  const monthlyPrice = page.locator('#monthlyPrice');
  await expect(monthlyPrice).toBeVisible();
  await expect(monthlyPrice).toHaveText(/\d/);

  const initialPrice = (await monthlyPrice.textContent())?.trim() ?? '';

  const areaInput = page.locator('#areaSqm');
  await areaInput.fill('180');
  await areaInput.dispatchEvent('input');

  await expect(monthlyPrice).not.toHaveText(initialPrice);
  await expect(monthlyPrice).toHaveText(/\d/);
});
