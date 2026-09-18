import { test, expect } from '@playwright/test';

const base = '/templates/studio-signal/';
const pages = ['index.html', 'releases.html', 'release-tessellate.html', 'studio.html', 'credits.html'];

test('Overtone signal edition is responsive on every page, draws its own art and resolves its links', async ({ page }) => {
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
      if (file !== 'credits.html') expect(await images.count(), file).toBeGreaterThan(0);
      for (const image of await images.all()) {
        expect(await image.evaluate(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true);
      }
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const navLinks = await page.locator('header nav a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).getAttribute('href')!));
  expect(navLinks).toEqual(['index.html', 'releases.html', 'release-tessellate.html', 'studio.html']);
  for (const href of navLinks) {
    const response = await page.request.get(base + href);
    expect(response.ok(), href).toBeTruthy();
  }
  await expect(page.getByRole('link', { name: 'Write to us' })).toHaveAttribute('href', 'mailto:hello@example.com');
  await expect(page.locator('footer').getByRole('link', { name: 'hello@example.com' })).toHaveAttribute('href', 'mailto:hello@example.com');

  // Every page says its content is illustrative.
  for (const file of pages) {
    await page.goto(base + file, { waitUntil: 'networkidle' });
    if (file === 'credits.html') await expect(page.getByText('illustrative label', { exact: false }).first()).toBeVisible();
    else await expect(page.locator('.demo-note').first()).toBeVisible();
  }

  // Navigation between pages works by clicking, not only by URL.
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.locator('header nav').getByRole('link', { name: 'Catalogue' }).click();
  await expect(page).toHaveURL(/releases\.html$/);
  await page.locator('.release h3 a').first().click();
  await expect(page).toHaveURL(/release-tessellate\.html$/);
  await expect(page.locator('h1')).toHaveText('Tessellate');
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

test('the catalogue filters by format and year together, with a count, an empty state and arrow keys', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + 'releases.html', { waitUntil: 'networkidle' });
  const formats = page.locator('.filter-group[data-filter="format"]');
  const years = page.locator('.filter-group[data-filter="year"]');
  const shown = page.locator('.release:not([hidden])');
  const count = page.locator('#release-count');
  const empty = page.locator('#release-empty');

  await expect(shown).toHaveCount(12);
  await expect(count).toHaveText('Showing all 12 releases');
  await expect(empty).toBeHidden();

  await formats.getByRole('button', { name: 'Vinyl' }).click();
  await expect(shown).toHaveCount(5);
  await expect(count).toHaveText('Showing 5 of 12 releases');
  await expect(formats.getByRole('button', { name: 'Vinyl' })).toHaveAttribute('aria-pressed', 'true');
  await expect(formats.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');

  await years.getByRole('button', { name: '2025' }).click();
  await expect(shown).toHaveCount(1);
  await expect(shown.locator('h3')).toHaveText('Grid Nine');

  // A pair of filters that matches nothing shows the empty state instead of a blank page.
  await formats.getByRole('button', { name: 'Tape' }).click();
  await years.getByRole('button', { name: '2026' }).click();
  await expect(shown).toHaveCount(0);
  await expect(empty).toBeVisible();
  await expect(count).toHaveText('Showing 0 of 12 releases');

  await page.getByRole('button', { name: 'Clear the filters' }).click();
  await expect(shown).toHaveCount(12);
  await expect(empty).toBeHidden();
  await expect(formats.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');

  // Arrow keys move along a group and select as they go.
  await formats.getByRole('button', { name: 'All' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(formats.getByRole('button', { name: 'Vinyl' })).toBeFocused();
  await expect(shown).toHaveCount(5);
  await page.keyboard.press('ArrowLeft');
  await expect(formats.getByRole('button', { name: 'All' })).toBeFocused();
  await expect(shown).toHaveCount(12);

  expect(errors).toEqual([]);
});

test('the play state toggles a drawn waveform, with no audio anywhere and no autoplay', async ({ page }) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173/')) external.push(request.url()); });
  await page.goto(base + 'release-tessellate.html', { waitUntil: 'networkidle' });

  expect(await page.locator('audio, video, [autoplay], iframe').count()).toBe(0);
  const player = page.locator('.player');
  const play = page.getByRole('button', { name: 'Play the waveform' });
  await expect(player).toHaveAttribute('data-playing', 'false');
  await expect(play).toHaveAttribute('aria-pressed', 'false');
  expect(await page.locator('.wave-bar').count()).toBe(48);
  await expect(page.locator('.playhead')).toHaveCSS('opacity', '0');

  await play.click();
  await expect(player).toHaveAttribute('data-playing', 'true');
  await expect(page.getByRole('button', { name: 'Pause the waveform' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#player-status')).toHaveText('Waveform preview running');
  await expect(page.locator('.playhead')).toHaveCSS('opacity', '1');
  expect(await page.locator('.wave-bar').first().evaluate(el => getComputedStyle(el).animationName)).toBe('bar');

  // The same button works from the keyboard.
  const pause = page.getByRole('button', { name: 'Pause the waveform' });
  await pause.focus();
  await page.keyboard.press('Enter');
  await expect(player).toHaveAttribute('data-playing', 'false');
  await expect(page.locator('#player-status')).toHaveText('Waveform preview stopped');
  await expect(page.getByRole('button', { name: 'Play the waveform' })).toBeVisible();

  // Aligned numbers come from tabular figures in the sans, not from a monospace face.
  const numerals = await page.locator('.track-length').first().evaluate(el => {
    const style = getComputedStyle(el);
    return { variant: style.fontVariantNumeric, family: style.fontFamily };
  });
  expect(numerals.variant).toContain('tabular-nums');
  expect(numerals.family.toLowerCase()).not.toContain('mono');

  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('the mobile menu opens, closes and navigates', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Menu' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await dialog.getByRole('link', { name: 'Studio' }).click();
  await expect(page).toHaveURL(/studio\.html$/);
  expect(errors).toEqual([]);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('nothing animates, and the play state is still readable', async ({ page }) => {
    await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
    expect(await page.locator('.kinetic-line').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    expect(await page.locator('.marquee-track').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    await page.goto(base + 'release-tessellate.html', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Play the waveform' }).click();
    await expect(page.locator('.player')).toHaveAttribute('data-playing', 'true');
    const bar = await page.locator('.wave-bar').first().evaluate(el => ({ animation: getComputedStyle(el).animationName, fill: getComputedStyle(el).fill }));
    expect(bar.animation).toBe('none');
    expect(bar.fill).toBe('rgb(217, 255, 63)');
    expect(await page.locator('.playhead').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    await expect(page.locator('.playhead')).toHaveCSS('opacity', '1');
  });
});

test('the hero headline and the sleeves stay editable through the native template engine', async ({ page }) => {
  await page.goto(base + 'index.html');
  const result = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-signal/index.html')).text();
    const initial = editTemplateDocument(html, 'index.html', {});
    const closing = initial.elements.find((e: any) => e.canText && e.text === 'left in.');
    const opening = initial.elements.find((e: any) => e.canText && e.text === 'Sound with');
    const lead = initial.elements.find((e: any) => e.canText && e.text.startsWith('Overtone presses a small number'));
    const image = initial.elements.find((e: any) => e.tag === 'img' && String(e.src).includes('cover-ovt-014'));
    if (!opening || !closing || !lead || !image) throw Error('Missing editable hero elements');
    const edits = {
      ['index.html::' + closing.id + '::text']: 'left alone.',
      ['index.html::' + image.id + '::alt']: 'My own sleeve',
    };
    const changed = editTemplateDocument(html, 'index.html', edits);
    return {
      headline: changed.doc.querySelector('h1').textContent,
      alt: changed.doc.querySelector('.feature-cover img').alt,
    };
  });
  expect(result.headline).toBe('Sound withthe roomleft alone.');
  expect(result.alt).toBe('My own sleeve');
});
