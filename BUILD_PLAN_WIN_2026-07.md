# Obra — Build & Fix Plan: WIN THE FIELD (July 2026)

**Source:** 5 competitor teardowns 2026-07-03 (CompanyCam, Handoff, Angi, Buildxact, FluentOS) — full docs in `BQ Brain/40 - Research/`. Visual homepage comparison (screenshots) done 2026-07-03.
**Operating model:** Fable 5 = architect/planner/reviewer. Sonnet 5 subagents = executors (credit-efficient). Small scoped tasks, diff review before push, verify after deploy (curl + screenshot).
**Rules:** No fake claims/numbers — every proof point must be true. No per-seat pricing ever. Never break existing pages. Site deploys auto on push to main (CI).

---

## The Strategic Read (from all 5 teardowns)

| Fact | Implication for Obra |
|---|---|
| Everyone meters AI (CompanyCam "AI Actions", Handoff 50 credits, Buildxact 5 credits + $99–149 add-ons) | **"Unlimited AI" = loud differentiator** |
| 12-mo locks + cancel friction everywhere (Handoff Pro/Scale, Buildxact annual, Angi 30–35% penalty, CompanyCam web-only cancel) | **Month-to-month + one-tap cancel = trust weapon** |
| Nobody is video-native (Handoff=voice transcription, Buildxact=PDF plans, CompanyCam=photos) | **True video = unclaimed lane — must be real** |
| Nobody is Spanish-first (UI translation ≤ beta at best; content stays English) | **Spanish crew work-brief = THE defensible wedge** |
| Handoff vacated the solo floor ($39→$149); CompanyCam floor $63; Buildxact $199 | **$14.99 flat owns the 1–5-man segment** |
| Angi: contractors pay $1,400–2,500 CPA for shared leads | **"Own your demand" narrative feeds Cinema Ads + Obra** |
| Their marketing: identity content, comparison hubs, name-city-$ testimonials, channel partners | **Copy the playbook at community scale (HE/ES/EN)** |

## Homepage Visual Verdict (2026-07-03 screenshots)

Obra WINS on headline punch ("GET PAID FASTER" > all three). Obra LOSES on:
1. **Zero social proof in hero** (CompanyCam: 4.8★ × 25K reviews; Handoff: ratings row; Buildxact: phone number + demo).
2. **No product visual in first viewport** (all 3 show product/jobsite immediately; our white card starts below fold).
3. **No human/jobsite warmth** (abstract dark vs their real-people imagery).
4. Missing the Spanish/crew hook above the fold (it's in the subheadline text only).

---

## WAVE 1 — Homepage & Trust (site-only, fast, reversible)

**1.1 Hero upgrade (index.html)**
- Add honest trust strip under CTA: `$14.99 flat · Unlimited AI · No contracts · Cancel in one tap · English & Español`
- Pull product visual (existing demo/screenshot) into first viewport.
- Eyebrow: "FOR CONTRACTORS" → "FOR CREWS THAT BUILD LA" (or similar community-true line).
- Keep GET PAID FASTER. Do not touch the winning headline.

**1.2 "The Obra Pledge" block (homepage + pricing)**
Each bullet = a documented competitor sin, inverted:
- Flat $14.99. Never per-seat. (CompanyCam $29/seat, Handoff $149+, Buildxact $199+)
- Unlimited AI. No credits, no meters. (all 3 meter)
- No 12-month contracts. Cancel in one tap, in the app. (Handoff/Buildxact locks; CompanyCam web-only cancel; Angi 30–35% penalty)
- Your money goes to you. We never hold funds. (anti-HCP; anti-Handoff voided-check wall)
- Your data exports anytime. No exit fees. (anti-ServiceTitan $10K)
- No sales calls. Ever. (Handoff/Angi harassment complaints)

**1.3 Spanish completeness**
- Finish the ~17 pages with incomplete ES translations (6/25 audit gap).
- ES hero variant: "Cobra Más Rápido" path prominent.

## WAVE 2 — Compare Hub & SEO Interception (new pages)

**2.1 /compare/ hub + 4 pages** (Handoff runs 11; we start 4, honest tone, sourced):
- `/compare/companycam-alternative` — "keep it for photos; Obra gets you paid" + $332/mo crew math vs $14.99.
- `/compare/handoff-alternative` — accuracy flip ("national averages → $7,500 for 8 doors" sourced to Capterra) + $149 floor + 12-mo lock vs flat.
- `/compare/jobber-alternative` — $300+ loaded vs $15; speed-to-estimate.
- `/compare/angi-leads-alternative` — CPA math $1,400–2,500/booked job vs owning demand; FTC $7.2M (sourced).
Design: one shared template, comparison table, honest "when they're the right choice" section (credibility), CTA.

**2.2 Cost-guide seeds (Angi's playbook, local + bilingual):**
- `/guides/kitchen-remodel-cost-los-angeles` (EN+ES)
- `/guides/bathroom-remodel-cost-los-angeles` (EN+ES)
- `/guides/adu-cost-los-angeles` (EN+ES)
Schema markup (FAQ), internal links → estimate tool. These pages double as content Moshe's clients star in.

## WAVE 3 — Product Wedges (API + app, careful, behind review)

**Scout findings (2026-07-03):** price_book already exists (D1 table, /api/pricebook/add|search|estimate at worker.js:121-123, Tony grounds on it at worker.js:1511). Video Brain accepts optional per-request `pricebook` string (worker.js:2495) — NOT persistent learning. Smart Estimate (tools/estimate.html) ignores price book entirely. Crew brief EXISTS inside Video Brain output (crew_instructions{en,es}, do_en/do_es steps, "plain Mexican trade Spanish" prompt at worker.js:2527) — but has no product surface (no share, no page).

**3.1 "Learns YOUR prices" loop (spec):**
- a) Smart Estimate: before calling AI, fetch user's relevant price_book items (/api/pricebook/search) and inject into prompt — same grounding Video Brain has.
- b) Video Brain: auto-attach user's price book instead of optional param.
- c) Persist corrections: when user edits an AI-suggested line price, write to price_book. ⚠️ DESIGN GATE: current price_book is crowd-sourced/shared — private contractor prices MUST be scoped (add user_id column + private flag) or we leak one contractor's pricing to competitors. Migration required. REVIEW REQUIRED.
- d) UI touch: "Obra learned N of your prices" toast/counter.

**3.2 Spanish Crew Work-Brief surfacing (spec):**
- Video Brain results: add "Send to crew / Enviar a la cuadrilla" button → composes Spanish brief text (scope + steps do_es + materials + safety) → wa.me share + copy button. Front-end only, low risk.
- Phase 2: shareable brief page (like client-page) + PDF.
- Marketing: OSHA "in their language" angle; homepage hero mention exists (cuadrilla line).

**3.3 Light "Import from CompanyCam"**: photo-upload → project intake (full integration later; Zapier hook if fast).

## WAVE 4 — Distribution Mechanics (after 1–3)
- "Powered by Obra" footer on every client-facing artifact (estimate, invoice, client page, crew brief).
- Directory profiles as anti-Angi seeds (exclusive, no lead fees).
- Trades Report LA (original research) — later, with real data.

---

## Smart-Operation Rules (how this plan runs)
1. **Model split:** Fable thinks/reviews; Sonnet executes. One agent per task, tight scope, returns diff summary + verification evidence.
2. **Review gate:** No push without Fable diff review. API changes get extra scrutiny (auth, migrations, CORS).
3. **Verify after deploy:** curl the live URL + screenshot; health endpoint version bump per deploy (existing convention).
4. **Honesty gate:** no invented ratings/user counts/testimonials. Use only true claims.
5. **Task ledger:** session TaskList mirrors this file; each wave marked here on completion (survives laptop sleep — session resumes on wake).
6. **Competitor watch (quarterly):** Handoff cheap tier? HD free Blu-lite? CompanyCam×Beam estimates GA? → re-plan.

## Status Log
- 2026-07-03: Plan created. Wave 1+2 execution started (Sonnet builders).
- 2026-07-03 ~11:15: **Waves 1.1, 1.2, 2.1, 2.2 SHIPPED** (commit 1a234ca): hero trust strip + density, Obra Pledge (6 honest inversions, EN/ES/partial HE), compare/ hub + 4 pages (all claims re-verified live by builder; unverifiable Handoff price-history claim dropped), guides/ hub + 3 LA cost guides (sourced, FAQ JSON-LD, bilingual). Deploy verification in progress.
- In progress: Wave 1.3 Spanish completeness (b2, profile.html started), Wave 3.2 crew-brief WhatsApp share (b1, video-brain.html started).
- Known follow-ups: light-theme price-card contrast bug (pre-existing, flagged by b1); he/hy/fa/ar translations for new hero eyebrow beyond data-he; home.html stale duplicate of index.html — decide keep/kill.
- 2026-07-03 ~11:15: **LIVE VERIFIED** — all URLs 200 (/, /compare/*, /guides/*), homepage screenshot confirms trust strip + video peek. Honesty fix shipped (c5734ca): compare tables claimed "unlimited AI" for Obra (false — Pro=50 credits); reframed to "AI included at $14.99 flat" vs competitors' metered add-ons.
- In flight (2nd push): b1 crew-brief WhatsApp share (video-brain.html), b2 Spanish completeness (~17 pages, started with profile.html), b3 Smart Estimate price-book grounding (tools/estimate.html).
- 2026-07-03 ~11:30: **Wave 2 SHIPPED** (c1a75d7): Spanish 17 pages/103 strings + Español picker button (profile.html was EN/HE only!), crew-brief WhatsApp composer, Smart Estimate grounded on price book. **Copy-accuracy hotfix** (377a23a): price_book is intentionally CROSS-TENANT (community "what does it cost" feature, worker.js:1650-1668 has no owner filter) — "your price book" claim rewritten to "the Obra price book — real contractor prices".
- ⚠️ **GATED — awaiting Moshe's sign-off (Wave 3.1c backend):** b1's approved spec: (1) migration `private INTEGER DEFAULT 0` on price_book; (2) reads become `WHERE (private=0 OR owner_email=?)`; (3) auto-learned corrections insert private=1 FORCED server-side; (4) "Obra learned N of your prices" counter; needs api worker deploy (manual wrangler). Without it, no automatic private price learning.
- Discovery: training.html + /api/training/knowledge already = honest per-contractor "YOUR pricing" path (upload past contracts → "estimate uses YOUR pricing"). Marketing can lean on this today.
- Additional follow-ups for Moshe: consider truly-unlimited AI on Pro (competitive wedge vs universal metering — needs cost check w/ free-provider chain); legal pages (privacy/terms/ai-disclaimer) left English-primary intentionally?
