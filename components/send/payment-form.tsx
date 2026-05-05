"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendPayment, fetchFxRate, lookupAccount } from "@/lib/api";
import type { AccountLookupResult } from "@/lib/api";
import { useWallets } from "@/hooks/use-wallets";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Currency, FxRate, SendPaymentPayload } from "@/types";

export function PaymentForm() {
  const { data: wallets } = useWallets();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [senderWalletId, setSenderWalletId] = useState("");
  const [recipientAccountNo, setRecipientAccountNo] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientLookup, setRecipientLookup] = useState<AccountLookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [fxPreview, setFxPreview] = useState<FxRate | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const senderWallet = wallets?.find((w) => w.id === senderWalletId);

  // Auto-lookup recipient when account number reaches 10+ digits
  useEffect(() => {
    if (recipientAccountNo.length < 10) {
      setRecipientLookup(null);
      setRecipientName("");
      return;
    }
    const timeout = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const result = await lookupAccount(recipientAccountNo);
        setRecipientLookup(result);
        if (result.found && result.ownerName) {
          setRecipientName(result.ownerName);
        }
      } catch {
        setRecipientLookup(null);
      } finally {
        setLookupLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [recipientAccountNo]);

  // FX preview based on sender wallet and recipient's resolved currency
  const recipientCurrency = recipientLookup?.found ? recipientLookup.currency : undefined;

  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (
      !senderWallet ||
      !recipientCurrency ||
      !numAmount ||
      senderWallet.currency === recipientCurrency
    ) {
      setFxPreview(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setFxLoading(true);
      try {
        const rate = await fetchFxRate(senderWallet.currency, recipientCurrency);
        setFxPreview(rate);
      } catch {
        setFxPreview(null);
      } finally {
        setFxLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [amount, senderWallet, recipientCurrency]);

  const mutation = useMutation({
    mutationFn: (payload: SendPaymentPayload) => sendPayment(payload),
    onSuccess: (txn) => {
      toast.success("Payment initiated — tracking lifecycle");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setConfirmOpen(false);
      setSenderWalletId("");
      setRecipientAccountNo("");
      setRecipientName("");
      setRecipientLookup(null);
      setAmount("");
      router.push(`/transactions/${txn.id}`);
    },
    onError: () => {
      toast.error("Failed to send payment. Please try again.");
      setConfirmOpen(false);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!senderWalletId || !recipientAccountNo || !numAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (recipientAccountNo.length < 10) {
      toast.error("Please enter a valid account number (min. 10 digits)");
      return;
    }

    if (!recipientLookup?.found) {
      toast.error("Recipient account not found on the platform");
      return;
    }

    if (senderWallet && numAmount > senderWallet.balance) {
      toast.error("Insufficient balance");
      return;
    }

    setConfirmOpen(true);
  }

  function handleConfirm() {
    mutation.mutate({
      senderWalletId,
      recipientWalletId: recipientLookup?.walletId || "",
      recipientAccountNo,
      recipientName: recipientName || undefined,
      amount: parseFloat(amount),
      currency: senderWallet!.currency,
    });
  }

  const numAmount = parseFloat(amount) || 0;
  const convertedAmount = fxPreview ? numAmount * fxPreview.rate : null;

  return (
    <>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Initiate Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sender">Sender Wallet</Label>
              <Select value={senderWalletId} onValueChange={setSenderWalletId}>
                <SelectTrigger id="sender">
                  <SelectValue placeholder="Select your wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.label} ({w.currency}) — Acct: {w.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {senderWallet && (
                <p className="text-xs text-muted-foreground">
                  Balance: {formatCurrency(senderWallet.balance, senderWallet.currency)}
                </p>
              )}
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recipient-account">Recipient Account Number</Label>
                <Input
                  id="recipient-account"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 0123456789"
                  value={recipientAccountNo}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setRecipientAccountNo(val);
                  }}
                  maxLength={20}
                  required
                />
                {lookupLoading && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Looking up account...
                  </p>
                )}
                {recipientAccountNo.length > 0 && recipientAccountNo.length < 10 && (
                  <p className="text-xs text-destructive">
                    Account number must be at least 10 digits
                  </p>
                )}
                {recipientLookup && !recipientLookup.found && recipientAccountNo.length >= 10 && !lookupLoading && (
                  <p className="text-xs text-destructive">
                    Account not found on the platform
                  </p>
                )}
                {recipientLookup?.found && !lookupLoading && (
                  <p className="text-xs text-emerald-600 font-medium">
                    Verified: {recipientLookup.ownerName} ({recipientLookup.currency})
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient-name">Recipient Name</Label>
                <Input
                  id="recipient-name"
                  type="text"
                  placeholder="Auto-filled from account lookup"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  readOnly={!!recipientLookup?.found}
                  className={recipientLookup?.found ? "bg-muted" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount{senderWallet ? ` (${senderWallet.currency})` : ""}</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {(fxPreview || fxLoading) && numAmount > 0 && (
              <>
                <Separator />
                <div className="rounded-md border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    FX Conversion Preview
                    {fxLoading && (
                      <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {fxPreview && !fxLoading && recipientCurrency && (
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="tabular-nums font-medium">
                        {formatCurrency(numAmount, senderWallet!.currency)}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="tabular-nums font-medium">
                        {formatCurrency(convertedAmount!, recipientCurrency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (Rate: {fxPreview.rate})
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Processing..." : "Review Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Please review the payment details before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
              <span className="font-medium">{senderWallet?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span className="font-medium">{recipientName || "Recipient"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account No.</span>
              <span className="font-mono text-sm font-medium">{recipientAccountNo}</span>
            </div>
            {recipientName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium">{recipientName}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold tabular-nums">
                {numAmount > 0 && senderWallet
                  ? formatCurrency(numAmount, senderWallet.currency)
                  : "-"}
              </span>
            </div>
            {fxPreview && convertedAmount && recipientCurrency && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Converted</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(convertedAmount, recipientCurrency)}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={mutation.isPending}>
              {mutation.isPending ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
