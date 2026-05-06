Backend (`apps/api`) — TypeScript, NeonDB, Vercel

Quick start
- Dev: `npm install && npm run dev`
- Build: `npm run build`
- Start (built): `npm start`

Env vars (.env)
- DATABASE_URL: Neon Postgres (sslmode=require)
- WHATSAPP_TOKEN, WHATSAPP_PHONE_ID
- OPENAI_API_KEY
- JWT_SECRET, ADMIN_BOOTSTRAP_SECRET
- CORS_ORIGIN (frontend URL)

Neon
- Create DB: `npx neonctl@latest init`
- Import schema: `psql "$DATABASE_URL" -f src/db/schema.sql`

Vercel (Backend project)
- Root: this folder
- Build Command: `npm run vercel-build`
- Functions: `api/index.ts`
- Set env vars above in Vercel dashboard

Healthcheck
- GET /healthz -> { ok: true }
