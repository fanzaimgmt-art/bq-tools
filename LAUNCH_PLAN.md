# BQ Tools — Launch Plan (2026-06-20)

Decisions locked with Moshe (20/6):
- **Model:** Tiered funnel. Free/cheap self-serve tools = top-of-funnel → premium done-with-you tier ($500–$5K/mo).
- **Hero pain = MONEY.** Quote → Estimate → Contract → Invoice → **Payment tracking** + the doc pain (W9 / COI / milestone payments) + **proactive client payment updates** (homeowners withhold checks when ignored — straight from Moshe's WhatsApp groups).
- **Audience:** US contractors, English first.
- **This week = clean MVP on the existing URL** (`bq-tools.fanzai-mgmt.workers.dev`). De-fake, simplify, fix auth/credits/pricing, get real users. Domain + live Stripe = fast-follow.

Positioning line: **"BQ Tools — get paid faster. The money & paperwork layer for contractors."**

## Why money (grounded in Moshe's own contractor WhatsApp groups)
Top validated pains: payment delays + forgotten invoices + W9/COI doc requirements; quotes/bids done manually over WhatsApp; milestone payments renegotiated every job; homeowners withhold checks when not updated. This is what they bleed on → this is what justifies premium pricing.

## Phases (run in loops with agents until Moshe says he loves it)
1. **De-fake** — remove or mark "EXAMPLE/DEMO" every invented testimonial, fake portfolio thumbnail, fake scarcity, and "coming soon" that misleads. (Moshe insisted.)
2. **Reposition + simplify homepage** — money hero; tool grid leads with the Money Suite (Estimate, Quote, Contract, Invoice, Payment Tracker); demote the rest into a clean "More tools" area. Dead simple, US English.
3. **Money hero flow** — make Estimate→Quote→Contract→Invoice→Payment-tracking one coherent, simple flow that genuinely helps. Add: payment status tracker, milestone payments, W9/COI doc handling, client payment-update links.
4. **Auth / credits / pricing** — verify signup+login work; simplify credits; set the tiered pricing (free tools + a real premium tier, not just $14.99). Justify the premium with the money outcome.
5. **Polish** — UX clarity, mobile, loading; loop on Moshe's feedback.

## Guardrails
- Nothing fake ships. Real or labeled EXAMPLE.
- Simpler > more. Cutting/hiding tools is allowed and encouraged.
- Don't break the working backend (worker.js auth/credits/Stripe). Frontend + config first.
- It's a git repo — commit per phase.

## Codebase
`/Users/mosheshohet/Projects/bq-tools/` — HTML/CSS/JS + Cloudflare Worker (`api/worker.js`), KV users, Google+email auth, Stripe (4 products defined), Claude/Gemini proxy. Deployed: `bq-tools.fanzai-mgmt.workers.dev`.
