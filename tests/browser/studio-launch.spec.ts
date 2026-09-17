import { test, expect } from '@playwright/test';

const base = '/templates/studio-launch/';
const pages = ['index.html', 'how-it-works.html', 'changelog.html', 'principles.html', 'credits.html'];

test('Apogee launch edition is responsive on every page, loads its drawings and resolves its links', async ({ page }) => {
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
      if (['index.html', 'how-it-works.html', 'principles.html'].includes(file)) expect(await images.count()).toBeGreaterThan(0);
      for (const image of await images.all()) {
        expect(await image.evaluate(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true);
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const navLinks = await page.locator('header nav a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).getAttribute('href')!));
  expect(navLinks).toEqual(['index.html', 'how-it-works.html', 'changelog.html', 'principles.html']);
  for (const href of navLinks) {
    const response = await page.request.get(base + href);
    expect(response.ok(), href).toBeTruthy();
  }
  await expect(page.getByRole('link', { name: 'Write to us' })).toHaveAttribute('href', 'mailto:hello@example.com');
  await expect(page.locator('footer').getByRole('link', { name: 'hello@example.com' })).toHaveAttribute('href', 'mailto:hello@example.com');
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

test('the finish toggle, step index, changelog expander and mobile menu work with mouse and keyboard', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const view = page.locator('.hero-visual');
  const graphite = view.locator('img[data-finish-image="graphite"]');
  const bone = view.locator('img[data-finish-image="bone"]');
  await expect(graphite).toBeVisible();
  await expect(bone).toBeHidden();
  await page.getByRole('button', { name: 'Bone' }).click();
  await expect(view).toHaveAttribute('data-finish-view', 'bone');
  await expect(bone).toBeVisible();
  await expect(graphite).toBeHidden();
  await expect(page.getByRole('button', { name: 'Bone' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Bone' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Graphite' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Graphite' })).toHaveAttribute('aria-pressed', 'true');
  await expect(graphite).toBeVisible();
  await expect(page.locator('#finish-status')).toHaveText('Showing Deck in Graphite');

  await page.goto(base + 'how-it-works.html', { waitUntil: 'networkidle' });
  await expect(page.locator('.step-index a[aria-current="true"]')).toContainText('01');
  await page.locator('#step-3').scrollIntoViewIfNeeded();
  await expect(page.locator('.step-index a[aria-current="true"]')).toContainText('03');
  await page.locator('#step-4 h2').scrollIntoViewIfNeeded();
  await expect(page.locator('.step-index a[aria-current="true"]')).toContainText('04');

  await page.goto(base + 'changelog.html', { waitUntil: 'networkidle' });
  const releases = page.locator('details.release');
  expect(await releases.count()).toBe(4);
  await expect(releases.first()).toHaveAttribute('open', '');
  await expect(releases.nth(1)).not.toHaveAttribute('open', '');
  const expandAll = page.getByRole('button', { name: 'Expand all' });
  await expandAll.focus();
  await page.keyboard.press('Enter');
  for (const release of await releases.all()) await expect(release).toHaveAttribute('open', '');
  await expect(page.getByRole('button', { name: 'Collapse all' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Collapse all' }).click();
  for (const release of await releases.all()) await expect(release).not.toHaveAttribute('open', '');
  await releases.nth(1).locator('summary').click();
  await expect(releases.nth(1)).toHaveAttribute('open', '');
  await expect(releases.nth(1).getByText('A second knob page: tone, level, pan and swing.', { exact: false })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Menu' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await dialog.getByRole('link', { name: 'Principles' }).click();
  await expect(page).toHaveURL(/principles\.html$/);
  expect(errors).toEqual([]);
});

test('the hero headline and product drawing stay editable through the native template engine', async ({ page }) => {
  await page.goto(base + 'index.html');
  const result = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-launch/index.html')).text();
    const initial = editTemplateDocument(html, 'index.html', {});
    const opening = initial.elements.find((e: any) => e.canText && e.text === 'Play the idea\nbefore it');
    const closing = initial.elements.find((e: any) => e.canText && e.text === 'gets away.');
    const image = initial.elements.find((e: any) => e.tag === 'img');
    const lead = initial.elements.find((e: any) => e.canText && e.text.startsWith('Deck is a sequencer for the desk'));
    if (!opening || !closing || !image || !lead) throw Error('Missing editable hero elements');
    const edits = { ['index.html::' + closing.id + '::text']: 'gets lost.', ['index.html::' + image.id + '::alt']: 'My product photograph' };
    const changed = editTemplateDocument(html, 'index.html', edits);
    return { headline: changed.doc.querySelector('h1').textContent, alt: changed.doc.querySelector('.hero-visual img').alt };
  });
  expect(result.headline).toBe('Play the ideabefore itgets lost.');
  expect(result.alt).toBe('My product photograph');
});
