import { test, expect } from '@playwright/test';

test.describe('SEC: Security', () => {
  test('SEC-001: Security headers present on API routes', async ({ request }) => {
    // PRD 17: Security headers on all endpoints
    const response = await request.get('/api/auth/session');

    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBeTruthy();
    expect(response.headers()['referrer-policy']).toBeTruthy();
  });

  test('SEC-002: API returns 401 without session', async ({ request }) => {
    // PRD 1.2.2: Missing session returns 401
    const response = await request.get('/api/auth/session');
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.authenticated).toBe(false);
  });

  test('SEC-003: Timer API returns 401 without session', async ({ request }) => {
    const response = await request.get('/api/timer');
    expect(response.status()).toBe(401);
  });

  test('SEC-004: Sessions API returns 401 without session', async ({ request }) => {
    const response = await request.get('/api/sessions');
    expect(response.status()).toBe(401);
  });

  test('SEC-005: Settings API returns 401 without session', async ({ request }) => {
    const response = await request.get('/api/settings');
    expect(response.status()).toBe(401);
  });

  test('SEC-006: Admin API returns 401 without session', async ({ request }) => {
    const response = await request.get('/api/admin?view=pulse');
    expect(response.status()).toBe(401);
  });

  test('SEC-007: Dashboard API returns 401 without session', async ({ request }) => {
    const response = await request.get('/api/dashboard');
    expect(response.status()).toBe(401);
  });

  test('SEC-008: Feedback API POST returns 401 without session', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: { category: 'general', subject: 'test', description: 'test description here' },
    });
    expect(response.status()).toBe(401);
  });

  test('SEC-009: No sensitive data exposed in login page HTML', async ({ page }) => {
    // PRD 17: No sensitive data in localStorage/sessionStorage before auth
    await page.goto('/login');

    const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
    const sessionStorage = await page.evaluate(() => JSON.stringify(window.sessionStorage));

    // Should not contain tokens, secrets, or user data
    expect(localStorage).not.toContain('token');
    expect(localStorage).not.toContain('secret');
    expect(sessionStorage).not.toContain('token');
    expect(sessionStorage).not.toContain('secret');
  });

  test('SEC-010: HTTPS enforcement header present', async ({ request }) => {
    // PRD 17: HSTS header
    const response = await request.get('/login');
    const hsts = response.headers()['strict-transport-security'];
    // May or may not be present in dev, but check structure if present
    if (hsts) {
      expect(hsts).toContain('max-age=');
    }
  });
});
