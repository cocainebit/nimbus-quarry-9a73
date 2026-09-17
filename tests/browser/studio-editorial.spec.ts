import { test, expect } from '@playwright/test';
const address = '/templates/studio-editorial/index.html';
test('editorial adaptation is responsive and its audience, pricing, FAQ and preview controls work', async ({ page }) => {
  const failures: string[] = [], errors: string[] = [], external: string[] = [];
  page.on('response', r => { if (r.status() >= 400) failures.push(r.url()); });
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:5173/')) external.push(r.url()); });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(address, { waitUntil: 'networkidle' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('heading', { name: 'Room for good work. And the people behind it.' })).toBeVisible();
    await page.getByRole('tab', { name: "I'm a client" }).click();
    await expect(page.locator('#client-panel')).toBeVisible();
    await expect(page.locator('#team-panel')).toBeHidden();
    await expect(page.locator('#client-panel img')).toHaveJSProperty('complete', true);
    expect(await page.locator('#client-panel img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await page.getByRole('tab', { name: "I'm on the team" }).click();
    await expect(page.locator('#team-panel')).toBeVisible();
    await page.getByRole('button', { name: /Yearly/ }).click();
    await expect(page.locator('[data-price]')).toHaveText('24');
    await expect(page.locator('[data-billing-note]')).toContainText('$288');
    await page.getByRole('button', { name: 'Monthly', exact: true }).click();
    await expect(page.locator('[data-price]')).toHaveText('30');
    await page.locator('summary').filter({ hasText: 'Will the example pricing charge me?' }).click();
    await expect(page.getByText('No. Pricing is illustrative', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Take a look around' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Requests', exact: true }).click();
    await dialog.getByRole('button', { name: 'Feedback on the first direction' }).click();
    await expect(dialog.locator('#request-detail')).toContainText('The first concept is ready');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    if (width <= 768) {
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await expect(page.getByRole('navigation')).toBeVisible();
      await page.getByRole('navigation').getByRole('link', { name: 'Pricing', exact: true }).click();
      await expect(page.getByRole('navigation')).toBeHidden();
    }
  }
  expect(failures).toEqual([]); expect(errors).toEqual([]); expect(external).toEqual([]);
});

test('editorial hero and product image remain editable through the native template engine', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const path = '/src/source-template-html.ts';
    const { editTemplateDocument } = await import(/* @vite-ignore */ path);
    const html = await (await fetch('/templates/studio-editorial/index.html')).text();
    const initial = editTemplateDocument(html, 'index.html', {});
    const headline = initial.elements.find((e: any) => e.canText && e.text === 'Room for good work.');
    const image = initial.elements.find((e: any) => e.tag === 'img');
    if (!headline || !image) throw Error('Missing editable hero or product screenshot');
    const edits = { ['index.html::' + headline.id + '::text']: 'A clearer way to collaborate.', ['index.html::' + image.id + '::alt']: 'A customized product screenshot' };
    const changed = editTemplateDocument(html, 'index.html', edits);
    return { headline: changed.doc.querySelector('h1').textContent, alt: changed.doc.querySelector('img').alt, scripts: changed.doc.querySelectorAll('script[src]').length };
  });
  expect(result.headline).toContain('A clearer way to collaborate.');
  expect(result.alt).toBe('A customized product screenshot');
  expect(result.scripts).toBe(1);
});
