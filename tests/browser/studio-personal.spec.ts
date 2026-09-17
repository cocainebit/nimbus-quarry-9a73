import { test, expect } from '@playwright/test';
test('Independent adaptation has responsive pages, functional project filters and mobile navigation', async ({page}) => {
  for (const width of [1440,768,390,320]) {
    await page.setViewportSize({width,height:900});
    for (const file of ['index.html','signal.html','fieldnotes.html','afterhours.html']) {
      await page.goto(`/templates/studio-personal/${file}`);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    }
  }
  await page.goto('/templates/studio-personal/index.html');
  await page.getByRole('button',{name:'Editorial',exact:true}).click();
  await expect(page.locator('.project:visible')).toHaveCount(1);
  await expect(page.locator('.project:visible')).toContainText('Fieldnotes');
  await page.getByRole('button',{name:'Interface',exact:true}).click();
  await expect(page.locator('.project:visible')).toHaveCount(2);
  await page.getByRole('button',{name:'All work',exact:true}).click();
  await expect(page.locator('.project:visible')).toHaveCount(3);
  await page.getByRole('button',{name:'Menu +',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('link',{name:'About ↗'}).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page).toHaveURL(/index.html#about$/);
});
