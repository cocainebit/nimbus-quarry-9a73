import { test, expect } from '@playwright/test';

const root = '/templates/studio-retreat/';
const pages = ['index.html', 'stay.html', 'table.html', 'surroundings.html', 'credits.html'];

test('Strand adaptation is responsive on every page, its season switcher works, and its links, images and source archive resolve', async ({ page }) => {
  const errors: string[] = [];
  const failures: string[] = [];
  const external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173/')) external.push(request.url()); });

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const file of pages) {
      await page.goto(root + file, { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      const images = page.locator('img:visible');
      const count = await images.count();
      expect(count).toBeGreaterThan(file === 'credits.html' ? -1 : 0);
      for (let i = 0; i < count; i++) {
        await images.nth(i).scrollIntoViewIfNeeded();
        expect(await images.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      }
    }
  }

  // Season switcher: click, then keyboard.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(root + 'index.html', { waitUntil: 'networkidle' });
  await expect(page.locator('#season-spring')).toBeVisible();
  await expect(page.locator('#season-winter')).toBeHidden();
  await page.getByRole('tab', { name: 'Winter' }).click();
  await expect(page.locator('#season-winter')).toBeVisible();
  await expect(page.locator('#season-spring')).toBeHidden();
  await expect(page.getByRole('tab', { name: 'Winter' })).toHaveAttribute('aria-selected', 'true');
  expect(await page.locator('#season-winter img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('#season-winter .season-line')).toContainText('Snow on the pines');
  await page.getByRole('tab', { name: 'Winter' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#season-spring')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Spring' })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('#season-winter')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#season-autumn')).toBeVisible();

  // Navigation resolves and the enquiry link is a plain mailto.
  await expect(page.locator('.nav .button')).toHaveAttribute('href', 'mailto:hello@example.com');
  await page.locator('.nav-links').getByRole('link', { name: 'Stay' }).click();
  await expect(page).toHaveURL(/stay\.html$/);
  await expect(page.locator('h1')).toContainText('The rooms.');
  await expect(page.getByRole('link', { name: 'Enquire about the Lantern Room' })).toHaveAttribute('href', 'mailto:hello@example.com?subject=The%20Lantern%20Room');
  await page.locator('summary').filter({ hasText: 'The weather' }).click();
  await expect(page.getByText('It changes, often within the hour.', { exact: false })).toBeVisible();
  await expect(page.locator('details[name="practical"][open]')).toHaveCount(1);
  await page.locator('.nav-links').getByRole('link', { name: 'Table' }).click();
  await expect(page).toHaveURL(/table\.html$/);
  await page.locator('.nav-links').getByRole('link', { name: 'Surroundings' }).click();
  await expect(page).toHaveURL(/surroundings\.html$/);
  await page.locator('.ending-links').getByRole('link', { name: 'Credits' }).click();
  await expect(page).toHaveURL(/credits\.html$/);
  await expect(page.getByText('Strand is a Plotform-authored adaptation', { exact: false })).toBeVisible();
  await page.locator('.nav .wordmark').click();
  await expect(page).toHaveURL(/index\.html$/);

  // Small-screen menu.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(root + 'index.html', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('link', { name: 'Table' }).click();
  await expect(page).toHaveURL(/table\.html$/);

  const archive = await page.request.get(root + 'source.zip');
  expect(archive.ok()).toBeTruthy();
  expect((await archive.body()).subarray(0, 2).toString()).toBe('PK');
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
});

test('Strand hero headline, season caption and photograph stay editable through the native template engine', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-retreat/index.html')).text();
    const initial = editTemplateDocument(html, 'index.html', {});
    const headline = initial.elements.find((e: any) => e.canText && e.text === 'Come as the weather finds you.');
    const caption = initial.elements.find((e: any) => e.canText && e.text.startsWith('Snow on the pines'));
    const image = initial.elements.find((e: any) => e.tag === 'img');
    if (!headline || !caption || !image) throw Error('Missing editable hero headline, season caption or photograph');
    const edits = {
      ['index.html::' + headline.id + '::text']: 'Come when the tide lets you.',
      ['index.html::' + caption.id + '::text']: 'Snow on the dunes and the fire lit.',
      ['index.html::' + image.id + '::alt']: 'A customised hero photograph',
    };
    const changed = editTemplateDocument(html, 'index.html', edits);
    return {
      headline: changed.doc.querySelector('h1')!.textContent,
      caption: changed.doc.querySelector('#season-winter .season-line')!.textContent,
      alt: changed.doc.querySelector('img')!.alt,
    };
  });
  expect(result.headline).toBe('Come when the tide lets you.');
  expect(result.caption).toBe('Snow on the dunes and the fire lit.');
  expect(result.alt).toBe('A customised hero photograph');
});
