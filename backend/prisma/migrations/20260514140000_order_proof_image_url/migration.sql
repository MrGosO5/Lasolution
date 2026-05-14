-- Alignement schéma : preuve photo commande (déjà utilisée par POST /orders).
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "proofImageUrl" TEXT NOT NULL DEFAULT '';
