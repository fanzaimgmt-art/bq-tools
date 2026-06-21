# Audit D — Business Suite + Directory
> Agent: D_business_directory | Date: 2026-06-21

---

## Classification Summary

| Page | Classification | Reason |
|---|---|---|
| business/clients.html | SECONDARY | Real + wired; useful but not the hero pain at launch |
| business/compliance.html | HIDE | Niche; not launch-critical; deprioritize |
| business/door-knockers.html | HIDE | 5 fake invented profiles render as real listings (P0); concept is non-core at launch |
| business/equipment.html | SECONDARY | Real + wired; useful add-on but not launch-hero |
| business/expenses.html | SECONDARY | Real + wired; useful but non-hero |
| business/jobs.html | SECONDARY | Real + wired; depends on door-knockers feed — hide if door-knockers hidden |
| business/projects.html | SECONDARY | Real + wired; solid but non-hero |
| business/receipts.html | SECONDARY | Real + wired; OCR receipt scan is genuinely useful, elevate later |
| business/suppliers.html | SECONDARY | Real + wired + Leaflet map works; good feature, non-hero |
| business/taxes.html | SECONDARY | Real + computed from live data; non-hero at launch |
| business/time.html | SECONDARY | Real + wired; non-hero |
| directory.html | HIDE | "BQ Directory" brand in hero (P1); DB-seeded listings may read as fake; not Obra's core value prop at launch |
| directory-profile.html | HIDE | Depends on directory.html; same reasoning |

**LAUNCH pages in this suite: NONE** — the business suite is a solid secondary tier but nothing here is the hero pain (that's the money/payment tools). All 11 business pages and 2 directory pages should stay behind nav but be accessible; consider collapsing them under a "Business" submenu. door-knockers.html and directory.html must be fixed before any public exposure.

---

## P0 / P1 Issues — Punch List

### business/door-knockers.html — HIDE FOR LAUNCH

```
P0 | door-knockers.html:169-170 | DEMO_KNOCKERS fallback renders when DB empty with no "DEMO" label | Add visible banner: "These are example listings. Add your own door-knockers above." — or remove DEMO_KNOCKERS array entirely and show proper empty state
P0 | door-knockers.html:179 | Invented person "Carlos Rodríguez" rendered as real verified listing | Remove or mark { demo: true } and gate render behind "DEMO" badge
P0 | door-knockers.html:180 | Invented person "Miguel Santos" rendered as real verified listing | Same fix
P0 | door-knockers.html:181 | Invented person "James Foster" rendered as real verified listing | Same fix
P0 | door-knockers.html:182 | Invented person "Ana Martínez" rendered as real verified listing | Same fix
P0 | door-knockers.html:183 | Invented person "Dmitri Volkov" rendered as real verified listing | Same fix
P1 | door-knockers.html:241 | Hardcoded "$10,000" in id="bTotal" — should default to $0 or be computed | Change initial textContent to "$0" — line 260 already computes correctly on selection, so initial value is stale
P1 | door-knockers.html:58 | Nav logo reads "BQ <span>Tools</span>" — should be "Obra" | Replace with: Obra
P1 | door-knockers.html:137 | Bio textarea placeholder English-only, no data-he-placeholder / data-es-placeholder | Add both attributes in Spanish and Hebrew
```

### directory.html — HIDE FOR LAUNCH

```
P1 | directory.html:147 | Hero h1 reads "<span class="accent">BQ</span> Directory" — "BQ" is the old product brand, not Obra | Replace with: <span class="accent">Obra</span> <span data-en="Directory" data-es="Directorio" data-he="ספר עסקים">Directory</span>
P1 | directory.html:162-168 | <select id="typeFilter"> options ("General Contractor", "Remodeler", etc.) have no data-he / data-es — fall back to English in Hebrew/Spanish mode | Add data-he and data-es attributes to each <option> or rebuild as JS-rendered select with t()
P1 | directory.html:193 | Address input placeholder "123 Main St, Los Angeles, CA" English-only | Add data-he-placeholder and data-es-placeholder
P1 | directory.html:197 | Project placeholder "Kitchen Remodel — Johnson" English-only + contains an invented name | Replace placeholder text, add data-he-placeholder / data-es-placeholder
```

### directory-profile.html — HIDE FOR LAUNCH

```
P1 | directory-profile.html:146 | data-he back-link shows "Directory →" (LTR arrow) in Hebrew RTL context — should be "← ספר עסקים" or just "ספר עסקים" | Fix arrow direction: data-he="ספר עסקים ←" (or use CSS logical arrow)
P1 | directory-profile.html:177 | Error text "No contractor specified." and "Browse directory" anchor — no data-he / data-es | Add i18n attributes
P1 | directory-profile.html:194 | "Back to directory" link text — no data-he / data-es | Add i18n attributes
P2 | directory-profile.html:164 | Footer "Powered by Obra — BQ Production LLC" — no data-he / data-es | Add i18n (footer is P2, not blocking)
```

### business/clients.html

```
P1 | clients.html:57 | Nav logo "BQ <span>Tools</span>" — should be "Obra" | Replace with: Obra
```

### business/compliance.html

```
P1 | compliance.html:66 | Nav logo "BQ <span>Tools</span>" — should be "Obra" | Replace with: Obra
```

### business/door-knockers.html (branding already listed above)

### business/equipment.html

```
P1 | equipment.html:95 | <select> status options "Repair" and "Lost" — no data-he / data-es | Add i18n attributes or render via JS with t()
```

### business/expenses.html

```
P1 | expenses.html:65 | Nav logo "BQ <span>Tools</span>" — should be "Obra" | Replace with: Obra
```

### business/jobs.html

```
P1 | jobs.html:64 | Nav logo "BQ <span>Tools</span>" — should be "Obra" | Replace with: Obra
P1 | jobs.html:88 | Search input placeholder "Search jobs..." — no data-he-placeholder / data-es-placeholder | Add both attributes
```

### business/projects.html

```
P1 | projects.html:71 | Nav logo "BQ <span>Tools</span>" — should be "Obra" | Replace with: Obra
```

### business/receipts.html

```
P1 | receipts.html:86 | Nav logo "BQ <span>Tools</span>" — should be "Obra" | Replace with: Obra
```

### business/suppliers.html

```
P1 | suppliers.html:203 | Label "Website" has no data-he / data-es | Add: data-he="אתר" data-es="Sitio web"
```
(Nav logo already says Obra — no issue.)

### business/taxes.html

```
P1 | taxes.html:58 | Nav logo "BQ <span>Tools</span>" — should be "Obra" | Replace with: Obra
P2 | taxes.html:319-323 | renderSummary() uses inline ternary ${h ? 'עסק' : 'Business'} instead of data-he pattern — works but inconsistent | Refactor to use t() helper for consistency (P2, not blocking)
```

### business/time.html

```
P1 | time.html:129-134 | Table header columns "Date", "Project", "Task", "Hours", "Pay" — NO data-he / data-es | Wrap in <th data-en="Date" data-he="תאריך" data-es="Fecha"> etc. for all 5 columns
```

---

## What's Real vs. Stub — Detailed Assessment

### All 11 business/* pages
**Verdict: REAL and wired.** All use `Biz.list()` / `Biz.create()` / `Biz.update()` / `Biz.delete()` from `js/business.js`, which wraps `apiCall()` pointing to the live worker API. None have hardcoded fake rows in their rendered tables. The "fake" data in equipment.html and time.html is instructional copy in a how-it-works sidebar, not in the data tables. These pages are functional — they just need a logged-in user with real records to show non-empty state.

**`js/business.js` is clean** — generic CRUD wrapper, no stubs, no hardcoded data.

**Exception: door-knockers.html** — the `DEMO_KNOCKERS` fallback at line 170 silently renders 5 invented profiles as real verified listings whenever the `doorknockers` DB collection is empty. No "DEMO" label, no empty state message. This is a P0 before any user sees the page.

### directory.html + directory-profile.html
**Verdict: REAL API wiring.** Both pages fetch from `/api/directory/list` and `/api/directory/profile`. Leaflet maps initialize correctly. DB-seeded entries are flagged with `l.seeded === true` and show "Claim this listing" — which is an honest signal. The Leaflet tile layer and marker logic look functional.

**Key issue:** The hero `<h1>` in directory.html still reads "BQ Directory" (line 147) — the `<span class="accent">BQ</span>` was never updated during the Obra rebrand. This is the most visible P1 on the page.

---

## Nav Logo "BQ Tools" — Affected Files

The nav logo string `BQ <span>Tools</span>` appears in these business pages (injected inline, NOT via common.js `buildAppNav`):
- business/clients.html:57
- business/compliance.html:66
- business/door-knockers.html:58
- business/expenses.html:65
- business/jobs.html:64
- business/projects.html:71
- business/receipts.html:86
- business/taxes.html:58

**Fix for all 8:** Change `BQ <span>Tools</span>` → `Obra` in each nav-logo anchor. (business/equipment.html, business/suppliers.html, business/time.html already say Obra.)

---

## Leaflet Map Status

| Page | Leaflet loaded? | Map functional? |
|---|---|---|
| suppliers.html | Yes (unpkg CDN, v1.9.4) | Yes — renders supplier address pins |
| directory.html | Yes (unpkg CDN, v1.9.4) | Yes — loads markers from API |
| directory-profile.html | Yes (unpkg CDN, v1.9.4) | Yes — renders contractor work locations |
| All other business/* | No | N/A |

No broken Leaflet found. All three maps use the same CDN URL and appear functional.

---

## i18n Gap Summary

| File | Missing translations |
|---|---|
| door-knockers.html | Bio textarea placeholder (line 137) |
| equipment.html | Status select options (line 95) |
| jobs.html | Search placeholder (line 88) |
| time.html | 5 table header columns (lines 129-134) |
| suppliers.html | "Website" label (line 203) |
| directory.html | Type filter select options (lines 162-168), 2 input placeholders (lines 193, 197) |
| directory-profile.html | Back link arrow direction (line 146), error/nav text (lines 177, 194), footer (line 164) |

---

## Recommended Launch Action

1. **HIDE** door-knockers.html and directory.html/directory-profile.html from nav for launch — remove from `buildAppNav` in common.js and from business.html hub links. Flag as "Coming Soon" or simply omit.
2. **Fix P1 nav logos** in 8 business pages: replace `BQ <span>Tools</span>` → `Obra`.
3. **Fix P1 "BQ Directory" hero** in directory.html:147 before that page goes public.
4. **Fix P0 door-knockers DEMO_KNOCKERS** before that page goes public — replace fake-person fallback with a proper empty state.
5. All other business/* pages can ship as SECONDARY — they are real, wired, and functional.
