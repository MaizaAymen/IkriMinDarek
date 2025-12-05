-- Fix sender_id NOT NULL constraint to allow system messages
-- Run this in PostgreSQL directly

ALTER TABLE "ikri"."messages" ALTER COLUMN "sender_id" DROP NOT NULL;
