import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { root } from "./build.mjs";
const excluded = new Set([
  "dist",
  "private-media",
  "node_modules",
  "qa",
  ".git",
]);
const files = [];
async function walk(dir, rel = "") {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (
      excluded.has(e.name) ||
      (e.name.startsWith(".env") && e.name !== ".env.example")
    )
      continue;
    const r = rel ? rel + "/" + e.name : e.name;
    if (e.isDirectory()) await walk(join(dir, e.name), r);
    else if (r !== "GITHUB-FILES.txt") files.push(r);
  }
}
await walk(root);
const errors = [];
const media = new Set([
  "src/assets/property-sample.mp4",
  "src/assets/property-poster.png",
  "src/assets/aman-design-reference.png",
]);
for (const f of files) {
  if (/\.(sqlite|db|zip|log|enc)$|(^|\/)(server|extension|data)\//i.test(f))
    errors.push("Unexpected private file: " + f);
  if (/\.(mp4|png|jpe?g|webp)$/i.test(f)) {
    if (!media.has(f)) errors.push("Unreviewed media: " + f);
    continue;
  }
  const text = await readFile(join(root, f), "utf8");
  if (
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|AIza[0-9A-Za-z_-]{30,}|sk-proj-[A-Za-z0-9_-]{20,}/.test(
      text,
    )
  )
    errors.push("Potential secret: " + f);
  if (
    f.startsWith("src/") &&
    /leadforge|127\.0\.0\.1:4317|portfolio\/api/i.test(text)
  )
    errors.push("Private dependency or old branding: " + f);
}
if (errors.length) throw Error(errors.join("\n"));
files.sort();
await writeFile(
  join(root, "GITHUB-FILES.txt"),
  files.join("\n") + "\nGITHUB-FILES.txt\n",
);
console.log(
  "Audited " +
    files.length +
    " source/config/documentation files. No detected secret patterns or private application files. Manual review still required.",
);
console.log(files.join("\n"));
