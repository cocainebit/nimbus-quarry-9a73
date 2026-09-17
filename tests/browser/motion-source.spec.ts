import { test, expect } from '@playwright/test';

test('kinetic source foundation supports keyboard navigation, mobile and reduced motion', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/templates/motion-kinetic-type/index.html');
  await expect(page.locator('body')).not.toHaveClass(/loading/);
  const firstStory = page.locator('.item').first();
  const back = page.getByRole('button', { name: 'Back to projects' });
  await firstStory.focus();
  await page.keyboard.press('Enter');
  await expect(back).toBeEnabled({ timeout: 10000 });
  await expect(page.locator('.article--current')).toHaveCount(1);
  await expect(back).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.article--current')).toHaveCount(0, { timeout: 10000 });
  await expect(firstStory).toBeFocused({ timeout: 10000 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/loading/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await firstStory.click();
  await expect(back).toBeEnabled({ timeout: 2000 });
  await back.click();
  await expect(page.locator('.article--current')).toHaveCount(0, { timeout: 2000 });
  expect(errors).toEqual([]);
});
