import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateAccountNumber(): string {
  return String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000));
}

export async function POST(req: NextRequest) {
  const { user } = await req.json();

  if (!user?.id || !user?.email) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  // Check if user exists by id or email
  let existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (!existing) {
    existing = await prisma.user.findUnique({ where: { email: user.email } });
  }

  if (existing) {
    return NextResponse.json({
      valid: true,
      user: { id: existing.id, name: existing.name, email: existing.email, role: existing.role },
    });
  }

  // Re-register the user so their wallets are provisioned
  const name = user.name || user.email.split("@")[0];
  const restored = await prisma.user.create({
    data: { name, email: user.email, password: "" },
  });

  const walletDefs = [
    { label: "NGN Operating Account", currency: "NGN", balance: 500_000 },
    { label: "USD Correspondent Account", currency: "USD", balance: 1_000 },
    { label: "EUR Settlement Account", currency: "EUR", balance: 800 },
  ];
  for (const w of walletDefs) {
    await prisma.wallet.create({
      data: {
        ownerId: restored.id,
        label: w.label,
        currency: w.currency,
        balance: w.balance,
        accountNumber: generateAccountNumber(),
      },
    });
  }

  return NextResponse.json({
    valid: true,
    user: { id: restored.id, name: restored.name, email: restored.email, role: restored.role },
  });
}
