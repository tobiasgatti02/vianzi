import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret") || req.nextUrl.searchParams.get("adminSecret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const dealerId = body.dealerId || req.nextUrl.searchParams.get("dealerId");
  if (!dealerId) return NextResponse.json({ error: "dealerId required" }, { status: 400 });

  const slug = body.slug || "demo";
  const name = body.name || "Demo Dealer";
  const phoneId = process.env.WHATSAPP_PHONE_ID || "000000000000000";
  const waToken = process.env.WHATSAPP_TOKEN || "token";
  const verify = process.env.WEBHOOK_VERIFY_TOKEN || "verifytoken";

  await prisma.dealer.upsert({
    where: { id: dealerId },
    update: { slug, name },
    create: {
      id: dealerId,
      slug,
      name,
      whatsappPhoneNumberId: phoneId,
      whatsappToken: waToken,
      webhookVerifyToken: verify,
      active: true
    }
  });

  const leadId = body.leadId || "54911TEST";
  await prisma.lead.upsert({
    where: { dealerId_id: { dealerId, id: leadId } },
    update: { status: "handoff", lastMessageAt: new Date() },
    create: {
      dealerId,
      id: leadId,
      customerName: "Juan Pérez",
      phone: leadId,
      status: "handoff",
      lastMessageAt: new Date()
    } as any
  });

  return NextResponse.json({ ok: true, dealerId, leadId });
}
