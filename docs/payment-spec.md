# Paiement — spécification technique

## Principes

- **PCI SAQ A** : checkout hébergé / redirect ; pas de PAN sur les serveurs app.
- **Idempotency-Key** : obligatoire sur création d’intent côté API (header ou body `idempotency_key`).
- **Webhooks** : `POST /webhooks/psp/:provider` avec signature ; déduplication `(provider, event_id)` — table `WebhookEvent`.

## Endpoints backend (stubs)

- `POST /payments/intent` — crée un enregistrement `Payment` + retourne `{ clientSecret, provider, status }` (mock si pas de clés PSP).
- `POST /payments/route` — résolution `PaymentRouter` (pays, devise, méthode).
- `POST /webhooks/psp/:provider` — ingestion asynchrone (réponse 200 rapide ; traitement TODO queue).

## Ledger

- Portefeuille interne : `Wallet` + `LedgerEntry` (append-only).
