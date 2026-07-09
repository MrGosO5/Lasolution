export type ShippingStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "QUOTED"
  | "INVOICE_DRAFT"
  | "INVOICE_APPROVED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

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
  zohoSyncStatus?: string | null;
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
};

export const SHIPPING_STATUS_OPTIONS: { value: ShippingStatus; label: string }[] = [
  { value: "SUBMITTED", label: "Soumise" },
  { value: "IN_REVIEW", label: "En examen" },
  { value: "QUOTED", label: "Devis envoyé" },
  { value: "INVOICE_DRAFT", label: "Facture brouillon Zoho" },
  { value: "INVOICE_APPROVED", label: "Facture validée" },
  { value: "READY_TO_SHIP", label: "Prête à expédier" },
  { value: "SHIPPED", label: "Expédiée" },
  { value: "DELIVERED", label: "Livrée" },
  { value: "CANCELLED", label: "Annulée" },
];

export function statusLabel(status: string | null | undefined): string {
  const found = SHIPPING_STATUS_OPTIONS.find((o) => o.value === (status || "SUBMITTED"));
  return found?.label || status || "Soumise";
}

export function formatTransport(mode: unknown): string {
  const m = String(mode || "").toUpperCase();
  if (m === "AIR") return "Aérien";
  if (m === "SEA") return "Maritime";
  return "—";
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
      status: (meta.status as ShippingStatus) || "SUBMITTED",
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
      status: (meta.status as ShippingStatus) || "SUBMITTED",
    },
  };
}
