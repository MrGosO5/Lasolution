export type ClientShippingStatus =
  | "AWAITING_RECEPTION"
  | "RECEIVED_AT_WAREHOUSE"
  | "IN_TRANSIT"
  | "AVAILABLE_FOR_PICKUP"
  | "CANCELLED"
  | "DELIVERED"
  | "WRONG_DELIVERY"
  | "DELAYED"
  | "RECEIVED_COTONOU"
  | "RECEIVED_LIBREVILLE"
  | "RECEIVED_LOME";

export type ClientStatusHistoryEntry = {
  status: string;
  at: string;
};

export type ClientShippingCommunication = {
  id: string;
  sentAt: string;
  subject: string;
  message: string;
};

export type ClientExpeditionMeta = {
  transportMode?: string | null;
  trackingNumber?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  destinationCountry?: string | null;
  destinationAddress?: string | null;
  weightKg?: string | null;
  notes?: string | null;
  status?: string | null;
  shippedAt?: string | null;
  updatedAt?: string | null;
  statusHistory?: ClientStatusHistoryEntry[];
  communications?: ClientShippingCommunication[];
};

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  AWAITING_RECEPTION: "En attente de réception",
  RECEIVED_AT_WAREHOUSE: "Reçu à l'entrepôt",
  IN_TRANSIT: "En transit",
  AVAILABLE_FOR_PICKUP: "Disponible pour récupération",
  CANCELLED: "Annulé",
  DELIVERED: "Livré",
  WRONG_DELIVERY: "Livraison erronée",
  DELAYED: "Colis retardé",
  RECEIVED_COTONOU: "Reçu à Cotonou",
  RECEIVED_LIBREVILLE: "Reçu à Libreville",
  RECEIVED_LOME: "Reçu à Lomé",
};

/** Anciens codes — affichage seulement pour l'historique. */
export const LEGACY_CLIENT_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "En attente de réception",
  IN_REVIEW: "En attente de réception",
  QUOTED: "En attente de réception",
  INVOICE_DRAFT: "En attente de réception",
  INVOICE_APPROVED: "En attente de réception",
  READY_TO_SHIP: "Reçu à l'entrepôt",
  SHIPPED: "En transit",
  OUT_FOR_DELIVERY: "En transit",
};

export const DEFAULT_SHIPPING_STATUS: ClientShippingStatus = "AWAITING_RECEPTION";

export function clientStatusLabel(status: string | null | undefined): string {
  const key = String(status || DEFAULT_SHIPPING_STATUS).toUpperCase();
  return CLIENT_STATUS_LABELS[key] || LEGACY_CLIENT_STATUS_LABELS[key] || "En cours";
}

export function formatTransportMode(mode: unknown): string {
  const m = String(mode || "").toUpperCase();
  if (m === "AIR") return "Aérien";
  if (m === "SEA") return "Maritime";
  return "—";
}

function isLogisticsStatus(status: string | null | undefined): boolean {
  const s = String(status || "").toUpperCase();
  return [
    "RECEIVED_AT_WAREHOUSE",
    "IN_TRANSIT",
    "AVAILABLE_FOR_PICKUP",
    "DELIVERED",
    "WRONG_DELIVERY",
    "DELAYED",
    "RECEIVED_COTONOU",
    "RECEIVED_LIBREVILLE",
    "RECEIVED_LOME",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "READY_TO_SHIP",
  ].includes(s);
}

export function shippedAtClientLabel(status: string | null | undefined): string {
  return isLogisticsStatus(status) ? "Expédiée le" : "Expédition prévue le";
}

export type TimelineEntry = {
  id: string;
  at: string;
  kind: "status" | "message" | "shipped" | "created";
  title: string;
  body?: string;
};

export function buildExpeditionTimeline(
  createdAt: string,
  meta: ClientExpeditionMeta,
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  entries.push({
    id: "created",
    at: createdAt,
    kind: "created",
    title: "Demande enregistrée",
    body: "Votre demande d'expédition a bien été transmise à notre équipe.",
  });

  const history = Array.isArray(meta.statusHistory) ? meta.statusHistory : [];
  for (const h of history) {
    if (!h?.at || !h?.status) continue;
    const st = String(h.status).toUpperCase();
    if (
      (st === "AWAITING_RECEPTION" || st === "SUBMITTED") &&
      Math.abs(new Date(h.at).getTime() - new Date(createdAt).getTime()) < 60000
    ) {
      continue;
    }
    entries.push({
      id: `status-${h.at}-${h.status}`,
      at: h.at,
      kind: "status",
      title: clientStatusLabel(h.status),
    });
  }

  if (meta.shippedAt) {
    const inLogistics = isLogisticsStatus(meta.status);
    entries.push({
      id: `shipped-${meta.shippedAt}`,
      at: inLogistics ? meta.shippedAt : meta.updatedAt || meta.shippedAt,
      kind: inLogistics ? "shipped" : "status",
      title: inLogistics ? clientStatusLabel(meta.status) || "Colis en cours" : "Expédition prévue",
      body: inLogistics
        ? meta.trackingNumber
          ? `Numéro de suivi : ${meta.trackingNumber}`
          : undefined
        : `Date prévue : ${new Date(meta.shippedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}`,
    });
  }

  const comms = Array.isArray(meta.communications) ? meta.communications : [];
  for (const c of comms) {
    if (!c?.sentAt) continue;
    entries.push({
      id: c.id || `comm-${c.sentAt}`,
      at: c.sentAt,
      kind: "message",
      title: c.subject || "Message de l'équipe",
      body: c.message,
    });
  }

  const current = String(meta.status || DEFAULT_SHIPPING_STATUS).toUpperCase();
  const hasCurrent = entries.some((e) => e.kind === "status" && e.title === clientStatusLabel(current));
  if (!hasCurrent && current !== "AWAITING_RECEPTION" && current !== "SUBMITTED") {
    entries.push({
      id: `status-current-${meta.updatedAt || createdAt}`,
      at: meta.updatedAt || createdAt,
      kind: "status",
      title: clientStatusLabel(current),
    });
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function statusTone(status: string | null | undefined): string {
  const s = String(status || "").toUpperCase();
  if (s === "DELIVERED") return "bg-emerald-100 text-emerald-900 ring-emerald-200";
  if (s === "WRONG_DELIVERY") return "bg-red-100 text-red-900 ring-red-200";
  if (s === "DELAYED") return "bg-orange-100 text-orange-900 ring-orange-200";
  if (s === "AVAILABLE_FOR_PICKUP") return "bg-violet-100 text-violet-900 ring-violet-200";
  if (
    s === "IN_TRANSIT" ||
    s === "RECEIVED_COTONOU" ||
    s === "RECEIVED_LIBREVILLE" ||
    s === "RECEIVED_LOME" ||
    s === "SHIPPED" ||
    s === "OUT_FOR_DELIVERY"
  ) {
    return "bg-sky-100 text-sky-900 ring-sky-200";
  }
  if (s === "RECEIVED_AT_WAREHOUSE" || s === "READY_TO_SHIP") {
    return "bg-teal-100 text-teal-900 ring-teal-200";
  }
  if (s === "CANCELLED") return "bg-gray-100 text-gray-700 ring-gray-200";
  return "bg-amber-50 text-amber-950 ring-amber-200";
}
