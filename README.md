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
