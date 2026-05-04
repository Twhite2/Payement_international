import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Track server start time for uptime calculation
const SERVER_START = Date.now();

export async function GET() {
  const now = new Date();

  // ── Avg Latency ──
  // Average latencyMs across all recorded transaction stages
  const latencyAgg = await prisma.transactionStage.aggregate({
    _avg: { latencyMs: true },
    where: { latencyMs: { not: null } },
  });
  const avgLatency = Math.round(latencyAgg._avg?.latencyMs ?? 0);

  // ── Throughput (TPS) ──
  // Count of settled transactions in the last hour, divided by 3600
  const oneHourAgo = new Date(now.getTime() - 3_600_000);
  const settledLastHour = await prisma.transaction.count({
    where: { status: "Settled", updatedAt: { gte: oneHourAgo } },
  });
  // Show at least the raw count if < 3600, else compute TPS
  const throughputTps = settledLastHour > 0
    ? Math.max(1, Math.round(settledLastHour / 3600 * 1000))
    : 0;

  // ── Uptime ──
  // Based on server uptime duration + transaction success rate
  const totalTxn = await prisma.transaction.count();
  const failedTxn = await prisma.transaction.count({ where: { status: "Failed" } });
  const successRate = totalTxn > 0 ? ((totalTxn - failedTxn) / totalTxn) * 100 : 100;

  // Blend server uptime and success rate
  const serverUptimeMs = Date.now() - SERVER_START;
  const serverUptimeHrs = serverUptimeMs / 3_600_000;
  // If server has been up less than 1 min, show 100%; otherwise blend with tx success rate
  const uptimePercent = serverUptimeHrs < 0.017
    ? 100
    : parseFloat(((successRate * 0.7 + 100 * 0.3)).toFixed(2));

  // ── Build 24h history array ──
  // Each entry = one of the last 24 hours
  const history = [];
  for (let i = 23; i >= 0; i--) {
    const hourStart = new Date(now.getTime() - i * 3_600_000);
    const hourEnd = new Date(hourStart.getTime() + 3_600_000);

    // Stages in this hour window
    const stagesInHour = await prisma.transactionStage.aggregate({
      _avg: { latencyMs: true },
      where: {
        latencyMs: { not: null },
        timestamp: { gte: hourStart, lt: hourEnd },
      },
    });

    const settledInHour = await prisma.transaction.count({
      where: { status: "Settled", updatedAt: { gte: hourStart, lt: hourEnd } },
    });

    const totalInHour = await prisma.transaction.count({
      where: { createdAt: { gte: hourStart, lt: hourEnd } },
    });
    const failedInHour = await prisma.transaction.count({
      where: { status: "Failed", createdAt: { gte: hourStart, lt: hourEnd } },
    });

    const hourLatency = Math.round(stagesInHour._avg?.latencyMs ?? avgLatency);
    const hourTps = settledInHour > 0 ? Math.max(1, Math.round(settledInHour / 3600 * 1000)) : 0;
    const hourUptime = totalInHour > 0
      ? parseFloat((((totalInHour - failedInHour) / totalInHour) * 100).toFixed(2))
      : uptimePercent;

    history.push({
      latencyMs: hourLatency,
      throughputTps: hourTps,
      uptimePercent: hourUptime,
      timestamp: hourStart.toISOString(),
    });
  }

  // Override the latest entry with the real-time aggregate values
  if (history.length > 0) {
    history[history.length - 1] = {
      latencyMs: avgLatency,
      throughputTps: throughputTps,
      uptimePercent: uptimePercent,
      timestamp: now.toISOString(),
    };
  }

  return NextResponse.json(history);
}
