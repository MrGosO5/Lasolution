-- IntegrationLink + enums for Zoho/Airtable sync metadata

CREATE TYPE "IntegrationProvider" AS ENUM ('AIRTABLE', 'ZOHO');
CREATE TYPE "IntegrationEntity" AS ENUM ('SHIPPING_REQUEST', 'ORDER');
CREATE TYPE "IntegrationStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'DRAFT', 'SENT');
CREATE TYPE "IntegrationSyncSource" AS ENUM ('APP', 'AIRTABLE');

CREATE TABLE "IntegrationLink" (
    "id" TEXT NOT NULL,
    "entityType" "IntegrationEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "lastAttemptAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "syncSource" "IntegrationSyncSource" DEFAULT 'APP',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationLink_entityType_entityId_provider_key" ON "IntegrationLink"("entityType", "entityId", "provider");
CREATE INDEX "IntegrationLink_provider_externalId_idx" ON "IntegrationLink"("provider", "externalId");
CREATE INDEX "IntegrationLink_status_lastAttemptAt_idx" ON "IntegrationLink"("status", "lastAttemptAt");
