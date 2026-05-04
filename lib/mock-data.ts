import { FxRate, SystemMetrics } from "@/types";

export const FX_RATES: FxRate[] = [
  { from: "NGN", to: "USD", rate: 0.000625, timestamp: "2025-05-03T12:00:00Z" },
  { from: "NGN", to: "EUR", rate: 0.000575, timestamp: "2025-05-03T12:00:00Z" },
  { from: "USD", to: "NGN", rate: 1600.0, timestamp: "2025-05-03T12:00:00Z" },
  { from: "USD", to: "EUR", rate: 0.92, timestamp: "2025-05-03T12:00:00Z" },
  { from: "EUR", to: "NGN", rate: 1740.0, timestamp: "2025-05-03T12:00:00Z" },
  { from: "EUR", to: "USD", rate: 1.087, timestamp: "2025-05-03T12:00:00Z" },
];

export function generateMetricsHistory(): SystemMetrics[] {
  return Array.from({ length: 24 }, (_, i) => ({
    latencyMs: Math.floor(40 + Math.random() * 60),
    throughputTps: Math.floor(800 + Math.random() * 400),
    uptimePercent: parseFloat((99.5 + Math.random() * 0.5).toFixed(2)),
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
  }));
}
