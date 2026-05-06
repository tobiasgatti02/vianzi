import { createServer } from "./server.js";

const PORT = Number(process.env.PORT || 3001);

const main = async () => {
  const app = await createServer();
  app.listen(PORT, () => {
    console.log(`🚀 Server listo en puerto ${PORT}`);
  });
};

main().catch((err) => {
  console.error("Fallo al iniciar:", err);
  process.exit(1);
});
