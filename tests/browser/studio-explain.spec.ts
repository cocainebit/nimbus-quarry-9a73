import { test, expect } from '@playwright/test';

const base = '/templates/studio-explain/';
const pages = ['index.html', 'explainer.html', 'model.html', 'notes.html', 'about.html'];

test('Threshold is responsive on every page, loads nothing remote and resolves its links', async ({ page }) => {
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
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  const navLinks = await page.locator('header nav a').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).getAttribute('href')!));
  expect(navLinks).toEqual(pages);
  for (const href of navLinks) {
    const response = await page.request.get(base + href);
    expect(response.ok(), href).toBeTruthy();
  }
  // The only pictures anywhere are the two CC0 drawings from ncase/trust.
  const sources = await page.locator('img').evaluateAll(images => images.map(image => (image as HTMLImageElement).getAttribute('src')!));
  expect(new Set(sources).size).toBeLessThanOrEqual(2);
  await expect(page.locator('footer').getByRole('link', { name: 'hello@example.com' })).toHaveAttribute('href', 'mailto:hello@example.com');
  await expect(page.getByText('Everything on this site is illustrative', { exact: false })).toBeVisible();
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('navigation reaches the explainer, the numbers, the notes and the about page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Read the explainer' }).click();
  await expect(page).toHaveURL(/explainer\.html$/);
  await expect(page.locator('h1')).toHaveText('The last ten percent');

  await page.locator('header nav').getByRole('link', { name: 'The numbers' }).click();
  await expect(page).toHaveURL(/model\.html$/);
  await expect(page.locator('h1')).toHaveText('Everything the figures are made of');
  // The numbers page states the model rather than hiding it in the code.
  await expect(page.locator('.rows dt', { hasText: 'minutesPerVisit' })).toBeVisible();
  await expect(page.locator('.rows dt', { hasText: 'overrunMinutes' })).toBeVisible();

  await page.locator('header nav').getByRole('link', { name: 'Notes and sources' }).click();
  await expect(page).toHaveURL(/notes\.html$/);
  await expect(page.getByText('No study is cited here, on purpose', { exact: false })).toBeVisible();
  await expect(page.getByText('Creative Commons Zero', { exact: false }).first()).toBeVisible();

  await page.locator('header nav').getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/about\.html$/);
  await expect(page.getByText('Threshold does not exist', { exact: false })).toBeVisible();

  // The chapter list on the front page opens the explainer at that chapter.
  await page.goto(base + 'index.html', { waitUntil: 'networkidle' });
  await page.locator('.contents').getByRole('link', { name: 'A morning, slot by slot' }).click();
  await expect(page).toHaveURL(/explainer\.html#c3$/);
  await expect(page.locator('#c3 h2')).toHaveText('A morning, slot by slot');
});

test('figure one works with the mouse and with the keyboard, and says what it shows', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'explainer.html', { waitUntil: 'networkidle' });

  const slider = page.locator('#counter-input');
  const summary = page.locator('#counter-summary');
  const marker = page.locator('#counter-marker-dot');

  await expect(slider).toHaveValue('70');
  await expect(summary).toContainText('the average person waits 28 minutes');
  await expect(slider).toHaveAttribute('aria-valuetext', /70 out of 100 booked\. Average wait 28 minutes/);
  await expect(page.locator('#counter-wait')).toHaveText('28 minutes');
  // One drawn person per person waiting, and the queue is two deep at 70.
  await expect(page.locator('#figure-counter [data-peep]:not([hidden])')).toHaveCount(2);
  const markerAt70 = await marker.getAttribute('x');

  // By mouse: dragging the slider to the far end.
  await slider.evaluate((el: HTMLInputElement) => {
    el.value = '90';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(summary).toContainText('the average person waits 108 minutes');
  await expect(page.locator('#counter-load')).toHaveText('90 of 100');
  await expect(page.locator('#figure-counter [data-peep]:not([hidden])')).toHaveCount(8);
  await expect(page.locator('#queue-caption')).toHaveText('Waiting: about 8 people');
  expect(await marker.getAttribute('x')).not.toBe(markerAt70);

  // By keyboard: the arrow keys move it and everything follows.
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('91');
  await expect(summary).toContainText('91 minutes of every 100 already booked');
  await expect(slider).toHaveAttribute('aria-valuetext', /^91 out of 100 booked/);
  await page.keyboard.press('Home');
  await expect(slider).toHaveValue('40');
  await expect(page.locator('#counter-wait')).toHaveText('8 minutes');
  // At 40 the model rounds the queue to nobody, and the sentence says so in words.
  await expect(page.locator('#figure-counter [data-peep]:not([hidden])')).toHaveCount(0);
  await expect(summary).toContainText('the queue is usually empty');
  await expect(page.locator('#queue-caption')).toHaveText('Waiting: usually nobody');
  expect(errors).toEqual([]);
});

test('figure two steps through the morning by mouse and by keyboard, and keeps a running tally', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'explainer.html', { waitUntil: 'networkidle' });

  const summary = page.locator('#morning-summary');
  const timeline = page.locator('#morning-timeline');
  await expect(summary).toContainText('Slot 1 of 12, planned for 08:00');
  await expect(page.locator('#morning-waited')).toHaveText('0 minutes');
  await expect(timeline).toHaveAttribute('data-mode', 'packed');

  // By mouse.
  await page.getByRole('button', { name: 'Forward one slot' }).click();
  await expect(summary).toContainText('Slot 2 of 12, planned for 08:20');
  await page.getByRole('button', { name: 'Back one slot' }).click();
  await expect(summary).toContainText('Slot 1 of 12');

  // By keyboard, from the button.
  await page.getByRole('button', { name: 'Forward one slot' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(summary).toContainText('Slot 3 of 12');

  // By keyboard, from the drawing itself.
  await timeline.focus();
  await page.keyboard.press('ArrowRight');
  await expect(summary).toContainText('Slot 4 of 12, planned for 09:00');
  await expect(summary).toContainText('waiting 5 minutes');
  await expect(page.locator('#morning-waited')).toHaveText('10 minutes');
  await page.keyboard.press('End');
  await expect(summary).toContainText('Slot 12 of 12');
  await expect(page.locator('#morning-people')).toHaveText('12');
  await expect(page.locator('#morning-waited')).toHaveText('275 minutes');
  await expect(page.locator('#morning-longest')).toHaveText('50 minutes');

  // Keeping a slot empty changes the model, the drawing and the tally.
  const packedX = await page.locator('[data-actual-slot="10"]').getAttribute('x');
  await page.getByRole('button', { name: 'One slot in 3 kept empty' }).click();
  await expect(timeline).toHaveAttribute('data-mode', 'keep');
  await expect(page.getByRole('button', { name: 'One slot in 3 kept empty' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Every slot booked' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#morning-people')).toHaveText('8');
  await expect(page.locator('#morning-waited')).toHaveText('35 minutes');
  await expect(page.locator('#morning-longest')).toHaveText('15 minutes');
  await expect(page.locator('[data-actual-slot="11"]')).toHaveAttribute('data-free', 'true');
  expect(await page.locator('[data-actual-slot="10"]').getAttribute('x')).not.toBe(packedX);

  await page.keyboard.press('Home');
  await expect(summary).toContainText('Slot 1 of 12');
  expect(errors).toEqual([]);
});

test('the text drives figure one while reading, until the reader takes it over', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'explainer.html', { waitUntil: 'networkidle' });
  const slider = page.locator('#counter-input');
  const figure = page.locator('#figure-counter');

  const centre = (load: string) => page.locator(`[data-step-load="${load}"]`)
    .evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior }));

  await centre('90');
  await expect(slider).toHaveValue('90');
  await expect(figure).toHaveAttribute('data-annotation', 'off');

  await centre('95');
  await expect(slider).toHaveValue('95');
  await expect(figure).toHaveAttribute('data-annotation', 'on');
  await expect(page.locator('#counter-wait')).toHaveText('228 minutes');

  // Once the reader moves it, scrolling leaves it alone.
  await slider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveValue('94');
  await centre('70');
  await page.waitForTimeout(400);
  await expect(slider).toHaveValue('94');
});

test('the argument survives with motion switched off, and with no JavaScript at all', async ({ browser }) => {
  const still = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await still.newPage();
  await page.goto(base + 'explainer.html', { waitUntil: 'networkidle' });

  // Nothing follows the scroll any more.
  await expect(page.locator('#counter-input')).toHaveValue('70');
  await page.locator('#c5').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await expect(page.locator('#counter-input')).toHaveValue('70');
  expect(await page.locator('.scrolly-figure').evaluate(el => getComputedStyle(el).position)).toBe('static');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  // The annotation is simply drawn rather than faded in when its step arrives.
  expect(await page.locator('.plot-note').evaluate(el => getComputedStyle(el).opacity)).toBe('1');

  // Both figures still work.
  await page.locator('#counter-input').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#counter-summary')).toContainText('71 minutes of every 100 already booked');
  await page.getByRole('button', { name: 'Forward one slot' }).click();
  await expect(page.locator('#morning-summary')).toContainText('Slot 2 of 12');

  // And every step of the argument carries its number in the running text.
  await expect(page.locator('[data-step-load="90"]')).toContainText('At 90 the wait is 108 minutes');
  await expect(page.locator('[data-step-load="95"]')).toContainText('At 95 the wait is 228 minutes');
  await still.close();

  const quiet = await browser.newContext({ viewport: { width: 1440, height: 1000 }, javaScriptEnabled: false });
  const plain = await quiet.newPage();
  await plain.goto(base + 'explainer.html', { waitUntil: 'load' });
  // The curve, the queue, the timeline and both summaries are in the HTML.
  expect((await plain.locator('#counter-curve').getAttribute('d'))!.length).toBeGreaterThan(500);
  await expect(plain.locator('#counter-summary')).toContainText('the average person waits 28 minutes');
  await expect(plain.locator('#morning-summary')).toContainText('Slot 1 of 12');
  await expect(plain.locator('#figure-counter [data-peep]:not([hidden])')).toHaveCount(2);
  await expect(plain.locator('[data-actual-slot]')).toHaveCount(12);
  await expect(plain.locator('[data-step-load="95"]')).toContainText('228 minutes');
  await quiet.close();
});

test('the source archive, the licences and the provenance ship beside the pages', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + 'notes.html', { waitUntil: 'networkidle' });
  await expect(page.getByRole('link', { name: 'Download the complete source' })).toHaveAttribute('href', 'source.zip');

  const archive = await page.request.get(base + 'source.zip');
  expect(archive.ok()).toBeTruthy();
  expect((await archive.body()).subarray(0, 2).toString()).toBe('PK');

  for (const licence of [
    'licenses/ncase-trust-CC0.txt',
    'licenses/roadtolarissa-MIT.txt',
    'licenses/fraunces-OFL.txt',
    'licenses/newsreader-OFL.txt',
  ]) {
    const response = await page.request.get(base + licence);
    expect(response.ok(), licence).toBeTruthy();
  }

  const provenance = await (await page.request.get(base + 'SOURCE.json')).json();
  expect(provenance.adaptedFrom.map((entry: any) => entry.license)).toEqual(['CC0 1.0 Universal', 'MIT']);
  // Both drawn people are recorded with the file and frame they came from.
  expect(provenance.images).toHaveLength(2);
  for (const image of provenance.images) {
    expect(image.license).toBe('CC0 1.0 Universal');
    expect(image.source).toContain('splash_peep.png');
  }
});

test('the headline, a chapter and a figure summary stay editable through the native template engine', async ({ page }) => {
  await page.goto(base + 'explainer.html');
  const result = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-explain/explainer.html')).text();
    const initial = editTemplateDocument(html, 'explainer.html', {});
    const title = initial.elements.find((e: any) => e.canText && e.text === 'The last ten percent');
    const lede = initial.elements.find((e: any) => e.canText && e.text.startsWith('Waiting does not grow in step'));
    const chapter = initial.elements.find((e: any) => e.canText && e.text === 'Busy is not the same as full');
    const summary = initial.elements.find((e: any) => e.canText && e.text.startsWith('With 70 minutes of every 100'));
    const note = initial.elements.find((e: any) => e.canText && e.text.startsWith('Read this first'));
    if (!title || !lede || !chapter || !summary || !note) throw Error('Missing editable elements');
    const changed = editTemplateDocument(html, 'explainer.html', {
      ['explainer.html::' + title.id + '::text']: 'Why our Tuesdays run late',
      ['explainer.html::' + summary.id + '::text']: 'A sentence of my own about my own counter.',
    });
    return {
      title: changed.doc.querySelector('h1').textContent,
      summary: changed.doc.querySelector('#counter-summary').textContent,
    };
  });
  expect(result.title).toBe('Why our Tuesdays run late');
  expect(result.summary).toBe('A sentence of my own about my own counter.');
});
