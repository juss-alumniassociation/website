import { test, expect, expectShellAssets, sitePath } from './fixtures';

const routes = [
  { path: '/', heading: 'Connected by our school.' },
  { path: '/about/', heading: 'About' },
  { path: '/history/', heading: 'History' },
  { path: '/news-events/', heading: 'News & Events' },
  { path: '/get-involved/', heading: 'Get Involved' },
  { path: '/support/', heading: 'Support JUSSAA' },
  { path: '/contact/', heading: 'Contact' },
];

for (const route of routes) {
  test(`loads ${route.path} with the shared shell`, async ({ page }) => {
    const response = await page.goto(sitePath(route.path));
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1, main h2').filter({ hasText: route.heading }).first()).toBeVisible();
    if (route.path !== '/') {
      const headingTop = await page.locator('.page-intro h1').evaluate(heading => heading.getBoundingClientRect().top);
      const fixedHeaderBottom = await page.locator('.site-header').evaluate(header => header.getBoundingClientRect().bottom);
      expect(headingTop, 'interior heading should clear the fixed header').toBeGreaterThanOrEqual(fixedHeaderBottom);
    }
    await expectShellAssets(page);
    if (route.path === '/') {
      await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]')).toHaveAttribute('content', '#21632C');
      await expect(page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')).toHaveAttribute('content', '#174820');
    }
  });
}
