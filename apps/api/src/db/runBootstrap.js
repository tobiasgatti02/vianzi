import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar env desde la raíz de apps/api
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ✅ Import dinámico DESPUÉS de cargar env
const { initDb } = await import("./initDb.js");
await initDb(); // 👈 ESTO CREA LAS TABLAS (dealers, users, leads, messages)

const { bootstrap } = await import("./bootstrap.js");

const payload = {
  secret: process.env.ADMIN_BOOTSTRAP_SECRET,
  dealer: {
    slug: "concesionario-demo",
    name: "Concesionario Demo",
    whatsapp_phone_number_id: "PONER_PHONE_NUMBER_ID",
    whatsapp_token: "PONER_TOKEN",
    webhook_verify_token: "verify-demo",
    openai_api_key: null
  },
  user: {
    email: "admin@demo.com",
    password: "Cambiar123!",
    role: "admin"
  }
};

bootstrap(payload)
  .then((r) => {
    console.log("✅ Bootstrap OK:", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Bootstrap error:", e.message);
    process.exit(1);
  });