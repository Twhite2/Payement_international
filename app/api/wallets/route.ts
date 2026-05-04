import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const wallets = await prisma.wallet.findMany({
    where: { ownerId: userId },
    include: { owner: { select: { name: true } } },
  });

  return NextResponse.json(
    wallets.map((w) => ({
      id: w.id,
      ownerId: w.ownerId,
      ownerName: w.owner.name,
      label: w.label,
      currency: w.currency,
      balance: w.balance,
      accountNumber: w.accountNumber,
    }))
  );
}
