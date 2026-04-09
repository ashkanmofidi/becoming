import { test, expect } from '@playwright/test';

test.describe('RESP: Responsive Design', () => {
  test('RESP-001: Login page responsive on mobile (375px)', async ({ page }) => {
    // PRD 1.1: Responsive, card takes full width with 16px margins on mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');

    await expect(page.locator('text=Welcome')).toBeVisible();
    await expect(page.locator('text=Sign in with Google')).toBeVisible();

    // Card should be visible and not overflowing
    const card = page.locator('.bg-bg-card, [class*="bg-bg-card"]').first();
    if (await card.isVisible()) {
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(375);
    }
  });

  test('RESP-002: Login page responsive on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('RESP-003: Login page responsive on desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('RESP-004: 404 page responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/nonexistent');
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Go to Timer')).toBeVisible();
  });
});
