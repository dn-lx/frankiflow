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
