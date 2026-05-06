type Session = {
  phone: string;
  stage: string;
  customerName: string | null;
  selectedModel: any;
  purchaseType: string | null;
  handoff: boolean;
  createdAt: Date;
  lastMessageAt: Date;
  handoffNotified: boolean;
  mode: "bot" | "human";
};

const sessions = new Map<string, Session>();

export function getSession(phone: string): Session {
  if (!sessions.has(phone)) {
    const session: Session = {
      phone,
      stage: "START",
      customerName: null,
      selectedModel: null,
      purchaseType: null,
      handoff: false,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      handoffNotified: false,
      mode: "bot",
    } as any;
    sessions.set(phone, session);
    return session;
  }
  return sessions.get(phone)!;
}

export function updateSession(phone: string, session: Session): void {
  if (!session) return;
  session.lastMessageAt = new Date();
  sessions.set(phone, session);
}
