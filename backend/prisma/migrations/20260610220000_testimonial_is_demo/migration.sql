ALTER TABLE "OrderTestimonial"
ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

UPDATE "OrderTestimonial"
SET "isDemo" = true
WHERE id LIKE 'testimonial-demo-%';

CREATE INDEX "OrderTestimonial_status_isDemo_idx"
ON "OrderTestimonial" ("status", "isDemo");
