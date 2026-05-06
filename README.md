# Chatbot Para Naboletis Monorepo

Monorepo con:

- `apps/web`: frontend en Next.js (App Router).
- `apps/api`: backend Node/Express + Prisma.

## Desarrollo local

1. Instalar dependencias desde la raiz:

```bash
npm install
```

2. Configurar variables de entorno:

- Backend: copiar `apps/api/.env.example` a `apps/api/.env`
- Frontend: copiar `apps/web/.env.example` a `apps/web/.env.local`

3. Ejecutar ambos servicios:

```bash
npm run dev
```

## Scripts utiles

- `npm run dev:web` - Next.js en `http://localhost:3000`
- `npm run dev:api` - API en `http://localhost:3001`
- `npm run build` - build de backend + frontend
