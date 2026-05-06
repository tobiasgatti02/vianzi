import axios from "axios";

export async function sendAudio(to: string, mediaId: string): Promise<void> {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneId || !token) throw new Error("Faltan credenciales WhatsApp");

  await axios.post(
    `https://graph.facebook.com/v18.0/${phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "audio",
      audio: { id: mediaId },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}
