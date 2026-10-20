import { test } from "node:test";
import assert from "node:assert/strict";
import { build, root } from "../scripts/build.mjs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
test("production build contains only standalone branding and safe public assets", async () => {
  await build();
  for (const page of ["index", "work", "services", "about", "contact"]) {
    const html = await readFile(join(root, "dist", page + ".html"), "utf8");
    assert.ok(html.includes("VAYRIFT."));
    assert.ok(html.includes("VAYRIFT Studio"));
    assert.ok(html.includes("https://instagram.com/vayrift"));
    assert.ok(!/LeadForge|4317/.test(html));
    assert.ok(!html.includes("vayrift.com"));
    assert.ok(!/\{\{\w+\}\}/.test(html));
  }
  const config = JSON.parse(
    await readFile(join(root, "dist/config.json"), "utf8"),
  );
  assert.equal(config.contact_email, "");
  assert.equal(config.inquiry_enabled, false);
  assert.equal(config.production_url, "");
  assert.deepEqual(config.founders, []);
  const assets = await readdir(join(root, "dist/assets"));
  assert.ok(assets.includes("property-sample.mp4"));
  assert.ok(assets.includes("property-poster.png"));
  const work = await readFile(join(root, "dist/work.html"), "utf8");
  assert.ok(work.includes("assets/property-sample.mp4"));
  assert.ok(assets.includes("aman-design-reference.png"));
  assert.ok(work.includes("https://www.aman.com/"));
  const js = await readFile(join(root, "dist/studio.js"), "utf8");
  assert.ok(!js.includes("/portfolio/api"));
  assert.ok(!js.includes("formResult.innerHTML"));
});
