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
export async function build({ localMedia = false } = {}) {
  const brand = JSON.parse(await readFile(join(root, "brand.json"), "utf8"));
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
    new URL(brand.production_url).protocol !== "https:"
  )
    throw Error("Production URL must be verified HTTPS");
  if (
    brand.inquiry_enabled &&
    (!brand.contact_email || !brand.turnstile_site_key)
  )
    throw Error("Delivery needs a real email and Turnstile site key");
  const out = join(root, "dist");
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
    text = text.replace(/\{\{([a-z_]+)\}\}/g, (_, key) => {
      if (!(key in brand)) throw Error("Unknown brand token " + key);
      return escape(brand[key]);
    });
    if (rel.endsWith(".html")) {
      text = text.replace(
        /<p class="founder-public-name" data-founder-name="(\d+)"><\/p>/g,
        (_, i) => {
          const founder = brand.founders?.[Number(i)];
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
      if (brand.production_url) {
        const url = new URL(
          rel === "index.html" ? "./" : rel,
          brand.production_url.endsWith("/")
            ? brand.production_url
            : brand.production_url + "/",
        );
        text = text.replace(
          "</head>",
          '<link rel="canonical" href="' +
            escape(url.href) +
            '"><meta property="og:url" content="' +
            escape(url.href) +
            '"></head>',
        );
      }
    }
    if (/\.(mp4|png|jpe?g|webp)$/i.test(rel)) await copyFile(src, dest);
    else await writeFile(dest, text);
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
