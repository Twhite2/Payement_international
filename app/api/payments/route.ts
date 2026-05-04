import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FX_RATES } from "@/lib/mock-data";

// ---------------------------------------------------------------
// ISO 20022 XML generation
// ---------------------------------------------------------------
function generateIso20022Xml(
  txnId: string,
  createdAt: string,
  amount: number,
  currency: string,
  convertedAmount: number | null,
  convertedCurrency: string | null,
  fxRate: number | null,
  senderName: string,
  senderAcct: string,
  recipientName: string,
  recipientAcct: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${txnId}</MsgId>
      <CreDtTm>${createdAt}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf><SttlmMtd>INDA</SttlmMtd></SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId><EndToEndId>${txnId}</EndToEndId></PmtId>
      <IntrBkSttlmAmt Ccy="${convertedCurrency || currency}">${(convertedAmount || amount).toFixed(2)}</IntrBkSttlmAmt>
      <InstdAmt Ccy="${currency}">${amount.toFixed(2)}</InstdAmt>${fxRate ? `\n      <XchgRate>${fxRate}</XchgRate>` : ""}
      <Dbtr>
        <Nm>${senderName}</Nm>
        <AcctId>${senderAcct}</AcctId>
      </Dbtr>
      <Cdtr>
        <Nm>${recipientName}</Nm>
        <AcctId>${recipientAcct}</AcctId>
      </Cdtr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}

// ---------------------------------------------------------------
// Async payment lifecycle — runs in background via setTimeout
// ---------------------------------------------------------------
function processPaymentLifecycle(
  txnId: string,
  amount: number,
  currency: string,
  convertedAmount: number | null,
  convertedCurrency: string | null,
  fxRate: number | null,
  senderWalletId: string,
  recipientWalletId: string,
  recipientName: string,
  recipientAcct: string
) {
  const DELAYS = { auth: 2000, fraud: 3000, settle: 2000 };

  // Stage 1: Authenticated
  setTimeout(async () => {
    await prisma.transactionStage.create({
      data: { transactionId: txnId, stage: "Authenticated", latencyMs: DELAYS.auth },
    });
    await prisma.transaction.update({
      where: { id: txnId },
      data: { status: "Processing" },
    });

    // Stage 2: Fraud Check
    setTimeout(async () => {
      const isFraudulent = currency === "NGN" && amount > 50_000_000;

      if (isFraudulent) {
        await prisma.transactionStage.create({
          data: { transactionId: txnId, stage: "Failed", latencyMs: DELAYS.fraud },
        });
        await prisma.transaction.update({
          where: { id: txnId },
          data: { status: "Failed" },
        });
        await prisma.fraudAlert.create({
          data: {
            transactionId: txnId,
            severity: "high",
            message: `Transaction ${txnId} blocked: amount exceeds fraud threshold`,
          },
        });
        await prisma.systemLog.create({
          data: {
            level: "error",
            message: `Transaction ${txnId} failed fraud check: ${amount} ${currency}`,
            source: "fraud-service",
          },
        });
        return;
      }

      await prisma.transactionStage.create({
        data: { transactionId: txnId, stage: "FraudChecked", latencyMs: DELAYS.fraud },
      });
      await prisma.systemLog.create({
        data: {
          level: "info",
          message: `Transaction ${txnId} passed fraud check`,
          source: "fraud-service",
        },
      });

      // Stage 3: Settlement
      setTimeout(async () => {
        // Debit sender, credit recipient
        await prisma.wallet.update({
          where: { id: senderWalletId },
          data: { balance: { decrement: amount } },
        });
        await prisma.wallet.update({
          where: { id: recipientWalletId },
          data: { balance: { increment: convertedAmount || amount } },
        });

        // Resolve names for XML
        const sW = await prisma.wallet.findUnique({
          where: { id: senderWalletId },
          include: { owner: { select: { name: true } } },
        });
        const rW = await prisma.wallet.findUnique({
          where: { id: recipientWalletId },
          include: { owner: { select: { name: true } } },
        });

        const xml = generateIso20022Xml(
          txnId,
          new Date().toISOString(),
          amount,
          currency,
          convertedAmount,
          convertedCurrency,
          fxRate,
          sW?.owner?.name || "Sender",
          sW?.accountNumber || "N/A",
          recipientName || rW?.owner?.name || "Recipient",
          recipientAcct || rW?.accountNumber || "N/A"
        );

        await prisma.transactionStage.create({
          data: { transactionId: txnId, stage: "Settled", latencyMs: DELAYS.settle },
        });
        await prisma.transaction.update({
          where: { id: txnId },
          data: { status: "Settled", iso20022Xml: xml },
        });

        await prisma.systemLog.create({
          data: {
            level: "info",
            message: `Transaction ${txnId} settled: ${amount} ${currency} -> ${(convertedAmount || amount).toFixed(2)} ${convertedCurrency || currency} | ${sW?.owner?.name} -> ${recipientName || rW?.owner?.name}`,
            source: "settlement-service",
          },
        });
        await prisma.systemLog.create({
          data: {
            level: "info",
            message: `ISO 20022 pacs.008 message generated for ${txnId}`,
            source: "messaging-service",
          },
        });
      }, DELAYS.settle);
    }, DELAYS.fraud);
  }, DELAYS.auth);
}

// ---------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------
export async function POST(req: NextRequest) {
  const payload = await req.json();

  const senderW = await prisma.wallet.findUnique({
    where: { id: payload.senderWalletId },
    include: { owner: { select: { name: true } } },
  });
  if (!senderW) {
    return NextResponse.json({ error: "Sender wallet not found" }, { status: 400 });
  }
  if (payload.amount > senderW.balance) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  // Resolve recipient wallet by account number
  const recipientW = await prisma.wallet.findUnique({
    where: { accountNumber: payload.recipientAccountNo },
    include: { owner: { select: { name: true } } },
  });
  if (!recipientW) {
    return NextResponse.json({ error: "Recipient account not found" }, { status: 400 });
  }

  const recipientName = recipientW.owner.name || payload.recipientName || "";

  // FX rate
  let convertedAmount: number | null = null;
  let convertedCurrency: string | null = null;
  let fxRate: number | null = null;

  if (senderW.currency !== recipientW.currency) {
    const rate = FX_RATES.find(
      (r) => r.from === senderW.currency && r.to === recipientW.currency
    );
    if (rate) {
      fxRate = rate.rate;
      convertedAmount = payload.amount * rate.rate;
      convertedCurrency = recipientW.currency;
    }
  }

  // Generate sequential ID
  const count = await prisma.transaction.count();
  const txnId = `TXN-2025-${String(count + 1).padStart(5, "0")}`;

  const txn = await prisma.transaction.create({
    data: {
      id: txnId,
      senderWalletId: senderW.id,
      recipientWalletId: recipientW.id,
      recipientAccountNo: payload.recipientAccountNo,
      recipientName,
      amount: payload.amount,
      currency: senderW.currency,
      convertedAmount,
      convertedCurrency,
      fxRate,
      status: "Pending",
    },
  });

  await prisma.transactionStage.create({
    data: { transactionId: txnId, stage: "Initiated" },
  });

  await prisma.systemLog.create({
    data: {
      level: "info",
      message: `Payment ${txnId} initiated: ${payload.amount} ${senderW.currency} from ${senderW.owner.name} (${senderW.accountNumber}) to ${recipientName} (${payload.recipientAccountNo})`,
      source: "payment-service",
    },
  });

  // Kick off async lifecycle
  processPaymentLifecycle(
    txnId,
    payload.amount,
    senderW.currency,
    convertedAmount,
    convertedCurrency,
    fxRate,
    senderW.id,
    recipientW.id,
    recipientName,
    payload.recipientAccountNo
  );

  return NextResponse.json({
    id: txn.id,
    senderWalletId: txn.senderWalletId,
    recipientWalletId: txn.recipientWalletId,
    recipientAccountNo: txn.recipientAccountNo,
    recipientName: txn.recipientName,
    amount: txn.amount,
    currency: txn.currency,
    convertedAmount: txn.convertedAmount,
    convertedCurrency: txn.convertedCurrency,
    fxRate: txn.fxRate,
    status: txn.status,
    stages: [{ stage: "Initiated", timestamp: txn.createdAt.toISOString() }],
    createdAt: txn.createdAt.toISOString(),
    updatedAt: txn.updatedAt.toISOString(),
  });
}
