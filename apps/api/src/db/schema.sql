create extension if not exists pgcrypto;

create table if not exists dealers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  whatsapp_phone_number_id text not null,
  whatsapp_token text not null,
  webhook_verify_token text not null,
  openai_api_key text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references dealers(id) on delete cascade,
  email text unique not null,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists leads (
  dealer_id uuid not null references dealers(id) on delete cascade,
  id text not null,
  customer_name text,
  phone text,
  status text,
  intent text,
  model_brand text,
  model_name text,
  purchase_type text,
  use_case text,
  version_tier text,
  timing text,
  handoff_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (dealer_id, id)
);

create index if not exists idx_leads_dealer_status on leads(dealer_id, status);
create index if not exists idx_leads_dealer_lastmsg on leads(dealer_id, last_message_at);

create table if not exists messages (
  id bigserial primary key,
  dealer_id uuid not null references dealers(id) on delete cascade,
  lead_id text not null,
  sender text not null,
  type text not null,
  content text,
  media_url text,
  created_at timestamptz not null default now(),
  message_id text,
  unique (dealer_id, message_id),
  foreign key (dealer_id, lead_id) references leads(dealer_id, id) on delete cascade
);

create index if not exists idx_messages_dealer_lead_created on messages(dealer_id, lead_id, created_at);