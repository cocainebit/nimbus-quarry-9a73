import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const metadata = JSON.parse(
  fs.readFileSync(
    new URL("../shared/source-templates-bootstrap.json", import.meta.url),
    "utf8",
  ),
);
const root = path.resolve("public/templates");
const decode = (s) => s.replaceAll("&amp;", "&");
function checkReference(template, file, ref) {
  const value = decode(ref.trim().replace(/^['"]|['"]$/g, ""));
  if (/^(data:|#|mailto:|tel:)/.test(value)) return;
  assert.ok(
    !/^https?:\/\//.test(value),
    `${template.id}/${file} has remote runtime asset ${value}`,
  );
  const clean = decodeURIComponent(value.split(/[?#]/)[0]);
  if (!clean) return;
  const resolved = path.resolve(root, template.id, path.dirname(file), clean);
  assert.ok(resolved.startsWith(path.join(root, template.id) + path.sep));
  assert.ok(
    fs.existsSync(resolved),
    `${template.id}/${file}: missing ${clean}`,
  );
}
test("ten pinned official Bootstrap templates retain complete dist assets and licenses", () => {
  assert.equal(metadata.length, 10);
  assert.equal(new Set(metadata.map((t) => t.commit)).size, 10);
  for (const template of metadata) {
    assert.match(
      template.sourceUrl,
      /^https:\/\/github.com\/StartBootstrap\/startbootstrap-/,
    );
    assert.match(template.commit, /^[a-f0-9]{40}$/);
    assert.equal(template.license, "MIT");
    assert.ok(template.files.includes("LICENSE"));
    assert.ok(template.files.includes("index.html"));
    assert.ok(template.files.includes("VENDOR-NOTES.md"));
    assert.match(
      fs.readFileSync(path.join(root, template.id, "LICENSE"), "utf8"),
      /MIT/,
    );
    for (const file of template.files) {
      assert.ok(!file.startsWith("/") && !file.includes(".."));
      assert.ok(fs.statSync(path.join(root, template.id, file)).isFile());
    }
  }
});
test("all vendored HTML and CSS runtime references resolve locally including fonts and scripts", () => {
  for (const template of metadata)
    for (const file of template.files) {
      if (file.endsWith(".html")) {
        const html = fs.readFileSync(
          path.join(root, template.id, file),
          "utf8",
        );
        for (const tag of html.matchAll(
          /<(?:script|link|img|source|iframe)\b[^>]*>/gi,
        ))
          for (const attr of tag[0].matchAll(/(?:src|href)="([^"]+)"/gi))
            checkReference(template, file, attr[1]);
        assert.ok(
          !html.includes(
            'src="https://cdn.startbootstrap.com/sb-forms-latest.js"',
          ),
        );
      }
      if (file.endsWith(".css")) {
        const css = fs.readFileSync(path.join(root, template.id, file), "utf8");
        for (const match of css.matchAll(/url\(([^)]+)\)/g))
          checkReference(template, file, match[1]);
      }
    }
});
