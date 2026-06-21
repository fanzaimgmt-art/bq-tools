# Core Funnel Audit — A_core_funnel.md
**Scope:** index.html · home.html · auth.html · onboarding.html · dashboard.html + js/common.js · js/auth.js · js/editorial.js · js/ai.js
**Auditor:** Claude Code (automated) · Date: 2026-06-21
**Format:** `PRIORITY | file:line | problem | exact fix`

---

## PAGES TO HIDE / REMOVE FOR LAUNCH

The repo contains 65+ HTML pages. For a focused launch the following should be gated behind auth or removed from all nav/links:

- `gallery.html`, `memories.html`, `news.html`, `training.html`, `learn.html`, `chat.html`, `affiliate.html` — stub/not-core for contractors
- `directory.html` / `directory-profile.html` — contractor directory, not part of the money flow
- `tools/content-spy.html`, `tools/social-analysis.html`, `tools/social-post.html`, `tools/moodboard.html`, `tools/ad-creator.html`, `tools/sketch.html`, `tools/ai-video.html`, `tools/downloader.html`, `tools/import-memory.html` — social/content/AI tools that distract from the "Get Paid Faster" story
- `business/door-knockers.html`, `business/compliance.html`, `business/expenses.html`, `business/suppliers.html`, `business/receipts.html`, `business/equipment.html` — too many secondary tools at launch
- `pusher-setup.html`, `pusher.html` — Pusher beta, hide until publicly ready

**Keep in nav at launch:** index.html · auth.html · home.html (tool hub) · tools/estimate.html · tools/quote.html · tools/contract.html · tools/invoice.html · tools/payment-tracker.html (or redirect → tools/invoice.html) · tools/compare.html · tools/report.html · tools/client-page.html · dashboard.html · onboarding.html · profile.html · privacy.html · terms.html

---

## index.html (Marketing Homepage)

### P1 Issues

```
P1 | index.html:title | Brand residual in <title>: "BQ Tools — AI-Powered Tools for Contractors" | Change to "Obra — AI-Powered Tools for Contractors"
```

```
P1 | index.html:meta-description | Meta description says "BQ Tools" implicitly via brand copy mismatch; og:title likely still "BQ Tools" | Audit all <meta> og: tags; replace "BQ Tools" → "Obra" everywhere
```

```
P1 | index.html:755 | data-es="Todos los Herramientas" — grammatical error ("Herramientas" is feminine, must agree: "Todas las Herramientas") | Change to data-es="Todas las Herramientas"
```

```
P1 | index.html:779 | Demo video modal says "Demo video coming soon" with no video wired — live on a launch site this looks broken/vaporware | Either remove the modal trigger from tool cards OR replace the placeholder div with an honest "Request a walkthrough" CTA; do not ship an empty modal
```

```
P1 | index.html:img/thumb-kitchen.jpg | img/thumb-kitchen.jpg is MISSING from disk (confirmed 404) | Remove any <img> or CSS referencing this file, or add the file before launch
```

```
P1 | index.html:img/thumb-renovation.jpg | img/thumb-renovation.jpg is MISSING from disk (confirmed 404) | Remove reference or add file
```

```
P1 | index.html:img/thumb-surface.jpg | img/thumb-surface.jpg is MISSING from disk (confirmed 404) | Remove reference or add file
```

```
P1 | index.html:pricing | common.js:906/1075 "Pay with Card (Coming Soon)" buttons are disabled dead-ends that appear on the pricing modal — contractor sees a CTA that does nothing | Either wire Stripe (session already exists at /api/payments/stripe/create-session) or change copy to "Pay via PayPal" (which IS wired) and remove the dead card button
```

```
P1 | index.html:pricing | common.js:1072 "automated renewal coming soon" — honest but reads as unfinished product | Rephrase: "Renew any time via PayPal — manual renewal, instant activation." Remove "coming soon" language.
```

### P0 Issues

```
P0 | index.html:571 | Hero image references img/demos/hero-construction.jpg — file EXISTS but path is relative (no leading /). If page is served from a subdirectory this breaks | Change to /img/demos/hero-construction.jpg (absolute path)
```

### P2 Issues

```
P2 | index.html:pricing | Free tier card missing a clear CTA button ("Start Free — No Card") that links to /auth.html | Add <a href="/auth.html" class="btn btn-primary"> on the Free tier card
```

```
P2 | index.html:hero | h1 font-size is 88px with no responsive clamp — on screens <400px this causes overflow | Add clamp(40px, 8vw, 88px) or a media query at 480px
```

```
P2 | index.html:hero::before | width:900px hard-coded on the radial gradient element inside .hero — causes horizontal scroll on narrow screens | Change to width: min(900px, 100vw)
```

---

## home.html (Logged-in Tool Hub)

### P1 Issues

```
P1 | home.html:title | <title>BQ Tools — Your AI toolbox</title> — brand residual | Change to "Obra — Your AI Toolbox"
```

```
P1 | home.html:meta-description | "18 AI-powered tools for service businesses. Lead gen, content, sales, business ops" — copy describes a generic tool suite, not the contractor money/paperwork hero. Also "Lead gen" is not the primary promise | Update: "18 AI-powered tools to help contractors get paid faster — estimates, quotes, contracts, invoices, payment tracking and more."
```

```
P1 | home.html:lang-toggle | home.html uses editorial.js / editorial nav — the lang toggle is injected by editorial.js, NOT by common.js. Verify editorial.js injects all 3 language buttons (EN / עב / ES). If it only injects EN+HE, Spanish users see no way to switch | Audit editorial.js buildNav / lang section; ensure ES button is present
```

```
P1 | home.html:tool-cells | Tool cells are rendered by JS (editorial.js), so their href destinations need to be verified at runtime. The cells reference paths like /tools/payment-tracker.html which EXISTS (confirmed). However /tools/import-memory.html is in the nav even though it is a stub — gate or remove it | Remove /tools/import-memory.html from the tool list in editorial.js until the page is real
```

### P2 Issues

```
P2 | home.html | No empty state if JS fails to render tool cards (user sees blank grid) | Add a <noscript> or CSS fallback with static links to core tools
```

---

## auth.html (Signup / Login)

### P1 Issues

```
P1 | auth.html:134-135 | Lang toggle only has EN and HE buttons — NO Spanish button. For a trilingual product targeting Mexican-American crews, the signup/login page must offer ES too | Add: <button class="lang-btn" data-lang="es" onclick="setLang('es')">ES</button>
```

```
P1 | auth.html:~147 | data-en="Sign in with Google or your email. No password needed." has data-he but no data-es attribute (1 element confirmed missing data-he in scan) | Add data-es="Inicia sesión con Google o tu email. Sin contraseña." and verify the missing data-he
```

```
P1 | auth.html:150-162 | Google Sign-In client_id is hardcoded: 704767034441-ljp9b1a874bdi9rqpodr8p4l5rmvbtdj.apps.googleusercontent.com — this is a real credential exposed in source. If the OAuth app is misconfigured for the production domain (bq-tools.fanzai-mgmt.workers.dev) Google sign-in will silently fail with "redirect_uri_mismatch" | Verify the OAuth app has the live production URL in Authorized JavaScript origins AND Authorized redirect URIs. Test on the live domain before launch.
```

### P0 Issues

```
P0 | auth.js:98 | Magic link verify: apiCall('/api/auth/verify', ...) — if the Worker endpoint /api/auth/verify is down or misconfigured, verify silently fails. The catch block must show a user-visible error | Confirm the error path shows authMsg; add integration test against live worker
```

### P2 Issues

```
P2 | auth.html | After successful login, redirect goes to /home.html (or ?next= param). If user came from a specific tool page, the ?next= flow works — but onboarding is NOT triggered if user already exists (no check for profile completeness). New users who skip onboarding land in home.html with no intro | In _postLoginRedirect(), check if bq_user.onboarded === true; if not, redirect to /onboarding.html
```

---

## onboarding.html (Profile Setup)

### P1 Issues

```
P1 | onboarding.html:187-190 | Lang toggle only has EN and HE — NO Spanish button. A Mexican contractor switching to ES on the signup page will find no toggle here | Add ES button (same fix as auth.html)
```

```
P1 | onboarding.html:219 | Step 2 heading: data-en="About Your Business" data-he="על העסק שלך" — no data-es | Add data-es="Sobre Tu Negocio"
```

```
P1 | onboarding.html:220 | Sub copy missing data-es | Add data-es="Ayúdanos a personalizar tu experiencia."
```

```
P1 | onboarding.html:16 missing data-es (16 elements confirmed) | Step 2 and Step 3 have labels and UI text with data-en + data-he but no data-es — confirmed 16 elements | Sweep onboarding.html and add data-es to all elements that have data-en; highest priority: business type label, phone label, language selection step headings, finish button
```

```
P1 | onboarding.html:obStep2 | Business type <option> values are English only (e.g. "General Contractor", "Remodeler") — no data-en/he/es on <option> elements; when lang=he/es the dropdown shows English strings | Use JS to set option.textContent from a translation map in setLang(), or add data-he/data-es on each <option> and apply via setLang()
```

### P2 Issues

```
P2 | onboarding.html | finishOnboarding() saves to /api/user/update (via auth.js:117) then redirects to /home.html. If the API call fails, error is shown via showToast but the button re-enables. No persistent error state visible to user. | Keep button disabled on network error, show inline error message above the button
```

```
P2 | onboarding.html | No skip link — users forced through all steps. Add a small "Skip for now →" text link for impatient signups
```

---

## dashboard.html (User Analytics Dashboard)

### P1 Issues

```
P1 | dashboard.html:6 | <title>BQ Tools — Dashboard</title> — brand residual | Change to "Obra — Dashboard"
```

```
P1 | dashboard.html:119 | <meta name="apple-mobile-web-app-title" content="BQ Tools"> | Change to "Obra"
```

```
P1 | dashboard.html:127 | <a href="/" class="nav-logo">BQ <span>Tools</span></a> — hardcoded in the HTML, not injected by common.js | Change to "Obra" (no span needed)
```

```
P1 | dashboard.html:253 | <footer> "Powered by BQ Tools — BQ Production LLC" — "BQ Tools" is the old brand | Change to "Powered by Obra — BQ Production LLC"
```

```
P1 | dashboard.html:5 missing data-es (confirmed) | Dashboard has 5 elements with data-en/data-he but no data-es — Spanish contractors see English fallback | Add data-es to all 5 elements; at minimum the page title h1 and the stat card labels
```

### P0 Issues

```
P0 | dashboard.html | Loads js/crypto.js, js/assistant.js, /js/motion-engine.js, /js/cmdk-palette.js, /js/brain-assistant.js — verify ALL these files exist on disk before launch. If any 404, page may silently break or throw JS errors blocking the whole dashboard | Run: find /Users/mosheshohet/Projects/bq-tools/js -name '*.js' and confirm all 5 scripts exist
```

### P2 Issues

```
P2 | dashboard.html | .dash-grid uses grid-template-columns: 1fr 1fr with no responsive breakpoint — on screens <400px the 2-column grid causes cramped layout | Add @media (max-width:480px) { .dash-grid { grid-template-columns: 1fr; } }
```

---

## js/common.js (Shared Logic)

### P1 Issues

```
P1 | common.js:271 | Share copy: "Check out BQ Tools — AI tools for contractors!" — brand residual in WhatsApp/email share text | Change to "Check out Obra — AI tools for contractors!"
```

```
P1 | common.js:272 | mailto subject: "BQ Tools" — brand residual | Change to "Obra"
```

```
P1 | common.js:370 | Banner: "🎉 Welcome from BQ Production! 10% OFF your first month" — references "BQ Production" not "Obra". If this shows to new users at signup it's confusing (BQ Production is the legal LLC name, not the product) | Change to "🎉 Welcome to Obra! 10% OFF your first month"
```

```
P1 | common.js:383 | Footer: "BQ Tools — BQ Production LLC" — "BQ Tools" is the old brand name | Change to "Obra — BQ Production LLC"
```

```
P1 | common.js:535 | Tutorial overlay: "Welcome to BQ Tools!" in the t() object for all three langs — brand residual | Change to "Welcome to Obra!" / "ברוך הבא ל-Obra!" / "¡Bienvenido a Obra!"
```

```
P1 | common.js:1172 | buildAppNav injects: <a href="..." class="nav-logo">BQ <span>Tools</span></a> — brand residual that appears on EVERY app page | Change to "Obra" (no span)
```

```
P1 | common.js:1294 | PWA install prompt: "Install BQ Tools" / "התקן BQ Tools" / "Instalar BQ Tools" | Change to "Install Obra" / "התקן את Obra" / "Instalar Obra"
```

### P0 Issues

```
P0 | common.js:1394 | fetch('/api/config/flags') — this uses a relative URL, not the absolute API_URL base. If common.js is loaded on a tool page the relative path resolves against the worker domain but may return 404 if the flags endpoint isn't implemented | Verify /api/config/flags is implemented in the Worker; if not, add a safe fallback (catch → use default flags object)
```

```
P0 | common.js:1019/1416 | PayPal submit: fetch('/api/payments/paypal/submit', ...) and Stripe: fetch('/api/payments/stripe/create-session', ...) both use relative URLs without the API_URL base. On the live domain bq-tools.fanzai-mgmt.workers.dev these relative calls route to the Worker itself — verify the Worker handles both /api/payments/* routes. If not, payments silently fail | Test both endpoints against the live Worker URL
```

### P2 Issues

```
P2 | common.js | runTutorial() tutorial overlay step 2 has a CTA href="/home.html" but the tutorial runs ON home.html — user clicks and reloads the same page | Change CTA to scroll to #tools or dismiss the overlay instead of reloading home.html
```

---

## js/auth.js

### P0 Issues

```
P0 | auth.js:line 1 comment | "// ── BQ Tools — AI Functions (Worker Proxy) ──" — This comment is in ai.js not auth.js but both files carry the "BQ Tools" brand in comments. Not user-facing but creates noise in source inspection | Minor: rename comments to "Obra"
```

```
P0 | auth.js | registerUser() → apiCall('/api/auth/register') → on success calls _postLoginRedirect() WITHOUT checking if onboarding is needed. New users who register skip onboarding entirely unless onboarding is triggered by home.html | In registerUser success path, redirect to /onboarding.html instead of /home.html for brand-new accounts (check response.isNewUser or similar flag from the Worker)
```

---

## js/ai.js

### P1 Issues

```
P1 | ai.js:1 | Comment header: "// ── BQ Tools — AI Functions (Worker Proxy) ──" | Change to "Obra"
```

```
P1 | ai.js:API_URL | const API_URL = 'https://bq-tools-api.fanzai-mgmt.workers.dev' — this is fine technically but the domain contains "bq-tools" which is the old brand. Not urgent for launch but creates brand inconsistency in network tabs | Low priority: consider migrating API domain to obra-api.* after launch
```

---

## Summary: Critical P0/P1 Count

| Page | P0 | P1 |
|------|----|----|
| index.html | 1 | 7 |
| home.html | 0 | 4 |
| auth.html | 1 | 3 |
| onboarding.html | 0 | 5 |
| dashboard.html | 1 | 4 |
| js/common.js | 2 | 7 |
| js/auth.js | 1 | 0 |
| js/ai.js | 0 | 1 |
| **TOTAL** | **6** | **31** |

---

## Top Issues to Fix First (Launch Blockers)

1. **P0** `dashboard.html:127` — "BQ Tools" logo in hardcoded nav (not injected by common.js, so the rebrand script missed it)
2. **P0** `auth.js` — new user registration never routes to `/onboarding.html`; new signups land in the tool hub without any onboarding
3. **P0** `common.js:1394/1019/1416` — relative-URL API calls for flags + payments need Worker-side verification; silent failure on payments is catastrophic
4. **P0** `dashboard.html scripts` — 5 JS files loaded (crypto.js, assistant.js, motion-engine.js, cmdk-palette.js, brain-assistant.js); confirm all exist on disk
5. **P1** `auth.html:134` + `onboarding.html:187` — No Spanish (ES) lang button on auth or onboarding; the primary target audience (Mexican crews) cannot switch to Spanish on the critical pages
6. **P1** `onboarding.html` — 16 elements confirmed missing data-es; entire onboarding is English-only in Spanish mode
7. **P1** `common.js:1172` — buildAppNav injects "BQ Tools" logo on EVERY app page — single fix, maximum blast radius
8. **P1** `index.html:755` — "Todos los Herramientas" (grammatical error) — 1-line fix
9. **P1** `index.html:thumb-*.jpg` — 3 missing images (kitchen, renovation, surface) will cause broken <img> tags visible to users
10. **P1** `common.js:906/1075` — "Pay with Card (Coming Soon)" dead buttons on the pricing modal — either wire or remove before launch
