import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const logs = await prisma.systemLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
  });
  return NextResponse.json(
    logs.map((l: any) => ({
      id: l.id,
      level: l.level,
      message: l.message,
      source: l.source,
      timestamp: l.timestamp.toISOString(),
    }))
  );
}
