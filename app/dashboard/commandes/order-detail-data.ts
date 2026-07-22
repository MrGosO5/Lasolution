export type OrderStatus = "en_attente" | "annule" | "en_cours" | "livre";

export type OrderDetailData = {
  id: string;
  statut: OrderStatus;
  /** Statut brut en base (ex. PAID). */
  rawApiStatus: string;
  dateCommande: string;
  plateforme: string;
  montantTotal: string;
  poidsEstime: string;
  parcels: {
    id: string;
    status: string;
    weightKg: string;
    receivedAt: string;
    shippedAt: string;
    createdAt: string;
    trackingEvents: { id: string; status: string; message: string; at: string }[];
  }[];
  entrepotNom: string;
  entrepotAdresse: string;
  entrepotPays: string;
  entrepotTelephone: string;
  clientNom: string;
  clientEmail: string;
  clientTelephone: string;
  clientAdresse: string;
  solupackerNom: string;
  solupackerMissions: string;
  solupackerVoyage: string;
  solupackerDateVoyage: string;
  pointRelaisNom: string;
  pointRelaisCTerminee: string;
  pointRelaisCEnCours: string;
  pointRelaisAdresse: string;
  orderLines: { description: string; quantity: number; lineTotal: string }[];
  proofImageUrl: string;
  airtableRecordId?: string | null;
  airtableOrderId?: number | null;
  airtableLastSyncedAt?: string | null;
  lastAirtableError?: string | null;
  invoice?: {
    status?: string;
    zohoDraftId?: string | null;
    zohoInvoiceId?: string | null;
    zohoSyncStatus?: string | null;
    lastSyncError?: string | null;
    lines?: { label?: string; amount?: unknown }[];
  } | null;
  integrations?: {
    provider?: string;
    status?: string | null;
    externalId?: string | null;
    lastSyncedAt?: string | null;
    lastErrorCode?: string | null;
    lastErrorMessage?: string | null;
  }[];
  appTrackingNumber?: string | null;
};

function apiStatusToUI(s: string): OrderStatus {
  const x = String(s || "").toUpperCase();
  if (x === "AWAITING_PAYMENT") return "en_attente";
  if (x === "CANCELLED") return "annule";
  if (x === "DELIVERED") return "livre";
  return "en_cours";
}

function readProf(profile: unknown, key: string): string {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return "";
  const v = (profile as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

function clientAddressFromProfile(profile: unknown): string {
  const parts = [readProf(profile, "district"), readProf(profile, "city"), readProf(profile, "country")].filter(
    Boolean
  );
  return parts.length ? parts.join(", ") : "—";
}

/** Valeurs `status` attendues par `PATCH /orders/:id` (admin). */
export function dashboardUiStatusToApi(ui: OrderStatus): string {
  const m: Record<OrderStatus, string> = {
    en_attente: "AWAITING_PAYMENT",
    annule: "CANCELLED",
    en_cours: "PAID",
    livre: "DELIVERED",
  };
  return m[ui];
}

export function mapApiOrderToDetailData(order: Record<string, unknown>): OrderDetailData {
  const lines =
    (order.lines as Array<{ description: string; quantity: number; unitPrice: unknown; currency: string }>) || [];
  const currency = String(order.currency || "EUR");
  let sum = 0;
  const orderLines = lines.map((l) => {
    const qty = Math.max(1, l.quantity || 1);
    const unit = Number(l.unitPrice);
    const lineSum = unit * qty;
    sum += lineSum;
    const cur = l.currency || currency;
    return {
      description: l.description || "Article",
      quantity: qty,
      lineTotal: `${lineSum.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`,
    };
  });
  const montantTotal = `${sum.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

  const parcelsRaw =
    (order.parcels as Array<{
      id?: string;
      status?: string;
      weightKg?: unknown;
      receivedAt?: unknown;
      shippedAt?: unknown;
      createdAt?: string;
      trackingEvents?: Array<{ id?: string; status?: string; message?: string | null; createdAt?: string }>;
    }>) || [];

  const parcels = parcelsRaw
    .map((p) => {
      const events =
        (p.trackingEvents || [])
          .map((e) => ({
            id: String(e.id || ""),
            status: String(e.status || ""),
            message: String(e.message || ""),
            at: String(e.createdAt || ""),
          }))
          .filter((e) => e.id && e.status) || [];

      return {
        id: String(p.id || ""),
        status: String(p.status || ""),
        weightKg: p.weightKg != null ? String(p.weightKg) : "",
        receivedAt: p.receivedAt != null ? String(p.receivedAt) : "",
        shippedAt: p.shippedAt != null ? String(p.shippedAt) : "",
        createdAt: String(p.createdAt || ""),
        trackingEvents: events,
      };
    })
    .filter((p) => p.id);

  const weights = parcels.map((p) => p.weightKg).filter((w) => w != null && String(w) !== "");
  const poidsEstime =
    weights.length > 0
      ? `${weights.map((w) => Number(w).toLocaleString("fr-FR")).join(" · ")} kg`
      : "—";

  const user = order.user as { email?: string; name?: string | null; profile?: unknown } | undefined;
  const profile = user?.profile;
  const phone = readProf(profile, "phone");
  const fn = readProf(profile, "firstName");
  const ln = readProf(profile, "lastName");
  const fromProf = `${fn} ${ln}`.trim();
  const clientNom = (user?.name && user.name.trim()) || fromProf || user?.email || "—";

  const wh = order.defaultWarehouse as
    | {
        label?: string;
        line1?: string;
        line2?: string | null;
        postal?: string;
        city?: string;
        country?: string;
      }
    | undefined;

  const typeRaw = String(order.type || "");
  const plateformeBase =
    typeRaw === "CONCIERGE_PURCHASE" ? "Achat assisté" : typeRaw === "DIRECT_TO_WAREHOUSE" ? "Envoi entrepôt" : typeRaw || "—";
  const dm = String(order.deliveryMode || "").toUpperCase();
  const modeLiv = dm === "AIR" ? "Aérien" : dm === "SEA" ? "Maritime" : "";
  const plateforme = modeLiv ? `${plateformeBase} · ${modeLiv}` : plateformeBase;

  const created = new Date(String(order.createdAt));
  const dateCommande = Number.isNaN(created.getTime()) ? "—" : created.toLocaleString("fr-FR");

  const proofImageUrl = String(order.proofImageUrl || "");

  const invoices = (order.invoices as Array<Record<string, unknown>>) || [];
  const inv0 = invoices[0];
  const invoice = inv0
    ? {
        status: String(inv0.status || ""),
        zohoDraftId: (inv0.zohoDraftId as string) || null,
        zohoInvoiceId: (inv0.zohoInvoiceId as string) || null,
        zohoSyncStatus: (inv0.zohoSyncStatus as string) || null,
        lastSyncError: (inv0.lastSyncError as string) || null,
        lines: (inv0.lines as Array<{ label?: string; amount?: unknown }>) || [],
      }
    : null;

  return {
    id: String(order.id),
    statut: apiStatusToUI(String(order.status)),
    rawApiStatus: String(order.status || "—"),
    dateCommande,
    plateforme,
    montantTotal,
    poidsEstime,
    parcels,
    entrepotNom: wh?.label ?? "—",
    entrepotAdresse: wh ? [wh.line1, wh.line2, wh.postal, wh.city].filter(Boolean).join(", ") : "—",
    entrepotPays: wh?.country ?? "—",
    entrepotTelephone: "—",
    clientNom,
    clientEmail: user?.email ?? "—",
    clientTelephone: phone || "—",
    clientAdresse: clientAddressFromProfile(profile),
    solupackerNom: "—",
    solupackerMissions: "—",
    solupackerVoyage: "—",
    solupackerDateVoyage: "—",
    pointRelaisNom: "—",
    pointRelaisCTerminee: "—",
    pointRelaisCEnCours: "—",
    pointRelaisAdresse: "—",
    orderLines,
    proofImageUrl,
    airtableRecordId: (order.airtableRecordId as string) || null,
    airtableOrderId: order.airtableOrderId != null ? Number(order.airtableOrderId) : null,
    airtableLastSyncedAt: order.airtableLastSyncedAt != null ? String(order.airtableLastSyncedAt) : null,
    lastAirtableError: (order.lastAirtableError as string) || null,
    invoice,
    integrations: Array.isArray(order.integrations)
      ? (order.integrations as OrderDetailData["integrations"])
      : [],
    appTrackingNumber: (order.appTrackingNumber as string) || null,
  };
}
