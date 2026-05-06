export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Vianzi (Next.js)</h1>
      <p>API unificada con Next Route Handlers y Prisma + Neon.</p>
      <ul>
        <li>GET /api/healthz</li>
        <li>GET /api/leads (header x-dealer-id)</li>
        <li>POST /api/leads/seed (header x-admin-secret)</li>
        <li>POST /api/messages/test</li>
      </ul>
    </main>
  );
}
