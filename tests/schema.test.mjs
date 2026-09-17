import test from "node:test";
import assert from "node:assert/strict";
import { briefSchema, generatedSchema } from "../server/schema.mjs";
test("brief validation rejects absent, blank and oversized instructions", () => {
  for (const brief of ["", "tiny", " ".repeat(100), "x".repeat(6001)])
    assert.equal(
      briefSchema.safeParse({ name: "Studio", brief }).success,
      false,
    );
  assert.equal(
    briefSchema.safeParse({
      name: "Studio",
      brief: "A website for a local studio",
    }).success,
    true,
  );
});
test("model output must use known section types and bounded page lists", () => {
  const page = {
    name: "Home",
    sections: [{ kind: "hero", title: "Welcome", body: "Hello" }],
  };
  assert.equal(generatedSchema.safeParse({ pages: [page] }).success, true);
  assert.equal(generatedSchema.safeParse({ pages: [] }).success, false);
  assert.equal(
    generatedSchema.safeParse({ pages: Array(9).fill(page) }).success,
    false,
  );
  assert.equal(
    generatedSchema.safeParse({
      pages: [
        {
          ...page,
          sections: [{ kind: "script", title: "Code", body: "alert(1)" }],
        },
      ],
    }).success,
    false,
  );
});
