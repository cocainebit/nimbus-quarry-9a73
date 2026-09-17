import { test, expect } from '@playwright/test';

const pages = ['index.html', 'two-walls-house.html', 'reading-room.html', 'long-room.html', 'studio.html'];

test('Lintel adaptation has responsive pages, loaded imagery, a working filter and drawing toggle, resolving navigation and a source archive', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const file of pages) {
      await page.goto(`/templates/studio-practice/${file}`);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/templates/studio-practice/index.html');
  const images = page.locator('img:visible');
  expect(await images.count()).toBeGreaterThanOrEqual(8);
  for (let i = 0; i < await images.count(); i++) {
    const image = images.nth(i);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }

  // Project type filter, with the mouse and from the keyboard.
  await page.getByRole('button', { name: 'Cultural', exact: true }).click();
  await expect(page.locator('.project:visible')).toHaveCount(1);
  await expect(page.locator('.project:visible')).toContainText('Reading Room');
  await expect(page.getByRole('button', { name: 'Cultural', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Workplace', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.project:visible')).toHaveCount(1);
  await expect(page.locator('.project:visible')).toContainText('Long Room');
  await expect(page.locator('#filter-status')).toHaveText('Showing 1 workplace project');
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('.project:visible')).toHaveCount(3);

  // Project page: photograph / drawing toggle, keyboard operable.
  await page.getByRole('link', { name: 'Open Two Walls House' }).click();
  await expect(page).toHaveURL(/two-walls-house\.html$/);
  const photo = page.locator('#cover-1 [data-layer="photo"]');
  const drawing = page.locator('#cover-1 [data-layer="drawing"]');
  await expect(photo).toBeVisible();
  await expect(drawing).toBeHidden();
  await page.getByRole('button', { name: 'Drawing', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(drawing).toBeVisible();
  await expect(photo).toBeHidden();
  await expect(page.getByRole('button', { name: 'Drawing', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => drawing.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Photograph', exact: true }).click();
  await expect(photo).toBeVisible();
  await expect(drawing).toBeHidden();
  await expect(page.locator('.case-story dl dt').first()).toHaveText('Type');

  // Next-project links chain through all three studies and back.
  for (const name of ['Reading Room', 'Long Room', 'Two Walls House']) {
    await page.locator('.next-project a').click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
    await expect(page.locator('.case-cover img:visible')).toBeVisible();
  }

  // Studio page: native accordion, mailto contact, nav back to the index.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Studio', exact: true }).click();
  await expect(page).toHaveURL(/studio\.html$/);
  await page.locator('.steps summary').nth(1).click();
  await expect(page.locator('.steps details').nth(1)).toHaveAttribute('open', '');
  await expect(page.getByText('Plans first, by hand, then sections.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'hello@example.com', exact: true })).toHaveAttribute('href', 'mailto:hello@example.com');
  await expect(page.getByRole('link', { name: 'Credits', exact: true })).toHaveAttribute('href', 'studio.html#colophon');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/index\.html#projects$/);
  await expect(page.locator('#projects h2')).toHaveText('Projects');

  const source = await page.request.get('/templates/studio-practice/source.zip');
  expect(source.ok()).toBeTruthy();
  expect((await source.body()).subarray(0, 2).toString()).toBe('PK');
  expect(errors).toEqual([]);
});
