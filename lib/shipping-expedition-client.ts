export type ClientShippingStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "QUOTED"
  | "INVOICE_DRAFT"
  | "INVOICE_APPROVED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

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
  SUBMITTED: "Demande reçue",
  IN_REVIEW: "En cours de traitement",
  QUOTED: "Devis envoyé",
  INVOICE_DRAFT: "Facturation en cours",
  INVOICE_APPROVED: "Facture validée",
  READY_TO_SHIP: "Prête à expédier",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export function clientStatusLabel(status: string | null | undefined): string {
  const key = String(status || "SUBMITTED").toUpperCase();
  return CLIENT_STATUS_LABELS[key] || "En cours";
}

export function formatTransportMode(mode: unknown): string {
  const m = String(mode || "").toUpperCase();
  if (m === "AIR") return "Aérien";
  if (m === "SEA") return "Maritime";
  return "—";
}

function isShippedStatus(status: string | null | undefined): boolean {
  const s = String(status || "").toUpperCase();
  return s === "SHIPPED" || s === "DELIVERED";
}

export function shippedAtClientLabel(status: string | null | undefined): string {
  return isShippedStatus(status) ? "Expédiée le" : "Expédition prévue le";
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
    if (h.status === "SUBMITTED" && Math.abs(new Date(h.at).getTime() - new Date(createdAt).getTime()) < 60000) {
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
    const shipped = isShippedStatus(meta.status);
    entries.push({
      id: `shipped-${meta.shippedAt}`,
      at: shipped ? meta.shippedAt : meta.updatedAt || meta.shippedAt,
      kind: shipped ? "shipped" : "status",
      title: shipped ? "Colis expédié" : "Expédition prévue",
      body: shipped
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

  const current = String(meta.status || "SUBMITTED").toUpperCase();
  const hasCurrent = entries.some((e) => e.kind === "status" && e.title === clientStatusLabel(current));
  if (!hasCurrent && current !== "SUBMITTED") {
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
  if (s === "SHIPPED" || s === "READY_TO_SHIP") return "bg-sky-100 text-sky-900 ring-sky-200";
  if (s === "CANCELLED") return "bg-gray-100 text-gray-700 ring-gray-200";
  if (s === "QUOTED" || s === "INVOICE_APPROVED") return "bg-violet-100 text-violet-900 ring-violet-200";
  return "bg-amber-50 text-amber-950 ring-amber-200";
}
