import { LeadsRepository, MessagesRepository } from "../domain/ports.js";
import { Lead, Message, UUID } from "../domain/types.js";

export class UseCases {
  constructor(
    private leads: LeadsRepository,
    private messages: MessagesRepository,
    private waSendText: (to: string, text: string) => Promise<void>
  ) {}

  getHandoffLeads(dealerId: UUID) {
    return this.leads.getHandoffLeads(dealerId);
  }

  getLeadById(dealerId: UUID, id: string) {
    return this.leads.getById(dealerId, id);
  }

  async sendTextAndStore(dealerId: UUID, leadId: string, text: string) {
    await this.waSendText(leadId, text);
    const m: Message = {
      dealer_id: dealerId,
      lead_id: leadId,
      sender: "human",
      type: "text",
      content: text,
      created_at: new Date(),
    };
    await this.messages.addMessage(m);
  }

  getMessagesByLead(dealerId: UUID, leadId: string) {
    return this.messages.getByLead(dealerId, leadId);
  }
}
