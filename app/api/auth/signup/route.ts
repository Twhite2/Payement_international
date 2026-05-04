import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateAccountNumber(): string {
  return String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000));
}

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  let user;
  if (existing && existing.password === "") {
    // Account was auto-created (e.g. via session validate) — claim it now
    user = await prisma.user.update({
      where: { id: existing.id },
      data: { name, password },
    });
  } else if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  } else {
    user = await prisma.user.create({ data: { name, email, password } });
  }

  // Provision 3 currency wallets (skip if already exist from auto-creation)
  const existingWallets = await prisma.wallet.count({ where: { ownerId: user.id } });
  if (existingWallets === 0) {
    const walletDefs = [
      { label: "NGN Operating Account", currency: "NGN", balance: 500_000 },
      { label: "USD Correspondent Account", currency: "USD", balance: 1_000 },
      { label: "EUR Settlement Account", currency: "EUR", balance: 800 },
    ];
    for (const w of walletDefs) {
      await prisma.wallet.create({
        data: {
          ownerId: user.id,
          label: w.label,
          currency: w.currency,
          balance: w.balance,
          accountNumber: generateAccountNumber(),
        },
      });
    }
  }

  await prisma.systemLog.create({
    data: {
      level: "info",
      message: `New user registered: ${name} (${email}) — 3 wallets provisioned`,
      source: "auth-service",
    },
  });

  return NextResponse.json({ message: "Account created successfully. You can now sign in." });
}
