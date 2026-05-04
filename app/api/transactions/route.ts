import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Get wallet IDs belonging to this user
  const userWallets = await prisma.wallet.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const walletIds = userWallets.map((w: { id: string }) => w.id);

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { senderWalletId: { in: walletIds } },
        { recipientWalletId: { in: walletIds } },
      ],
    },
    include: { stages: { orderBy: { timestamp: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    transactions.map((t: any) => ({
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
    }))
  );
}
