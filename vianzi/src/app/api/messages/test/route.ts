import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { to, text } = await req.json();
    if (!to || !text) return NextResponse.json({ error: "to and text required" }, { status: 400 });

    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) return NextResponse.json({ error: "missing whatsapp creds" }, { status: 500 });

    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      { messaging_product: "whatsapp", to, type: "text", text: { body: text } },
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
