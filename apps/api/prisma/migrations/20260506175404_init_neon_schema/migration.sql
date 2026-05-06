-- CreateTable
CREATE TABLE "dealers" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp_phone_number_id" TEXT NOT NULL,
    "whatsapp_token" TEXT NOT NULL,
    "webhook_verify_token" TEXT NOT NULL,
    "openai_api_key" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "dealer_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "dealer_id" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "customer_name" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "intent" TEXT,
    "model_brand" TEXT,
    "model_name" TEXT,
    "purchase_type" TEXT,
    "use_case" TEXT,
    "version_tier" TEXT,
    "timing" TEXT,
    "handoff_at" TIMESTAMP(3),
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("dealer_id","id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" BIGSERIAL NOT NULL,
    "dealer_id" UUID NOT NULL,
    "lead_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "media_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message_id" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dealers_slug_key" ON "dealers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_leads_dealer_status" ON "leads"("dealer_id", "status");

-- CreateIndex
CREATE INDEX "idx_leads_dealer_lastmsg" ON "leads"("dealer_id", "last_message_at");

-- CreateIndex
CREATE INDEX "idx_messages_dealer_lead_created" ON "messages"("dealer_id", "lead_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_dealer_id_message_id_key" ON "messages"("dealer_id", "message_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_dealer_id_lead_id_fkey" FOREIGN KEY ("dealer_id", "lead_id") REFERENCES "leads"("dealer_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
