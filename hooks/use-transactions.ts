"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTransactions, fetchTransaction } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: () => fetchTransactions(user!.id),
    enabled: !!user,
    refetchInterval: 5000,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ["transactions", id],
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "Settled" || status === "Failed") return false;
      return 2000;
    },
  });
}
