const email = (s) =>
  typeof s === "string" &&
  s.length <= 254 &&
  /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(s) &&
  !/[\r\n]/.test(s);
export function createInquiryHandler({
  env = process.env,
  transport = fetch,
  now = Date.now,
} = {}) {
  const buckets = new Map();
  return async function inquiry(request) {
    const json = (status, message, ok = false) =>
      Response.json(
        { ok, message },
        { status, headers: { "Cache-Control": "no-store" } },
      );
    if (request.method !== "POST") return json(405, "Use POST for inquiries.");
    if (
      env.INQUIRY_ENABLED !== "true" ||
      !env.RESEND_API_KEY ||
      !email(env.INQUIRY_FROM) ||
      !email(env.INQUIRY_TO) ||
      !env.TURNSTILE_SECRET ||
      !env.ALLOWED_ORIGIN
    )
      return json(503, "Inquiry delivery is not configured. Nothing was sent.");
    let origin;
    try {
      origin = new URL(env.ALLOWED_ORIGIN).origin;
    } catch {
      return json(503, "Inquiry delivery is not configured. Nothing was sent.");
    }
    if (request.headers.get("origin") !== origin)
      return json(403, "This origin is not permitted.");
    if (!request.headers.get("content-type")?.includes("application/json"))
      return json(415, "Use JSON.");
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 16384)
      return json(413, "Inquiry is too large.");
    let d;
    try {
      d = JSON.parse(raw);
    } catch {
      return json(400, "Invalid inquiry format.");
    }
    if (!d || typeof d !== "object" || Array.isArray(d))
      return json(400, "Invalid inquiry format.");
    if (d._hp) return json(400, "Inquiry could not be accepted.");
    if (
      typeof d.name !== "string" ||
      !d.name.trim() ||
      d.name.length > 120 ||
      /[\r\n]/.test(d.name) ||
      !email(d.email) ||
      typeof d.message !== "string" ||
      d.message.trim().length < 5 ||
      d.message.length > 3000 ||
      d.consent !== true
    )
      return json(
        400,
        "Enter a valid name, email, project description and reply consent.",
      );
    for (const f of ["business", "website", "service", "budget", "timeline"])
      if (
        d[f] !== undefined &&
        (typeof d[f] !== "string" || d[f].length > 300 || /[\r\n]/.test(d[f]))
      )
        return json(400, "Invalid project details.");
    if (
      typeof d.turnstile_token !== "string" ||
      !d.turnstile_token ||
      d.turnstile_token.length > 2048
    )
      return json(400, "Complete the spam check.");
    const key = d.email.toLowerCase(),
      time = now();
    for (const [k, v] of buckets)
      if (time - v.start > 600000) buckets.delete(k);
    const bucket = buckets.get(key) || { start: time, n: 0 };
    if (bucket.n >= 3)
      return json(429, "Please wait before submitting another inquiry.");
    bucket.n++;
    buckets.set(key, bucket);
    try {
      const check = await transport(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET,
            response: d.turnstile_token,
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const verified = await check.json();
      if (
        !check.ok ||
        !verified.success ||
        verified.hostname !== new URL(origin).hostname
      )
        return json(400, "Spam verification failed. Nothing was sent.");
      const text = [
        "Project inquiry",
        ...[
          "name",
          "email",
          "business",
          "website",
          "service",
          "budget",
          "timeline",
          "message",
        ].map((k) => k + ": " + (d[k] || "Not specified")),
        "Reply requested only for this inquiry.",
      ].join("\n\n");
      const sent = await transport("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + env.RESEND_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.INQUIRY_FROM,
          to: [env.INQUIRY_TO],
          reply_to: d.email,
          subject: "Website inquiry — " + d.name.trim(),
          text,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const receipt = await sent.json();
      if (!sent.ok || typeof receipt.id !== "string" || !receipt.id)
        return json(
          502,
          "The provider did not confirm acceptance. Do not assume delivery; check with the studio before retrying.",
        );
      return json(
        200,
        "The email provider accepted your inquiry. Inbox delivery is not guaranteed.",
        true,
      );
    } catch {
      return json(
        502,
        "Delivery could not be confirmed. Do not assume it was sent; check with the studio before retrying.",
      );
    }
  };
}
export const POST = createInquiryHandler();
