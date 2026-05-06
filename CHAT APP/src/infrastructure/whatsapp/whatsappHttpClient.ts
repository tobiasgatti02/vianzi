import axios from "axios";

const base = (v: string | undefined) => {
  if (!v) throw new Error("Falta WHATSAPP_PHONE_ID");
  return `https://graph.facebook.com/v18.0/${v}`;
};

export async function sendWhatsAppText(to: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token) throw new Error("Falta WHATSAPP_TOKEN");

  const url = `${base(phoneId)}/messages`;
  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}
