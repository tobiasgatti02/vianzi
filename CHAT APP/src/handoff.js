import axios from 'axios';

const VENDEDOR_WHATSAPP = '54911XXXXXXXX'; // asesor
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

export async function notifyAdvisor(clientPhone, session) {
  const message =
`🔥 LEAD CALIFICADO

📞 Cliente: ${clientPhone}
🛒 Tipo: ${session.purchaseType === 'cash' ? 'Contado' : 'Financiado'}

💬 Estado: LISTO PARA CIERRE

Tomar contacto ahora.`;

  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: VENDEDOR_WHATSAPP,
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}