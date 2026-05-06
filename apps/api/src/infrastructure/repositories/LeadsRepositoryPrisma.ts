import { LeadsRepository } from "../../domain/ports.js";
import { Lead, UUID } from "../../domain/types.js";
import { prisma } from "../db/prisma.js";

export class LeadsRepositoryPrisma implements LeadsRepository {
  async getHandoffLeads(dealerId: UUID): Promise<Lead[]> {
    const rows = await prisma.lead.findMany({
      where: { dealerId, status: "handoff" },
      orderBy: [{ lastMessageAt: "desc" }],
    });
    return rows as any;
  }

  async getById(dealerId: UUID, id: string): Promise<Lead | null> {
    const row = await prisma.lead.findUnique({ where: { dealerId_id: { dealerId, id } } });
    return (row as any) ?? null;
  }

  async upsert(dealerId: UUID, lead: Partial<Lead> & { id: string }): Promise<void> {
    const modelBrand = (lead as any).model_interest?.brand ?? lead.model_brand ?? null;
    const modelName = (lead as any).model_interest?.model ?? lead.model_name ?? null;

    await prisma.lead.upsert({
      where: { dealerId_id: { dealerId, id: lead.id } },
      create: {
        dealerId,
        id: lead.id,
        customerName: lead.customer_name ?? null as any,
        phone: lead.phone ?? lead.id,
        status: lead.status ?? null as any,
        intent: lead.intent ?? null as any,
        modelBrand: modelBrand as any,
        modelName: modelName as any,
        purchaseType: lead.purchase_type ?? null as any,
        useCase: lead.use_case ?? null as any,
        versionTier: lead.version_tier ?? null as any,
        timing: lead.timing ?? null as any,
        handoffAt: (lead as any).handoff_at ? new Date((lead as any).handoff_at) : null,
        lastMessageAt: (lead as any).last_message_at ? new Date((lead as any).last_message_at) : new Date(),
      },
      update: {
        customerName: lead.customer_name ?? null as any,
        phone: lead.phone ?? lead.id,
        status: lead.status ?? null as any,
        intent: lead.intent ?? null as any,
        modelBrand: modelBrand as any,
        modelName: modelName as any,
        purchaseType: lead.purchase_type ?? null as any,
        useCase: lead.use_case ?? null as any,
        versionTier: lead.version_tier ?? null as any,
        timing: lead.timing ?? null as any,
        handoffAt: (lead as any).handoff_at ? new Date((lead as any).handoff_at) : null,
        lastMessageAt: (lead as any).last_message_at ? new Date((lead as any).last_message_at) : new Date(),
      },
    });
  }
}
