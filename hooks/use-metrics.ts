"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMetrics, fetchFraudAlerts, fetchSystemLogs } from "@/lib/api";

export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    refetchInterval: 15000,
  });
}

export function useFraudAlerts() {
  return useQuery({
    queryKey: ["fraud-alerts"],
    queryFn: fetchFraudAlerts,
    refetchInterval: 10000,
  });
}

export function useSystemLogs() {
  return useQuery({
    queryKey: ["system-logs"],
    queryFn: fetchSystemLogs,
    refetchInterval: 10000,
  });
}
