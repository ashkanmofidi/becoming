import { test, expect } from '@playwright/test';

test.describe('ERR: Error Pages', () => {
  test('ERR-001: 404 page renders for non-existent route', async ({ page }) => {
    // PRD 16.1: 404 Not Found
    await page.goto('/this-page-does-not-exist');

    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=This page doesn')).toBeVisible();

    // PRD 16.1: "Go to Timer" button
    await expect(page.locator('text=Go to Timer')).toBeVisible();
  });

  test('ERR-002: 404 page has app branding', async ({ page }) => {
    await page.goto('/nonexistent');
    await expect(page.locator('h1:has-text("Becoming")')).toBeVisible();
  });

  test('ERR-003: 404 Go to Timer button navigates correctly', async ({ page }) => {
    await page.goto('/nonexistent');
    await page.click('text=Go to Timer');
    // Should redirect to login since unauthenticated
    await page.waitForURL('**/login**');
  });
});
