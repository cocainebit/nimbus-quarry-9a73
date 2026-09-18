import { test, expect } from '@playwright/test';

const base = '/templates/studio-terminal/';
const pages = ['index.html', 'features.html', 'versions.html', 'support.html', 'about.html'];

test('Bevel is responsive on every page, draws its own art and resolves its links', async ({ page }) => {
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
      // The window chrome must degrade, not scroll sideways.
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${file} at ${width}`).toBeLessThanOrEqual(width + 1);
      const images = page.locator('main img');
      expect(await images.count(), file).toBeGreaterThan(0);
      for (const image of await images.all()) {
        expect(await image.evaluate(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true);
      }
      // Every page says what it is.
      await expect(page.locator('.demo-note').first()).toBeVisible();
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const navLinks = await page.locator('.site-nav a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).getAttribute('href')!));
  expect(navLinks).toEqual(pages);
  for (const href of navLinks) {
    const response = await page.request.get(base + href);
    expect(response.ok(), href).toBeTruthy();
  }
  await expect(page.locator('.colophon').getByRole('link', { name: 'hello@example.com' })).toHaveAttribute('href', 'mailto:hello@example.com');

  // Navigation works by clicking, not only by URL.
  await page.locator('.site-nav').getByRole('link', { name: 'The tour' }).click();
  await expect(page).toHaveURL(/features\.html$/);
  await page.locator('.tree-view').getByRole('link', { name: 'Versions' }).click();
  await expect(page).toHaveURL(/versions\.html$/);
  await expect(page.locator('h1')).toHaveText('Versions and changes.');
  await page.locator('.taskbar').getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/about\.html$/);
  await expect(page.getByText('Adapted from 7.css', { exact: false }).first()).toBeVisible();

  const archive = await page.request.get(base + 'source.zip');
  expect(archive.ok()).toBeTruthy();
  expect((await archive.body()).subarray(0, 2).toString()).toBe('PK');

  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('the inspector is a real tab widget: mouse, keyboard, roles and a visible focus ring', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + 'features.html', { waitUntil: 'networkidle' });

  const tablist = page.getByRole('tablist', { name: 'Inspector panels' });
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  const canvas = page.getByRole('tab', { name: 'Canvas' });
  const palette = page.getByRole('tab', { name: 'Palette' });
  const layers = page.getByRole('tab', { name: 'Layers' });
  const script = page.getByRole('tab', { name: 'Script' });

  await expect(canvas).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-canvas')).toBeVisible();
  await expect(page.locator('#panel-palette')).toBeHidden();
  // The strip is one tab stop: only the selected tab is reachable with Tab.
  expect(await tabs.evaluateAll(items => items.map(item => (item as HTMLElement).tabIndex))).toEqual([0, -1, -1, -1]);

  // By mouse.
  await palette.click();
  await expect(palette).toHaveAttribute('aria-selected', 'true');
  await expect(canvas).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('#panel-palette')).toBeVisible();
  await expect(page.locator('#panel-canvas')).toBeHidden();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-palette');

  // By keyboard: the arrow keys walk the strip and select as they go.
  await palette.focus();
  await page.keyboard.press('ArrowRight');
  await expect(layers).toBeFocused();
  await expect(layers).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-layers')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(palette).toBeFocused();
  await expect(page.locator('#panel-palette')).toBeVisible();
  await page.keyboard.press('End');
  await expect(script).toBeFocused();
  await expect(page.locator('#panel-script')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(canvas).toBeFocused();
  await page.keyboard.press('Home');
  await expect(canvas).toBeFocused();
  await expect(page.locator('#panel-canvas')).toBeVisible();

  // Focus is visible, and the panel itself can be reached with Tab.
  const ring = await canvas.evaluate(el => {
    const style = getComputedStyle(el);
    return { width: style.outlineWidth, style: style.outlineStyle };
  });
  expect(ring.style).not.toBe('none');
  expect(parseFloat(ring.width)).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Tab');
  await expect(page.locator('#panel-canvas')).toBeFocused();

  expect(errors).toEqual([]);
});

test('the navigator tree expands and collapses with the keyboard', async ({ page }) => {
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const licences = page.locator('.tree-view details').nth(1);
  const summary = licences.locator('summary');
  await expect(licences).not.toHaveAttribute('open', '');
  await expect(licences.getByRole('link', { name: '7.css, MIT' })).toBeHidden();

  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(licences).toHaveAttribute('open', '');
  await expect(licences.getByRole('link', { name: '7.css, MIT' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(licences).not.toHaveAttribute('open', '');

  // And by mouse, on the group that starts open.
  const plumbline = page.locator('.tree-view details').first();
  await expect(plumbline).toHaveAttribute('open', '');
  await plumbline.locator('summary').click();
  await expect(plumbline).not.toHaveAttribute('open', '');
});

test('the chrome is the layout, and the panes stack rather than scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'features.html', { waitUntil: 'networkidle' });
  const wide = await page.evaluate(() => {
    const side = document.querySelector('.pane-side')!.getBoundingClientRect();
    const main = document.querySelector('.pane-main')!.getBoundingClientRect();
    return { sideRight: side.right, mainLeft: main.left, sameRow: Math.abs(side.top - main.top) < 2 };
  });
  expect(wide.sameRow).toBe(true);
  expect(wide.sideRight).toBeLessThanOrEqual(wide.mainLeft + 1);

  await page.setViewportSize({ width: 320, height: 800 });
  const narrow = await page.evaluate(() => {
    const side = document.querySelector('.pane-side')!.getBoundingClientRect();
    const main = document.querySelector('.pane-main')!.getBoundingClientRect();
    return { stacked: side.top >= main.bottom - 1, sideWidth: side.width };
  });
  expect(narrow.stacked).toBe(true);
  expect(narrow.sideWidth).toBeLessThanOrEqual(321);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  // The title bar truncates instead of pushing the window open.
  await expect(page.locator('.title-bar-text').first()).toHaveCSS('text-overflow', 'ellipsis');
});

test('monospace appears only where the typing is the subject', async ({ page }) => {
  await page.goto(base + 'features.html', { waitUntil: 'networkidle' });
  const chrome = await page.evaluate(() => {
    const family = (selector: string) => getComputedStyle(document.querySelector(selector)!).fontFamily.toLowerCase();
    return {
      heading: family('h1'),
      nav: family('.site-nav a'),
      body: family('.lead'),
      tab: family('[role="tab"]'),
      console: family('.console-line'),
    };
  });
  expect(chrome.heading).toContain('noto sans');
  expect(chrome.heading).not.toContain('mono');
  expect(chrome.nav).not.toContain('mono');
  expect(chrome.body).not.toContain('mono');
  expect(chrome.tab).not.toContain('mono');
  expect(chrome.console).toContain('jetbrains mono');
  expect(await page.locator('.console-line').count()).toBe(6);

  await page.goto(base + 'versions.html', { waitUntil: 'networkidle' });
  expect((await page.locator('pre.sample').evaluate(el => getComputedStyle(el).fontFamily)).toLowerCase()).toContain('jetbrains mono');
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the console caret holds still and stays visible', async ({ page }) => {
    await page.goto(base + 'features.html', { waitUntil: 'networkidle' });
    const caret = page.locator('.caret');
    expect(await caret.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    expect(await caret.evaluate(el => getComputedStyle(el).visibility)).toBe('visible');
  });
});

test('the headline and the drawn screen stay editable through the native template engine', async ({ page }) => {
  await page.goto(base + 'index.html');
  const result = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-terminal/index.html')).text();
    const initial = editTemplateDocument(html, 'index.html', {});
    const headline = initial.elements.find((e: any) => e.canText && e.text === 'A small editor for small games.');
    const lead = initial.elements.find((e: any) => e.canText && String(e.text).startsWith('Plumbline draws tiles'));
    const image = initial.elements.find((e: any) => e.tag === 'img' && String(e.src).includes('screen-editor'));
    if (!headline || !lead || !image) throw Error('Missing editable elements');
    const edits = {
      ['index.html::' + headline.id + '::text']: 'My own editor.',
      ['index.html::' + image.id + '::alt']: 'My own screen',
    };
    const changed = editTemplateDocument(html, 'index.html', edits);
    return {
      headline: changed.doc.querySelector('h1').textContent,
      alt: changed.doc.querySelector('.hero-figure img').alt,
    };
  });
  expect(result.headline).toBe('My own editor.');
  expect(result.alt).toBe('My own screen');
});
