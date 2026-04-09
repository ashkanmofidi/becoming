import { test, expect } from '@playwright/test';

test.describe('AUTH: Authentication & Login', () => {
  test('AUTH-001: Login page renders with correct branding', async ({ page }) => {
    await page.goto('/login');

    // PRD 1.1: App name "Becoming.." with amber dots
    await expect(page.locator('h1')).toContainText('Becoming');

    // PRD 1.1: Subtitle "ENTERPRISE FOCUS TIMER"
    await expect(page.locator('text=ENTERPRISE FOCUS TIMER')).toBeVisible();

    // PRD 1.1: "Welcome" heading
    await expect(page.locator('text=Welcome')).toBeVisible();

    // PRD 1.1: Google sign-in button
    await expect(page.locator('text=Sign in with Google')).toBeVisible();

    // PRD 1.1: Beta notice
    await expect(page.locator('text=Limited to 10 beta users')).toBeVisible();

    // PRD 1.1: Terms link
    await expect(page.locator('text=terms of use')).toBeVisible();
  });

  test('AUTH-002: Login page has correct dark theme', async ({ page }) => {
    await page.goto('/login');

    // PRD 1.1: deep black background
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(10, 10, 10)');
  });

  test('AUTH-003: Protected routes redirect to login', async ({ page }) => {
    // PRD 1.1.1: Direct navigation to authenticated route redirects to login
    await page.goto('/timer');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('AUTH-004: Dashboard redirects to login without session', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('AUTH-005: Session Log redirects to login without session', async ({ page }) => {
    await page.goto('/session-log');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('AUTH-006: Settings redirects to login without session', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('AUTH-007: Google sign-in button is clickable with min 48px height', async ({ page }) => {
    await page.goto('/login');
    const button = page.locator('button:has-text("Sign in with Google")');
    await expect(button).toBeEnabled();

    // PRD 1.1: Google chip minimum 48px height
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });

  test('AUTH-008: Login page is stateless (no cookies before auth)', async ({ page }) => {
    // PRD 1.1.1: No session or user data stored before authentication
    await page.goto('/login');
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'bm_sid');
    expect(sessionCookie).toBeUndefined();
  });

  test('AUTH-009: Login page loads in under 3 seconds', async ({ page }) => {
    // PRD 19.1: Time to Interactive < 3s
    const start = Date.now();
    await page.goto('/login', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });
});
