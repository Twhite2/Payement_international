import { Currency, TransactionStatus } from "@/types";

const currencyFormatters: Record<Currency, Intl.NumberFormat> = {
  NGN: new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
  EUR: new Intl.NumberFormat("en-DE", { style: "currency", currency: "EUR" }),
};

export function formatCurrency(amount: number, currency: Currency): string {
  return currencyFormatters[currency].format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function statusColor(
  status: TransactionStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Settled":
      return "default";
    case "Processing":
      return "secondary";
    case "Pending":
      return "outline";
    case "Failed":
      return "destructive";
    default:
      return "default";
  }
}

export function statusDotColor(status: TransactionStatus): string {
  switch (status) {
    case "Settled":
      return "bg-emerald-500";
    case "Processing":
      return "bg-amber-500";
    case "Pending":
      return "bg-slate-400";
    case "Failed":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-200";
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "low":
      return "bg-slate-100 text-slate-800 border-slate-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

export function truncateId(id: string, maxLen: number = 18): string {
  if (id.length <= maxLen) return id;
  return id.slice(0, maxLen) + "...";
}
