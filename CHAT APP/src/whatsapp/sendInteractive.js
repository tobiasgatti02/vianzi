import axios from "axios";

export async function sendInteractive(creds, to, interactive) {
  const { token, phoneNumberId } = creds;

  await axios.post(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );
}
