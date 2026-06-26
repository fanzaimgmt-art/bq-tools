# Obra — Beta Ops & User-Management Plan

_Last updated: 2026-06-23. Owner: Moshe (BQ). Goal: tight, investor-ready beta that proves Video Brain works on real contractor jobs → raise multi-million round._

---

## 1. Current state (verified from code, not assumed)

**Stack:** static HTML site on Cloudflare Pages (`bq-tools`, auto-deploys on `git push` to `main`) + API Worker `bq-tools-api` (deploy via `wrangler deploy`). Storage = **Cloudflare KV** namespace `BQ_USERS`.

**Auth (already built):** passwordless email + 6-digit code (`/api/auth/register` → `/api/auth/verify`), plus Google OAuth (`/api/auth/google`). Sessions = bearer token, `token:{token}` → email in KV.

**User model (KV `user:{email}`):** `credits`, `isPro`, `creditsUsedThisMonth`, `resetDate`. Free = 5 credits, Pro = 50/month with monthly reset.

**Admin (already built):** `/api/admin/users` (list), `/api/admin/user` (detail), `/api/admin/toggle-pro`, `/api/admin/create-giftcode`, `/api/admin/errors`. Gated by `ADMIN_PASSWORD` (Worker secret, timing-safe compare). Admin UI: `admin.html`, `admin/dashboard.html`.

**Beta seats already exist** for the "pusher" product line: `/api/pusher-beta-seats`, `/api/pusher/onboard`, `/api/admin/pusher/*`. This is the seam to reuse for Video Brain beta.

**Health surface (already built):** `/api/health`, `/api/security-health`, `/api/pusher-health` — all public, return 200. Client errors flow to `/api/error-report` → readable at `/api/admin/errors`.

**Verdict:** user management is ~70% there. The gap is not "build auth" — it's beta-cohort tracking, activation visibility, and an ops loop. Don't rebuild what exists.

---

## 2. Beta user-management model (what "best practice" adds)

Treat beta testers as a **tagged cohort**, not a new system. Add to each `user:{email}` record:

| Field | Why |
|-------|-----|
| `betaCohort` | e.g. `"obra-crew-2026-06"` — segment + measure per wave |
| `betaSource` | `"whatsapp-crew"` / `"atar-pool"` / `"gmass"` — attribution |
| `activatedAt` | timestamp of **first successful Video Brain output** = the aha moment |
| `firstUploadAt` | first video uploaded (even if it failed) — funnel step |
| `feedbackCount` | how many feedback notes they gave — engagement signal |

**Activation (the one metric that matters):** _uploaded a real job video AND got a usable work-plan/estimate back._ Everything in beta optimizes time-to-that.

**Funnel to watch:** `joined group → signed up → first upload → activated → gave feedback → repeat upload`. Track drop-off at each; attack the biggest drop.

**Beta seat grant:** give each crew member Pro-equivalent credits for the beta window (reuse `toggle-pro` or a `betaCredits` grant) so credit limits never block testing. A blocked tester = lost feedback.

---

## 3. Best-practice onboarding (grounded in onboarding-cro skill)

- **Time-to-value first.** From signup, one CTA: "Upload your first job video." No tour, no profile wizard before value.
- **Do, don't show.** The aha moment is their OWN job analyzed — not a demo. Demo data is the fallback only if they have no video.
- **Empty state = onboarding.** Dashboard with zero uploads should say "Upload a 60–90s walkthrough → get a work plan, Spanish crew sheet, and estimate," with the upload button right there.
- **Progress + celebration.** Mark activation visibly ("✅ First job analyzed"). Celebrate it — it's the habit anchor.
- **Stalled-user recovery.** Signed up but no upload in 48h → one nudge (email or WhatsApp via the crew group) reminding them of the 5-minute mission.

---

## 4. Privacy & data rules (hard constraints)

1. **No cross-user data.** A beta tester never sees another tester's info, uploads, estimates, or identity. Group replies are 1:1 in tone even though the channel is shared.
2. **No owner data without approval.** Never disclose Moshe's finances, other clients, pricing strategy, internal docs, VAWA/legal, or any personal info to testers without explicit per-case approval.
3. **Minimal disclosure by default.** Share only what advances _their_ test. When unsure, say less and ask Moshe.
4. **Beta is scoped to the current WhatsApp group only** until Moshe widens it.

---

## 5. Ops loop — health monitor + auto-fix agents

**Monitor (always-on, event-driven, cheap):** background probe of public surfaces every ~5 min — home page, `/api/health`, `/api/security-health`, `/api/pusher-health`, key authed pages (follow redirects; 2xx/3xx = OK, 4xx/5xx = anomaly). It stays silent until something breaks, then wakes the main agent. No token burn while green.

**Trigger sources for a "problem":**
- A monitor probe returns an unexpected 4xx/5xx or the home page stops serving.
- A beta tester reports something broken in the group.
- (Optional, needs `ADMIN_PASSWORD`) spikes in `/api/admin/errors`.

**Auto-fix:** on a confirmed problem, spawn a **site-fixer agent** (general-purpose, isolation: worktree) briefed with the best web skills (`web-app-building`, `frontend-ui-engineering`, `performance-optimization`, `cloudflare`/`workers-best-practices`, `browser-testing-with-devtools`). It reproduces, fixes minimally, verifies, and deploys (`git push` for site / `wrangler deploy` for API). Fixer prompt template lives at `ops/site-fixer-prompt.md`.

**Media in group:** any image/video a tester posts is captured by the WhatsApp bridge to disk, then analyzed with the `watch` skill (video) or native vision (image) to understand what they sent, whether it relates to a Video Brain job, and how to act — before replying.

---

## 6. Build order

1. ✅ Recon current system (done)
2. ✅ This plan
3. Health-monitor loop live (read-only, safe)
4. Site-fixer agent prompt template + spawn path
5. WhatsApp bridge: capture media → `watch`/vision analysis
6. Worker: add beta cohort fields + activation tracking (staged — needs deploy, review first)
7. Onboarding empty-state + first-upload CTA polish (staged)

Items 1–5 are safe/reversible and go in now. Items 6–7 touch production user data → propose diffs, get Moshe's OK, then deploy.
