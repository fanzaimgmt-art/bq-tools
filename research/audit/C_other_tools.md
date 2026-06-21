# Audit C — Other Tools Triage
_Scope: tools/ excluding video-brain, estimate, quote, invoice, contract, report, analysis (covered by other agents)_

---

## Classification Table

| File | What it does | API wired? | Classification |
|------|-------------|-----------|----------------|
| **ad-creator.html** | Multi-step wizard: upload job photos + logo → AI writes description → generates a 15s/30s video ad with voiceover (Kinovi + TTS). Contractor-facing ("Before/after, finished work, team in action"). | ✅ Wired: `/api/ad-creator/suggest-description`, `/api/ad-creator/generate`, `/api/tts/generate`, `/api/kinovi/create`, `/api/kinovi/status` | **LAUNCH** |
| **ai-video.html** | Text-to-video & image-to-video via Seedance 2 (Kinovi). Prompt placeholder literally says "A contractor power-washing a driveway." History stored in localStorage. | ✅ Wired: `/api/kinovi/create`, `/api/kinovi/status` | **SECONDARY** (overlaps ad-creator; generic, not guided for contractors) |
| **client-page.html** | Static client-facing portal page. Shows contractor's info + job status to the homeowner. No API calls — read-only display from localStorage/passed data. | ❌ No API calls — pure display stub | **SECONDARY** (useful concept, but needs backend before it's real) |
| **compare.html** | Before/after image compare slider (drag to reveal). AI analysis button calls `/api/compare` with credit confirmation. Download as PNG. | ✅ Wired: `/api/compare` (AI Analysis button, credit-gated) | **SECONDARY** (visual tool, contractor would use it to show clients before/after — useful but not core money flow) |
| **content-spy.html** | Scrapes an Instagram/Facebook username for posts, scores them, lets user save to moodboard. Wired to `/api/content/scan`. Framed as competitor research for contractors ("@goldremodeling"). | ✅ Wired: `/api/content/scan`, `/api/content/moodboard`, `/api/content/save` | **HIDE** — Instagram-scraping tool; a remodeling contractor has zero reason to "spy on competitor content." It's an influencer/marketing-agency tool. Confusing and legally grey. |
| **downloader.html** | Downloads TikTok, Instagram Reels, YouTube Shorts without watermark. "Paste a competitor's viral TikTok → get the clean video to remix or study." Wired to `/api/downloader/get`. | ✅ Wired: `/api/downloader/get` | **HIDE** — Pure influencer/creator tool. A plumber or roofer has no use for this. Legal risk (DMCA). Contractor will be confused. |
| **import-memory.html** | Upload ChatGPT or Claude memory export → AI parses it into "contractor-ready business knowledge" → saves to AI brain. Wired to `/api/brain/import-memory` + `/api/brain/save-imported-memory`. | ✅ Wired | **HIDE** for launch — niche power-user feature (requires knowing what "AI memory export" means). Zero contractor will understand or use this at Day 1. Hide from nav; can exist as a URL. |
| **moodboard.html** | Saved inspiration board that feeds from content-spy. "Turn it into your next post." Wired to `/api/content/moodboard`. | ✅ Wired (but depends on content-spy) | **HIDE** — companion to content-spy (also hidden). Instagram-inspiration concept, not contractor work management. |
| **pusher.html** | Separate standalone product: "Obra Pusher — Facebook leads, drafted for you." AI scans FB groups for buyer-intent posts, drafts Telegram replies daily. Has its own landing page, pricing ($20/mo beta), Telegram onboarding wizard. Still has "BQ — pusher" branding in nav logo and footer. | ✅ Wired to `bq-tools-api.fanzai-mgmt.workers.dev` | **HIDE** — This is a separate product, not a tool inside Obra. Has its own landing page and pricing. Showing it in the Obra nav confuses the contractor UX. Keep it alive as a standalone URL; remove from Obra tools nav entirely. Branding is also broken (BQ not Obra). |
| **pusher-setup.html** | 4-step onboarding wizard for Pusher (business name, FB groups, Telegram, schedule). Wired to `bq-tools-api.fanzai-mgmt.workers.dev`. | ✅ Wired | **HIDE** — Companion to pusher.html. Same reason: separate product, not an Obra contractor tool. |
| **review.html** | Generates a Google/Yelp review-request message for the contractor to send their client after job completion. Uses AI (WorkerAI). Opens in WhatsApp. Fully Obra-branded. No API beyond WorkerAI (uses `js/ai.js`). | ✅ Wired via `callWorkerAI` | **LAUNCH** — Core contractor workflow: job done → ask client for review. Simple, fast, high value. |
| **sketch.html** | Draw or upload a rough floor plan → AI cleans it into a sharp blueprint. Also generates a visual rendering (5 credits via Nanobanana). Wired to `/api/nanobanana/generate` + status. Contractor-scoped placeholder: "Floor plan for kitchen extension, 12x14 feet." **P1: nav logo still reads "BQ Tools" (line 67).** | ✅ Wired: `/api/nanobanana/generate`, `/api/nanobanana/status` | **LAUNCH** — High-value for remodelers, ADU, kitchen/bath. Shows a contractor is serious. |
| **social-analysis.html** | Enter an Instagram or Facebook URL → AI analyzes the profile and gives marketing recommendations. Wired to `/api/social/analyze`. Explicitly analyzes IG/FB followers, engagement, content gaps. | ✅ Wired: `/api/social/analyze` | **HIDE** — Pure influencer/marketing-agency tool. Contractor will be baffled by "Enter your Instagram URL" as a business tool. Even if you reframe it as "analyze your business page," it's not in the top-10 things a roofer or plumber cares about on launch day. |
| **social-post.html** | Upload before/after photo → AI writes Instagram/LinkedIn/Facebook caption + optional AI promo image (Nanobanana). Framed as contractor tool. Download filename is `bq-promo.png` (P1 bug). | ✅ Wired: `callWorkerAI`, `/api/nanobanana/generate` | **SECONDARY** — Legitimately useful for contractors who post their work online, but not core to "Get Paid Faster." De-emphasize in nav. |

---

## Summary

| Classification | Tools |
|---------------|-------|
| **LAUNCH** | ad-creator, review, sketch |
| **SECONDARY** | ai-video, client-page, compare, social-post |
| **HIDE** | content-spy, downloader, import-memory, moodboard, pusher, pusher-setup, social-analysis |

---

## P0 / P1 Punch List

### ad-creator.html
- P1 | tools/ad-creator.html:6 | `<title>` still reads "BQ Tools — Auto Ad Creator" (apple-mobile-web-app-title on line 12 fixed to "Obra" but browser tab is wrong) | Change `<title>` to "Obra — Auto Ad Creator"
- P1 | tools/ad-creator.html:341 | Footer reads "Powered by Obra — BQ Production LLC" — "BQ Production LLC" is the legal entity, this is acceptable per brief, but confirm legal section exclusion applies here

### review.html
- P1 | tools/review.html:93 | Footer reads "Powered by Obra — BQ Production LLC" — same as above, confirm acceptable
- P1 | tools/review.html:88 | WhatsApp button only shows when `data-phone` is present; if phone is missing, button stays hidden with no error message — contractor sees a dead UI
- P1 | tools/review.html:55 | Missing `data-es` on `<h1>` (only `data-en` + `data-he`) — Spanish falls back to English

### sketch.html
- **P1** | tools/sketch.html:67 | Nav logo reads `BQ <span>Tools</span>` — visible brand leak; all other pages say "Obra" | Change to `Obra`
- P1 | tools/sketch.html:127 | Download link `download="bq-visual.png"` — visible "bq-" in downloaded filename | Change to `obra-visual.png`
- P1 | tools/sketch.html:79 | Missing `data-es` on `<p class="page-sub">` — Spanish falls back to English

### social-post.html (SECONDARY — fix before enabling in nav)
- **P1** | tools/social-post.html:104 | `download="bq-promo.png"` — visible "bq-" brand leak in downloaded filename | Change to `obra-promo.png`
- P1 | tools/social-post.html:67 | Missing `data-es` on `<h1>` — no Spanish translation
- P1 | tools/social-post.html:6 | `<title>` reads "BQ Tools — Social Post Generator" | Fix to "Obra — Social Post Generator"

### ai-video.html (SECONDARY)
- P1 | tools/ai-video.html | `localStorage.getItem('bq_kinovi_history')` — internal key named "bq_" is fine (not user-visible), but watch for any UI text that echoes "BQ"
- P1 | tools/ai-video.html | No `data-es` on several inner UI strings (Settings section) — Spanish partially falls back

### compare.html (SECONDARY)
- P1 | tools/compare.html:502 | `download="bq-compare-export.png"` — visible "bq-" brand leak | Change to `obra-compare-export.png`
- P1 | tools/compare.html:281 | Footer text "Powered by Obra — BQ Production LLC" (acceptable per brief if legal entity OK)

### client-page.html (SECONDARY)
- P0 | tools/client-page.html | Zero API calls — page is a static display stub with no data source; contractor cannot actually use it to show a client live job status | Needs backend before being shown to users
- P1 | tools/client-page.html:115 | Footer "Powered by Obra — BQ Production LLC" — acceptable

### HIDE targets — branding leaks that matter if pages ever get shared
- **P0** | tools/pusher.html:645 | Nav logo reads "BQ — pusher" (user-visible) — this page is publicly linked; if a contractor stumbles here it destroys the Obra brand | Change to "Obra — Pusher" or remove from Obra nav
- P1 | tools/pusher.html:846 | `href="mailto:music.iambq@gmail.com"` — personal music email exposed on a contractor product page | Replace with support email
- P1 | tools/pusher.html:859 | `const API = 'https://bq-tools-api.fanzai-mgmt.workers.dev'` — old API domain hardcoded (not an Obra domain) | Update if/when domain changes
- P1 | tools/pusher-setup.html:258 | Same old API hardcode as pusher.html

---

## Notes for Launch
- **3 tools are LAUNCH-ready** (ad-creator, review, sketch) — all wired to API, all contractor-scoped, all need minor P1 fixes only (brand string in sketch nav, missing data-es in review/sketch, bq-* download filenames)
- **4 tools are SECONDARY** — keep alive as URLs, remove from primary nav grid, fix before highlighting
- **7 tools must be hidden from nav** — content-spy, downloader, import-memory, moodboard, pusher, pusher-setup, social-analysis are either influencer tools, separate products, or power-user features that will confuse contractors on Day 1
- **Pusher is a separate product** and should be unlinked from the Obra tools nav entirely; it has its own landing page and pricing
