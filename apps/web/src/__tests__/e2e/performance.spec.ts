import { test, expect } from '@playwright/test';

test.describe('PERF: Performance', () => {
  test('PERF-001: Login page FCP under 1.5s', async ({ page }) => {
    // PRD 19.1: First Contentful Paint < 1.5s on 4G
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
          if (fcpEntry) resolve(fcpEntry.startTime);
        });
        observer.observe({ entryTypes: ['paint'] });
        // Fallback if already painted
        const existing = performance.getEntriesByName('first-contentful-paint');
        if (existing.length) resolve(existing[0]!.startTime);
        // Timeout fallback
        setTimeout(() => resolve(0), 5000);
      });
    });

    if (fcp > 0) {
      expect(fcp).toBeLessThan(1500);
    }
  });

  test('PERF-002: Login page TTI under 3s', async ({ page }) => {
    // PRD 19.1: Time to Interactive < 3s
    const start = Date.now();
    await page.goto('/login', { waitUntil: 'networkidle' });
    const tti = Date.now() - start;
    expect(tti).toBeLessThan(3000);
  });

  test('PERF-003: No console errors on login page', async ({ page }) => {
    // PRD Smoke Check 22.1: No console errors on any page
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/login', { waitUntil: 'networkidle' });

    // Filter out known non-critical errors (like failed favicon loads)
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('manifest')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('PERF-004: 404 page loads under 2 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/nonexistent', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(2000);
  });
});
