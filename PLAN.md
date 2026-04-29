# Flot Merchant Dashboard — Master Plan

> Last updated: 2026-04-28  
> Stack decision: Next.js 14 (App Router) · Prisma · PostgreSQL · next-auth v5 · Tailwind CSS

---

## 0. Confirmed Decisions

| Question | Answer |
|---|---|
| Does Flot have an existing backend/API? | **Yes** — dashboard connects to it |
| Where do merchant accounts live? | **In the Flot system** — we authenticate against Flot's API |
| Are merchant websites already built? | **Yes** — CMS pushes changes to existing Flot-built sites via API |
| Brand colors | `#51bdce` (teal primary) · `#3d3d3d` (dark gray) · `#80ffdd` (mint green accent) |
| Flot backend language | **Node.js / JavaScript** |
| Delivery tracking | **Not needed** — merchants handle their own delivery; dashboard only shows order status |
| Currencies | **SLE** (primary) and **USD** |
| Merchant onboarding | **SSO with Flot credentials** — see Section 12 for full decision |

### Critical Architecture Implication
Since Flot already has a backend/API and merchant accounts, this dashboard is an **API consumer**, not a standalone backend. The flow is:

```
Merchant logs in → dashboard authenticates via Flot API → gets merchant token
All data (transactions, orders, products, customers) → fetched from Flot API
CMS changes → pushed to Flot API → Flot updates the live website
Dashboard's own DB (Neon) → used only for: notifications, UI preferences, analytics cache
```

This means we do **not** duplicate data — Flot's API is the source of truth.

---

## 1. What Is This?

A **centralized merchant dashboard** for all merchants in the Flot ecosystem. Flot is a checkout/payment product — merchants use Flot Checkout to accept payments, either through:

- **QR-code only merchants** — no website; customers scan a QR code and pay via Flot
- **Website merchants** — have a website powered by Flot; customers can order online (delivery or pickup)

The dashboard adapts based on merchant type. Website-specific modules (CMS, web analytics, order management) are **hidden** for QR-only merchants.

---

## 2. Feature Matrix

| Feature | QR-only Merchant | Website Merchant |
|---|---|---|
| Auth (login / forgot password) | ✅ | ✅ |
| Dashboard overview (revenue snapshot) | ✅ | ✅ |
| Transaction history (card / in-app / momo payments) | ✅ | ✅ |
| Revenue & earnings analytics (charts) | ✅ | ✅ |
| QR code management (view / download) | ✅ | ✅ |
| Payout / withdrawal requests | ✅ | ✅ |
| Customer list (who has paid) | ✅ | ✅ |
| Notifications (new payment alerts) | ✅ | ✅ |
| Profile & account settings | ✅ | ✅ |
| Support / help center | ✅ | ✅ |
| **Order management** (status workflow) | ❌ | ✅ |
| **Website CMS** (edit pages, products, info) | ❌ | ✅ |
| **Website analytics** (visitors, page views) | ❌ | ✅ |
| **Product catalog management** | ❌ | ✅ |
| **Discount / coupon management** | ❌ | ✅ |

---

## 3. Module Breakdown

### 3.1 Auth
- Login with email + password
- Forgot password (email reset link)
- Session management via next-auth v5
- Each merchant account is scoped — they only see their own data

### 3.2 Dashboard Overview
- Total revenue (today / this week / this month / all-time)
- Number of transactions
- Pending orders count (website merchants)
- Quick action buttons (view QR, withdraw, add product)
- Recent transactions list
- Revenue chart (last 30 days)

### 3.3 Transaction History
- Table of all payments received via Flot Checkout
- Columns: Date, Order ID, Flot Request ID, Amount, Payment Type, Status
- Payment types shown: Card, In-App, MoMo (mobile money)
- Filter by date range, status, payment type
- Export to CSV

### 3.4 Revenue & Earnings Analytics
- Line/bar charts (recharts already installed)
- Daily / weekly / monthly toggles
- Top products or top payment sources
- Comparison period (this month vs last month)

### 3.5 QR Code Management
- Display merchant's Flot QR code
- Download as PNG/SVG
- Share link

### 3.6 Payout / Withdrawal
- Available balance display
- Request payout (bank account or mobile money)
- Payout history

### 3.7 Customer Management
- List of unique customers who have paid
- Customer profile: name, contact (if captured), total spend, order count
- Basic search and filter

### 3.8 Order Management (Website merchants only)
- Incoming order notifications
- Order detail: items ordered, amount, customer info, pickup or delivery note from customer
- Order status workflow: **New → Confirmed → Ready → Completed**
- Merchant marks order as confirmed, then ready, then done
- No built-in delivery tracking — merchant handles delivery on their end

### 3.9 CMS (Website merchants only)
- Edit website pages (hero text, about, contact info, banner images)
- Product management: add / edit / delete products with images, prices, descriptions
- Categories management
- Image uploads (stored in cloud via Uploadthing)
- Preview link to live website
- **How it works:** Dashboard stores all content in its own DB. Merchant websites are updated to fetch their content from the dashboard's public API (`GET /api/public/cms/[merchantId]`). No third-party CMS needed — the dashboard IS the CMS backend. See Section 12 for full decision.

### 3.10 Website Analytics (Website merchants only)
- Page views, unique visitors, bounce rate
- Traffic sources
- Popular pages / products
- Powered by a lightweight analytics integration

### 3.11 Notifications
- In-app notification center
- Real-time toast when new payment or order arrives
- Email digest (daily / weekly summary)

### 3.12 Settings
- Business profile (name, logo, address, contact)
- Bank/payout account details
- Staff access management (add team members with limited roles)
- Notification preferences
- Password change

---

## 4. Tech Stack

### Frontend
| Tool | Purpose | Already installed? |
|---|---|---|
| Next.js 14 App Router | Framework | ✅ |
| Tailwind CSS | Styling | ✅ |
| shadcn/ui | Component library (built on CVA + clsx) | needs setup |
| lucide-react | Icons | ✅ |
| recharts | Charts / analytics graphs | ✅ |
| class-variance-authority + clsx + tailwind-merge | Utility classes | ✅ |

> **Recommendation:** Run `npx shadcn@latest init` to set up shadcn/ui — it uses the CVA infrastructure already installed and gives ready-made components (tables, dialogs, forms, dropdowns) so we don't build from scratch.

### Backend / API
| Tool | Purpose | Already installed? |
|---|---|---|
| Next.js API Routes | Backend API (same project) | ✅ |
| Prisma ORM | Database queries | ✅ |
| next-auth v5 | Authentication & sessions | ✅ |
| @auth/prisma-adapter | Auth ↔ DB adapter | ✅ |
| bcryptjs | Password hashing | ✅ |
| Zod | Input validation | needs install |

### Database
| Option | Type | Free Tier | Notes |
|---|---|---|---|
| **Neon** (recommended) | Serverless Postgres | ✅ 0.5 GB | Best for Vercel deploys, auto-pause |
| Supabase | Postgres + extras | ✅ 500 MB | Also gives auth, storage, realtime |
| PlanetScale | MySQL serverless | ❌ (removed free tier) | Not recommended anymore |
| Railway Postgres | Postgres | $5 credit/mo | Good DX, easy setup |

**Decision: Neon** — pairs perfectly with Vercel, serverless, free to start.

### File Storage (for CMS images, logos)
| Option | Free Tier | Notes |
|---|---|---|
| **Cloudinary** (recommended) | ✅ 25 credits/mo | Image optimization built-in, easy transforms |
| AWS S3 | Very cheap but not free | More control, more setup |
| Supabase Storage | ✅ 1 GB | Only if using Supabase as DB |
| Uploadthing | ✅ 2 GB | Next.js-native, easiest setup |

**Decision: Uploadthing** — easiest Next.js App Router integration. Already installed.

### Real-time (order/payment notifications)
| Option | Free Tier | Notes |
|---|---|---|
| **Pusher** | ✅ 200k msgs/day | Easiest to use |
| Ably | ✅ 6M msgs/mo | More generous free tier |
| Supabase Realtime | ✅ if using Supabase | Built-in if DB is Supabase |
| Server-Sent Events (SSE) | Free (self-hosted) | No extra service, works in Next.js |

**Decision: Start with SSE (free, no service)** — upgrade to Pusher/Ably if needed.

### Email (notifications, password reset)
| Option | Free Tier | Notes |
|---|---|---|
| **Resend** (recommended) | ✅ 3,000/mo | Modern API, React email templates |
| SendGrid | ✅ 100/day | More complex, more features |
| Nodemailer + Gmail | Free | Fragile for production |

**Decision: Resend** — simple API, great Next.js integration.

### Website Analytics (for merchant website traffic)
| Option | Free Tier | Notes |
|---|---|---|
| **Vercel Analytics** | ✅ hobby plan | Zero config if deploying on Vercel |
| Plausible (self-hosted) | Free to self-host | Privacy-friendly, lightweight |
| Google Analytics via embed | Free | Can embed GA in merchant sites |
| Custom (Prisma events) | Free | Build our own basic tracker |

**Decision: Custom lightweight tracker** — `POST /api/public/track` from merchant sites, stored in Prisma. Display in dashboard analytics page.

### Deployment
| Option | Free Tier | Notes |
|---|---|---|
| **Vercel** (recommended) | ✅ hobby | Perfect for Next.js, CI/CD built-in |
| Railway | $5 credit | Good for full-stack with DB |
| Render | ✅ limited | Cold starts on free tier |

**Decision: Vercel** — zero-config Next.js deploy.

---

## 5. Database Schema

After reading the Flot API docs, the architecture shifts: **the dashboard IS the webhook receiver** for merchant orders. Flot sends webhooks only once, so we must store every event permanently in our DB. The local DB is now more substantial than initially thought.

```prisma
// Dashboard login account (separate from Flot user account)
model Merchant {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String
  name            String
  businessName    String
  type            MerchantType  // QR_ONLY | WEBSITE
  flotMerchantId  String   @unique  // ID given by Flot Staff
  webhookUsername String   // Basic auth username for Flot → dashboard webhook
  webhookPassword String   // Basic auth password (hashed)
  createdAt       DateTime @default(now())

  orders          Order[]
  notifications   InAppNotification[]
  notifPrefs      NotificationPrefs?
  analyticsEvents WebsiteAnalyticsEvent[]
}

// Received from Flot webhook: POST /api/webhooks/flot/[merchantId]
// Flot sends this ONCE only — must be stored immediately on receipt
model Order {
  id              String      @id @default(cuid())
  merchantId      String
  merchant        Merchant    @relation(fields: [merchantId], references: [id])
  orderId         String      @unique  // merchant's own order ID (from their website)
  flotRequestId   String      @unique  // Flot's unique transfer request ID
  status          OrderStatus // COMPLETED | FAILED | PENDING
  paymentType     String?     // "card" | "in-app" | "momo"
  amount          Decimal?    // populated if merchant website sends it along
  currency        String?     // "SLE" | "USD"
  rawPayload      Json        // full webhook body stored as-is (safety net)
  receivedAt      DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

// CMS content — merchant websites fetch from GET /api/public/cms/[merchantId]
model WebsiteContent {
  id         String   @id @default(cuid())
  merchantId String
  merchant   Merchant @relation(fields: [merchantId], references: [id])
  pageKey    String   // e.g. "hero", "about", "contact", "banner"
  content    Json     // flexible content block
  updatedAt  DateTime @updatedAt
  @@unique([merchantId, pageKey])
}

// Products managed via CMS
model Product {
  id          String   @id @default(cuid())
  merchantId  String
  merchant    Merchant @relation(fields: [merchantId], references: [id])
  name        String
  description String?
  price       Decimal
  currency    String   @default("SLE")
  images      Json     // array of Uploadthing URLs
  category    String?
  inStock     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum OrderStatus { COMPLETED FAILED PENDING }
enum MerchantType { QR_ONLY WEBSITE }

model NotificationPrefs {
  id              String   @id @default(cuid())
  merchantId      String   @unique
  merchant        Merchant @relation(fields: [merchantId], references: [id])
  emailDigest     Boolean  @default(true)
  digestFreq      String   @default("DAILY")
  newOrderAlert   Boolean  @default(true)
}

model InAppNotification {
  id         String   @id @default(cuid())
  merchantId String
  merchant   Merchant @relation(fields: [merchantId], references: [id])
  type       String
  title      String
  body       String
  read       Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model WebsiteAnalyticsEvent {
  id         String   @id @default(cuid())
  merchantId String
  merchant   Merchant @relation(fields: [merchantId], references: [id])
  page       String
  referrer   String?
  createdAt  DateTime @default(now())
}
```

> **Note on QR-only merchant transactions:** QR merchants use the Flot app directly, not the payment link API. Their transactions are internal to Flot. We need to ask the Flot backend team if there's a separate API to fetch QR transaction history for a merchant — or if QR transactions also send webhooks. This is the **last open question** (see Section 14).

---

## 6. Backend Architecture

### API Environments
| Env | Base URL |
|---|---|
| Staging | `https://api.stage.flotme.ai` |
| Production | `https://api.app.flotme.ai` |

### Key Flot API Endpoints (confirmed)
| Method | Path | Purpose |
|---|---|---|
| POST | `/merchants/private/v1/payment-links` | Generate a checkout payment link |

> Full spec in `flot-merchant-api.yaml` — request this from the backend team.

### Signature Generation (for payment link requests)
Each merchant has their own RSA-4096 private key. To call the payment link endpoint:
```
signature = Base64(RSA_PSS_SHA512(requestBody, merchantPrivateKey))
// sent as: X-Flot-Merchant-Signature: <signature>
```
**Security implication:** Private keys must never be stored in the dashboard DB. If the dashboard needs to generate payment links (e.g. for re-orders), it should proxy the signing to the merchant's own server, OR we store encrypted keys with the merchant's consent — decision needed.

### Dashboard API Structure (Next.js App Router)
```
app/
  api/
    auth/                       → next-auth handlers (dashboard login)
    webhooks/
      flot/[merchantId]/        → POST — receives Flot order webhooks (Basic Auth)
    orders/                     → GET list, GET detail (reads from our DB)
    analytics/
      revenue/                  → aggregated order totals from our DB
      website/                  → page view events from our DB
    notifications/              → list, mark-read
    cms/
      content/                  → GET/PUT website page content (authenticated)
      products/                 → CRUD products (authenticated)
    public/
      cms/[merchantId]/         → GET — PUBLIC endpoint, no auth
                                   merchant websites call this to get their content
      track/                    → POST — page view event tracker (called from merchant sites)
    uploads/                    → file upload (Uploadthing)
    settings/                   → notification prefs, profile
```

### Auth Flow (Revised — Dashboard-native auth)
The Flot merchant API uses RSA keys, not username/password auth. The dashboard has its own login:
1. Merchant is provisioned in the dashboard by Flot Staff (or auto-created when merchant is set up)
2. Merchant logs into dashboard with email + dashboard password
3. next-auth creates a JWT session with `merchantId` + `flotMerchantId` + `type`
4. All dashboard DB queries are scoped to `merchantId`

> **Note:** The SSO-via-Flot-API plan is not feasible with the current API (it's RSA-key based, not user-session based). Dashboard has its own credentials.

### Webhook Endpoint (Critical — Flot sends only ONCE, no retry)
```
POST /api/webhooks/flot/[merchantId]
Authorization: Basic <base64(webhookUsername:webhookPassword)>

Body: {
  orderId: string,        // merchant's own order ID
  flotRequestId: string,  // Flot's unique transfer ID
  status: "completed" | "failed"
}
```
**Processing rules:**
- Verify Basic Auth credentials against stored `webhookUsername` / `webhookPassword` for that merchant
- If `status === "completed"` → save order as COMPLETED, trigger in-app notification
- If `status === "failed"` → save/update order as PENDING (user can retry payment)
- Response must be `200 OK` — Flot does not retry on failure
- Use DB transaction + idempotency check (`flotRequestId` unique constraint) to prevent duplicates

### Merchant Webhook Registration
When a merchant is onboarded to the dashboard, we generate:
- A webhook URL: `https://dashboard.flotme.ai/api/webhooks/flot/<merchantId>`
- Basic auth credentials (auto-generated username + password)

The merchant (or Flot Staff) provides these to Flot when setting up the merchant account.

---

## 7. Frontend Architecture

```
app/
  (auth)/
    login/
    forgot-password/
  (dashboard)/
    layout.tsx          → sidebar + top nav wrapper
    page.tsx            → overview/home
    transactions/
    analytics/
    qr-code/
    payouts/
    customers/
    orders/             → website merchants only
    products/           → website merchants only
    cms/                → website merchants only
    website-analytics/  → website merchants only
    notifications/
    settings/
components/
  ui/                   → shadcn components
  charts/               → recharts wrappers
  layout/               → sidebar, header, nav
  dashboard/            → stat cards, recent tables
lib/
  auth.ts               → next-auth config
  db.ts                 → prisma client
  utils.ts
prisma/
  schema.prisma
```

### Conditional Rendering Logic
```tsx
// In layout or middleware
const merchant = await getMerchant(session.merchantId)
const showWebsiteFeatures = merchant.hasWebsite && merchant.type === "WEBSITE"
```
Website-only nav items simply don't render for QR-only merchants.

---

## 8. Packages Still Needed

```bash
# UI components
npx shadcn@latest init

# Validation
npm install zod

# File uploads
npm install uploadthing @uploadthing/react

# Email
npm install resend

# Date handling
npm install date-fns

# Forms
npm install react-hook-form @hookform/resolvers
```

---

## 9. Estimated Costs (Monthly, at launch scale)

| Service | Free Tier | Paid starts at |
|---|---|---|
| Vercel (hosting) | Free (hobby) | $20/mo (pro) |
| Neon (database) | Free (0.5 GB) | $19/mo |
| Cloudinary / Uploadthing | Free | ~$0–$99/mo |
| Resend (email) | 3,000 emails/mo free | $20/mo (50k) |
| Pusher (if needed) | 200k msgs/day free | $49/mo |
| **Total at launch** | **$0** | **~$20–$100/mo** |

---

## 10. Development Phases

### Phase 1 — Foundation (Week 1–2)
- [ ] Prisma schema + migrations
- [ ] Auth (login, session, forgot password)
- [ ] Dashboard layout (sidebar, header, responsive)
- [ ] Overview page (static then wired up)

### Phase 2 — Core Features (Week 3–4)
- [ ] Transaction history (list + filters)
- [ ] Revenue analytics (charts)
- [ ] QR code page
- [ ] Profile & settings
- [ ] Flot webhook endpoint

### Phase 3 — Website Merchant Features (Week 5–6)
- [ ] Order management (list, status updates)
- [ ] Product catalog CRUD
- [ ] CMS page editor
- [ ] Website analytics dashboard

### Phase 4 — Polish (Week 7)
- [ ] Notifications (in-app + email)
- [ ] Payout request flow
- [ ] Customer management
- [ ] Staff access management
- [ ] Mobile responsiveness audit

### Phase 5 — Launch
- [ ] Deploy to Vercel + Neon
- [ ] Connect Flot webhook
- [ ] Merchant onboarding flow

---

## 11. Design System

### Brand Colors
```css
--color-primary:   #51bdce;   /* Teal — buttons, links, active states */
--color-dark:      #3d3d3d;   /* Dark gray — text, sidebar background */
--color-accent:    #80ffdd;   /* Mint green — highlights, badges, success states */

/* Derived (suggested) */
--color-primary-light: #e8f8fb;  /* Light teal — hover backgrounds */
--color-surface:  #f9fafb;        /* Off-white — page backgrounds */
--color-border:   #e5e7eb;        /* Subtle borders */
```

### Component Color Map
- Sidebar background: `#3d3d3d`
- Sidebar active item: `#51bdce`
- Primary buttons: `#51bdce`
- Chart primary line/bar: `#51bdce`
- Revenue positive: green (`#22c55e`)
- Alert/error: red (`#ef4444`)

---

## 12. Confirmed Decisions — Onboarding & CMS

### Merchant Onboarding

The Flot API uses RSA-4096 signatures (not username/password), so SSO isn't possible. The dashboard has its own auth. Here's the recommended flow:

**Decision: Email invite triggered by Flot Staff**

1. Flot Staff sets up a new merchant in the Flot system (as they do today)
2. Flot Staff also opens a simple **Admin panel** in this dashboard and creates the merchant record (name, email, `flotMerchantId`, merchant type)
3. Dashboard auto-sends the merchant an **invite email** with a link to set their password
4. Merchant clicks link → sets password → logged in → sees their dashboard

This gives merchants their own email + password for the dashboard, which is what they expect. Flot Staff only needs to do the one extra step of creating the dashboard account (takes 30 seconds).

**Alternative (future):** If Flot's backend team adds a webhook when a new merchant is created, we can fully automate step 2 — the dashboard creates the account automatically.

```
Flow:
Flot Staff creates merchant in Flot → 
opens dashboard admin panel → 
creates merchant account (name, email, flotMerchantId, type) → 
dashboard sends invite email → 
merchant sets password → 
merchant logs in
```

---

### CMS Solution

Flot doesn't have a CMS API. Since the merchant websites are built by the Flot dev team, the cleanest solution is:

**Decision: Sanity CMS** (confirmed by user)

Sanity is a headless CMS with a great API (GROQ queries) and generous free tier.

**Architecture:**
- One Sanity project, one dataset
- Document types: `merchantPage`, `product`, `category` — all scoped with a `merchantId` field
- Dashboard CMS module uses `@sanity/client` to read/write documents filtered by `flotMerchantId`
- Merchant websites already use (or are updated to use) Sanity Client to fetch their content via GROQ

**Dashboard CMS UI:**
- Custom forms in the dashboard (not embedded Sanity Studio) — merchants only see their own content
- Rich text with Portable Text for page content
- Image uploads via Uploadthing or Sanity's built-in asset pipeline

**Merchant website change needed:**
Update each website to query Sanity with a `merchantId` filter instead of hardcoded content. One-time update per site.

**Packages installed:** `next-sanity`, `@sanity/client`, `@sanity/image-url`

**Sanity setup needed:**
1. Create project at sanity.io
2. Define schema (merchantPage, product, category)
3. Add `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN` to `.env.local`

---

## 13. Currency Handling

- Primary: **SLE** (Sierra Leonean Leone — symbol `Le`)
- Secondary: **USD** (symbol `$`)
- All amounts stored and displayed with currency code
- Format examples: `Le 250,000` / `$180.00`
- Dashboard auto-detects currency from transaction data; shows both if merchant has both

---

## 14. Flot API Reference (from flot-merchant-api.yaml)

### Payment Link Endpoint
```
POST /merchants/private/v1/payment-links
Header: X-Flot-Merchant-Signature: <RSA-4096/SHA512/PSS/Base64>

Body:
{
  merchantId: string (UUID),
  type: "card" | "in-app" | "momo",
  payload: {
    orderId: string,
    amount: string (decimal),
    currency: string
  }
}

Response:
{
  data: {
    link: string | null,   // URL — set for card and in-app types
    code: string | null    // USSD code e.g. "*175*124325463#" — set for momo type
  }
}
```

### Error Codes
| Code | Status | Meaning |
|---|---|---|
| `REQUIRED` | 400 | Missing required field |
| `INVALID_FIELD` | 400 | Invalid field value |
| `ORDER_ALREADY_COMPLETED` | 400 | Order was already paid |
| `CURRENCY_NOT_AVAILABLE_FOR_ORDER` | 400 | Currency not configured for this merchant |

### Webhook Payload (Flot → Dashboard)
```json
{
  "orderId": "order-123",
  "flotRequestId": "123456",
  "status": "completed" | "failed"
}
```
- `failed` = credit card error, user can retry → keep order as PENDING
- Sent **once only**, no retry

---

## 15. No Remaining Open Questions

All major decisions are resolved. Ready to begin Phase 1 development.
