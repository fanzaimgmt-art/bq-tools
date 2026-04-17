# Stripe Setup Guide

Stripe account: **acct_1TMbWhGk9nNKAE9s**

## Step 1 — Finish Stripe Verification

Log into https://dashboard.stripe.com and complete any pending identity/business verification for acct_1TMbWhGk9nNKAE9s. You cannot create live keys until this is done.

---

## Step 2 — Create the 4 Products & Prices

In Stripe Dashboard → **Products** → **Add product**, create four items:

| Name | Amount | Type | Env var to set |
|------|--------|------|---------------|
| BQ Credits — 25 | $4.99 | One-time (payment) | `STRIPE_PRICE_CREDITS_25` |
| BQ Credits — 60 | $9.99 | One-time (payment) | `STRIPE_PRICE_CREDITS_60` |
| BQ Credits — 150 | $19.99 | One-time (payment) | `STRIPE_PRICE_CREDITS_150` |
| BQ Pro Monthly | $14.99 | Recurring — monthly | `STRIPE_PRICE_PRO_MONTHLY` |

After saving each product, copy the **Price ID** (starts with `price_`).

---

## Step 3 — Set Price IDs as Secrets

Run these commands, pasting the matching price ID when prompted:

```bash
cd api
wrangler secret put STRIPE_PRICE_CREDITS_25
wrangler secret put STRIPE_PRICE_CREDITS_60
wrangler secret put STRIPE_PRICE_CREDITS_150
wrangler secret put STRIPE_PRICE_PRO_MONTHLY
```

---

## Step 4 — Set Your Stripe Secret Key

Start with **test mode** — flip to live once confirmed working.

```bash
# Test mode key (starts with sk_test_...)
wrangler secret put STRIPE_SECRET_KEY

# When ready for live payments, replace with live key (sk_live_...)
wrangler secret put STRIPE_SECRET_KEY
```

---

## Step 5 — Configure Webhook

1. In Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://bq-tools.fanzai-mgmt.workers.dev/api/payments/stripe/webhook`
3. Events to subscribe:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
4. Click **Add endpoint**, then copy the **Signing secret** (starts with `whsec_`)
5. Run:

```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
```

> **Note:** In Stripe test mode, use the CLI to forward webhooks locally:
> `stripe listen --forward-to localhost:8787/api/payments/stripe/webhook`

---

## Step 6 — Enable Stripe in wrangler.toml

In `api/wrangler.toml`, find the commented line and update it:

```toml
# Before:
# STRIPE_ENABLED = "false"   ← uncomment and set to "true" after ...

# After:
STRIPE_ENABLED = "true"
```

Then deploy:

```bash
cd api
wrangler deploy
```

The "Pay with Card" buttons in the Buy Credits and Pro modals will now activate automatically.

---

## Step 7 — Test with Stripe Test Mode

Use Stripe's test card:

- **Card number:** `4242 4242 4242 4242`
- **Expiry:** any future date (e.g. `12/26`)
- **CVC:** any 3 digits
- **Name/ZIP:** anything

Verify that:
1. Clicking "Pay with Card" redirects to Stripe Checkout
2. After payment, you're returned to `/home.html?payment=success`
3. Credits or Pro status appear on the user's account within seconds (check via admin panel)
4. The webhook event `checkout.session.completed` appears in Stripe Dashboard → Webhooks → Recent deliveries

---

## Rollback

If anything goes wrong, disable Stripe instantly:

1. In `api/wrangler.toml`, comment out or change the value:
   ```toml
   # STRIPE_ENABLED = "false"
   ```
   or
   ```toml
   STRIPE_ENABLED = "false"
   ```
2. Deploy:
   ```bash
   cd api && wrangler deploy
   ```

PayPal and Crypto flows are unaffected — they continue to work regardless of `STRIPE_ENABLED`.
