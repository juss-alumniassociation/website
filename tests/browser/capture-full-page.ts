import { PNG } from 'pngjs';
import type { Page } from '@playwright/test';

export async function captureFullPage(page: Page): Promise<Buffer> {
  const pageSize = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }));
  const output = new PNG({ width: pageSize.width, height: pageSize.height });

  for (let documentY = 0; documentY < pageSize.height; documentY += pageSize.viewportHeight) {
    if (documentY > 0) {
      await page.addStyleTag({ content: '.site-header { display: none !important; transition: none !important; }' });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    }
    await page.evaluate(y => window.scrollTo(0, y), documentY);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const scrollY = await page.evaluate(() => window.scrollY);
    const tileBuffer = await page.screenshot({
      animations: 'disabled',
      clip: { x: 0, y: 0, width: pageSize.width, height: Math.min(pageSize.viewportHeight, pageSize.height - scrollY) },
    });
    const tile = PNG.sync.read(tileBuffer);
    const sourceY = documentY - scrollY;
    const rows = Math.min(tile.height - sourceY, pageSize.height - documentY);
    for (let row = 0; row < rows; row++) {
      const sourceStart = ((sourceY + row) * tile.width) * 4;
      const destinationStart = ((documentY + row) * output.width) * 4;
      tile.data.copy(output.data, destinationStart, sourceStart, sourceStart + output.width * 4);
    }
  }

  return PNG.sync.write(output);
}
