"use client";

import React from "react";
import { TransactionTable } from "@/components/transactions/transaction-table";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <TransactionTable />
    </div>
  );
}
