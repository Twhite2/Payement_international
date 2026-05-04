"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, XCircle, ShieldCheck, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTransaction } from "@/hooks/use-transactions";
import {
  formatCurrency,
  formatDateTime,
  formatTime,
  statusColor,
  statusDotColor,
} from "@/lib/format";
import type { TransactionStage } from "@/types";

const stageConfig: Record<
  TransactionStage,
  { label: string; icon: React.ElementType; color: string }
> = {
  Initiated: { label: "Initiated", icon: Clock, color: "text-slate-500" },
  Authenticated: { label: "Authenticated", icon: KeyRound, color: "text-blue-600" },
  FraudChecked: { label: "Fraud Checked", icon: ShieldCheck, color: "text-amber-600" },
  Settled: { label: "Settled", icon: CheckCircle2, color: "text-emerald-600" },
  Failed: { label: "Failed", icon: XCircle, color: "text-red-600" },
};

export function TransactionDetail({ id }: { id: string }) {
  const { data: txn, isLoading, isError } = useTransaction(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !txn) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Transaction not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/transactions">Back to Transactions</Link>
        </Button>
      </div>
    );
  }

  const allStages: TransactionStage[] = [
    "Initiated",
    "Authenticated",
    "FraudChecked",
    "Settled",
  ];
  const completedStages = txn.stages.map((s) => s.stage);
  const isFailed = completedStages.includes("Failed");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h2 className="font-mono text-lg font-semibold">{txn.id}</h2>
        <Badge variant={statusColor(txn.status)} className="gap-1.5">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotColor(txn.status)}`}
          />
          {txn.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Payment Lifecycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-0">
              {(isFailed
                ? [...allStages.filter((s) => s !== "Settled"), "Failed" as TransactionStage]
                : allStages
              ).map((stage, idx, arr) => {
                const stageData = txn.stages.find((s) => s.stage === stage);
                const isCompleted = !!stageData;
                const config = stageConfig[stage];
                const Icon = config.icon;
                const isLast = idx === arr.length - 1;

                return (
                  <div key={stage} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          isCompleted
                            ? `${config.color} border-current bg-current/10`
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {!isLast && (
                        <div
                          className={`my-1 h-8 w-0.5 ${
                            isCompleted ? "bg-border" : "bg-border/40"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-6">
                      <p
                        className={`text-sm font-medium ${
                          isCompleted ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {config.label}
                      </p>
                      {stageData && (
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDateTime(stageData.timestamp)}</span>
                          {stageData.latencyMs !== undefined && (
                            <span className="tabular-nums">
                              +{stageData.latencyMs}ms
                            </span>
                          )}
                        </div>
                      )}
                      {!stageData && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Pending
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow
                label="Amount"
                value={formatCurrency(txn.amount, txn.currency)}
              />
              {txn.convertedAmount && txn.convertedCurrency && (
                <DetailRow
                  label="Converted"
                  value={formatCurrency(txn.convertedAmount, txn.convertedCurrency)}
                />
              )}
              {txn.fxRate && (
                <DetailRow label="FX Rate" value={String(txn.fxRate)} />
              )}
              <Separator />
              <DetailRow label="Sender" value={txn.senderWalletId} mono />
              <DetailRow label="Recipient" value={txn.recipientWalletId} mono />
              {txn.recipientAccountNo && (
                <DetailRow label="Account No." value={txn.recipientAccountNo} mono />
              )}
              {txn.recipientName && (
                <DetailRow label="Beneficiary" value={txn.recipientName} />
              )}
              <Separator />
              <DetailRow label="Created" value={formatDateTime(txn.createdAt)} />
              <DetailRow label="Updated" value={formatDateTime(txn.updatedAt)} />
            </CardContent>
          </Card>

          {txn.iso20022Xml && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  ISO 20022 Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 rounded-md border border-border bg-muted/30 p-4">
                  <pre className="font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {txn.iso20022Xml}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
