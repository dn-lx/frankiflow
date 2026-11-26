import { test, expect } from '@playwright/test';
import { blockExternalNetwork } from './helpers.mjs';

const SUPABASE_STUB_MODULE = `
const offlineResult = { data: null, error: { message: 'offline test' } };

function createQueryBuilder() {
  const builder = {
    select: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    match: () => builder,
    filter: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    single: () => Promise.resolve(offlineResult),
    maybeSingle: () => Promise.resolve(offlineResult),
    then: (onFulfilled, onRejected) => Promise.resolve(offlineResult).then(onFulfilled, onRejected),
  };
  return builder;
}

export function createClient() {
  return {
    from: () => createQueryBuilder(),
    channel: () => {
      const ch = {
        on: () => ch,
        subscribe: () => {
          new WebSocket('wss://example.invalid/realtime');
          return ch;
        },
      };
      return ch;
    },
    functions: {
      invoke: () => Promise.resolve(offlineResult),
    },
    storage: {
      from: () => ({
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null, user: null }, error: null }),
      getUser: () => Promise.resolve({ data: { session: null, user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    removeChannel: () => {},
    removeAllChannels: () => {},
  };
}
`;

test.beforeEach(async ({ page }) => {
  await blockExternalNetwork(page);
  await page.route('https://esm.sh/**', async route => {
    if (route.request().url().includes('@supabase/supabase-js')) {
      await route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: SUPABASE_STUB_MODULE,
      });
    } else {
      await route.abort();
    }
  });
  await page.addInitScript(() => {
    window.WebSocket = function () {
      throw new Error('WebSocket not available: The operation is insecure.');
    };
  });
});

test('homepage contact form still works when realtime is unavailable', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err));

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
