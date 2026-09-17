import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { sourceTemplates } from "../shared/source-templates.mjs";

test("at least20 original source templates ship their real HTML, assets and license files", async () => {
  assert.ok(sourceTemplates.length >= 20);
  assert.equal(
    new Set(sourceTemplates.map((t) => t.id)).size,
    sourceTemplates.length,
  );
  const hashes = new Set();
  for (const template of sourceTemplates) {
    assert.match(template.sourceUrl, /^https:\/\//);
    assert.ok(template.license);
    assert.ok(template.pages.includes(template.entry));
    assert.ok(
      template.files.some((f) => /license|readme|credits|attribution/i.test(f)),
      `${template.id} attribution missing`,
    );
    const root = resolve("public/templates", template.id);
    for (const file of template.files) {
      assert.ok(!file.includes("..") && !file.startsWith("/"));
      assert.ok(
        (await stat(resolve(root, file))).isFile(),
        `${template.id}/${file}`,
      );
    }
    const html = await readFile(resolve(root, template.entry), "utf8");
    assert.match(html, /<html[\s>]/i);
    assert.match(html, /<(?:link|style)[\s>]/i);
    hashes.add(createHash("sha256").update(html).digest("hex"));
    for (const match of html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/g)) {
      const target = match[1];
      if (/^(?:[a-z]+:|\/\/|#)/i.test(target)) continue;
      const path = target.split(/[?#]/)[0];
      if (!path) continue;
      const targetPath = resolve(root, path);
      const info = await stat(targetPath);
      assert.ok(
        info.isFile() ||
          (info.isDirectory() &&
            (await stat(resolve(targetPath, "index.html"))).isFile()),
        `${template.id} missing ${path}`,
      );
    }
  }
  assert.equal(
    hashes.size,
    sourceTemplates.length,
    "Templates must have distinct original markup",
  );
});
