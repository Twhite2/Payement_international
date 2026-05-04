import { NextRequest, NextResponse } from "next/server";
import { FX_RATES } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const rate = FX_RATES.find((r) => r.from === from && r.to === to);
  if (!rate) {
    return NextResponse.json(null);
  }
  return NextResponse.json(rate);
}
