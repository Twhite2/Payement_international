import {
  Wallet,
  Transaction,
  FxRate,
  SystemMetrics,
  FraudAlert,
  SystemLog,
  SendPaymentPayload,
  User,
  Currency,
} from "@/types";

// All API calls go to server-side route handlers so the in-memory
// mock store is shared across every browser tab / user session.

export interface AccountLookupResult {
  found: boolean;
  accountNumber: string;
  ownerName?: string;
  walletId?: string;
  currency?: Currency;
}

export async function fetchWallets(userId: string): Promise<Wallet[]> {
  const res = await fetch(`/api/wallets?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch wallets");
  return res.json();
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const res = await fetch(`/api/transactions?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch transaction");
  return res.json();
}

export async function lookupAccount(accountNumber: string): Promise<AccountLookupResult> {
  const res = await fetch(`/api/accounts/lookup?account=${accountNumber}`);
  if (!res.ok) return { found: false, accountNumber };
  return res.json();
}

export async function sendPayment(payload: SendPaymentPayload): Promise<Transaction> {
  const res = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to send payment");
  }
  return res.json();
}

export async function fetchFxRate(from: Currency, to: Currency): Promise<FxRate | null> {
  const res = await fetch(`/api/fx-rates?from=${from}&to=${to}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchMetrics(): Promise<SystemMetrics[]> {
  const res = await fetch("/api/metrics");
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export async function fetchFraudAlerts(): Promise<FraudAlert[]> {
  const res = await fetch("/api/fraud-alerts");
  if (!res.ok) throw new Error("Failed to fetch fraud alerts");
  return res.json();
}

export async function fetchSystemLogs(): Promise<SystemLog[]> {
  const res = await fetch("/api/system-logs");
  if (!res.ok) throw new Error("Failed to fetch system logs");
  return res.json();
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
}

export async function signupUser(
  name: string,
  email: string,
  password: string
): Promise<{ message: string }> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Registration failed");
  }
  return res.json();
}
