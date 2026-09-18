import { test, expect } from '@playwright/test';

const base = '/templates/studio-press/';
const pages = ['index.html', 'issue.html', 'essay.html', 'masthead.html', 'colophon.html'];

test('Quire is responsive on every page, carries no images and resolves its links', async ({ page }) => {
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
      // This edition is set, not illustrated: the ornaments are inline SVG and CSS.
      expect(await page.locator('img').count(), `${file} at ${width}`).toBe(0);
      expect(await page.locator('svg').count()).toBeGreaterThan(0);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const navLinks = await page.locator('header nav a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).getAttribute('href')!));
  expect(navLinks).toEqual(['index.html', 'issue.html', 'essay.html', 'masthead.html']);
  for (const href of navLinks) {
    const response = await page.request.get(base + href);
    expect(response.ok(), href).toBeTruthy();
  }
  await expect(page.locator('footer').getByRole('link', { name: 'letters@example.com' })).toHaveAttribute('href', 'mailto:letters@example.com');
  await expect(page.getByText('The content of this template is illustrative', { exact: false })).toBeVisible();
  await page.locator('footer').getByRole('link', { name: 'Colophon and source' }).click();
  await expect(page).toHaveURL(/colophon\.html$/);
  await expect(page.getByText('Adapted from AstroPaper', { exact: false })).toBeVisible();
  const archive = await page.request.get(base + 'source.zip');
  expect(archive.ok()).toBeTruthy();
  expect((await archive.body()).subarray(0, 2).toString()).toBe('PK');
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('navigation reaches the issue, the reading room and the masthead', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.locator('header nav').getByRole('link', { name: 'Issue Seven' }).click();
  await expect(page).toHaveURL(/issue\.html$/);
  await expect(page.locator('h1')).toHaveText('Width');
  await page.locator('.contents').getByRole('link', { name: 'The measure' }).click();
  await expect(page).toHaveURL(/essay\.html$/);
  await expect(page.locator('h1')).toHaveText('The measure');
  await page.locator('header nav').getByRole('link', { name: 'Masthead' }).click();
  await expect(page).toHaveURL(/masthead\.html$/);
  await expect(page.locator('h1')).toHaveText('Who makes it');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Contents' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Contents' }).click();
  await dialog.getByRole('link', { name: 'Reading room' }).click();
  await expect(page).toHaveURL(/essay\.html$/);
});

test('the reading settings work from the keyboard and persist across pages', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'essay.html', { waitUntil: 'networkidle' });
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-reading-mode', 'day');
  await expect(html).toHaveAttribute('data-type-size', 'regular');

  const paragraph = page.locator('.essay-body p').first();
  const regular = await paragraph.evaluate(el => parseFloat(getComputedStyle(el).fontSize));

  const rail = page.locator('.rail');
  const large = rail.locator('[data-size="large"]');
  await large.focus();
  await page.keyboard.press('Enter');
  await expect(html).toHaveAttribute('data-type-size', 'large');
  await expect(large).toHaveAttribute('aria-pressed', 'true');
  await expect(rail.locator('[data-size="regular"]')).toHaveAttribute('aria-pressed', 'false');
  expect(await paragraph.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(regular);

  const night = rail.getByRole('button', { name: 'Night' });
  await night.click();
  await expect(html).toHaveAttribute('data-reading-mode', 'night');
  await expect(rail.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#reading-status')).toHaveText('Reading in night mode, type set large.');
  const nightPaper = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  // Both axes survive a reload and travel to the next page.
  await page.reload({ waitUntil: 'networkidle' });
  await expect(html).toHaveAttribute('data-reading-mode', 'night');
  await expect(html).toHaveAttribute('data-type-size', 'large');
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await expect(html).toHaveAttribute('data-reading-mode', 'night');
  await expect(html).toHaveAttribute('data-type-size', 'large');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(nightPaper);

  // The header toggle is the same control and puts it back.
  await page.locator('header').getByRole('button', { name: 'Day' }).click();
  await expect(html).toHaveAttribute('data-reading-mode', 'day');
  await page.goto(base + 'essay.html', { waitUntil: 'networkidle' });
  await expect(html).toHaveAttribute('data-reading-mode', 'day');
  await rail.locator('[data-size="regular"]').click();
  await expect(html).toHaveAttribute('data-type-size', 'regular');
  expect(errors).toEqual([]);
});

test('the index filters by issue', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const items = page.locator('.index-item');
  expect(await items.count()).toBe(12);
  await expect(items.filter({ visible: true })).toHaveCount(12);
  await expect(page.locator('#index-status')).toHaveText('Showing 12 pieces, every issue');

  await page.getByRole('button', { name: 'Issue Six' }).click();
  await expect(items.filter({ visible: true })).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Issue Six' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'All issues' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#index-status')).toHaveText('Showing 3 pieces');
  const list = page.locator('.index-list');
  await expect(list.getByRole('link', { name: 'Against the clean desk' })).toBeVisible();
  await expect(list.getByRole('link', { name: 'The measure' })).toBeHidden();

  await page.getByRole('button', { name: 'Issue Seven' }).focus();
  await page.keyboard.press('Enter');
  await expect(items.filter({ visible: true })).toHaveCount(5);
  await expect(list.getByRole('link', { name: 'The measure' })).toBeVisible();

  await page.getByRole('button', { name: 'All issues' }).click();
  await expect(items.filter({ visible: true })).toHaveCount(12);
});

test('the essay body keeps a readable measure at 1440 and at every type size', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'essay.html', { waitUntil: 'networkidle' });

  const charactersPerLine = () => page.evaluate(() => {
    const paragraph = document.querySelector('.essay-body p') as HTMLElement;
    const style = getComputedStyle(paragraph);
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px';
    probe.style.fontFamily = style.fontFamily;
    probe.style.fontSize = style.fontSize;
    probe.style.fontWeight = style.fontWeight;
    probe.style.letterSpacing = style.letterSpacing;
    // A representative run of lowercase letters and spaces, not the width of a zero.
    const sample = 'the quick brown fox jumps over a lazy dog and then reads a page of prose';
    probe.textContent = sample;
    document.body.appendChild(probe);
    const average = probe.getBoundingClientRect().width / sample.length;
    probe.remove();
    return paragraph.getBoundingClientRect().width / average;
  });

  const regular = await charactersPerLine();
  expect(regular).toBeGreaterThan(55);
  expect(regular).toBeLessThan(85);

  // The column is specified in characters, so the line holds about the same
  // number of them when the reader changes the type size.
  for (const size of ['small', 'large']) {
    await page.locator(`.rail [data-size="${size}"]`).click();
    const measured = await charactersPerLine();
    expect(measured, size).toBeGreaterThan(55);
    expect(measured, size).toBeLessThan(85);
    expect(Math.abs(measured - regular), size).toBeLessThan(6);
  }
});

test('the essay headline, the standfirst and an index entry stay editable through the native template engine', async ({ page }) => {
  await page.goto(base + 'essay.html');
  const result = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-press/essay.html')).text();
    const initial = editTemplateDocument(html, 'essay.html', {});
    const title = initial.elements.find((e: any) => e.canText && e.text === 'The measure');
    const stand = initial.elements.find((e: any) => e.canText && e.text.startsWith('A column is a decision about pace'));
    const opening = initial.elements.find((e: any) => e.canText && e.text.startsWith('Setting a page begins'));
    const note = initial.elements.find((e: any) => e.canText && e.text.startsWith('Notes like this one'));
    if (!title || !stand || !opening || !note) throw Error('Missing editable essay elements');
    const changed = editTemplateDocument(html, 'essay.html', {
      ['essay.html::' + title.id + '::text']: 'The column',
      ['essay.html::' + stand.id + '::text']: 'A first line about my own publication.',
    });
    return {
      title: changed.doc.querySelector('h1').textContent,
      stand: changed.doc.querySelector('.essay-stand').textContent,
    };
  });
  expect(result.title).toBe('The column');
  expect(result.stand).toBe('A first line about my own publication.');

  const indexResult = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-press/index.html')).text();
    const initial = editTemplateDocument(html, 'index.html', {});
    const entry = initial.elements.find((e: any) => e.canText && e.text === 'Rooms that are mostly door');
    if (!entry) throw Error('Missing editable index entry');
    const changed = editTemplateDocument(html, 'index.html', {
      ['index.html::' + entry.id + '::text']: 'A piece of my own',
    });
    return changed.doc.querySelectorAll('.index-title')[1].textContent;
  });
  expect(indexResult).toBe('A piece of my own');
});
