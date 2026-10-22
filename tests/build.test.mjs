import { test } from "node:test";
import assert from "node:assert/strict";
import { build, root } from "../scripts/build.mjs";
import { money, items, renderSamples } from "../scripts/content.mjs";
import { readFile, readdir, mkdtemp, rm, access } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
const pages = [
  "index",
  "services",
  "pricing",
  "work",
  "about",
  "contact",
  "alankarii",
];
const source = JSON.parse(
  await readFile(join(root, "src/pricing.json"), "utf8"),
);
const html = (out, page) => readFile(join(out, page + ".html"), "utf8");
const temporary = async (fn) => {
  const out = await mkdtemp(join(tmpdir(), "vayrift-build-"));
  try {
    await fn(out);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
};

test("all seven pages use central pricing, navigation, honest labels and safe default gates", async () =>
  temporary(async (out) => {
    await build({ outDir: out, buildDate: "2026-10-22" });
    for (const page of pages) {
      const text = await html(out, page);
      assert.ok(text.includes("VAYRIFT Studio"));
      assert.ok(!text.includes("{{"), page + " has unresolved tokens");
      assert.ok(!/LeadForge|4317/.test(text));
      assert.match(text, /<meta name="robots" content="noindex, nofollow">/);
      assert.ok(
        (text.match(/href="pricing.html"/g) || []).length >= 3,
        page + " must link pricing in desktop, mobile and footer",
      );
      assert.ok(
        !/guarantee|best in|#1|award-winning|testimonial|our clients|trusted by|most popular/i.test(
          text,
        ),
        page + " has prohibited claims",
      );
      assert.ok(!/\b(clinics?|hospitals?|medical)\b/i.test(text));
    }
    const pricing = await html(out, "pricing");
    assert.match(pricing, /DRAFT PRICING, NOT YET APPROVED/);
    assert.match(pricing, /Prices last updated: 2026-10-22/);
    for (const item of items(source)) {
      assert.ok(
        pricing.includes(money(item.amount)),
        item.id + " price missing",
      );
      if (item.quarterly) assert.ok(pricing.includes(money(item.quarterly)));
    }
    assert.ok(pricing.includes("10% off"));
    assert.ok(pricing.includes("50% advance"));
    assert.ok(pricing.includes("advance is refunded"));
    const robots = await readFile(join(out, "robots.txt"), "utf8");
    assert.match(robots, /Disallow: \//);
    await assert.rejects(access(join(out, "sitemap.xml")));
    assert.ok(
      !(await html(out, "about")).includes('class="founder-public-name"'),
    );
    const contact = await html(out, "contact");
    assert.ok(!contact.includes("data-whatsapp"));
    assert.ok(!contact.includes("data-phone"));
    assert.match(contact, /tell us and we will stop/);
    assert.match(contact, /name="consent"/);
    for (const item of items(source))
      assert.ok(contact.includes('value="' + item.id + '"'));
    assert.ok(contact.includes("Under Rs 10,000"));
    const config = JSON.parse(await readFile(join(out, "config.json"), "utf8"));
    assert.equal(config.inquiry_enabled, false);
    assert.equal(config.indexable, false);
    assert.equal(config.whatsapp_number, "");
    assert.deepEqual(config.founders, []);
    const work = await html(out, "work");
    assert.equal((work.match(/<video/g) || []).length, 1);
    assert.match(work, /preload="none"/);
    assert.match(work, /controls playsinline/);
    assert.match(work, /Not a client commission/);
    assert.match(work, /FOUNDER-BUILT WEBSITE/);
    assert.match(work, /https:\/\/alankarii.vercel.app\//);
    for (const file of [
      "property-sample.mp4",
      "property-poster.png",
      "alankarii-website.png",
    ])
      await access(join(out, "assets", file));
    const js = await readFile(join(out, "studio.js"), "utf8");
    assert.ok(!js.includes("/portfolio/api"));
    assert.ok(!js.includes("formResult.innerHTML"));
  }));

test("optional founder, WhatsApp, phone and email values are escaped or omitted without enabling delivery", async () =>
  temporary(async (out) => {
    await build({
      outDir: out,
      brand: {
        founders: ["Controlled <Founder>", { name: "Second & Founder" }],
        whatsapp_number: "+919999999999",
        phone: "+919999999999",
      },
    });
    const about = await html(out, "about");
    assert.match(about, /Controlled &lt;Founder&gt;/);
    assert.match(about, /Second &amp; Founder/);
    const contact = await html(out, "contact");
    assert.match(contact, /https:\/\/wa.me\/919999999999\?text=/);
    assert.match(contact, /data-phone href="tel:\+919999999999"/);
    await build({
      outDir: out,
      brand: {
        contact_email: "",
        whatsapp_number: "",
        phone: "",
        founders: [],
      },
    });
    assert.ok(!(await html(out, "contact")).includes('href="mailto:'));
    assert.ok(
      !(await html(out, "about")).includes('class="founder-public-name"'),
    );
  }));

test("indexing requires all three gates and removes stale sitemap when turned off", async () =>
  temporary(async (out) => {
    for (const brand of [
      { indexable: true, production_url: "" },
      { indexable: true, production_url: "https://studio.example.test" },
      { indexable: false, production_url: "https://studio.example.test" },
    ]) {
      await build({ outDir: out, brand });
      assert.match(
        await readFile(join(out, "robots.txt"), "utf8"),
        /Disallow: \//,
      );
      for (const page of pages)
        assert.match(await html(out, page), /noindex, nofollow/);
    }
    await build({
      outDir: out,
      pricing: { approved: true },
      brand: { indexable: true, production_url: "https://studio.example.test" },
    });
    assert.match(await readFile(join(out, "robots.txt"), "utf8"), /Allow: \//);
    const sitemap = await readFile(join(out, "sitemap.xml"), "utf8");
    for (const page of pages)
      assert.ok(
        sitemap.includes(
          page === "index"
            ? "https://studio.example.test/"
            : "https://studio.example.test/" + page + ".html",
        ),
      );
    for (const page of pages) {
      const text = await html(out, page);
      assert.ok(!text.includes("noindex"));
      assert.match(text, /rel="canonical"/);
      assert.match(text, /property="og:url"/);
      const json = JSON.parse(
        text.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1],
      );
      assert.equal(json["@type"], "LocalBusiness");
      assert.equal(json.areaServed, "Hyderabad");
      assert.deepEqual(json.sameAs, ["https://instagram.com/vayrift"]);
      assert.ok(!("review" in json));
      assert.ok(!("aggregateRating" in json));
    }
    assert.ok(!(await html(out, "pricing")).includes("DRAFT PRICING"));
    await build({ outDir: out });
    await assert.rejects(access(join(out, "sitemap.xml")));
  }));

test("sample sectors are empty-safe, limited to three and restricted to local licensed paths", async () => {
  assert.deepEqual(
    await renderSamples(root, [
      null,
      { sector: "Retail", reels: [] },
      { sector: "Retail", reels: [null, {}] },
    ]),
    { html: "", count: 0 },
  );
  const fixture = {
    title: "Controlled sample",
    label: "Demonstration / not client work",
    src: "assets/property-sample.mp4",
    poster: "assets/property-poster.png",
    description: "Controlled fixture",
  };
  const three = await renderSamples(root, [
    { sector: "Retail", reels: [fixture, fixture, fixture] },
  ]);
  assert.equal(three.count, 3);
  await assert.rejects(
    renderSamples(root, [
      { sector: "Retail", reels: [fixture, fixture, fixture, fixture] },
    ]),
  );
  await assert.rejects(
    renderSamples(root, [
      {
        sector: "Retail",
        reels: [{ ...fixture, src: "https://example.test/file.mp4" }],
      },
    ]),
  );
  await assert.rejects(
    renderSamples(root, [
      {
        sector: "Retail",
        reels: [{ ...fixture, poster: "assets/../secret.png" }],
      },
    ]),
  );
});
