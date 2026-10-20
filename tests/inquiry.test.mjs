import { test } from "node:test";
import assert from "node:assert/strict";
import { createInquiryHandler } from "../functions/inquiry.mjs";
const env = {
  INQUIRY_ENABLED: "true",
  RESEND_API_KEY: "controlled-test-key",
  INQUIRY_FROM: "studio@example.test",
  INQUIRY_TO: "inbox@example.test",
  ALLOWED_ORIGIN: "https://studio.example.test",
  TURNSTILE_SECRET: "controlled-test-secret",
};
const body = {
  name: "Controlled visitor",
  email: "visitor@example.test",
  message: "A controlled website inquiry.",
  consent: true,
  turnstile_token: "controlled-token",
};
const req = (data = body, origin = env.ALLOWED_ORIGIN) =>
  new Request("https://studio.example.test/api/inquiry", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(data),
  });
test("unconfigured delivery fails closed without a provider request", async () => {
  let calls = 0;
  const h = createInquiryHandler({
    env: {},
    transport: async () => {
      calls++;
      throw Error("No request expected");
    },
  });
  assert.equal((await h(req())).status, 503);
  assert.equal(calls, 0);
});
test("valid consent and captcha lead to a real provider receipt requirement", async () => {
  const calls = [];
  const h = createInquiryHandler({
    env,
    transport: async (url, options) => {
      calls.push({ url, options });
      return Response.json(
        url.includes("siteverify")
          ? { success: true, hostname: "studio.example.test" }
          : { id: "controlled-provider-id" },
      );
    },
  });
  const response = await h(req());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(calls.length, 2);
  const payload = JSON.parse(calls[1].options.body);
  assert.equal(payload.reply_to, body.email);
  assert.deepEqual(payload.to, [env.INQUIRY_TO]);
  assert.ok(payload.text.includes("Reply requested only"));
});
test("provider failure never reports successful delivery", async () => {
  const h = createInquiryHandler({
    env,
    transport: async (url) =>
      Response.json(
        url.includes("siteverify")
          ? { success: true, hostname: "studio.example.test" }
          : { error: "fixture failure" },
        { status: url.includes("siteverify") ? 200 : 503 },
      ),
  });
  const response = await h(req());
  assert.equal(response.status, 502);
  assert.equal((await response.json()).ok, false);
});
test("missing provider receipt never reports success", async () => {
  const h = createInquiryHandler({
    env,
    transport: async (url) =>
      Response.json(
        url.includes("siteverify")
          ? { success: true, hostname: "studio.example.test" }
          : {},
      ),
  });
  assert.equal((await h(req())).status, 502);
});
test("rejects untrusted origin before transport", async () => {
  const h = createInquiryHandler({
    env,
    transport: async () => {
      throw Error("Not expected");
    },
  });
  assert.equal((await h(req(body, "https://untrusted.test"))).status, 403);
});
test("honeypot, missing consent, injection and invalid message are rejected", async () => {
  const h = createInquiryHandler({
    env,
    transport: async () => {
      throw Error("Not expected");
    },
  });
  for (const d of [
    { ...body, _hp: "spam" },
    { ...body, consent: false },
    { ...body, email: "bad\r\n@example.test" },
    { ...body, name: "Bad\r\nheader" },
    { ...body, message: "a" },
    { ...body, turnstile_token: "" },
  ])
    assert.equal((await h(req(d))).status, 400);
});
test("captcha must match configured hostname", async () => {
  const h = createInquiryHandler({
    env,
    transport: async () =>
      Response.json({ success: true, hostname: "untrusted.test" }),
  });
  assert.equal((await h(req())).status, 400);
});
test("rate limit is enforced and expires", async () => {
  let time = 0;
  const h = createInquiryHandler({
    env,
    now: () => time,
    transport: async (url) =>
      Response.json(
        url.includes("siteverify")
          ? { success: true, hostname: "studio.example.test" }
          : { id: "fixture" },
      ),
  });
  for (let i = 0; i < 3; i++) assert.equal((await h(req())).status, 200);
  assert.equal((await h(req())).status, 429);
  time = 600001;
  assert.equal((await h(req())).status, 200);
});
test("oversize payload is rejected", async () => {
  const h = createInquiryHandler({ env });
  assert.equal(
    (await h(req({ ...body, message: "x".repeat(17000) }))).status,
    413,
  );
});
