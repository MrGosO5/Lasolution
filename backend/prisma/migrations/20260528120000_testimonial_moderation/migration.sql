-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "OrderTestimonial" ADD COLUMN "status" "TestimonialStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "rejectReason" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedBy" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "OrderTestimonial_status_createdAt_idx" ON "OrderTestimonial"("status", "createdAt");
