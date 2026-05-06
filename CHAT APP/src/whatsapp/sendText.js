import axios from "axios";

export async function sendText(creds, to, body) {
  const { token, phoneNumberId } = creds;

  await axios.post(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );
}
