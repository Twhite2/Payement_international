"use client";

import React from "react";
import { WalletCards } from "@/components/dashboard/wallet-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SystemStatus } from "@/components/dashboard/system-status";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <WalletCards />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <div>
          <SystemStatus />
        </div>
      </div>
    </div>
  );
}
