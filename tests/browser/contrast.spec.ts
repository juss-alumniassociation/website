import AxeBuilder from '@axe-core/playwright';
import { test, expect, sitePath } from './fixtures';

const routes = ['/', '/news-events/', '/support/', '/contact/'];

for (const colorScheme of ['light', 'dark'] as const) {
  test(`WCAG color contrast passes in ${colorScheme} mode on representative pages`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    for (const route of routes) {
      await page.goto(sitePath(route));
      const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      expect(results.violations, `${colorScheme} contrast violations on ${route}: ${JSON.stringify(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })))}`).toEqual([]);
    }
  });
}

for (const route of routes) {
  test(`dark mode remains usable on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    const response = await page.goto(sitePath(route));
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main h1, main h2').first()).toBeVisible();
    await expect(page.locator('.mobile-menu summary')).toBeVisible();
    const headerSpacing = await page.evaluate(() => {
      const header = document.querySelector('.site-header')!;
      const bar = header.querySelector('.accent-bar')!;
      const wordmark = header.querySelector('.wordmark')!;
      const menu = header.querySelector('.mobile-menu summary')!;
      return {
        barBottom: bar.getBoundingClientRect().bottom,
        wordmarkTop: wordmark.getBoundingClientRect().top,
        wordmarkBottom: wordmark.getBoundingClientRect().bottom,
        menuTop: menu.getBoundingClientRect().top,
      };
    });
    expect(headerSpacing.wordmarkTop - headerSpacing.barBottom, 'wordmark should clear the masthead stripe').toBeGreaterThanOrEqual(6);
    expect(headerSpacing.menuTop - headerSpacing.wordmarkBottom, 'mobile menu should be spaced below the wordmark').toBeGreaterThanOrEqual(6);
    const contentBounds = await page.locator(route === '/' ? '.hero-inner' : '.content-width').first().boundingBox();
    expect(contentBounds!.x, 'mobile content should have a consistent left margin').toBeGreaterThanOrEqual(20);
    expect(390 - contentBounds!.x - contentBounds!.width, 'mobile content should have a consistent right margin').toBeGreaterThanOrEqual(20);
    await page.locator('.mobile-menu summary').click();
    const navLink = page.locator('.mobile-nav a').first();
    await expect(navLink).toBeVisible();
    await expect(navLink).toHaveAttribute('href', /\/preview\//);
    await navLink.click();
    await expect(page).toHaveURL(/\/preview\/about\/$/);
    await page.waitForLoadState('networkidle');
    const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: innerWidth }));
    expect(dimensions.body, 'dark page should not overflow horizontally').toBeLessThanOrEqual(dimensions.viewport);
  });
}
