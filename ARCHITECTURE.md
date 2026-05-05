# PayIntl Gateway — Architecture & Development Guide

## Overview

PayIntl Gateway is a full-stack international payment processing dashboard built with **Next.js 16**, **React 19**, **Prisma 7**, and **PostgreSQL**. It simulates a real-time cross-border payment system with multi-currency wallets, FX conversion, ISO 20022 messaging, fraud detection, and system observability.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TailwindCSS 4, shadcn/ui, Radix UI |
| State/Fetching | TanStack React Query v5 |
| ORM | Prisma 7 (prisma-client generator) |
| Database | PostgreSQL |
| DB Adapter | @prisma/adapter-pg (node-postgres driver) |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | Sonner |
| Forms | React Hook Form + Zod |

---

## Project Structure

```
PaymentInternational/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no layout chrome)
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/              # Dashboard route group (sidebar + header)
│   │   ├── layout.tsx            # AuthGuard + Sidebar + Header wrapper
│   │   ├── page.tsx              # Main dashboard (wallets, transactions, status)
│   │   ├── admin/page.tsx        # Admin panel (metrics charts, fraud, logs)
│   │   ├── send/page.tsx         # Send payment form
│   │   └── transactions/
│   │       ├── page.tsx          # Transaction list
│   │       └── [id]/page.tsx     # Transaction detail (live lifecycle)
│   ├── api/                      # Server-side API routes
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── signup/route.ts
│   │   │   └── validate/route.ts
│   │   ├── accounts/lookup/route.ts
│   │   ├── wallets/route.ts
│   │   ├── transactions/route.ts
│   │   ├── transactions/[id]/route.ts
│   │   ├── payments/route.ts     # Payment lifecycle engine
│   │   ├── fraud-alerts/route.ts
│   │   ├── system-logs/route.ts
│   │   ├── fx-rates/route.ts
│   │   └── metrics/route.ts      # Real-time system metrics
│   ├── layout.tsx                # Root layout (Providers wrapper)
│   └── globals.css               # Tailwind + CSS variables
├── components/
│   ├── admin/                    # Admin panel components
│   │   ├── metrics-charts.tsx    # 24h latency/throughput/uptime charts
│   │   ├── fraud-alerts-table.tsx
│   │   └── system-logs-table.tsx
│   ├── auth/
│   │   └── auth-guard.tsx        # Redirects unauthenticated users
│   ├── dashboard/
│   │   ├── wallet-cards.tsx      # Multi-currency wallet display
│   │   ├── recent-transactions.tsx
│   │   └── system-status.tsx     # Live uptime/latency/throughput
│   ├── layout/
│   │   ├── sidebar.tsx           # Navigation sidebar
│   │   └── header.tsx            # Top bar + notifications
│   ├── send/
│   │   └── payment-form.tsx      # Send payment with account lookup
│   ├── transactions/
│   │   ├── transaction-list.tsx
│   │   └── transaction-detail.tsx # Live stage progression
│   ├── providers.tsx             # QueryClient + AuthProvider + Toaster
│   └── ui/                       # shadcn/ui primitives (button, card, etc.)
├── hooks/
│   ├── use-wallets.ts            # User-scoped wallet fetching
│   ├── use-transactions.ts       # User-scoped transactions + single txn polling
│   └── use-metrics.ts            # Metrics, fraud alerts, system logs
├── lib/
│   ├── api.ts                    # Client-side API functions (fetch wrappers)
│   ├── auth-context.tsx          # React context for auth state + localStorage
│   ├── mock-data.ts              # Static FX rates + metrics generator (fallback)
│   ├── prisma.ts                 # Prisma client singleton with PrismaPg adapter
│   ├── generated/prisma/         # Generated Prisma client (auto-generated)
│   └── utils.ts                  # cn() utility for className merging
├── prisma/
│   ├── schema.prisma             # Database schema definition
│   ├── migrations/               # SQL migration files
│   └── prisma.config.ts          # Prisma CLI configuration (datasource URL)
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── postcss.config.mjs
└── .env                          # DATABASE_URL (not committed)
```

---

## Data Architecture

### Database Schema (PostgreSQL via Prisma)

```
┌──────────┐       ┌──────────┐       ┌───────────────┐
│   User   │──1:N──│  Wallet  │──1:N──│  Transaction  │
└──────────┘       └──────────┘       └───────────────┘
                                             │
                                      ┌──────┴──────┐
                                      │             │
                              ┌───────────────┐  ┌──────────────┐
                              │TransactionStage│ │  FraudAlert  │
                              └───────────────┘  └──────────────┘

                        ┌────────────┐
                        │ SystemLog  │  (standalone audit trail)
                        └────────────┘
```

**Models:**

| Model | Purpose |
|-------|---------|
| `User` | Registered users (name, email, password, role) |
| `Wallet` | Multi-currency wallets with unique account numbers |
| `Transaction` | Payment records with status lifecycle |
| `TransactionStage` | Ordered stages (Initiated → Authenticated → FraudChecked → Settled) |
| `FraudAlert` | Flagged transactions exceeding thresholds |
| `SystemLog` | Audit trail for auth, payments, settlement events |

### Wallet Provisioning

On signup, each user receives 3 wallets:
- **NGN Operating Account** — ₦500,000
- **USD Correspondent Account** — $1,000
- **EUR Settlement Account** — €800

Each wallet has a unique 10-digit account number for cross-user transfers.

---

## Payment Lifecycle

When a payment is submitted via `POST /api/payments`:

```
[Client]                    [Server]                     [Database]
   │                           │                             │
   │── POST /api/payments ────►│                             │
   │                           │── Validate sender balance ──►│
   │                           │── Resolve recipient acct ───►│
   │                           │── Calculate FX rate ────────►│
   │                           │── Create Transaction ───────►│
   │                           │── Stage: "Initiated" ───────►│
   │                           │── System Log ───────────────►│
   │◄── 200 (Transaction) ────│                             │
   │                           │                             │
   │  (async setTimeout chain) │                             │
   │                           │── 2s: "Authenticated" ─────►│
   │                           │── 3s: "FraudChecked" ──────►│
   │                           │     (or "Failed" if fraud)  │
   │                           │── 2s: Balance updates ─────►│
   │                           │── ISO 20022 XML generated ──►│
   │                           │── Stage: "Settled" ─────────►│
   │                           │                             │
   │── GET /api/transactions/id (polling every 2s) ─────────►│
   │◄── Updated stages ────────────────────────────────────── │
```

### Stage Delays
| Stage | Delay | Action |
|-------|-------|--------|
| Initiated | 0ms | Transaction created, recorded in DB |
| Authenticated | +2s | Payment credentials verified |
| FraudChecked | +3s | Amount checked against thresholds |
| Settled | +2s | Balances updated, ISO 20022 XML generated |

### Fraud Detection
Transactions in NGN exceeding ₦50,000,000 are automatically blocked and flagged with a high-severity fraud alert.

### FX Conversion
Cross-currency payments are automatically converted using static FX rates:
- NGN → USD: 0.000625
- NGN → EUR: 0.000575
- USD → NGN: 1600.0
- USD → EUR: 0.92
- EUR → NGN: 1740.0
- EUR → USD: 1.087

---

## Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│ Login/Signup│────►│ /api/auth/*  │────►│ PostgreSQL │
│   (Client)  │◄────│   (Server)   │◄────│            │
└─────────────┘     └──────────────┘     └────────────┘
       │
       ▼
┌─────────────────────┐
│ localStorage + React│
│ Context (AuthState) │
└─────────────────────┘
```

- **Signup**: Creates user + provisions wallets + logs event
- **Login**: Looks up user by email; auto-registers if not found (demo mode)
- **Validate**: On page load, hydrates session from localStorage and verifies user exists in DB
- **AuthGuard**: Client component that redirects to `/login` if not authenticated

Token format: `mock-jwt-{userId}-{timestamp}` (demo — not cryptographically secure)

---

## Client-Side Architecture

### Data Fetching Pattern

All data flows through **React Query hooks** → **API functions** → **Next.js API routes** → **Prisma** → **PostgreSQL**:

```
Component → useWallets() → fetchWallets() → GET /api/wallets → prisma.wallet.findMany()
```

| Hook | Endpoint | Polling |
|------|----------|---------|
| `useWallets()` | `/api/wallets?userId=` | 5s |
| `useTransactions()` | `/api/transactions?userId=` | 5s |
| `useTransaction(id)` | `/api/transactions/{id}` | 2s (stops when settled/failed) |
| `useMetrics()` | `/api/metrics` | 15s |
| `useFraudAlerts()` | `/api/fraud-alerts` | 10s |
| `useSystemLogs()` | `/api/system-logs` | 10s |

### Routing

The app uses Next.js **Route Groups**:
- `(auth)` — Login & signup pages (no sidebar/header)
- `(dashboard)` — All authenticated pages (wrapped in AuthGuard + layout)

### State Management
- **Server state**: React Query (caching, polling, background refetch)
- **Auth state**: React Context + localStorage persistence
- **Form state**: React Hook Form with Zod validation
- **Notifications**: In-memory array in Header component (from transaction events)

---

## System Metrics (Real-time)

The `/api/metrics` endpoint computes live values from the database:

| Metric | Source |
|--------|--------|
| **Avg Latency** | `AVG(TransactionStage.latencyMs)` across all stages |
| **Throughput** | Count of settled transactions in last hour → TPS |
| **Uptime** | Blend of server uptime + transaction success rate |

Returns a 24-hour history array for charting, with per-hour breakdowns.

---

## API Routes Reference

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/signup` | Register new user + provision wallets |
| POST | `/api/auth/login` | Authenticate (auto-registers if new) |
| POST | `/api/auth/validate` | Validate session on page load |
| GET | `/api/wallets?userId=` | Fetch user's wallets |
| GET | `/api/transactions?userId=` | Fetch user's transactions |
| GET | `/api/transactions/[id]` | Single transaction with stages |
| GET | `/api/accounts/lookup?account=` | Resolve account number → owner |
| POST | `/api/payments` | Initiate payment + start lifecycle |
| GET | `/api/fx-rates?from=&to=` | Get exchange rate |
| GET | `/api/metrics` | System health (computed from DB) |
| GET | `/api/fraud-alerts` | All fraud alerts |
| GET | `/api/system-logs` | Recent 100 system logs |

---

## Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Build & Run
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

### Render (Free Tier)
- **Web Service** build command:
  ```
  npm install && npx prisma generate && npx prisma migrate deploy && npm run build
  ```
- **Start command**: `npm start`
- **Environment**: Set `DATABASE_URL` to the Render PostgreSQL Internal URL

---

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

### Key Development Patterns

1. **Prisma Client Singleton** (`lib/prisma.ts`): Uses `PrismaPg` adapter with global caching to prevent connection exhaustion in development hot-reload.

2. **API → DB Separation**: All database access is server-side only (API routes). Client components never import Prisma directly.

3. **Optimistic Polling**: Transaction detail page polls every 2s to show real-time stage progression, then stops when status reaches "Settled" or "Failed".

4. **Account Number Lookup**: When sending a payment, the recipient field auto-resolves account numbers to show the owner name and currency.

5. **ISO 20022 Compliance**: On settlement, the system generates a `pacs.008.001.08` XML document per transaction.

---

## Security Considerations (Demo)

> ⚠️ This is a demonstration application. Production deployments would require:

- Proper JWT/session authentication (currently mock tokens)
- Password hashing (bcrypt/argon2 — currently stored plain)
- Rate limiting on auth endpoints
- CSRF protection
- Input sanitization beyond basic validation
- Database connection pooling (PgBouncer)
- Proper secrets management

---

## File Dependency Graph

```
types/index.ts          ← Shared interfaces (Wallet, Transaction, User, etc.)
     ↑
lib/api.ts              ← Client fetch wrappers (calls /api/* routes)
     ↑
hooks/use-*.ts          ← React Query hooks (useWallets, useTransactions, etc.)
     ↑
components/**/*.tsx     ← UI components consuming hooks
     ↑
app/(dashboard)/**      ← Page components composing UI components

lib/prisma.ts           ← Prisma singleton (server-side only)
     ↑
app/api/**/route.ts     ← API route handlers (use prisma for DB access)
     ↑
prisma/schema.prisma    ← Database schema definition
```
