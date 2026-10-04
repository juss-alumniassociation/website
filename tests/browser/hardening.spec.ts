import AxeBuilder from '@axe-core/playwright';
import { test, expect, sitePath } from './fixtures';

const fixture = process.env.TEST_FIXTURES === '1';

test('shared landmarks and primary heading are present', async ({ page }) => {
  await page.goto(sitePath(fixture ? '/visual-interior/' : '/about/'));
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('main h1')).toHaveCount(1);
  const levels = await page.locator('main h1, main h2, main h3, main h4, main h5, main h6').evaluateAll(nodes => nodes.map(n => Number(n.tagName.slice(1))));
  expect(levels[0]).toBe(1);
  expect(levels.filter(level => level === 1)).toHaveLength(1);
  for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
});

test('skip link is keyboard reachable, visible, and moves focus to main', async ({ page }) => {
  await page.goto(sitePath('/'));
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  const visibility = await skip.evaluate(el => getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).opacity !== '0');
  expect(visibility).toBeTruthy();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator('main')).toBeFocused();
});

test('desktop navigation and important actions expose visible keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(sitePath('/'));
  const firstNav = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link').first();
  await firstNav.focus();
  await expect(firstNav).toBeFocused();
  const outline = await firstNav.evaluate(el => getComputedStyle(el).outlineStyle);
  const shadow = await firstNav.evaluate(el => getComputedStyle(el).boxShadow);
  expect(outline !== 'none' || shadow !== 'none').toBeTruthy();
  await expect(page.getByRole('link', { name: 'Contact JUSSAA' })).toHaveAccessibleName('Contact JUSSAA');
});

test('mobile menu uses native keyboard interaction without trapping focus', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(sitePath('/'));
  const summary = page.locator('.mobile-menu summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mobile-menu')).toHaveAttribute('open', '');
  const firstLink = page.getByRole('navigation', { name: 'Mobile primary navigation' }).getByRole('link').first();
  await firstLink.focus();
  await expect(firstLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.mobile-menu').getByText('About', { exact: true })).not.toBeFocused();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
});

test('representative pages reflow at 320 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const routes = fixture ? ['/visual-interior/', '/visual-news-events/'] : ['/'];
  for (const route of routes) {
    await page.goto(sitePath(route));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} horizontal overflow`).toBeLessThanOrEqual(1);
  }
});

test('public metadata follows the configured identity and contains no social image', async ({ page }) => {
  const route = fixture ? '/news/long-summary-one-link/' : '/';
  await page.goto(sitePath(route));
  const expectedTitle = fixture ? 'A Representative News Item with a Deliberately Long Title That Wraps Across Multiple Lines in the News & Events Listing | JUSSAA' : 'JUSSAA | The Junior & Senior School Alumni Association';
  await expect(page).toHaveTitle(expectedTitle);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', fixture ? 'This deliberately longer summary uses artificial test language to exercise line wrapping across desktop and mobile layouts while keeping its wording stable between runs and editorial updates.' : 'The Junior & Senior School Alumni Association');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toMatch(fixture ? /^https:\/\/jussaa\.org\/news\/long-summary-one-link\/$/ : /^https:\/\/jussaa\.org\/$/);
  for (const [selector, value] of [
    ['meta[property="og:title"]', expectedTitle],
    ['meta[property="og:description"]', await page.locator('meta[name="description"]').getAttribute('content')],
    ['meta[property="og:url"]', canonical],
    ['meta[property="og:type"]', 'website'],
    ['meta[property="og:site_name"]', 'JUSSAA'],
    ['meta[name="twitter:card"]', 'summary'],
    ['meta[name="twitter:title"]', expectedTitle],
    ['meta[name="twitter:description"]', await page.locator('meta[name="description"]').getAttribute('content')],
  ] as const) await expect(page.locator(selector)).toHaveAttribute('content', value!);
  await expect(page.locator('meta[property="og:image"], meta[name="twitter:image"]')).toHaveCount(0);
  if (fixture) {
    const sitemap = await page.evaluate(async () => await (await fetch('/preview/sitemap.xml')).text());
    expect(sitemap).toContain('https://jussaa.org/news/long-summary-one-link/');
  }
});

test('About metadata uses its page description', async ({ page }) => {
  test.skip(fixture);
  await page.goto(sitePath('/about/'));
  await expect(page).toHaveTitle('About | JUSSAA');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://jussaa.org/about/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://jussaa.org/about/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'About | JUSSAA');
});

test('404 page is usable, noindex, and passes Axe', async ({ page, messages }) => {
  await page.goto(sitePath('/404.html'));
  await expect(page.locator('main h1')).toHaveText('Page not found');
  for (const [label, href] of [['Return to Home', '/preview/'], ['News & Events', '/preview/news-events/'], ['Contact JUSSAA', '/preview/contact/']] as const) {
    await expect(page.locator('main').getByRole('link', { name: label })).toHaveAttribute('href', href);
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map(v => v.id)).toEqual([]);
  expect(messages).toEqual([]);
});
