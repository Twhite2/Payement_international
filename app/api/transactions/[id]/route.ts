import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const t = await prisma.transaction.findUnique({
    where: { id },
    include: { stages: { orderBy: { timestamp: "asc" } } },
  });

  if (!t) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: t.id,
    senderWalletId: t.senderWalletId,
    recipientWalletId: t.recipientWalletId,
    recipientAccountNo: t.recipientAccountNo,
    recipientName: t.recipientName,
    amount: t.amount,
    currency: t.currency,
    convertedAmount: t.convertedAmount,
    convertedCurrency: t.convertedCurrency,
    fxRate: t.fxRate,
    status: t.status,
    stages: t.stages.map((s: any) => ({
      stage: s.stage,
      timestamp: s.timestamp.toISOString(),
      latencyMs: s.latencyMs,
    })),
    iso20022Xml: t.iso20022Xml,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  });
}
