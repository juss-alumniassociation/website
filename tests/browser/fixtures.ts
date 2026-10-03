import { test as base, expect, Locator, Page } from '@playwright/test';

type BrowserErrors = { messages: string[] };

export const test = base.extend<BrowserErrors>({
  messages: async ({ page }, use) => {
    const messages: string[] = [];
    page.on('pageerror', error => messages.push(`pageerror: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') messages.push(`console: ${message.text()}`);
    });
    await use(messages);
    expect(messages, 'unexpected browser errors').toEqual([]);
  },
});

export { expect, Page };
export const sitePath = (path: string) => `/preview${path}`;

export async function clickByPointer(page: Page, locator: Locator) {
  const bounds = await locator.boundingBox();
  expect(bounds, 'pointer target should have visible geometry').not.toBeNull();
  const x = bounds!.x + bounds!.width / 2;
  const y = bounds!.y + bounds!.height / 2;
  const target = await locator.evaluate((element, point) => {
    const hit = document.elementFromPoint(point.x, point.y);
    const rect = element.getBoundingClientRect();
    return { isTarget: hit === element || (hit !== null && element.contains(hit)), hit: hit?.outerHTML.slice(0, 160), point, rect: [rect.x, rect.y, rect.width, rect.height], viewport: [innerWidth, innerHeight], scrollY };
  }, { x, y });
  expect(target.isTarget, `pointer diagnostic ${JSON.stringify(target)}`).toBeTruthy();
  await page.mouse.click(x, y);
}

export const destinations = [
  { label: 'About', path: '/about/', heading: 'About' },
  { label: 'History', path: '/history/', heading: 'History' },
  { label: 'News & Events', path: '/news-events/', heading: 'News & Events' },
  { label: 'Get Involved', path: '/get-involved/', heading: 'Get Involved' },
  { label: 'Support JUSSAA', path: '/support/', heading: 'Support JUSSAA' },
  { label: 'Contact', path: '/contact/', heading: 'Contact' },
];

export async function expectShellAssets(page: Page) {
  const stylesheet = page.locator('link[rel="stylesheet"][href*="styles.css"]');
  const script = page.locator('script[src*="site.js"]');
  await expect(stylesheet).toHaveCount(1);
  await expect(script).toHaveCount(1);
  for (const asset of [stylesheet, script]) {
    const href = (await asset.getAttribute('href')) ?? (await asset.getAttribute('src'));
    const loaded = await page.evaluate(async assetUrl => (await fetch(assetUrl)).ok, href);
    expect(loaded, `asset failed to load: ${href}`).toBeTruthy();
  }
  const logo = page.locator('.brand-logo').first();
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBeTruthy();
}
