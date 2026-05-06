import { LeadsRepositoryPrisma } from "./infrastructure/repositories/LeadsRepositoryPrisma.js";
import { MessagesRepositoryPrisma } from "./infrastructure/repositories/MessagesRepositoryPrisma.js";
import { sendWhatsAppText } from "./infrastructure/whatsapp/whatsappHttpClient.js";
import { UseCases } from "./application/usecases.js";

const leadsRepo = new LeadsRepositoryPrisma();
const messagesRepo = new MessagesRepositoryPrisma();

export const usecases = new UseCases(leadsRepo, messagesRepo, sendWhatsAppText);
