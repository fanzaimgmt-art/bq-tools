# Obra — Paid Tools Audit: B_paid_tools.md
**Scope:** video-brain.html, estimate.html, quote.html, invoice.html, payment-tracker.html, contract.html, report.html + api/worker.js  
**Date:** 2026-06-21  
**Format:** `SEVERITY | file:line | problem | exact fix`

---

## P0 — BROKEN (must fix before any launch)

### payment-tracker.html
```
P0 | payment-tracker.html:260,703 | /invoices GET and /invoice-reminder POST called against hardcoded https://bq-tools-api.fanzai-mgmt.workers.dev — neither route exists in worker.js | Add GET/POST /api/invoices and POST /api/invoice-reminder handlers to worker.js; switch HTML to use shared API_URL constant from js/ai.js
```

---

## P1 — EMBARRASSING FOR LAUNCH

### Auth gating — 5 tools unprotected
```
P1 | video-brain.html | No upfront isLoggedIn() check — relying on 401 redirect only; user sees a blank tool then gets kicked out | Add: if (!isLoggedIn()) window.location.replace('/auth.html?next=' + encodeURIComponent(window.location.pathname)) at top of <script>
P1 | estimate.html   | Same — no upfront auth gate | Same fix
P1 | quote.html      | Same — no upfront auth gate | Same fix
P1 | invoice.html    | Same — no upfront auth gate | Same fix
P1 | report.html     | Same — no upfront auth gate | Same fix
P1 | contract.html:118 | Auth redirect missing ?next= parameter — user loses their place after login | Change to: window.location.replace('/auth.html?next=' + encodeURIComponent(window.location.pathname))
```

### Video Brain — raw debug pane leaks
```
P1 | video-brain.html:291-303 | .vb-raw-debug CSS class renders raw JSON in a monospace pre-wrap box when parse fails (.vb-parse-fail path) — raw API response shown to contractor | Gate with: only show if window.OB_DEBUG === true; otherwise show a friendly "Analysis failed — try again" message
```

### i18n — Spanish missing across multiple tools
```
P1 | report.html:88         | data-en="📄 Quick Report" + data-he present, NO data-es | Add data-es="📄 Informe Rápido"
P1 | report.html:108        | data-en="Client Name (optional)" + data-he, NO data-es | Add data-es="Nombre del cliente (opcional)"
P1 | report.html:111        | data-en="Describe the work" + data-he, NO data-es | Add data-es="Describe el trabajo"
P1 | report.html:123        | data-en="📥 Download PDF" + data-he, NO data-es | Add data-es="📥 Descargar PDF"
P1 | payment-tracker.html:107 | data-en="💳 Payment Tracker" + data-he, NO data-es | Add data-es="💳 Rastreador de Pagos"
P1 | payment-tracker.html:108 | page subtitle — data-he present, NO data-es | Add data-es translation
P1 | payment-tracker.html (modal labels) | Client Name, Overdue, Collected labels — NO data-es | Add data-es to all modal field labels
P1 | contract.html:67       | data-en="📜 Contract Generator" + data-he, NO data-es | Add data-es="📜 Generador de Contratos"
P1 | contract.html:68       | page-sub text — data-he present, NO data-es | Add data-es translation
P1 | invoice.html:162       | <div id="outstandingCount">0 invoices</div> — "invoices" hardcoded English, no data-* | Render count in JS with translated suffix per current lang
```

### Error handling — raw error strings shown to users
```
P1 | report.html:239-242 | showToast('Error: ' + err.message) exposes raw JS error message to users (e.g. "TypeError: Cannot read properties of undefined") | Replace with: showToast(t('error_generic') || 'Report generation failed. Please try again.')
P1 | estimate.html      | Errors shown only as transient toast — disappears after seconds; no persistent inline error div | Add a <div class="tool-error" hidden> below the submit button that stays visible
P1 | quote.html         | Same — toast only, no persistent error state | Same fix
P1 | contract.html      | Same — toast only | Same fix
```

### Hardcoded fake names (not generic placeholders)
```
P1 | payment-tracker.html:152 | placeholder="Sarah Johnson" — specific fake name visible in empty form | Replace with: placeholder="e.g. Client name" (localized)
P1 | contract.html:115        | placeholder="John Smith" — specific fake name | Replace with: generic descriptor
```

---

## P2 — POLISH

### Design tokens — hardcoded hex values
```
P2 | video-brain.html:279 | background: #000 in #vbVideoWrap | Use var(--bg) or black keyword
P2 | quote.html:41        | border-bottom: 2px solid #e8c547 | Use var(--ac)
P2 | quote.html:67-68     | color: #999; border-top: 1px solid #eee | Use var(--txd) / var(--bd)
P2 | contract.html:12     | background: #fff; color: #222 in .contract-preview | Use var(--bg) / var(--tx) for dark mode compat
P2 | report.html:45-46    | background: #fff; color: #222 in .report-preview | Same — breaks dark mode
P2 | report.html:62       | color: #aaa; border-top: 1px solid #eee | Use var(--txd) / var(--bd)
P2 | invoice.html         | #e8c547 hardcoded in invoice preview border | Use var(--ac)
```

### RTL / mobile
```
P2 | All files | <html dir="ltr"> is static — verify common.js sets document.documentElement.setAttribute('dir', lang==='he' ? 'rtl' : 'ltr') on lang switch; if not, Hebrew layout is broken LTR
P2 | invoice.html | No @media (max-width:640px) breakpoint for invoice table | Add responsive breakpoint; table likely overflows on phone
P2 | video-brain.html:285 | max-height: 260px on #vbVideo clips tall portrait videos on mobile | Change to max-height: 40vh
```

### Empty states & UX polish
```
P2 | estimate.html, quote.html, contract.html, report.html | No empty-state placeholder in result container — blank white space before first use | Add subtle "Your result will appear here" placeholder
P2 | estimate.html:487     | Textarea placeholder is a long hardcoded English example — not localized | Add data-es-placeholder / data-he-placeholder attrs and set via setLang()
P2 | contract.html:95      | placeholder="30% deposit, 40% mid-project..." hardcoded English | Same — add i18n placeholder
P2 | report.html:109       | placeholder="John & Sarah Smith" — fake name, not generic | Change to generic descriptor
```

---

## API ROUTE MATCHING SUMMARY

| Frontend call | Route in worker.js | Status |
|---|---|---|
| POST /api/video/analyze | YES (line 103) | ✅ OK |
| POST /api/ai | YES (line 97) | ✅ OK |
| POST /api/ai/chat | YES (line 100) | ✅ OK |
| GET /api/projects | YES (line 151) | ✅ OK |
| POST /api/projects | YES (~line 153) | ✅ OK |
| GET /api/user | YES (line 91) | ✅ OK |
| POST /api/payments/stripe/* | YES | ✅ OK |
| GET ${API}/invoices (payment-tracker.html) | **MISSING** | ❌ P0 |
| POST ${API}/invoice-reminder (payment-tracker.html) | **MISSING** | ❌ P0 |

---

## VIDEO BRAIN — SPECIFIC CHECKLIST

| Check | Status | Notes |
|---|---|---|
| Upload mechanism | ✅ | FileReader.readAsDataURL → base64 array to /api/video/analyze |
| Frame extraction | ✅ | Client-side canvas extraction → .vb-frames-strip preview rendered |
| Frame fallback path | Partial | Server falls back to text description if no clear frames; no explicit client-side fallback UI |
| crew_instructions in Spanish | ✅ | Worker system prompt (line 953) demands Mexican trade Spanish; .es array rendered in #crewEs |
| Upsells shown | ✅ | .vb-upsell-list items rendered from upsells array |
| Estimate shown | ✅ | estimated_range rendered in .vb-estimate |
| Raw JSON leak | ⚠️ P1 | .vb-raw-debug pane exists and shows raw JSON on parse failure |
| Loading state | ✅ | Button disabled + spinner during analyze |
| Error state | ✅ | .vb-error.visible styled error box |
| i18n complete | ⚠️ | Needs verification of all button/label data-es coverage |

---

## PAGES THAT SHOULD BE HIDDEN/REMOVED FOR LAUNCH

*(Out of scope for this agent — covered in A_home_nav.md by the other auditor)*

---

## TOP ISSUES TO FIX FIRST

1. **P0** — Add `/api/invoices` + `/api/invoice-reminder` routes to worker.js; fix payment-tracker.html to use shared API_URL constant. Payment Tracker is 100% broken without this.
2. **P1** — Add `isLoggedIn()` auth gate to estimate, quote, invoice, report, video-brain. Unauthenticated users can reach tool pages and see a broken experience.
3. **P1** — Remove or gate `.vb-raw-debug` pane in video-brain.html — raw JSON must never reach a contractor.
4. **P1** — Add `data-es` to all Spanish-missing i18n elements (report.html, payment-tracker.html, contract.html, invoice.html).
5. **P1** — Wrap raw `err.message` in report.html error toast with a friendly string.
