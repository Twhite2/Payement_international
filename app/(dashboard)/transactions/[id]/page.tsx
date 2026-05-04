"use client";

import React, { use } from "react";
import { TransactionDetail } from "@/components/transactions/transaction-detail";

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <TransactionDetail id={id} />;
}
