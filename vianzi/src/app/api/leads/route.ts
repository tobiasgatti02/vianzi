import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const dealerId = req.headers.get("x-dealer-id") || req.nextUrl.searchParams.get("dealerId");
  if (!dealerId) return NextResponse.json({ error: "missing dealerId" }, { status: 400 });

  const rows = await prisma.lead.findMany({
    where: { dealerId, status: "handoff" },
    orderBy: [{ lastMessageAt: "desc" }]
  });
  return NextResponse.json(rows);
}
