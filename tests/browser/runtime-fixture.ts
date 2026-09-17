import { test as base, expect } from "@playwright/test";
// These flows intentionally exercise the same live server/IP with production
// throttles enabled. Give each account-heavy flow its own rate-limit window.
let previousStart = Date.now();
export const test = base.extend<{ rateLimitWindow: void }>({
  rateLimitWindow: [
    async ({}, use) => {
      const remaining = Math.max(0, 60000 - (Date.now() - previousStart));
      if (remaining)
        await new Promise((resolve) => setTimeout(resolve, remaining));
      previousStart = Date.now();
      await use();
    },
    { auto: true, timeout: 65000 },
  ],
});
export { expect };
export type { Page } from "@playwright/test";
