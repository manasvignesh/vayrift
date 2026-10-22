import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, join, extname, relative, isAbsolute } from "node:path";
import { root } from "./build.mjs";
import { createInquiryHandler } from "../functions/inquiry.mjs";
try {
  process.loadEnvFile(join(root, ".env"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const handler = createInquiryHandler(),
  dist = join(root, "dist"),
  port = Number(process.env.PORT || 4320);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".vtt": "text/vtt",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1:" + port);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com https://alankarii.vercel.app; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self' https://challenges.cloudflare.com; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Cache-Control", "no-store");
    if (url.pathname === "/api/inquiry") {
      let body = Buffer.alloc(0);
      for await (const chunk of req) {
        body = Buffer.concat([body, chunk]);
        if (body.length > 16384) {
          res.writeHead(413);
          return res.end("Inquiry too large");
        }
      }
      const response = await handler(
        new Request(url, {
          method: req.method,
          headers: req.headers,
          ...(["GET", "HEAD"].includes(req.method) ? {} : { body }),
        }),
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      return res.end(await response.text());
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      return res.end();
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    if (!extname(pathname)) pathname += ".html";
    const file = resolve(dist, "." + pathname);
    const rel = relative(dist, file);
    if (rel.startsWith("..") || isAbsolute(rel)) {
      res.writeHead(404);
      return res.end();
    }
    const info = await stat(file);
    if (!info.isFile()) throw Error("Not a file");
    const content = await readFile(file);
    res.setHeader(
      "Content-Type",
      types[extname(file)] || "application/octet-stream",
    );
    const range = req.headers.range;
    if (range && extname(file) === ".mp4") {
      const m = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!m) {
        res.writeHead(416);
        return res.end();
      }
      const start = Number(m[1]),
        end = m[2]
          ? Math.min(Number(m[2]), content.length - 1)
          : content.length - 1;
      if (start > end) {
        res.writeHead(416);
        return res.end();
      }
      res.writeHead(206, {
        "Content-Range": "bytes " + start + "-" + end + "/" + content.length,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
      });
      return res.end(
        req.method === "HEAD" ? undefined : content.subarray(start, end + 1),
      );
    }
    res.writeHead(200, { "Content-Length": content.length });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    res.writeHead(404);
    res.end("Page not found");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log("VAYRIFT preview: http://127.0.0.1:" + port),
);
