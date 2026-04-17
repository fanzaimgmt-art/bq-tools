# BQ Tools — Full Build Prompt (V2 — Corrected)

## WHAT IS BQ TOOLS
BQ Tools is a web app for contractors and remodelers. Built with vanilla HTML/CSS/JS, dark theme, mobile-first. Hosted on Cloudflare Pages.

**Current tools:**
- Compare (before/after slider) — FREE, no AI
- AI Analysis (photo comparison scoring) — PRO
- Quick Report (AI-generated project report) — PRO
- Smart Estimate (AI cost estimation from photo) — PRO
- Client Page (shareable project page) — FREE (1 free, unlimited Pro)
- Social Post (AI Instagram/Facebook caption) — PRO
- Review Request (AI review message generator) — PRO
- Quick Sketch (AI sketch cleanup) — PRO

**Current file structure:**
```
/bq-tools/
  index.html          — Landing page with hero, tools grid, pricing
  auth.html           — Pro code activation page
  gallery.html        — Project gallery (localStorage)
  style.css           — Global styles (dark theme, Heebo font)
  js/
    common.js         — Language toggle (EN/HE), nav builder, toast, footer
    ai.js             — AI settings, callClaude(), callGemini(), resizeForAPI()
    auth.js           — Pro code validation (hardcoded VALID_CODES array)
    crypto.js         — Crypto payment modal (SOL + BTC wallets)
  tools/
    compare.html      — Before/after slider + AI analysis
    report.html       — Quick Report tool
    estimate.html     — Smart Estimate tool
    client-page.html  — Client Page builder
    social-post.html  — Social Post generator
    review.html       — Review Request generator
    sketch.html       — Quick Sketch tool
  api/                — (empty, for Worker)
  auth/
    index.html        — (duplicate of auth.html)
  compare/
    index.html        — (old compare, may be duplicate)
  img/                — (empty)
```

**Current auth system:** Hardcoded pro codes in auth.js (BQPRO-2024-GOLD, etc). localStorage only.
**Current AI:** User provides their own API keys, stored in localStorage. Direct browser calls to Claude/Gemini APIs.
**Current gallery:** localStorage only, stores full base64 images (heavy).

---

## WHAT TO BUILD — in order

### Phase A: CREDIT SYSTEM + BACKEND

**1. CLOUDFLARE WORKER** (`api/worker.js` + `wrangler.toml`)
- Worker name: `bq-tools-api`
- KV namespace: `BQ_USERS`
- Route: `POST /api/ai` — accepts `{ action, images, prompt, userToken }`
  - Checks credit balance before calling AI
  - Calls Claude/Gemini with server-side API keys (NOT user's)
  - Deducts 1 credit on success
  - Returns AI response
  - Environment secrets: `CLAUDE_API_KEY`, `GEMINI_API_KEY`
- Route: `POST /api/auth/register` — email-based registration
- Route: `POST /api/auth/verify` — verify 6-digit code
- Route: `GET /api/user` — get user profile + credits
- Route: `POST /api/user/update` — update profile
- Route: `POST /api/credits/add` — admin only, add credits
- Route: `GET /api/admin/users` — admin only, list all users
- Route: `POST /api/error-report` — save error to KV
- Claude model: `claude-haiku-4-5-20251001` (cheapest)
- Gemini model: `gemini-2.5-flash` (fallback: `gemini-2.0-flash`)
- Worker API URL: `bq-tools-api.fanzai-mgmt.workers.dev` (separate from Pages at `bq-tools.fanzai-mgmt.workers.dev`)
- CORS: allow `bq-tools.fanzai-mgmt.workers.dev`
- Rate limit: KV counter per minute bucket, max 10 req/min/user, return 429 if exceeded
- Image resize: done CLIENT-SIDE to 1024px max using canvas BEFORE sending to Worker (already exists in `resizeForAPI()`)

**2. AUTHENTICATION — Email-based**
- User enters email → Worker sends 6-digit code (via Resend, Mailgun, or simple email API)
- User enters code → Worker verifies, returns `userToken` (random UUID stored in KV)
- Token stored in localStorage, sent with every request
- No passwords. Code expires in 10 minutes.
- MVP: Do NOT send emails. Show the 6-digit code on screen after registration. User copies it and enters it. Phase 2: add real email sending via Resend/Mailgun.

**3. USER DATA in KV:**
```
Key: user:{email}
Value: {
  email,
  userToken,
  credits,
  isPro,
  creditsUsedThisMonth,
  createdAt,
  resetDate,
  businessName,
  phone,
  logo,           // base64, max 50KB, resized to 200x200 client-side
  businessType,   // "General Contractor" | "Remodeler" | "Painter" | "Roofer" | "Landscaper" | "Interior Designer" | "Other"
  language,       // "en" | "he"
}

// Projects stored SEPARATELY (not inside user object — too heavy):
Key: "projects:{email}" → [{ id, date, tool, title, thumbnail (200px), result_summary }]

// Credit usage history stored SEPARATELY:
Key: "credits:{email}" → [{ date, tool, action, creditCost, projectTitle }]
```
- Free users: 5 credits (one-time, no reset)
- Pro users: 50 credits/month (auto-reset on billing date)
- Credit packs (PayPal + Crypto with 35% discount):
  - $4.99 = 25 credits (Crypto: $3.24)
  - $9.99 = 60 credits (Crypto: $6.49)
  - $19.99 = 150 credits (Crypto: $12.99)

**4. PAYMENT — Manual for now:**
- PayPal: per-tier hosted buttons — `2Z5X5PPL26R2L` (credits_25), `65YNKHNBL9V3G` (credits_60), `WKVG2RPF7JEDE` (credits_150), `G7EG5WBG8VSDG` (pro_monthly). After payment PayPal redirects to `/payment-success.html?tier={tier}` where the user submits their Transaction ID.
- Crypto wallets:
  - SOL: `AuQHCMvYob1ejox3KtkjJwKWAT5cmBVdBHcpLNQXrZsB`
  - BTC: `bc1puz0rmvg9lqmv72sd0pw0md6p86899xjwq5sz2rc07s9fuqf3edgq9kgz5y`
- Crypto: User sends crypto, screenshots proof
- For both: I verify manually and add credits via admin endpoint
- Phase 2 TODO: PayPal IPN webhook, blockchain verification

**5. CREDIT COSTS per action:**
| Action | Cost |
|--------|------|
| Compare slider (no AI) | 0 (FREE forever) |
| AI Analysis | 1 credit |
| Quick Report | 1 credit |
| Smart Estimate | 1 credit |
| Social Post | 1 credit |
| Review Request | 1 credit |
| Quick Sketch AI cleanup | 1 credit |
| AI Assistant message | 1 credit |
| Client Page creation | 0 credits (1 free, unlimited Pro) |

**6. CREDIT DISPLAY — persistent header bar on EVERY page:**
- Show: "⚡ 47 credits remaining"
- When <5 credits: yellow warning pulse animation
- When 0 credits: modal popup "You're out of credits" with buy options
- Purchase buttons: PayPal link + Crypto for each pack size
- Show cost BEFORE each action: "This will use 1 credit ⚡" — user must confirm
- Add credit bar to nav (after logo, before links)

**7. REMOVE all API key settings from UI:**
- Delete `openAISettings()` modal from `ai.js`
- Delete settings gear button from `compare.html` and all tool pages
- Delete `getAISettings()` / `saveAISettings()` that read user keys from localStorage
- Replace `callClaude()` / `callGemini()` direct calls with `callWorkerAI()` that POSTs to Worker
- Users NEVER see API keys

**8. REPLACE auth.js pro code system:**
- Delete `VALID_CODES` array and `activatePro()` function
- Replace `isPro()` to check user profile from KV (cached in localStorage)
- Replace `requirePro()` to check credits > 0 (not just isPro)
- Update `auth.html` to show email login instead of pro code input

---

### Phase B: USER MEMORY & PROFILE

**9. ONBOARDING FLOW — first time user after email login:**
- Step 1: "Welcome to BQ Tools! Let's set up your profile"
- Step 2: Business name (required)
- Step 3: Phone (optional)
- Step 4: Logo upload (optional — resize to 200x200 client-side, convert to base64, max 50KB, store in KV)
- Step 5: Business type dropdown: General Contractor / Remodeler / Painter / Roofer / Landscaper / Interior Designer / Other
- Step 6: Preferred language: EN / HE
- This info auto-fills into all tools (reports, client pages, review requests, exports)

**10. USER DATA PERSISTENCE:**
- Primary: Cloudflare KV (synced via Worker)
- Cache: localStorage (fast, offline access)
- On login: pull from KV → cache locally
- On profile save: write to both KV + localStorage
- Export profile as JSON backup button
- Import from JSON button

**11. PROJECT HISTORY:**
- Every Compare, Report, Estimate auto-saves to user's `projects` array in KV
- Each project: `{ id, date, type, title, thumbnails, result }`
- Thumbnails: store small versions (200px wide) not full base64
- Searchable by date and type
- Gallery page (`gallery.html`) shows grid of cards with before/after thumbnails
- Update existing gallery.html to pull from KV instead of localStorage only

---

### Phase C: ANALYTICS DASHBOARD (`dashboard.html`)

**12. TWO TYPES OF HISTORY:**

A. **PROJECT HISTORY** (what I did):
   - KV key: `projects:{email}` → array
   - Every tool action saves: `{ id, date, tool, title, thumbnail (200px), result_summary }`
   - Gallery page: timeline of all projects with filter by tool and date
   - Click project → opens full result

B. **CREDIT USAGE HISTORY** (what I spent):
   - KV key: `credits:{email}` → array
   - Every credit burn saves: `{ date, tool, action, creditCost, projectTitle }`
   - Dashboard shows:
     - Table: "Apr 15 | AI Analysis | Kitchen remodel | -1 credit"
     - Pie chart (CSS): credits per tool
     - Bar chart (CSS): daily usage last 30 days
     - "Total spent: 34/50 credits this month"
     - "Most expensive tool: AI Analysis (12 credits)"
     - "Busiest day: Tuesday (8 credits)"
   - "Export Usage Report" button → CSV download

**13. DASHBOARD GRAPHS — all CSS only (no libraries):**
- Pie chart: credit distribution by tool
- Bar chart: daily usage last 30 days
- Progress bar: credits used vs remaining
- Trend line: projects per week last 3 months

**14. AI MONTHLY TIP:**
- Based on usage data, generate personalized tip
- Examples:
  - "You analyzed 12 kitchens this month. Consider specializing in kitchen remodels for your marketing!"
  - "You haven't used Smart Estimate yet. Try it — it saves hours on quotes!"
- Updates once per month, **FREE** (no credit cost), saved in KV
- Generated server-side when user opens dashboard and tip is >30 days old

---

### Phase D: AI ASSISTANT

**14. FLOATING CHAT BUTTON — bottom-right corner on every page:**
- Golden circle with chat icon
- Pulse animation on first visit only (then save flag in localStorage)
- Click → opens chat panel (slide up on mobile, side panel on desktop)
- "Hi! I'm BQ Assistant. What do you want to do?"

**15. AI ASSISTANT CAPABILITIES:**
- Natural language → routes to correct tool
- Examples:
  - "Compare two photos" → opens /tools/compare.html
  - "Make a report for Johnson kitchen" → opens /tools/report.html with "Johnson kitchen" pre-filled via URL param
  - "Write a review request for Sarah" → opens /tools/review.html with "Sarah" pre-filled
  - "How much to redo a bathroom?" → opens /tools/estimate.html
  - "What's my most used tool?" → shows stats from dashboard data
  - "How many credits do I have?" → shows credit count from cached user data
- Can answer general contractor questions too
- System prompt: "You are BQ Assistant, an AI helper for contractors and remodelers. You help them use BQ Tools efficiently. You can navigate them to tools, answer questions about construction/remodeling, and help them market their work. Keep answers short and actionable. You know about: Compare, AI Analysis, Quick Report, Smart Estimate, Client Page, Social Post, Review Request, Quick Sketch, Gallery, and Dashboard."
- Each message = 1 credit (show confirmation before sending)
- Chat history saved in localStorage (last 50 messages) — NOT synced to KV
- Clear history button

**16. SMART SUGGESTIONS — after tool use:**
- Each tool page writes to localStorage: `{ lastAction: 'compare', projectId: '...', timestamp }`
- When Assistant opens, it reads `lastAction` and shows quick-action buttons:
  - After Compare: "Want me to generate a report for this project?"
  - After Report: "Should I create a social media post from this?"
  - After Estimate: "Want to create a Client Page to share this?"

---

### Phase E: ERROR REPORTING

**17. GLOBAL ERROR HANDLER:**
- `window.onerror` catches all JS errors
- Saves to localStorage: `{ timestamp, page, error, userAction, browser }`
- Dashboard widget: "0 errors this week ✓" or "2 issues detected"
- "Report Issue" button → POST to Worker `/api/error-report` → saves to KV key `errors:{timestamp}`
- Email fallback: `fanzai.mgmt@gmail.com`

---

### Phase F: ADMIN PANEL

**18. ADMIN PAGE** (`/admin.html`):
- Password protection: prompt for admin password on load. Hardcoded password: `bqadmin2026` (will change later).
- Features:
  - List all users (email, credits, isPro, last active)
  - Search users by email
  - Add credits to specific user (input: email, amount)
  - Toggle Pro status for user
  - View payment verification queue
  - View error reports
  - Basic stats: total users, total credits used, revenue

---

## BUILD ORDER
1. Write `wrangler.toml` + Worker skeleton — tell me to run `wrangler` commands
2. Implement Worker routes (auth, AI proxy, credits, admin)
3. Credit system + display bar in nav
4. Update ALL tool pages to call Worker instead of direct API
5. Remove all API key settings from UI
6. Email-based auth flow (replace pro codes)
7. User profile onboarding
8. Project history + gallery update
9. Dashboard page
10. AI Assistant (floating chat)
11. Smart suggestions
12. Error reporting
13. Admin panel
14. Full test on mobile (375px) + desktop
15. `git push` — tell me when ready

---

## IMPORTANT RULES
- Every button minimum 48px touch target
- Mobile first — everything works on iPhone SE (375px)
- All text minimum 14px on mobile
- Dark theme — colors that work in sunlight (high contrast)
- EN/HE toggle on every page (already exists in common.js, keep using it)
- "Powered by BQ Tools" on every export
- Show "This will use 1 credit ⚡" before EVERY AI action — user must confirm
- Loading states with progress steps, NOT empty spinners (already done in compare.html, replicate pattern)
- When you need me to run `wrangler deploy`, `wrangler secret put`, or any CLI command — tell me and I'll run it
- Keep all existing functionality working — don't break Compare slider, export, gallery
- Offline behavior: Compare slider works offline, all AI features show "Internet required" message
- Do NOT create any test files, documentation files, or README files unless I ask
