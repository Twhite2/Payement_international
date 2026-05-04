"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatDateTime, statusColor, statusDotColor } from "@/lib/format";

export function RecentTransactions() {
  const { data: transactions, isLoading } = useTransactions();
  const router = useRouter();
  const recent = transactions?.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          Recent Transactions
        </CardTitle>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent?.map((txn) => (
                <TableRow
                  key={txn.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/transactions/${txn.id}`)}
                >
                  <TableCell className="font-mono text-sm">
                    {txn.id}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(txn.amount, txn.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(txn.status)} className="gap-1.5">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotColor(txn.status)}`}
                      />
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDateTime(txn.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
