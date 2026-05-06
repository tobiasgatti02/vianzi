export type UUID = string;

export interface Lead {
  dealer_id: UUID;
  id: string;
  customer_name?: string | null;
  phone?: string | null;
  status?: string | null;
  intent?: string | null;
  model_brand?: string | null;
  model_name?: string | null;
  purchase_type?: string | null;
  use_case?: string | null;
  version_tier?: string | null;
  timing?: string | null;
  handoff_at?: Date | null;
  last_message_at?: Date | null;
  outcome_status?: string | null;
  notes?: string | null;
  next_contact_at?: Date | null;
  last_human_action_at?: Date | null;
}

export interface Message {
  dealer_id: UUID;
  lead_id: string;
  sender: "user" | "bot" | "human";
  type: "text" | "audio";
  content?: string | null;
  media_url?: string | null;
  created_at?: Date;
  message_id?: string | null;
}
