# PayIntl Gateway — International Payment Processing Dashboard

Production-grade frontend dashboard for cross-border payment processing with real-time transaction tracking, multi-currency wallet management, and system monitoring.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Components:** shadcn/ui (Radix primitives)
- **Styling:** Tailwind CSS v4
- **State / Fetching:** @tanstack/react-query
- **Charts:** Recharts
- **Icons:** Lucide React
- **Validation:** Zod + React Hook Form

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the login page.

**Demo credentials:** Any email with a password of 6+ characters.

## Pages

| Route | Description |
|---|---|
| `/login` | Sign in |
| `/signup` | Create account |
| `/` | Dashboard — wallet balances, recent transactions, system status |
| `/send` | Send Payment — form with FX conversion preview |
| `/transactions` | Transaction list — searchable, filterable, paginated |
| `/transactions/[id]` | Transaction detail — lifecycle stepper, ISO 20022 XML |
| `/admin` | Monitoring — latency/throughput/uptime charts, fraud alerts, logs |

## Project Structure

```
app/
  (auth)/          Public pages (login, signup)
  (dashboard)/     Protected pages (dashboard, send, transactions, admin)
components/
  ui/              shadcn/ui primitives
  layout/          Sidebar, Header
  auth/            Auth guard
  dashboard/       Wallet cards, recent transactions, system status
  send/            Payment form with FX preview
  transactions/    Table, detail view with lifecycle stepper
  admin/           Metrics charts, fraud alerts, system logs
hooks/             React Query hooks (wallets, transactions, metrics, realtime)
lib/               API client, auth context, formatting utils, mock data
types/             Shared TypeScript interfaces
```

## API Integration

The app uses a mock data layer by default. Set `NEXT_PUBLIC_API_URL` to connect to a real backend. Set `NEXT_PUBLIC_WS_URL` for WebSocket real-time updates.

## Build

```bash
npm run build
npm start
```
