# Audit E — Legal/Support Pages + Global Cross-Cutting Consistency
**Scope:** privacy.html, terms.html, refund.html, ai-disclaimer.html, contact.html, affiliate.html, payment-success.html, job-status.html + js/common.js, style.css, css/editorial.css + global greps across all HTML/JS/CSS.
**Date:** 2026-06-21

---

## FORMAT: `PRIORITY | file:line | problem | exact fix`

---

## SECTION 1 — BRANDING: Leftover User-Facing "BQ" (not "BQ Production LLC")

P1 | tools/sketch.html:67 | Nav logo reads `BQ Tools` instead of `Obra` | Change `<a href="/" class="nav-logo">BQ <span>Tools</span></a>` → `<a href="/" class="nav-logo">Obra</a>`

P1 | tools/pusher.html:645 | Nav logo reads `BQ — pusher` | Change `<a href="/" class="logo">BQ <span class="gold">— pusher</span></a>` → `<a href="/" class="logo">Obra <span class="gold">— Pusher</span></a>`

P1 | tools/pusher.html:842 | Footer reads `BQ — pusher` | Change `<div class="foot-brand">BQ <span>— pusher</span></div>` → `<div class="foot-brand">Obra — Pusher</div>` (or inject from common.js buildFooter)

P1 | tools/pusher.html:583 | CSS pseudo-element content: `content: 'BQ'` (watermark) | Change `content: 'BQ'` → `content: 'Obra'` or `content: none`

P1 | tools/pusher.html:8 | `<meta name="author" content="BQ Production · Moshe Shohet" />` — personal name in meta | Change to `<meta name="author" content="BQ Production LLC" />`

P1 | js/common.js:1 | File header comment `// ── BQ Tools — Shared Common JS ──` — not user-facing but inconsistent internal branding | Change to `// ── Obra — Shared Common JS ──`

P2 | js/common.js:370 | Welcome toast says "Welcome from BQ Production! 10% OFF your first month" — arguably fine as legal entity name, but the "Welcome from" phrasing sounds like an internal team message | Change EN text to `🎉 Welcome to Obra Pro! 10% OFF your first month` (BQ Production is legal entity only, not a brand users know)

P2 | home.html:235,242 | CSS comments reference "BQ watermark" — dev notes only, not user-facing | Acceptable as comments; clean up before open-sourcing

---

## SECTION 2 — CONTACT INFO: Fake/Invented/Inconsistent

P1 | contact.html:83 | `@bq_music` social handle displayed — this is Moshe's music handle, not the Obra/BQ Production business handle | Either remove or replace with a dedicated business handle (or mark clearly as owner contact). Inconsistent with the Obra brand.

P1 | contact.html:89 | `bqprod.pages.dev` listed as portfolio URL — not an Obra product URL, it's a dev subdomain | Replace with the real production URL (`bqtools.dev` or the live workers.dev URL) or remove if not launch-ready.

P1 | privacy.html:171, refund.html:88, terms.html:148,185, js/common.js:895,1063 | Support email is `fanzai.mgmt@gmail.com` — a FanzAI internal Gmail address displayed publicly as the Obra support contact. Looks unprofessional and inconsistent for a construction contractor tool. | Replace everywhere with a dedicated support address (e.g. `support@obra.ai` or `hello@obra.ai`). All 6 locations must use the same address.

P1 | contact.html (social section) | `@bq_music` is an Instagram/Twitter music handle — completely wrong brand context for a B2B contractor tool | Remove or replace with `@obra_app` or correct business handle

P2 | tools/pusher.html:10,13 | OG meta URLs still point to `bq-tools.fanzai-mgmt.workers.dev` (the dev deployment URL) | Update OG `og:url` and `og:image` to production domain once domain is set

---

## SECTION 3 — DESIGN TOKENS: Hardcoded Colors Bypassing CSS Variables

**style.css:**

P2 | style.css:668 | `background: #1a1a1f` (nav dropdown) — hardcoded, bypasses `--sf-2` | Change to `background: var(--sf-2)`

P2 | style.css:722 | `.nav-dd-item:hover { background: #2a2a2f; }` — hardcoded, bypasses `--sf` or `--bd` | Change to `background: var(--sf)` or `var(--bd)`

**css/editorial.css:**

P2 | css/editorial.css:53 | `.ed-cursor-dot { background: #fff; }` — hardcoded white | Change to `background: var(--tx)` or `var(--bg)` depending on intent

P2 | css/editorial.css:251 | `.ed-tag.free { color: #4ade80; background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.25); }` — green hardcoded | Add `--green: #4ade80` to `:root` in style.css and use `color: var(--green)` etc.

**Inline styles in HTML (tool pages — outside audit scope but flagged globally):**

P2 | tools/video-brain.html:466,487,496 | `background:#25D366;border-color:#25D366` (WhatsApp green) inline | Acceptable (brand color) — but add `--whatsapp: #25D366` to tokens and use it

P2 | tools/sketch.html:92–95 | Inline `background:#222`, `#ff6b6b`, `#74b9ff`, `#51cf66` | Use CSS variables `--sf`, `--red`, `--info`, `--green`

P2 | tools/invoice.html:486,497 | Inline `color:#666`, `color:#2d9a43` | Use `color:var(--txd)`, `color:var(--green)`

P2 | tools/pusher.html:1016 | Inline `color:#4ade80` | Use `color:var(--green)` (once defined)

---

## SECTION 4 — FONT DECLARATIONS

P2 | css/editorial.css:37 | `font-family: 'Rubik', 'Inter', system-ui, sans-serif !important` — raw font names, not CSS tokens | Change to `font-family: var(--font-he), var(--font-en), system-ui, sans-serif !important`

P2 | tools/pusher.html:126 | `.topnav .logo .gold { font-family: 'DM Sans', sans-serif; }` — raw font name not in design system tokens | Change to `var(--font-display)` (Manrope) or add `--font-pusher: 'DM Sans', sans-serif` to tokens

**Font imports — no conflicts found.** All pages load fonts via style.css (Google Fonts import in style.css). editorial.css does not duplicate the import. No conflicting font import chains detected.

---

## SECTION 5 — i18n: Pages Missing Language Switching

**All HTML files load either common.js or i18n-lite.js — no dead i18n pages found.**

However, there are **two missing Spanish lang buttons** across legal pages:

P1 | privacy.html:39–40, terms.html:39–40, refund.html:44–45 | Lang toggle only has EN/עב buttons — Spanish (ES) button missing | Add `<button class="lang-btn" data-lang="es" onclick="setLang('es')">ES</button>` to all three pages. The content has `data-es` attributes but the toggle button to activate Spanish is absent.

P1 | affiliate.html:55–56 | Same issue — EN/עב only, no ES button | Add ES button

**job-status.html — i18n note:** loads only `i18n-lite.js` (not common.js), which is correct for a standalone public link page. No nav needed. OK.

**payment-success.html — i18n note:** loads common.js but no explicit lang toggle in the nav (nav is injected by buildAppNav). Common.js-injected nav includes the lang toggle, so this is OK.

---

## SECTION 6 — BROKEN / MISSING ASSETS

**All JS files referenced exist on disk:**
- `js/assistant.js` ✅
- `js/brain-assistant.js` ✅
- `js/motion-engine.js` ✅
- `js/cmdk-palette.js` ✅

**No 404 broken file references detected** from static analysis. All `src=` and `href=` references point to files that exist in the project.

P1 | tools/pusher.html:10,13 | OG image `https://bq-tools.fanzai-mgmt.workers.dev/img/pusher-og.png` — file `img/pusher-og.png` needs to exist in repo | Verify `img/pusher-og.png` exists; if not, create it or remove the OG image meta tag.

---

## SECTION 7 — LEGAL PAGES: Coherence Check

### privacy.html
- Mentions "Obra" and "BQ Production LLC" correctly (line 49: `BQ Production LLC ("Obra," "we," "us," or "our")`) ✅
- Contact email: `fanzai.mgmt@gmail.com` — see Section 2 issue ⚠️
- Language switching: EN/עב only (no ES button) — see Section 5 ⚠️
- Loads common.js ✅
- Content is coherent and real (GDPR/CCPA language, data types described) ✅

### terms.html
- Mentions "Obra" and "BQ Production LLC" correctly ✅
- Contact email: `fanzai.mgmt@gmail.com` — see Section 2 ⚠️
- DMCA contact: `fanzai.mgmt@gmail.com` — see Section 2 ⚠️
- Language switching: EN/עב only ⚠️
- Loads common.js ✅
- Content: real ToS (service description, Pro subscription $14.99/mo, prohibitions, termination, DMCA) ✅
- P2 | terms.html:79 | Pro subscription described as "50 credits per month for $14.99/month" — verify this matches the actual credit amounts in payment-success.html (which shows credits_25/$4.99, credits_60/$9.99, credits_150/$19.99, pro_monthly/$14.99). The "$14.99 = 50 credits" should match the actual Pro tier credit amount.

### refund.html
- Mentions "Obra" ✅; footer "Obra — BQ Production LLC" ✅
- Contact email: `fanzai.mgmt@gmail.com` ⚠️
- Language switching: EN/עב only ⚠️
- Loads common.js ✅
- Content: real refund policy (no refunds on AI credits once used, case-by-case for technical failures) ✅

### ai-disclaimer.html
- Mentions "Obra" ✅
- Loads common.js ✅
- Content: real AI disclaimer ✅
- No explicit BQ Production LLC footer visible from grep — verify footer is injected by buildFooter ✅ (common.js injects `© 2026 BQ Production LLC`)

### contact.html
- Nav: Obra ✅; footer: "BQ Production LLC" ✅
- Contact email: `fanzai.mgmt@gmail.com` ⚠️ (see Section 2)
- `@bq_music` handle ⚠️ (see Section 2)
- `bqprod.pages.dev` portfolio URL ⚠️ (see Section 2)
- Loads common.js ✅

### affiliate.html
- "Powered by Obra — BQ Production LLC" ✅
- All body copy correctly references "Obra" ✅
- EN/עב only lang buttons ⚠️
- Loads common.js ✅
- PayPal payout email input placeholder `your@paypal.com` — OK, this is a form input placeholder not a real address ✅

### payment-success.html
- Title/nav: Obra ✅; footer: "© 2026 BQ Production LLC" ✅
- Loads common.js ✅
- Transaction ID input placeholder `e.g. 5ML65651RH787232V` — looks like a real PayPal format; acceptable ✅
- P0 | payment-success.html:100 | "Pay Now" flow depends on user manually entering PayPal transaction ID after paying — this is a manual verification workaround. The button label "I've Paid on PayPal" implies the full payment flow. No Stripe or real payment gateway. This is a P0 **functional gap** for launch if contractors are expected to pay via the platform. Document clearly as "manual verification" or wire real payment. Currently relies on `fanzai.mgmt@gmail.com` to process — operator must be notified of each payment.

### job-status.html
- Title: "Job Status — Obra" ✅
- Brand mark: "Obra · Powered by BQ Production" ✅
- Loads i18n-lite.js ✅ (standalone public page — correct)
- P1 | job-status.html:370–380 | "Pay Now" button is `mailto:` fallback with comment "placeholder for future Stripe link". Visible text says `Online payments coming soon` — this is a known placeholder but it appears on a page shown to the contractor's customers. Flag for launch decision: either hide the Pay Now section entirely or ship with "coming soon" copy. Currently the copy correctly says "coming soon" so user-facing text is honest ✅, but the button triggers a mailto which may confuse homeowners.

---

## SECTION 8 — MISCELLANEOUS GLOBAL

P1 | privacy.html:49 | Domain in policy text is `bq-tools.fanzai-mgmt.workers.dev` — the dev/staging URL. If a production domain exists, update to the production URL.

P0 | js/common.js:895, 1063 | "Card payment" button in payment modal links to `mailto:fanzai.mgmt@gmail.com?subject=Card%20Payment%20Request` — card payment is not implemented; this is a mailto workaround. If shown to real users, it's P0 missing functionality. Must either wire real Stripe card processing or remove the card payment option from the UI.

P2 | tools/pusher.html:126 | `font-family: 'DM Sans', sans-serif` — DM Sans is not loaded anywhere in the project (no Google Fonts import for it found). This means the font falls back to `sans-serif`. Either add DM Sans import or change to `var(--font-display)` (Manrope).

---

## SUMMARY TABLE

| Priority | Count | Categories |
|----------|-------|-----------|
| P0 | 2 | Payment not wired (common.js card button, payment-success manual flow) |
| P1 | 10 | BQ branding leftovers (sketch, pusher), wrong support email (fanzai.mgmt), wrong social handle (@bq_music), wrong portfolio URL, missing ES lang button on 4 legal pages, dev domain in privacy policy |
| P2 | 12 | CSS token bypasses (style.css:668,722; editorial.css:53,251), font-family raw strings (editorial.css:37, pusher.html:126), DM Sans not loaded, pro credit amount mismatch in terms, welcome toast phrasing |

---

*Report generated: 2026-06-21. Covers legal+support pages and global cross-cutting checks.*
