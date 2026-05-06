import { Lead, Message, UUID } from "./types.js";

export interface LeadsRepository {
  getHandoffLeads(dealerId: UUID): Promise<Lead[]>;
  getById(dealerId: UUID, id: string): Promise<Lead | null>;
  upsert(dealerId: UUID, lead: Partial<Lead> & { id: string }): Promise<void>;
}

export interface MessagesRepository {
  addMessage(message: Message): Promise<void>;
  getByLead(dealerId: UUID, leadId: string): Promise<Message[]>;
}
