import { test, expect } from '@playwright/test';

const base = '/templates/studio-gallery/';
const pages = ['index.html', 'programme.html', 'field-notation.html', 'visit.html', 'credits.html'];
const illustrated = ['index.html', 'programme.html', 'field-notation.html', 'visit.html'];

test('Plinth gallery edition is responsive on every page, draws its own geometry and resolves its links', async ({ page }) => {
  const errors: string[] = [];
  const failures: string[] = [];
  const external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173/')) external.push(request.url()); });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const file of pages) {
      await page.goto(base + file, { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${file} at ${width}`).toBeLessThanOrEqual(width + 1);
      const images = page.locator('main img');
      if (illustrated.includes(file)) expect(await images.count(), `${file} images`).toBeGreaterThan(0);
      for (const image of await images.all()) {
        expect(await image.evaluate(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true);
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const navLinks = await page.locator('header nav a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).getAttribute('href')!));
  expect(navLinks).toEqual(['index.html', 'programme.html', 'field-notation.html', 'visit.html']);
  for (const href of navLinks) {
    const response = await page.request.get(base + href);
    expect(response.ok(), href).toBeTruthy();
  }
  await expect(page.getByRole('link', { name: 'Write to us' })).toHaveAttribute('href', 'mailto:hello@example.com');
  await expect(page.locator('footer').getByRole('link', { name: 'hello@example.com' })).toHaveAttribute('href', 'mailto:hello@example.com');
  await expect(page.getByText('illustrative art space', { exact: false }).first()).toBeVisible();

  // Navigation between pages, by nav and by a link inside the page.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Programme' }).click();
  await expect(page).toHaveURL(/programme\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ten entries');
  await page.locator('.entry').first().getByRole('link', { name: 'Field Notation' }).click();
  await expect(page).toHaveURL(/field-notation\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Field Notation');
  await page.getByRole('link', { name: 'Find the rooms on the plan' }).click();
  await expect(page).toHaveURL(/visit\.html$/);
  await expect(page.locator('.plan img')).toBeVisible();
  await page.locator('footer').getByRole('link', { name: 'Credits and source' }).click();
  await expect(page).toHaveURL(/credits\.html$/);
  await expect(page.getByText('Adapted from', { exact: false })).toBeVisible();

  const archive = await page.request.get(base + 'source.zip');
  expect(archive.ok()).toBeTruthy();
  expect((await archive.body()).subarray(0, 2).toString()).toBe('PK');
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('the programme filter, the list and grid views and the mobile menu work with mouse and keyboard', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + 'programme.html', { waitUntil: 'networkidle' });
  const entries = page.locator('.programme .entry');
  expect(await entries.count()).toBe(10);
  await expect(entries.filter({ visible: true })).toHaveCount(10);
  await expect(page.locator('#programme-count')).toHaveText('Showing 10 entries, all');

  await page.getByRole('button', { name: 'On now' }).click();
  await expect(entries.filter({ visible: true })).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'On now' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#programme-count')).toHaveText('Showing 3 of 10 entries, on now');
  await expect(page.locator('.entry', { hasText: 'Paper Rooms' })).toBeHidden();

  await page.getByRole('button', { name: 'On now' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Upcoming' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Upcoming' })).toHaveAttribute('aria-pressed', 'true');
  await expect(entries.filter({ visible: true })).toHaveCount(3);
  await expect(page.locator('.entry', { hasText: 'Ground Plane' })).toBeVisible();

  await page.getByRole('button', { name: 'Past' }).click();
  await expect(entries.filter({ visible: true })).toHaveCount(4);
  await expect(page.locator('#programme-count')).toHaveText('Showing 4 of 10 entries, past');

  // The view switch keeps the filter, and the filter keeps the view.
  const programme = page.locator('.programme');
  await expect(programme).toHaveAttribute('data-view', 'list');
  await page.getByRole('button', { name: 'Grid' }).click();
  await expect(programme).toHaveAttribute('data-view', 'grid');
  await expect(page.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'false');
  await expect(entries.filter({ visible: true })).toHaveCount(4);
  await page.getByRole('button', { name: 'All' }).click();
  await expect(entries.filter({ visible: true })).toHaveCount(10);
  await expect(programme).toHaveAttribute('data-view', 'grid');
  await page.getByRole('button', { name: 'List' }).click();
  await expect(programme).toHaveAttribute('data-view', 'list');
  await expect(entries.filter({ visible: true })).toHaveCount(10);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Menu' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await dialog.getByRole('link', { name: 'Visit' }).click();
  await expect(page).toHaveURL(/visit\.html$/);
  expect(errors).toEqual([]);
});

test('the headline, the drawn marks and the programme entries stay editable through the native template engine', async ({ page }) => {
  await page.goto(base + 'index.html');
  const home = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-gallery/index.html')).text();
    const initial = editTemplateDocument(html, 'index.html', {});
    const opening = initial.elements.find((e: any) => e.canText && e.text === 'Six rooms.');
    const closing = initial.elements.find((e: any) => e.canText && e.text === 'look.');
    const image = initial.elements.find((e: any) => e.tag === 'img');
    const lead = initial.elements.find((e: any) => e.canText && e.text.startsWith('Plinth keeps three exhibitions'));
    if (!opening || !closing || !image || !lead) throw Error('Missing editable masthead elements');
    const edits = {
      ['index.html::' + closing.id + '::text']: 'long stay.',
      ['index.html::' + image.id + '::alt']: 'Our own wall drawing',
    };
    const changed = editTemplateDocument(html, 'index.html', edits);
    return {
      headline: changed.doc.querySelector('h1').textContent,
      alt: changed.doc.querySelector('.masthead-figure img').alt,
    };
  });
  expect(home.headline).toBe('Six rooms.One longlong stay.');
  expect(home.alt).toBe('Our own wall drawing');

  const programme = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-gallery/programme.html')).text();
    const initial = editTemplateDocument(html, 'programme.html', {});
    const titles = ['Field Notation', 'Slow Signals', 'Ground Plane', 'Paper Rooms'].map(title =>
      initial.elements.find((e: any) => e.canText && e.text === title),
    );
    const room = initial.elements.find((e: any) => e.canText && e.text === 'Upper Hall');
    if (titles.some(t => !t) || !room) throw Error('Missing editable programme elements');
    const edits = { ['programme.html::' + titles[1]!.id + '::text']: 'Slower Signals' };
    const changed = editTemplateDocument(html, 'programme.html', edits);
    return {
      second: changed.doc.querySelectorAll('.entry h3')[1].textContent,
      count: changed.doc.querySelectorAll('.entry').length,
    };
  });
  expect(programme.second).toBe('Slower Signals');
  expect(programme.count).toBe(10);
});
