import { test, expect } from '@playwright/test';

const base = '/templates/studio-counter/';
const pages = ['index.html', 'menu.html', 'wine.html', 'room.html', 'visit.html', 'credits.html'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

test('Carafe is responsive on every page, carries no photographs and resolves its links', async ({ page }) => {
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
      // Nothing photographic: every picture on the site is a drawing made for it.
      const sources = await page.locator('img').evaluateAll(images => images.map(image => (image as HTMLImageElement).getAttribute('src')!));
      for (const src of sources) expect(src, `${file} at ${width}`).toMatch(/^assets\/[a-z-]+\.svg$/);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const navLinks = await page.locator('header nav a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).getAttribute('href')!));
  expect(navLinks).toEqual(['index.html', 'menu.html', 'wine.html', 'room.html', 'visit.html']);
  for (const href of navLinks) {
    const response = await page.request.get(base + href);
    expect(response.ok(), href).toBeTruthy();
  }
  await expect(page.locator('footer').getByRole('link', { name: 'bookings@example.com' })).toHaveAttribute('href', 'mailto:bookings@example.com');
  await expect(page.getByText('The content of this template is illustrative', { exact: false }).first()).toBeVisible();

  await page.locator('footer').getByRole('link', { name: 'Credits and source' }).click();
  await expect(page).toHaveURL(/credits\.html$/);
  await expect(page.getByText('Adapted from AstroWind', { exact: false })).toBeVisible();
  const archive = await page.request.get(base + 'source.zip');
  expect(archive.ok()).toBeTruthy();
  expect((await archive.body()).subarray(0, 2).toString()).toBe('PK');

  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('the menu prices keep one column and stay readable down to 320', async ({ page }) => {
  await page.goto(base + 'menu.html', { waitUntil: 'networkidle' });
  await expect(page.locator('.dish-name')).toHaveCount(27);
  await expect(page.locator('.dish-price')).toHaveCount(27);

  // The prices are money, written the same way throughout so the figures align.
  const prices = await page.locator('.dish-price').allTextContents();
  for (const price of prices) expect(price).toMatch(/^\d+\.\d{2}$/);

  // Every price is marked as a sample value, on the page and not only in the footer.
  await expect(page.getByText('illustrative sample values invented for this template', { exact: false }).first()).toBeVisible();

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const report = await page.evaluate(() => {
      const courses = [...document.querySelectorAll('.course')];
      return courses.map(course => {
        const cells = [...course.querySelectorAll('.dish-price')] as HTMLElement[];
        const edges = cells.map(cell => Math.round(cell.getBoundingClientRect().right * 10) / 10);
        const sizes = cells.map(cell => parseFloat(getComputedStyle(cell).fontSize));
        const rows = [...course.querySelectorAll('.dish-line')] as HTMLElement[];
        // The price never falls below the first line of the name it belongs to.
        const wrapped = rows.filter(row => {
          const name = row.querySelector('.dish-name') as HTMLElement;
          const price = row.querySelector('.dish-price') as HTMLElement;
          return price.getBoundingClientRect().top > name.getBoundingClientRect().bottom;
        }).length;
        return {
          id: course.getAttribute('data-course'),
          spread: Math.max(...edges) - Math.min(...edges),
          smallest: Math.min(...sizes),
          wrapped,
        };
      });
    });
    for (const course of report) {
      expect(course.spread, `${course.id} at ${width}`).toBeLessThanOrEqual(0.5);
      expect(course.smallest, `${course.id} at ${width}`).toBeGreaterThanOrEqual(14);
      expect(course.wrapped, `${course.id} at ${width}`).toBe(0);
    }
  }

  // Tabular figures: two prices of the same length occupy the same width, so the
  // digits stack into a column rather than only the right edges lining up.
  await page.setViewportSize({ width: 1440, height: 1000 });
  const figures = await page.evaluate(() => {
    const price = document.querySelector('.dish-price') as HTMLElement;
    const style = getComputedStyle(price);
    const measure = (text: string) => {
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px';
      probe.style.fontFamily = style.fontFamily;
      probe.style.fontSize = style.fontSize;
      probe.style.fontWeight = style.fontWeight;
      probe.style.fontVariantNumeric = style.fontVariantNumeric;
      probe.style.fontFeatureSettings = style.fontFeatureSettings;
      probe.textContent = text;
      document.body.appendChild(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    };
    return { variant: style.fontVariantNumeric, ones: measure('1111'), zeros: measure('0000'), fours: measure('4744') };
  });
  expect(figures.variant).toContain('tabular-nums');
  expect(Math.abs(figures.ones - figures.zeros)).toBeLessThan(0.1);
  expect(Math.abs(figures.ones - figures.fours)).toBeLessThan(0.1);

  // The leader is drawn, not typed, so it never becomes editable text.
  await expect(page.locator('.dish-leader').first()).toHaveText('');
  const leader = await page.locator('.dish-line').first().evaluate(row => getComputedStyle(row.querySelector('.dish-leader')!).borderBottomStyle);
  expect(leader).toBe('dotted');
});

test('the hours are split by service, keep a closed day and mark today', async ({ page }) => {
  await page.goto(base + 'visit.html', { waitUntil: 'networkidle' });
  const kitchen = page.locator('[data-service="kitchen"]');
  const bar = page.locator('[data-service="bar"]');
  await expect(kitchen.locator('.hours-row')).toHaveCount(5);
  await expect(bar.locator('.hours-row')).toHaveCount(5);
  await expect(kitchen.locator('h3')).toHaveText('Kitchen');
  await expect(bar.locator('h3')).toHaveText('Bar');

  // The kitchen and the bar keep different time, which is the point of two lists.
  const kitchenMidweek = await kitchen.locator('.hours-row').first().locator('.hours-time').textContent();
  const barMidweek = await bar.locator('.hours-row').first().locator('.hours-time').textContent();
  expect(kitchenMidweek).toBe('18.00 to 22.00');
  expect(barMidweek).toBe('17.00 to 23.00');

  // Friday runs two services, and both lists close on the same day.
  await expect(kitchen.locator('.hours-row').nth(1).locator('.hours-time')).toHaveText('12.00 to 14.30, 18.00 to 22.30');
  await expect(kitchen.locator('.hours-row').nth(4).locator('.hours-day')).toHaveText(/Monday/);
  await expect(kitchen.locator('.hours-row').nth(4).locator('.hours-time')).toHaveText('Closed');
  await expect(bar.locator('.hours-row').nth(4).locator('.hours-time')).toHaveText('Closed');
  await expect(kitchen.locator('.closed-line')).toHaveText('Closed all day on Monday');
  await expect(page.getByText('Public holidays', { exact: false })).toBeVisible();

  // One row in each list is today's, taken from the day numbers on the rows.
  const today = DAYS[new Date().getDay()];
  await expect(kitchen.locator('.hours-row[data-today]')).toHaveCount(1);
  await expect(bar.locator('.hours-row[data-today]')).toHaveCount(1);
  const marked = await kitchen.locator('.hours-row[data-today]').getAttribute('data-days');
  expect(marked!.split(' ')).toContain(String(new Date().getDay()));
  await expect(page.locator('[data-today-line]').first()).toHaveText(new RegExp('^Today is ' + today + '\\.'));

  // Times are tabular too, so the column of hours lines up.
  const variant = await kitchen.locator('.hours-time').first().evaluate(cell => getComputedStyle(cell).fontVariantNumeric);
  expect(variant).toContain('tabular-nums');
});

test('the booking enquiry is honest and reaches no service', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173/')) external.push(request.url()); });
  await page.goto(base + 'visit.html', { waitUntil: 'networkidle' });

  const form = page.locator('form[data-enquiry]');
  await expect(form).toHaveCount(1);
  expect(await form.getAttribute('action')).toBeNull();
  await expect(page.getByText('not connected to a reservation system', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Email bookings@example.com' })).toHaveAttribute('href', /^mailto:bookings@example\.com/);

  await page.locator('#enquiry-name').fill('A name');
  await page.locator('#enquiry-people').fill('2');
  await page.getByRole('button', { name: 'Send this enquiry' }).click();
  await expect(page.locator('#enquiry-status')).toHaveText(/Nothing was sent/);
  await expect(page).toHaveURL(/visit\.html$/);
  // The fields keep what was typed, because nothing was submitted anywhere.
  await expect(page.locator('#enquiry-name')).toHaveValue('A name');
  expect(external).toEqual([]);
});

test('navigation works at every width and the menu filter narrows the card', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.locator('header nav').getByRole('link', { name: 'Menu' }).click();
  await expect(page).toHaveURL(/menu\.html$/);
  await expect(page.locator('h1')).toHaveText('The menu');
  await page.locator('header nav').getByRole('link', { name: 'Wine' }).click();
  await expect(page).toHaveURL(/wine\.html$/);
  await page.locator('header nav').getByRole('link', { name: 'The room' }).click();
  await expect(page).toHaveURL(/room\.html$/);
  await expect(page.locator('h1')).toHaveText('The room');
  await page.locator('header nav').getByRole('link', { name: 'Visit' }).click();
  await expect(page).toHaveURL(/visit\.html$/);

  // On a narrow screen the pages hide behind one button, as upstream's header does.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const toggle = page.locator('[data-nav-toggle]');
  await expect(toggle).toHaveText('Pages');
  await expect(page.locator('header nav')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toHaveText('Close');
  await expect(page.locator('header nav')).toBeVisible();
  await page.locator('header nav').getByRole('link', { name: 'Menu' }).click();
  await expect(page).toHaveURL(/menu\.html$/);

  // The filter hides dishes and empties courses, and leaves the wine alone.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'menu.html', { waitUntil: 'networkidle' });
  const dishes = page.locator('[data-diet]');
  await expect(dishes.filter({ visible: true })).toHaveCount(21);
  await expect(page.locator('#menu-status')).toHaveText('Showing all 21 items.');

  await page.getByRole('button', { name: 'Vegetarian' }).click();
  await expect(dishes.filter({ visible: true })).toHaveCount(11);
  await expect(page.locator('#menu-status')).toHaveText('Showing 11 of 21 items.');
  await expect(page.getByRole('button', { name: 'Vegetarian' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'All dishes' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-course="glass"]')).toBeVisible();
  await expect(page.getByText('Potted beef, cornichons')).toBeHidden();

  await page.getByRole('button', { name: 'Vegan' }).focus();
  await page.keyboard.press('Enter');
  await expect(dishes.filter({ visible: true })).toHaveCount(4);
  // Nothing on the sides list is left, so that course goes with it.
  await expect(page.locator('[data-course="sides"] .dish:not([hidden])')).toHaveCount(1);

  await page.getByRole('button', { name: 'All dishes' }).click();
  await expect(dishes.filter({ visible: true })).toHaveCount(21);
});

test('every menu item, price and note is a leaf the native template engine can edit', async ({ page }) => {
  await page.goto(base + 'menu.html');
  const result = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-counter/menu.html')).text();
    const initial = editTemplateDocument(html, 'menu.html', {});

    // Every name, mark, description and price must be selectable on its own.
    const counts = new Map<string, number>();
    for (const element of initial.elements) {
      if (!element.canText) continue;
      counts.set(element.text, (counts.get(element.text) || 0) + 1);
    }
    const missing: string[] = [];
    initial.doc
      .querySelectorAll('.dish-name, .dish-price, .dish-note, .dish-mark, .course-title')
      .forEach((element: Element) => {
        const text = element.textContent || '';
        const left = counts.get(text) || 0;
        if (left < 1) missing.push(text);
        else counts.set(text, left - 1);
      });

    const name = initial.elements.find((e: any) => e.canText && e.text === 'Whole plaice, brown butter, capers');
    const price = initial.elements.find((e: any) => e.canText && e.text === '24.00');
    const note = initial.elements.find((e: any) => e.canText && e.text.startsWith('One fish, one pan'));
    if (!name || !price || !note) throw Error('Missing editable menu elements');

    const changed = editTemplateDocument(html, 'menu.html', {
      ['menu.html::' + name.id + '::text']: 'Whole lemon sole, seaweed butter',
      ['menu.html::' + price.id + '::text']: '26.00',
      ['menu.html::' + note.id + '::text']: 'A sentence of my own about the fish.',
    });
    const row = changed.doc.querySelectorAll('.course[data-course="plates"] .dish')[3];
    return {
      missing,
      dishes: initial.doc.querySelectorAll('.dish-name').length,
      name: row.querySelector('.dish-name').textContent,
      price: row.querySelector('.dish-price').textContent,
      note: row.querySelector('.dish-note').textContent,
    };
  });
  expect(result.missing).toEqual([]);
  expect(result.dishes).toBe(27);
  expect(result.name).toBe('Whole lemon sole, seaweed butter');
  expect(result.price).toBe('26.00');
  expect(result.note).toBe('A sentence of my own about the fish.');

  // The wine list, with two price columns, edits the same way.
  const wine = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-counter/wine.html')).text();
    const initial = editTemplateDocument(html, 'wine.html', {});
    const entry = initial.elements.find((e: any) => e.canText && e.text === 'Gamay, Loire 2023');
    if (!entry) throw Error('Missing editable wine entry');
    const changed = editTemplateDocument(html, 'wine.html', {
      ['wine.html::' + entry.id + '::text']: 'A wine of my own',
    });
    return changed.doc.querySelector('.course[data-course="red"] .dish-name').textContent;
  });
  expect(wine).toBe('A wine of my own');
});
