// src/config/env.js
import dotenv from "dotenv";
import fs from "node:fs";

if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
dotenv.config(); // carga .env (si existe)