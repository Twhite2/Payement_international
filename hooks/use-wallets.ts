"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWallets } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function useWallets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wallets", user?.id],
    queryFn: () => fetchWallets(user!.id),
    enabled: !!user,
    refetchInterval: 5000,
  });
}
