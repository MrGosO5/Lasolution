import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { DashboardHeader } from "../components/DashboardHeader";

type ShippingRequestMeta = {
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
  photoBytes?: number | null;
};

type ShippingRequestEvent = {
  id: string;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  meta: ShippingRequestMeta | null;
};

type ShippingRequestsListResponse = {
  events: ShippingRequestEvent[];
};

function safeString(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

function formatTransport(mode: unknown): string {
  const m = safeString(mode).toUpperCase();
  if (m === "AIR" || m === "AERIEN" || m === "AÉRIEN") return "Aérien";
  if (m === "SEA") return "Maritime";
  return "—";
}

export default async function ExpeditionsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  const limit = Math.max(1, Math.min(parseInt(String(searchParams.limit || "50"), 10) || 50, 200));

  if (role !== "admin") {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:pl-[23px] md:pt-[26px]">
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Accès réservé aux administrateurs.
        </p>
      </div>
    );
  }

  let events: ShippingRequestEvent[] = [];
  let loadError: string | null = null;

  try {
    const res = await lasolutionFetchJson<ShippingRequestsListResponse>(`/admin/shipping-requests?limit=${limit}`);
    events = Array.isArray(res.events) ? res.events : [];
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Impossible de charger les expéditions.";
  }

  return (
    <>
      <DashboardHeader title="Expéditions" subtitle="Demandes d'expédition clients" session={session} />

      <div className="flex-1 overflow-y-auto p-6 md:pl-[23px] md:pt-[26px]">
        <div className="flex flex-col gap-5 max-w-[1150px]">
          {loadError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{loadError}</p>
          ) : null}

          <div className="border border-figma-tableBorder rounded-card overflow-hidden bg-white shadow-card">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Mode</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Destination</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Poids</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Tracking</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Photo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Remarques</th>
                </tr>
              </thead>
              <tbody>
                {events.length ? (
                  events.map((ev) => {
                    const meta = ev.meta || {};
                    const dest = [safeString(meta.destinationCountry), safeString(meta.destinationAddress)].filter(Boolean).join(" · ");
                    const contact = [safeString(meta.recipientName), safeString(meta.recipientPhone)].filter(Boolean).join(" — ");
                    const photoBytes = meta.photoBytes != null ? `${meta.photoBytes} octets` : "—";
                    const notes = safeString(meta.notes).slice(0, 80);

                    return (
                      <tr
                        key={ev.id}
                        className="border-b border-figma-tableRowBorder last:border-0 bg-white hover:bg-figma-tableRowHover transition-colors duration-fast"
                      >
                        <td className="px-4 py-3 text-sm text-figma-headerTitle">
                          {new Date(ev.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-sm text-figma-headerTitle">{formatTransport(meta.transportMode)}</td>
                        <td className="px-4 py-3 text-sm text-figma-headerTitle">{dest || "—"}</td>
                        <td className="px-4 py-3 text-sm text-figma-headerTitle">{contact || "—"}</td>
                        <td className="px-4 py-3 text-sm text-figma-headerTitle">{safeString(meta.weightKg) || "—"}</td>
                        <td className="px-4 py-3 text-sm text-figma-headerTitle">{safeString(meta.trackingNumber) || "—"}</td>
                        <td className="px-4 py-3 text-sm text-figma-headerTitle">{photoBytes}</td>
                        <td className="px-4 py-3 text-sm text-figma-headerTitle">{notes || "—"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-sm text-figma-adminSub" colSpan={8}>
                      Aucune demande trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

