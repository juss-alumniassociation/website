import { test, expect, sitePath } from './fixtures';

test('fixture News entries cover optional fields, arbitrary links, wrapping title and body content', async ({ page }) => {
  await page.goto(sitePath('/visual-news-events/'));
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole('link', { name: 'Example Alumni News Item' })).toBeVisible();
  const longNewsTitle = page.getByRole('link', { name: 'A Representative News Item with a Deliberately Long Title That Wraps Across Multiple Lines in the News & Events Listing' });
  await expect(longNewsTitle).toBeVisible();
  const titleLines = await longNewsTitle.evaluate(link => {
    const style = getComputedStyle(link);
    return link.getBoundingClientRect().height / Number.parseFloat(style.lineHeight);
  });
  expect(titleLines, 'fixture News title should wrap at desktop width').toBeGreaterThan(1.5);
  await expect(page.getByRole('link', { name: 'Example News with Several Resources' })).toBeVisible();

  await page.goto(sitePath('/news/body-many-links/'));
  await expect(page.getByText('This is artificial fixture text in the first body paragraph.')).toBeVisible();
  for (const label of ['First example resource', 'Second example resource', 'Third example resource']) {
    await expect(page.getByRole('link', { name: label })).toHaveAttribute('href', /https:\/\/example\.com\//);
  }

  await page.goto(sitePath('/news/no-body-no-summary-no-links/'));
  await expect(page.locator('.entry-summary, .related-links')).toHaveCount(0);
  await expect(page.locator('.collection-entry')).not.toContainText('undefined');
});

test('homepage fixture includes a multi-line participation column', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(sitePath('/visual-home/'));
  const paragraph = page.locator('#connect .pillar').nth(2).locator('p');
  const lines = await paragraph.evaluate(element => element.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(element).lineHeight));
  expect(lines, 'one representative participation column should wrap on desktop').toBeGreaterThan(1.5);
});

test('fixture events have stable upcoming and past grouping and optional fields', async ({ page }) => {
  await page.goto(sitePath('/visual-news-events/'));
  const upcoming = page.getByRole('heading', { name: 'Upcoming events' }).locator('xpath=following-sibling::ul[1]');
  const past = page.getByRole('heading', { name: 'Past events' }).locator('xpath=following-sibling::ul[1]');
  await expect(upcoming.getByRole('link', { name: 'Example Future Gathering' })).toBeVisible();
  await expect(upcoming.getByRole('link', { name: /Representative Future Event/ })).toBeVisible();
  await expect(past.getByRole('link', { name: 'Example Past Event' })).toBeVisible();

  await page.goto(sitePath('/events/upcoming-many-links/'));
  await expect(page.locator('.entry-summary')).toContainText('longer event summary');
  await expect(page.getByRole('link', { name: 'Example registration information' })).toHaveAttribute('href', 'https://example.com/register');

  await page.goto(sitePath('/events/past-no-summary-no-location-no-links/'));
  await expect(page.locator('.entry-summary')).toHaveCount(0);
  await expect(page.locator('.related-links')).toHaveCount(0);
  await expect(page.locator('.listing-meta')).not.toContainText('·');
});

test('support fixture keeps consecutive sections close with comfortable paragraph spacing', async ({ page }) => {
  await page.goto(sitePath('/visual-support/'));
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const measurements = await page.locator('.page-content h2').nth(1).evaluate(heading => {
      const preceding = heading.previousElementSibling;
      if (!preceding) return { gap: -1, innerPadding: -1 };
      return {
        gap: heading.getBoundingClientRect().top - preceding.getBoundingClientRect().bottom,
        sectionDistance: heading.getBoundingClientRect().top - preceding.getBoundingClientRect().top,
      };
    });
    expect(measurements.gap, `fixture sections should retain natural spacing at ${viewport.width}px`).toBeGreaterThan(0);
    expect(measurements.sectionDistance, `fixture sections should remain comfortably separated at ${viewport.width}px`).toBeLessThan(120);
  }
});
