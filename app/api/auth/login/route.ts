import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateAccountNumber(): string {
  return String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000));
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Auto-register on first login (demo convenience)
    const name = email.split("@")[0];
    user = await prisma.user.create({ data: { name, email, password } });

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
      message: `User ${user.name} (${email}) authenticated successfully`,
      source: "auth-service",
    },
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: `mock-jwt-${user.id}-${Date.now()}`,
  });
}
