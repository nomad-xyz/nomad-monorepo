-- CreateTable
CREATE TABLE "kv_storage" (
    "id" SERIAL NOT NULL,
    "namespace" VARCHAR NOT NULL,
    "key" VARCHAR NOT NULL,
    "value" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kv_storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "hash" VARCHAR(66) NOT NULL,
    "origin" INTEGER NOT NULL,
    "destination" INTEGER NOT NULL,
    "nonce" INTEGER NOT NULL,
    "nomad_sender" VARCHAR(42) NOT NULL,
    "nomad_recipient" VARCHAR(42) NOT NULL,
    "root" VARCHAR(66) NOT NULL,
    "state" INTEGER NOT NULL,
    "block" INTEGER NOT NULL,
    "dispatched_at" BIGINT NOT NULL,
    "updated_at" BIGINT NOT NULL,
    "relayed_at" BIGINT NOT NULL,
    "received_at" BIGINT NOT NULL,
    "processed_at" BIGINT NOT NULL,
    "sender" VARCHAR(42),
    "bridge_msg_type" VARCHAR(20),
    "recipient" VARCHAR(42),
    "bridge_msg_amount" VARCHAR(256),
    "bridge_msg_allow_fast" BOOLEAN,
    "bridge_msg_details_hash" VARCHAR(66),
    "bridge_msg_token_domain" INTEGER,
    "bridge_msg_token_id" VARCHAR(42),
    "raw" VARCHAR NOT NULL,
    "leaf_index" VARCHAR(256) NOT NULL,
    "evm" VARCHAR(66),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kv_storage_id_index" ON "kv_storage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_namespace_key" ON "kv_storage"("namespace", "key");

-- CreateIndex
CREATE UNIQUE INDEX "messages_hash_key" ON "messages"("hash");

-- CreateIndex
CREATE INDEX "messages_id_index" ON "messages"("id");
