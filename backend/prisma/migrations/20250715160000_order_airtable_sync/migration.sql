-- Airtable sync fields on Order

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "airtableRecordId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "airtableOrderId" INTEGER;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "airtableLastSyncedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "airtableSyncSource" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "lastAirtableError" TEXT;
