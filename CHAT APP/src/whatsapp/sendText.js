// src/whatsapp/sendText.js
import axios from 'axios';
console.log("TOKEN CHECK:", {
  exists: Boolean(process.env.WHATSAPP_TOKEN),
  starts: process.env.WHATSAPP_TOKEN ? process.env.WHATSAPP_TOKEN.slice(0, 6) : null,
  length: process.env.WHATSAPP_TOKEN ? process.env.WHATSAPP_TOKEN.length : 0
});
export async function sendText(to, text) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

  try {
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to,
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err) {
    throw err;
  }
}