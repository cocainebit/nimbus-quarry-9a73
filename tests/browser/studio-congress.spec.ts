import { test, expect } from '@playwright/test';

const base = '/templates/studio-congress/';
const pages = ['index.html', 'programme.html', 'talk-maintenance.html', 'speakers.html', 'venue.html', 'credits.html'];
const illustrated = ['index.html', 'programme.html', 'venue.html'];

test('Plenum congress edition is responsive on every page, draws its own geometry and resolves its links', async ({ page }) => {
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
      // Every page says, in so many words, that its content is invented.
      await expect(page.getByText(/illustrative|invented/i).first()).toBeVisible();
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const navLinks = await page.locator('header nav a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).getAttribute('href')!));
  expect(navLinks).toEqual(['index.html', 'programme.html', 'speakers.html', 'venue.html']);
  for (const href of navLinks) {
    const response = await page.request.get(base + href);
    expect(response.ok(), href).toBeTruthy();
  }
  await expect(page.getByRole('link', { name: 'Write to us' })).toHaveAttribute('href', 'mailto:hello@example.com');
  await expect(page.locator('footer').getByRole('link', { name: 'hello@example.com' })).toHaveAttribute('href', 'mailto:hello@example.com');

  // Navigation: nav to the programme, a session title into the talk page, a room
  // into the venue plan, and the footer into the credits.
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Programme' }).click();
  await expect(page).toHaveURL(/programme\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Thirty sessions');
  await page.locator('.panel:not([hidden])').getByRole('link', { name: 'Maintenance as a public act' }).click();
  await expect(page).toHaveURL(/talk-maintenance\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Maintenance');
  await page.getByRole('link', { name: 'Find the Great Hall on the plan' }).click();
  await expect(page).toHaveURL(/venue\.html#great-hall$/);
  await expect(page.locator('.plan img').first()).toBeVisible();
  await expect(page.locator('#great-hall')).toBeVisible();
  await page.locator('footer').getByRole('link', { name: 'Credits and source' }).click();
  await expect(page).toHaveURL(/credits\.html$/);
  await expect(page.getByText('Adapted from', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('7d7479e486d87c59a15280e20e76c015d26aabb1')).toBeVisible();

  const archive = await page.request.get(base + 'source.zip');
  expect(archive.ok()).toBeTruthy();
  expect((await archive.body()).subarray(0, 2).toString()).toBe('PK');
  await expect(page.getByRole('link', { name: 'Download the source archive' })).toHaveAttribute('href', 'source.zip');
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('the day tabs and the track filter drive the grid with mouse and keyboard', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + 'programme.html', { waitUntil: 'networkidle' });

  const friday = page.locator('#day-1');
  const saturday = page.locator('#day-2');
  const sunday = page.locator('#day-3');
  const status = page.locator('#programme-status');
  const shown = () => page.locator('.panel:not([hidden]) .session:not([hidden])');
  const shownSessions = () => page.locator('.panel:not([hidden]) .session:not([hidden]):not(.t-break)');

  // The first day is open, the other two are not, and the grid is a real grid.
  await expect(friday).toBeVisible();
  await expect(saturday).toBeHidden();
  await expect(sunday).toBeHidden();
  await expect(page.getByRole('tab', { name: 'Friday' })).toHaveAttribute('aria-selected', 'true');
  await expect(status).toHaveText('Friday: showing 12 of 12 sessions, all tracks');
  await expect(shownSessions()).toHaveCount(12);
  expect(await friday.locator('.grid').evaluate(el => getComputedStyle(el).display)).toBe('grid');
  await expect(friday.locator('.room')).toHaveCount(4);
  await expect(friday.locator('.tick').first()).toHaveText('09:00');
  expect(await friday.locator('.tick').first().evaluate(el => getComputedStyle(el).fontVariantNumeric)).toContain('tabular-nums');

  // Switching day by mouse.
  await page.getByRole('tab', { name: 'Sunday' }).click();
  await expect(sunday).toBeVisible();
  await expect(friday).toBeHidden();
  await expect(page.getByRole('tab', { name: 'Sunday' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Friday' })).toHaveAttribute('aria-selected', 'false');
  await expect(status).toHaveText('Sunday: showing 7 of 7 sessions, all tracks');
  await expect(sunday.locator('.room')).toHaveCount(3);

  // Switching day by keyboard, with a roving tabindex.
  await page.getByRole('tab', { name: 'Sunday' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Friday' })).toBeFocused();
  await expect(friday).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Sunday' })).toBeFocused();
  await expect(sunday).toBeVisible();
  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Friday' })).toBeFocused();
  await expect(friday).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Friday' })).toHaveAttribute('tabindex', '0');
  await expect(page.getByRole('tab', { name: 'Sunday' })).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('End');
  await expect(sunday).toBeVisible();
  await page.getByRole('tab', { name: 'Friday' }).click();

  // Filtering the grid by track. Breaks stay put, so the day keeps its shape.
  const programme = page.locator('.programme');
  await expect(programme).toHaveAttribute('data-track', 'all');
  await page.getByRole('button', { name: 'Bench' }).click();
  await expect(programme).toHaveAttribute('data-track', 'bench');
  await expect(page.getByRole('button', { name: 'Bench' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  await expect(status).toHaveText('Friday: showing 3 of 12 sessions, Bench');
  await expect(shownSessions()).toHaveCount(3);
  await expect(shown()).toHaveCount(5);
  await expect(friday.locator('.session', { hasText: 'The cost of a spare part' })).toBeHidden();
  await expect(friday.locator('.session', { hasText: 'Lunch in the courtyard' })).toBeVisible();

  // The filter answers the arrow keys too, and the day carries the filter with it.
  await page.getByRole('button', { name: 'Bench' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Floor' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Floor' })).toHaveAttribute('aria-pressed', 'true');
  await expect(status).toHaveText('Friday: showing 3 of 12 sessions, Floor');
  await page.getByRole('tab', { name: 'Saturday' }).click();
  await expect(programme).toHaveAttribute('data-track', 'floor');
  await expect(status).toHaveText('Saturday: showing 2 of 11 sessions, Floor');
  await expect(shownSessions()).toHaveCount(2);
  await page.getByRole('button', { name: 'All' }).click();
  await expect(status).toHaveText('Saturday: showing 11 of 11 sessions, all tracks');
  await expect(shownSessions()).toHaveCount(11);

  // The grid stays readable at 390: one chronological column, every session
  // showing its time, its room and its track, and nothing clipped.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('tab', { name: 'Friday' }).click();
  const first = friday.locator('.session').first();
  await expect(first.locator('.session-time')).toHaveText(/09:15to10:00/);
  await expect(first.locator('.session-room')).toBeVisible();
  await expect(first.locator('.session-room')).toHaveText('Great Hall');
  expect(await friday.locator('.grid').evaluate(el => getComputedStyle(el).display)).toBe('flex');
  const order = await friday.locator('.session .time-from').allTextContents();
  expect(order).toEqual([...order].sort());
  const clipped = await friday.evaluate(panel =>
    Array.from(panel.querySelectorAll('.session'))
      .filter(el => el.scrollHeight > el.clientHeight + 1)
      .map(el => el.querySelector('.session-title')!.textContent),
  );
  expect(clipped).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);

  // The mobile navigation dialog.
  await page.getByRole('button', { name: 'Menu' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await dialog.getByRole('link', { name: 'Speakers' }).click();
  await expect(page).toHaveURL(/speakers\.html$/);
  expect(errors).toEqual([]);
});

test('the headline, the drawn marks and the grid sessions stay editable through the native template engine', async ({ page }) => {
  await page.goto(base + 'index.html');
  const home = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-congress/index.html')).text();
    const initial = editTemplateDocument(html, 'index.html', {});
    const opening = initial.elements.find((e: any) => e.canText && e.text === 'Three days');
    const closing = initial.elements.find((e: any) => e.canText && e.text === 'that must keep working.');
    const image = initial.elements.find((e: any) => e.tag === 'img');
    const lede = initial.elements.find((e: any) => e.canText && e.text.startsWith('Plenum is an invented congress'));
    if (!opening || !closing || !image || !lede) throw Error('Missing editable masthead elements');
    const edits = {
      ['index.html::' + closing.id + '::text']: 'that keep a city up.',
      ['index.html::' + image.id + '::alt']: 'Our own schedule drawing',
    };
    const changed = editTemplateDocument(html, 'index.html', edits);
    return {
      headline: changed.doc.querySelector('h1').textContent,
      alt: changed.doc.querySelector('.masthead-figure img').alt,
    };
  });
  expect(home.headline).toBe('Three daysabout the thingsthat keep a city up.');
  expect(home.alt).toBe('Our own schedule drawing');

  const programme = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-congress/programme.html')).text();
    const initial = editTemplateDocument(html, 'programme.html', {});
    const titles = ['Opening the doors', 'The cost of a spare part', 'Closing assembly'].map(title =>
      initial.elements.find((e: any) => e.canText && e.text === title),
    );
    const time = initial.elements.find((e: any) => e.canText && e.text === '09:15');
    const room = initial.elements.find((e: any) => e.canText && e.text === 'Turbine Room');
    const day = initial.elements.find((e: any) => e.canText && e.text === 'Saturday');
    if (titles.some(t => !t) || !time || !room || !day) throw Error('Missing editable programme elements');
    const edits = { ['programme.html::' + titles[0]!.id + '::text']: 'Opening the gates' };
    const changed = editTemplateDocument(html, 'programme.html', edits);
    return {
      first: changed.doc.querySelector('#day-1 .session .session-title').textContent,
      sessions: changed.doc.querySelectorAll('.session').length,
      days: changed.doc.querySelectorAll('[role="tabpanel"]').length,
    };
  });
  expect(programme.first).toBe('Opening the gates');
  expect(programme.sessions).toBe(35);
  expect(programme.days).toBe(3);
});
