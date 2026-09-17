import { chromium } from "@playwright/test";
import { sourceTemplates } from "../shared/source-templates.mjs";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  for (const template of sourceTemplates) {
    await page.goto(
      `http://127.0.0.1:5173/templates/${template.id}/${template.entry}`,
      { waitUntil: "networkidle" },
    );
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      document.body.classList.remove("is-preload", "is-loading");
    });
    await mkdir(`public/templates/${template.id}`, { recursive: true });
    await page.screenshot({
      path: `public/templates/${template.id}/plotform-preview.jpg`,
      type: "jpeg",
      quality: 82,
    });
    console.log(`Captured ${template.id}`);
  }
} finally {
  await browser.close();
}
