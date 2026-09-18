import { test, expect } from '@playwright/test';

const base = '/templates/studio-workshop/';
const pages = [
  'index.html',
  'programme.html',
  'class-spoon-carving.html',
  'space.html',
  'join.html',
  'credits.html',
];
const illustrated = ['index.html', 'class-spoon-carving.html', 'space.html', 'join.html', 'credits.html'];

test('Fettle workshop edition is responsive on every page, draws its own art and resolves its links', async ({ page }) => {
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
  expect(navLinks).toEqual(['index.html', 'programme.html', 'class-spoon-carving.html', 'space.html', 'join.html']);
  for (const href of navLinks) {
    const response = await page.request.get(base + href);
    expect(response.ok(), href).toBeTruthy();
  }

  // Contact is a mailto link with an example address, everywhere it appears.
  await expect(page.getByRole('link', { name: 'Write to us' })).toHaveAttribute('href', 'mailto:hello@example.com');
  await expect(page.locator('footer').getByRole('link', { name: 'hello@example.com' })).toHaveAttribute('href', 'mailto:hello@example.com');
  await expect(page.getByText('illustrative workshop', { exact: false }).first()).toBeVisible();

  // The font is bundled locally and nothing is requested from another host.
  const fontFaces = await page.evaluate(() =>
    Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules);
        } catch {
          return [];
        }
      })
      .filter(rule => rule instanceof CSSFontFaceRule)
      .map(rule => (rule as CSSFontFaceRule).style.getPropertyValue('src')),
  );
  expect(fontFaces.length).toBeGreaterThan(0);
  for (const src of fontFaces) expect(src).toContain('assets/bricolage-grotesque.woff2');

  // Navigation by the header, by a card and by the footer.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Programme' }).click();
  await expect(page).toHaveURL(/programme\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Fourteen sessions');
  await page.locator('.session').first().getByRole('link', { name: 'Spoon carving from a green log' }).click();
  await expect(page).toHaveURL(/class-spoon-carving\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Spoon carving from a green log');
  await page.getByRole('link', { name: 'The space' }).first().click();
  await expect(page).toHaveURL(/space\.html$/);
  await expect(page.locator('.plan img')).toBeVisible();
  await expect(page.locator('.chart img')).toBeVisible();
  await page.locator('footer').getByRole('link', { name: 'Credits and source' }).click();
  await expect(page).toHaveURL(/credits\.html$/);
  await expect(page.getByText('adapted from PaperCSS', { exact: false })).toBeVisible();

  // The complete adapted source ships beside the built pages.
  const archive = await page.request.get(base + 'source.zip');
  expect(archive.ok()).toBeTruthy();
  expect((await archive.body()).subarray(0, 2).toString()).toBe('PK');

  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('the programme filters by level and by evening, with mouse and keyboard, and keeps a live count', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + 'programme.html', { waitUntil: 'networkidle' });

  const sessions = page.locator('.programme .session');
  const count = page.locator('#programme-count');
  expect(await sessions.count()).toBe(14);
  await expect(sessions.filter({ visible: true })).toHaveCount(14);
  await expect(count).toHaveText('Showing all 14 sessions, any level, any day. 71 benches free.');

  // Level, by mouse.
  await page.getByRole('button', { name: 'First time' }).click();
  await expect(sessions.filter({ visible: true })).toHaveCount(6);
  await expect(page.getByRole('button', { name: 'First time' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Any level' })).toHaveAttribute('aria-pressed', 'false');
  await expect(count).toHaveText('Showing 6 of 14 sessions, first time, any day. 32 benches free.');
  await expect(page.locator('.session', { hasText: 'Hand cut dovetails' })).toBeHidden();

  // The two groups narrow together.
  await page.getByRole('button', { name: 'Saturday' }).click();
  await expect(sessions.filter({ visible: true })).toHaveCount(2);
  await expect(count).toHaveText('Showing 2 of 14 sessions, first time, on Saturday. 10 benches free.');
  await expect(page.locator('.session', { hasText: 'Blacksmithing, the first heat' })).toBeVisible();

  // Level, by keyboard: the arrow keys move and choose.
  await page.getByRole('button', { name: 'First time' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Improver' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Improver' })).toHaveAttribute('aria-pressed', 'true');
  await expect(sessions.filter({ visible: true })).toHaveCount(2);
  await expect(count).toHaveText('Showing 2 of 14 sessions, improver, on Saturday. 6 benches free.');

  await page.keyboard.press('End');
  await expect(page.getByRole('button', { name: 'Open bench' })).toBeFocused();
  await expect(sessions.filter({ visible: true })).toHaveCount(1);
  await expect(count).toHaveText('Showing 1 of 14 sessions, open bench, on Saturday. 10 benches free.');

  // Evening, by keyboard, into a pair that matches nothing.
  await page.getByRole('button', { name: 'Saturday' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Thursday' })).toBeFocused();
  await expect(sessions.filter({ visible: true })).toHaveCount(1);
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('button', { name: 'Wednesday' })).toBeFocused();
  await expect(sessions.filter({ visible: true })).toHaveCount(0);
  await expect(count).toHaveText('No sessions match, open bench, on Wednesday.');
  await expect(page.locator('#programme-empty')).toBeVisible();

  // Home returns the evening group to any day, and the level group resets by mouse.
  await page.keyboard.press('Home');
  await expect(page.getByRole('button', { name: 'Any day' })).toBeFocused();
  await expect(sessions.filter({ visible: true })).toHaveCount(3);
  await page.getByRole('button', { name: 'Any level' }).click();
  await expect(sessions.filter({ visible: true })).toHaveCount(14);
  await expect(count).toHaveText('Showing all 14 sessions, any level, any day. 71 benches free.');
  await expect(page.locator('#programme-empty')).toBeHidden();

  // The mobile navigation dialog.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Menu' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await dialog.getByRole('link', { name: 'The space' }).click();
  await expect(page).toHaveURL(/space\.html$/);

  expect(errors).toEqual([]);
});

test('the drawn art is static: the same SVG bytes on every render, and no drawing code in the browser', async ({ page }) => {
  // Rough.js re-rolls its strokes on every render, so this edition runs it once
  // at build time. These files must therefore be identical between two loads.
  const drawn = [
    'assets/mark-fettle.svg',
    'assets/plan.svg',
    'assets/chart-benches.svg',
    'assets/rule.svg',
    'assets/person-nour.svg',
    'assets/figure-wheels.svg',
  ];
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const first: Record<string, string> = {};
  for (const file of drawn) {
    const response = await page.request.get(base + file);
    expect(response.ok(), file).toBeTruthy();
    first[file] = await response.text();
    expect(first[file].startsWith('<svg'), file).toBeTruthy();
  }

  // Reload the page, refetch, and compare.
  await page.reload({ waitUntil: 'networkidle' });
  for (const file of drawn) {
    const again = await (await page.request.get(base + file)).text();
    expect(again, `${file} changed between renders`).toBe(first[file]);
  }

  // The plan and the chart carry no text of their own, so the room names and
  // the figures stay editable HTML on the page.
  expect(first['assets/plan.svg']).not.toContain('<text');
  expect(first['assets/chart-benches.svg']).not.toContain('<text');

  // Nothing on the page draws anything: the only script is the filter and the
  // navigation dialog, and it never mentions Rough.js or a canvas.
  const script = await (await page.request.get(base + 'script.js')).text();
  expect(script).not.toMatch(/rough|canvas|getContext/i);

  // The same drawn SVG is on the page as an image element, not inlined markup
  // rebuilt at run time.
  await page.goto(base + 'space.html', { waitUntil: 'networkidle' });
  const planBox = await page.locator('.plan img').boundingBox();
  await page.reload({ waitUntil: 'networkidle' });
  const planBoxAgain = await page.locator('.plan img').boundingBox();
  expect(planBoxAgain).toEqual(planBox);
});

test('the headline, the drawn art and the session cards stay editable through the native template engine', async ({ page }) => {
  await page.goto(base + 'index.html');
  const home = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-workshop/index.html')).text();
    const initial = editTemplateDocument(html, 'index.html', {});
    const opening = initial.elements.find((e: any) => e.canText && e.text === 'Ten benches.');
    const closing = initial.elements.find((e: any) => e.canText && e.text === 'a week.');
    const image = initial.elements.find((e: any) => e.tag === 'img');
    const tutor = initial.elements.find((e: any) => e.canText && e.text === 'Nour Haddad');
    if (!opening || !closing || !image || !tutor) throw Error('Missing editable front page elements');
    const edits = {
      ['index.html::' + closing.id + '::text']: 'a fortnight.',
      ['index.html::' + image.id + '::alt']: 'Our own bench',
      ['index.html::' + tutor.id + '::text']: 'Someone Else',
    };
    const changed = editTemplateDocument(html, 'index.html', edits);
    return {
      headline: changed.doc.querySelector('h1').textContent,
      alt: changed.doc.querySelector('.hero-figure img').alt,
      tutor: changed.doc.querySelector('.person-name').textContent,
      people: changed.doc.querySelectorAll('.person').length,
    };
  });
  expect(home.headline).toBe('Ten benches.Four eveningsa fortnight.');
  expect(home.alt).toBe('Our own bench');
  expect(home.tutor).toBe('Someone Else');
  expect(home.people).toBe(6);

  const programme = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-workshop/programme.html')).text();
    const initial = editTemplateDocument(html, 'programme.html', {});
    const titles = ['Sharpening, properly', 'Hand cut dovetails', 'Repair cafe, bring anything'].map(title =>
      initial.elements.find((e: any) => e.canText && e.text === title),
    );
    const fee = initial.elements.find((e: any) => e.canText && e.text === '18 pounds, illustrative');
    if (titles.some(t => !t) || !fee) throw Error('Missing editable programme elements');
    const edits = { ['programme.html::' + titles[1]!.id + '::text']: 'Machine cut dovetails' };
    const changed = editTemplateDocument(html, 'programme.html', edits);
    return {
      fifth: changed.doc.querySelectorAll('.session-title')[4].textContent,
      sessions: changed.doc.querySelectorAll('.session').length,
    };
  });
  expect(programme.fifth).toBe('Machine cut dovetails');
  expect(programme.sessions).toBe(14);
});
