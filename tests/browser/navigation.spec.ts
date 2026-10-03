import { test, expect, destinations, sitePath, clickByPointer } from './fixtures';

test('desktop shows one primary navigation with working destinations', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(sitePath('/'));
  const desktopNav = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(desktopNav).toBeVisible();
  await expect(page.locator('.mobile-menu')).toBeHidden();
  await expect(page.getByRole('navigation')).toHaveCount(1);

  for (const destination of destinations) {
    const link = desktopNav.getByRole('link', { name: destination.label, exact: true });
    await expect(link).toHaveCount(1);
    await clickByPointer(page, link);
    await expect(page).toHaveURL(new RegExp(`/preview${destination.path.replaceAll('/', '\\/')}$`));
    await expect(page.locator('main h1')).toHaveText(destination.heading);
    await page.goto(sitePath('/'));
  }

  await page.goto(sitePath('/support/'));
  await clickByPointer(page, page.locator('.wordmark'));
  await expect(page).toHaveURL(/\/preview\/#top$/);
  await expect(page.locator('main h1')).toBeVisible();
});

test('mobile menu opens by pointer and keyboard and navigates without desktop links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(sitePath('/'));
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeHidden();
  const menu = page.locator('.mobile-menu');
  const summary = menu.locator('summary');
  await expect(summary).toBeVisible();
  const summaryBounds = (await summary.boundingBox())!;
  const headerBounds = (await page.locator('.site-header').boundingBox())!;
  expect(summaryBounds.y + summaryBounds.height).toBeLessThanOrEqual(headerBounds.y + headerBounds.height);
  await expect(page.getByRole('navigation', { name: 'Mobile primary navigation' })).toBeHidden();
  await clickByPointer(page, summary);
  await expect(menu).toHaveAttribute('open', '');
  const mobileNav = page.getByRole('navigation', { name: 'Mobile primary navigation' });
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole('link')).toHaveCount(6);
  await expect(page.locator('.site-nav a')).toHaveCount(6);

  await clickByPointer(page, mobileNav.getByRole('link', { name: 'Support JUSSAA' }));
  await expect(page).toHaveURL(/\/preview\/support\/$/);
  await expect(page.locator('main h1')).toHaveText('Support JUSSAA');

  await page.goto(sitePath('/'));
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('open', '');
  await page.getByRole('navigation', { name: 'Mobile primary navigation' }).getByRole('link', { name: 'Contact' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/preview\/contact\/$/);
  await expect(page.locator('main h1')).toHaveText('Contact');
});

test('tablet breakpoint shows exactly one navigation mode', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(sitePath('/'));
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeHidden();
  await expect(page.locator('.mobile-menu summary')).toBeVisible();
  await clickByPointer(page, page.locator('.mobile-menu summary'));
  await expect(page.getByRole('navigation', { name: 'Mobile primary navigation' })).toBeVisible();
});

test('homepage teaser links and internal Markdown links are baseurl-safe', async ({ page }) => {
  await page.goto(sitePath('/'));
  const about = page.getByRole('link', { name: /More about JUSSAA/ });
  await expect(about).toHaveAttribute('href', '/preview/about/');
  await about.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/preview\/about\/$/);

  await page.goto(sitePath('/'));
  for (const [name, path] of [['Explore ways to get involved', 'get-involved'], ['Explore JUSSAA history', 'history'], ['All news and events', 'news-events'], ['Ways to support JUSSAA', 'support']]) {
    await expect(page.getByRole('link', { name: new RegExp(name) })).toHaveAttribute('href', `/preview/${path}/`);
  }
  await page.goto(sitePath('/get-involved/'));
  await expect(page.getByRole('link', { name: 'Contact page' })).toHaveAttribute('href', '/preview/contact/');
});

test('Support shop link points to Shopify without contacting it', async ({ page }) => {
  await page.goto(sitePath('/support/'));
  await expect(page.getByRole('link', { name: 'JUSSAA shop' })).toHaveAttribute('href', 'https://shop.jussaa.org');
});
