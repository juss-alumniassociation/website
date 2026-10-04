import { test, expect, sitePath } from './fixtures';
import { captureFullPage } from './capture-full-page';

const views = [
  { name: 'home-desktop', url: '/visual-home/', width: 1440, height: 900, colorScheme: 'light' as const },
  { name: 'home-mobile', url: '/visual-home/', width: 390, height: 844, colorScheme: 'light' as const },
  { name: 'news-events-desktop', url: '/visual-news-events/', width: 1440, height: 900, colorScheme: 'light' as const },
  { name: 'support-desktop', url: '/visual-support/', width: 1440, height: 900, colorScheme: 'light' as const },
  { name: 'support-mobile', url: '/visual-support/', width: 390, height: 844, colorScheme: 'light' as const },
  { name: 'home-dark-desktop', url: '/visual-home/', width: 1440, height: 900, colorScheme: 'dark' as const },
  { name: 'support-dark-mobile', url: '/visual-support/', width: 390, height: 844, colorScheme: 'dark' as const },
];

for (const view of views) {
  test(`visual: ${view.name}`, async ({ page }) => {
    await page.setViewportSize({ width: view.width, height: view.height });
    await page.emulateMedia({ colorScheme: view.colorScheme, reducedMotion: 'reduce' });
    await page.goto(sitePath(view.url));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('networkidle');
    const screenshot = await captureFullPage(page);
    await expect(screenshot).toMatchSnapshot(`${view.name}.png`, { maxDiffPixelRatio: 0.0035 });
  });
}
