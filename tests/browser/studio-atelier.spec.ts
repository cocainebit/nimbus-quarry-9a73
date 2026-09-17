import { test, expect } from '@playwright/test';

test('Atelier source adaptation has responsive imagery, working case studies and accessible services', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/templates/studio-atelier/index.html');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Independent ideas.');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const image = page.locator('.project-image img').first();
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    const dimensions = await image.evaluate(img => ({ width: img.clientWidth, height: img.clientHeight, loaded: (img as HTMLImageElement).naturalWidth }));
    expect(dimensions.loaded).toBeGreaterThan(0);
    expect(dimensions.width / dimensions.height).toBeCloseTo(1.5, 1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const editing = await page.evaluate(async () => {
    // Exercise the same DOM editor as the product; nested italic text must be
    // editable independently without flattening the headline's composition.
    const { editTemplateDocument } = await import('/src/source-template-html.ts');
    const html = await (await fetch('/templates/studio-atelier/index.html')).text();
    const initial = editTemplateDocument(html, 'index.html', {});
    const parts = ['Independent ideas.', 'Distinct', 'identities.'];
    const selectable = parts.every(text => initial.elements.some(element => element.canText && element.text === text));
    const identity = initial.elements.find(element => element.text === 'identities.')!;
    const changed = editTemplateDocument(html, 'index.html', { [`index.html::${identity.id}::text`]: 'experiences.' });
    return { selectable, italic: changed.doc.querySelector('.hero h1 em')?.textContent };
  });
  expect(editing).toEqual({ selectable: true, italic: 'experiences.' });
  await page.getByText('Find the direction', { exact: false }).click();
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
  await expect(page.getByText('Positioning, naming and creative strategy.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Explore Northstar', exact: true }).click();
  await expect(page).toHaveURL(/northstar\.html$/);
  for (const name of ['Northstar', 'Altitude', 'Fieldwork']) {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await expect(page.locator('.case-cover img')).toBeVisible();
    await page.locator('.next-project a').click();
  }
  await page.getByRole('link', { name: 'Selected work', exact: false }).click();
  await expect(page).toHaveURL(/index\.html#work$/);
  await expect(page.getByRole('link', { name: 'Get in touch', exact: false })).toHaveAttribute('href', 'mailto:hello@example.com');
  await page.getByRole('link', { name: 'Template & image credits' }).click();
  await expect(page.getByText('Atelier is a Plotform-authored adaptation', { exact: false })).toBeVisible();
  const sourceResponse = await page.request.get('/templates/studio-atelier/template-source.zip');
  expect(sourceResponse.ok()).toBeTruthy();
  expect((await sourceResponse.body()).subarray(0, 2).toString()).toBe('PK');
  expect(errors).toEqual([]);
});
