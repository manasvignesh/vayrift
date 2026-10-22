import {renderFounders} from './about-content.mjs';
import {
  escape as htmlEscape,
  money,
  items,
  pricingContent,
  renderSamples,
  discoveryHead,
} from "./content.mjs";
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
  unlink,
} from "node:fs/promises";
import { resolve, join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export async function build({
  localMedia = false,
  brand: brandOverride,
  pricing: pricingOverride,
  outDir,
  buildDate = new Date().toISOString().slice(0, 10),
} = {}) {
  const brand = {
    ...JSON.parse(await readFile(join(root, "brand.json"), "utf8")),
    ...brandOverride,
  };
  const pricing = {
    ...JSON.parse(await readFile(join(root, "src/pricing.json"), "utf8")),
    ...pricingOverride,
  };
  const samples = await renderSamples(
    root,
    JSON.parse(await readFile(join(root, "src/samples.json"), "utf8")),
  );
  if (typeof pricing.approved !== "boolean")
    throw Error("pricing.approved must be boolean");
  for (const item of items(pricing)) {
    if (
      !Number.isInteger(item.amount) ||
      item.amount < 0 ||
      (item.quarterly !== undefined &&
        (!Number.isInteger(item.quarterly) || item.quarterly < 0))
    )
      throw Error("Invalid price");
  }
  for (const key of ["whatsapp_number", "phone"]) {
    if (
      brand[key] &&
      (!/^\+?[0-9 ()-]{7,22}$/.test(brand[key]) ||
        !/^[0-9]{7,15}$/.test(brand[key].replace(/\D/g, "")))
    )
      throw Error("Invalid public phone");
  }
  const founderContent = await renderFounders(root, brand.founders);
  const tokens = {
    ...brand,
    pilot_price: money(pricing.pilot.amount),
    starter_price: money(pricing.monthly[0].amount),
    launch_price: money(pricing.websites[0].amount),
    pricing_label: pricing.approved ? "pricing" : "draft pricing",
  };
  for (const key of [
    "agency_name",
    "display_name",
    "supporting_label",
    "tagline",
    "location",
    "instagram",
  ])
    if (typeof brand[key] !== "string" || !brand[key].trim())
      throw Error("Missing branding: " + key);
  if (
    brand.contact_email &&
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(brand.contact_email)
  )
    throw Error("Invalid public email");
  if (new URL(brand.instagram).protocol !== "https:")
    throw Error("Instagram must use HTTPS");
  if (
    brand.production_url &&
    (new URL(brand.production_url).protocol !== "https:" ||
      new URL(brand.production_url).username ||
      new URL(brand.production_url).password ||
      new URL(brand.production_url).search ||
      new URL(brand.production_url).hash)
  )
    throw Error("Production URL must be verified HTTPS");
  if (
    brand.inquiry_enabled &&
    (!brand.contact_email || !brand.turnstile_site_key)
  )
    throw Error("Delivery needs a real email and Turnstile site key");
  const out = outDir || join(root, "dist");
  await mkdir(out, { recursive: true });
  const escape = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  const hasMedia = true;
  for (const file of await readdir(join(root, "src"), {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!file.isFile()) continue;
    const src = join(file.parentPath, file.name),
      rel = relative(join(root, "src"), src),
      dest = join(out, rel);
    await mkdir(dirname(dest), { recursive: true });
    let text = /\.(mp4|png|jpe?g|webp)$/i.test(rel)
      ? ""
      : await readFile(src, "utf8");
    text = text
      .replace("{{founders_content}}", founderContent)
      .replace("{{pricing_content}}", pricingContent(pricing, brand, buildDate))
      .replace("{{sample_reels}}", samples.html)
      .replace(
        "{{service_options}}",
        items(pricing)
          .map(
            (x) =>
              '<option value="' +
              htmlEscape(x.id) +
              '">' +
              htmlEscape(x.name) +
              " — " +
              money(x.amount) +
              (pricing.monthly.some((m) => m.id === x.id) ||
              x.id === pricing.care.id
                ? " / month"
                : "") +
              "</option>",
          )
          .join("") +
          '<option value="custom">Custom production scope</option><option value="general">General inquiry</option>',
      );
    text = text.replace(/\{\{([a-z_]+)\}\}/g, (_, key) => {
      if (!(key in tokens)) throw Error("Unknown brand token " + key);
      return escape(tokens[key]);
    });
    if (rel.endsWith(".html")) {
      text = text.replace(
        /<p class="founder-public-name" data-founder-name="(\d+)"><\/p>/g,
        (_, i) => {
          const founder = brand.founders?.[Number(i)];
          if (
            !(
              typeof founder === "string" ? founder : founder?.name || ""
            ).trim()
          )
            return "";
          return (
            '<p class="founder-public-name">' +
            escape(
              typeof founder === "string" ? founder : founder?.name || "",
            ) +
            "</p>"
          );
        },
      );
      if (!hasMedia)
        text = text.replace(
          /<video\b[^>]*>[\s\S]*?<\/video>/g,
          '<div class="media-unavailable" role="note"><h3>Property film demonstration</h3><p>The supplied AI-generated video is available in the owner’s local review copy. It is excluded from this repository pending redistribution permission. No completed client commission is claimed.</p></div>',
        );
      text = text
        .replace(/<meta\s+name="robots"[^>]*>/gi, "")
        .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
        .replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, "");
      text = text.replace(
        "</head>",
        discoveryHead(brand, pricing, rel).html +
          '<link rel="stylesheet" href="offers.css"><script src="offers.js" defer></script><link rel="stylesheet" href="polish.css"><script src="polish.js" defer></script><link rel="stylesheet" href="live-preview.css"><script src="live-preview.js" defer></script></head>',
      );
      if (!brand.contact_email)
        text = text.replace(
          /<a\b[^>]*href="mailto:[^"]*"[^>]*>[\s\S]*?<\/a>/g,
          "",
        );
      if (rel === "contact.html") {
        const digits = String(brand.whatsapp_number || "").replace(/\D/g, "");
        const contactLinks =
          (digits
            ? '<a class="btn btn-secondary" data-whatsapp href="https://wa.me/' +
              digits +
              "?text=" +
              encodeURIComponent(
                "Hi VAYRIFT, I'd like to know more about our services",
              ) +
              '">Ask on WhatsApp ↗</a>'
            : "") +
          (brand.phone
            ? '<a data-phone href="tel:' +
              String(brand.phone).replace(/[^+0-9]/g, "") +
              '">' +
              escape(brand.phone) +
              "</a>"
            : "");
        text = text.replace("<!-- OPTIONAL_CONTACT -->", contactLinks);
        if (!brand.contact_email)
          text = text.replace(
            /<p class="subpage-lead">[\s\S]*?<\/p>/,
            '<p class="subpage-lead">Studio contact details are being finalized. Public inquiry submission is disabled.</p>',
          );
        if (!brand.contact_email)
          text = text.replace(
            /Email the studio at \. Enable JavaScript[^<]*/,
            "Studio contact details are being finalized. Inquiry submission is disabled.",
          );
      }
    }
    if (/\.(mp4|png|jpe?g|webp)$/i.test(rel)) await copyFile(src, dest);
    else await writeFile(dest, text);
  }
  const indexable = discoveryHead(brand, pricing, "index.html").enabled;
  const pages = (await readdir(join(root, "src"))).filter((f) =>
    f.endsWith(".html"),
  );
  await writeFile(
    join(out, "robots.txt"),
    indexable
      ? "User-agent: *\nAllow: /\nSitemap: " +
          brand.production_url.replace(/\/$/, "") +
          "/sitemap.xml\n"
      : "User-agent: *\nDisallow: /\n",
  );
  if (indexable) {
    await writeFile(
      join(out, "sitemap.xml"),
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        pages
          .map(
            (page) =>
              "<url><loc>" +
              htmlEscape(
                new URL(
                  page === "index.html" ? "./" : page,
                  brand.production_url.replace(/\/$/, "") + "/",
                ).href,
              ) +
              "</loc></url>",
          )
          .join("") +
        "</urlset>",
    );
  } else {
    await unlink(join(out, "sitemap.xml")).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    });
  }
  await writeFile(join(out, "config.json"), JSON.stringify(brand, null, 2));
  console.log("Built standalone VAYRIFT website with owner-authorized media.");
  return out;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await build({ localMedia: process.argv.includes("--local-media") });
