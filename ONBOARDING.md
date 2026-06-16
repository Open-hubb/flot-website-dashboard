# Onboarding a new merchant to the Flot dashboard

Every merchant is fully isolated (unique Flot Merchant ID, own webhook, own
Sanity dataset, all data scoped by `merchantId`). Adding one never affects the
others. Here's the full checklist so a new merchant gets **login, transactions,
CMS, analytics, and (optionally) orders**.

> Hand the assistant the merchant's **website repo name** + **Flot Merchant ID**,
> and it can do all the *website-code* steps (3a–3d). You do the *admin/config*
> steps (1, 2, 4).

---

## 1. Create the merchant — **You** (≈2 min)

1. Go to **`https://dashboard.flotme.ai/admin/login`** (password = `ADMIN_SECRET`).
2. **Invite Merchant** → fill:
   - Contact Name, Email, Business Name
   - **Merchant Type → Website** ← required, or they get no CMS/Orders/Analytics
   - **Flot Merchant ID** ← the merchant's real ID in the Flot system
3. **Create & Send Invite** → the merchant gets an email, sets a password, logs in.

The dashboard auto-generates the merchant's webhook username/password (used in step 2).

---

## 2. Transactions (Flot webhook) — **You on Flot + assistant matches creds**

So payments appear on the **Transactions** page + 🔔:

1. On the **Flot admin** for this merchant, set:
   - **Webhook URL** → `https://dashboard.flotme.ai/api/webhooks/flot/{flotMerchantId}`
   - **Enable** the webhook
2. **Match the Basic Auth credentials** on both sides (they must be identical):
   - Tell the assistant the merchant's Flot webhook **username + password**, and it
     sets the dashboard merchant's `webhookUsername`/`webhookPassword` to match.
3. Test with a small real payment → it should land on Transactions.

> Note: Flot's current payload omits the **amount**. Showing amounts needs the
> "hub" change in `flot-checkout` (it forwards an enriched webhook). Until then,
> transactions appear without a value.

---

## 3. The merchant's website — **Assistant** (give it the repo + Flot ID)

For each, the assistant edits the merchant's site repo and opens a PR:

**3a. CMS (Sanity).** Re-point the site to the shared Sanity project:
- `NEXT_PUBLIC_SANITY_PROJECT_ID = oswn0868`
- `NEXT_PUBLIC_SANITY_DATASET = {merchant-dataset}` (created in step 4)
- migrate existing content into the new dataset, then redeploy.

**3b. Web Analytics tracker.** Ensure the site's layout loads:
```
https://dashboard.flotme.ai/api/public/tracker.js?id={flotMerchantId}
```
(Fix any old tag pointing at `flot-dashboard.vercel.app`.)

**3c. Orders (e-commerce sites only — carts + delivery).** Wire the checkout to
`POST https://dashboard.flotme.ai/api/public/order` with
`{ merchantId: flotMerchantId, name, phone, address, city, items, total, currency }`.
Donation/payment-only sites skip this — their payments show as Transactions.

**3d. Studio link.** The assistant sets the dashboard merchant's `sanityStudioUrl`
to `{site}/studio` so the merchant's CMS page links to their editor.

---

## 4. CMS editing access (Sanity) — **You**

The Editor API token can't create datasets or invite members, so:

1. In Sanity (`Flot Merchant Sites`, project `oswn0868`):
   - **Datasets → Add dataset** → name it (e.g. `franco-resort`), **Public**.
   - **Members → Invite** the merchant's email, scoped to **only that dataset**
     (this is the per-merchant isolation).
2. The merchant then edits at **`{their-site}/studio`** (reached from the
   dashboard's CMS page).

---

## Result

The merchant logs in at `dashboard.flotme.ai` and gets:

| Feature | Source |
|---|---|
| **Transactions** | Flot webhook (step 2) |
| **Web Analytics** | tracker on their site (3b) |
| **CMS** | Sanity Studio at `{site}/studio` (3a, 3d, 4) |
| **Orders** | website posts to `/api/public/order` (3c, e-commerce only) |
| **Notifications / Customers / Payouts** | derived automatically from the above |

## Quick reference

| Thing | Value |
|---|---|
| Dashboard | `https://dashboard.flotme.ai` |
| Webhook URL | `…/api/webhooks/flot/{flotMerchantId}` |
| Tracker | `…/api/public/tracker.js?id={flotMerchantId}` |
| Public order API | `…/api/public/order` |
| Public CMS API | `…/api/public/cms/{flotMerchantId}/{slug}` |
| Sanity project | `oswn0868` ("Flot Merchant Sites") |
