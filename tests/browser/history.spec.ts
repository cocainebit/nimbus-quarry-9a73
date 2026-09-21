import { test, expect, type APIRequestContext } from "./runtime-fixture";
const origin = "http://127.0.0.1:5173";
async function register(
  request: APIRequestContext,
  path: string,
  email: string,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await request.post(path, {
      headers: { Origin: origin },
      data: {
        name: "History tester",
        email,
        password: "History-browser-password-123",
      },
    });
    if (r.status() !== 429) {
      expect(r.ok(), await r.text()).toBeTruthy();
      return;
    }
    if (attempt === 2)
      throw Error(
        "Account registration remained throttled after bounded retries.",
      );
    const seconds = Number(r.headers()["retry-after"]) || 10;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(15, Math.max(10, seconds)) * 1000 + 250),
    );
  }
}
test("inspect and restore project history through the UI, preserve app records, and reload the saved revision", async ({
  page,
}) => {
  test.setTimeout(90000);
  const suffix = Date.now().toString(36),
    original = `History original ${suffix}`,
    edited = `History revised ${suffix}`,
    slug = `history-${suffix}`;
  await register(
    page.request,
    "/api/auth/sign-up/email",
    `history-owner-${suffix}@example.com`,
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Account & server projects" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("button", { name: "Load projects with current session" })
    .click();
  await expect(page.getByText("Server saving enabled")).toBeVisible();
  await page
    .getByRole("button", { name: "Build with editable blocks", exact: true })
    .click();
  await page.getByLabel("Project name", { exact: true }).fill(original);
  await page
    .getByLabel("Website brief", { exact: true })
    .last()
    .fill("A workspace used to inspect and safely restore saved designs.");
  await page
    .getByRole("button", { name: "Create demo website", exact: true })
    .click();
  await expect
    .poll(async () => {
      const rows = await (await page.request.get("/api/projects")).json();
      return rows.find((r: any) => r.document.name === original)?.revision || 0;
    })
    .toBeGreaterThan(0);
  const row = (await (await page.request.get("/api/projects")).json()).find(
    (r: any) => r.document.name === original,
  );
  const projectId = row.document.id,
    restoreRevision = row.revision;
  const collectionResponse = await page.request.post(
    `/api/projects/${projectId}/collections`,
    {
      headers: { Origin: origin },
      data: {
        name: "Saved tasks",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
        ],
        publicRead: false,
        memberCreate: true,
      },
    },
  );
  expect(collectionResponse.status()).toBe(201);
  const collection = await collectionResponse.json();
  await page.getByRole("button", { name: "App backend", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "App backend", exact: true });
  await panel.getByLabel("Site address").fill(slug);
  await panel.getByRole("button", { name: "Publish app", exact: true }).click();
  await expect(
    panel.getByRole("link", { name: "Open published app" }),
  ).toBeVisible();
  await register(
    page.request,
    "/api/member-auth/sign-up/email",
    `history-member-${suffix}@example.com`,
  );
  const join = await page.request.post(`/api/apps/${slug}/join`, {
    headers: { Origin: origin },
    data: {},
  });
  expect(join.ok()).toBeTruthy();
  const recordResponse = await page.request.post(
    `/api/apps/${slug}/collections/${collection.id}/records`,
    {
      headers: { Origin: origin },
      data: { data: { title: "Keep this operational record" } },
    },
  );
  expect(recordResponse.status()).toBe(201);
  const record = await recordResponse.json();
  await panel.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByLabel("Project name", { exact: true }).fill(edited);
  await expect
    .poll(async () => {
      const saved = await (
        await page.request.get(`/api/projects/${projectId}`)
      ).json();
      return saved.document.name;
    })
    .toBe(edited);
  await page.getByRole("button", { name: "App backend", exact: true }).click();
  await expect(
    panel.getByRole("heading", { name: "Project history", exact: true }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: new RegExp(`^Version ${restoreRevision} ·`) })
    .click();
  await expect(
    panel.getByRole("heading", {
      name: `Restore version ${restoreRevision}?`,
      exact: true,
    }),
  ).toBeVisible();
  await panel.getByText("Inspect saved document", { exact: true }).click();
  await expect(panel.locator("pre")).toContainText(original);
  const restoreResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/history/${restoreRevision}/restore`) &&
      r.request().method() === "POST",
  );
  await panel
    .getByRole("button", { name: "Confirm restore", exact: true })
    .click();
  expect((await restoreResponse).status()).toBe(200);
  await expect(
    panel.getByRole("button", { name: "Confirm restore", exact: true }),
  ).not.toBeVisible();
  await panel.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    original,
  );
  const records = await (
    await page.request.get(
      `/api/apps/${slug}/collections/${collection.id}/records`,
    )
  ).json();
  expect(records).toHaveLength(1);
  expect(records[0].id).toBe(record.id);
  expect(records[0].data.title).toBe("Keep this operational record");
  await page.reload();
  await page
    .getByRole("button", { name: `Open ${original}`, exact: true })
    .click();
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    original,
  );
  const final = await (
    await page.request.get(`/api/projects/${projectId}`)
  ).json();
  expect(final.document.name).toBe(original);
  expect(final.revision).toBeGreaterThan(restoreRevision);
});
