import { test, expect, sitePath } from './fixtures';

test('news pages render optional body and arbitrary optional links', async ({ page }) => {
  await page.goto(sitePath('/news-events/'));
  await expect(page.getByRole('link', { name: 'Fixture story with body and links' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fixture story without body' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fixture story without links' })).toBeVisible();

  await page.goto(sitePath('/news/story-with-body-and-links/'));
  await expect(page.getByText('This is the fixture story body.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'First resource' })).toHaveAttribute('href', 'https://example.com/first');
  await expect(page.getByRole('link', { name: 'Second resource' })).toHaveAttribute('href', 'https://example.com/second');

  await page.goto(sitePath('/news/story-without-body/'));
  await expect(page.getByRole('link', { name: 'One resource' })).toBeVisible();
  await expect(page.locator('.collection-entry')).not.toContainText('undefined');

  await page.goto(sitePath('/news/story-without-links/'));
  await expect(page.getByText('This story has a body but no related links.')).toBeVisible();
  await expect(page.locator('.related-links')).toHaveCount(0);
});

test('events are grouped by date and optional event fields and links render cleanly', async ({ page }) => {
  await page.goto(sitePath('/news-events/'));
  const upcoming = page.getByRole('heading', { name: 'Upcoming events' }).locator('xpath=following-sibling::ul[1]');
  const past = page.getByRole('heading', { name: 'Past events' }).locator('xpath=following-sibling::ul[1]');
  await expect(upcoming.getByRole('link', { name: 'Fixture upcoming event' })).toBeVisible();
  await expect(upcoming.getByRole('link', { name: 'Fixture event without links' })).toBeVisible();
  await expect(past.getByRole('link', { name: 'Fixture past event' })).toBeVisible();

  await page.goto(sitePath('/events/upcoming-event/'));
  await expect(page.locator('.entry-summary')).toHaveText('Future event summary.');
  await expect(page.getByRole('link', { name: 'Register' })).toHaveAttribute('href', 'https://example.com/register');
  await expect(page.getByRole('link', { name: 'Event details' })).toHaveAttribute('href', 'https://example.com/details');

  await page.goto(sitePath('/events/past-event/'));
  await expect(page.getByRole('link', { name: 'Photos' })).toHaveAttribute('href', 'https://example.com/photos');

  await page.goto(sitePath('/events/event-without-links/'));
  await expect(page.locator('.entry-summary')).toHaveCount(0);
  await expect(page.locator('.related-links')).toHaveCount(0);
  await expect(page.locator('.listing-meta')).not.toContainText('·');
});

test('homepage keeps Support and Stay connected adjacent with comfortable inner spacing', async ({ page }) => {
  await page.goto(sitePath('/'));
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const measurements = await page.locator('#contact').evaluate(section => {
      const preceding = section.previousElementSibling;
      const lastLink = preceding?.querySelector('a:last-of-type');
      if (!preceding || !lastLink) return { gap: -1, innerPadding: -1 };
      return {
        gap: section.getBoundingClientRect().top - preceding.getBoundingClientRect().bottom,
        innerPadding: preceding.getBoundingClientRect().bottom - lastLink.getBoundingClientRect().bottom,
      };
    });
    expect(measurements.gap, `sections should meet without a blank band at ${viewport.width}px`).toBe(0);
    expect(measurements.innerPadding, `Support section should retain breathing room at ${viewport.width}px`).toBeGreaterThanOrEqual(30);
  }
});
