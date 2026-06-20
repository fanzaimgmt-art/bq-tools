# BQ Tools — Money Hero Flow Spec

**Purpose:** Define the exact payment flow BQ Tools must build to be insanely useful for US contractors getting paid. Based on validated pains from real contractor WhatsApp groups + competitive research (Jobber, JobTread, Knowify, Joist, Buildertrend).

---

## THE CORE GAP (why existing tools fail contractors)

Jobber/Joist are clean but generic. JobTread/Buildertrend are too complex and expensive ($300–$700/mo). None solve the three specific contractor payment killers:
1. GC compliance doc requirements (W9 + COI + photo ID) that gate every payment
2. WhatsApp-native quote flow (photos of plans, options pricing, back-and-forth)
3. Milestone disputes that restart from scratch on every project

BQ Tools' edge: AI that handles the mess between "I said yes" and "check cleared."

---

## THE CORE FLOW

### Step 1 — Estimate

**Inputs:** Job description, photos of plans/scope, materials list, labor hours (can come as WhatsApp-style voice note or text dump)

**AI does:**
- Structures the dump into line items (labor, materials, markup)
- Generates 2 versions automatically: base price + optional upgrades (e.g., standard tile vs premium tile)
- Pulls the contractor's saved labor rates and markup %

**Output:** Branded PDF estimate + shareable link. Two-column layout if options exist (base vs upgraded).

**BQ advantage vs WhatsApp:** Instead of a photo of a handwritten page, the client gets a clean PDF with line items they can tap to accept. No "which version did we agree on?" disputes.

---

### Step 2 — Quote → Contract

**Inputs:** Client accepts estimate (e-sign via link, no app download required)

**AI does:**
- Converts estimate into a simple contract with: scope of work, total price, payment schedule, change order clause
- Embeds the milestone payment schedule (see Milestone section below)
- Sends to client for e-signature with one tap

**Output:** Signed PDF stored in the job file. Timestamp + IP logged.

**BQ advantage:** Most contractors send estimates on WhatsApp and never get a signature. This closes that gap without a lawyer.

---

### Step 3 — Invoice

**Inputs:** Milestone reached OR date trigger (e.g., net-15 from contract signing)

**AI does:**
- Auto-generates invoice from the signed contract's milestone schedule
- Attaches all required compliance docs (W9, COI — see Doc Layer below)
- Sends via email + SMS with a pay-now link

**Output:** Invoice PDF + payment link. Logged as "sent" with timestamp.

**BQ advantage:** No more "did you send the invoice?" — the invoice goes out automatically when the milestone is hit, with docs already attached. GC can't delay payment by claiming they're "waiting on the W9."

---

### Step 4 — Payment Tracking

**Inputs:** Invoice sent events, payment received webhooks (Stripe/ACH)

**AI does:**
- Marks invoices as Sent → Viewed → Paid (or Overdue)
- Sends automated follow-up at day 3, day 7, day 14 (contractor sets cadence)
- Escalates language on each reminder ("gentle reminder" → "please advise on status" → "payment is now X days past due")

**Output:** Payment dashboard (see tracker section below)

**BQ advantage vs manual:** Contractor stops being the one who has to remember to chase. The system sends the reminder so the contractor doesn't have to be the bad guy.

---

## PAYMENT TRACKER

### The Dashboard (contractor view)

Single screen showing every active job with:

| Job | Client | Amount Due | Due Date | Status | Action |
|-----|--------|-----------|----------|--------|--------|
| Kitchen reno | Smith | $8,500 | Jun 25 | OVERDUE 3 days | Send reminder |
| Bathroom | Jones | $3,200 | Jul 1 | Invoice sent | — |
| Deck build | Kim | $12,000 | Pending | Milestone not reached | Mark complete |

**Status flags:**
- GREEN: paid or not yet due
- YELLOW: due within 3 days
- RED: overdue (number of days shown)
- GRAY: milestone not yet triggered

**Reminder logic:**
- Day 0 (invoice sent): confirmation email with pay link
- Day 3: "Just checking in — payment link is below"
- Day 7: "Following up on invoice #[X] — please let us know if you have questions"
- Day 14: "Payment is now 14 days past due. Please advise."
- Day 21+: contractor manually escalates OR system sends lien waiver reminder

All reminders go from contractor's email/SMS — not a generic platform address. Keeps relationship intact.

---

## THE DOC LAYER

### The problem this solves

GCs routinely hold payment until they receive: W9, photo ID, Additional Insured certificate (COI naming the GC), sometimes a signed lien waiver. Contractors scramble to find these and email them separately. Payments get delayed weeks.

### How BQ Tools handles it

**One-time setup (onboarding):**
Contractor uploads:
- W9 (PDF)
- COI / certificate of insurance (PDF) — with expiration date stored
- Photo ID (JPEG/PNG)
- Signed lien waiver template (blank)

System stores all with expiration tracking. Alerts contractor 30 days before COI expires.

**Per-invoice auto-attach:**
When creating an invoice, contractor selects which docs to attach. Default: W9 + COI always included. System pre-fills the lien waiver with job details.

**GC-specific doc sets:**
Contractor can save a "doc bundle" per client/GC. Example: "Harari Construction requires W9 + COI + signed sub agreement." Next invoice to Harari auto-attaches that bundle.

**Output:** Invoice email contains docs as attachments OR a single link to a doc collection page. GC gets everything in one email — no back-and-forth.

**BQ advantage:** Eliminates the #1 delay tactic GCs use. Payment can't be blocked on "we're waiting for your insurance cert" if it's already in the invoice email.

---

## MILESTONE / PROGRESS PAYMENTS

### The problem

Every project negotiates milestones from scratch. 45% upfront disputes. "I thought we said 3 payments" vs "I said 4." Nothing is locked in writing.

### Template library

BQ Tools ships with 5 pre-built milestone templates:

1. **Standard 3-payment** (small jobs under $10K): 50% upfront, 40% at rough-in/midpoint, 10% at completion
2. **Standard 5-payment** (mid jobs $10K–$50K): 30/20/20/20/10
3. **7-milestone** (large remodel): custom % tied to specific phases (demo, framing, rough-in, drywall, finish, punch-list, final)
4. **Net-30 invoice** (for GC work): single invoice per month, net-30 terms
5. **Draw schedule** (for bank-financed jobs): mirrors the bank's draw request process

**Contractor customizes once per job, saves as template for that client type.**

### How milestones work in the flow

1. Contractor picks template at contract creation
2. Each milestone gets a name + trigger: "Framing complete" → milestone 3 → $X
3. Contractor taps "Mark Milestone Complete" from their phone → invoice fires automatically
4. Client gets invoice + progress photo + pay link in same message

**Photo proof:** Contractor can attach a job-site photo when marking a milestone complete. This gets embedded in the invoice email. Homeowners pay faster when they see progress. Reduces withheld checks.

---

## CLIENT PAYMENT-UPDATE LINK

### The problem

Homeowners withhold checks when they feel out of the loop. Contractors get asked "where are we?" constantly. Every unanswered question delays the check.

### The solution: Shareable Job Status Page

Every job gets a unique URL: `bqtools.com/job/[job-id]`

What the homeowner sees (no login required):
- Job name + contractor info
- Visual timeline of milestones: [Completed] [In Progress] [Upcoming]
- Amounts paid vs amount remaining
- Next payment due: amount + due date + Pay Now button
- Last update from contractor (optional text note + photo)
- Contact button → goes to contractor's phone/email

**Contractor controls what's visible.** They can hide cost breakdown and show only milestones + payment status.

**Sends automatically:**
- Link included in contract signing email ("Track your project here")
- Link re-sent with every invoice
- Contractor can share link from their phone anytime

**BQ advantage vs competition:** JobTread has customer portals but they require the homeowner to create an account. This is zero-friction — tap link, see status, pay. That's the difference between a check withheld for 2 weeks and a check sent same day.

---

## MVP CUT — SHIP THIS WEEK

### Build now (Week 1 MVP)

These are the features that directly fix the top 3 paid pains:

1. **Invoice generator** — contractor fills: client name, job, line items, total. AI formats it. PDF generated. Email + SMS sent with pay link (Stripe).
2. **Doc bundle auto-attach** — upload W9 + COI once, attach to every invoice automatically.
3. **Payment tracker dashboard** — list of all invoices, status (sent/viewed/paid/overdue), days overdue badge.
4. **Automated reminder sequence** — day 3, 7, 14 follow-ups from contractor's identity.
5. **Job status link** — static shareable page showing milestones + payment status. Homeowner taps Pay Now.

**Skip for now:**
- Estimate builder (too much scope — do it manually for now, just generate invoice from what contractor types)
- E-signature on contracts (use DocuSign link workaround)
- Sub management / PO tracking
- AIA payment applications
- Homeowner financing integration
- Mobile app (web-responsive is fine)

### Build Week 2–3

- Estimate → invoice conversion (one-click)
- Milestone templates library
- Photo proof upload on milestone completion
- COI expiration alerts
- GC-specific doc bundles
- Change order tracking

### Build Month 2

- E-signature on contracts
- QuickBooks / Stripe sync
- Lien waiver auto-fill
- Sub billing tracker
- AIA-style payment applications

---

## PREMIUM TIER JUSTIFICATION ($500–$5K/mo done-with-you)

Free self-serve tools (Joist free, Invoice Simple) give contractors a PDF. That's table stakes. Here's what justifies the premium:

**1. Done-for-you invoice + follow-up ($500/mo)**
BQ team sends the invoice, attaches the docs, runs the reminder sequence. Contractor doesn't touch it. For contractors doing $20K+/mo who hate admin — this is worth it. One recovered payment pays for 6 months.

**2. Doc compliance management ($750/mo)**
BQ monitors COI expiration, re-requests updated certs, maintains the doc bundle per GC. Contractor never fails a payment requirement again. Worth it for any contractor with 3+ active GC relationships.

**3. Full payment ops concierge ($2K–$5K/mo)**
BQ handles: estimate review, contract templating, invoice generation, milestone tracking, payment chasing, lien waiver filing. Contractor's only job is to build. Pitched to contractors doing $500K+/year in volume — admin cost to them is $10K+/year in lost time and delayed payments. This is a steal.

**Why this beats a tool subscription:**
Contractors don't want software. They want the problem solved. The premium tier sells the outcome ("you will get paid on time, every time, with zero paperwork from you") not the features. That's a fundamentally different product than Jobber at $69/mo.

---

## COMPETITIVE POSITIONING SUMMARY

| Feature | Joist | Jobber | JobTread | BQ Tools MVP |
|---------|-------|--------|----------|--------------|
| Invoice + pay link | Yes | Yes | Yes | Yes |
| Doc auto-attach (W9/COI) | No | No | No | **Yes** |
| Milestone auto-invoice | No | Partial | Yes (complex) | **Yes (simple)** |
| Zero-login client pay page | No | No | No | **Yes** |
| Done-for-you tier | No | No | No | **Yes** |
| WhatsApp-style input | No | No | No | **Yes (planned)** |
| Price | $0–$50/mo | $69–$349/mo | $99–$399/mo | **Free + $500/mo+** |

---

*Spec written: 2026-06-20. Built from validated contractor WhatsApp pain points + competitive research (Joist, Jobber, JobTread, Knowify, Buildertrend).*
