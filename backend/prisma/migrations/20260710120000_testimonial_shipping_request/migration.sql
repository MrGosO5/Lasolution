-- Avis liés aux demandes d'expédition standalone (SecurityEvent shipping_request)
ALTER TABLE "OrderTestimonial" ALTER COLUMN "orderId" DROP NOT NULL;

ALTER TABLE "OrderTestimonial" ADD COLUMN "shippingRequestId" TEXT;

CREATE UNIQUE INDEX "OrderTestimonial_shippingRequestId_key" ON "OrderTestimonial"("shippingRequestId");

CREATE INDEX "OrderTestimonial_shippingRequestId_idx" ON "OrderTestimonial"("shippingRequestId");
