import pg from "pg";
const { Pool } = pg;

const cs = process.env.DATABASE_URL;
if (!cs) {
  throw new Error("DATABASE_URL no está definida (revisar .env/.env.local y el directorio desde el que ejecutás).");
}

export const pool = new Pool({ connectionString: cs });

export async function query(sql, params = []) {
  return pool.query(sql, params);
}
