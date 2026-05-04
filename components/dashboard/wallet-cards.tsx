"use client";

import React from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallets } from "@/hooks/use-wallets";
import { formatCurrency } from "@/lib/format";
import type { Currency } from "@/types";

const currencyFlags: Record<Currency, string> = {
  NGN: "NGN",
  USD: "USD",
  EUR: "EUR",
};

export function WalletCards() {
  const { data: wallets, isLoading } = useWallets();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-40" />
              <Skeleton className="mt-2 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {wallets?.map((wallet) => (
        <Card key={wallet.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {wallet.label}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(wallet.balance, wallet.currency)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {currencyFlags[wallet.currency]} &middot; Acct{" "}
              {wallet.accountNumber}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
