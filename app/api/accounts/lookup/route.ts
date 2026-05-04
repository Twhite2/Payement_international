import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");
  if (!account) {
    return NextResponse.json({ found: false, accountNumber: "" });
  }

  const wallet = await prisma.wallet.findUnique({
    where: { accountNumber: account },
    include: { owner: { select: { name: true } } },
  });

  if (!wallet) {
    return NextResponse.json({ found: false, accountNumber: account });
  }

  return NextResponse.json({
    found: true,
    accountNumber: account,
    ownerName: wallet.owner.name,
    walletId: wallet.id,
    currency: wallet.currency,
  });
}
