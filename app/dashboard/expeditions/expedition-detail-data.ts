import {
  CLIENT_STATUS_LABELS,
  DEFAULT_SHIPPING_STATUS,
  LEGACY_CLIENT_STATUS_LABELS,
  type ClientShippingStatus,
} from "@/lib/shipping-expedition-client";

export { DEFAULT_SHIPPING_STATUS };
export type ShippingStatus = ClientShippingStatus;

export type ShippingCommunication = {
  id: string;
  sentAt: string;
  channel: string;
  subject: string;
  message: string;
  to: string;
  ok: boolean;
};

export type ExpeditionMeta = {
  transportMode?: string | null;
  trackingNumber?: string | null;
  senderName?: string | null;
  senderPhone?: string | null;
  pickupAddress?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  destinationCountry?: string | null;
  destinationAddress?: string | null;
  weightKg?: string | null;
  notes?: string | null;
  adminNotes?: string | null;
  photoBytes?: number | null;
  photoPath?: string | null;
  status?: ShippingStatus | string | null;
  shippedAt?: string | null;
  zohoDraftId?: string | null;
  zohoInvoiceId?: string | null;
  invoiceStatus?: string | null;
  invoiceAmountEur?: number | null;
  zohoSyncStatus?: string | null;
  lastSyncError?: string | null;
  airtableRecordId?: string | null;
  airtableOrderId?: number | null;
  airtableLastSyncedAt?: string | null;
  syncSource?: string | null;
  lastAirtableError?: string | null;
  inboundTrackingNumber?: string | null;
  labelTrackingNumber?: string | null;
  labelUrl?: string | null;
  labelQrPayload?: string | null;
  labelCarrier?: string | null;
  communications?: ShippingCommunication[];
  updatedAt?: string | null;
};

export type ExpeditionDetailData = {
  id: string;
  email: string | null;
  clientEmail: string | null;
  clientName: string | null;
  createdAt: string;
  meta: ExpeditionMeta;
  integrations?: IntegrationLinkView[];
};

export type IntegrationLinkView = {
  provider?: string;
  status?: string | null;
  externalId?: string | null;
  lastSyncedAt?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  lastAttemptAt?: string | null;
  retryCount?: number | null;
  meta?: Record<string, unknown> | null;
};

export const SHIPPING_STATUS_OPTIONS: { value: ShippingStatus; label: string }[] = [
  { value: "AWAITING_RECEPTION", label: "En attente de réception" },
  { value: "RECEIVED_AT_WAREHOUSE", label: "Reçu à l'entrepôt" },
  { value: "IN_TRANSIT", label: "En transit" },
  { value: "AVAILABLE_FOR_PICKUP", label: "Disponible pour récupération" },
  { value: "CANCELLED", label: "Annulé" },
  { value: "DELIVERED", label: "Livré" },
  { value: "WRONG_DELIVERY", label: "Livraison erronée" },
  { value: "DELAYED", label: "Colis retardé" },
  { value: "RECEIVED_COTONOU", label: "Reçu à Cotonou" },
  { value: "RECEIVED_LIBREVILLE", label: "Reçu à Libreville" },
  { value: "RECEIVED_LOME", label: "Reçu à Lomé" },
];

export function statusLabel(status: string | null | undefined): string {
  const key = String(status || DEFAULT_SHIPPING_STATUS).toUpperCase();
  return (
    CLIENT_STATUS_LABELS[key] ||
    LEGACY_CLIENT_STATUS_LABELS[key] ||
    status ||
    CLIENT_STATUS_LABELS[DEFAULT_SHIPPING_STATUS]
  );
}

/** Options du select admin : inclut un statut historique s'il n'est plus dans la liste officielle. */
export function statusSelectOptions(currentStatus?: string | null) {
  const cur = String(currentStatus || "").toUpperCase();
  if (cur && !SHIPPING_STATUS_OPTIONS.some((o) => o.value === cur)) {
    return [{ value: cur as ShippingStatus, label: `${statusLabel(cur)} (ancien)` }, ...SHIPPING_STATUS_OPTIONS];
  }
  return SHIPPING_STATUS_OPTIONS;
}

export function formatTransport(mode: unknown): string {
  const m = String(mode || "").toUpperCase();
  if (m === "AIR") return "Aérien";
  if (m === "SEA") return "Maritime";
  return "—";
}

function coerceInvoiceAmount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapListEventToDetail(ev: {
  id: string;
  email: string | null;
  createdAt: string;
  meta: ExpeditionMeta | null;
}): ExpeditionDetailData {
  const meta = ev.meta || {};
  return {
    id: ev.id,
    email: ev.email,
    clientEmail: ev.email,
    clientName: null,
    createdAt: ev.createdAt,
    meta: {
      ...meta,
      status: (meta.status as ShippingStatus) || DEFAULT_SHIPPING_STATUS,
      invoiceAmountEur: coerceInvoiceAmount(meta.invoiceAmountEur),
    },
  };
}

export function mapApiToExpeditionDetail(raw: {
  event: {
    id: string;
    email: string | null;
    createdAt: string;
    meta: ExpeditionMeta | null;
    client?: { email?: string; name?: string | null };
  };
  clientEmail?: string | null;
  integrations?: IntegrationLinkView[];
}): ExpeditionDetailData {
  const ev = raw.event;
  const meta = ev.meta || {};
  return {
    id: ev.id,
    email: ev.email,
    clientEmail: raw.clientEmail || ev.client?.email || ev.email,
    clientName: ev.client?.name || null,
    createdAt: ev.createdAt,
    meta: {
      ...meta,
      status: (meta.status as ShippingStatus) || DEFAULT_SHIPPING_STATUS,
      invoiceAmountEur: coerceInvoiceAmount(meta.invoiceAmountEur),
    },
    integrations: Array.isArray(raw.integrations) ? raw.integrations : [],
  };
}
