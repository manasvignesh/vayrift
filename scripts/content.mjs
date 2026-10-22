import { readFile } from "node:fs/promises";
import { join } from "node:path";
export const escape = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
export const money = (n) => "Rs " + new Intl.NumberFormat("en-IN").format(n);
export const items = (p) => [
  p.pilot,
  ...p.monthly,
  ...p.websites,
  p.care,
  ...p.addons,
];
const link = (id, label = "Discuss this offer") =>
  '<a class="btn btn-secondary" href="contact.html?service=' +
  encodeURIComponent(id) +
  '">' +
  label +
  " ↗</a>";
export function pricingContent(p, b, date) {
  const e = escape,
    card = (x, suffix, extra = "") =>
      '<article class="offer-card"><p class="eyebrow">' +
      e(x.name) +
      "</p><h3>" +
      e(x.name) +
      '</h3><p class="offer-price">' +
      money(x.amount) +
      "<small>" +
      suffix +
      ' </small></p><ul class="offer-features">' +
      (x.scope || x.terms)
        .split(/; |\. (?=[A-Z0-9])/)
        .map((s) => "<li>" + e(s) + "</li>")
        .join("") +
      "</ul>" +
      extra +
      link(x.id) +
      "</article>";
  const recommendations = [
    ["Real estate", "listing-pack"],
    ["Cafes and restaurants", "cafe-menu"],
    ["Salons and gyms", "pilot-reel"],
    ["Hotels and homestays", "pilot-reel"],
    ["Retail", "growth"],
    ["Architects and interior designers", "showcase-site"],
    ["Startups", "launch-page"],
    ["Education", "launch-page"],
  ];
  const faq = [
    [
      "What do you need to start?",
      "For reels, supply photos you own or are authorized to use. Websites need client-supplied approved text, logo and photos. We agree the brief, scope and payment in writing before starting.",
    ],
    [
      "What does one revision mean?",
      "One consolidated round of changes to the agreed concept. A new direction, additional material or extra rounds is quoted separately before work proceeds.",
    ],
    [
      "How is AI used?",
      "AI may assist with motion and visual treatments. A founder reviews the output, and we agree the approach with you. The sample is AI-generated; it is a demonstration, not a completed client commission.",
    ],
    [
      "How does the Pilot refund work?",
      "The Pilot is for your first order only. Pay 50% in advance. We share a preview within 48 hours after receiving the agreed brief and cleared assets. If you do not approve it after the included revision, the advance is refunded.",
    ],
    [
      "Can I cancel a monthly plan?",
      "Plans are month-to-month and paid in advance. You can stop the next renewal by telling us before it starts. For the optional three-month payment, cancellation and any unused-period treatment are agreed in your written quotation before payment.",
    ],
    [
      "Do you shoot footage?",
      "No. These entry offers use supplied, authorized photographs or clips. On-site shoots and drone footage are not included. Any custom production requires a separate written scope.",
    ],
  ];
  return (
    (p.approved
      ? ""
      : '<aside class="draft-pricing" role="note">DRAFT PRICING, NOT YET APPROVED</aside>') +
    '<header class="lf-intro pricing-intro"><p class="eyebrow">PLANS &amp; PRICING / HYDERABAD</p><h1>A clear scope.<br><em>A considered start.</em></h1><p>Short reels from your photos, and websites that make the next step easy. Start small, see the direction, then choose what comes next.</p><p class="pricing-freshness">Prices last updated: ' +
    e(date) +
    '</p><aside class="pricing-hero-note" aria-label="A simple way to start"><span class="eyebrow">SMALL START. CLEAR NEXT STEP.</span><div class="hero-offer-line"><span>01</span><strong>Your photos.</strong><i aria-hidden="true">↗</i></div><div class="hero-offer-line"><span>02</span><strong>Our edit.</strong><i aria-hidden="true">↗</i></div><div class="hero-offer-line"><span>03</span><strong>Your next chapter.</strong><i aria-hidden="true">↗</i></div><p>A two-founder studio.<br>A written scope before we start.</p></aside></header><nav class="pricing-jumps" aria-label="Pricing sections"><a href="#starting">Start small</a><a href="#monthly">Monthly plans</a><a href="#websites">Websites</a><a href="#addons">Add-ons</a><a href="#pricing-details">The details</a></nav>' +
    '<section class="pricing-section" aria-labelledby="starting"><p class="eyebrow">01 / YOUR STARTING POINT</p><h2 id="starting">One step at a time.</h2><ol class="offer-ladder"><li><h3>Start with a Pilot reel</h3><p>' +
    money(p.pilot.amount) +
    " · first order only</p><p>" +
    e(p.pilot.terms) +
    "</p>" +
    link(p.pilot.id, "Start with the Pilot") +
    "</li><li><h3>Keep it going monthly</h3><p>From " +
    money(p.monthly[0].amount) +
    ' / month.</p><p>A regular rhythm of photo-based reels and static creatives, month-to-month.</p><a href="#monthly">Compare monthly plans ↓</a></li><li><h3>Add a website</h3><p>From ' +
    money(p.websites[0].amount) +
    ' one-time.</p><p>A defined page scope, approved content and a clear enquiry pathway.</p><a href="#websites">Compare website scopes ↓</a></li></ol></section>' +
    '<section class="pricing-section sector-picker" aria-labelledby="sector-heading"><p class="eyebrow">FIND YOUR FIT</p><h2 id="sector-heading">What kind of business?</h2><label for="sector-pick">Choose your sector</label><select id="sector-pick"><option value="">Select a sector</option>' +
    recommendations
      .map(([s, id]) => '<option value="' + id + '">' + e(s) + "</option>")
      .join("") +
    '</select><p id="sector-result" aria-live="polite">A starting suggestion, not an assessment of your business.</p><div class="sector-recommendations">' +
    recommendations
      .map(([s, id]) => {
        const x = items(p).find((x) => x.id === id);
        return (
          '<p data-sector="' +
          id +
          '"><strong>' +
          e(s) +
          ":</strong> " +
          e(x.name) +
          " · " +
          money(x.amount) +
          " " +
          link(id, "View this starting offer") +
          "</p>"
        );
      })
      .join("") +
    "</div></section>" +
    '<section class="pricing-section" id="monthly"><p class="eyebrow">02 / A MONTHLY RHYTHM</p><h2>Keep showing up.</h2><p>Month-to-month, paid in advance. Growth includes Starter; Pro includes Growth with the totals shown below.</p><div class="offer-grid">' +
    p.monthly
      .map((x) =>
        card(
          x,
          " / month",
          '<p class="offer-quarter">Or pay 3 months upfront: <strong>' +
            money(x.quarterly) +
            "</strong> (10% off).</p>",
        ),
      )
      .join("") +
    "</div><p>Reels use up to 8 supplied photos each. Each reel and static post includes 1 revision. Delivery starts from an agreed brief and cleared assets; the written quotation confirms the schedule.</p></section>" +
    '<section class="pricing-section" id="websites"><p class="eyebrow">03 / A PLACE ONLINE</p><h2>A website with a defined scope.</h2><p>One-time build prices. Supply approved text, logo and photos. Enquiry and WhatsApp pathways are included where configured; booking systems are quoted separately.</p><div class="offer-grid">' +
    p.websites.map((x) => card(x, " one-time")).join("") +
    '</div><aside class="offer-care"><h3>' +
    e(p.care.name) +
    "</h3><p><strong>" +
    money(p.care.amount) +
    " / month</strong> · " +
    e(p.care.scope) +
    "</p><p>Domain and third-party subscriptions are separate.</p>" +
    link(p.care.id) +
    "</aside></section>" +
    '<section class="pricing-section" id="addons"><p class="eyebrow">04 / WHEN YOU NEED A LITTLE MORE</p><h2>Add only what fits.</h2><div class="pricing-table-scroll" tabindex="0" role="region" aria-label="Add-on prices, scroll horizontally"><table class="pricing-table"><caption>Add-ons and focused offers</caption><thead><tr><th scope="col">Offer</th><th scope="col">Price</th><th scope="col">Scope</th></tr></thead><tbody>' +
    p.addons
      .map(
        (x) =>
          '<tr><th scope="row"><a href="contact.html?service=' +
          x.id +
          '">' +
          e(x.name) +
          "</a></th><td>" +
          (x.id === "reel-upgrade" ? "+" : "") +
          money(x.amount) +
          "</td><td>" +
          e(x.scope) +
          "</td></tr>",
      )
      .join("") +
    "</tbody></table></div></section>" +
    '<section class="pricing-section exclusions" id="pricing-details"><p class="eyebrow">SCOPE BOUNDARIES</p><h2>What is not included.</h2><ul>' +
    p.excluded.map((s) => "<li>" + e(s) + "</li>").join("") +
    "</ul><p>Reels use photos the client supplies and is allowed to use. Websites need client-supplied approved text, logo and photos. No sales, views, search rankings or booking outcomes are promised.</p><p>" +
    e(b.pricing_note) +
    "</p></section>" +
    '<section class="pricing-section"><p class="eyebrow">CUSTOM PROJECTS / QUOTED TO SCOPE</p><h2>Beyond the fixed offers.</h2><p>' +
    p.custom.map(e).join(", ") +
    ': quoted separately.</p><p><a href="services.html#property-film">Property Film Starter</a> · <a href="services.html#website-foundation">Website Foundation</a> · <a href="services.html#brand-launch">Brand &amp; Launch</a></p><p>Cinematic custom production is scoped separately from the photo-based entry offers.</p></section>' +
    '<section class="pricing-section pricing-faq"><p class="eyebrow">BEFORE WE BEGIN</p><h2>A few useful details.</h2>' +
    faq
      .map(
        ([q, a]) =>
          "<details><summary>" +
          e(q) +
          "</summary><p>" +
          e(a) +
          "</p></details>",
      )
      .join("") +
    '</section><section class="lf-cta"><h2>Found a starting point?</h2><a class="btn btn-primary" href="contact.html">Prepare a brief ↗</a></section>'
  );
}
export async function renderSamples(root, groups) {
  const sectors = new Set([
    "Real estate",
    "Cafes and restaurants",
    "Salons and gyms",
    "Hotels and homestays",
    "Retail",
    "Architects and interior designers",
    "Startups",
    "Education",
  ]);
  const path = (s) => {
    if (
      typeof s !== "string" ||
      !/^assets\/[a-zA-Z0-9/_-]+\.(mp4|png|jpe?g|webp|vtt)$/.test(s) ||
      s.includes("..")
    )
      throw Error("Samples require local, licensed asset paths");
    return s;
  };
  let count = 0;
  const result = [];
  const sectorCounts = new Map();
  for (const group of groups) {
    if (!group || !Array.isArray(group.reels) || !group.reels.length) continue;
    if (!sectors.has(group.sector) || group.reels.filter(Boolean).length > 3)
      throw Error("Invalid sample sector or more than three reels");
    const cards = [];
    for (const s of group.reels) {
      if (!s) continue;
      if (!s.src && !s.poster) continue;
      if (!s.src || !s.poster || !s.label || !s.title)
        throw Error("Sample needs video, poster, title and honest label");
      if (!s.src.endsWith(".mp4") || !/\.(png|jpe?g|webp)$/.test(s.poster))
        throw Error("Invalid sample media type");
      const total = (sectorCounts.get(group.sector) || 0) + 1;
      if (total > 3) throw Error("More than three reels for one sector");
      sectorCounts.set(group.sector, total);
      await readFile(join(root, "src", path(s.src)));
      await readFile(join(root, "src", path(s.poster)));
      count++;
      let track = "";
      if (s.captions) {
        if (!s.captions.endsWith(".vtt"))
          throw Error("Captions must be WebVTT");
        await readFile(join(root, "src", path(s.captions)));
        track =
          '<track kind="captions" src="' +
          escape(s.captions) +
          '" srclang="en" label="English" default>';
      }
      cards.push(
        '<article class="sample-card"><p class="eyebrow">' +
          escape(s.label) +
          "</p><h3>" +
          escape(s.title) +
          "</h3><video " +
          (count === 1 ? 'id="featured-video" ' : "") +
          'class="work-real-video" controls playsinline preload="none" width="1280" height="720" poster="' +
          escape(s.poster) +
          '" aria-label="' +
          escape(s.title) +
          '"><source src="' +
          escape(s.src) +
          '" type="video/mp4">' +
          track +
          "Your browser cannot play this sample.</video><p>" +
          escape(s.description) +
          "</p><p>Not a client commission.</p></article>",
      );
    }
    if (cards.length)
      result.push(
        '<section class="pricing-section sample-sector" data-work-type="motion"' +
          (result.length ? "" : ' id="property-film"') +
          '><p class="eyebrow">SAMPLE REELS / ' +
          escape(group.sector) +
          "</p><h2>" +
          escape(group.sector) +
          '</h2><div class="sample-grid">' +
          cards.join("") +
          "</div></section>",
      );
  }
  return { html: result.join(""), count };
}
export function discoveryHead(b, p, rel) {
  const enabled =
    b.indexable === true && p.approved === true && !!b.production_url;
  if (!enabled)
    return {
      enabled: false,
      html: '<meta name="robots" content="noindex, nofollow">',
    };
  const url = new URL(
    rel === "index.html" ? "./" : rel,
    b.production_url.replace(/\/$/, "") + "/",
  ).href;
  const title = b.agency_name + " — Reels and websites in Hyderabad";
  const business = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: b.agency_name,
    areaServed: "Hyderabad",
    ...(b.contact_email ? { email: b.contact_email } : {}),
    ...(b.instagram ? { sameAs: [b.instagram] } : {}),
  };
  return {
    enabled: true,
    html:
      '<meta name="robots" content="index, follow"><link rel="canonical" href="' +
      escape(url) +
      '"><meta property="og:url" content="' +
      escape(url) +
      '"><meta property="og:type" content="website"><meta property="og:title" content="' +
      escape(title) +
      '"><meta property="og:description" content="Short reels from your photos and defined-scope websites in Hyderabad."><script type="application/ld+json">' +
      JSON.stringify(business).replaceAll("<", "\\u003c") +
      "</script>",
  };
}
