import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const alerts = await prisma.fraudAlert.findMany({
    orderBy: { timestamp: "desc" },
  });
  return NextResponse.json(
    alerts.map((a: any) => ({
      id: a.id,
      transactionId: a.transactionId,
      severity: a.severity,
      message: a.message,
      timestamp: a.timestamp.toISOString(),
      resolved: a.resolved,
    }))
  );
}
