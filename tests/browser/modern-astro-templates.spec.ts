import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
const templates = JSON.parse(await readFile(new URL('../../shared/source-templates-modern-astro.json', import.meta.url), 'utf8'));

test('modern Astro originals load locally at desktop and phone sizes', async ({ page }) => {
  test.setTimeout(120000);
  for (const template of templates) {
    const failures: string[] = [];
    const runtimeErrors: string[] = [];
    const pageerror = (error: Error) => runtimeErrors.push(error.message);
    const external: string[] = [];
    const response = (r: any) => { if (r.status() >= 400) failures.push(r.url()); };
    const request = (r: any) => { if (!r.url().startsWith('http://127.0.0.1:5173/') && !r.url().startsWith('data:')) external.push(r.url()); };
    page.on('response', response); page.on('request', request); page.on('pageerror', pageerror);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/templates/${template.id}/index.html`, { waitUntil: 'networkidle' });
      await expect(page.locator('body')).not.toBeEmpty();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), template.id).toBe(true);
    }
    expect(failures, template.id).toEqual([]);
    expect(runtimeErrors, template.id).toEqual([]);
    expect(external, template.id).toEqual([]);
    page.off('response', response); page.off('request', request); page.off('pageerror', pageerror);
  }
});

test('modern Moon edits export with actual assets and original framework source', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/');
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(async () => {
    const modulePath = '/src/source-template-html.ts';
    const modelPath = '/src/model.ts';
    const metadataPath = '/shared/source-templates-modern-astro.json';
    const editor = await import(/* @vite-ignore */ modulePath);
    const { demoProject } = await import(/* @vite-ignore */ modelPath);
    const metadata = (await import(/* @vite-ignore */ metadataPath)).default;
    const template = metadata.find((t: any) => t.id === 'modern-moon');
    const html = await (await fetch('/templates/modern-moon/index.html')).text();
    const parsed = editor.editTemplateDocument(html, 'index.html', {}, '');
    const title = parsed.elements.find((e: any) => e.canText && e.text.includes('Build fast'));
    if (!title) throw Error('No editable original hero title');
    const project = demoProject('Moon export test', 'Original cinematic website');
    project.nativeTemplate = { id: template.id, page: 'index.html', edits: { ['index.html::' + title.id + '::text']: 'A launch with character' } };
    await editor.exportSourceTemplate(project, template);
  });
  const download = await downloadPromise;
  const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  expect(strFromU8(files['index.html'])).toContain('A launch with character');
  expect(files['LICENSE']).toBeTruthy();
  const source = unzipSync(files['upstream-source.zip']);
  expect(source['package.json']).toBeTruthy();
  expect(source['src/pages/index.astro']).toBeTruthy();
  expect(source['LICENSE']).toBeTruthy();
  expect(Object.keys(files).some(name => name.startsWith('_astro/') && name.endsWith('.webp'))).toBe(true);
});

test('AstroPaper local search returns articles within its own exported site', async ({ page }) => {
  await page.goto('/templates/modern-astro-paper/search/index.html', { waitUntil: 'networkidle' });
  await page.locator('input[type="text"],input[type="search"]').first().fill('Astro');
  const result = page.locator('.pagefind-ui__result-link').first();
  await expect(result).toBeVisible();
  const target = await result.evaluate((element: HTMLAnchorElement) => element.href);
  expect(target).toContain('/templates/modern-astro-paper/');
  await result.click();
  await expect(page).toHaveURL(/\/templates\/modern-astro-paper\/posts\//);
  await expect(page.locator('main')).toBeVisible();
});
