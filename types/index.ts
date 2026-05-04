export type Currency = "NGN" | "USD" | "EUR";

export type TransactionStatus =
  | "Pending"
  | "Processing"
  | "Settled"
  | "Failed";

export type TransactionStage =
  | "Initiated"
  | "Authenticated"
  | "FraudChecked"
  | "Settled"
  | "Failed";

export interface Wallet {
  id: string;
  ownerId: string;
  ownerName: string;
  label: string;
  currency: Currency;
  balance: number;
  accountNumber: string;
}

export interface StageTimestamp {
  stage: TransactionStage;
  timestamp: string;
  latencyMs?: number;
}

export interface Transaction {
  id: string;
  senderWalletId: string;
  recipientWalletId: string;
  recipientAccountNo?: string;
  recipientName?: string;
  amount: number;
  currency: Currency;
  convertedAmount?: number;
  convertedCurrency?: Currency;
  fxRate?: number;
  status: TransactionStatus;
  stages: StageTimestamp[];
  iso20022Xml?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FxRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: string;
}

export interface SystemMetrics {
  latencyMs: number;
  throughputTps: number;
  uptimePercent: number;
  timestamp: string;
}

export interface FraudAlert {
  id: string;
  transactionId: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface SystemLog {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  source: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator";
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface SendPaymentPayload {
  senderWalletId: string;
  recipientWalletId: string;
  recipientAccountNo: string;
  recipientName?: string;
  amount: number;
  currency: Currency;
}
