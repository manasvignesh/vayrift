# VAYRIFT Studio

Ideas in motion. An independent creative studio in Hyderabad offering cinematic property advertisements, AI-assisted reels, premium websites and visual identity.

This is the existing portfolio's standalone public frontend: five HTML pages, CSS and browser JavaScript. It preserves the editorial layouts, service selector, FAQ, motion effects, mobile menu, video controls and inquiry form. No private application, database or account integration is included. Migration history: extracted from the public LeadForge Creative Studio portfolio; that application and existing hosted site remain separate.

## Run

Use Node.js 22.12+ and npm. There are no third-party runtime or build dependencies.

- npm install — install from the committed lockfile (no packages required).
- npm run dev — build and serve http://127.0.0.1:4320, including owner-authorized public media.
- npm run build — produce the standalone static dist/ including the authorized media.
- npm run preview — serve the current dist/ at http://127.0.0.1:4320.
- npm test — isolated build, configuration and inquiry-adapter tests; no real email is sent.
- npm run audit — inspect the proposed file set and regenerate GITHUB-FILES.txt. Pattern scanning is supplemented by manual review.

Edit brand.json for the agency name, display wordmark, tagline, location, Instagram, public email and founder details. The founders array accepts public names (strings or objects with a name field); configured names appear above the two existing role descriptions on About. Public values only: never put secrets there. production_url stays empty until a real deployment is verified; future_domain is planning information only. Build substitutes branding into the source templates. Source is in src/, not compiled from a CRM framework.

## Contact setup

Public inquiries go to vayrift11@gmail.com via the manual mailto workflow: it prepares an email in the visitor's own email app and explicitly says nothing was sent or stored. No server delivery is implied.

For direct delivery, deploy functions/inquiry.mjs behind a same-origin /api/inquiry route (the included Node server supports it). Set inquiry_enabled and turnstile_site_key in brand.json, plus INQUIRY_ENABLED=true, RESEND_API_KEY, INQUIRY_FROM (verified sender), INQUIRY_TO (studio inbox), ALLOWED_ORIGIN (exact actual origin) and TURNSTILE_SECRET in server-only environment variables. .env.example contains empty placeholders. A static-only host must keep direct submission off unless a function adapter is configured.

The adapter validates input, exact origin, body size, consent and honeypot, verifies Turnstile server-side including hostname, limits attempts per email in memory, and sends via Resend. Deploy behind a host-level IP rate limiter for distributed abuse protection; in-memory counters do not span instances. No inquiry database or personal-data logs are created. Success means provider acceptance, not guaranteed inbox delivery. No provider credentials or live production delivery are configured or verified here. Tests use injected fake transports.

Provider references: [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email), [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Deployment and review

Upload dist/ to a standard static host after approval; attach the isolated inquiry function only if configured. Relative links work on ordinary static hosting; hosts may optionally rewrite clean paths to the matching .html. Keep robots/noindex during review. The owner has authorized a GitHub push to the destination below. No custom-domain connection or public hosting deployment has been authorized.

See MEDIA-LICENSES.md for the media inventory and owner authorization. GITHUB-FILES.txt is the exact proposed public source list. dist/, private-media/, qa/, .env, node_modules and caches are excluded. The repository destination is github.com/manasvignesh/vayrift; the owner explicitly approved publication of this public website source.

## Interaction design

The original vanilla frontend is retained. Native split-text entrances, magnetic buttons, pointer spotlights, subtle card tilt, scroll depth, work filters, a moving capability ribbon and a guided brief selector add motion without a React runtime. Reduced-motion preferences disable decorative movement; touch users retain native interactions.

## Vercel

Import this repository with its root directory left at the repository root. The committed vercel.json explicitly sets the build command to npm run build, output directory to dist, and framework to Other (null). It also enables clean HTML URLs. There is no public/ build folder. Redeploy the newest commit after changing build settings. The current inquiry workflow uses mailto; the optional functions/inquiry.mjs adapter is not deployed as a Vercel Function by this static configuration.

### Portfolio presentation

The Alankarii project story is at `alankarii.html`, linked from Home and Work. Its desktop, mobile and detail images are captures of the founder-owned live website. Shared presentation and accessibility adjustments live in `src/finish.css`; branding and inquiry details remain in `brand.json`. The public inquiry form still prepares an email for review and sending in the visitor’s email application; it does not provide automatic delivery.

## Fixed offers, pricing and launch gates

`src/pricing.json` is the single source for every offer amount, three-month price, scope and exclusions. `scripts/content.mjs` renders `src/pricing.html`, contact service options and entry-price tokens during the build. Change an amount there once; do not type prices into page templates. Every page links to Plans & Pricing. `src/offers.css` and `src/offers.js` add the sector quick-pick and optional contact UI using the existing visual language. There are no new dependencies.

Pricing is **draft** (`approved: false`). The pricing page displays a visible warning. All pages stay noindex and robots stays Disallow unless ALL three conditions hold: `src/pricing.json` approved is true, `brand.json` indexable is true, and production_url contains the verified HTTPS production URL. Only then are canonical/Open Graph tags, LocalBusiness JSON-LD and sitemap.xml generated. Switching any gate off removes the generated sitemap. Never set a guessed domain. The default remains unindexable.

`brand.json` has optional whatsapp_number (international digits, country code included), phone, founders and configurable pricing_note. Unknown values remain empty. Empty phone, WhatsApp and founder names render no elements. The public Gmail address remains the supplied address; a domain mailbox has not been invented. inquiry_enabled remains false, so the form prepares a mailto draft for the visitor to review and send. It does not transmit or store the inquiry. WhatsApp opens a prefilled draft for the selected service only when configured; clicking does not send it automatically.

`src/samples.json` groups up to three labelled reels per sector. Blank groups and entries render nothing. Use local asset paths with a real poster and honest label, and add each new asset to MEDIA-LICENSES.md before use. Optional captions must be an accurate local WebVTT file. The only reel currently shown is the existing 10-second AI-generated demonstration, not a client commission. Alankarii remains labelled as a founder-built website.

### Assumptions and founder launch checklist

- Growth includes Starter; Pro includes Growth, with six reels and eight posts as Pro totals. No popularity or results claims are made.
- The 48-hour preview/turnaround starts after receiving the agreed brief and cleared assets. The written quote confirms scheduling and the definition of a small website edit.
- Confirm all draft prices, fixed scopes, Pilot advance/refund terms, revision rules, and three-month cancellation/unused-period terms before approving pricing.
- Supply the real WhatsApp number (with country code) and optional public phone. Supply founder names only if you want them public.
- Supply/verify the actual production URL; optionally arrange a domain email. Keep unknown values empty.
- Supply authorized additional sector samples, posters and accurate captions if wanted; update MEDIA-LICENSES.md. Do not fill sectors with invented work.
- Confirm GST treatment and edit pricing_note if needed. Define the written quotation and permission-to-use-assets process.
- Approve pricing and deliberately enable indexable only when ready. inquiry_enabled must remain false until a separately configured and verified delivery adapter exists.
- Run `npm test`, `npm run build`, `npm run audit`. Deploy only after review; this implementation does not push or deploy.

## Shared visual and interaction finish

`src/polish.css` and `src/polish.js` provide the shared typography, sticky-header feedback, native page transitions where supported, one-time content entrances, disclosure animations and form-field feedback. Unsupported browsers retain ordinary navigation. Reduced-motion preferences disable the decorative transitions. Service tabs, menus, inquiry preparation and project previews retain their existing vanilla implementations. `src/home-premium.css` provides the website-led homepage composition; all project imagery remains owner-authorized and honestly labelled. The UI pass adds no dependencies, new media, provider requests or automatic sending.

## Click-to-load live project previews

Homepage, Services, Work and the Alankarii case study can open the real founder-built website in a keyboard-accessible dialog. `src/live-preview.js` creates the iframe only after a visitor clicks a live-preview link, with desktop/mobile viewport controls, Escape/Close and a permanent external new-tab link. Closing removes the iframe and restores focus. There is no background live-site request from initial screenshots. Native links still work without JavaScript. The iframe is restricted to the fixed `https://alankarii.vercel.app/` URL; local CSP permits that exact frame origin. The remote site can change its embedding policy later; the new-tab link is the fallback. Browser security limits features within sandboxed frames. No purchase or inquiry is automatically submitted by the portfolio.

## About page and founder profiles

`src/about.html`, `src/about.css` and `src/about.js` implement the seven-section studio introduction with an original CSS paper collage, story, founders, actual service scopes, beliefs and contact/portfolio links. `scripts/about-content.mjs` renders escaped founder data from `brand.json`. Supplied founder names and LinkedIn URLs are configured there. Manas’s biography is limited to the background supplied by the owner; Siddharth’s stays at the co-founder level. No employment titles, qualifications or achievements are inferred.

Portrait rendering is controlled by each founder’s local portrait path and portrait_confirmed flag. Unconfirmed profiles use clearly labelled initials placeholders, not synthetic portraits. Before adding a photograph, confirm who it depicts and permission to use it, optimize the image locally, add it to MEDIA-LICENSES.md and the audit media allowlist, then configure its local assets/ path and portrait_confirmed. No unconfirmed photo is fetched or rendered. The exact founding anecdotes/dates and Siddharth’s detailed background still require owner confirmation; current story copy describes the studio’s purpose without inventing a chronology.

Local About verification artifacts are in ignored `qa/about/`: desktop/tablet/mobile screenshots and results.json. Pricing is checked against a pre-change SHA-256. No push or deployment is part of this update.

Manas’s black-shirt photograph was identified by the owner on 22 October 2026 and is configured as `assets/manas-vignesh.webp`. The optimized local asset is recorded in the media register. Siddharth’s photo remains unconfirmed and his card retains its labelled initials placeholder.

Siddharth’s photograph was subsequently supplied and is configured as `assets/siddharth-lagisetty.webp`. Both founder photos are now configured; their detailed biography restrictions remain unchanged. The close-up headshot is contained within the shared card frame so it is not cropped through the face.
