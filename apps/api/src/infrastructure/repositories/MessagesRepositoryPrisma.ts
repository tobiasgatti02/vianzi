import { MessagesRepository } from "../../domain/ports.js";
import { Message, UUID } from "../../domain/types.js";
import { prisma } from "../db/prisma.js";

export class MessagesRepositoryPrisma implements MessagesRepository {
  async addMessage(message: Message): Promise<void> {
    // Ensure lead exists (to satisfy FK) and update lastMessageAt
    await prisma.lead.upsert({
      where: { dealerId_id: { dealerId: message.dealer_id, id: message.lead_id } },
      create: {
        dealerId: message.dealer_id,
        id: message.lead_id,
        phone: message.lead_id,
        status: "handoff",
        lastMessageAt: new Date(),
      } as any,
      update: { lastMessageAt: new Date() },
    });

    await prisma.message.create({
      data: {
        dealerId: message.dealer_id,
        leadId: message.lead_id,
        sender: message.sender,
        type: message.type,
        content: message.content ?? null,
        mediaUrl: message.media_url ?? null,
        createdAt: message.created_at ? new Date(message.created_at) : new Date(),
        messageId: message.message_id ?? null,
      },
    });
  }

  async getByLead(dealerId: UUID, leadId: string): Promise<Message[]> {
    const rows = await prisma.message.findMany({
      where: { dealerId, leadId },
      orderBy: { createdAt: "asc" },
      select: { sender: true, type: true, content: true, mediaUrl: true, createdAt: true, messageId: true },
    });
    // Map back to legacy field names expected by UI
    return rows.map((r: any) => ({
      sender: r.sender,
      type: r.type,
      content: r.content,
      media_url: r.mediaUrl,
      created_at: r.createdAt,
      message_id: r.messageId,
      dealer_id: dealerId,
      lead_id: leadId,
    })) as any;
  }
}
