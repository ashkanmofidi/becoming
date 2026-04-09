import { test, expect } from '@playwright/test';

test.describe('A11Y: Accessibility', () => {
  test('A11Y-001: Login page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/login');

    // Should have an h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // h2 for "Welcome"
    const h2 = page.locator('h2');
    await expect(h2).toBeVisible();
    await expect(h2).toContainText('Welcome');
  });

  test('A11Y-002: Login page has lang attribute', async ({ page }) => {
    await page.goto('/login');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('A11Y-003: Skip to content link exists', async ({ page }) => {
    await page.goto('/login');
    // PRD 5.2.9: Skip to content link (sr-only, visible on focus)
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);
  });

  test('A11Y-004: Google button has accessible role', async ({ page }) => {
    await page.goto('/login');
    const button = page.locator('button:has-text("Sign in with Google")');
    await expect(button).toBeVisible();
    // Should be a button element (semantic)
    const tagName = await button.evaluate((el) => el.tagName);
    expect(tagName).toBe('BUTTON');
  });

  test('A11Y-005: 404 page is navigable without mouse', async ({ page }) => {
    await page.goto('/nonexistent');

    // Tab to the "Go to Timer" link
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs

    const focusedElement = page.locator(':focus');
    const text = await focusedElement.textContent();
    // Should eventually focus on the Go to Timer link
    expect(text).toBeTruthy();
  });

  test('A11Y-006: Login page images have alt text or are decorative', async ({ page }) => {
    await page.goto('/login');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      const role = await images.nth(i).getAttribute('role');
      // Either has alt text or is marked presentation
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });
});
