import fs from 'node:fs';
import path from 'node:path';
import { test, expect, sitePath } from './fixtures';

const views = [
  { name: 'home-desktop', url: '/', width: 1440, height: 900, colorScheme: 'light' as const },
  { name: 'home-mobile', url: '/', width: 390, height: 844, colorScheme: 'light' as const },
  { name: 'news-events-desktop', url: '/news-events/', width: 1440, height: 900, colorScheme: 'light' as const },
  { name: 'support-desktop', url: '/support/', width: 1440, height: 900, colorScheme: 'light' as const },
  { name: 'support-mobile', url: '/support/', width: 390, height: 844, colorScheme: 'light' as const },
  { name: 'home-dark', url: '/', width: 1440, height: 900, colorScheme: 'dark' as const },
  { name: 'support-dark', url: '/support/', width: 1440, height: 900, colorScheme: 'dark' as const },
  { name: 'home-support-gap-desktop', url: '/', width: 1440, height: 900, colorScheme: 'light' as const, scrollTo: '.support-prompt' },
  { name: 'home-support-gap-mobile', url: '/', width: 390, height: 844, colorScheme: 'light' as const, scrollTo: '.support-prompt' },
];

for (const view of views) {
  test(`visual: ${view.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: view.width, height: view.height });
    await page.emulateMedia({ colorScheme: view.colorScheme, reducedMotion: 'reduce' });
    await page.goto(sitePath(view.url));
    if ('scrollTo' in view) {
      await page.locator(view.scrollTo).evaluate(element => {
        const targetTop = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, targetTop - window.innerHeight * 0.2);
      });
    }
    const baseline = testInfo.snapshotPath(`${view.name}.png`);
    if (fs.existsSync(baseline)) {
      await expect(page).toHaveScreenshot(`${view.name}.png`, { animations: 'allow' });
    } else {
      const candidateDir = path.resolve('test-results/candidate-visuals');
      fs.mkdirSync(candidateDir, { recursive: true });
      await page.screenshot({ path: path.join(candidateDir, `${view.name}.png`) });
      testInfo.annotations.push({ type: 'visual-baseline', description: `Candidate saved to ${path.relative(process.cwd(), path.join(candidateDir, `${view.name}.png`))}; approval required before promoting.` });
    }
  });
}
